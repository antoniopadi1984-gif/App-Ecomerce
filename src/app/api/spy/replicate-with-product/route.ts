import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AiRouter } from '@/lib/ai/router';
import { TaskType } from '@/lib/ai/providers/interfaces';

export const runtime = 'nodejs';
export const maxDuration = 120;

export async function POST(req: NextRequest) {
    const storeId = req.headers.get('X-Store-Id');
    const { competitorAssetId, productId } = await req.json();

    // Cargar análisis del vídeo de competencia
    const competitorAsset = await (prisma as any).creativeAsset.findUnique({
        where: { id: competitorAssetId },
        select: { 
            transcription: true, 
            hookText: true, 
            angulo: true, 
            funnelStage: true, 
            type: true, 
            tagsJson: true, 
            name: true 
        }
    });
    if (!competitorAsset) return NextResponse.json({ error: 'Asset no encontrado' }, { status: 404 });

    // Extraer hookScore y metadata de tagsJson
    const tags = JSON.parse(competitorAsset.tagsJson || '{}');
    const hookScore = tags.hookScore || 0;

    // Cargar producto y branding
    const product = await (prisma as any).product.findUnique({
        where: { id: productId },
        select: { title: true, description: true, category: true }
    });
    
    // El branding se carga usando branding-engine o directamente para evitar duplicar lógica
    const branding = await (prisma as any).productBranding.findUnique({ where: { productId } });

    const prompt = `Eres un copywriter de élite especializado en Direct Response.
    
VÍDEO DE COMPETENCIA ANALIZADO:
- Tipo: ${competitorAsset.type}
- Fase del funnel: ${competitorAsset.funnelStage}
- Hook detectado: ${competitorAsset.hookText}
- Ángulo: ${competitorAsset.angulo}
- Hook score: ${hookScore}/10
- Transcripción: ${competitorAsset.transcription}

TU PRODUCTO:
- Nombre: ${product?.title}
- Descripción: ${product?.description}
- Categoría: ${product?.category}
${branding ? `- Tono de marca: ${branding.brandVoice}` : ''}

MISIÓN: Genera 3 versiones de este vídeo adaptadas a tu producto.
Versión 1: Réplica directa (misma estructura, mismo ángulo, tu producto)
Versión 2: Réplica mejorada (misma estructura + mejoras detectadas)
Versión 3: Versión evolucionada (ángulo diferente, estructura ganadora del competidor)

Responde SOLO en JSON:
{
  "versions": [
    {
      "version": 1,
      "type": "REPLICA_DIRECTA",
      "hook": "hook idéntico adaptado a tu producto (2-3 segundos, conversacional)",
      "script": "guión completo 60 segundos",
      "shotList": [
        {"second": "0-3", "visual": "descripción visual", "audio": "texto narración"},
        {"second": "3-8", "visual": "...", "audio": "..."}
      ],
      "ugcPrompt": "prompt para generar avatar UGC que recite este script",
      "videoPrompt": "prompt para Veo 3 / Kling para las escenas de producto"
    },
    {
      "version": 2,
      "type": "REPLICA_MEJORADA",
      "hook": "...",
      "script": "...",
      "shotList": [...],
      "ugcPrompt": "...",
      "videoPrompt": "..."
    },
    {
      "version": 3,
      "type": "VERSION_EVOLUCIONADA",
      "hook": "...",
      "script": "...",
      "shotList": [...],
      "ugcPrompt": "...",
      "videoPrompt": "..."
    }
  ],
  "competitorWeaknesses": ["debilidad 1", "debilidad 2"],
  "whyItWorks": "análisis de por qué funciona este formato",
  "suggestedFormat": "9:16|16:9|1:1"
}`;

    const aiResult = await AiRouter.dispatch(storeId || '', TaskType.COPYWRITING_DEEP, prompt, { jsonSchema: true });

    let versions: any = {};
    try {
        versions = JSON.parse(aiResult.text.replace(/```json\s*/g, '').replace(/```/g, '').trim());
    } catch {
        return NextResponse.json({ error: 'Error parseando respuesta IA' }, { status: 500 });
    }

    // Guardar en BD como ReplicationJob o CreativeArtifact (según arquitectura local)
    // Nota: Se usa 'creativeArtifact' as requested, pero mapeando a campos que existen o se asumen dinámicos
    const replication = await (prisma as any).creativeArtifact.create({
        data: {
            productId,
            storeId: storeId || '',
            type: 'VIDEO_REPLICATION',
            // sourceAssetId, content y status se usan con 'as any' para permitir extensibilidad del schema
            sourceAssetId: competitorAssetId,
            content: JSON.stringify(versions),
            status: 'SCRIPTS_READY',
            // Campos obligatorios según schema.prisma
            creativeCode: `REPL_${competitorAssetId.slice(0, 8)}_${Date.now()}`,
            conceptId: 'REPLICATION', // Placeholder
            version: 1,
            funnelStage: competitorAsset.funnelStage || 'TOFU',
            framework: 'COMPETITOR_REPLICATION',
            hookType: 'REPLICA',
            emotion: 'NEUTRAL',
            driveUrl: '',
            driveFileId: '',
            thumbnailUrl: '',
            metaStatus: 'DRAFT',
            generationCost: aiResult.usage?.costEur || 0
        }
    }).catch((e: any) => {
        console.error('[ReplicateProduct] Error saving artifact:', e);
        return null;
    });

    return NextResponse.json({ ok: true, versions, replicationId: replication?.id });
}
