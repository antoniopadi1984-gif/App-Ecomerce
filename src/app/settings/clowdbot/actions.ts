"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getAgentProfiles(storeId: string) {
    return await (prisma as any).agentProfile.findMany({
        where: { storeId },
        orderBy: { createdAt: 'desc' }
    });
}

export async function saveAgentProfile(storeId: string, data: any) {
    const { id, ...profileData } = data;

    const payload = {
        storeId,
        name: profileData.name,
        role: profileData.role,
        instructions: profileData.instructions,
        tone: profileData.tone,
        channels: JSON.stringify(profileData.channels || []),
        menus: JSON.stringify(profileData.menus || []),
        isActive: profileData.isActive ?? true
    };

    let profile;
    if (id) {
        profile = await (prisma as any).agentProfile.update({
            where: { id },
            data: payload
        });
    } else {
        profile = await (prisma as any).agentProfile.create({
            data: payload
        });
    }

    revalidatePath("/settings/clowdbot");
    return profile;
}

export async function deleteAgentProfile(id: string) {
    await (prisma as any).agentProfile.delete({
        where: { id }
    });
    revalidatePath("/settings/clowdbot");
}

export async function getAgentPerformance(storeId: string, period: 'day' | 'week' | 'month' = 'day') {
    const runs = await (prisma as any).agentRun.findMany({
        where: { storeId },
        include: { actions: true, agent: true }
    });

    const humanActions = await (prisma as any).agentAction.findMany({
        where: { storeId, actorType: 'HUMAN' }
    });

    const stats = {
        ia: {
            runs: runs.length,
            actions: runs.reduce((acc: number, r: any) => acc + r.actions.length, 0),
            confirmations: runs.reduce((acc: number, r: any) => acc + r.actions.filter((a: any) => a.actionType === 'SALE_CONFIRMED').length, 0),
            avgLatency: runs.length > 0 ? runs.reduce((acc: number, r: any) => acc + (r.latency || 0), 0) / runs.length : 0
        },
        human: {
            actions: humanActions.length,
            confirmations: humanActions.filter((a: any) => a.actionType === 'SALE_CONFIRMED').length,
            avgResponseTime: 0 // Mocked for now
        }
    };

    return stats;
}
