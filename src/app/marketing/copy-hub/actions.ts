"use server";

import prisma from "@/lib/prisma";
import { generateMasterCopy, ContentContext } from "@/lib/copy-hub-protocol";
import { revalidatePath } from "next/cache";

/**
 * Server action to generate marketing content with traceability.
 */
export async function generateProductCopy(params: {
    productId: string,
    context: ContentContext,
    conceptId: string,
    storeId: string
}) {
    try {
        const { productId, context, conceptId, storeId } = params;

        // 1. Get Product & Store Data
        const product = await prisma.product.findUnique({
            where: { id: productId },
            include: { store: true, avatars: true }
        });

        if (!product) throw new Error("Producto no encontrado");

        // 2. Resolve Safe Mode based on Store Settings & Context
        const isSafeMode = product.store.safeModeAds && (context === 'AD_VIDEO' || context === 'AD_STATIC');

        // 3. Trigger Generation
        const copy = await generateMasterCopy({
            productName: product.title,
            context,
            isSafeMode,
            brandVoice: product.store.brandKit || undefined,
            researchData: product.avatars[0] || {}
        });

        // 4. Save to Database with Traceability
        const document = await prisma.researchDocument.create({
            data: {
                productId,
                title: `${context} - Concept: ${conceptId}`,
                type: context,
                content: copy,
                language: "es"
            }
        });

        revalidatePath(`/marketing/copy-hub`);
        return { success: true, documentId: document.id, content: copy };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Generates a "Premium Section" for Shopify based on the generated copy.
 */
export async function generateShopifySection(copyId: string) {
    // Logic to parse the copy and wrap it in Liquid/JSON structure
    // This will be expanded in Hito 2 with the Theme Analyzer
    return { success: true, message: "Estructura de sección preparada (Hito 2)" };
}
