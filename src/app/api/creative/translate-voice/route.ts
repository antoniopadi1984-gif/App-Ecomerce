import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { writeFile, readFile, rm, mkdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomBytes } from 'crypto';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
export const maxDuration = 300;
export const runtime = 'nodejs';

// Job store en memoria (en producción usar Redis/BD)
const jobs: Record<string, any> = {};

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('jobId');
    if (!jobId || !jobs[jobId]) return NextResponse.json({ error: 'Job no encontrado' }, { status: 404 });
    return NextResponse.json(jobs[jobId]);
}

export async function POST(req: NextRequest) {
    const formData = await req.formData();
    const videoFile = formData.get('video') as File;
    const voiceId = formData.get('voiceId') as string;
    const voiceSettings = JSON.parse(formData.get('voiceSettings') as string || '{}');
    const targetLang = formData.get('targetLang') as string || 'es-mx';
    const addLipsync = false; // Desactivado por defecto — muy lento
    const addSubtitles = formData.get('addSubtitles') === 'true';
    const productId = formData.get('productId') as string;
    const storeId = formData.get('storeId') as string;
    const preloadedScript = formData.get('scriptEs') as string || ''; // Script ya traducido

    console.log('[API] preloadedScript length:', preloadedScript?.length || 0);
    if (!videoFile || !voiceId) return NextResponse.json({ error: 'video y voiceId requeridos' }, { status: 400 });

    const jobId = randomBytes(8).toString('hex');
    jobs[jobId] = { status: 'processing', step: 'transcribing', jobId };

    // Ejecutar pipeline async
    runPipeline(jobId, videoFile, voiceId, voiceSettings, targetLang, addLipsync, addSubtitles, productId, storeId, preloadedScript).catch(e => {
        jobs[jobId] = { status: 'error', error: e.message, jobId };
    });

    return NextResponse.json({ jobId, status: 'processing' });
}

async function runPipeline(
    jobId: string, videoFile: File, voiceId: string, voiceSettings: any,
    targetLang: string, addLipsync: boolean, addSubtitles: boolean,
    productId: string, storeId: string, preloadedScript: string = ''
) {
    const tmpDir = join(tmpdir(), `translate-${jobId}`);
    await mkdir(tmpDir, { recursive: true });

    try {
        // PASO 1: Guardar video
        const videoPath = join(tmpDir, 'input.mp4');
        const audioPath = join(tmpDir, 'audio.mp3');
        const videoBuffer = Buffer.from(await videoFile.arrayBuffer());
        await writeFile(videoPath, videoBuffer);

        // PASO 2: Extraer audio
        jobs[jobId].step = 'transcribing';
        await execAsync(`ffmpeg -y -i "${videoPath}" -vn -acodec mp3 "${audioPath}"`);

        // PASO 3: Transcribir + traducir (o usar script precargado)
        if (preloadedScript) {
            console.log('[Pipeline] ✅ Usando script precargado en español');
            jobs[jobId].step = 'generating_audio';
            // Saltar directamente al TTS con el script en español
            const ttsRes2 = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
                method: 'POST',
                headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY!, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: preloadedScript,
                    model_id: 'eleven_multilingual_v2',
                    voice_settings: {
                        stability: voiceSettings.stability ?? 0.5,
                        similarity_boost: voiceSettings.similarity_boost ?? 0.8,
                        style: voiceSettings.style ?? 0.3,
                        use_speaker_boost: true,
                    },
                }),
            });
            if (!ttsRes2.ok) throw new Error(`ElevenLabs TTS: ${ttsRes2.status}`);
            const newAudioBuffer2 = Buffer.from(await ttsRes2.arrayBuffer());
            const newAudioPath2 = join(tmpDir, 'new_audio.mp3');
            await writeFile(newAudioPath2, newAudioBuffer2);
            // Montar video + audio y continuar
            const silentVideoPath2 = join(tmpDir, 'silent.mp4');
            const mergedVideoPath2 = join(tmpDir, 'merged.mp4');
            await execAsync(`ffmpeg -y -i "${videoPath}" -an -c:v copy "${silentVideoPath2}"`);
            await execAsync(`ffmpeg -y -i "${silentVideoPath2}" -i "${newAudioPath2}" -c:v copy -c:a aac -shortest "${mergedVideoPath2}"`);
            const finalBuffer2 = await readFile(mergedVideoPath2);
            const finalVideoUrl2 = `data:video/mp4;base64,${finalBuffer2.toString('base64')}`;
            jobs[jobId] = { status: 'done', jobId, videoUrl: finalVideoUrl2, translation: preloadedScript };
            console.log('[Pipeline] ✅ Pipeline con script precargado completado');
            return;
        }

        // PASO 3: Transcribir con Whisper local
        const whisperBin = process.env.WHISPER_BIN || '/Users/padi/whisper.cpp/build/bin/whisper-cli';
        const whisperModel = process.env.WHISPER_MODEL || '/Users/padi/whisper.cpp/models/ggml-large-v3.bin';
        const whisperOut = join(tmpDir, 'whisper_out');
        await execAsync(`"${whisperBin}" -m "${whisperModel}" -f "${audioPath}" --output-txt -of "${whisperOut}" --language auto 2>/dev/null`);
        let transcription = '';
        try {
            const { readFile: rf } = await import('fs/promises');
            transcription = (await rf(`${whisperOut}.txt`, 'utf-8')).trim();
        } catch { transcription = ''; }
        console.log(`[Pipeline] ✅ Transcripción: ${transcription.slice(0, 80)}`);

        // PASO 4: Traducción via AgentDispatcher
        jobs[jobId].step = 'translating';
        let translation = transcription;
        try {
            const { AgentDispatcher } = await import('@/lib/agents/agent-dispatcher');
            const dispatcher = new AgentDispatcher();
            const result = await dispatcher.dispatchAuto(
                'Traducción de script publicitario al español mexicano',
                `Traduce al español mexicano este script publicitario de video. Devuelve SOLO la traducción, sin explicaciones:\n\n${transcription}`
            );
            console.log("[Pipeline] AgentDispatcher result:", JSON.stringify(result).slice(0, 500));
            if (result.text) translation = result.text;
            else if (result.content) translation = result.content;
            console.log('[Pipeline] ✅ Traducción via AgentDispatcher');
        } catch (e: any) {
            console.warn('[Pipeline] AgentDispatcher translation failed:', e.message);
        }
        console.log(`[Pipeline] ✅ Traducción completada`);

        // PASO 5: Generar audio con ElevenLabs
        jobs[jobId].step = 'generating_audio';
        const ttsRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
            method: 'POST',
            headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY!, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: translation,
                model_id: 'eleven_multilingual_v2',
                voice_settings: {
                    stability: voiceSettings.stability ?? 0.5,
                    similarity_boost: voiceSettings.similarity_boost ?? 0.8,
                    style: voiceSettings.style ?? 0.3,
                    use_speaker_boost: true,
                },
            }),
        });
        if (!ttsRes.ok) throw new Error(`ElevenLabs TTS: ${ttsRes.status}`);
        const newAudioBuffer = Buffer.from(await ttsRes.arrayBuffer());
        const newAudioPath = join(tmpDir, 'new_audio.mp3');
        await writeFile(newAudioPath, newAudioBuffer);
        const audioBase64 = `data:audio/mpeg;base64,${newAudioBuffer.toString('base64')}`;
        console.log(`[Pipeline] ✅ Audio ElevenLabs generado`);

        // PASO 6: Montar video con nuevo audio (sin voz original)
        jobs[jobId].step = 'lipsync';
        const silentVideoPath = join(tmpDir, 'silent.mp4');
        const mergedVideoPath = join(tmpDir, 'merged.mp4');

        // Eliminar audio original del video
        await execAsync(`ffmpeg -y -i "${videoPath}" -an -c:v copy "${silentVideoPath}"`);

        // Mezclar video mudo + nuevo audio
        await execAsync(
            `ffmpeg -y -i "${silentVideoPath}" -i "${newAudioPath}" -c:v copy -c:a aac -shortest "${mergedVideoPath}"`
        );

        let finalVideoPath = mergedVideoPath;

        // LipSync si está activado
        if (addLipsync) {
            try {
                const token = process.env.REPLICATE_API_TOKEN;
                // Subir video a URL temporal para Replicate (usamos data URL)
                const mergedBuffer = await readFile(mergedVideoPath);
                const videoDataUrl = `data:video/mp4;base64,${mergedBuffer.toString('base64')}`;

                const lipsyncModels = [
                    { model: 'sync/lipsync-2-pro', input: { video: videoDataUrl, audio: audioBase64 } },
                    { model: 'sync/lipsync-2',     input: { video: videoDataUrl, audio: audioBase64 } },
                    { model: 'latentlabs/latentsync', input: { video: videoDataUrl, audio: audioBase64 } },
                ];

                for (const { model, input } of lipsyncModels) {
                    try {
                        const createRes = await fetch(`https://api.replicate.com/v1/models/${model}/predictions`, {
                            method: 'POST',
                            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                            body: JSON.stringify({ input }),
                        });
                        const pred = await createRes.json();
                        if (!createRes.ok) continue;

                        const predId = pred.id;
                        const start = Date.now();
                        while (Date.now() - start < 60000) {
                            await new Promise(r => setTimeout(r, 4000));
                            const poll = await fetch(`https://api.replicate.com/v1/predictions/${predId}`, {
                                headers: { 'Authorization': `Bearer ${token}` }
                            });
                            const pd = await poll.json();
                            if (pd.status === 'succeeded') {
                                const lipsyncUrl = Array.isArray(pd.output) ? pd.output[0] : pd.output;
                                // Descargar resultado
                                const lipsyncRes = await fetch(lipsyncUrl);
                                const lipsyncBuffer = Buffer.from(await lipsyncRes.arrayBuffer());
                                const lipsyncPath = join(tmpDir, 'lipsync.mp4');
                                await writeFile(lipsyncPath, lipsyncBuffer);
                                finalVideoPath = lipsyncPath;
                                console.log(`[Pipeline] ✅ LipSync: ${model}`);
                                break;
                            }
                            if (pd.status === 'failed') break;
                        }
                        if (finalVideoPath !== mergedVideoPath) break;
                    } catch { continue; }
                }
            } catch (e: any) {
                console.warn(`[Pipeline] LipSync falló, usando video sin sync: ${e.message}`);
            }
        }

        // Convertir video final a base64 para devolver
        const finalBuffer = await readFile(finalVideoPath);
        const finalVideoUrl = `data:video/mp4;base64,${finalBuffer.toString('base64')}`;

        jobs[jobId] = {
            status: 'done',
            step: 'done',
            jobId,
            result: {
                transcription,
                translation,
                audioUrl: audioBase64,
                finalVideoUrl,
            }
        };

        console.log(`[Pipeline] ✅ Pipeline completado para job ${jobId}`);

    } finally {
        await rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    }
}
