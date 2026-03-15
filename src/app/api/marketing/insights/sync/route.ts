import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getMetaAdsService } from '@/lib/marketing/meta-ads';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { storeId, accountId, days = 90 } = body;

        if (!storeId || !accountId) {
            return NextResponse.json({ error: "Missing storeId or accountId" }, { status: 400 });
        }

        const metaService = await getMetaAdsService(prisma, storeId);
        let totalRecords = 0;
        const today = new Date();

        for (let i = 0; i < days; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);

            const dateStr = date.toISOString().split('T')[0];

            // Fetch for each day to build granular cache
            // Note: Meta API allows ranges, but for the cache we store daily records
            // To be efficient, we call once with range and then map back, 
            // but the requirement asks for a loop mapping daily entries.

            const rawInsights = await metaService.fetch(`${accountId}/insights`, {
                time_range: JSON.stringify({ since: dateStr, until: dateStr }),
                level: 'ad', // most granular
                fields: [
                    // Básicos
                    'impressions', 'reach', 'frequency', 'spend',
                    'clicks', 'unique_clicks', 'ctr', 'cpc', 'cpm', 'cpp',
                    // Acciones
                    'actions', 'action_values', 'unique_actions',
                    'cost_per_action_type', 'cost_per_unique_action_type',
                    // Video
                    'video_thruplay_watched_actions',
                    'video_continuous_2_sec_watched_actions',
                    'video_p25_watched_actions',
                    'video_p50_watched_actions',
                    'video_p75_watched_actions',
                    'video_p95_watched_actions',
                    'video_play_actions',
                    // Landing
                    'outbound_clicks', 'outbound_clicks_ctr',
                    'landing_page_views',
                    'cost_per_outbound_click',
                    // Identificación
                    'objective', 'optimization_goal',
                    'ad_id', 'ad_name', 'adset_id', 'adset_name',
                    'campaign_id', 'campaign_name',
                    'account_id', 'account_name',
                    'status', 'delivery_info',
                    // Presupuesto
                    'budget_remaining', 'budget_limit',
                    // Conversiones
                    'website_purchase_roas', 'purchase_roas',
                    'conversion_rate_ranking', 'quality_ranking',
                    'engagement_rate_ranking'
                ].join(','),
                action_attribution_windows: JSON.stringify([
                    "1d_click", "7d_click", "28d_click", "1d_engaged_view"
                ]),
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
                        status: 'ACTIVE', // Fallback as status isn't always in insights
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

                    // Search for existing daily record to avoid duplicates
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
        }

        return NextResponse.json({ success: true, syncedDays: days, totalRecords });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
