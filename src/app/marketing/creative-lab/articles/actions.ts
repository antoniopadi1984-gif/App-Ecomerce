"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { askGemini } from "@/lib/ai";

/**
 * Advertorial Lab: Generation from 0
 * Uses Gemini to generate high-conversion articles.
 */
export async function generateAdvertorial(storeId: string, productId: string, targetAvatar: string, angle: string) {
    try {
        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (!product) throw new Error("Producto no encontrado");

        // 1. Prompt Gemini for Advertorial Structure & Copy
        const prompt = `
            Genera un ADVERTORIAL (Artículo de venta encubierto) de alta conversión para: ${product.title}.
            Avatar objetivo: ${targetAvatar}
            Ángulo principal: ${angle}
            
            ESTRUCTURA REQUERIDA (JSON):
            - HEADLINE: Gancho magnético tipo noticia.
            - SUBHEAD: Refuerzo de curiosidad.
            - BODY_BLOCKS: 
                1. Gancho de curiosidad/noticia.
                2. El descubrimiento (por qué los métodos tradicionales fallan).
                3. La solución (presentación sutil del producto).
                4. Beneficios técnicos y emocionales.
                5. Prueba social/Testimonio incrustado.
                6. Escasez y CTA.
            
            RESPONDE SOLO EN JSON:
            {
               "title": "Headline del artículo",
               "blocks": [
                  { "type": "headline", "title": "...", "subtitle": "..." },
                  { "type": "text", "content": "..." },
                  { "type": "benefit", "title": "...", "text": "..." },
                  ...
               ]
            }
        `;

        const aiResponse = await askGemini(prompt, "Eres un Copywriter de respuesta directa experto en Advertorials millonarios.");
        const cleanJson = aiResponse.text.match(/\{[\s\S]*\}/)?.[0] || "{}";
        const result = JSON.parse(cleanJson);

        // 2. Save as LandingProject with status READY
        const project = await (prisma as any).landingProject.create({
            data: {
                storeId,
                productId,
                name: result.title || `Advertorial: ${product.title}`,
                status: 'READY',
                blocksJson: JSON.stringify(result.blocks),
                styleJson: JSON.stringify({ theme: 'Premium Newspaper', type: 'ADVERTORIAL' })
            }
        });

        revalidatePath("/marketing/creative-lab/articles");
        return project;
    } catch (error: any) {
        console.error("🛑 [AdvertorialEngine] Error:", error.message);
        throw new Error(`Error al generar advertorial: ${error.message}`);
    }
}

export async function getAdvertorialProjects(storeId: string) {
    return await (prisma as any).landingProject.findMany({
        where: {
            storeId,
            styleJson: { contains: 'ADVERTORIAL' }
        },
        include: { product: true },
        orderBy: { createdAt: 'desc' }
    });
}
