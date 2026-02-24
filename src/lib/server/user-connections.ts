import { prisma } from "@/lib/prisma";
import { encryptSecret, decryptSecret } from "./crypto";

export async function saveUserConnectionSecret({ userId, provider, secret, metadata }: { userId: string, provider: string, secret: string, metadata?: any }) {
    const { enc, iv, tag } = encryptSecret(secret);
    return await (prisma as any).userConnection.upsert({
        where: { userId_provider: { userId, provider: provider.toUpperCase() } },
        update: { secretEnc: enc, secretIv: iv, secretTag: tag, metadata: metadata ? JSON.stringify(metadata) : undefined, isActive: true, updatedAt: new Date() },
        create: { userId, provider: provider.toUpperCase(), secretEnc: enc, secretIv: iv, secretTag: tag, metadata: metadata ? JSON.stringify(metadata) : undefined, isActive: true }
    });
}

export async function getUserConnectionSecret(userId: string, provider: string) {
    const conn = await (prisma as any).userConnection.findUnique({
        where: { userId_provider: { userId, provider: provider.toUpperCase() } }
    });
    if (!conn || !conn.secretEnc || !conn.secretIv || !conn.secretTag) return null;
    try {
        return decryptSecret({ enc: conn.secretEnc, iv: conn.secretIv, tag: conn.secretTag });
    } catch { return null; }
}

export async function hasActiveUserConnection(userId: string, provider: string) {
    const conn = await (prisma as any).userConnection.findUnique({
        where: { userId_provider: { userId, provider: provider.toUpperCase() } },
        select: { isActive: true, secretEnc: true }
    });
    return !!(conn?.isActive && conn?.secretEnc);
}
