import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { subDays, startOfDay, endOfDay, differenceInDays } from "date-fns";

/**
 * 10.3 src/app/api/finances/profit-stats/route.ts
 * Genera estadísticas de beneficios y tendencias comparativas.
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const storeId = searchParams.get("storeId");
        const period = searchParams.get("period") || "30d";

        let dateTo = endOfDay(new Date());
        let dateFrom = startOfDay(subDays(dateTo, 30));

        if (period === "7d") {
            dateFrom = startOfDay(subDays(dateTo, 7));
        } else if (period === "90d") {
            dateFrom = startOfDay(subDays(dateTo, 90));
        } else if (period === "custom") {
            const start = searchParams.get("dateFrom");
            const end = searchParams.get("dateTo");
            if (start) dateFrom = startOfDay(new Date(start));
            if (end) dateTo = endOfDay(new Date(end));
        } else {
            // Default 30d
            dateFrom = startOfDay(subDays(dateTo, 30));
        }

        if (!storeId) {
            return NextResponse.json({ error: "Missing storeId" }, { status: 400 });
        }

        // Calcular período anterior para tendencias
        const daysDiff = differenceInDays(dateTo, dateFrom);
        const prevDateTo = subDays(dateFrom, 1);
        const prevDateFrom = subDays(prevDateTo, daysDiff);

        // 1. Fetch data actual
        const currentData = await (prisma as any).dailyFinance.findMany({
            where: {
                storeId,
                date: { gte: dateFrom, lte: dateTo }
            },
            orderBy: { date: 'asc' }
        });

        // 2. Fetch data anterior
        const prevData = await (prisma as any).dailyFinance.findMany({
            where: {
                storeId,
                date: { gte: prevDateFrom, lte: prevDateTo }
            }
        });

        const summarize = (data: any[]) => {
            const sum = data.reduce((acc, Day) => ({
                revenue: acc.revenue + (Day.totalRevenue || 0),
                spend: acc.spend + (Day.adSpend || 0),
                profit: acc.profit + (Day.netProfit || 0),
                orders: acc.orders + (Day.ordersCount || 0),
                delivered: acc.delivered + (Day.deliveredCount || 0),
                returned: acc.returned + (Day.returnedCount || 0),
                cancelled: acc.cancelled + (Day.cancelledCount || 0)
            }), { revenue: 0, spend: 0, profit: 0, orders: 0, delivered: 0, returned: 0, cancelled: 0 });

            return {
                ...sum,
                roas: sum.spend > 0 ? (sum.revenue / sum.spend) : 0,
                deliveryRate: sum.orders > 0 ? (sum.delivered / sum.orders) : 0,
                returnRate: sum.orders > 0 ? (sum.returned / sum.orders) : 0
            };
        };

        const currentSummary = summarize(currentData);
        const prevSummary = summarize(prevData);

        const calculateTrend = (curr: number, prev: number) => {
            if (prev === 0) return curr > 0 ? "+100%" : "0%";
            const diff = ((curr - prev) / prev) * 100;
            return (diff >= 0 ? "+" : "") + diff.toFixed(1) + "%";
        };

        const trends = {
            revenue: calculateTrend(currentSummary.revenue, prevSummary.revenue),
            spend: calculateTrend(currentSummary.spend, prevSummary.spend),
            profit: calculateTrend(currentSummary.profit, prevSummary.profit),
            roas: calculateTrend(currentSummary.roas, prevSummary.roas),
            deliveryRate: calculateTrend(currentSummary.deliveryRate, prevSummary.deliveryRate),
            returnRate: calculateTrend(currentSummary.returnRate, prevSummary.returnRate)
        };

        return NextResponse.json({
            success: true,
            period: { dateFrom, dateTo, days: daysDiff + 1 },
            summary: {
                totalRevenue: currentSummary.revenue,
                totalAdSpend: currentSummary.spend,
                totalProfit: currentSummary.profit,
                avgROAS: currentSummary.roas,
                avgDeliveryRate: currentSummary.deliveryRate * 100,
                avgReturnRate: currentSummary.returnRate * 100,
                ordersCount: currentSummary.orders,
                deliveredCount: currentSummary.delivered,
                returnedCount: currentSummary.returned,
                cancelledCount: currentSummary.cancelled
            },
            trends,
            byDay: currentData
        });

    } catch (error: any) {
        console.error("[profit-stats] Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
