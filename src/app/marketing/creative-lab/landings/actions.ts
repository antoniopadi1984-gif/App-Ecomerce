"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { askGemini } from "@/lib/ai";

/**
 * Landing Lab: CLONE_BLOCKS Mode
 * Uses Gemini to extract standard marketing blocks from HTML/SVG content.
 */
export async function cloneLanding(storeId: string, url: string, productId?: string) {
    try {
        // 1. Fetch content (Simple fetch for internal/public pages)
        const response = await fetch(url);
        const html = await response.text();

        // 2. prompt Gemini to extract BLOCKS
        const prompt = `
            Analiza el siguiente HTML de una landing page y extráelo en una estructura de BLOQUES de conversión.
            Ignora scripts, estilos y menús de navegación globales.
            
            BLOQUES REQUERIDOS:
            - HERO: Título, Subtítulo, Imagen principal.
            - PROBLEMA: Dolor que resuelve.
            - BENEFICIOS: Lista de ventajas.
            - PRUEBA SOCIAL: Testimonios o logos.
            - COMPARATIVA: Antes vs Después.
            - OFERTA: Precio, Bundles.
            - GARANTÍA: Sellos de confianza.
            - FAQ: Preguntas frecuentes.
            
            HTML (Resumen): ${html.substring(0, 15000)}...
            
            RESPONDE SOLO EN JSON:
            {
               "name": "Nombre sugerido de la landing",
               "blocks": [
                  { "type": "hero", "content": { "title": "...", "subtitle": "...", "cta": "..." } },
                  ...
               ]
            }
        `;

        const aiResponse = await askGemini(prompt, "Eres un director de arte y UX experto en conversiones de ecommerce.");
        const cleanJson = aiResponse.text.match(/\{[\s\S]*\}/)?.[0] || "{}";
        const result = JSON.parse(cleanJson);

        // 3. Save to DB
        const project = await (prisma as any).landingProject.create({
            data: {
                storeId,
                productId,
                name: result.name || `Clon: ${url}`,
                url,
                status: 'READY',
                blocksJson: JSON.stringify(result.blocks)
            }
        });

        revalidatePath("/marketing/creative-lab/landings");
        return project;
    } catch (error: any) {
        console.error("🛑 [LandingCloner] Error:", error.message);
        throw new Error(`Error al clonar landing: ${error.message}`);
    }
}

export async function getLandingProjects(storeId: string) {
    return await (prisma as any).landingProject.findMany({
        where: { storeId },
        include: { product: true },
        orderBy: { createdAt: 'desc' }
    });
}

export async function deleteLandingProject(id: string) {
    await (prisma as any).landingProject.delete({ where: { id } });
    revalidatePath("/marketing/creative-lab/landings");
}
