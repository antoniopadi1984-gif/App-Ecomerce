import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 120;

async function replicateRun(model: string, input: Record<string, any>): Promise<string> {
    const token = process.env.REPLICATE_API_TOKEN;
    let createRes: Response = new Response('{}', { status: 500 });
    let pred: any = {};

    for (let attempt = 1; attempt <= 4; attempt++) {
        createRes = await fetch(
            `https://api.replicate.com/v1/models/${model}/predictions`,
            {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ input }),
            }
        );
        pred = await createRes.json();
        if (createRes.status === 429) {
            await new Promise(r => setTimeout(r, attempt * 12000));
            continue;
        }
        break;
    }

    if (!createRes.ok) throw new Error(`${model} ${createRes.status}: ${pred.detail || pred.title}`);

    const predId = pred.id;
    const start = Date.now();
    while (Date.now() - start < 120000) {
        await new Promise(r => setTimeout(r, 3000));
        const poll = await fetch(`https://api.replicate.com/v1/predictions/${predId}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        const pollData = await poll.json();
        if (pollData.status === 'succeeded') {
            const output = pollData.output;
            const url = Array.isArray(output) ? output[0] : output;
            return typeof url === 'string' ? url : String(url);
        }
        if (pollData.status === 'failed') throw new Error(`failed: ${pollData.error}`);
    }
    throw new Error('Timeout');
}

export async function POST(req: NextRequest) {
    try {
        const { prompt, aspectRatio = '9:16', productId } = await req.json();
        if (!prompt) return NextResponse.json({ error: 'prompt requerido' }, { status: 400 });

        // Cascade: flux-1.1-pro → flux-dev → flux-schnell
        const models = [
            'black-forest-labs/flux-1.1-pro',
            'black-forest-labs/flux-dev',
            'black-forest-labs/flux-schnell',
        ];

        const aspectMap: Record<string, string> = {
            '9:16': '9:16',
            '16:9': '16:9',
            '1:1': '1:1',
            '4:5': '4:5',
        };

        let imageUrl = '';
        for (const model of models) {
            try {
                imageUrl = await replicateRun(model, {
                    prompt,
                    aspect_ratio: aspectMap[aspectRatio] || '9:16',
                    num_outputs: 1,
                    output_format: 'webp',
                    output_quality: 90,
                });
                console.log(`[AvatarImage] ✅ ${model}`);
                break;
            } catch (e: any) {
                console.warn(`[AvatarImage] ${model} falló: ${e.message}`);
            }
        }

        if (!imageUrl) throw new Error('No se pudo generar imagen del avatar');

        return NextResponse.json({ imageUrl, model: 'flux' });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
