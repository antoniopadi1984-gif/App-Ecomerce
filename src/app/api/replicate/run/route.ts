import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 300;
export const runtime = 'nodejs';

/**
 * POST /api/replicate/run
 * Ejecuta CUALQUIER modelo de Replicate
 * Body: { model: "owner/name", input: {...}, async?: boolean }
 */
export async function POST(req: NextRequest) {
    try {
        const { model, input, async: isAsync = true } = await req.json();
        if (!model || !input) return NextResponse.json({ error: 'model e input requeridos' }, { status: 400 });

        const token = process.env.REPLICATE_API_TOKEN;
        if (!token) return NextResponse.json({ error: 'REPLICATE_API_TOKEN no configurado' }, { status: 500 });

        // Crear predicción con campo "model" (funciona para todos los modelos oficiales públicos)
        const payload: any = { model, input };
        if (!isAsync) payload.prefer = 'wait';

        const res = await fetch('https://api.replicate.com/v1/predictions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                ...(isAsync ? {} : { 'Prefer': 'wait=60' }),
            },
            body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (!res.ok) {
            return NextResponse.json({
                error: data.detail || data.title || 'Replicate error',
                status: res.status,
                model,
            }, { status: res.status });
        }

        return NextResponse.json({
            id: data.id,
            status: data.status,
            output: data.output,
            urls: data.urls,
            model,
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

/**
 * GET /api/replicate/run?id=xxx
 * Polling del estado de una predicción
 */
export async function GET(req: NextRequest) {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 });

    const token = process.env.REPLICATE_API_TOKEN;
    const res = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });

    const data = await res.json();
    return NextResponse.json({
        id: data.id,
        status: data.status,
        output: data.output,
        error: data.error,
        metrics: data.metrics,
    });
}
