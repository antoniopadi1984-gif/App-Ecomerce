import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');
    const conceptId = searchParams.get('conceptId');

    if (!productId) return NextResponse.json({ error: 'Missing productId' }, { status: 400 });

    const where: any = { productId };
    if (conceptId) where.conceptCode = conceptId;

    const assets = await (prisma as any).creativeAsset.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        select: {
            id: true, name: true, nomenclatura: true, type: true,
            driveUrl: true, driveFileId: true, processingStatus: true,
            conceptCode: true, funnelStage: true, hookScore: true,
            angle: true, transcription: true, metadata: true,
            spend: true, revenue: true, hookRate: true, ctr: true,
            verdict: true, createdAt: true
        }
    });

    const creatives = assets.map((a: any) => {
        const meta = a.metadata ? JSON.parse(a.metadata) : {};
        return {
            id: a.id,
            nomenclature: a.nomenclatura || a.name,
            concept: a.conceptCode,
            traffic: a.funnelStage,
            awareness: meta.awareness,
            angle: a.angle || meta.angle,
            hookScore: a.hookScore,
            driveUrl: a.driveUrl,
            status: a.processingStatus,
            type: a.type,
            metrics: {
                spend:    a.spend    || 0,
                roas:     a.spend > 0 ? (a.revenue / a.spend) : 0,
                ctr:      a.ctr      || 0,
                hookRate: a.hookRate || 0,
            },
            verdict: a.verdict,
            createdAt: a.createdAt
        };
    });

    return NextResponse.json({ success: true, creatives, total: creatives.length });
}
