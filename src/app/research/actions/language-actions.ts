"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { askGemini } from "@/lib/ai";

/**
 * Language Mirror: Product Dictionary
 */

export async function generateDictionary(productId: string) {
    try {
        const quotes = await (prisma as any).voiceOfCustomerQuote.findMany({ where: { productId } });
        if (quotes.length === 0) throw new Error("No hay VOC para analizar.");

        const quotesText = quotes.map((q: any) => q.text).join("\n");

        const dictPrompt = `
            Analiza estas opiniones de clientes y extrae un DICCIONARIO DE LENGUAJE para este producto.
            Busca palabras clave, jerga (slang), modismos y frases recurrentes que usan los clientes reales.
            
            Opiniones: ${quotesText.substring(0, 10000)}
            
            RESPONDE SOLO EN JSON:
            {
               "terms": [
                  { "term": "...", "category": "KEYWORD/SLANG/PAINPOINT", "context": "Usado para describir...", "frequency": "HIGH/MED" },
                  ...
               ]
            }
        `;

        const aiResponse = await askGemini(dictPrompt, "Eres un lingüista experto en e-commerce y copy.");
        if (!aiResponse || !aiResponse.text) {
            return { success: false, error: "No output from AI" };
        }
        const result = JSON.parse(aiResponse.text.match(/\{[\s\S]*\}/)?.[0] || "{}");

        // Upsert dictionary
        await (prisma as any).languageDictionary.deleteMany({ where: { productId } }); // Reset for fresh analysis

        const dict = await (prisma as any).languageDictionary.create({
            data: {
                productId,
                entriesJson: JSON.stringify(result.terms)
            }
        });

        revalidatePath(`/marketing/research`);
        return dict;
    } catch (error: any) {
        throw new Error(`Error en Language Mirror: ${error.message}`);
    }
}

export async function getLanguageDictionary(productId: string) {
    return await (prisma as any).languageDictionary.findFirst({ where: { productId } });
}
