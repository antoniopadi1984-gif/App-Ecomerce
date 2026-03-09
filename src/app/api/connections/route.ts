import { NextRequest, NextResponse } from "next/server";
import { getStoreConnections, saveConnectionSecret } from "@/lib/server/connections";
import { prisma } from "@/lib/prisma";
import { encryptSecret, decryptSecret } from "@/lib/server/crypto";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const reveal = searchParams.get("reveal") === "true";

        const storeId = request.headers.get("X-Store-Id");



        // Fetch connections
        const rawConnections = await prisma.connection.findMany({
            where: {
                OR: [
                    { storeId: storeId || 'store-main' },
                    { storeId: 'store-main' }
                ]
            },
            include: {
                store: { select: { id: true, name: true, domain: true } }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Calculate actual consumption this month
        const firstDayOfMonth = new Date();
        firstDayOfMonth.setDate(1);
        firstDayOfMonth.setHours(0, 0, 0, 0);

        const aiUsage = await prisma.aiUsageLog.groupBy({
            by: ['provider'],
            where: {
                createdAt: { gte: firstDayOfMonth }
            },
            _sum: {
                estimatedCostEur: true
            }
        });

        const usageMap = aiUsage.reduce((acc: any, curr: any) => {
            acc[curr.provider.toUpperCase()] = curr._sum.estimatedCostEur || 0;
            return acc;
        }, {});

        const { decryptSecret } = await import("@/lib/server/crypto");

        // Deduplicate connections: prefer store-specific over store-main
        const deduplicated = new Map();
        for (const conn of rawConnections) {
            const p = conn.provider.toUpperCase();

            // Do not share global logistics/payment providers with satellite stores
            if (conn.storeId === 'store-main' && storeId && storeId !== 'store-main') {
                if (['BEEPING', 'DROPPI', 'DROPEA', 'STRIPE'].includes(p)) {
                    continue;
                }
            }

            const existing = deduplicated.get(p);
            if (!existing) {
                deduplicated.set(p, conn);
            } else if (existing.storeId === 'store-main' && conn.storeId !== 'store-main') {
                deduplicated.set(p, conn);
            }
        }
        const finalConnections = Array.from(deduplicated.values());

        const connections = finalConnections.map((conn: any) => {
            let decryptedSecret = null;
            if (reveal && conn.secretEnc && conn.secretIv && conn.secretTag) {
                try {
                    decryptedSecret = decryptSecret({
                        enc: conn.secretEnc,
                        iv: conn.secretIv,
                        tag: conn.secretTag
                    });
                } catch (e) {
                    // Decrypt fail
                }
            }

            if (reveal && !decryptedSecret) {
                decryptedSecret = conn.apiKey || conn.accessToken || conn.apiSecret || null;
            }

            let metadata = {};
            try {
                if (conn.extraConfig) {
                    metadata = typeof conn.extraConfig === 'string' ? JSON.parse(conn.extraConfig) : conn.extraConfig;
                }
            } catch (e) { }

            if (conn.provider === 'SHOPIFY' && conn.store && conn.store.name && conn.store.id !== 'store-main') {
                metadata = { ...metadata, Tienda: conn.store.name };
            }

            return {
                id: conn.id,
                storeId: conn.storeId,
                provider: conn.provider,
                isActive: conn.isActive,
                lastSyncedAt: conn.lastSyncedAt,
                updatedAt: conn.updatedAt,
                metadata: metadata,
                secret: decryptedSecret,
                storeName: conn.store?.name,
                usageCost: usageMap[conn.provider.toUpperCase()] || 0
            };
        });

        return NextResponse.json(connections);
    } catch (error: any) {
        console.error("[API CONNECTIONS FATAL]", error);
        return NextResponse.json({ error: "Server Hang/Error" }, { status: 500 });
    }
}

/**
 * POST /api/connections
 * Crea o actualiza una conexión.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { storeId, provider, secret, extraConfig } = body;

        if (!storeId || !provider || !secret) {
            return NextResponse.json({ error: "Missing storeId, provider or secret" }, { status: 400 });
        }

        const conn = await saveConnectionSecret({
            storeId,
            provider: provider.toUpperCase(),
            secret,
            extraConfig
        });

        return NextResponse.json({
            success: true,
            connection: {
                id: conn.id,
                provider: conn.provider,
                isActive: conn.isActive
            }
        });
    } catch (error: any) {
        console.error("[POST /api/connections] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * DELETE /api/connections
 * Desactiva una conexión (isActive=false).
 */
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Missing connection id" }, { status: 400 });
        }

        await prisma.connection.update({
            where: { id },
            data: { isActive: false }
        });

        return NextResponse.json({ success: true, message: "Conexión desactivada" });
    } catch (error: any) {
        console.error("[DELETE /api/connections] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
