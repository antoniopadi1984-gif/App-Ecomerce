"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { askGemini } from "@/lib/ai";
import { EXPERT_PROMPT_TEMPLATES } from "@/lib/marketing-engine";

/**
 * Creative Blueprint: The Strategic Mandatory First Step
 */

export async function generateBlueprint(storeId: string, productId: string) {
    try {
        const product = await (prisma.product as any).findUnique({
            where: { id: productId },
            include: {
                avatars: { orderBy: { createdAt: 'desc' }, take: 1 },
                vocQuotes: true
            }
        });

        if (!product) throw new Error("Producto no encontrado");

        const researchContext = (product as any).avatars[0]
            ? `Avatar: ${(product as any).avatars[0].desires} / Fears: ${(product as any).avatars[0].fears}`
            : "No hay investigación previa profunda.";

        const vocContext = (product as any).vocQuotes.map((q: any) => q.text).join("\n").substring(0, 3000);

        const blueprintPrompt = `
            Actúa como un Director Creativo Senior. Genera un "CREATIVE BLUEPRINT" mandatorio para el producto: ${product.title}.
            
            CONTEXTO DE INVESTIGACIÓN:
            ${researchContext}
            
            VOZ DEL CLIENTE (VOC):
            ${vocContext}
            
            OBJETIVO: Crear la base estratégica de la que saldrán todos los vídeos, anuncios y landings.
            
            NECESITO (JSON):
            {
               "avatarSegment": "Definición ultra-específica del segmento",
               "levelOfAwareness": "Nivel de consciencia (1-5)",
               "mainAngle": "Ángulo de ataque principal",
               "secondaryAngles": ["Ángulo 2", "Ángulo 3"],
               "centralClaim": "La promesa única e irresistible",
               "criticalObjection": "La objeción n.º 1 que mata la venta",
               "recommendedCTA": "CTA específico orientado a este avatar",
               "complianceRisks": ["Riesgo 1", "Riesgo 2"]
            }
        `;

        const aiResponse = await askGemini(blueprintPrompt, "Eres un estratega de marketing de élite.");
        const blueprintData = JSON.parse(aiResponse.text.match(/\{[\s\S]*\}/)?.[0] || "{}");

        const blueprint = await (prisma as any).creativeBlueprint.create({
            data: {
                storeId,
                productId,
                avatarSegment: blueprintData.avatarSegment,
                levelOfAwareness: blueprintData.levelOfAwareness,
                mainAngle: blueprintData.mainAngle,
                secondaryAngles: JSON.stringify(blueprintData.secondaryAngles),
                centralClaim: blueprintData.centralClaim,
                criticalObjection: blueprintData.criticalObjection,
                recommendedCTA: blueprintData.recommendedCTA,
                complianceRisks: JSON.stringify(blueprintData.complianceRisks)
            }
        });

        revalidatePath("/marketing/creative-lab");
        return blueprint;
    } catch (error: any) {
        console.error("🛑 [Blueprint] Error:", error.message);
        throw new Error(`Error al generar Blueprint: ${error.message}`);
    }
}

export async function generateCopyContract(productId: string) {
    try {
        const product = await (prisma.product as any).findUnique({
            where: { id: productId },
            include: {
                researchRuns: { orderBy: { createdAt: 'desc' }, take: 1 },
                vocQuotes: { take: 20 }
            }
        });

        if (!product) throw new Error("Producto no encontrado");

        const lastRun = product.researchRuns[0];
        const researchContext = lastRun
            ? `Summary: ${lastRun.summary}\nMatrix: ${lastRun.avatarMatrix}\nMechanism: ${lastRun.marketMechanism}`
            : "No hay investigación profunda reciente.";

        const prompt = EXPERT_PROMPT_TEMPLATES.COPY_CONTRACT
            .replace("{{researchContext}}", researchContext)
            .replace("{{productTitle}}", product.title);

        const aiResponse = await askGemini(prompt, "Eres un estratega de marketing de élite.");
        const data = JSON.parse(aiResponse.text.match(/\{[\s\S]*\}/)?.[0] || "{}");

        const contract = await (prisma as any).copyContract.create({
            data: {
                productId,
                researchRunId: lastRun?.id,
                avatarSegment: data.avatarSegment,
                awarenessLevel: data.awareness,
                sophistication: String(data.sophistication),
                mechanism: data.mechanism,
                mainAngle: data.mainAngle,
                dreamOutcome: data.valueEquation.dreamOutcome,
                perceivedProb: data.valueEquation.perceivedLikelihood,
                timeDelay: data.valueEquation.timeDelay,
                effortSacrifice: data.valueEquation.effortSacrifice,
                psychologicalTriggers: JSON.stringify(data.triggers),
                promisesAllowed: JSON.stringify(data.promisesAllowed),
                promisesProhibited: JSON.stringify(data.promisesProhibited),
                objectionToKill: data.objectionToKill,
                proofRequired: data.proofType,
                ctaAllowed: data.cta,
                tone: data.tone,
                status: "ACTIVE"
            }
        });

        revalidatePath("/marketing/creative-lab");
        return contract;
    } catch (error: any) {
        throw new Error(`Error al generar Contrato: ${error.message}`);
    }
}

export async function lintCopy(contractId: string, copy: string) {
    try {
        const contract = await (prisma as any).copyContract.findUnique({ where: { id: contractId } });
        if (!contract) throw new Error("Contrato no encontrado");

        const prompt = EXPERT_PROMPT_TEMPLATES.COPY_LINT
            .replace("{{contract}}", JSON.stringify(contract))
            .replace("{{copy}}", copy);

        const res = await askGemini(prompt, "Eres el Inspector de Calidad de Copy.");
        return JSON.parse(res.text.match(/\{[\s\S]*\}/)?.[0] || "{}");
    } catch (error: any) {
        throw new Error(`Error en Copy Lint: ${error.message}`);
    }
}

export async function getContracts(productId: string) {
    return await (prisma as any).copyContract.findMany({
        where: { productId },
        orderBy: { createdAt: 'desc' }
    });
}
