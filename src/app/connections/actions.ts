"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
    saveConnectionSecret,
    deleteConnection as deleteConnectionCanonical,
    getStoreConnections,
    getConnectionMeta
} from "@/lib/server/connections";

import { PROVIDER_REGISTRY } from "@/lib/providers/registry";
import * as fs from "fs";
import * as path from "path";

/**
 * Guarda o actualiza una conexión utilizando el sistema de cifrado canonical.
 */
export async function saveConnection(formData: FormData, storeId?: string) {
    const rawProviderId = formData.get("provider") as string;
    const providerId = rawProviderId?.toUpperCase() || "";

    const logPath = path.join(process.cwd(), 'actions-debug.log');
    const logMsg = `[${new Date().toISOString()}] ACTION saveConnection: raw="${rawProviderId}" normalized="${providerId}" keys=[${Array.from(formData.keys()).join(",")}]\n`;
    fs.appendFileSync(logPath, logMsg);

    console.log(`[ACTION saveConnection] Provider received: "${rawProviderId}" -> Normalized: "${providerId}"`);
    console.log(`[ACTION saveConnection] FormData keys:`, Array.from(formData.keys()));

    const config = PROVIDER_REGISTRY[providerId];

    if (!config) {
        return { success: false, message: "Proveedor no válido" };
    }

    try {
        const editingId = formData.get("editingId") as string;
        let secret = "";
        let extraConfig: any = {};

        // 1. Resolve Canonical Provider (if child, use parent)
        let targetProviderId = providerId.toUpperCase();
        if (config.parentProviderId) {
            targetProviderId = config.parentProviderId.toUpperCase();
        }

        // Parse fields dynamically
        for (const field of config.fields) {
            const value = formData.get(field.key) as string;
            if (field.type === 'password') {
                if (value && (!secret || ['apiKey', 'accessToken', 'apiSecret', 'apiToken', 'SHOPIFY_ACCESS_TOKEN', 'REPLICATE_API_TOKEN', 'GOOGLE_SERVICE_ACCOUNT_KEY'].includes(field.key))) {
                    secret = value;
                }
            } else {
                extraConfig[field.key] = value;
            }
        }

        // ─── LÓGICA DE TIENDA DINÁMICA ───
        let resolvedStoreId = 'store-main';

        if (providerId === 'SHOPIFY') {
            const shopName = formData.get("SHOP_NAME") as string;
            const shopDomain = formData.get("SHOPIFY_SHOP_DOMAIN") as string;

            if (!shopName || !shopDomain) throw new Error("Nombre y Dominio de tienda son obligatorios para Shopify");

            const store = await prisma.store.upsert({
                where: { id: (await prisma.store.findFirst({ where: { domain: shopDomain } }))?.id || 'NEW_STORE' },
                create: { name: shopName, domain: shopDomain, currency: "EUR" },
                update: { name: shopName }
            });
            resolvedStoreId = store.id;
        }

        if (resolvedStoreId === 'store-main') {
            await prisma.store.upsert({
                where: { id: 'store-main' },
                create: { id: 'store-main', name: 'Workspace Global', currency: 'EUR' },
                update: {}
            });
        }

        // Special handling for Service Accounts
        const jsonKey = formData.get('GOOGLE_SERVICE_ACCOUNT_KEY') as string;
        if (jsonKey && jsonKey.includes('{')) {
            secret = jsonKey;
        }

        const dbProviderId = targetProviderId;

        // If we have an editingId, we target that specific row
        if (editingId) {
            const updateData: any = {
                extraConfig: JSON.stringify(extraConfig),
                updatedAt: new Date()
            };
            if (secret) {
                // We need to re-encrypt if secret is provided
                const { encryptSecret } = await import("@/lib/server/crypto");
                const { enc, iv, tag } = encryptSecret(secret);
                updateData.secretEnc = enc;
                updateData.secretIv = iv;
                updateData.secretTag = tag;
            }

            await (prisma as any).connection.update({
                where: { id: editingId },
                data: updateData
            });
        } else {
            // New or Upsert by store/provider
            await saveConnectionSecret({
                storeId: resolvedStoreId,
                provider: dbProviderId,
                secret: secret || "",
                extraConfig
            });
        }

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
