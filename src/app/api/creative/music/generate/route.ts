import { NextRequest, NextResponse } from 'next/server';
import { uploadToProduct } from '@/lib/services/drive-service';
import { AiRouter } from '@/lib/ai/router';
import { TaskType } from '@/lib/ai/providers/interfaces';

export const runtime = 'nodejs';
export const maxDuration = 120;

export async function POST(req: NextRequest) {
    const {
        prompt,
        duration = 30,
        productId,
        storeId,
        mood = 'energetic',
        genre = 'electronic'
    } = await req.json();

    if (!productId || !storeId) {
        return NextResponse.json({ error: 'productId y storeId requeridos' }, { status: 400 });
    }

    // Generar música con Gemini Lyria-002
    const result = await AiRouter.dispatch(
        storeId,
        TaskType.MUSIC_GENERATION,
        `${prompt}. Mood: ${mood}. Genre: ${genre}. E-commerce ad background music. Duration: ${duration} seconds. High energy, professional production.`,
        { model: 'lyria-002', duration }
    );

    // Extraer audio del resultado
    let musicBuffer: Buffer;
    if (result.raw?.predictions?.[0]?.bytesBase64Encoded) {
        musicBuffer = Buffer.from(result.raw.predictions[0].bytesBase64Encoded, 'base64');
    } else if (result.raw?.predictions?.[0]?.audioUri) {
        // Descargar desde GCS
        const gcsRes = await fetch(result.raw.predictions[0].audioUri);
        musicBuffer = Buffer.from(await gcsRes.arrayBuffer());
    } else {
        return NextResponse.json({ error: 'Lyria no devolvió audio' }, { status: 500 });
    }

    // Subir a Drive
    const timestamp = Date.now();
    const fileName = `MUSIC_${mood}_${timestamp}.mp3`;
    const driveResult = await uploadToProduct(
        musicBuffer, fileName, 'audio/mpeg',
        productId, storeId,
        { subfolderName: 'MUSICA', fileType: 'AUDIO' }
    );

    return NextResponse.json({
        ok: true,
        fileName,
        driveUrl: driveResult.driveUrl,
        driveFileId: driveResult.driveFileId,
        duration,
        mood,
        genre
    });
}
