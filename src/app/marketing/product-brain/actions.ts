"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { askGemini } from "@/lib/ai";
import { MaturityScore } from "@/lib/marketing-engine";

/**
 * Level 1: Memory Graph & Maturity
 */

export async function syncKnowledgeGraph(productId: string) {
    try {
        // 1. Fetch current data
        const [research, runs, angles, contracts, projects] = await Promise.all([
            (prisma as any).avatarResearch.findFirst({ where: { productId }, orderBy: { createdAt: 'desc' } }),
            (prisma as any).researchRun.findMany({ where: { productId }, orderBy: { createdAt: 'desc' } }),
            (prisma as any).marketingAngle.findMany({ where: { productId } }),
            (prisma as any).copyContract.findMany({ where: { productId } }),
            (prisma as any).creativeProject.findMany({ where: { productId } })
        ]);

        // 2. Map existing data to KnowledgeNodes (Idempotent)
        // This is a complex logic that would normally involve an Agent to "extract" wisdom.
        // For now, we sync established entities.

        const brainPrompt = `
            Actúa como el Arquitecto de Conocimiento de Ecombom.
            Analiza estas entidades y define RELACIONES lógicas entre ellas para un Knowledge Graph.
            
            ÁNGULOS: ${JSON.stringify(angles.map((a: any) => ({ id: a.id, title: a.title, hook: a.hook })))}
            CONTRATOS: ${JSON.stringify(contracts.map((c: any) => ({ id: c.id, angle: c.mainAngle })))}
            PROYECTOS: ${JSON.stringify(projects.map((p: any) => ({ id: p.id, name: p.name })))}
            
            NECESITO RELACIONES (JSON):
            {
               "nodes": [
                  { "externalId": "...", "type": "ANGLE/CONTRACT/PROJECT", "label": "..." }
               ],
               "links": [
                  { "sourceId": "...", "targetId": "...", "type": "USES/RESPONDS_TO/CONVERTS", "explanation": "..." }
               ]
            }
        `;

        const res = await askGemini(brainPrompt, "Eres el cerebro del sistema.");
        const data = JSON.parse((res.text || "").match(/\{[\s\S]*\}/)?.[0] || "{}");

        // Save nodes and links
        for (const node of data.nodes || []) {
            await (prisma as any).knowledgeNode.upsert({
                where: { id: node.externalId }, // We use externalId as ID for simplicity in sync
                update: { contentJson: JSON.stringify(node) },
                create: {
                    id: node.externalId,
                    productId,
                    type: node.type,
                    contentJson: JSON.stringify(node)
                }
            });
        }

        for (const link of data.links || []) {
            await (prisma as any).knowledgeLink.create({
                data: {
                    sourceId: link.sourceId,
                    targetId: link.targetId,
                    relationType: link.type,
                    explanation: link.explanation
                }
            });
        }

        revalidatePath(`/marketing/product-brain`);
        return { success: true };
    } catch (e: any) {
        console.error("Brain Sync Error:", e);
        return { success: false, error: e.message };
    }
}

export async function calculateMaturityScore(productId: string): Promise<MaturityScore> {
    const [research, runs, angles, contracts, creatives, landingProjects, deliveryLogs] = await Promise.all([
        (prisma as any).avatarResearch.count({ where: { productId } }),
        (prisma as any).researchRun.count({ where: { productId } }),
        (prisma as any).marketingAngle.count({ where: { productId } }),
        (prisma as any).copyContract.count({ where: { productId } }),
        (prisma as any).creativeAsset.count({ where: { productId } }),
        (prisma as any).landingProject.count({ where: { productId } }),
        (prisma as any).contentDeliveryLog.count({ where: { storeId: productId } }) // Placeholder logic
    ]);

    const scores = {
        research: Math.min(research * 0.5 + runs * 0.2, 1),
        avatar: Math.min(research > 0 ? 1 : 0, 1),
        landing: Math.min(landingProjects * 0.5, 1),
        creatives: Math.min(creatives / 5, 1),
        postVenta: Math.min(deliveryLogs / 10, 1),
        overall: 0
    };

    scores.overall = (scores.research + scores.avatar + scores.landing + scores.creatives + scores.postVenta) / 5;

    await (prisma as any).productMaturity.upsert({
        where: { productId },
        update: { scoresJson: JSON.stringify(scores), lastCalculatedAt: new Date() },
        create: { productId, scoresJson: JSON.stringify(scores) }
    });

    return scores;
}

export async function getBrainData(productId: string) {
    const [nodes, links, maturity] = await Promise.all([
        (prisma as any).knowledgeNode.findMany({ where: { productId } }),
        (prisma as any).knowledgeLink.findMany({
            where: {
                source: { productId }
            }
        }),
        (prisma as any).productMaturity.findUnique({ where: { productId } })
    ]);

    return {
        nodes: nodes.map((n: any) => ({ ...n, content: JSON.parse(n.contentJson || '{}') })),
        links,
        maturity: maturity ? JSON.parse(maturity.scoresJson) : null
    };
}
