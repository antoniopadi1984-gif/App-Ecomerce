
import { startOfMonth, endOfMonth, eachDayOfInterval, format, startOfDay } from "date-fns"; import { prisma } from "@/lib/prisma";
import { SnapshotService } from "@/lib/services/snapshot-service";
import { FinancialAdviser } from "@/lib/services/financial-adviser";
import { ThresholdService } from "@/lib/threshold-service";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const month = parseInt(searchParams.get('month') || format(new Date(), 'M'));
    const year = parseInt(searchParams.get('year') || format(new Date(), 'yyyy'));

    if (!storeId) {
        return Response.json({ error: "Store ID is required" }, { status: 400 });
    }

    try {
        // 1. Get current snapshots
        const summary = await SnapshotService.getMonthlySummary(storeId, month, year);

        // 2. Fetch Monthly Projection/Goal
        const goal = await prisma.monthlyGoal.findUnique({
            where: { storeId_month_year: { storeId, month, year } }
        });

        // 3. Fetch Monthly Expenses (Gastos Tienda)
        const startDate = startOfMonth(new Date(year, month - 1));
        const endDate = endOfMonth(startDate);

        const expenses = await prisma.expense.findMany({
            where: {
                storeId,
                date: { gte: startDate, lte: endDate }
            },
            orderBy: { date: 'asc' }
        });

        const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

        // 4. Fetch Ad Metrics directly for historical months (to fill gaps in snapshots)
        const adMetrics = await prisma.adMetricDaily.findMany({
            where: {
                storeId,
                date: { gte: startDate, lte: endDate },
                level: "ACCOUNT"
            }
        });

        // Create a map of ad spend by date
        const adSpendByDate = new Map<string, number>();
        adMetrics.forEach((m: any) => {
            const dateKey = format(m.date, 'yyyy-MM-dd');
            let spend = 0;
            try {
                const norm = JSON.parse(m.metricsNorm || '{}');
                spend = norm.spend || 0;
            } catch (e) { }
            adSpendByDate.set(dateKey, (adSpendByDate.get(dateKey) || 0) + spend);
        });

        // 5. Ensure all days of the month are represented, even if empty
        const allDays = eachDayOfInterval({ start: startDate, end: endDate });
        const daysInMonth = allDays.length;
        const dailyExpense = totalExpenses / daysInMonth;

        const dayMap = new Map(summary.days.map(d => [format(d.date, 'yyyy-MM-dd'), d]));

        // Calculate Daily Projection Pro-rata
        const dailyProjection = goal ? {
            adSpend: goal.adSpendBudget / daysInMonth,
            revenue: (goal.adSpendBudget * goal.targetRoas) / daysInMonth,
            profit: ((goal.adSpendBudget * goal.targetRoas) * (goal.expectedConvRate / 100)) / daysInMonth,
            cpa: goal.maxCpa,
            cpc: goal.maxCpc,
            roas: goal.targetRoas,
            breakevenRoas: goal.breakevenRoas
        } : null;

        const fullDays = allDays.map(day => {
            const key = format(day, 'yyyy-MM-dd');
            const realData = dayMap.get(key);

            // Use ad spend from adMetricDaily if snapshot doesn't have it
            const snapshotSpend = realData?.spendAds || 0;
            const directAdSpend = adSpendByDate.get(key) || 0;
            const finalSpendAds = snapshotSpend > 0 ? snapshotSpend : directAdSpend;

            return {
                ...(realData || {
                    date: day,
                    spendAds: 0,
                    revenueReal: 0,
                    costsReal: 0,
                    netProfit: 0,
                    roasReal: 0,
                    status: "NEUTRAL",
                    isComplete: false,
                    metricsJson: "{}"
                }),
                spendAds: finalSpendAds, // Override with actual ad data
                projection: dailyProjection,
                dailyExpense
            };
        });

        // Recalculate totals with actual ad spend
        const totalAdSpend = fullDays.reduce((sum, d) => sum + (d.spendAds || 0), 0);

        // 6. Generate Insights
        const threshold = await ThresholdService.getActiveThreshold(storeId);
        const insights = FinancialAdviser.analyzePerformance(summary.days, threshold);

        return Response.json({
            ...summary,
            totals: {
                ...summary.totals,
                spendAds: totalAdSpend // Use recalculated total
            },
            goal,
            days: fullDays,
            insights,
            expenses,
            totalExpenses,
            dailyExpense
        });
    } catch (error: any) {
        console.error("Accounting API Error:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}
