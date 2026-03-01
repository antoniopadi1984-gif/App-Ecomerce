"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getAlertRules(storeId: string) {
    return await prisma.alertRule.findMany({
        where: { storeId },
        orderBy: { createdAt: "desc" }
    });
}

export async function createAlertRule(data: {
    storeId: string;
    scope: string;
    field: string;
    operator: string;
    threshold: number;
    label: string;
}) {
    const rule = await prisma.alertRule.create({
        data: {
            ...data,
            enabled: true
        }
    });
    revalidatePath("/settings/alerts");
    return rule;
}

export async function deleteAlertRule(id: string) {
    await prisma.alertRule.delete({ where: { id } });
    revalidatePath("/settings/alerts");
}

export async function toggleAlertRule(id: string, enabled: boolean) {
    await prisma.alertRule.update({
        where: { id },
        data: { enabled }
    });
    revalidatePath("/settings/alerts");
}
