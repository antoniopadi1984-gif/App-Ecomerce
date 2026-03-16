import { NextRequest, NextResponse } from 'next/server';
import { VideoAdOrchestrator } from '@/lib/creative/orchestrators/video-ad-orchestrator';
import { ResearchLabConnector } from '@/lib/creative/integration/research-lab-connector';

export const maxDuration = 300;

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            productId,
            configs: customConfigs,
            maxVideos = 3,
            format = '9:16',
            model = 'balanced',
            mode = 'auto',
            avatarStyle = 'auto',
            storeId,
            customScript,
        } = body;

        const quality = model === 'premium' ? 'premium' : model === 'fast' ? 'fast' : 'standard';

        let configs;

        if (customConfigs && Array.isArray(customConfigs)) {
            configs = customConfigs;
        } else if (productId) {
            try {
                configs = await ResearchLabConnector.getVideoConfigsFromResearch(
                    productId, maxVideos, { mode, avatarStyle, format, storeId, customScript }
                );
            } catch {
                configs = ResearchLabConnector.getTestConfigs();
            }
        } else {
            configs = ResearchLabConnector.getTestConfigs();
        }

        if (!configs || configs.length === 0) {
            return NextResponse.json({ success: false, error: 'No video configs available' }, { status: 400 });
        }

        const orchestrator = new VideoAdOrchestrator();
        const results = await orchestrator.generateBatch(configs, { quality, format });

        return NextResponse.json({
            success: true,
            videos: results,
            totalCost: results.reduce((sum, r) => sum + r.cost.total, 0)
        });

    } catch (error: any) {
        console.error('[API] Error generating videos:', error);
        return NextResponse.json({ success: false, error: error.message || 'Failed to generate videos' }, { status: 500 });
    }
}
