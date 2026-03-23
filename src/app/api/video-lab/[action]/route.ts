import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { downloadFile, uploadToProduct } from '@/lib/services/drive-service';
import { ElevenLabsService } from '@/lib/services/elevenlabs-service';
import { AiRouter } from '@/lib/ai/router';
import { TaskType } from '@/lib/ai/providers/interfaces';
import { replicateRequest } from '@/lib/replicate-client';
import { generateSRT } from '@/lib/video/subtitle-utils';

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

const execAsync = promisify(exec);

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

        switch (action) {
            case 'transcribe': {
                if (asset.transcription) {
                    return NextResponse.json({ ok: true, transcription: asset.transcription });
                }
                // Re-transcribir si no hay transcripción
                if (!asset.driveFileId) return NextResponse.json({ error: 'Asset sin archivo en Drive' }, { status: 400 });
                const fileBuffer = await downloadFile(asset.driveFileId);
                const blob = new Blob([new Uint8Array(fileBuffer)], { type: 'audio/mp4' });
                const result = await ElevenLabsService.speechToText(blob);
                await (prisma as any).creativeAsset.update({ where: { id: assetId }, data: { transcription: result.text } });
                return NextResponse.json({ ok: true, transcription: result.text });
            }
            case 'change-voice': {
                const { voiceId } = body;
                if (!voiceId) return NextResponse.json({ error: 'voiceId required' }, { status: 400 });
                if (!asset.driveFileId) return NextResponse.json({ error: 'Asset sin archivo en Drive' }, { status: 400 });
                const fileBuffer = await downloadFile(asset.driveFileId);
                const audioBlob = new Blob([new Uint8Array(fileBuffer)], { type: 'audio/mp4' });
                const stsResponse = await fetch(`https://api.elevenlabs.io/v1/speech-to-speech/${voiceId}`, {
                    method: 'POST',
                    headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY! },
                    body: (() => { const f = new FormData(); f.append('audio', audioBlob, 'audio.mp4'); f.append('model_id', 'eleven_v3'); return f; })()
                });
                if (!stsResponse.ok) {
                    const err = await stsResponse.json();
                    return NextResponse.json({ error: err.detail || 'ElevenLabs STS error' }, { status: 500 });
                }
                const newAudio = await stsResponse.arrayBuffer();
                // Subir audio modificado a Drive junto al original
                const product = await prisma.product.findUnique({ where: { id: asset.productId || '' }, select: { sku: true } });
                const newDriveIdUpload = await uploadToProduct(Buffer.from(newAudio), `voice_swap_${asset.name}`, 'audio/mp4', asset.productId || '', asset.storeId || '', { conceptCode: asset.conceptCode, funnelStage: asset.funnelStage, fileType: 'AUDIO' });
                return NextResponse.json({ ok: true, driveFileId: newDriveIdUpload.driveFileId, message: 'Voz cambiada y subida a Drive' });
            }
            case 'lip-sync': {
                const { audioUrl, videoUrl } = body;
                if (!audioUrl && !asset.driveFileId) return NextResponse.json({ error: 'audioUrl o driveFileId required' }, { status: 400 });
                const prediction = await replicateRequest('/models/sync/lipsync-2-pro/predictions', {
                    input: {
                        video: videoUrl || `https://drive.google.com/uc?id=${asset.driveFileId}`,
                        audio: audioUrl,
                        fps: 25,
                        output_format: 'mp4'
                    }
                });
                return NextResponse.json({ ok: true, predictionId: prediction.id, message: 'Lipsync iniciado. Consulta estado en /api/replicate/status?id=' + prediction.id });
            }
            case 'add-music': {
                const { musicPrompt } = body;
                if (!asset.driveFileId) return NextResponse.json({ error: 'Asset sin archivo en Drive' }, { status: 400 });
                // 1. Generar música con ElevenLabs
                const musicResult = await ElevenLabsService.generateMusic(musicPrompt || 'upbeat electronic background music for product ad', 30);
                // 2. Descargar vídeo original
                const videoBuffer = await downloadFile(asset.driveFileId);
                // 3. Mezclar con FFmpeg: voz 100%, música 22%
                const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'music-'));
                const videoPath = path.join(tmpDir, 'video.mp4');
                const musicPath = path.join(tmpDir, 'music.mp3');
                const outputPath = path.join(tmpDir, 'output.mp4');
                await fs.writeFile(videoPath, videoBuffer);
                await fs.writeFile(musicPath, Buffer.from(musicResult));
                await execAsync(
                    `/usr/local/ffmpeg-libass/bin/ffmpeg -i '${videoPath}' -i '${musicPath}' -filter_complex '[0:a]volume=1.0[voice];[1:a]volume=0.22[music];[voice][music]amix=inputs=2:duration=first[out]' -map 0:v -map '[out]' -c:v copy -shortest '${outputPath}' -y`
                );
                const outputBuffer = await fs.readFile(outputPath);
                const product = await prisma.product.findUnique({ where: { id: asset.productId || '' }, select: { sku: true } });
                const newDriveUpload = await uploadToProduct(outputBuffer, `music_${asset.name}`, 'video/mp4', asset.productId || '', asset.storeId || '', { conceptCode: asset.conceptCode, funnelStage: asset.funnelStage, fileType: 'VIDEO' });
                await fs.rm(tmpDir, { recursive: true, force: true });
                return NextResponse.json({ ok: true, driveFileId: newDriveUpload.driveFileId, message: 'Música añadida al vídeo' });
            }
            case 'translate-audio': {
                const { targetLang = 'en', voiceId } = body;
                if (!asset.transcription) return NextResponse.json({ error: 'Transcribir primero' }, { status: 400 });
                // 1. Traducir con Gemini
                const translationResult = await AiRouter.dispatch(
                    asset.storeId, TaskType.COPYWRITING_DEEP,
                    `Traduce al ${targetLang} este texto publicitario manteniendo el tono, urgencia y emoción: ${asset.transcription}`,
                    {}
                );
                const translatedText = translationResult.text.trim();
                // 2. Generar audio con ElevenLabs TTS
                const audioBuffer = await ElevenLabsService.textToSpeech(translatedText, voiceId || 'EXAVITQu4vr4xnSDxMaL', { stability: 0.5, similarity_boost: 0.8 });
                // 3. Subir audio traducido a Drive
                const product = await prisma.product.findUnique({ where: { id: asset.productId || '' }, select: { sku: true } });
                const newDriveUpload = await uploadToProduct(Buffer.from(audioBuffer), `translated_${targetLang}_${asset.name}`, 'audio/mp3', asset.productId || '', asset.storeId || '', { conceptCode: asset.conceptCode, funnelStage: asset.funnelStage, fileType: 'AUDIO' });
                return NextResponse.json({ ok: true, driveFileId: newDriveUpload.driveFileId, translatedText, message: `Audio traducido al ${targetLang} y subido a Drive` });
            }
            case 'subtitles': {
                if (!asset.transcription) return NextResponse.json({ error: 'Transcribir primero' }, { status: 400 });
                if (!asset.driveFileId) return NextResponse.json({ error: 'Asset sin archivo en Drive' }, { status: 400 });
                const videoBuffer = await downloadFile(asset.driveFileId);
                const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'subs-'));
                const videoPath = path.join(tmpDir, 'video.mp4');
                const srtPath = path.join(tmpDir, 'subs.srt');
                const outputPath = path.join(tmpDir, 'subtitled.mp4');
                await fs.writeFile(videoPath, videoBuffer);
                
                // Generar SRT: Intentar usar palabras precisas de tagsJson si existen
                let srtContent = '';
                try {
                    const tags = JSON.parse(asset.tagsJson || '{}');
                    if (tags.words && Array.isArray(tags.words)) {
                        srtContent = generateSRT(tags.words);
                    }
                } catch (e) {}

                if (!srtContent) {
                    // Fallback a generación básica por palabras si no hay timestamps precisos
                    const words = asset.transcription.split(' ');
                    const srtLines: string[] = [];
                    const wordsPerLine = 6;
                    for (let i = 0; i < words.length; i += wordsPerLine) {
                        const idx = Math.floor(i / wordsPerLine) + 1;
                        const startSec = (i / words.length) * 30; // Estimación 30s
                        const endSec = Math.min(((i + wordsPerLine) / words.length) * 30, 30);
                        const toTime = (s: number) => {
                            const d = new Date(0); d.setSeconds(s);
                            const ms = Math.floor((s % 1) * 1000);
                            return d.toISOString().substr(11, 8) + ',' + String(ms).padStart(3, '0');
                        };
                        srtLines.push(`${idx}\n${toTime(startSec)} --> ${toTime(endSec)}\n${words.slice(i, i + wordsPerLine).join(' ')}\n`);
                    }
                    srtContent = srtLines.join('\n');
                }
                
                await fs.writeFile(srtPath, srtContent);

                // Quemar subtítulos con FFmpeg
                // Usamos un estilo más moderno y legible
                await execAsync(
                    `/usr/local/ffmpeg-libass/bin/ffmpeg -i '${videoPath}' -vf "subtitles='${srtPath}':force_style='Alignment=2,OutlineColour=&H10000000,BorderStyle=3,Outline=1,Shadow=0,MarginV=30,Fontname=Impact,Fontsize=18'" -c:a copy '${outputPath}' -y`
                );
                const outputBuffer = await fs.readFile(outputPath);
                const product = await prisma.product.findUnique({ where: { id: asset.productId || '' }, select: { sku: true } });
                const newDriveUpload = await uploadToProduct(outputBuffer, `subtitled_${asset.name}`, 'video/mp4', asset.productId || '', asset.storeId || '', { conceptCode: asset.conceptCode, funnelStage: asset.funnelStage, fileType: 'VIDEO' });
                await fs.rm(tmpDir, { recursive: true, force: true });
                return NextResponse.json({ ok: true, driveFileId: newDriveUpload.driveFileId, message: 'Subtítulos quemados en el vídeo' });
            }
            case 'generate-variants': {
                if (!asset.transcription) return NextResponse.json({ error: 'Transcribir primero' }, { status: 400 });
                const variantsResult = await AiRouter.dispatch(
                    asset.storeId, TaskType.COPYWRITING_DEEP,
                    `Genera 5 variaciones del hook de apertura para este anuncio. Transcripción: ${asset.transcription}.
    Cada variación debe usar un ángulo diferente: curiosidad, miedo, beneficio directo, pregunta, shock.
    Responde JSON: { "variants": [{ "angle": "...", "hook": "...", "opening_3_seconds": "..." }] }`,
                    { jsonSchema: true }
                );
                let variants = [];
                try { variants = JSON.parse(variantsResult.text.replace(/```json|```/g, '').trim()).variants; } catch {}
                // Guardar variantes en metadata
                const existing = JSON.parse(asset.metadata as string || '{}');
                await (prisma as any).creativeAsset.update({
                    where: { id: assetId },
                    data: { metadata: JSON.stringify({ ...existing, variants }) }
                });
                return NextResponse.json({ ok: true, variants, count: variants.length });
            }
            default:
                return NextResponse.json({ error: 'Action not supported' }, { status: 400 });
        }

    } catch (error: any) {
        console.error(`[VideoLab/${action}] Error:`, error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
