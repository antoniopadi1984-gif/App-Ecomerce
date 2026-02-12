import { NextRequest, NextResponse } from 'next/server';
import { VideoVariationGenerator } from '@/lib/creative/generators/video-variation-generator';
import { CreativeStorageService } from '@/lib/creative/services/creative-storage-service';

/**
 * Quick Video Variations API
 * POST /api/creative/quick-variations
 * 
 * Genera 5 variaciones rápidas de un video existente
 */

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            videoUrl,
            productId,
            type = 'BOTH', // 'AVATAR_SWAP' | 'VOICE_CHANGE' | 'BOTH'
            count = 5,
            funnelStage
        } = body;

        if (!videoUrl) {
            return NextResponse.json(
                { success: false, error: 'videoUrl required' },
                { status: 400 }
            );
        }

        console.log('[QuickVariations] Starting:', { videoUrl, type, count });

        const generator = new VideoVariationGenerator();

        // Generate variations
        const variations = await generator.generateQuickVariations({
            sourceVideoUrl: videoUrl,
            variationType: type,
            count: count,
            funnelStage: funnelStage
        });

        console.log(`[QuickVariations] ✅ Generated ${variations.length} variations`);

        // Save to database if productId provided
        if (productId && variations.length > 0) {
            const saved = await CreativeStorageService.saveBatch(
                variations.map(v => ({
                    productId,
                    type: 'VIDEO' as const,
                    stage: funnelStage,
                    videoUrl: v.videoUrl,
                    avatarUrl: v.avatarUrl,
                    audioUrl: v.audioUrl,
                    concept: `Quick Variation - ${type}`,
                    prompt: v.prompt || 'AI Generated Variation',
                    generationCost: v.cost || 0,
                    generatedBy: 'quick-variations'
                }))
            );

            console.log(`[QuickVariations] 💾 Saved ${saved.length} to database`);
        }

        // Calculate total cost
        const totalCost = variations.reduce((sum, v) => sum + (v.cost || 0), 0);

        return NextResponse.json({
            success: true,
            variations: variations.map(v => ({
                videoUrl: v.videoUrl,
                avatarUrl: v.avatarUrl,
                audioUrl: v.audioUrl,
                voiceId: v.voiceId,
                cost: v.cost
            })),
            count: variations.length,
            totalCost: Number(totalCost.toFixed(2))
        });

    } catch (error: any) {
        console.error('[QuickVariations] Error:', error);

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

/**
 * GET - List all variations for a product
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const productId = searchParams.get('productId');

        if (!productId) {
            return NextResponse.json(
                { success: false, error: 'productId required' },
                { status: 400 }
            );
        }

        const variations = await CreativeStorageService.getByProduct(productId, {
            generatedBy: 'quick-variations',
            limit: 50
        });

        return NextResponse.json({
            success: true,
            variations,
            count: variations.length
        });

    } catch (error: any) {
        console.error('[QuickVariations GET] Error:', error);

        return NextResponse.json(
            {
                success: false,
                error: error.message
            },
            { status: 500 }
        );
    }
}
