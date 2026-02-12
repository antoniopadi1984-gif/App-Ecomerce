"use server";

import { prisma } from "@/lib/prisma";
import {
    calculateBreakeven,
    evaluateOffer,
    getPricingRecommendations,
    generateAlertThresholds,
    checkAlerts,
    type ProductEconomics,
    type BreakevenMetrics,
    type PricingOffer,
    type AlertThresholds
} from "@/lib/economics/unit-economics";

export type { BreakevenMetrics };

/**
 * UNIT ECONOMICS ACTIONS
 * Calculate breakeven, ROAS, CPC and manage pricing
 */

/**
 * Calculate and save product economics
 */
export async function calculateProductEconomicsAction(productId: string) {
    try {
        const product = await prisma.product.findUnique({
            where: { id: productId },
            select: {
                unitCost: true,
                shippingCost: true,
                handlingCost: true,
                returnCost: true,
                price: true,
                desiredPrice: true,
                vatPercent: true,
                compareAtPrice: true
            }
        });

        if (!product) {
            return { success: false, error: 'Product not found' };
        }

        const economics: ProductEconomics = {
            unitCost: product.unitCost || 0,
            shippingCost: product.shippingCost || 0,
            handlingCost: product.handlingCost || 0,
            returnCost: product.returnCost || 0,
            currentPrice: product.price || 0,
            desiredPrice: product.desiredPrice || undefined,
            compareAtPrice: product.compareAtPrice || undefined,
            vatPercent: product.vatPercent || 21
        };

        // Calculate breakeven metrics
        const breakeven = calculateBreakeven(economics);

        // Generate alert thresholds
        const thresholds = generateAlertThresholds(breakeven);

        // Get pricing recommendations
        const targetMargin = 40; // Can be customized
        const recommendations = getPricingRecommendations(economics, targetMargin);

        // Save to database
        await prisma.product.update({
            where: { id: productId },
            data: {
                breakevenROAS: breakeven.breakevenROAS,
                breakevenCPC: breakeven.breakevenCPC
            }
        });

        return {
            success: true,
            breakeven,
            thresholds,
            recommendations
        };

    } catch (error: any) {
        console.error('[calculateProductEconomicsAction] Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Create and evaluate pricing offer
 */
export async function createPricingOfferAction(
    productId: string,
    offer: {
        name: string;
        items: Array<{ quantity: number; unitPrice: number }>;
    }
) {
    try {
        const product = await prisma.product.findUnique({
            where: { id: productId },
            select: {
                unitCost: true,
                shippingCost: true,
                handlingCost: true,
                vatPercent: true,
                pricingOffers: true
            }
        });

        if (!product) {
            return { success: false, error: 'Product not found' };
        }

        // Prepare offer for evaluation
        const offerToEvaluate = {
            name: offer.name,
            items: offer.items.map(item => ({
                unitCost: product.unitCost || 0,
                quantity: item.quantity,
                unitPrice: item.unitPrice
            })),
            shippingCost: product.shippingCost || 0,
            handlingCost: product.handlingCost || 0
        };

        const evaluatedOffer = evaluateOffer(offerToEvaluate, product.vatPercent || 21);

        // Save to product
        const existingOffers = product.pricingOffers ? JSON.parse(product.pricingOffers) : [];
        existingOffers.push(evaluatedOffer);

        await prisma.product.update({
            where: { id: productId },
            data: {
                pricingOffers: JSON.stringify(existingOffers)
            }
        });

        return {
            success: true,
            offer: evaluatedOffer
        };

    } catch (error: any) {
        console.error('[createPricingOfferAction] Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Update product pricing
 */
export async function updateProductPricingAction(
    productId: string,
    data: {
        currentPrice?: number;
        desiredPrice?: number;
        compareAtPrice?: number;
        targetMargin?: number;
    }
) {
    try {
        const updateData: any = {};

        if (data.currentPrice !== undefined) {
            updateData.price = data.currentPrice;
        }

        if (data.desiredPrice !== undefined) {
            updateData.desiredPrice = data.desiredPrice;
        }

        if (data.compareAtPrice !== undefined) {
            updateData.compareAtPrice = data.compareAtPrice;
        }

        if (data.targetMargin !== undefined) {
            updateData.targetMargin = data.targetMargin;
        }

        await prisma.product.update({
            where: { id: productId },
            data: updateData
        });

        // Recalculate economics with new pricing
        await calculateProductEconomicsAction(productId);

        return { success: true };

    } catch (error: any) {
        console.error('[updateProductPricingAction] Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Check product alerts based on actual metrics
 */
export async function checkProductAlertsAction(
    productId: string,
    actualMetrics: {
        roas?: number;
        cpc?: number;
        conversionRate?: number;
    }
) {
    try {
        const product = await prisma.product.findUnique({
            where: { id: productId },
            select: {
                breakevenROAS: true,
                breakevenCPC: true,
                price: true,
                unitCost: true,
                shippingCost: true,
                handlingCost: true,
                returnCost: true,
                vatPercent: true
            }
        });

        if (!product) {
            return { success: false, error: 'Product not found' };
        }

        // If breakeven not calculated, calculate it
        if (!product.breakevenROAS || !product.breakevenCPC) {
            await calculateProductEconomicsAction(productId);
        }

        // Get economic data
        const economics: ProductEconomics = {
            unitCost: product.unitCost || 0,
            shippingCost: product.shippingCost || 0,
            handlingCost: product.handlingCost || 0,
            returnCost: product.returnCost || 0,
            currentPrice: product.price || 0,
            vatPercent: product.vatPercent || 21
        };

        const breakeven = calculateBreakeven(economics);
        const thresholds = generateAlertThresholds(breakeven);

        // Add margin to actual metrics
        const actualMetricsWithMargin = {
            ...actualMetrics,
            marginPercent: breakeven.grossMarginPercent
        };

        const alertStatus = checkAlerts(actualMetricsWithMargin, thresholds);

        return {
            success: true,
            ...alertStatus,
            thresholds
        };

    } catch (error: any) {
        console.error('[checkProductAlertsAction] Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get complete product economics dashboard
 */
export async function getProductEconomicsDashboardAction(productId: string) {
    try {
        const product = await prisma.product.findUnique({
            where: { id: productId },
            select: {
                title: true,
                price: true,
                desiredPrice: true,
                compareAtPrice: true,
                unitCost: true,
                shippingCost: true,
                handlingCost: true,
                returnCost: true,
                vatPercent: true,
                targetMargin: true,
                breakevenROAS: true,
                breakevenCPC: true,
                pricingOffers: true
            }
        });

        if (!product) {
            return { success: false, error: 'Product not found' };
        }

        const economics: ProductEconomics = {
            unitCost: product.unitCost || 0,
            shippingCost: product.shippingCost || 0,
            handlingCost: product.handlingCost || 0,
            returnCost: product.returnCost || 0,
            currentPrice: product.price || 0,
            desiredPrice: product.desiredPrice || undefined,
            compareAtPrice: product.compareAtPrice || undefined,
            vatPercent: product.vatPercent || 21
        };

        const breakeven = calculateBreakeven(economics);
        const thresholds = generateAlertThresholds(breakeven);
        const recommendations = getPricingRecommendations(
            economics,
            product.targetMargin || 40
        );

        const offers = product.pricingOffers ? JSON.parse(product.pricingOffers) : [];

        return {
            success: true,
            product: {
                title: product.title,
                currentPrice: product.price,
                desiredPrice: product.desiredPrice,
                compareAtPrice: product.compareAtPrice
            },
            breakeven,
            thresholds,
            recommendations,
            offers
        };

    } catch (error: any) {
        console.error('[getProductEconomicsDashboardAction] Error:', error);
        return { success: false, error: error.message };
    }
}
