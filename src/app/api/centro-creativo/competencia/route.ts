import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { processCompetitorVideo } from '@/lib/creative/competitor-analysis-job';

/**
 * COMPETENCIA API
 * GET: List competitor videos for a product
 * POST: Import a new competitor video from URL
 */

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('productId');

        if (!productId || productId === 'GLOBAL') {
            return NextResponse.json({ videos: [] });
        }

        const videos = await (prisma as any).competitorVideo.findMany({
            where: { productId },
            orderBy: { createdAt: 'desc' }
        });

        // Map back to the structure expected by the frontend if necessary
        const mappedVideos = videos.map((v: any) => ({
            ...v,
            analysis: v.analysisJson ? JSON.parse(v.analysisJson) : null
        }));

        return NextResponse.json({ videos: mappedVideos });

    } catch (e: any) {
        console.error('Error fetching competitor videos:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { url, productId, storeId } = body;

        if (!url || !productId || !storeId) {
            return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
        }

        // 1. Create initial record
        const filename = `COMP_${Date.now()}.mp4`;
        const videoRecord = await (prisma as any).competitorVideo.create({
            data: {
                productId,
                storeId,
                sourceUrl: url,
                filename,
                status: 'ANALIZANDO'
            }
        });

        // 2. Trigger background analysis (Non-blocking)
        // Note: In Next.js App Router (Node.js runtime), this continues after response
        processCompetitorVideo(videoRecord.id, url, productId, storeId).catch(err => {
            console.error(`[API] Error starting background analysis for ${videoRecord.id}:`, err);
        });

        return NextResponse.json({
            success: true,
            video: {
                ...videoRecord,
                analysis: null
            }
        });

    } catch (e: any) {
        console.error('Error importing competitor video:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
