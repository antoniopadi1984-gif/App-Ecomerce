"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { askGemini } from "@/lib/ai";

/**
 * Static Ads Generator: Strategic Ad Creation
 */
export async function generateStaticAds(storeId: string, data: { productId: string, url?: string, angleId?: string, type: 'DOLOR' | 'DESEO' | 'AUTORIDAD' | 'PRUEBA' }) {
    try {
        const product = await prisma.product.findUnique({ where: { id: data.productId } });
        if (!product) throw new Error("Producto no encontrado");

        // 1. Strategic Analysis (Gemini Marketing Strategist)
        const strategyPrompt = `
            Actúa como un Senior Marketing Strategist. Genera un ángulo de venta para un anuncio estático:
            Producto: ${product.title}
            Enfoque solicitado: ${data.type}
            URL Referencia: ${data.url || 'No proporcionada'}
            
            NECESITO:
            1. Un TÍTULAR magnético (máx 10 palabras).
            2. Un SUBTÍTULO que resuelva objeción.
            3. Un CTA claro.
            4. Un CONCEPTO VISUAL (prompt para imagen base).
            
            RESPONDE SOLO EN JSON:
            {
               "headline": "...",
               "subheadline": "...",
               "cta": "...",
               "visualConcept": "..."
            }
        `;

        const aiResponse = await askGemini(strategyPrompt, "Eres un experto en psicología del consumidor y copywriting de respuesta directa.");
        const cleanJson = aiResponse.text.match(/\{[\s\S]*\}/)?.[0] || "{}";
        const strategy = JSON.parse(cleanJson);

        // 2. Mock Image Generation (Simulated Nano Banana call)
        // In a real M3 flow, this would call a local generation script or API
        const formats = ['1:1', '4:5', '9:16'];
        const ads = formats.map(f => ({
            format: f,
            url: `/uploads/statics/ad_${Date.now()}_${f.replace(':', '_')}.png`,
            headline: strategy.headline,
            subheadline: strategy.subheadline,
            cta: strategy.cta,
            status: 'READY'
        }));

        // 3. Save as CreativeProject
        const project = await (prisma as any).creativeProject.create({
            data: {
                storeId,
                productId: data.productId,
                name: `Static Ad - ${data.type} - ${product.title}`,
                type: 'IMAGE',
                status: 'READY',
                dissectionJson: JSON.stringify(strategy),
                variationsJson: JSON.stringify(ads)
            }
        });

        revalidatePath("/marketing/creative-lab/statics");
        return project;
    } catch (error: any) {
        console.error("🛑 [StaticAds] Error:", error.message);
        throw new Error(`Error al generar anuncios: ${error.message}`);
    }
}

/**
 * Landing Friction Scanner: Deep UX/Copy Audit
 */
export async function scanLandingFriction(url: string) {
    try {
        const response = await fetch(url);
        const html = await response.text();

        const auditPrompt = `
            Analiza esta landing page en busca de "Fricciones" que matan la conversión.
            URL: ${url}
            HTML (Resumen): ${html.substring(0, 5000)}...
            
            BUSCA:
            - Exceso de texto / Falta de foco.
            - Claims poco claros o ilegales.
            - CTA débil o invisible.
            - Desalineación imagen-mensaje.
            
            RESPONDE SOLO EN JSON:
            {
               "score": 0-100,
               "frictions": ["...", "..."],
               "optimizations": ["...", "..."],
               "suggestedHeadline": "..."
            }
        `;

        const aiResponse = await askGemini(auditPrompt, "Eres un Conversion Rate Optimizer (CRO) experto en Ecommerce.");
        const result = JSON.parse(aiResponse.text.match(/\{[\s\S]*\}/)?.[0] || "{}");

        return result;
    } catch (error: any) {
        console.error("🛑 [FrictionScanner] Error:", error.message);
        throw new Error(`Error al analizar landing: ${error.message}`);
    }
}

export async function getStaticProjects(storeId: string) {
    return await (prisma as any).creativeProject.findMany({
        where: { storeId, type: 'IMAGE' },
        include: { product: true },
        orderBy: { createdAt: 'desc' }
    });
}
