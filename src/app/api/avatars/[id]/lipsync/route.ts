import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ElevenLabsService } from '@/lib/services/elevenlabs-service';
import { getConnectionSecret } from '@/lib/server/connections';
import { uploadToProduct } from '@/lib/services/drive-service';
import Replicate from 'replicate';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const storeId = req.headers.get('X-Store-Id') || 'store-main';
    const { script, voiceId, productId } = await req.json();

    if (!script || !productId) {
        return NextResponse.json({ error: 'script y productId requeridos' }, { status: 400 });
    }

    // 1. Cargar avatar
    const avatar = await (prisma as any).avatarProfile.findUnique({ where: { id } });
    if (!avatar || avatar.status !== 'ACTIVE') {
        return NextResponse.json({ error: 'Avatar no encontrado o inactivo' }, { status: 404 });
    }
    if (!avatar.imageUrl) {
        return NextResponse.json({ error: 'Avatar sin imagen base. Genera la imagen primero.' }, { status: 400 });
    }

    // 2. Generar audio — SIEMPRE eleven_v3
    const audioBuffer = await ElevenLabsService.textToSpeech(
        script,
        voiceId || avatar.voiceId || process.env.ELEVENLABS_VOICE_FEMALE!,
        { stability: 0.5, similarity_boost: 0.75, style: 0.0 }
    );
    const audioBase64 = `data:audio/mpeg;base64,${Buffer.from(audioBuffer).toString('base64')}`;

    // 3. Generar lipsync con Replicate (wav2lip)
    const token = await getConnectionSecret('store-main', 'REPLICATE');
    const replicate = new Replicate({ auth: token! });

    const output = await replicate.run(
        'devxpy/cog-wav2lip:8d65e3f4f4298520e079198b493c25adfc43c058d021423f236aa1f6117010d3' as any,
        {
            input: {
                face: avatar.imageUrl,
                audio: audioBase64,
                pads: '0 10 0 0',
                smooth: true,
                resize_factor: 1
            }
        }
    );

    const videoUrl = Array.isArray(output) ? output[0] : output as string;

    // 4. Descargar y subir a Drive
    const videoBuffer = await fetch(videoUrl).then(r => r.arrayBuffer()).then(ab => Buffer.from(ab));
    const fileName = `LIPSYNC_${avatar.name}_${Date.now()}.mp4`;
    const driveResult = await uploadToProduct(
        videoBuffer, fileName, 'video/mp4', productId, storeId,
        { subfolderName: `AVATARES/${avatar.name}/LIPSYNC`, fileType: 'VIDEO' }
    );

    // 5. Crear AvatarAsset en BD
    await (prisma as any).avatarAsset.create({
        data: {
            avatarId: id,
            type: 'LIPSYNC_CLIP',
            url: driveResult.driveUrl,
            driveFileId: driveResult.driveFileId,
            mimeType: 'video/mp4',
            metadata: JSON.stringify({ script, duration: Math.ceil(script.length / 15) })
        }
    }).catch(() => {}); // No bloquea si avatarAsset no tiene todos los campos

    return NextResponse.json({
        ok: true,
        url: driveResult.driveUrl,
        driveFileId: driveResult.driveFileId,
        duration: Math.ceil(script.length / 15)
    });
}
