
import { JobHandler } from "../worker";
import { askGemini } from "../ai";
import prisma from "../prisma";

const aiExtractHandler: JobHandler = {
    handle: async (payload, onProgress) => {
        const { imageBase64, productId, productName, language } = payload;

        await onProgress(10);

        // Use any to bypass temporary prisma type delay
        const db = prisma as any;

        let context = productName || "Producto Desconocido";
        if (productId) {
            const product = await db.product.findUnique({
                where: { id: productId },
                include: { avatars: true }
            });
            if (product) {
                context = `${product.title}. Avatares: ${JSON.stringify(product.avatars)}`;
            }
        }

        await onProgress(30);

        const prompt = `
            Analiza este video/imagen de anuncio para el producto "${context}".
            Extrae el GUIÓN REAL palabra por palabra.
            Analiza PSICOLÓGICAMENTE por qué este video vende (Hook, Retención, Oferta).
            
            Responde en JSON y asegúrate de que todo el texto esté en "${language === 'en' ? 'INGLÉS' : 'ESPAÑOL'}":
            {
                "script": "Texto del guión...",
                "psychology": "Análisis psicológico...",
                "hookScore": 8.5,
                "suggestions": ["mejora 1", "mejora 2"]
            }
        `;

        const res = await askGemini(prompt, undefined, imageBase64);
        await onProgress(80);

        if (res.error) throw new Error(res.error);
        if (!res.text || res.text === "No se obtuvo respuesta de Gemini.") {
            throw new Error("No se pudo extraer información del video.");
        }

        try {
            const cleaned = res.text.replace(/```json/g, "").replace(/```/g, "").trim();
            const analysis = JSON.parse(cleaned);
            await onProgress(100);
            return analysis;
        } catch {
            await onProgress(100);
            return {
                script: res.text,
                psychology: "Análisis generado en formato texto.",
                hookScore: 7,
                suggestions: ["Mejorar transiciones", "Añadir subtítulos dinámicos"]
            };
        }
    }
};

export default aiExtractHandler;
