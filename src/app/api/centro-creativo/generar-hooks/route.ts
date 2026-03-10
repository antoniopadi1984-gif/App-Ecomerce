import { NextRequest, NextResponse } from 'next/server';
import { generateCopy } from '@/lib/replicate-client';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { productTitle, productDescription, angle, tone, language, quantity = 10 } = body;

        if (!productTitle) return NextResponse.json({ error: 'productTitle requerido' }, { status: 400 });

        const hooksRaw = await generateCopy({
            task: 'hook',
            productTitle,
            productDescription: productDescription || '',
            angle,
            tone,
            language: language || 'es',
            extraContext: `Genera exactamente ${quantity} hooks.`,
        });

        // Parse hooks — uno por línea numerada
        const hooks = hooksRaw
            .split('\n')
            .filter(l => l.match(/^\d+[\.\)]/))
            .map(l => l.replace(/^\d+[\.\)]\s*/, '').trim())
            .filter(Boolean);

        return NextResponse.json({ success: true, hooks, raw: hooksRaw });
    } catch (error: any) {
        console.error('[generar-hooks]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
