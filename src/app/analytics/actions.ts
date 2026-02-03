"use server";

import prisma from "@/lib/prisma";

/**
 * Advanced KPI Engine
 * Tracks performance for Agents, Carriers, Suppliers, Products and Bots.
 */
export async function getAdvancedKPIs(period: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR' = 'MONTH') {
    try {
        const store = await prisma.store.findFirst();
        if (!store) return { success: false, error: "Store not found" };

        const now = new Date();
        let startDate = new Date();
        if (period === 'DAY') startDate.setHours(0, 0, 0, 0);
        else if (period === 'WEEK') startDate.setDate(now.getDate() - 7);
        else if (period === 'MONTH') startDate.setMonth(now.getMonth() - 1);
        else if (period === 'YEAR') startDate.setFullYear(now.getFullYear() - 1);

        // 1. Fetch Orders with deep relations
        const orders = await prisma.order.findMany({
            where: {
                storeId: store.id,
                createdAt: { gte: startDate },
                orderType: "REGULAR"
            },
            include: {
                items: {
                    include: { product: { include: { finance: true } } }
                }
            }
        });

        // 2. Fetch Daily Finances for AdSpend and Visitors
        const dailyFinances = await prisma.dailyFinance.findMany({
            where: { storeId: store.id, date: { gte: startDate } }
        });

        const adSpend = dailyFinances.reduce((acc, df) => acc + df.adSpend, 0);
        const visitors = dailyFinances.reduce((acc, df) => acc + df.visitors, 0);

        // 3. BASE METRICS
        const totalOrders = orders.length;
        const confirmedOrders = orders.filter(o => o.status === 'CONFIRMED' || o.status === 'READY' || o.status === 'SHIPPED').length;
        const cancelledOrders = orders.filter(o => o.status === 'CANCELLED').length;
        const deliveredOrders = orders.filter(o => o.logisticsStatus === 'DELIVERED').length;
        const returnedOrders = orders.filter(o => o.logisticsStatus === 'RETURNED' || o.returnedAt !== null).length;
        const incidenceOrders = orders.filter(o => o.logisticsStatus === 'INCIDENCE').length;

        // Recovered = Went through INCIDENCE but now are DELIVERED or CONFIRMED (inferred for now)
        const recoveredOrders = orders.filter(o => o.incidenceAttempts > 0 && ['CONFIRMED', 'DELIVERED'].includes(o.status)).length;

        // 4. FINANCIALS (SUMMARIES)
        let shopifyRevenue = 0;
        let cogs = 0;
        let shippingPaidByCustomer = 0;
        let totalProductUnits = 0;
        let realShippingCost = 0; // Cost we pay to carriers
        let returnExpenses = 0;

        orders.forEach(o => {
            if (o.status !== 'CANCELLED') {
                shopifyRevenue += o.totalPrice;
                shippingPaidByCustomer += o.shippingCost;

                o.items.forEach(item => {
                    totalProductUnits += item.quantity;
                    cogs += (item as any).unitCost || item.product?.finance?.unitCost || 0;
                });

                // Real logistics costs (estimates if not fixed)
                realShippingCost += o.estimatedLogisticsCost || 6.5;
                if (o.returnedAt) returnExpenses += 6.5; // Fixed return cost for now
            }
        });

        // 5. CALCULATIONS
        const averageTicket = totalOrders > 0 ? shopifyRevenue / totalOrders : 0;
        const conversionRate = visitors > 0 ? (totalOrders / visitors) * 100 : 0;
        const recoveryRate = incidenceOrders > 0 ? (recoveredOrders / incidenceOrders) * 100 : 0;

        // Rates Estimated vs Real
        const estimatedDeliveryRate = 0.85; // Baseline
        const realDeliveryRate = confirmedOrders > 0 ? deliveredOrders / confirmedOrders : 0;
        const shippingRateReal = totalOrders > 0 ? confirmedOrders / totalOrders : 0;

        // Profit Calculations
        const realRevenue = deliveredOrders > 0 ? orders.filter(o => o.logisticsStatus === 'DELIVERED').reduce((acc, o) => acc + o.totalPrice, 0) : 0;

        const profitReal = realRevenue - (cogs * (deliveredOrders / totalOrders || 1)) - realShippingCost - adSpend - returnExpenses;
        const profitEstimated = (shopifyRevenue * estimatedDeliveryRate) - cogs - (realShippingCost * confirmedOrders / totalOrders || 1) - adSpend;

        const roasReal = adSpend > 0 ? realRevenue / adSpend : 0;
        const roasEstimated = adSpend > 0 ? shopifyRevenue / adSpend : 0;

        const cpaReal = deliveredOrders > 0 ? adSpend / deliveredOrders : 0;
        const cpaEstimated = confirmedOrders > 0 ? adSpend / confirmedOrders : 0;

        const roiReal = adSpend > 0 ? (profitReal / adSpend) * 100 : 0;
        const roiEstimated = adSpend > 0 ? (profitEstimated / adSpend) * 100 : 0;

        // 6. BOT METRICS
        const botMetrics = await (prisma as any).botMetric.findMany({
            where: { storeId: store.id, date: { gte: startDate } }
        });
        const botSummary = botMetrics.reduce((acc: any, curr: any) => ({
            messages: acc.messages + curr.messagesSent,
            conversations: acc.conversations + curr.conversationsStarted,
            assistedRevenue: acc.assistedRevenue + curr.revenueAssisted,
            assistedOrders: acc.assistedOrders + curr.ordersAssisted
        }), { messages: 0, conversations: 0, assistedRevenue: 0, assistedOrders: 0 });

        const cardOrders = orders.filter(o => (o.financialStatus === 'paid' || o.paymentMethod === 'stripe') && o.paymentMethod !== 'COD').length;
        const cardRevenue = orders.filter(o => (o.financialStatus === 'paid' || o.paymentMethod === 'stripe') && o.paymentMethod !== 'COD').reduce((acc, o) => acc + o.totalPrice, 0);

        return {
            success: true,
            period,
            summary: {
                // Requested Precise KPIs
                visitors,
                totalOrders,
                totalProductUnits,
                conversionRate,
                shopifyRevenue,
                averageTicket,
                confirmedOrders,
                cancelledOrders,
                shippingPaidByCustomer,
                deliveredOrders,
                cogs,
                returnedOrders,
                returnExpenses,
                incidenceOrders,
                recoveredOrders,
                recoveryRate,

                cardOrders,
                cardRevenue,
                cardOrdersPercent: totalOrders > 0 ? (cardOrders / totalOrders) * 100 : 0,
                cardRevenuePercent: shopifyRevenue > 0 ? (cardRevenue / shopifyRevenue) * 100 : 0,

                estimatedShippingRate: 90, // %
                estimatedDeliveryRate: estimatedDeliveryRate * 100,
                realShippingRate: shippingRateReal * 100,
                realDeliveryRate: realDeliveryRate * 100,

                revenueEstimated: shopifyRevenue * estimatedDeliveryRate,
                revenueReal: realRevenue,

                adSpend,

                profitEstimated,
                profitReal,

                roiEstimated,
                roiReal,

                profitPercentEstimated: profitEstimated > 0 ? (profitEstimated / (shopifyRevenue * estimatedDeliveryRate)) * 100 : 0,
                profitPercentReal: realRevenue > 0 ? (profitReal / realRevenue) * 100 : 0,

                roasEstimated,
                roasReal,

                cpaEstimated,
                cpaReal,

                botPerformance: botSummary,

                // Keep breakdowns for UI
                agents: [], // To be populated if needed
                carriers: [],
                products: []
            }
        };
    } catch (error: any) {
        console.error("Advanced KPI Error:", error);
        return { success: false, error: error.message };
    }
}

// Alias for backwards compatibility
export async function getAnalyticsData(period: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR' = 'MONTH') {
    return getAdvancedKPIs(period);
}
