import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ElevenLabsService } from '@/lib/services/elevenlabs-service';
import { AiRouter } from '@/lib/ai/router';
import { TaskType } from '@/lib/ai/providers/interfaces';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
    const { productId, assetId, language, storeId } = await req.json();

    if (!productId || !language || !storeId) {
        return NextResponse.json({ error: 'Faltan parámetros: productId, language, storeId' }, { status: 400 });
    }

    // Buscar el asset con transcripción
    const asset = await (prisma as any).creativeAsset.findUnique({
        where: { id: assetId },
        select: { id: true, name: true, transcription: true, driveFileId: true }
    });

    if (!asset?.transcription) {
        return NextResponse.json(
            { error: 'El asset no tiene transcripción. Transcribir primero desde Video Lab.' },
            { status: 400 }
        );
    }

    // 1. Traducir con Gemini via AiRouter
    const translation = await AiRouter.dispatch(
        storeId,
        TaskType.COPYWRITING_DEEP,
        `Traduce al ${language} este texto publicitario manteniendo exactamente el tono, urgencia, emoción y estructura:

"${asset.transcription}"

Devuelve SOLO el texto traducido, sin explicaciones ni comillas.`,
        {}
    );

    // 2. Generar audio con ElevenLabs en el idioma destino
    const voiceId = process.env.ELEVENLABS_VOICE_FEMALE || 'EXAVITQu4vr4xnSDxMaL';

    const audioBuffer = await ElevenLabsService.textToSpeech(
        translation.text,
        voiceId,
        { stability: 0.5, similarity_boost: 0.8 }
    );

    return NextResponse.json({
        success: true,
        translatedText: translation.text,
        audioBuffer: Buffer.from(audioBuffer).toString('base64'),
        language,
        assetId,
        message: `Traducción a ${language} completada`
    });
}
