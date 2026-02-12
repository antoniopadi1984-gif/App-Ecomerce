"use server";

import { prisma } from "@/lib/prisma";
import { uploadToDrive } from "@/lib/google-drive";
import { optimizeImageToWebP, createResponsiveVariants } from "@/lib/media/image-optimizer";

/**
 * IMAGE MANAGEMENT ACTIONS
 * Upload and optimize images to Drive with WebP conversion
 */

interface ImageUploadResult {
    success: boolean;
    driveFileId?: string;
    originalSize?: number;
    optimizedSize?: number;
    savings?: string;
    error?: string;
}

/**
 * Upload and optimize image to Drive
 */
export async function uploadAndOptimizeImageAction(
    productId: string,
    imageBuffer: Buffer,
    fileName: string,
    targetType: 'landing' | 'advertorial' | 'listicle' | 'product' | 'competitors',
    quality: number = 85
): Promise<ImageUploadResult> {
    try {
        const originalSize = imageBuffer.length;

        // 1. Optimize to WebP
        console.log(`🖼️ Optimizing image: ${fileName}`);
        const optimized = await optimizeImageToWebP(imageBuffer, quality);

        if (!optimized.success) {
            throw new Error(optimized.error || 'Optimization failed');
        }

        // 2. Upload to Drive
        const webpFileName = fileName.replace(/\.(jpg|jpeg|png|gif)$/i, '.webp');
        const targetFolder = `images-${targetType}` as any;

        console.log(`📤 Uploading to Drive: ${targetFolder}`);
        const driveFileId = await uploadToDrive(
            productId,
            optimized.optimizedBuffer!,
            webpFileName,
            'image/webp',
            targetFolder
        );

        // 3. Save to product images array
        await updateProductImages(productId, driveFileId, targetType);

        const savings = ((originalSize - optimized.optimizedSize!) / originalSize * 100).toFixed(1);

        return {
            success: true,
            driveFileId,
            originalSize,
            optimizedSize: optimized.optimizedSize,
            savings: `${savings}%`
        };

    } catch (error: any) {
        console.error('[uploadAndOptimizeImageAction] Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Update product images array in DB
 */
async function updateProductImages(
    productId: string,
    driveFileId: string,
    type: 'landing' | 'advertorial' | 'listicle' | 'product' | 'competitors'
) {
    const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { productImages: true, competitorImages: true }
    });

    if (!product) return;

    const driveUrl = `https://drive.google.com/uc?id=${driveFileId}`;

    if (type === 'competitors') {
        // Update competitorImages
        const existing = product.competitorImages ? JSON.parse(product.competitorImages) : [];
        existing.push(driveUrl);

        await prisma.product.update({
            where: { id: productId },
            data: { competitorImages: JSON.stringify(existing) }
        });
    } else {
        // Update productImages
        const existing = product.productImages ? JSON.parse(product.productImages) : [];
        existing.push({ type, url: driveUrl, driveFileId });

        await prisma.product.update({
            where: { id: productId },
            data: { productImages: JSON.stringify(existing) }
        });
    }
}

/**
 * Upload responsive image variants
 */
export async function uploadResponsiveImageAction(
    productId: string,
    imageBuffer: Buffer,
    fileName: string,
    targetType: 'landing' | 'advertorial' | 'listicle' | 'product' | 'competitors'
): Promise<{ success: boolean; variants: number; error?: string }> {
    try {
        // Generate variants: 320px, 640px, 1024px, 1920px
        const variants = await createResponsiveVariants(imageBuffer);

        const uploadedVariants = [];

        for (const variant of variants) {
            const variantName = fileName.replace(/\.(jpg|jpeg|png|gif)$/i, `_${variant.width}w.webp`);
            const targetFolder = `images-${targetType}` as any;

            const driveFileId = await uploadToDrive(
                productId,
                variant.buffer,
                variantName,
                'image/webp',
                targetFolder
            );

            uploadedVariants.push({ width: variant.width, driveFileId });
        }

        // Save all variants to product
        await prisma.product.update({
            where: { id: productId },
            data: {
                productImages: JSON.stringify({
                    type: targetType,
                    responsive: true,
                    variants: uploadedVariants.map(v => ({
                        width: v.width,
                        url: `https://drive.google.com/uc?id=${v.driveFileId}`
                    }))
                })
            }
        });

        return {
            success: true,
            variants: uploadedVariants.length
        };

    } catch (error: any) {
        console.error('[uploadResponsiveImageAction] Error:', error);
        return { success: false, variants: 0, error: error.message };
    }
}

/**
 * Update product info (landings, Amazon links, etc.)
 */
export async function updateProductInfoAction(productId: string, data: {
    landingUrls?: string[];
    amazonLinks?: string[];
    unitCost?: number;
    shippingCost?: number;
}) {
    try {
        const updateData: any = {};

        if (data.landingUrls) {
            updateData.landingUrls = JSON.stringify(data.landingUrls);
        }

        if (data.amazonLinks) {
            updateData.amazonLinks = JSON.stringify(data.amazonLinks);
        }

        if (data.unitCost !== undefined) {
            updateData.unitCost = data.unitCost;
        }

        if (data.shippingCost !== undefined) {
            updateData.shippingCost = data.shippingCost;
        }

        await prisma.product.update({
            where: { id: productId },
            data: updateData
        });

        return { success: true };

    } catch (error: any) {
        console.error('[updateProductInfoAction] Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get product info with arrays parsed
 */
export async function getProductInfoAction(productId: string) {
    try {
        const product = await prisma.product.findUnique({
            where: { id: productId },
            select: {
                landingUrl: true,
                landingUrls: true,
                amazonLinks: true,
                productImages: true,
                competitorImages: true,
                unitCost: true,
                shippingCost: true,
                price: true,
                driveFolderId: true
            }
        });

        if (!product) {
            return { success: false, error: 'Product not found' };
        }

        return {
            success: true,
            data: {
                landingUrl: product.landingUrl,
                landingUrls: product.landingUrls ? JSON.parse(product.landingUrls) : [],
                amazonLinks: product.amazonLinks ? JSON.parse(product.amazonLinks) : [],
                productImages: product.productImages ? JSON.parse(product.productImages) : [],
                competitorImages: product.competitorImages ? JSON.parse(product.competitorImages) : [],
                unitCost: product.unitCost,
                shippingCost: product.shippingCost,
                price: product.price,
                hasDriveStructure: !!product.driveFolderId
            }
        };

    } catch (error: any) {
        console.error('[getProductInfoAction] Error:', error);
        return { success: false, error: error.message };
    }
}
