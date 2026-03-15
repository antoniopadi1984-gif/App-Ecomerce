import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    const assetId = req.nextUrl.searchParams.get('assetId');
    if (!assetId) return NextResponse.json({ error: 'assetId requerido' }, { status: 400 });

    const asset = await (prisma as any).creativeAsset.findUnique({
        where: { id: assetId },
        select: {
            id: true, name: true, nomenclatura: true,
            processingStatus: true, conceptCode: true,
            funnelStage: true, driveUrl: true, metadata: true
        }
    });

    if (!asset) return NextResponse.json({ error: 'Asset no encontrado' }, { status: 404 });

    const meta = asset.metadata ? JSON.parse(asset.metadata) : {};

    return NextResponse.json({
        assetId:       asset.id,
        status:        asset.processingStatus,
        name:          asset.nomenclatura || asset.name,
        concept:       asset.conceptCode,
        conceptName:   meta.conceptName,
        traffic:       asset.funnelStage,
        awareness:     meta.awareness,
        awarenessName: meta.awarenessName,
        drivePath:     meta.drivePath,
        error:         meta.error
    });
}
