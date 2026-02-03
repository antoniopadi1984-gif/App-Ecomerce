"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function saveConnection(formData: FormData) {
    const provider = formData.get("provider") as string;
    const apiKey = formData.get("apiKey") as string;
    const apiSecret = formData.get("apiSecret") as string;
    const extraConfig = formData.get("extraConfig") as string;

    try {
        // Ensure store exists
        let store = await prisma.store.findFirst();
        if (!store) {
            store = await prisma.store.create({
                data: { id: "default-store", name: "Nano Banana Store", currency: "EUR" }
            });
        }
        const storeId = store.id;

        await prisma.connection.upsert({
            where: {
                storeId_provider: {
                    storeId: store.id,
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
                storeId: store.id,
                provider,
                apiKey,
                apiSecret,
                extraConfig,
                isActive: true
            }
        });

        revalidatePath("/connections");
        // Returning void or a simple object works, but TS in client components can be picky
    } catch (error) {
        console.error("Error saving connection:", error);
    }
}

export async function getActiveConnections() {
    return prisma.connection.findMany({
        where: { isActive: true }
    });
}
export async function deleteConnection(id: string) {
    await prisma.connection.delete({
        where: { id }
    });
    revalidatePath("/connections");
}
