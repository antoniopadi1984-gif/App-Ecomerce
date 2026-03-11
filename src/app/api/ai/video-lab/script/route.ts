import { NextRequest, NextResponse } from 'next/server';
import { AiRouter } from '@/lib/ai/router';
import { TaskType } from '@/lib/ai/providers/interfaces';

/**
 * POST /api/ai/video-lab/script
 * Genera el script de un vídeo ad usando el pipeline de Replicate/Claude.
 */
export async function POST(req: NextRequest) {
    try {
        const { prompt, product, tone, duration } = await req.json();

        if (!prompt && !product) {
            return NextResponse.json({ error: 'prompt o product requerido' }, { status: 400 });
        }

        const systemPrompt = `Eres un copywriter experto en vídeo ads de respuesta directa para ecommerce.
Escribe scripts de vídeo cortos, concisos y con alta tasa de conversión.
Formato: Hook (3s) → Problema (5s) → Solución (8s) → CTA (4s).`;

        const userPrompt = prompt || `Escribe un script de ${duration || 20} segundos para el producto: ${product}. Tono: ${tone || 'persuasivo y urgente'}.`;

        const response = await AiRouter.dispatch(
            'default', // video-lab podría no tener storeId en la request actual, usamos default o un param si existe
            TaskType.RESEARCH_DEEP, // Mapeado a Gemini
            userPrompt,
            {
                systemPrompt: systemPrompt
            }
        );

        return NextResponse.json({ ok: true, script: response.text });
    } catch (e: any) {
        console.error('[video-lab/script]', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
