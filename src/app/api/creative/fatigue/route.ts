import { NextRequest, NextResponse } from 'next/server';
import { FatigueDetectorService } from '@/lib/services/fatigue-detector-service';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    const storeId = req.headers.get('X-Store-Id') || req.nextUrl.searchParams.get('storeId');
    if (!storeId) return NextResponse.json({ error: 'storeId requerido' }, { status: 400 });

    // Analizar toda la tienda
    const result = await FatigueDetectorService.analyzeStore(storeId);

    // Devolver creativos con fatiga alta
    const fatigued = await (prisma as any).creativeAsset.findMany({
        where: { storeId, fatigueScore: { gte: 0.6 } },
        select: {
            id: true, name: true, nomenclatura: true,
            fatigueScore: true, fatigueDaysLeft: true,
            ctrTrend: true, metaStatus: true,
            conceptCode: true, funnelStage: true
        },
        orderBy: { fatigueScore: 'desc' }
    });

    const alerts = fatigued.filter((a: any) => a.fatigueScore >= 0.8);

    return NextResponse.json({
        ok: true,
        analyzed: result.analyzed,
        fatigued: fatigued.length,
        alerts: alerts.length,
        items: fatigued,
        summary: {
            critical: alerts.length,
            warning: fatigued.filter((a: any) => a.fatigueScore >= 0.6 && a.fatigueScore < 0.8).length,
            healthy: result.analyzed - fatigued.length
        }
    });
}
