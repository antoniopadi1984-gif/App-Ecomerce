import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
    const storeId   = req.nextUrl.searchParams.get('storeId');
    const productId = req.nextUrl.searchParams.get('productId');
    if (!storeId) return NextResponse.json({ error: 'storeId requerido' }, { status: 400 });

    // 1. Cargar assets creativos con nomenclatura Spencer
    const assets = await (prisma as any).creativeAsset.findMany({
        where: { storeId, ...(productId ? { productId } : {}), type: 'VIDEO', processingStatus: 'READY' },
        select: {
            id: true, name: true, conceptCode: true, funnelStage: true,
            driveUrl: true, drivePath: true, hookScore: true, angle: true,
            metadata: true, createdAt: true
        },
        orderBy: { createdAt: 'desc' }
    });

    // 2. Cargar métricas Meta por ad_name (nomenclatura = ad name en Meta)
    const adNames = assets.map((a: any) => a.name);
    const metaMetrics = await (prisma as any).metaInsightsCache.findMany({
        where: { storeId, name: { in: adNames } },
        select: { name: true, spend: true, impressions: true, clicks: true,
                  ctr: true, cpc: true, roas: true, hookRate: true, holdRate: true,
                  results: true, costPerResult: true, status: true }
    });
    const metaMap = new Map(metaMetrics.map((m: any) => [m.name, m]));

    // 3. Construir tabla de rendimiento completa
    const table = assets.map((asset: any) => {
        const meta = metaMap.get(asset.name) || {};
        const meta_parsed = asset.metadata ? JSON.parse(asset.metadata) : {};

        return {
            // Identificación
            id: asset.id,
            name: asset.name,                          // MICR-C1-V1
            concept: asset.conceptCode,                // C1
            conceptName: meta_parsed.conceptName || '',// Problema
            traffic: asset.funnelStage,                // COLD
            awareness: meta_parsed.awareness || null,  // 2
            awarenessName: meta_parsed.awarenessName || '',
            angle: asset.angle,
            hookScore: asset.hookScore,

            // Links
            driveUrl: asset.driveUrl,

            // Métricas Meta (cruzadas por nombre)
            spend: meta.spend || 0,
            impressions: meta.impressions || 0,
            clicks: meta.clicks || 0,
            ctr: meta.ctr || 0,
            cpc: meta.cpc || 0,
            roas: meta.roas || 0,
            hookRate: meta.hookRate || 0,
            holdRate: meta.holdRate || 0,
            cpa: meta.costPerResult || 0,
            conversions: meta.results || 0,
            metaStatus: meta.status || 'NO_DATA',

            // Veredicto automático
            verdict: getVerdict(meta),
        };
    });

    return NextResponse.json({ ok: true, table, total: table.length });
}

function getVerdict(meta: any): 'ESCALAR' | 'MANTENER' | 'ITERAR' | 'PAUSAR' | 'SIN_DATOS' {
    if (!meta.spend) return 'SIN_DATOS';
    if (meta.roas >= 2.5 && meta.hookRate >= 0.30) return 'ESCALAR';
    if (meta.roas >= 1.5 && meta.hookRate >= 0.15) return 'MANTENER';
    if (meta.hookRate >= 0.25 && meta.roas < 1.5)  return 'ITERAR';
    if (meta.roas < 1.0 || meta.hookRate < 0.10)   return 'PAUSAR';
    return 'MANTENER';
}
