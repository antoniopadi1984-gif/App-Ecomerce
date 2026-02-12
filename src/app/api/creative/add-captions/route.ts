import { NextRequest, NextResponse } from 'next/server';
import { CaptionGenerator } from '@/lib/creative/generators/caption-generator';
import { CreativeStorageService } from '@/lib/creative/services/creative-storage-service';

/**
 * POST /api/creative/add-captions
 * 
 * Agregar subtítulos a un video
 * 
 * Body:
 * {
 *   videoUrl: string,
 *   audioUrl: string,
 *   style?: 'bold' | 'clean' | 'animated',
 *   creativeId?: string  // Para actualizar DB
 * }
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            videoUrl,
            audioUrl,
            style = 'bold',
            creativeId
        } = body;

        if (!videoUrl || !audioUrl) {
            return NextResponse.json(
                { success: false, error: 'videoUrl and audioUrl required' },
                { status: 400 }
            );
        }

        console.log('[API] Adding captions:', { videoUrl, audioUrl, style });

        const generator = new CaptionGenerator();

        const result = await generator.generateAndAddCaptions(
            videoUrl,
            audioUrl,
            style
        );

        console.log('[API] Captions added:', result.captionedVideoUrl);

        // Actualizar en DB si se proporcionó creativeId
        if (creativeId) {
            await CreativeStorageService.updateCaptionsUrl(
                creativeId,
                result.captionedVideoUrl
            );
            console.log('[API] Updated creative in DB');
        }

        return NextResponse.json({
            success: true,
            captionedVideoUrl: result.captionedVideoUrl,
            segments: result.segments,
            segmentCount: result.segments.length
        });

    } catch (error: any) {
        console.error('[API] Error adding captions:', error);

        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to add captions',
                details: error.stack
            },
            { status: 500 }
        );
    }
}

/**
 * POST /api/creative/batch-captions
 * 
 * Agregar subtítulos a múltiples videos
 */
export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { videos, style = 'bold' } = body;

        if (!videos || !Array.isArray(videos)) {
            return NextResponse.json(
                { success: false, error: 'videos array required' },
                { status: 400 }
            );
        }

        console.log('[API] Batch captions:', videos.length);

        const generator = new CaptionGenerator();
        const results = await generator.batchAddCaptions(videos, style);

        console.log('[API] Batch complete:', results.length);

        return NextResponse.json({
            success: true,
            results,
            count: results.length
        });

    } catch (error: any) {
        console.error('[API] Error batch captions:', error);

        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to add batch captions'
            },
            { status: 500 }
        );
    }
}
