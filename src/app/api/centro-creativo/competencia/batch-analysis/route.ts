import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('productId');

        if (!productId || productId === 'GLOBAL') {
            return NextResponse.json({ success: false, error: "ProductId required" }, { status: 400 });
        }

        const videos = await (prisma as any).competitorVideo.findMany({
            where: {
                productId,
                status: 'LISTO'
            }
        });

        if (videos.length < 2) {
            return NextResponse.json({
                success: true,
                showBatch: false,
                message: "Necesitas al menos 2 vídeos analizados para ver patrones."
            });
        }

        // Aggregate statistics
        const hookTypes: Record<string, number> = {};
        const frameworks: Record<string, number> = {};
        let totalHookDuration = 0;
        let totalCutPace = 0;
        let countWithAnalysis = 0;

        videos.forEach((v: any) => {
            if (v.analysisJson) {
                const analysis = JSON.parse(v.analysisJson);
                const exec = analysis.executive;

                if (exec) {
                    countWithAnalysis++;

                    // Hook Type
                    if (exec.hookType) {
                        hookTypes[exec.hookType] = (hookTypes[exec.hookType] || 0) + 1;
                    }

                    // Framework
                    if (exec.framework) {
                        frameworks[exec.framework] = (frameworks[exec.framework] || 0) + 1;
                    }

                    // Duration (parsing "2.2s" etc)
                    if (exec.hookDuration) {
                        const val = parseFloat(exec.hookDuration.replace('s', ''));
                        if (!isNaN(val)) totalHookDuration += val;
                    }

                    // Cut Pace (parsing "38 c/m" etc)
                    if (exec.cutPace) {
                        const val = parseFloat(exec.cutPace.split(' ')[0]);
                        if (!isNaN(val)) totalCutPace += val;
                    }
                }
            }
        });

        // Sort hook types and frameworks
        const sortedHookTypes = Object.entries(hookTypes).sort((a, b) => b[1] - a[1]);
        const sortedFrameworks = Object.entries(frameworks).sort((a, b) => b[1] - a[1]);

        return NextResponse.json({
            success: true,
            showBatch: true,
            data: {
                totalAnalysed: videos.length,
                avgHookDuration: countWithAnalysis > 0 ? (totalHookDuration / countWithAnalysis).toFixed(1) + 's' : '0s',
                avgCutPace: countWithAnalysis > 0 ? Math.round(totalCutPace / countWithAnalysis) + ' c/m' : '0 c/m',
                topHookTypes: sortedHookTypes.slice(0, 3).map(([type]) => type),
                dominantFramework: sortedFrameworks[0]?.[0] || 'DTC Direct',
                recommendation: countWithAnalysis > 0
                    ? `El mercado está saturado de ${sortedHookTypes[0]?.[0] || 'este ángulo'}. Te recomendamos probar un Hook de Curiosidad con ritmo alto (${Math.round(totalCutPace / countWithAnalysis) + 5} c/m).`
                    : "No hay datos suficientes para generar una recomendación precisa."
            }
        });

    } catch (error: any) {
        console.error('[API-BATCH] Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
