import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AiRouter } from '@/lib/ai/router';
import { TaskType } from '@/lib/ai/providers/interfaces';

export async function POST(req: NextRequest) {
    const storeId = req.headers.get('X-Store-Id') || 'store-main';
    const { creativeAssetId } = await req.json();

    const asset = await (prisma as any).creativeAsset.findUnique({
        where: { id: creativeAssetId },
        select: {
            id: true, conceptCode: true, funnelStage: true,
            hookText: true, transcription: true, angle: true,
            framework: true, dominantEmotion: true
        }
    });

    if (!asset) return NextResponse.json({ error: 'Asset no encontrado' }, { status: 404 });

    // Cargar histórico de creativos del mismo concepto
    const historical = await (prisma as any).creativeAsset.findMany({
        where: { storeId, conceptCode: asset.conceptCode, ctr: { gt: 0 } },
        select: { ctr: true, hookRate: true, spend: true, revenue: true },
        orderBy: { ctr: 'desc' },
        take: 20
    });

    const avgCtr = historical.reduce((s: number, h: any) => s + h.ctr, 0) / (historical.length || 1);
    const avgRoas = historical.reduce((s: number, h: any) => s + (h.spend > 0 ? h.revenue / h.spend : 0), 0) / (historical.length || 1);

    const prediction = await AiRouter.dispatch(
        storeId, TaskType.RESEARCH_FORENSIC,
        `Predice el rendimiento de este creativo basado en datos históricos.

CREATIVO:
Concepto: ${asset.conceptCode}
Hook: "${asset.hookText}"
Ángulo: ${asset.angle}
Framework: ${asset.framework}
Emoción dominante: ${asset.dominantEmotion}

HISTÓRICO MISMO CONCEPTO (${historical.length} creativos):
CTR promedio: ${avgCtr.toFixed(2)}%
ROAS promedio: ${avgRoas.toFixed(2)}x

Devuelve JSON:
{
  "predictedCtr": número,
  "predictedRoas": número,
  "confidence": 0-1,
  "strengths": [],
  "risks": [],
  "recommendation": "LAUNCH | TEST | REVISE"
}`,
        { jsonSchema: true }
    );

    let pred: any = { predictedCtr: avgCtr, predictedRoas: avgRoas, confidence: 0.5 };
    try {
        const clean = prediction.text.replace(/```json\s*/g, '').replace(/```/g, '').trim();
        pred = { ...pred, ...JSON.parse(clean) };
    } catch {}

    // Guardar en BD
    await (prisma as any).viralityScore.upsert({
        where: { creativeAssetId },
        create: { creativeAssetId, predictedCtr: pred.predictedCtr, predictedRoas: pred.predictedRoas, confidence: pred.confidence, basedOnSamples: historical.length },
        update: { predictedCtr: pred.predictedCtr, predictedRoas: pred.predictedRoas, confidence: pred.confidence, basedOnSamples: historical.length }
    }).catch(() => {});

    return NextResponse.json({ ok: true, ...pred, basedOnSamples: historical.length });
}
