import { NextRequest, NextResponse } from 'next/server';

import { generateCopy } from '@/lib/replicate-client';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { productId, productTitle, productDescription, type, angle, tone, language, storeId } = body;

        if (!productTitle) return NextResponse.json({ error: 'productTitle requerido' }, { status: 400 });

        // Claude via Replicate para copywriting — mayor calidad que Gemini para copy
        const script = await generateCopy({
            task: type === 'ugc' ? 'script_ugc' : 'script_avatar',
            productTitle,
            productDescription: productDescription || '',
            angle,
            tone,
            language: language || 'es',
        });

        return NextResponse.json({ success: true, script });
    } catch (error: any) {
        console.error('[generar-script]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
