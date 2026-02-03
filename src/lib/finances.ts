
import prisma from "./prisma";

interface ProfitBreakdown {
    revenue: number;
    cogs: number;
    shipping: number;
    taxes: number;
    netProfit: number;
    status: 'ESTIMATED' | 'REAL';
}

/**
 * Calculates the exact profit for an order based on:
 * 1. Product unitCost (COGS)
 * 2. FulfillmentRule (Shipping/COD fees)
 * 3. TaxRate
 */
export async function calculateOrderProfit(orderId: string): Promise<ProfitBreakdown> {
    const db = prisma as any;
    const order = await db.order.findUnique({
        where: { id: orderId },
        include: { items: { include: { product: { include: { finance: true } } } } }
    });

    if (!order) throw new Error("Order not found");

    const rule = await db.fulfillmentRule.findFirst({
        where: { provider: order.logisticsProvider || 'DEFAULT', isActive: true }
    });

    let cogs = 0;
    let sellingPriceTotal = 0;

    for (const item of order.items) {
        // Use cost from product finance or fallback to item unitCost
        const unitCost = item.product?.finance?.unitCost || item.unitCost || 0;
        cogs += unitCost * item.quantity;
        sellingPriceTotal += item.price * item.quantity;
    }

    const isBeeping = rule?.provider?.toUpperCase().includes('BEEPING') || order.logisticsProvider?.toUpperCase().includes('BEEPING') || false;

    const shippingBase = rule?.baseShippingCost || 0;
    // User requested explicit sum: "3.8 + 1.5" logic if defaults match, but we use rule values.
    // However, if Beeping, we add 21% VAT on top of the sum.

    const codFee = order.paymentMethod === 'COD' ? (rule?.codFeeFixed || 0) + (sellingPriceTotal * (rule?.codFeePercent || 0) / 100) : 0;
    const packaging = rule?.packagingCost || 0;

    let totalLogistics = shippingBase + codFee + packaging;

    if (isBeeping) {
        totalLogistics = totalLogistics * 1.21; // Add 21% VAT for Beeping
    }

    const taxes = sellingPriceTotal * (rule?.taxPercent || 0) / 100;

    const netProfit = sellingPriceTotal - cogs - totalLogistics - taxes;

    // Truth Layer: Only REAL if delivered. If returned, revenue is 0, costs remain.
    const isReal = order.status === 'DELIVERED';
    const isReturned = order.status === 'RETURNED';

    if (isReturned) {
        return {
            revenue: 0,
            cogs: cogs, // We still paid for the product (usually)
            shipping: totalLogistics + (rule?.returnCost || 0),
            taxes: 0,
            netProfit: -(cogs + totalLogistics + (rule?.returnCost || 0)),
            status: 'REAL'
        };
    }

    return {
        revenue: sellingPriceTotal,
        cogs,
        shipping: totalLogistics,
        taxes,
        netProfit,
        status: isReal ? 'REAL' : 'ESTIMATED'
    };
}
