import { NextResponse } from 'next/server';

// POST /api/spy/analyze-creative
// Recibe vídeo o imagen ya guardado
// → Shot Breakdown completo (timeline por segundos)
// → guion exacto transcrito
// → diagnóstico por qué vende / por qué no
// → genera plantilla replicable
// → vincula a Research Core del producto activo
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { driveAssetId, productId } = body;

        console.log(`[Analyze Creative] Evaluando asset ${driveAssetId} del producto ${productId}...`);

        if (!driveAssetId) {
            return NextResponse.json({ error: 'driveAssetId es requerido' }, { status: 400 });
        }

        // Mock response de análisis profundo de Creativo
        const mockAnalysis = {
            shotBreakdown: [
                { time: '0:00-0:03', visual: 'Hook visual fuerte, patrón interrumpido', copy: '¿Te has despertado y te duele la espalda?' },
                { time: '0:03-0:10', visual: 'Problema en acción, persona frotándose la lumbar', copy: 'Ese dolor matutino te está robando energía...' },
                { time: '0:10-0:25', visual: 'Introducción del producto (Mecanismo), close up', copy: 'Con nuestra tecnología de alineamiento espinal...' },
                { time: '0:25-0:30', visual: 'Resultado, persona feliz haciendo deporte, CTA', copy: 'Recupera tu movilidad hoy, 50% de descuento.' }
            ],
            guionTranscrito: '¿Te has despertado y te duele la espalda? Ese dolor matutino te está robando energía... Con nuestra tecnología de alineamiento espinal... Recupera tu movilidad hoy, 50% de descuento.',
            diagnostico: {
                porQueVende: 'Identifica el dolor inmediato y ofrece una solución visual (mecanismo)',
                porQueNoVenderia: 'El CTA es un poco débil y apresurado.',
                emocionPilar: 'Esperanza / Alivio'
            },
            plantillaReplicable: 'HOOK: Pregunta sobre dolor crónico -> BUILDUP: Consecuencia del dolor crónico -> MECANISMO: Close up al producto -> RESULTADO/CTA: Usuario activo y oferta por tiempo limitado.'
        };

        // En código real guardaríamos esto enriquecido dentro de `metadata` del DriveAsset.

        return NextResponse.json({ ok: true, data: mockAnalysis });
    } catch (error: unknown) {
        return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
}
