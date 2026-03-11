import { NextRequest, NextResponse } from 'next/server';
import { replicateRequest } from '@/lib/replicate-client';

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

        const result = await replicateRequest('/models/anthropic/claude-opus-4-6/predictions', {
            input: {
                system: systemPrompt,
                prompt: userPrompt,
                max_tokens: 1024,
            }
        });

        return NextResponse.json({ ok: true, script: result });
    } catch (e: any) {
        console.error('[video-lab/script]', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
