import { NextRequest, NextResponse } from 'next/server';
import { ResearchOrchestrator } from '@/lib/research/research-orchestrator';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(req: NextRequest) {
    const { productId, storeId } = await req.json();
    if (!productId || !storeId) {
        return NextResponse.json({ error: 'productId y storeId requeridos' }, { status: 400 });
    }

    // Fire and forget — cliente hace polling
    const runId = `run_${Date.now()}_v1`;
    ;(async () => {
        try {
            const orchestrator = new ResearchOrchestrator(productId);
            await orchestrator.runFullResearch();
        } catch (e: any) {
            console.error('[RunPipeline] Error:', e.message);
        }
    })();

    return NextResponse.json({
        ok: true,
        runId,
        message: 'Research God Tier iniciado',
        sequence: ['P1', 'P2', 'P2.1', 'P4', 'P3']
    });
}
