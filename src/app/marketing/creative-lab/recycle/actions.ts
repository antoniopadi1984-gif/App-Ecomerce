"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { askGemini } from "@/lib/ai";

/**
 * Creative Recycle: Refresh Ad Fatigue
 */

export async function recycleCreative(projectId: string, feedback: string) {
    try {
        const project = await (prisma as any).creativeProject.findUnique({
            where: { id: projectId },
            include: { product: true }
        });

        if (!project) throw new Error("Proyecto no encontrado");

        const strategy = JSON.parse(project.dissectionJson || "{}");

        const recyclePrompt = `
            Este anuncio creativo se ha "quemado" (fatiga de audiencia).
            Necesito reciclarlo manteniendo la base visual pero cambiando el ángulo de texto.
            
            ESTRATEGIA ACTUAL:
            Headline: ${strategy.headline}
            Subheadline: ${strategy.subheadline}
            CTA: ${strategy.cta}
            
            FEEDBACK USUARIO: ${feedback || "Hazlo más agresivo y directo."}
            
            NECESITO (JSON):
            {
               "headline": "Nuevo titular fresco",
               "subheadline": "Nuevo subtítulo",
               "cta": "Nuevo CTA",
               "reasoning": "Por qué este cambio funcionará de nuevo"
            }
        `;

        const aiResponse = await askGemini(recyclePrompt, "Eres un experto en Creative Refresh y Ad Fatigue.");
        const result = JSON.parse(aiResponse.text.match(/\{[\s\S]*\}/)?.[0] || "{}");

        // Create a new variation entry in the project
        const currentVariations = JSON.parse(project.variationsJson || "[]");
        const newVariation = {
            format: "RECYCLED",
            url: currentVariations[0]?.url || "",
            headline: result.headline,
            subheadline: result.subheadline,
            cta: result.cta,
            status: "READY",
            isRecycled: true,
            recycleReason: result.reasoning
        };

        const updatedVariations = [newVariation, ...currentVariations];

        await (prisma as any).creativeProject.update({
            where: { id: projectId },
            data: {
                variationsJson: JSON.stringify(updatedVariations),
                updatedAt: new Date()
            }
        });

        revalidatePath("/marketing/creative-lab");
        return result;
    } catch (error: any) {
        console.error("🛑 [Recycle] Error:", error.message);
        throw new Error(`Error al reciclar: ${error.message}`);
    }
}
