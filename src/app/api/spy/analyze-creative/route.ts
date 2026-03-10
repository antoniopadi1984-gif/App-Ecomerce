import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AiRouter } from '@/lib/ai/router';
import { TaskType } from '@/lib/ai/providers/interfaces';

// POST /api/spy/analyze-creative
// Recibe vídeo o imagen ya guardado
// → Shot Breakdown completo (timeline por segundos)
// → guion exacto transcrito
// → diagnóstico por qué vende / por qué no
// → genera plantilla replicable
// → vincula a Research Core del producto activo
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { driveAssetId, productId } = body;

        console.log(`[Analyze Creative] Evaluando asset ${driveAssetId} del producto ${productId}...`);

        if (!driveAssetId) {
            return NextResponse.json({ error: 'driveAssetId es requerido' }, { status: 400 });
        }

        const asset = await (prisma as any).driveAsset.findUnique({ where: { id: driveAssetId } })
            ?? await (prisma as any).adSpyCapture.findUnique({ where: { id: driveAssetId } });

        if (!asset) return NextResponse.json({ error: 'Asset no encontrado' }, { status: 404 });

        const storeId = (req as any).headers?.get?.('X-Store-Id')
            || (asset.productId
                ? (await prisma.product.findUnique({ where: { id: asset.productId }, select: { storeId: true } }))?.storeId || ''
                : '');

        const aiResult = await AiRouter.dispatch(
            storeId,
            TaskType.RESEARCH_FORENSIC,
            `Eres un experto en análisis de creativos publicitarios de respuesta directa.
  Analiza este creativo de la competencia.
  URL/referencia: ${asset.sourceUrl || asset.url || asset.landingUrl || 'no disponible'}
  Tipo: ${asset.type || asset.assetType || 'VIDEO'}
  Transcripción: ${asset.transcription || 'no disponible'}

  Responde SOLO en JSON válido con esta estructura exacta:
  {
    "shotBreakdown": [{"time": "0-3s", "visual": "...", "copy": "..."}],
    "guionTranscrito": "...",
    "diagnostico": {
      "porQueVende": "...",
      "porQueNoVenderia": "...",
      "emocionPilar": "miedo|esperanza|identidad|curiosidad|urgencia"
    },
    "plantillaReplicable": "...",
    "hooks": ["...", "..."],
    "cta": "...",
    "funnelStage": "TOF"
  }`,
            { jsonSchema: true }
        );

        let analysis: any = {};
        try {
            const clean = aiResult.text.replace(/```json\s*/g, '').replace(/```/g, '').trim();
            analysis = JSON.parse(clean);
        } catch {
            analysis = { raw: aiResult.text };
        }

        // Guardar análisis en metadata del asset (si tiene ese campo)
        try {
            if (asset.metadata !== undefined) {
                await (prisma as any).driveAsset.update({
                    where: { id: driveAssetId },
                    data: { metadata: JSON.stringify({ ...JSON.parse((asset.metadata as string) || '{}'), analysis }) }
                });
            }
        } catch { /* si el modelo no tiene metadata, ignorar */ }

        return NextResponse.json({ ok: true, data: analysis });
    } catch (error: unknown) {
        return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
}
