"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { askGemini } from "@/lib/ai";

/**
 * Creative Quality Gate & Variant Scoring
 */

export async function runQualityGate(assetId: string, type: 'IMAGE' | 'VIDEO' | 'LANDING') {
    try {
        let asset;
        if (type === 'LANDING') {
            asset = await (prisma as any).landingProject.findUnique({ where: { id: assetId }, include: { product: true } });
        } else {
            asset = await (prisma as any).creativeProject.findUnique({ where: { id: assetId }, include: { product: true } });
        }

        if (!asset) throw new Error("Activo no encontrado");

        // Fetch Blueprint for context
        const blueprint = await (prisma as any).creativeBlueprint.findFirst({
            where: { productId: asset.productId },
            orderBy: { createdAt: 'desc' }
        });

        const contentToReview = type === 'LANDING' ? asset.blocksJson : asset.dissectionJson;

        const gatePrompt = `
            Actúa como un Auditor de Calidad Creativa. Revisa este activo:
            Tipo: ${type}
            Estrategia Blueprint: ${blueprint ? blueprint.mainAngle : 'N/A'}
            Contenido: ${contentToReview}
            
            AUDITORÍA (JSON):
            {
               "score": 0-100,
               "checklist": [
                  { "item": "Claridad de Propuesta", "status": "PASS/FAIL/WARN", "comment": "..." },
                  { "item": "Ajuste al Avatar", "status": "...", "comment": "..." },
                  { "item": "Legalidad de Claims", "status": "...", "comment": "..." },
                  { "item": "Visibilidad de CTA", "status": "...", "comment": "..." },
                  { "item": "Densidad de Texto", "status": "...", "comment": "..." }
               ],
               "verdict": "APROBADO / REQUIERE CAMBIOS / RECHAZADO",
               "topFix": "La mejora n.º 1 más urgente"
            }
        `;

        const aiResponse = await askGemini(gatePrompt, "Eres un perfeccionista del marketing y compliance legal.");
        const result = JSON.parse(aiResponse.text.match(/\{[\s\S]*\}/)?.[0] || "{}");

        // Save result
        if (type === 'LANDING') {
            await (prisma as any).landingProject.update({
                where: { id: assetId },
                data: { qualityGateResultsJson: JSON.stringify(result) }
            });
        } else {
            await (prisma as any).creativeProject.update({
                where: { id: assetId },
                data: { qualityGateResultsJson: JSON.stringify(result) }
            });
        }

        revalidatePath("/marketing/creative-lab");
        return result;
    } catch (error: any) {
        console.error("🛑 [QualityGate] Error:", error.message);
        throw new Error(`Error en Quality Gate: ${error.message}`);
    }
}

export async function scoreVariations(projectId: string) {
    try {
        const project = await (prisma as any).creativeProject.findUnique({ where: { id: projectId } });
        if (!project) throw new Error("Proyecto no encontrado");

        const variations = JSON.parse(project.variationsJson || "[]");

        const scorePrompt = `
            Puntúa estas variaciones de anuncios del 1 al 100 basado en:
            1. Claridad de gancho.
            2. Alineación con ángulo.
            3. Potencial de CTR.
            
            Variaciones: ${JSON.stringify(variations)}
            
            RESPONDE SOLO EN JSON:
            [ { "index": 0, "score": 85, "reason": "..." }, ... ]
        `;

        const aiResponse = await askGemini(scorePrompt, "Eres un experto en compra de tráfico y optimización de creativos.");
        const scores = JSON.parse(aiResponse.text.match(/\[[\s\S]*\]/)?.[0] || "[]");

        await (prisma as any).creativeProject.update({
            where: { id: projectId },
            data: { variantScoresJson: JSON.stringify(scores) }
        });

        revalidatePath("/marketing/creative-lab");
        return scores;
    } catch (error: any) {
        console.error("🛑 [VariantScoring] Error:", error.message);
        throw new Error(`Error en Scoring: ${error.message}`);
    }
}
