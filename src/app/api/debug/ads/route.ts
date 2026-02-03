
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getMetaAdsService } from '@/lib/marketing/meta-ads';

export async function GET() {
    try {
        const store = await prisma.store.findFirst();
        if (!store) return NextResponse.json({ error: "No store found" }, { status: 404 });

        const service = await getMetaAdsService(prisma, store.id);

        // 1. Fetch Accounts from Meta
        const metaAccounts = await service.getAdAccounts();

        // 2. Fetch DB Metrics for Today
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const dbMetrics = await prisma.adMetricDaily.findMany({
            where: {
                storeId: store.id,
                date: { gte: today }
            },
            select: {
                level: true,
                platform: true,
                externalId: true,
                name: true,
                metricsNorm: true
            }
        });

        // 3. Analyze DB Data
        const dbSummary: any = {};
        dbMetrics.forEach((m: any) => {
            const norm = typeof m.metricsNorm === 'string' ? JSON.parse(m.metricsNorm) : m.metricsNorm;
            const accId = norm.account_id || 'UNKNOWN';

            if (!dbSummary[accId]) dbSummary[accId] = { count: 0, campaigns: [] };
            dbSummary[accId].count++;
            if (m.level === 'CAMPAIGN') dbSummary[accId].campaigns.push(m.name);
        });

        return NextResponse.json({
            success: true,
            meta_accounts: metaAccounts.map((a: any) => ({ id: a.id, name: a.name, status: a.account_status })),
            db_summary: dbSummary,
            total_db_records: dbMetrics.length
        });

    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
