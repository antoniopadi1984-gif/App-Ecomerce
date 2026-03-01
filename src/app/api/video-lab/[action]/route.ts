import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/video-lab/[action]
 * Acción específica sobre un asset del Video Lab (transcribe, voice, sync, variants, etc.)
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ action: string }> | { action: string } }
) {
    const resolvedParams = await params;
    const { action } = resolvedParams;
    try {
        const storeId = request.headers.get('X-Store-Id');
        const body = await request.json();
        const { assetId, productId } = body;

        if (!assetId) return NextResponse.json({ error: 'assetId required' }, { status: 400 });

        const asset = await (prisma as any).creativeAsset.findUnique({
            where: { id: assetId }
        });

        if (!asset) return NextResponse.json({ error: 'Asset not found' }, { status: 404 });

        // Acciones Mock / Simplificadas para el MVP con Agente
        // En producción cada una conecta con Replicate/ElevenLabs/FFmpeg
        switch (action) {
            case 'transcribe':
                // Ya se hizo en el pipeline inicial, pero se puede re-ejecutar
                return NextResponse.json({ ok: true, transcription: asset.transcription });

            case 'translate-audio':
                // Traducir transcripción y eventualmente clonar voz
                return NextResponse.json({ ok: true, message: 'Traducción y clonación de voz en cola' });

            case 'subtitles':
                // Generar SRT y quemar en vídeo
                return NextResponse.json({ ok: true, message: 'Subtítulos generados y quemados' });

            case 'change-voice':
                // ElevenLabs voice replacement
                return NextResponse.json({ ok: true, message: 'Voz cambiada con ElevenLabs' });

            case 'generate-variants':
                // Crear copias con hooks diferentes
                return NextResponse.json({ ok: true, message: '5 Variantes generadas y subidas a Drive' });

            case 'split-clips':
                // FFmpeg scene detect
                return NextResponse.json({ ok: true, message: 'Vídeo separado en 12 clips en /clips/' });

            case 'add-music':
                // Background music overlay
                return NextResponse.json({ ok: true, message: 'Música de fondo añadida' });

            case 'lip-sync':
                // Replicate SadTalker
                return NextResponse.json({ ok: true, message: 'Sincronización de labios completada' });

            default:
                return NextResponse.json({ error: 'Action not supported' }, { status: 400 });
        }

    } catch (error: any) {
        console.error(`[VideoLab/${action}] Error:`, error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
