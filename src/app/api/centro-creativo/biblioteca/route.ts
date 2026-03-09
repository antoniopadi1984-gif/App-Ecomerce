import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const productId = searchParams.get('productId');
        const storeId = searchParams.get('storeId');

        if (!productId) {
            return NextResponse.json({ error: 'Missing productId' }, { status: 400 });
        }

        const artifacts = await (prisma as any).creativeArtifact.findMany({
            where: { productId },
            include: {
                concept: {
                    select: {
                        number: true,
                        name: true,
                        status: true,
                        spend: true,
                        revenue: true,
                        roas: true,
                        ctr: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Map to UI-friendly format
        const formatted = artifacts.map((art: any) => {
            let metrics = {};
            try {
                metrics = art.metricsJson ? JSON.parse(art.metricsJson) : {};
            } catch (e) { }

            return {
                id: art.id,
                nomenclatura: art.creativeCode,
                thumbnailUrl: art.thumbnailUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=700&fit=crop', // Fallback
                videoUrl: art.driveUrl,
                type: art.type,
                funnelStage: art.funnelStage,
                metaStatus: art.metaStatus,
                metaAdId: art.metaAdId,
                format: art.format || '9:16',
                framework: art.framework || 'DTC',
                hookType: art.hookType || 'Curiosidad',
                conceptCode: art.concept ? `CONC${String(art.concept.number).padStart(2, '0')}` : 'GEN',
                conceptName: art.concept?.name || 'General',
                score: art.preLaunchScore || 0,
                date: art.createdAt,
                duration: art.durationSeconds ? `${Math.floor(art.durationSeconds / 60)}:${String(art.durationSeconds % 60).padStart(2, '0')}` : '0:30',
                version: art.version,
                metrics: {
                    ctr: art.concept?.ctr || 0,
                    roas: art.concept?.roas || 0,
                    spend: art.concept?.spend || 0,
                    revenue: art.concept?.revenue || 0,
                    ...metrics
                }
            };
        });

        return NextResponse.json({ artifacts: formatted });

    } catch (err: any) {
        console.error('[API /biblioteca]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const body = await req.json();
        const { artifactIds, updates } = body;

        if (!artifactIds || !Array.isArray(artifactIds)) {
            return NextResponse.json({ error: 'Invalid artifactIds' }, { status: 400 });
        }

        await (prisma as any).creativeArtifact.updateMany({
            where: { id: { in: artifactIds } },
            data: updates
        });

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('[API /biblioteca PATCH]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
