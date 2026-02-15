
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { SnapshotService } from "@/lib/services/snapshot-service";
import { FinancialAdviser } from "@/lib/services/financial-adviser";
import { ThresholdService } from "@/lib/threshold-service";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const month = parseInt(searchParams.get('month') || format(new Date(), 'M'));
    const year = parseInt(searchParams.get('year') || format(new Date(), 'yyyy'));
    const productId = searchParams.get('productId');

    if (!storeId) {
        return Response.json({ error: "Store ID is required" }, { status: 400 });
    }

    try {
        // --- PREFERRED PATH: SNAPSHOTS (Global Store View) ---
        if (!productId || productId === 'GLOBAL') {
            console.log(`[Accounting API] Loading SNAPSHOT summary for store ${storeId} (${month}/${year})`);
            const summary = await SnapshotService.getMonthlySummary(storeId, month, year);
            const thresholds = await ThresholdService.getActiveThreshold(storeId);

            // Re-run AI analysis on the summary days
            const insights = await FinancialAdviser.analyzePerformance(summary.days as any, thresholds);

            // Fetch Monthly Goal
            const goal = await prisma.monthlyGoal.findUnique({
                where: { storeId_month_year: { storeId, month, year } }
            });

            return Response.json({
                ...summary,
                goal,
                insights
            });
        }

        // --- FALLBACK: DYNAMIC CALCULATION (Product Filtered View) ---
        // TODO: Implement Product-level snapshots in Task 8 if needed.
        // For now, keeping original logic for product filtering.

        const { startOfMonth, endOfMonth, eachDayOfInterval } = require("date-fns");
        const startDate = startOfMonth(new Date(year, month - 1));
        const endDate = endOfMonth(startDate);

        const orderWhere: any = {
            storeId,
            createdAt: { gte: startDate, lte: endDate },
            status: { notIn: ['CANCELLED', 'ABANDONED'] },
            items: { some: { productId } }
        };

        const orders = await prisma.order.findMany({
            where: orderWhere,
            include: { items: true }
        });

        // Ad Spend by Product (Matching Campaign)
        let adSpendByDate = new Map<string, number>();
        const metaConfig = await prisma.metaConfig.findUnique({
            where: { productId },
            select: { campaignId: true }
        });

        if (metaConfig?.campaignId) {
            const adMetrics = await prisma.adMetricDaily.findMany({
                where: {
                    storeId,
                    date: { gte: startDate, lte: endDate },
                    level: 'CAMPAIGN',
                    externalId: metaConfig.campaignId
                }
            });
            adMetrics.forEach(m => {
                const dateKey = format(m.date, 'yyyy-MM-dd');
                try {
                    const norm = JSON.parse(m.metricsNorm || '{}');
                    adSpendByDate.set(dateKey, (adSpendByDate.get(dateKey) || 0) + (norm.spend || 0));
                } catch (e) { }
            });
        }

        const revenueByDate = new Map<string, number>();
        const costsByDate = new Map<string, number>();

        orders.forEach(o => {
            const dKey = format(o.createdAt, 'yyyy-MM-dd');
            const rev = o.totalPrice || 0;
            const productCost = o.items
                .filter(i => i.productId === productId)
                .reduce((acc, i) => acc + ((i.unitCost || 0) * (i.quantity || 1)), 0);

            revenueByDate.set(dKey, (revenueByDate.get(dKey) || 0) + rev);
            costsByDate.set(dKey, (costsByDate.get(dKey) || 0) + productCost + (o.estimatedLogisticsCost || 0));
        });

        const allDays = eachDayOfInterval({ start: startDate, end: endDate });
        const days = allDays.map((day: Date) => {
            const key = format(day, 'yyyy-MM-dd');
            const revenue = revenueByDate.get(key) || 0;
            const costs = costsByDate.get(key) || 0;
            const spendAds = adSpendByDate.get(key) || 0;
            return {
                date: day,
                spendAds,
                revenueReal: revenue,
                costsReal: costs,
                netProfit: revenue - costs - spendAds,
                roasReal: spendAds > 0 ? (revenue / spendAds) : 0,
                status: "NEUTRAL",
                isComplete: true
            };
        });

        const totals = {
            spendAds: days.reduce((s: number, d: any) => s + d.spendAds, 0),
            revenueReal: days.reduce((s: number, d: any) => s + d.revenueReal, 0),
            costsReal: days.reduce((s: number, d: any) => s + d.costsReal, 0),
            netProfit: days.reduce((s: number, d: any) => s + d.netProfit, 0),
            roasReal: 0
        };
        totals.roasReal = totals.spendAds > 0 ? totals.revenueReal / totals.spendAds : 0;

        return Response.json({
            days,
            totals,
            goal: null,
            insights: []
        });

    } catch (error: any) {
        console.error("Accounting API Error:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}
