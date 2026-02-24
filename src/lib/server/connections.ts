import { prisma } from "@/lib/prisma";
import { encryptSecret, decryptSecret } from "./crypto";

/**
 * saveConnectionSecret — Guarda un secreto cifrado para un proveedor específico.
 */
export async function saveConnectionSecret({
    storeId,
    provider,
    secret,
    extraConfig
}: {
    storeId: string;
    provider: string;
    secret: string;
    extraConfig?: any;
}) {
    const { enc, iv, tag } = encryptSecret(secret);

    return await (prisma as any).connection.upsert({
        where: {
            storeId_provider: {
                storeId,
                provider: provider.toUpperCase()
            }
        },
        update: {
            secretEnc: enc,
            secretIv: iv,
            secretTag: tag,
            extraConfig: extraConfig ? (typeof extraConfig === 'string' ? extraConfig : JSON.stringify(extraConfig)) : undefined,
            isActive: true,
            updatedAt: new Date()
        },
        create: {
            storeId,
            provider: provider.toUpperCase(),
            secretEnc: enc,
            secretIv: iv,
            secretTag: tag,
            extraConfig: extraConfig ? (typeof extraConfig === 'string' ? extraConfig : JSON.stringify(extraConfig)) : undefined,
            isActive: true
        }
    });
}

/**
 * getConnectionSecret — Recupera y desencripta el secreto.
 */
export async function getConnectionSecret(storeId: string, provider: string): Promise<string | null> {
    const conn = await (prisma as any).connection.findFirst({
        where: { storeId, provider: provider.toUpperCase() }
    });

    if (!conn || !conn.secretEnc || !conn.secretIv || !conn.secretTag) {
        return null;
    }

    try {
        return decryptSecret({
            enc: conn.secretEnc,
            iv: conn.secretIv,
            tag: conn.secretTag
        });
    } catch (err) {
        console.error(`[getConnectionSecret] Error decrypting for ${provider}:`, err);
        return null;
    }
}

/**
 * getConnectionMeta — Recupera metadata pública de una conexión.
 */
export async function getConnectionMeta(storeId: string, provider: string) {
    return await (prisma as any).connection.findFirst({
        where: { storeId, provider: provider.toUpperCase() },
        select: {
            id: true,
            provider: true,
            isActive: true,
            lastSyncedAt: true,
            updatedAt: true,
            extraConfig: true
        }
    });
}

/**
 * getStoreConnections — Lista todas las conexiones de un store (sin secretos).
 */
export async function getStoreConnections(storeId: string) {
    return await (prisma as any).connection.findMany({
        where: { storeId },
        select: {
            id: true,
            provider: true,
            isActive: true,
            lastSyncedAt: true,
            updatedAt: true,
            extraConfig: true
        }
    });
}

/**
 * getStoreConnectionsWithSecrets — Lista todas las conexiones descifrando sus secretos.
 * ¡USAR SOLO EN CONTEXTOS DE ADMINISTRACIÓN!
 */
export async function getStoreConnectionsWithSecrets(storeId: string) {
    const connections = await (prisma as any).connection.findMany({
        where: { storeId }
    });

    return connections.map((conn: any) => {
        let decryptedSecret = null;
        if (conn.secretEnc && conn.secretIv && conn.secretTag) {
            try {
                decryptedSecret = decryptSecret({
                    enc: conn.secretEnc,
                    iv: conn.secretIv,
                    tag: conn.secretTag
                });
            } catch (e) {
                console.error(`[getStoreConnectionsWithSecrets] Decrypt fail for ${conn.provider}`);
            }
        }

        // FALLBACK: If decryptedSecret is still null, check legacy fields
        if (!decryptedSecret) {
            decryptedSecret = conn.apiKey || conn.accessToken || conn.apiSecret || null;
            if (decryptedSecret) {
                console.log(`[getStoreConnectionsWithSecrets] Using legacy secret fallback for ${conn.provider}`);
            }
        }

        return {
            id: conn.id,
            provider: conn.provider,
            isActive: conn.isActive,
            lastSyncedAt: conn.lastSyncedAt,
            updatedAt: conn.updatedAt,
            extraConfig: conn.extraConfig,
            secret: decryptedSecret
        };
    });
}

/**
 * hasActiveConnection — Verifica si el store tiene configurada una conexión específica.
 */
export async function hasActiveConnection(storeId: string, provider: string): Promise<boolean> {
    const conn = await (prisma as any).connection.findFirst({
        where: { storeId, provider: provider.toUpperCase() },
        select: { isActive: true, secretEnc: true }
    });
    return !!(conn?.isActive && conn?.secretEnc);
}

/**
 * deleteConnection — Elimina una conexión y deja registro en AuditLog.
 */
export async function deleteConnection(connectionId: string) {
    const existing = await (prisma as any).connection.findUnique({ where: { id: connectionId } });
    if (!existing) return { success: false, message: "Conexión no encontrada" };

    await (prisma as any).connection.delete({ where: { id: connectionId } });

    // Registro en AuditLog
    try {
        await (prisma as any).auditLog.create({
            data: {
                storeId: existing.storeId,
                action: "CONNECTION_DELETED",
                entity: "CONNECTION",
                entityId: existing.provider,
                actorType: "SYSTEM",
                oldValue: JSON.stringify({ provider: existing.provider, isActive: existing.isActive }),
                newValue: null
            }
        });
    } catch (e) {
        console.warn("[deleteConnection] Audit log failed, but connection was deleted.");
    }

    return { success: true };
}
