import { NextResponse } from 'next/server';
import { AiRouter } from '@/lib/ai/router';
import { TaskType } from '@/lib/ai/providers/interfaces';

export const runtime = 'nodejs';

// POST /api/research/mechanism-lab
// A partir de producto + mecanismo actual:
// → genera 20 mecanismos alternativos (Gemini Deep Research)
// → 10 reformulaciones más sofisticadas
// → 5 reencuadres de identidad del avatar
// → 5 enfoques de sistema paso a paso
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { productId, currentMechanism, storeId } = body;

        if (!productId) {
            return NextResponse.json({ error: 'Falta ID de Producto' }, { status: 400 });
        }

        console.log(`[Mechanism Lab] Iniciando para producto ${productId}, mecanismo: "${currentMechanism}"`);

        const result = await AiRouter.dispatch(
            storeId || 'store-main',
            TaskType.COPYWRITING_DEEP,
            `Actúa como el Copy Chief más brillante del mundo en direct response.

Producto: ${productId}
Mecanismo actual: "${currentMechanism || 'no especificado'}"

Genera en JSON:
{
  "mecanismosAlternativos": [20 mecanismos alternativos únicos y específicos],
  "reformulacionesSofisticadas": [10 reformulaciones más sofisticadas del mecanismo],
  "reencuadresIdentidad": [5 reencuadres de identidad del avatar],
  "enfoquesSistema": [5 enfoques de sistema paso a paso]
}`,
            { jsonSchema: true }
        );

        let data: any = {};
        try {
            data = JSON.parse(result.text.replace(/```json\s*/g, '').replace(/```/g, '').trim());
        } catch {
            data = { raw: result.text };
        }

        return NextResponse.json({ ok: true, data });

    } catch (error: unknown) {
        console.error('[Mechanism Lab]', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}
