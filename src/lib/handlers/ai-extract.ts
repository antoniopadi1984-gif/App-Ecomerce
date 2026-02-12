import { JobHandler } from "../worker";
import { askGemini } from "../ai";
import prisma from "../prisma";
import fs from "fs";
import path from "path";

const aiExtractHandler: JobHandler = {
    handle: async (payload, onProgress) => {
        let { imageBase64, productId, productName, language } = payload;

        await onProgress(10);

        // Resolve file reference if offloaded
        if (imageBase64 && imageBase64.startsWith("file://")) {
            try {
                const fileName = imageBase64.replace("file://", "");
                const filePath = path.resolve(process.cwd(), "uploads", "jobs", fileName);
                console.log(`📖 [Handler] Reading offloaded payload from: ${fileName}`);
                imageBase64 = fs.readFileSync(filePath, "utf-8");
            } catch (e) {
                console.error("❌ [Handler] Failed to read offloaded payload:", e);
                // Fallback: Continue without image or fail? Fail because extraction needs image
                throw new Error("No se pudo leer el archivo de video procesado.");
            }
        }

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
