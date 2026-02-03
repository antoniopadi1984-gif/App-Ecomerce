"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { askGemini } from "@/lib/ai";

/**
 * Research OS: Offer Pressure Test & Competitor Breakdown
 */

export async function runOfferPressureTest(productId: string, currentOffer: string) {
    try {
        const quotes = await (prisma as any).voiceOfCustomerQuote.findMany({
            where: { productId },
            take: 50
        });

        const context = quotes.map((q: any) => `[${q.category}] ${q.text}`).join("\n");

        const prompt = `
            Actúa como un Consultor de Ofertas Agresivo (Alex Hormozi style).
            Haz un PRESSURE TEST de esta oferta contra la realidad del mercado (VOC).
            
            OFERTA ACTUAL: ${currentOffer}
            
            REALIDAD DEL MERCADO (VOC):
            ${context.substring(0, 10000)}
            
            NECESITO (JSON):
            {
               "survivalScore": 0-100,
               "gaps": [
                  { "gap": "Falta de urgencia real", "severity": "HIGH", "fix": "Añadir escasez por unidades" }
               ],
               "competitorWeaknesses": [
                  { "weakness": "Envíos lentos", "opportunity": "Garantizar envío 24h" }
               ],
               "optimizedOffer": "Re-escritura de la oferta para ser irresistible"
            }
        `;

        const aiResponse = await askGemini(prompt, "Eres un experto en ofertas irresistibles.");
        const result = JSON.parse(aiResponse.text.match(/\{[\s\S]*\}/)?.[0] || "{}");

        // We don't have a dedicated table for Offer Tests yet, so we'll append to research history or return to UI.
        // For now, we return to UI to display.

        return result;
    } catch (error: any) {
        throw new Error(`Error en Pressure Test: ${error.message}`);
    }
}
