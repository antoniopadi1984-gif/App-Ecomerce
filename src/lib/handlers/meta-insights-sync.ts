import { prisma } from '@/lib/prisma';
import { getMetaAdsService } from '@/lib/marketing/meta-ads';

export async function syncMetaInsights(storeId: string, accountId: string, days: number = 30) {
    const metaService = await getMetaAdsService(prisma, storeId);
    let totalRecords = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < days; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        try {
            const rawInsights = await metaService.fetch(`${accountId}/insights`, {
                time_range: JSON.stringify({ since: dateStr, until: dateStr }),
                level: 'ad',
                fields: [
                    'impressions', 'reach', 'frequency', 'spend', 'clicks', 'ctr', 'cpc', 'cpm',
                    'actions', 'action_values', 'video_thruplay_watched_actions',
                    'video_continuous_2_sec_watched_actions', 'ad_id', 'ad_name'
                ].join(','),
                action_attribution_windows: JSON.stringify(["1d_click", "7d_click", "1d_view"])
            });

            if (rawInsights.data) {
                for (const insight of rawInsights.data) {
                    const spend = parseFloat(insight.spend || 0);
                    const impressions = parseInt(insight.impressions || 0);

                    const video2s = insight.video_continuous_2_sec_watched_actions?.find((a: any) => a.action_type === 'video_continuous_2_sec_watched_actions')?.value || 0;
                    const thruplay = insight.video_thruplay_watched_actions?.find((a: any) => a.action_type === 'video_thruplay_watched_actions')?.value || 0;

                    const hookRate = impressions > 0 ? (video2s / impressions * 100) : 0;
                    const holdRate = impressions > 0 ? (thruplay / impressions * 100) : 0;

                    const purchases = insight.actions?.find((a: any) => a.action_type === 'purchase')?.value || 0;
                    const revenue = insight.action_values?.find((a: any) => a.action_type === 'purchase')?.value || 0;

                    const insightData: any = {
                        storeId,
                        accountId,
                        level: 'AD',
                        externalId: insight.ad_id,
                        name: insight.ad_name,
                        status: 'ACTIVE',
                        spend,
                        impressions,
                        reach: parseInt(insight.reach || 0),
                        frequency: parseFloat(insight.frequency || 0),
                        clicks: parseInt(insight.clicks || 0),
                        cpc: parseFloat(insight.cpc || 0),
                        ctr: parseFloat(insight.ctr || 0),
                        cpm: parseFloat(insight.cpm || 0),
                        results: parseInt(purchases),
                        costPerResult: purchases > 0 ? (spend / purchases) : 0,
                        roas: spend > 0 ? (revenue / spend) : 0,
                        hookRate,
                        holdRate,
                        date,
                        metadata: JSON.stringify(insight)
                    };

                    const existing = await (prisma as any).metaInsightsCache.findFirst({
                        where: { storeId, accountId, externalId: insight.ad_id, date }
                    });

                    if (existing) {
                        await (prisma as any).metaInsightsCache.update({
                            where: { id: existing.id },
                            data: insightData
                        });
                    } else {
                        await (prisma as any).metaInsightsCache.create({
                            data: insightData
                        });
                    }
                    totalRecords++;
                }
            }
        } catch (e: any) {
            console.error(`🛑 [Meta Insights Sync] Error for date ${dateStr}:`, e.message);
        }
    }

    return totalRecords;
}
