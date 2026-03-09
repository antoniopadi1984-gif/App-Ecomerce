import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getMetaAdsService } from '@/lib/marketing/meta-ads';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get('storeId');
    const accountId = searchParams.get('accountId');
    const level = searchParams.get('level') as 'account' | 'campaign' | 'adset' | 'ad';
    const datePreset = searchParams.get('datePreset') || 'last_7d';
    const dateStr = searchParams.get('date');

    if (!storeId || !accountId || !level) {
        return NextResponse.json({ error: "Missing required params" }, { status: 400 });
    }

    try {
        const date = dateStr ? new Date(dateStr) : new Date();
        date.setHours(0, 0, 0, 0);

        // 1. Check Cache
        const cache = await (prisma as any).metaInsightsCache.findFirst({
            where: {
                storeId,
                accountId,
                level: level.toUpperCase(),
                date: {
                    gte: date,
                    lt: new Date(date.getTime() + 24 * 60 * 60 * 1000)
                }
            },
            orderBy: { updatedAt: 'desc' }
        });

        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        if (cache && cache.updatedAt > oneHourAgo) {
            return NextResponse.json({ success: true, insights: JSON.parse(cache.metadata || '[]'), source: 'cache' });
        }

        // 2. Fetch from Meta
        const metaService = await getMetaAdsService(prisma, storeId);

        // Ensure fields are present
        const rawInsights = await metaService.fetch(`${accountId}/insights`, {
            level,
            date_preset: datePreset,
            fields: [
                'impressions', 'reach', 'frequency', 'spend', 'clicks', 'ctr', 'cpc', 'cpm',
                'actions', 'action_values', 'objective', 'adset_id', 'campaign_id', 'ad_id',
                'ad_name', 'adset_name', 'campaign_name', 'status', 'account_id',
                'video_thruplay_watched_actions', 'video_continuous_2_sec_watched_actions'
            ].join(','),
            action_attribution_windows: JSON.stringify(["1d_click", "7d_click", "1d_view"])
        });

        const insightsData = rawInsights.data || [];

        // 3. Process and Save
        for (const insight of insightsData) {
            const spend = parseFloat(insight.spend || 0);
            const impressions = parseInt(insight.impressions || 0);
            const clicks = parseInt(insight.clicks || 0);

            const video2s = insight.video_continuous_2_sec_watched_actions?.find((a: any) => a.action_type === 'video_continuous_2_sec_watched_actions')?.value || 0;
            const thruplay = insight.video_thruplay_watched_actions?.find((a: any) => a.action_type === 'video_thruplay_watched_actions')?.value || 0;
            const hookRate = impressions > 0 ? (video2s / impressions * 100) : 0;
            const holdRate = impressions > 0 ? (thruplay / impressions * 100) : 0;

            const purchases = insight.actions?.find((a: any) => a.action_type === 'purchase')?.value || 0;
            const revenue = insight.action_values?.find((a: any) => a.action_type === 'purchase')?.value || 0;
            const roas = spend > 0 ? (revenue / spend) : 0;
            const cpa = purchases > 0 ? (spend / purchases) : 0;

            const externalId = insight.ad_id || insight.adset_id || insight.campaign_id || accountId;

            const insightData: any = {
                storeId,
                accountId,
                level: level.toUpperCase(),
                externalId,
                name: insight.ad_name || insight.adset_name || insight.campaign_name || 'Account',
                status: insight.status || 'ACTIVE',
                spend,
                impressions,
                reach: parseInt(insight.reach || 0),
                frequency: parseFloat(insight.frequency || 0),
                clicks,
                cpc: parseFloat(insight.cpc || 0),
                ctr: parseFloat(insight.ctr || 0),
                cpm: parseFloat(insight.cpm || 0),
                results: parseInt(purchases),
                costPerResult: cpa,
                roas: roas,
                hookRate,
                holdRate,
                objective: insight.objective,
                date,
                metadata: JSON.stringify(insight)
            };

            // Individual Cache Upsert
            const existingCache = await (prisma as any).metaInsightsCache.findFirst({
                where: { storeId, accountId, level: level.toUpperCase(), externalId, date }
            });

            if (existingCache) {
                await (prisma as any).metaInsightsCache.update({
                    where: { id: existingCache.id },
                    data: insightData
                });
            } else {
                await (prisma as any).metaInsightsCache.create({
                    data: insightData
                });
            }

            // If level=AD, update CreativeAsset
            if (level === 'ad') {
                const creative = await (prisma as any).creativeAsset.findFirst({
                    where: { metaAdId: insight.ad_id }
                });

                if (creative) {
                    let metaStatus = insight.status || creative.metaStatus;
                    if (metaStatus === 'ACTIVE' && parseFloat(insight.frequency || 0) > 3) {
                        metaStatus = 'FATIGADO';
                    }

                    await (prisma as any).creativeAsset.update({
                        where: { id: creative.id },
                        data: {
                            spend: { increment: spend },
                            hookRate,
                            ctr: parseFloat(insight.ctr || 0),
                            metaStatus,
                            frequency: parseFloat(insight.frequency || 0)
                        }
                    });
                }
            }
        }

        return NextResponse.json({ success: true, insights: insightsData, source: 'api' });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
