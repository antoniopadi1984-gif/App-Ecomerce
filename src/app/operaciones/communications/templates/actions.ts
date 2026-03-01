"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getTemplates() {
    try {
        const templates = await prisma.notificationTemplate.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return { success: true, data: templates };
    } catch (error) {
        console.error("Error fetching templates:", error);
        return { success: false, error: "Failed to fetch templates" };
    }
}

export async function upsertTemplate(data: {
    id?: string;
    name: string;
    trigger: string;
    channel: string;
    body: string;
    isEnabled: boolean;
}) {
    try {
        const store = await prisma.store.findFirst();
        if (!store) throw new Error("Store not found");

        if (data.id) {
            await prisma.notificationTemplate.update({
                where: { id: data.id },
                data: {
                    name: data.name,
                    trigger: data.trigger,
                    channel: data.channel,
                    body: data.body,
                    isEnabled: data.isEnabled
                }
            });
        } else {
            await prisma.notificationTemplate.create({
                data: {
                    storeId: store.id,
                    name: data.name,
                    trigger: data.trigger,
                    channel: data.channel,
                    body: data.body,
                    isEnabled: data.isEnabled
                }
            });
        }
        revalidatePath("/communications/templates");
        return { success: true };
    } catch (error) {
        console.error("Error upserting template:", error);
        return { success: false, error: "Failed to save template" };
    }
}

export async function deleteTemplate(id: string) {
    try {
        await prisma.notificationTemplate.delete({
            where: { id }
        });
        revalidatePath("/communications/templates");
        return { success: true };
    } catch (error) {
        console.error("Error deleting template:", error);
        return { success: false, error: "Failed to delete template" };
    }
}
