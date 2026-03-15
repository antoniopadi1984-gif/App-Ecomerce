import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * API que los agentes usan para obtener contexto completo de Drive de un producto.
 * Devuelve todos los assets organizados por concepto C1-C9.
 */
export async function GET(req: NextRequest) {
    const productId = req.nextUrl.searchParams.get('productId');
    const storeId   = req.headers.get('X-Store-Id');
    const concept   = req.nextUrl.searchParams.get('concept'); // C1, C2...
    const type      = req.nextUrl.searchParams.get('type');    // VIDEO, IMAGE, LANDING

    if (!productId) return NextResponse.json({ error: 'productId requerido' }, { status: 400 });

    const where: any = { productId, agentReadable: true };
    if (concept) where.conceptCode = concept;
    if (type)    where.assetType   = type;

    const assets = await (prisma as any).driveAsset.findMany({
        where,
        select: {
            id: true, driveFileId: true, driveUrl: true,
            drivePath: true, fileName: true, assetType: true,
            conceptCode: true, funnelStage: true, awarenessLevel: true,
            angle: true, hookScore: true, nomenclature: true,
            transcription: true, analysisJson: true,
            organized: true, createdAt: true
        },
        orderBy: { createdAt: 'desc' }
    });

    // Agrupar por concepto para facilitar uso del agente
    const byConceptCode: Record<string, any[]> = {};
    for (const asset of assets) {
        const key = asset.conceptCode || 'SIN_CONCEPTO';
        if (!byConceptCode[key]) byConceptCode[key] = [];
        byConceptCode[key].push(asset);
    }

    // Stats rápidas
    const stats = {
        total: assets.length,
        videos:   assets.filter((a: any) => a.assetType === 'VIDEO').length,
        images:   assets.filter((a: any) => a.assetType === 'IMAGE').length,
        landings: assets.filter((a: any) => a.assetType === 'LANDING').length,
        byConcept: Object.entries(byConceptCode).map(([concept, items]) => ({
            concept,
            count: items.length,
            types: [...new Set(items.map((i: any) => i.assetType))]
        }))
    };

    return NextResponse.json({
        ok: true,
        productId,
        assets,
        byConceptCode,
        stats
    });
}
