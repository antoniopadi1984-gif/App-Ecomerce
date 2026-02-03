"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { MASTER_PROTOCOL_PROMPTS } from "@/lib/deep-protocol";

/**
 * Fetch all products for the SELECT dropdown
 */
export async function getProducts() {
    try {
        const products = await prisma.product.findMany({
            select: {
                id: true,
                title: true,
                image: true
            },
            orderBy: {
                title: 'asc'
            }
        });
        return { success: true, data: products };
    } catch (error) {
        console.error("Error fetching products:", error);
        return { success: false, error: "Failed to fetch products" };
    }
}

/**
 * Deep Research V3: Master Protocol (Markdown Report)
 */
export async function generateDeepProtocolResearch(productId: string, productName: string, country: string, urls: string[]) {
    try {
        const prompt = MASTER_PROTOCOL_PROMPTS.MASS_DESIRES(productName, country, urls);
        const response = await askGemini(prompt);

        return { success: true, report: response.text };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Save the simulated research result to the database
 */
export async function saveAvatarResearch(productId: string, data: any) {
    try {
        // Prepare data for Prisma
        // The schema expects strings for complex objects (JSON)
        // model AvatarResearch {
        //   levelOfAwareness String? // O1 - O5
        //   desires         String?  // JSON
        //   fears           String?  // JSON
        //   sophistication  String?
        //   marketMood      String?  // Summary of Reddit/Amazon sentiment
        // }

        const research = await prisma.avatarResearch.create({
            data: {
                productId,
                levelOfAwareness: data.levelOfAwareness,
                desires: JSON.stringify(data.desires),
                fears: JSON.stringify(data.fears),
                sophistication: data.sophistication,
                marketMood: data.marketMood,
                angles: JSON.stringify(data.angles),
                mainDesire: data.mainDesire
            }
        });

        revalidatePath('/marketing/avatars');
        return { success: true, data: research };
    } catch (error) {
        console.error("Error saving research:", error);
        return { success: false, error: "Failed to save research" };
    }
}

import { askGemini, getStoreContext } from "@/lib/ai";

/**
 * Get research for a specific product
 */
export async function getProductResearch(productId: string) {
    try {
        const research = await prisma.avatarResearch.findFirst({
            where: { productId },
            orderBy: { createdAt: 'desc' }
        });

        if (!research) return { success: true, data: null };

        // Parse JSON fields
        return {
            success: true,
            data: {
                ...research,
                desires: research.desires ? JSON.parse(research.desires) : [],
                fears: research.fears ? JSON.parse(research.fears) : [],
                angles: research.angles ? JSON.parse(research.angles) : []
            }
        };
    } catch (error) {
        console.error("Error fetching research:", error);
        return { success: false, error: "Failed to fetch research" };
    }
}

/**
 * Perform Deep Research using Gemini AI Agent
 */
export async function generateRealAvatarResearch(productId: string, productName: string, imageBase64?: string, country?: string, urls?: string[]) {
    try {
        console.log(`[Deep Research] Starting analysis for ${productName}...`);

        // 1. Check if recent research exists (optional optimization)
        const existing = await prisma.avatarResearch.findFirst({
            where: { productId },
            orderBy: { createdAt: 'desc' }
        });

        // 2. Fetch Knowledge Base (Research Documents)
        const docs = await prisma.researchDocument.findMany({
            where: { productId }
        });
        const docContext = docs.length > 0 ? `KNOWLEDGE BASE / DOCUMENTOS INTERNOS:\n${docs.map(d => `- ${d.title} (${d.type}): ${d.content}`).join('\n')}` : "";

        // 2b. Fetch Store Context (Real-time Sales/Inventory)
        const storeContext = await getStoreContext();

        // 3. Prompt Engineering (Eugene Schwartz Level)
        const prompt = `
            ACTÚA COMO: Eugene Schwartz reencarnado + Un Psicólogo Conductual de Harvard + Un Analista de Datos de Facebook Ads.
            TU IQ: 180.
            TU ESTILO: Directo, Visceral, Políticamente Incorrecto si es necesario para encontrar la verdad, Basado en Datos.

            OBJETIVO: Realizar una autopsia psicológica del mercado para el producto: "${productName}".

            CONTEXTO DEL NEGOCIO (Real-Time):
            ${storeContext}
            
            ${country ? `MERCADO OBJETIVO: ${country}` : "MERCADO: Global / Sin especificar"}
            ${urls && urls.length > 0 ? `COMPETENCIA / FUENTES: \n- ${urls.join('\n- ')}\n(Extrae sus debilidades, no copies sus fortalezas).` : ""}
            ${docContext}
            
            INSTRUCCIONES DE DISECCIÓN PROFUNDA:
            1. NIVEL DE CONSCIENCIA (Market Awareness): ¿Qué sabe el cliente? ¿Sabe que tiene un problema? ¿Conoce soluciones? Clasifícalo de O1 (Unaware) a O5 (Most Aware).
            2. SOFISTICACIÓN DEL MERCADO: ¿Cuántas promesas similares ha escuchado? Si es alta, necesitamos un MECANISMO ÚNICO.
            3. DESEOS VISCERALES (No lógicos): No digas "ahorrar tiempo". Dí "Llegar a casa a tiempo para ver a sus hijos despiertos y no sentirse un padre ausente". SÉ ESPECÍFICO.
            4. MIEDOS PARALIZANTES: No digas "perder dinero". Dí "Que su esposa le diga 'te lo dije' cuando el producto falle y se sienta humillado".
            5. ÁNGULOS DE VENTA (6 Variaciones):
               - Listicle (Curiosidad)
               - Storytelling (Héroe/Víctima)
               - Contrarian (La Gran Mentira de la Industria)
               - Scientific/Mechanism (Por qué funciona cuando otros fallan)
               - Social Proof (El efecto rebaño)
               - Urgency/Scarcity (FOMO real, basado en el contexto de stock si hay)

            FORMATO DE RESPUESTA (JSON PURO, SIN MARKDOWN):
            Retorna UNICAMENTE este JSON exacto. El contenido de los strings debe ser extenso y detallado.
             {
                 "levelOfAwareness": "String (Ej: O3 - Solution Aware: Saben que les duele la espalda, han probado masajes, buscan algo definitivo)",
                 "desires": ["Deseo Visceral 1 (Largo y emocional)", "Deseo Visceral 2", "Deseo Visceral 3"],
                 "fears": ["Miedo Profundo 1 (Específico y doloroso)", "Miedo 2", "Miedo 3"],
                 "sophistication": "String (Nivel 1-5 y explicación breve)",
                 "marketMood": "String (Ej: Cínico, Desesperado, Entusiasta, Escéptico)",
                 "mainDesire": "La ÚNICA gran cosa que quieren (La Promesa Principal)",
                 "angles": [
                     { "title": "Título Gancho (Clickbait Ético)", "draft": "Draft del guión/copy (2 líneas máximo)", "type": "Tipo de Ángulo" }
                 ]
             }
        `;

        const aiResponse = await askGemini(prompt, undefined, imageBase64);

        if (aiResponse.error || !aiResponse.text) {
            throw new Error(aiResponse.error || "No response from AI Agent");
        }

        // 3. Clean and Parse JSON
        // Remove markdown code blocks if present
        // 3a. Clean and Parse Logic
        const cleanAndParse = (text: string) => {
            try {
                // 1. Remove Markdown
                let cleaned = text.replace(/```json/g, "").replace(/```/g, "");

                // 2. Find outermost JSON object
                const firstBrace = cleaned.indexOf('{');
                const lastBrace = cleaned.lastIndexOf('}');

                if (firstBrace !== -1 && lastBrace !== -1) {
                    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
                }

                // 3. Parse
                return JSON.parse(cleaned);
            } catch (e) {
                console.error("JSON Parse Failed:", e);
                return null;
            }
        };

        let data = cleanAndParse(aiResponse.text);

        if (!data) {
            // Fallback: Try even more aggressive cleanup (newlines)
            const aggressiveClean = aiResponse.text.replace(/\n/g, " ").replace(/\r/g, "");
            data = cleanAndParse(aggressiveClean);
        }

        if (!data) {
            console.error("Gemini JSON Critical Fail. Raw:", aiResponse.text?.substring(0, 200));
            // FAIL-SAFE: Return partial data so the UI doesn't crash
            data = {
                levelOfAwareness: "O3 (Manual Review)",
                desires: ["Análisis IA Incompleto - Revisar Prompt", "Verificar Créditos Gemini"],
                fears: ["El formato devuelto no era JSON válido"],
                sophistication: "Revisión Manual Requerida",
                marketMood: "Error de Formato",
                mainDesire: "La IA generó texto narrativo en lugar de datos estructurados.",
                angles: [
                    { title: "Ángulo Fallido", draft: "Por favor reintenta la investigación.", type: "Error" }
                ]
            };
        }

        // 4. Save to Database
        const saved = await saveAvatarResearch(productId, data);

        return { success: true, data: { ...saved.data, desires: data.desires, fears: data.fears, angles: data.angles }, isCached: false };

    } catch (error: any) {
        console.error("Deep Research Error:", error);
        return { success: false, error: error.message };
    }
}
