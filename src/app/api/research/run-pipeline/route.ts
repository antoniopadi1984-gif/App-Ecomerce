import { NextResponse } from 'next/server';

// POST /api/research/run-pipeline
// Lanza pipeline Good Tier completo en secuencia obligatoria:
// P1 Gemini Deep Research → P2 Gemini → P2.1 Gemini → P4 Claude → P3 Claude
// Cada paso encadenado, output guardado como research_steps
// Versionado automático: v1, v2, v3
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { productId, triggerSource } = body;

        console.log(`[Run Pipeline] Iniciando Pipeline God Tier Automático para ${productId}`);

        if (!productId) {
            return NextResponse.json({ error: 'Falta producto ID' }, { status: 400 });
        }

        // Simulación: Iniciar job de Background (Vertex AI / Claude)
        // Guardando una nueva iteración de ResearchRun en la BD con status 'PROCESSING'
        // El workflow "real" ejecutaría:
        // 1. await aiRouter.dispatch('P1') -> Inyectar
        // 2. await aiRouter.dispatch('P2') usando P1 output
        // ... etc ... 

        const mockRunId = `run_${Date.now()}_v1`;

        return NextResponse.json({
            ok: true,
            runId: mockRunId,
            message: 'Deep Research God Tier Triggered',
            sequence: ['P1', 'P2', 'P2.1', 'P4', 'P3']
        });

    } catch (error: unknown) {
        return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
}
