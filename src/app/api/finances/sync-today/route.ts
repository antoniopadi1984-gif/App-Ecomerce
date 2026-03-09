import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay } from "date-fns";

/**
 * 10.2 src/app/api/finances/sync-today/route.ts
 * Sincronización manual de métricas del día para una tienda.
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { storeId } = body;

        if (!storeId) {
            return NextResponse.json({ error: "Missing storeId" }, { status: 400 });
        }

        const today = startOfDay(new Date());
        const tomorrow = endOfDay(today);

        // 1. Calcular métricas de orders
        const orders = await (prisma as any).order.findMany({
            where: {
                storeId,
                createdAt: {
                    gte: today,
                    lte: tomorrow
                }
            },
            include: {
                items: true
            }
        });

        let totalRevenue = 0;
        let deliveredCount = 0;
        let returnedCount = 0;
        let cancelledCount = 0;
        let totalCogs = 0;
        let totalShippingCost = 0;

        orders.forEach((order: any) => {
            const status = (order.status || "").toUpperCase();

            if (status === "DELIVERED") {
                totalRevenue += order.totalPrice || 0;
                deliveredCount++;
            } else if (status === "RETURNED") {
                returnedCount++;
            } else if (status === "CANCELLED") {
                cancelledCount++;
            }

            // Gastos se suman para todos los pedidos no cancelados (o según lógica contable)
            // El prompt dice: netProfit = totalRevenue - cogs - adSpend - shippingCost
            if (status !== "CANCELLED") {
                totalShippingCost += order.estimatedLogisticsCost || 0;
                if (order.items) {
                    order.items.forEach((item: any) => {
                        totalCogs += (item.unitCost || 0) * (item.quantity || 0);
                    });
                }
            }
        });

        // 2. Ad Spend desde MetaInsightsCache
        const insights = await (prisma as any).metaInsightsCache.findMany({
            where: {
                storeId,
                date: {
                    gte: today,
                    lte: tomorrow
                }
            }
        });

        const adSpend = insights.reduce((sum: number, ins: any) => sum + (ins.spend || 0), 0);

        // 3. Calcular Net Profit
        const netProfit = totalRevenue - totalCogs - adSpend - totalShippingCost;

        // 4. Upsert DailyFinance
        await (prisma as any).dailyFinance.upsert({
            where: {
                storeId_date: { storeId, date: today }
            },
            update: {
                totalRevenue,
                ordersCount: orders.length,
                deliveredCount,
                returnedCount,
                cancelledCount,
                adSpend,
                cogs: totalCogs,
                shippingCost: totalShippingCost,
                netProfit
            },
            create: {
                storeId,
                date: today,
                totalRevenue,
                ordersCount: orders.length,
                deliveredCount,
                returnedCount,
                cancelledCount,
                adSpend,
                cogs: totalCogs,
                shippingCost: totalShippingCost,
                netProfit
            }
        });

        // 5. Upsert DailySnapshot (View: ORDERS_CREATED)
        const deliveryRate = orders.length > 0 ? (deliveredCount / orders.length) * 100 : 0;
        const roasReal = adSpend > 0 ? totalRevenue / adSpend : 0;

        await (prisma as any).dailySnapshot.upsert({
            where: {
                storeId_date_view: { storeId, date: today, view: "ORDERS_CREATED" }
            },
            update: {
                spendAds: adSpend,
                revenueReal: totalRevenue,
                costsReal: totalCogs + totalShippingCost,
                netProfit,
                roasReal,
                deliveryRate,
                isComplete: true
            },
            create: {
                storeId,
                date: today,
                view: "ORDERS_CREATED",
                spendAds: adSpend,
                revenueReal: totalRevenue,
                costsReal: totalCogs + totalShippingCost,
                netProfit,
                roasReal,
                deliveryRate,
                isComplete: true
            }
        });

        return NextResponse.json({
            success: true,
            summary: {
                totalRevenue,
                adSpend,
                netProfit,
                ordersCount: orders.length,
                deliveredCount,
                returnedCount,
                cancelledCount
            }
        });

    } catch (error: any) {
        console.error("[sync-today] Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
