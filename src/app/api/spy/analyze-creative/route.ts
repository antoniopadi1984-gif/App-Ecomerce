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

        const asset = await prisma.driveAsset.findUnique({ where: { id: driveAssetId } });
        if (!asset) return NextResponse.json({ error: 'Asset no encontrado' }, { status: 404 });
        
        const storeId = asset.productId
          ? (await prisma.product.findUnique({ where: { id: asset.productId }, select: { storeId: true } }))?.storeId || ''
          : '';
        
        const result = await AiRouter.dispatch(
          storeId,
          TaskType.RESEARCH_DEEP,
          `Eres un experto en análisis de creativos publicitarios. Analiza este creativo de la competencia.
          URL/Path: ${asset.sourceUrl || asset.drivePath}
          Tipo: ${asset.assetType}
          
          Responde en JSON con esta estructura:
          {
            "shotBreakdown": [{"time": "...", "visual": "...", "copy": "..."}],
            "guionTranscrito": "string",
            "diagnostico": { "porQueVende": "...", "porQueNoVenderia": "...", "emocionPilar": "..." },
            "plantillaReplicable": "string",
            "hooks": ["string"],
            "cta": "string",
            "funnelStage": "string"
          }`,
          { jsonSchema: true }
        );
        
        let analysis;
        try {
          const clean = result.text.replace(/```json\s*/g, '').replace(/```/g, '').trim();
          analysis = JSON.parse(clean);
        } catch {
          analysis = { raw: result.text };
        }
        
        // Guardar análisis en metadata del asset
        await prisma.driveAsset.update({
          where: { id: driveAssetId },
          data: { metadata: JSON.stringify({ ...JSON.parse((asset.metadata as string) || '{}'), analysis }) }
        });
        
        return NextResponse.json({ ok: true, data: analysis });
    } catch (error: unknown) {
        return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
}
