"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
    saveConnectionSecret,
    deleteConnection as deleteConnectionCanonical,
    getStoreConnections,
    getConnectionMeta
} from "@/lib/server/connections";

/**
 * Guarda o actualiza una conexión utilizando el sistema de cifrado canonical.
 */
export async function saveConnection(formData: FormData, storeId?: string) {
    const providerId = formData.get("provider") as string;

    // Lazy load registry to avoid issues if used on client? No, actions are server.
    const { PROVIDER_REGISTRY } = await import("@/lib/providers/registry");
    const config = PROVIDER_REGISTRY[providerId];

    if (!config) {
        return { success: false, message: "Provedor no válido" };
    }

    try {
        let secret = "";
        let extraConfig: any = {};

        // Parse fields dynamically
        for (const field of config.fields) {
            const value = formData.get(field.key) as string;
            if (field.type === 'password') {
                if (!secret || ['apiKey', 'accessToken', 'apiSecret', 'apiToken', 'SHOPIFY_ACCESS_TOKEN'].includes(field.key)) {
                    secret = value;
                }
            } else {
                extraConfig[field.key] = value;
            }
        }

        // ─── LÓGICA DE TIENDA DINÁMICA V14.0 ───
        let resolvedStoreId = storeId;

        if (providerId === 'SHOPIFY') {
            const shopName = formData.get("SHOP_NAME") as string;
            const shopDomain = formData.get("SHOPIFY_SHOP_DOMAIN") as string;

            if (!shopName || !shopDomain) throw new Error("Nombre y Dominio de tienda son obligatorios para Shopify");

            // Upsert store by domain
            const store = await prisma.store.upsert({
                where: { id: (await prisma.store.findFirst({ where: { domain: shopDomain } }))?.id || 'NEW_STORE' },
                create: {
                    name: shopName,
                    domain: shopDomain,
                    currency: "EUR"
                },
                update: {
                    name: shopName
                }
            });
            resolvedStoreId = store.id;
        }

        if (!resolvedStoreId) {
            resolvedStoreId = (await prisma.store.findFirst())?.id;
        }

        if (!resolvedStoreId) throw new Error("No hay tienda disponible para vincular el servicio");

        // Special handling for Service Accounts (Textarea) which are secrets but maybe too large?
        if (config.id.startsWith('GOOGLE') || config.id === 'GA4') {
            const jsonKey = formData.get('serviceAccountJson') as string;
            if (jsonKey) {
                secret = jsonKey;
            }
        }

        // If secret is empty, check if we want to preserve existing
        if (!secret) {
            const existing = await getConnectionMeta(resolvedStoreId, providerId);
            if (existing) {
                // Only update extraConfig
                await (prisma as any).connection.update({
                    where: { storeId_provider: { storeId: resolvedStoreId, provider: providerId } },
                    data: { extraConfig: JSON.stringify(extraConfig) }
                });
                revalidatePath("/connections");
                return { success: true, message: "Configuración actualizada (secreto preservado)" };
            }
        }

        await saveConnectionSecret({
            storeId: resolvedStoreId,
            provider: providerId,
            secret: secret || "",
            extraConfig
        });

        // ─── AUTO-TRIGGER DEEP SYNC V15.0 ───
        if (providerId === 'SHOPIFY') {
            try {
                const { createJob } = await import("@/lib/worker");
                await createJob('SHOPIFY_SYNC', { storeId: resolvedStoreId });
                console.log(`🚀 [Connection] Immediate Deep Sync triggered for store: ${resolvedStoreId}`);
            } catch (e) {
                console.error("❌ [Connection] Failed to trigger immediate sync job:", e);
            }
        }

        revalidatePath("/connections");
        return { success: true };
    } catch (error: any) {
        console.error("Error saving connection:", error);
        return { success: false, message: error.message };
    }
}

/**
 * Lista conexiones activas (proxy a canonical).
 */
export async function getActiveConnections(storeId?: string) {
    const resolvedStoreId = storeId || (await prisma.store.findFirst())?.id;
    if (!resolvedStoreId) return [];
    return getStoreConnections(resolvedStoreId);
}

/**
 * Elimina una conexión (proxy a canonical con auditoría interna).
 */
export async function deleteConnection(id: string) {
    try {
        const result = await deleteConnectionCanonical(id);
        revalidatePath("/connections");
        return result;
    } catch (error: any) {
        console.error("Error deleting connection:", error);
        return { success: false, message: error.message };
    }
}
