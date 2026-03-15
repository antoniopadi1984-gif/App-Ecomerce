import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    const storeId = req.headers.get('X-Store-Id') || 'store-main';
    const roasTarget = parseFloat(req.nextUrl.searchParams.get('roasTarget') || '3');

    // Cargar insights de Meta últimos 7 días
    const insights = await (prisma as any).metaInsightsCache.findMany({
        where: { storeId, level: 'CAMPAIGN', date: { gte: new Date(Date.now() - 7 * 86400000) } },
        select: { campaignId: true, campaignName: true, spend: true, revenue: true, impressions: true }
    });

    // Agrupar por campaña
    const byCampaign: Record<string, { name: string; spend: number; revenue: number }> = {};
    for (const i of insights) {
        if (!byCampaign[i.campaignId]) {
            byCampaign[i.campaignId] = { name: i.campaignName, spend: 0, revenue: 0 };
        }
        byCampaign[i.campaignId].spend   += i.spend   || 0;
        byCampaign[i.campaignId].revenue += i.revenue || 0;
    }

    const recommendations: any[] = [];

    for (const [campaignId, data] of Object.entries(byCampaign)) {
        const roas = data.spend > 0 ? data.revenue / data.spend : 0;
        let action = 'MAINTAIN';
        let suggestedMultiplier = 1;
        let reason = '';

        if (roas >= roasTarget * 1.3) {
            action = 'SCALE_UP';
            suggestedMultiplier = 1.3;
            reason = `ROAS ${roas.toFixed(2)}x supera objetivo ${roasTarget}x en +30%`;
        } else if (roas < roasTarget * 0.7 && data.spend > 50) {
            action = 'SCALE_DOWN';
            suggestedMultiplier = 0.7;
            reason = `ROAS ${roas.toFixed(2)}x por debajo del objetivo ${roasTarget}x`;
        } else if (roas < 1 && data.spend > 100) {
            action = 'PAUSE';
            suggestedMultiplier = 0;
            reason = `ROAS negativo (${roas.toFixed(2)}x) — pausar inmediatamente`;
        } else {
            reason = `ROAS ${roas.toFixed(2)}x dentro del rango objetivo`;
        }

        recommendations.push({
            campaignId,
            campaignName: data.name,
            currentSpend: data.spend,
            revenue: data.revenue,
            roas: parseFloat(roas.toFixed(2)),
            action,
            suggestedBudget: parseFloat((data.spend / 7 * suggestedMultiplier).toFixed(2)),
            reason
        });
    }

    return NextResponse.json({
        ok: true,
        roasTarget,
        recommendations: recommendations.sort((a, b) => b.roas - a.roas),
        summary: {
            scale:    recommendations.filter(r => r.action === 'SCALE_UP').length,
            maintain: recommendations.filter(r => r.action === 'MAINTAIN').length,
            reduce:   recommendations.filter(r => r.action === 'SCALE_DOWN').length,
            pause:    recommendations.filter(r => r.action === 'PAUSE').length
        }
    });
}
