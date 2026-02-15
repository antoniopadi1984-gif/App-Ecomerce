/**
 * getActiveConnection — Resolver de conexiones por store.
 *
 * Regla: si hay Connection activa del store → usarla.
 *        Si no hay → devolver null (caller decide si STUB/FAIL).
 *
 * Nunca lee .env directamente para credenciales de provider
 * (excepto REPLICATE_API_TOKEN que es global, no per-store).
 */

import prisma from "@/lib/prisma";

export interface ConnectionCredentials {
    provider: string;
    apiKey: string | null;
    apiSecret: string | null;
    accessToken: string | null;
    webhookSecret: string | null;
    webhookUrl: string | null;
    extraConfig: Record<string, any> | null;
    connectionId: string;
}

/**
 * Obtener credenciales de una conexión activa por store y provider.
 */
export async function getActiveConnection(
    storeId: string,
    provider: string
): Promise<ConnectionCredentials | null> {
    const connection = await prisma.connection.findFirst({
        where: {
            storeId,
            provider: provider.toUpperCase(),
            isActive: true,
        },
    });

    if (!connection) return null;

    let extraConfig: Record<string, any> | null = null;
    if (connection.extraConfig) {
        try {
            extraConfig = JSON.parse(connection.extraConfig);
        } catch (_) {
            extraConfig = null;
        }
    }

    return {
        provider: connection.provider,
        apiKey: connection.apiKey,
        apiSecret: connection.apiSecret,
        accessToken: connection.accessToken,
        webhookSecret: connection.webhookSecret,
        webhookUrl: connection.webhookUrl,
        extraConfig,
        connectionId: connection.id,
    };
}

/**
 * Obtener todas las conexiones activas de un store.
 */
export async function getStoreConnections(storeId: string) {
    const connections = await prisma.connection.findMany({
        where: { storeId, isActive: true },
        select: {
            id: true,
            provider: true,
            isActive: true,
            lastSyncedAt: true,
            createdAt: true,
            // NO devolver apiKey, apiSecret, accessToken, webhookSecret
        },
    });

    return connections;
}

/**
 * Verificar si un store tiene una conexión activa para un provider.
 */
export async function hasActiveConnection(
    storeId: string,
    provider: string
): Promise<boolean> {
    const count = await prisma.connection.count({
        where: {
            storeId,
            provider: provider.toUpperCase(),
            isActive: true,
        },
    });
    return count > 0;
}
