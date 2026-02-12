"use server";

import { prisma as db } from "@/lib/prisma";

export async function getTeamData() {
    try {
        // Fetch Store ID (assuming single store for now)
        const store = await db.store.findFirst();
        if (!store) throw new Error("No store found");

        const [agents, users] = await Promise.all([
            db.agentProfile.findMany({
                where: { storeId: store.id },
                orderBy: { createdAt: 'desc' }
            }),
            db.userStoreAccess.findMany({
                where: { storeId: store.id },
                include: { user: true }
            })
        ]);

        return {
            success: true,
            agents,
            users: users.map(u => ({
                id: u.userId,
                name: u.user.name,
                email: u.user.email,
                role: u.role,
                avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${u.user.name}`
            }))
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function inviteTeamMember(email: string, role: string) {
    // Mock invitation
    return { success: true, message: `Invitación enviada a ${email}` };
}

export async function createAgent(data: { name: string, role: string }) {
    try {
        const store = await db.store.findFirst();
        if (!store) throw new Error("No store found");

        const agent = await db.agentProfile.create({
            data: {
                storeId: store.id,
                name: data.name,
                role: data.role,
                instructions: "Default instructions",
                isActive: true
            }
        });
        return { success: true, agent };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}
