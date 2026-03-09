import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay } from 'date-fns';

/**
 * recalculateDailyFinance — Recalculates metrics for a specific day and store.
 */
export async function recalculateDailyFinance(storeId: string, date: Date) {
    const start = startOfDay(date);
    const end = endOfDay(date);

    // 1. Get All Orders for that day
    const orders = await (prisma as any).order.findMany({
        where: {
            storeId,
            createdAt: { gte: start, lte: end },
            status: { not: 'CANCELLED' }
        },
        include: { items: true }
    });

    const totalRevenue = orders.reduce((sum: number, o: any) => sum + (o.totalPrice || 0), 0);
    const ordersCount = orders.length;

    // Delivered/Returned status counts
    const deliveredCount = orders.filter((o: any) => ['DELIVERED', 'ENTREGADO'].includes(o.status || o.logisticsStatus)).length;
    const returnedCount = orders.filter((o: any) => ['RETURNED', 'DEVUELTO'].includes(o.status || o.logisticsStatus)).length;

    // Financial Metrics
    let totalCogs = 0;
    let netProfit = 0;
    let shippingCost = 0;

    for (const order of orders) {
        totalCogs += order.totalCogs || 0;
        shippingCost += order.shippingCost || 0;
        netProfit += order.netProfit || 0;
    }

    // 2. Get Ad Spend (Marketing)
    const adMetrics = await (prisma as any).metaInsightsCache.findFirst({
        where: {
            storeId,
            level: 'ACCOUNT',
            date: { gte: start, lte: end }
        },
        orderBy: { updatedAt: 'desc' }
    });

    const adSpend = adMetrics?.spend || 0;

    // 3. Upsert into DailyFinance
    await (prisma as any).dailyFinance.upsert({
        where: {
            storeId_date: { storeId, date: start }
        },
        update: {
            totalRevenue,
            ordersCount,
            deliveredCount,
            returnedCount,
            adSpend,
            cogs: totalCogs,
            shippingCost,
            netProfit: netProfit - adSpend, // Rough estimate
            updatedAt: new Date()
        },
        create: {
            storeId,
            date: start,
            totalRevenue,
            ordersCount,
            deliveredCount,
            returnedCount,
            adSpend,
            cogs: totalCogs,
            shippingCost,
            netProfit: netProfit - adSpend,
            updatedAt: new Date()
        }
    });

    console.log(`📊 [Finance Recalc] Store: ${storeId}, Date: ${start.toISOString()} => Revenue: ${totalRevenue}, Spend: ${adSpend}`);
}

/**
 * bulkRecalculateFinance — Recalculates for a range of dates
 */
export async function bulkRecalculateFinance(storeId: string, days: number = 30) {
    const today = new Date();
    for (let i = 0; i < days; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        await recalculateDailyFinance(storeId, d);
    }
}
