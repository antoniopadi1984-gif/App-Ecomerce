"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { logAudit } from "@/lib/audit";

export async function saveConnection(formData: FormData, storeId?: string) {
    const provider = formData.get("provider") as string;
    const apiKey = formData.get("apiKey") as string;
    const apiSecret = formData.get("apiSecret") as string;
    const extraConfig = formData.get("extraConfig") as string;

    try {
        // Resolver store
        const resolvedStoreId = storeId || (await prisma.store.findFirst())?.id;
        if (!resolvedStoreId) throw new Error("No hay tienda disponible");

        const existing = await prisma.connection.findUnique({
            where: { storeId_provider: { storeId: resolvedStoreId, provider } }
        });

        await prisma.connection.upsert({
            where: {
                storeId_provider: {
                    storeId: resolvedStoreId,
                    provider: provider
                }
            },
            update: {
                apiKey,
                apiSecret,
                extraConfig,
                isActive: true,
                updatedAt: new Date()
            },
            create: {
                storeId: resolvedStoreId,
                provider,
                apiKey,
                apiSecret,
                extraConfig,
                isActive: true
            }
        });

        await logAudit({
            storeId: resolvedStoreId,
            action: existing ? "CONNECTION_UPDATED" : "CONNECTION_CREATED",
            entity: "CONNECTION",
            entityId: provider,
            oldValue: existing ? { isActive: existing.isActive } : null,
            newValue: { provider, isActive: true },
        });

        revalidatePath("/connections");
    } catch (error) {
        console.error("Error saving connection:", error);
    }
}

export async function getActiveConnections(storeId?: string) {
    const resolvedStoreId = storeId || (await prisma.store.findFirst())?.id;
    return prisma.connection.findMany({
        where: {
            isActive: true,
            ...(resolvedStoreId ? { storeId: resolvedStoreId } : {}),
        }
    });
}

export async function deleteConnection(id: string) {
    const existing = await prisma.connection.findUnique({ where: { id } });

    await prisma.connection.delete({
        where: { id }
    });

    if (existing) {
        await logAudit({
            storeId: existing.storeId,
            action: "CONNECTION_DELETED",
            entity: "CONNECTION",
            entityId: existing.provider,
            oldValue: { provider: existing.provider, isActive: existing.isActive },
        });
    }

    revalidatePath("/connections");
}
