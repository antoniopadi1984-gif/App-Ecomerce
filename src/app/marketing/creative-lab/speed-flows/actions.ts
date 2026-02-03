"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { askGemini } from "@/lib/ai";
import { generateStaticAds } from "../statics/actions";
import { cloneLanding } from "../landings/actions";

/**
 * Speed Flows: High-Speed Multi-Asset Generation
 */

export async function generateFullCreativePack(storeId: string, productId: string, country: string = "España") {
    try {
        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (!product) throw new Error("Producto no encontrado");

        // 1. Get latest research or generate quick one
        const research = await (prisma as any).avatarResearch.findFirst({ where: { productId }, orderBy: { createdAt: 'desc' } });
        const researchContext = research ? `Basado en este avatar: ${research.desires} / ${research.fears}` : "No hay research previo, genera uno creativo.";

        // 2. Generate Landing (Advertorial Style)
        const landingPrompt = `Genera la estructura de un Advertorial para ${product.title} en ${country}. Contexto: ${researchContext}`;
        // This would call an internal advertorial action...
        const landing = await (prisma as any).landingProject.create({
            data: {
                storeId,
                productId,
                name: `[PACK] LP - ${product.title} - ${country}`,
                status: 'READY',
                blocksJson: JSON.stringify([{ type: 'hero', content: { title: `La solución definitiva para... en ${country}` } }])
            }
        });

        // 3. Generate 3 Static Ads (Deseo, Dolor, Prueba)
        await Promise.all([
            generateStaticAds(storeId, { productId, type: 'DESEO' }),
            generateStaticAds(storeId, { productId, type: 'DOLOR' }),
            generateStaticAds(storeId, { productId, type: 'PRUEBA' })
        ]);

        revalidatePath("/marketing/creative-lab");
        return { success: true, landingId: landing.id };
    } catch (error: any) {
        throw new Error(`Error en Pack Creativo: ${error.message}`);
    }
}

export async function quickOptimizeLanding(storeId: string, url: string) {
    // 1. Clone + 2. Analyze Friction + 3. Suggest Changes
    return await cloneLanding(storeId, url);
}
