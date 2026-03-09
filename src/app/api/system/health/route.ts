import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getConnectionSecret } from '@/lib/server/connections';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const storeId = searchParams.get('storeId') || 'store-main';

        const health: any = {
            timestamp: new Date(),
            database: "DOWN",
            connections: {},
            system: {
                memory: process.memoryUsage(),
                uptime: process.uptime()
            }
        };

        // 1. DB Health
        try {
            await prisma.$queryRaw`SELECT 1`;
            health.database = "OK";
        } catch (e) {
            health.database = "ERROR";
        }

        // 2. Connections Health check for this store
        const connectionDetails = await (prisma as any).connection.findMany({
            where: { storeId }
        });

        for (const conn of connectionDetails) {
            health.connections[conn.provider] = conn.isActive ? "ACTIVE" : "INACTIVE";
        }

        // 3. Last Syncs
        const lastOrders = await (prisma as any).order.findFirst({
            where: { storeId },
            orderBy: { updatedAt: 'desc' }
        });
        health.lastOrderSync = lastOrders?.updatedAt || "NEVER";

        const lastInsights = await (prisma as any).metaInsightsCache.findFirst({
            where: { storeId },
            orderBy: { updatedAt: 'desc' }
        });
        health.lastMetaSync = lastInsights?.updatedAt || "NEVER";

        return NextResponse.json({ success: true, health });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
