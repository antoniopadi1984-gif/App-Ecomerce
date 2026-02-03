"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getClowdbotConfig() {
    try {
        const store = await prisma.store.findFirst();
        if (!store) return null;

        let config = await (prisma as any).clowdbotConfig.findUnique({
            where: { storeId: store.id }
        });

        if (!config) {
            config = await (prisma as any).clowdbotConfig.create({
                data: {
                    storeId: store.id,
                    agentName: "Clowdbot",
                    agentRole: "Especialista en Atención al Cliente",
                    agentEmail: "admin@ecombom.com",
                    isActive: false,
                    channels: "WHATSAPP,EMAIL"
                }
            });
        }

        return { success: true, data: config };
    } catch (error) {
        console.error("Error getting Clowdbot config:", error);
        return { success: false, error: "Error al cargar configuración" };
    }
}

export async function updateClowdbotConfig(data: {
    agentName?: string;
    agentRole?: string;
    agentEmail?: string;
    isActive?: boolean;
    knowledgeBase?: string;
    smtpHost?: string;
    smtpPort?: number;
    smtpUser?: string;
    smtpPass?: string;
    roleKnowledge?: string;
    channels?: string;
    humanInterventionAlert?: boolean;
    notificationWebhook?: string;
    isFinancialExpert?: boolean;
    targetProfitMargin?: number;
}) {
    try {
        const store = await prisma.store.findFirst();
        if (!store) return { success: false, error: "No se encontró la tienda" };

        await (prisma as any).clowdbotConfig.upsert({
            where: { storeId: store.id },
            update: {
                agentName: data.agentName,
                agentRole: data.agentRole,
                agentEmail: data.agentEmail,
                isActive: data.isActive,
                knowledgeBase: data.knowledgeBase,
                channels: data.channels,
                humanInterventionAlert: data.humanInterventionAlert,
                notificationWebhook: data.notificationWebhook,
                smtpHost: data.smtpHost,
                smtpPort: data.smtpPort,
                smtpUser: data.smtpUser,
                smtpPass: data.smtpPass,
                roleKnowledge: data.roleKnowledge,
                isFinancialExpert: data.isFinancialExpert,
            },
            create: {
                storeId: store.id,
                agentName: data.agentName || "Clowdbot",
                agentRole: data.agentRole || "Especialista",
                agentEmail: data.agentEmail || "admin@ecombom.com",
                isActive: data.isActive || false,
                knowledgeBase: data.knowledgeBase,
                channels: data.channels || "WHATSAPP,EMAIL",
                humanInterventionAlert: data.humanInterventionAlert ?? true,
                notificationWebhook: data.notificationWebhook,
                smtpHost: data.smtpHost,
                smtpPort: data.smtpPort,
                smtpUser: data.smtpUser,
                smtpPass: data.smtpPass,
                roleKnowledge: data.roleKnowledge,
                isFinancialExpert: data.isFinancialExpert || false,
            }
        });

        // Also update Store targetProfitMargin
        if (data.targetProfitMargin !== undefined) {
            await prisma.store.update({
                where: { id: store.id },
                data: { targetProfitMargin: data.targetProfitMargin }
            });
        }

        revalidatePath("/marketing/clowdbot-lab");
        revalidatePath("/communications/inbox");
        return { success: true };
    } catch (error) {
        console.error("Error updating Clowdbot config:", error);
        return { success: false, error: "Error al guardar configuración" };
    }
}

export async function getWhatsAppAccounts() {
    try {
        const store = await prisma.store.findFirst();
        if (!store) return { success: false, data: [] };

        const accounts = await (prisma as any).whatsAppAccount.findMany({
            where: { storeId: store.id },
            orderBy: { createdAt: 'desc' }
        });

        return { success: true, data: accounts };
    } catch (error) {
        return { success: false, data: [] };
    }
}

export async function addWhatsAppAccount(data: { name: string, type: string, phoneNumber: string, accessToken?: string, phoneId?: string, businessAccountId?: string }) {
    try {
        const store = await prisma.store.findFirst();
        if (!store) return { success: false, error: "Store not found" };

        await (prisma as any).whatsAppAccount.create({
            data: {
                ...data,
                storeId: store.id
            }
        });

        revalidatePath("/marketing/clowdbot-lab");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Error creating account" };
    }
}

export async function deleteWhatsAppAccount(id: string) {
    try {
        await (prisma as any).whatsAppAccount.delete({ where: { id } });
        revalidatePath("/marketing/clowdbot-lab");
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}
