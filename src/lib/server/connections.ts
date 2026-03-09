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
 * Soporta ALIAS de proveedores maestros para alimentar múltiples servicios.
 */
export async function getConnectionSecret(storeId: string, provider: string): Promise<string | null> {
    const canonicalProvider = (provider: string) => {
        const p = provider.toUpperCase();
        if (['ANTHROPIC'].includes(p)) return 'REPLICATE';
        if (['VERTEX', 'GA4', 'GCP', 'GOOGLE', 'GOOGLE_MAPS', 'GOOGLE_SERVICE_ACCOUNT'].includes(p)) return 'GOOGLE_CLOUD';
        if (['META_ADS', 'FACEBOOK', 'FACEBOOK_ADS', 'FB'].includes(p)) return 'META';
        return p;
    };

    const targetProvider = canonicalProvider(provider);

    let conn = await (prisma as any).connection.findFirst({
        where: { storeId, provider: targetProvider }
    });

    const isolatedProviders = ['SHOPIFY', 'META', 'BEEPING', 'DROPPI', 'DROPEA', 'STRIPE'];
    const isIsolated = isolatedProviders.includes(targetProvider);

    // FALLBACK TO GLOBAL/MAIN STORE if not found for the specific store
    if (!conn && storeId !== 'store-main' && !isIsolated) {
        conn = await (prisma as any).connection.findFirst({
            where: { storeId: 'store-main', provider: targetProvider }
        });
    }

    if (!conn) return null;

    // Handle JSON keys (Google) differently if needed? No, encryptSecret handles strings.
    // If the provider is GOOGLE_CLOUD, the secret is usually the Service Account JSON.

    if (!conn.secretEnc || !conn.secretIv || !conn.secretTag) {
        // Fallback to legacy fields if migration hasn't run
        return (conn.apiKey || conn.accessToken || conn.apiSecret || null);
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
    let meta = await (prisma as any).connection.findFirst({
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

    const isolatedProviders = ['SHOPIFY', 'META', 'BEEPING', 'DROPPI', 'DROPEA', 'STRIPE'];
    const isIsolated = isolatedProviders.includes(provider.toUpperCase());

    if (!meta && storeId !== 'store-main' && !isIsolated) {
        meta = await (prisma as any).connection.findFirst({
            where: { storeId: 'store-main', provider: provider.toUpperCase() },
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

    return meta;
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
    const canonicalProvider = (provider: string) => {
        const p = provider.toUpperCase();
        if (['ANTHROPIC'].includes(p)) return 'REPLICATE';
        if (['VERTEX', 'GA4', 'GCP', 'GOOGLE', 'GOOGLE_MAPS', 'GOOGLE_SERVICE_ACCOUNT'].includes(p)) return 'GOOGLE_CLOUD';
        if (['META_ADS', 'FACEBOOK', 'FACEBOOK_ADS', 'FB'].includes(p)) return 'META';
        return p;
    };

    const targetProvider = canonicalProvider(provider);

    const isolatedProviders = ['BEEPING', 'DROPPI', 'DROPEA', 'STRIPE'];
    const isIsolated = isolatedProviders.includes(targetProvider);

    const where: any = { provider: targetProvider };
    if (storeId === 'store-main' || isIsolated) {
        where.storeId = storeId;
    } else {
        where.OR = [
            { storeId },
            { storeId: 'store-main' }
        ];
    }

    const conn = await (prisma as any).connection.findFirst({
        where,
        select: { isActive: true, secretEnc: true, apiKey: true, accessToken: true }
    });

    return !!(conn?.isActive && (conn?.secretEnc || conn?.apiKey || conn?.accessToken));
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
