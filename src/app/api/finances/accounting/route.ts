
import { startOfMonth, endOfMonth, eachDayOfInterval, format, startOfDay } from "date-fns";
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
        const startDate = startOfMonth(new Date(year, month - 1));
        const endDate = endOfMonth(startDate);

        // 1. Fetch Orders for Revenue/Product Costs (Filtered by Product if needed)
        const orderWhere: any = {
            storeId,
            createdAt: { gte: startDate, lte: endDate },
            status: { not: 'CANCELLED' } // Standard accounting filter
        };

        if (productId) {
            orderWhere.items = { some: { productId } };
        }

        const orders = await prisma.order.findMany({
            where: orderWhere,
            include: { items: true }
        });

        // 2. Fetch Ad Spend 
        // If productId is present, we try to filter ad spend by linked Campaign IDs from MetaConfig
        let adSpendByDate = new Map<string, number>();
        let campaignIds: string[] = [];

        if (productId) {
            const metaConfig = await prisma.metaConfig.findUnique({
                where: { productId },
                select: { campaignId: true, adAccountId: true }
            });
            if (metaConfig && metaConfig.campaignId) {
                // If we have precise campaign mapping, use it
                campaignIds = [metaConfig.campaignId];
            } else {
                // Fallback: If no direct map, maybe we shouldn't show ad spend or show everything?
                // For now, let's try to query by name convention if possible, but that's risky.
                // We will fetch ALL ad metrics and filter in memory if we can't filter by ID.
            }
        }

        const adMetricsWhere: any = {
            storeId,
            date: { gte: startDate, lte: endDate },
            level: productId ? (campaignIds.length > 0 ? 'CAMPAIGN' : 'ACCOUNT') : 'ACCOUNT' // If filtering by product and has campaign, use CAMPAIGN level
        };

        if (productId && campaignIds.length > 0) {
            adMetricsWhere.externalId = { in: campaignIds };
        }

        const adMetrics = await prisma.adMetricDaily.findMany({
            where: adMetricsWhere
        });

        // Populate Ad Spend Map
        adMetrics.forEach((m: any) => {
            const dateKey = format(m.date, 'yyyy-MM-dd');
            let spend = 0;
            try {
                const norm = JSON.parse(m.metricsNorm || '{}');
                spend = norm.spend || 0;
            } catch (e) { }

            // If filtering by product without campaign ID, we might need a way to estimate.
            // For now, if productId is set but no campaignIds, we might strictly return 0 to avoid false data.
            if (productId && campaignIds.length === 0) {
                spend = 0; // Better zero than wrong attribution
            }

            adSpendByDate.set(dateKey, (adSpendByDate.get(dateKey) || 0) + spend);
        });


        // 3. Build Daily Data
        const allDays = eachDayOfInterval({ start: startDate, end: endDate });

        // Pre-calculate per-day revenue/costs from Orders
        const revenueByDate = new Map<string, number>();
        const costsByDate = new Map<string, number>();
        const profitByDate = new Map<string, number>();

        orders.forEach(o => {
            const dKey = format(o.createdAt, 'yyyy-MM-dd');

            // Calculate portion if filtering by product? 
            // 'orders' is already filtered.
            // But 'totalPrice' is order-level. If an order has mixed products, we should ideally sum only the item's price.
            // But simplified: If we filter orders where *items some*, we might count full order value which is technically correct (attributed to that product funnel).
            // Let's stick to full order value for now as "Attributed Revenue".

            const rev = o.totalPrice || 0;
            const cost = (o.items.reduce((acc, i) => acc + (i.unitCost * i.quantity), 0)) + (o.shippingCost || 0); // Include shipping in cost? Or shipping is separate? usually shippingCost is revenue from shipping? No, `shippingCost` in Order model is usually what customer paid?
            // Actually `o.totalPrice` includes shipping paid by customer.
            // `o.shippingCost` (in some schemas) is cost to merchant? Let's check schema.
            // Schema: `shippingCost Float @default(0)` in Order. Usually this is what customer paid.
            // Real cost to merchant is `estimatedLogisticsCost`.
            const realCost = o.estimatedLogisticsCost || 0;
            const productCost = o.items.reduce((acc, i) => acc + (i.unitCost * i.quantity), 0);
            const totalCost = realCost + productCost;

            revenueByDate.set(dKey, (revenueByDate.get(dKey) || 0) + rev);
            costsByDate.set(dKey, (costsByDate.get(dKey) || 0) + totalCost);
            profitByDate.set(dKey, (profitByDate.get(dKey) || 0) + (rev - totalCost));
        });

        const fullDays = allDays.map(day => {
            const key = format(day, 'yyyy-MM-dd');

            const revenue = revenueByDate.get(key) || 0;
            const costs = costsByDate.get(key) || 0;
            const spendAds = adSpendByDate.get(key) || 0;
            const grossProfit = revenue - costs - spendAds;

            return {
                date: day,
                spendAds,
                revenueReal: revenue,
                costsReal: costs, // COGS + Logistics
                netProfit: grossProfit, // Gross Profit (Net requires taxes/fixed ops)
                roasReal: spendAds > 0 ? (revenue / spendAds) : 0,
                status: "NEUTRAL",
                isComplete: true
            };
        });

        // 4. Summaries
        const totalAdSpend = fullDays.reduce((sum, d) => sum + d.spendAds, 0);
        const totalRevenue = fullDays.reduce((sum, d) => sum + d.revenueReal, 0);
        const totalCosts = fullDays.reduce((sum, d) => sum + d.costsReal, 0);
        const totalProfit = fullDays.reduce((sum, d) => sum + d.netProfit, 0);

        // 5. Goal (Only if global? Or scale goal?)
        // If product filtered, maybe hiding goal is better or pro-rating.
        const goal = productId ? null : await prisma.monthlyGoal.findUnique({
            where: { storeId_month_year: { storeId, month, year } }
        });

        const insights = await FinancialAdviser.analyzePerformance(fullDays as any, await ThresholdService.getActiveThreshold(storeId));

        return Response.json({
            days: fullDays,
            totals: {
                spendAds: totalAdSpend,
                revenueReal: totalRevenue,
                costsReal: totalCosts,
                netProfit: totalProfit,
                roasReal: totalAdSpend > 0 ? (totalRevenue / totalAdSpend) : 0
            },
            goal,
            insights
        });

    } catch (error: any) {
        console.error("Accounting API Error:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}
