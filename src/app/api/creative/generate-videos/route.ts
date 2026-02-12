import { NextRequest, NextResponse } from 'next/server';
import { VideoAdOrchestrator } from '@/lib/creative/orchestrators/video-ad-orchestrator';
import { ResearchLabConnector } from '@/lib/creative/integration/research-lab-connector';

/**
 * POST /api/creative/generate-videos
 * 
 * Generar videos batch desde Research Lab o configs custom
 * 
 * Body:
 * {
 *   productId?: string,  // Opcional: usa research del producto
 *   configs?: VideoAdConfig[],  // Opcional: configs custom
 *   maxVideos?: number  // Default: 3
 * }
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { productId, configs: customConfigs, maxVideos = 3 } = body;

        console.log('[API] Generate Videos request:', { productId, hasCustomConfigs: !!customConfigs, maxVideos });

        let configs;

        // Opción 1: Usar configs custom
        if (customConfigs && Array.isArray(customConfigs)) {
            configs = customConfigs;
            console.log('[API] Using custom configs:', configs.length);
        }
        // Opción 2: Cargar desde Research Lab
        else if (productId) {
            console.log('[API] Loading configs from Research Lab for product:', productId);
            try {
                configs = await ResearchLabConnector.getVideoConfigsFromResearch(productId, maxVideos);
                console.log('[API] Loaded', configs.length, 'configs from research');
            } catch (error) {
                console.warn('[API] No research found, using test configs');
                configs = ResearchLabConnector.getTestConfigs();
            }
        }
        // Opción 3: Usar configs de test
        else {
            console.log('[API] Using test configs');
            configs = ResearchLabConnector.getTestConfigs();
        }

        if (!configs || configs.length === 0) {
            return NextResponse.json(
                { success: false, error: 'No video configs available' },
                { status: 400 }
            );
        }

        // Generar videos
        console.log('[API] Generating', configs.length, 'videos...');
        const orchestrator = new VideoAdOrchestrator();

        const results = await orchestrator.generateBatch(configs);

        console.log('[API] Videos generated successfully:', results.length);

        return NextResponse.json({
            success: true,
            videos: results,
            totalCost: results.reduce((sum, r) => sum + r.cost.total, 0)
        });

    } catch (error: any) {
        console.error('[API] Error generating videos:', error);

        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to generate videos',
                details: error.stack
            },
            { status: 500 }
        );
    }
}
