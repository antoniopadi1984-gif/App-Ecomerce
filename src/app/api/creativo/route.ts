import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AiRouter } from '@/lib/ai/router';
import { TaskType } from '@/lib/ai/providers/interfaces';

export const maxDuration = 120;
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { action, storeId, ...payload } = body;

        // Acción DUMMY para UI placeholders
        if (action === 'ANALYZE_COMPETITOR') {
            const { url } = payload;
            const fakeAnalysis = await AiRouter.dispatch(
                storeId,
                TaskType.CRO_AUDIT, // Mapo a tarea genérica que devuelva CRO
                `Analiza la URL de competencia: ${url}\nHaz un breakdown de su estructura, psicología de ventas, ángulo y oferta.`,
                { context: 'Eres un analista CRO y Traffic Manager experto en Cashvertising.' }
            );

            return NextResponse.json({ ok: true, result: fakeAnalysis.text });
        }

        if (action === 'PROCESS_VIDEO') {
            const { filesCount, concept, funnel } = payload;
            // Simulador de procesamiento masivo en cola.
            // Spencer nomenclature: [PROD]_[CONCEPT]_[ANGLE]_[AVATAR]_[FUNNEL]_[V01]
            const outputs = [];
            for (let i = 0; i < filesCount; i++) {
                outputs.push(`PROD_${concept || 'GEN'}_ANGLE_AVATAR_${funnel || 'TOF'}_V${String(i + 1).padStart(2, '0')}`);
            }
            return NextResponse.json({ ok: true, processedNames: outputs });
        }

        return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });

    } catch (err: any) {
        console.error('[API /creativo]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
