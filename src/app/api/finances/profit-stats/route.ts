
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { calculateOrderProfit } from "@/lib/finances";

export async function GET(request: Request) {
    try {
        const storeId = request.headers.get("X-Store-Id");
        const db = prisma as any;

        const where: any = { status: { not: 'CANCELLED' } };
        if (storeId) where.storeId = storeId;

        const recentOrders = await db.order.findMany({
            take: 20,
            orderBy: { createdAt: 'desc' },
            where
        });

        let totalRevenue = 0;
        let totalCogs = 0;
        let totalLogistics = 0;
        let netProfit = 0;
        const detailedOrders = [];

        for (const order of recentOrders) {
            const breakdown = await calculateOrderProfit(order.id);
            totalRevenue += breakdown.revenue;
            totalCogs += breakdown.cogs;
            totalLogistics += breakdown.shipping;
            netProfit += breakdown.netProfit;

            detailedOrders.push({
                id: order.id,
                orderNumber: order.orderNumber,
                logisticsStatus: order.logisticsStatus || order.status,
                profit: breakdown.netProfit,
                status: breakdown.status
            });
        }

        return NextResponse.json({
            totalRevenue,
            totalCogs,
            totalLogistics,
            netProfit,
            recentOrders: detailedOrders
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
