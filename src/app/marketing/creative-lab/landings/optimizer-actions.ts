"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { askGemini } from "@/lib/ai";

/**
 * Landing Diff Optimizer & Sections AI
 */

export async function optimizeLanding(projectId: string, objective: string) {
    try {
        const project = await (prisma as any).landingProject.findUnique({
            where: { id: projectId },
            include: { product: true }
        });

        if (!project) throw new Error("Proyecto no encontrado");

        // Fetch Blueprint if exists
        const blueprint = await (prisma as any).creativeBlueprint.findFirst({
            where: { productId: project.productId },
            orderBy: { createdAt: 'desc' }
        });

        const currentBlocks = JSON.parse(project.blocksJson || "[]");
        const blueprintContext = blueprint
            ? `Blueprint: ${blueprint.mainAngle}, Claim: ${blueprint.centralClaim}`
            : "No hay blueprint previo.";

        const optimizerPrompt = `
            Actúa como un Senior CRO (Conversion Rate Optimizer). Optimiza la siguiente estructura de bloques de una landing page.
            
            OBJETIVO: ${objective}
            CONTEXTO ESTRATÉGICO: ${blueprintContext}
            BLOQUES ACTUALES:
            ${JSON.stringify(currentBlocks)}
            
            NECESITO (JSON):
            {
               "newBlocks": [...],
               "explanation": "Explicación psicológica de por qué estos cambios mejorarán la conversión basado en la investigación."
            }
        `;

        const aiResponse = await askGemini(optimizerPrompt, "Eres un experto en psicología del consumidor y optimización de landings.");
        const result = JSON.parse(aiResponse.text.match(/\{[\s\S]*\}/)?.[0] || "{}");

        // Save current as previous
        await (prisma as any).landingProject.update({
            where: { id: projectId },
            data: {
                previousVersionJson: project.blocksJson,
                blocksJson: JSON.stringify(result.newBlocks),
                changeLogJson: result.explanation,
                versionsCount: { increment: 1 }
            }
        });

        revalidatePath("/marketing/creative-lab/landings");
        return result;
    } catch (error: any) {
        console.error("🛑 [LandingOptimizer] Error:", error.message);
        throw new Error(`Error al optimizar landing: ${error.message}`);
    }
}

export async function generateModularSection(storeId: string, { type, blueprintId }: { type: string, blueprintId: string }) {
    try {
        const blueprint = await (prisma as any).creativeBlueprint.findUnique({
            where: { id: blueprintId }
        });

        if (!blueprint) throw new Error("Blueprint no encontrado");

        const sectionPrompt = `
            Genera una sección de tipo ${type} para una landing page basada en este Blueprint.
            Avatar: ${blueprint.avatarSegment}
            Ángulo: ${blueprint.mainAngle}
            Promesa: ${blueprint.centralClaim}
            
            NECESITO (JSON):
            {
               "name": "Nombre de la sección",
               "config": {
                  "title": "...",
                  "subtitle": "...",
                  "elements": ["...", "..."],
                  "cta": "..."
               }
            }
        `;

        const aiResponse = await askGemini(sectionPrompt, "Eres un experto en diseño modular de landings.");
        const result = JSON.parse(aiResponse.text.match(/\{[\s\S]*\}/)?.[0] || "{}");

        const section = await (prisma as any).landingSection.create({
            data: {
                storeId,
                name: result.name,
                type,
                configJson: JSON.stringify(result.config),
                awarenessLevel: blueprint.levelOfAwareness?.toString()
            }
        });

        return section;
    } catch (error: any) {
        console.error("🛑 [SectionAI] Error:", error.message);
        throw new Error(`Error al generar sección: ${error.message}`);
    }
}
