import { NextRequest, NextResponse } from 'next/server';
import { FunnelStageOptimizer } from '@/lib/creative/utils/funnel-stage-optimizer';
import { VideoAdOrchestrator } from '@/lib/creative/orchestrators/video-ad-orchestrator';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/creative/generate-funnel
 * 
 * Generar videos para todas las etapas del funnel (COLD/WARM/HOT)
 * 
 * Body:
 * {
 *   productId: string,
 *   stage?: 'COLD' | 'WARM' | 'HOT',  // O generar todas
 *   videosPerStage?: number  // Default: 3
 * }
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { productId, stage, videosPerStage = 3 } = body;

        if (!productId) {
            return NextResponse.json(
                { success: false, error: 'productId required' },
                { status: 400 }
            );
        }

        console.log('[API] Generate Funnel request:', { productId, stage, videosPerStage });

        // Obtener producto
        const product = await prisma.product.findUnique({
            where: { id: productId }
        });

        if (!product) {
            return NextResponse.json(
                { success: false, error: 'Product not found' },
                { status: 404 }
            );
        }

        // Obtener research (opcional)
        const research = await prisma.avatarResearch.findFirst({
            where: { productId },
            orderBy: { createdAt: 'desc' }
        });

        const researchData = research ? {
            targetAudience: research.levelOfAwareness || 'público general',
            painPoints: research.desires ? JSON.parse(research.desires as string) : [],
            benefits: []
        } : undefined;

        const orchestrator = new VideoAdOrchestrator();
        const results: any = {};

        if (stage) {
            // Generar solo para una etapa
            console.log(`[API] Generating for stage: ${stage}`);
            const configs = FunnelStageOptimizer.getConfigsForStage(
                stage,
                product,
                researchData
            ).slice(0, videosPerStage);

            results[stage.toLowerCase()] = await orchestrator.generateBatch(configs);
        } else {
            // Generar para todas las etapas
            console.log('[API] Generating full funnel...');
            const fullFunnel = FunnelStageOptimizer.generateFullFunnel(product, researchData);

            for (const [stageKey, configs] of Object.entries(fullFunnel)) {
                console.log(`[API] Generating ${stageKey}...`);
                const selected = configs.slice(0, videosPerStage);
                results[stageKey] = await orchestrator.generateBatch(selected);
            }
        }

        // Calcular costo total
        const allVideos = Object.values(results).flat() as any[];
        const totalCost = allVideos.reduce((sum, v) => sum + (v.cost?.total || 0), 0);

        console.log('[API] Funnel generation complete:', {
            stages: Object.keys(results),
            totalVideos: allVideos.length,
            totalCost
        });

        return NextResponse.json({
            success: true,
            results,
            totalVideos: allVideos.length,
            totalCost
        });

    } catch (error: any) {
        console.error('[API] Error generating funnel:', error);

        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to generate funnel',
                details: error.stack
            },
            { status: 500 }
        );
    }
}
