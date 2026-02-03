"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function logAgentAction(storeId: string, actionData: {
    type: string,
    impactMetric?: string,
    impactValue?: number,
    details?: any
}) {
    try {
        await (prisma as any).agentAction.create({
            data: {
                storeId,
                actionType: actionData.type,
                impactMetric: actionData.impactMetric,
                impactValue: actionData.impactValue,
                details: JSON.stringify(actionData.details || {}),
                actorType: 'IA'
            }
        });

        // Update daily metrics
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (actionData.impactMetric === 'SALE_CONFIRMED') {
            await (prisma as any).botMetric.upsert({
                where: { storeId_botId_date: { storeId, botId: 'CLOWDBOT', date: today } },
                update: {
                    ordersAssisted: { increment: 1 },
                    revenueAssisted: { increment: actionData.impactValue || 0 }
                },
                create: { storeId, botId: 'CLOWDBOT', date: today, ordersAssisted: 1, revenueAssisted: actionData.impactValue || 0 }
            });
        }

        revalidatePath(`/marketing/clowdbot`);
    } catch (e: any) {
        console.error("Error logging agent action:", e);
    }
}

export async function logHumanCorrection(storeId: string, correction: {
    context: string,
    originalResponse: string,
    humanText: string,
    reasoning?: string
}) {
    try {
        await (prisma as any).agentCorrection.create({
            data: {
                storeId,
                originalContext: correction.context,
                originalResponse: correction.originalResponse,
                humanCorrection: correction.humanText,
                reasoning: correction.reasoning
            }
        });

        revalidatePath(`/marketing/clowdbot`);
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function getClowdbotStats(storeId: string) {
    const [actions, corrections, metrics] = await Promise.all([
        (prisma as any).agentAction.findMany({ where: { storeId }, orderBy: { createdAt: 'desc' }, take: 10 }),
        (prisma as any).agentCorrection.findMany({ where: { storeId }, orderBy: { learnedAt: 'desc' }, take: 5 }),
        (prisma as any).botMetric.findMany({ where: { storeId }, orderBy: { date: 'desc' }, take: 7 })
    ]);

    return { actions, corrections, metrics };
}
