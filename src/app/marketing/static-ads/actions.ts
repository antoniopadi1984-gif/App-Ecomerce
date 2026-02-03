"use server";

import prisma from "@/lib/prisma";
import { askGemini } from "@/lib/ai";

export async function getProducts() {
    try {
        const products = await prisma.product.findMany({
            select: { id: true, title: true }
        });
        return { success: true, products };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function generateStaticConcepts(productName: string, targetAudience: string, imageBase64?: string) {
    try {
        const prompt = `
            Actúa como un Director de Arte Sr. y Estratega de Creativos en Meta Ads.
            
            PRODUCTO: ${productName}
            AUDIENCIA: ${targetAudience}
            
            Tu tarea es generar 2 Conceptos de Anuncios Estáticos de Alto Impacto.
            Cada concepto debe incluir:
            - Un Hook Visual (Descripción detallada para un diseñador/IA).
            - Un Headline rompedor.
            - Un Ad Copy corto y persuasivo.
            - Un Ángulo de Marketing.
            - Un AI Prompt para Midjourney v6/DALL-E 3 para generar la imagen de fondo.

            FORMATO DE RESPUESTA: JSON PURO (Sin markdown).
            [
              {
                "id": 1,
                "hook": "...",
                "headline": "...",
                "copy": "...",
                "angle": "...",
                "prompt": "..."
              }
            ]
        `;

        const response = await askGemini(prompt, undefined, imageBase64);

        // Parsing logic (same as in deep research)
        const cleanAndParse = (text: string) => {
            try {
                // Remove potential markdown blocks
                let cleaned = text.trim();
                if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/^```json/, "");
                if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```/, "");
                if (cleaned.endsWith('```')) cleaned = cleaned.replace(/```$/, "");

                const firstBracket = cleaned.indexOf('[');
                const lastBracket = cleaned.lastIndexOf(']');

                if (firstBracket !== -1 && lastBracket !== -1) {
                    cleaned = cleaned.substring(firstBracket, lastBracket + 1);
                }

                return JSON.parse(cleaned);
            } catch (e) {
                console.error("JSON Parse Error:", e, text);
                return null;
            }
        };

        const parsed = cleanAndParse(response.text || "");
        if (!parsed) {
            console.error("Failed to parse response:", response.text);
            throw new Error("Error al procesar la respuesta de la IA. Inténtalo de nuevo o usa el modo Ahorro.");
        }

        return { success: true, concepts: parsed };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
