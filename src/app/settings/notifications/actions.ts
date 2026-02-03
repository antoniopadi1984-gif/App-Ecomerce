"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getTemplates() {
    try {
        const templates = await prisma.notificationTemplate.findMany({
            where: { storeId: "default-store" }
        });
        return templates;
    } catch (error) {
        console.error(error);
        return [];
    }
}

export async function updateTemplate(id: string, body: string, isEnabled: boolean) {
    try {
        await prisma.notificationTemplate.update({
            where: { id },
            data: { body, isEnabled }
        });
        revalidatePath("/settings/notifications");
        return { success: true, message: "Plantilla actualizada" };
    } catch (error) {
        return { success: false, message: "Error actualizando plantilla" };
    }
}
