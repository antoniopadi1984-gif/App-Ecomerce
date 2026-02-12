import { NextRequest, NextResponse } from 'next/server';
import { VideoVariationGenerator } from '@/lib/creative/generators/video-variation-generator';

/**
 * POST /api/creative/generate-variations
 * 
 * Generar variaciones de un video existente
 * 
 * Body:
 * {
 *   videoUrl?: string,  // URL del video original
 *   driveFileId?: string,  // O ID de Google Drive
 *   avatarPrompts: string[],  // Prompts para nuevos avatares
 *   maxVariations?: number  // Default: 5
 * }
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            videoUrl,
            driveFileId,
            avatarPrompts,
            maxVariations = 5
        } = body;

        console.log('[API] Generate Variations request:', {
            hasVideoUrl: !!videoUrl,
            hasDriveId: !!driveFileId,
            promptCount: avatarPrompts?.length,
            maxVariations
        });

        if (!avatarPrompts || !Array.isArray(avatarPrompts) || avatarPrompts.length === 0) {
            return NextResponse.json(
                { success: false, error: 'avatarPrompts array required' },
                { status: 400 }
            );
        }

        if (!videoUrl && !driveFileId) {
            return NextResponse.json(
                { success: false, error: 'videoUrl or driveFileId required' },
                { status: 400 }
            );
        }

        const generator = new VideoVariationGenerator();
        let variations: any[] = [];

        if (driveFileId) {
            console.log('[API] Generating from Drive:', driveFileId);
            variations = await generator.generateFromDrive(
                driveFileId,
                avatarPrompts,
                maxVariations
            );
        } else if (videoUrl) {
            console.log('[API] Generating from URL:', videoUrl);
            variations = await generator.generateVariations(
                videoUrl,
                avatarPrompts,
                maxVariations
            );
        }

        console.log('[API] Variations generated:', variations?.length);

        return NextResponse.json({
            success: true,
            variations,
            count: variations?.length || 0
        });

    } catch (error: any) {
        console.error('[API] Error generating variations:', error);

        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to generate variations',
                details: error.stack
            },
            { status: 500 }
        );
    }
}
