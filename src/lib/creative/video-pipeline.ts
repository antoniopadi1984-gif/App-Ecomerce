import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

const execAsync = promisify(exec);

export interface Scene {
    id: number;
    duration: number;
    spokenText: string;
    visualPrompt: string;
    sceneType: 'talking_head' | 'product_demo' | 'broll' | 'lipsync' | 'text_overlay';
    cameraAngle: string;
    emotion: string;
    includeProduct: boolean;
    productAction: string | null;
    transitionOut?: string;
}

export interface SceneResult {
    sceneId: number;
    clipUrl: string;
    audioUrl: string;
    lipsyncUrl?: string;
    status: 'pending' | 'processing' | 'done' | 'error';
    error?: string;
}

// ── REPLICATE FETCH ──────────────────────────────────────────────────────────
async function replicateRun(
    model: string,
    input: Record<string, any>,
    maxWaitMs = 180000
): Promise<string> {
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
            const wait = attempt * 12000;
            console.warn(`[Pipeline] 429 retry ${attempt}/4 en ${wait}ms | ${model}`);
            await new Promise(r => setTimeout(r, wait));
            continue;
        }
        break;
    }

    if (!createRes.ok) {
        throw new Error(`${model} ${createRes.status}: ${pred.detail || pred.title || JSON.stringify(pred)}`);
    }

    const predId = pred.id;
    console.log(`[Pipeline] ▶ ${predId} | ${model}`);

    const start = Date.now();
    while (Date.now() - start < maxWaitMs) {
        await new Promise(r => setTimeout(r, 4000));
        const poll = await fetch(`https://api.replicate.com/v1/predictions/${predId}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        const pollData = await poll.json();
        console.log(`[Pipeline] ${predId} → ${pollData.status}`);

        if (pollData.status === 'succeeded') {
            const output = pollData.output;
            const url = Array.isArray(output) ? output[0] : output;
            return typeof url === 'string' ? url : String(url);
        }
        if (pollData.status === 'failed') {
            throw new Error(`${model} failed: ${pollData.error}`);
        }
    }
    throw new Error(`Timeout ${model}`);
}

async function replicateRunWithFallback(
    models: string[],
    input: Record<string, any>
): Promise<string> {
    for (const model of models) {
        try {
            console.log(`[Pipeline] 🎯 ${model}`);
            return await replicateRun(model, input);
        } catch (e: any) {
            console.warn(`[Pipeline] ⚠️ ${model}: ${e.message}`);
        }
        await new Promise(r => setTimeout(r, 2000));
    }
    throw new Error('Todos los modelos fallaron');
}

// ── AUDIO ELEVENLABS ─────────────────────────────────────────────────────────
export async function generateSceneAudio(
    text: string,
    voiceId: string,
    settings?: { stability?: number; similarity_boost?: number; style?: number; speed?: number }
): Promise<Buffer> {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: { 'xi-api-key': apiKey!, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            text,
            model_id: 'eleven_v3',
            voice_settings: {
                stability: settings?.stability ?? 0.5,
                similarity_boost: settings?.similarity_boost ?? 0.8,
                style: settings?.style ?? 0.3,
                use_speaker_boost: true,
            },
        }),
    });
    if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`);
    return Buffer.from(await res.arrayBuffer());
}

// ── GENERAR CLIP DE UNA ESCENA ───────────────────────────────────────────────
export async function generateSceneClip(
    scene: Scene,
    avatarImageUrl: string,
    voiceId: string,
    voiceSettings?: any,
    productImageUrl?: string
): Promise<SceneResult> {
    const result: SceneResult = {
        sceneId: scene.id,
        clipUrl: '',
        audioUrl: '',
        status: 'processing',
    };

    try {
        // 1. Generar audio de la escena
        console.log(`[Scene ${scene.id}] 🎙️ Generando audio: "${scene.spokenText.slice(0, 50)}..."`);
        const audioBuffer = await generateSceneAudio(scene.spokenText, voiceId, voiceSettings);

        // Guardar audio en tmp para usarlo en lipsync
        const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), `scene-${scene.id}-`));
        const audioPath = path.join(tmpDir, 'audio.mp3');
        await fs.writeFile(audioPath, audioBuffer);
        result.audioUrl = `data:audio/mpeg;base64,${audioBuffer.toString('base64')}`;

        // 2. Generar video según tipo de escena
        let videoUrl = '';

        if (scene.sceneType === 'talking_head' || scene.sceneType === 'lipsync') {
            // Usar el avatar generado (misma imagen en todas las escenas talking_head)
            console.log(`[Scene ${scene.id}] 🎬 Kling: imagen avatar → video`);

            if (!avatarImageUrl) throw new Error('avatarImageUrl requerido para talking_head');

            // Prompt específico para esta escena
            const videoPrompt = `${scene.visualPrompt}. ${scene.emotion} expression. ${scene.cameraAngle} shot. Authentic UGC vertical video 9:16.`;

            videoUrl = await replicateRunWithFallback(
                ['kwaivgi/kling-v2.6', 'minimax/video-01', 'wan-ai/wan-2.2-s2v'],
                {
                    start_image: avatarImageUrl,
                    prompt: videoPrompt,
                    duration: scene.duration,
                    aspect_ratio: '9:16',
                }
            );

            // LipSync — sincronizar labios con audio
            console.log(`[Scene ${scene.id}] 🎤 LipSync...`);
            const lipsyncModels = [
                'kwaivgi/kling-lip-sync',
                'sync/lipsync-2-pro',
                'sync/lipsync-2',
                'latentlabs/latentsync',
            ];

            for (const lsModel of lipsyncModels) {
                try {
                    const lsInput = lsModel.includes('kling-lip-sync')
                        ? { video_url: videoUrl, audio_file: result.audioUrl }
                        : { video: videoUrl, audio: result.audioUrl };

                    const lsUrl = await replicateRun(lsModel, lsInput);
                    result.lipsyncUrl = lsUrl;
                    result.clipUrl = lsUrl;
                    console.log(`[Scene ${scene.id}] ✅ LipSync: ${lsModel}`);
                    break;
                } catch (e: any) {
                    console.warn(`[Scene ${scene.id}] LipSync ${lsModel}: ${e.message}`);
                    // Si falla lipsync, usar video sin sync
                    result.clipUrl = videoUrl;
                }
            }

        } else if (scene.sceneType === 'product_demo') {
            // Veo 3 para demos de producto — mejor para mostrar producto en acción
            console.log(`[Scene ${scene.id}] 🎬 Veo 3: product demo`);

            // Si hay imagen del producto, usarla como referencia
            const productContext = productImageUrl
                ? `Product shown: MicroLift patches (pink packaging). Person ${scene.productAction || 'holding'} the product.`
                : '';

            const veoPrompt = `${scene.visualPrompt}. ${productContext} ${scene.emotion} facial expression. Vertical 9:16 format. Professional UGC advertisement quality.`;

            videoUrl = await replicateRunWithFallback(
                ['google/veo-3', 'google/veo-3-fast', 'kwaivgi/kling-v3', 'kwaivgi/kling-v2.6'],
                {
                    prompt: veoPrompt,
                    duration: scene.duration,
                    aspect_ratio: '9:16',
                    ...(avatarImageUrl ? { image: avatarImageUrl } : {}),
                }
            );
            result.clipUrl = videoUrl;

        } else if (scene.sceneType === 'broll') {
            // B-roll — escena visual sin avatar
            console.log(`[Scene ${scene.id}] 🎬 Veo 3 fast: b-roll`);

            videoUrl = await replicateRunWithFallback(
                ['google/veo-3-fast', 'google/veo-3', 'kwaivgi/kling-v3', 'lightricks/ltx-video'],
                {
                    prompt: `${scene.visualPrompt}. Cinematic b-roll shot. Professional advertisement quality. 9:16 vertical format.`,
                    duration: scene.duration,
                    aspect_ratio: '9:16',
                }
            );
            result.clipUrl = videoUrl;

        } else {
            // Fallback: talking head
            console.log(`[Scene ${scene.id}] 🎬 Fallback: Kling talking head`);
            videoUrl = await replicateRunWithFallback(
                ['kwaivgi/kling-v2.6', 'minimax/video-01'],
                {
                    start_image: avatarImageUrl || productImageUrl,
                    prompt: `${scene.visualPrompt}. Authentic UGC vertical video.`,
                    duration: scene.duration,
                    aspect_ratio: '9:16',
                }
            );
            result.clipUrl = videoUrl;
        }

        // Limpiar tmp
        try { await fs.rm(tmpDir, { recursive: true, force: true }); } catch {}

        result.status = 'done';
        console.log(`[Scene ${scene.id}] ✅ Clip listo: ${result.clipUrl.slice(0, 80)}`);

    } catch (e: any) {
        result.status = 'error';
        result.error = e.message;
        console.error(`[Scene ${scene.id}] ❌ ${e.message}`);
    }

    return result;
}

// ── MONTAJE FINAL FFmpeg ──────────────────────────────────────────────────────
export async function assembleVideo(
    sceneResults: SceneResult[],
    options: {
        addMusic?: boolean;
        musicUrl?: string;
        transitionType?: 'fade' | 'cut' | 'dissolve';
        outputFormat?: '9:16' | '16:9' | '1:1';
    } = {}
): Promise<Buffer> {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ecomboom-assemble-'));

    try {
        const clipPaths: string[] = [];

        for (let i = 0; i < sceneResults.length; i++) {
            const scene = sceneResults[i];
            if (scene.status !== 'done' || !scene.clipUrl) continue;

            const clipPath = path.join(tmpDir, `clip_${String(i).padStart(3, '0')}.mp4`);

            if (scene.clipUrl.startsWith('data:')) {
                const base64Data = scene.clipUrl.split(',')[1];
                await fs.writeFile(clipPath, Buffer.from(base64Data, 'base64'));
            } else {
                const res = await fetch(scene.clipUrl);
                const buffer = await res.arrayBuffer();
                await fs.writeFile(clipPath, Buffer.from(buffer));
            }
            clipPaths.push(clipPath);
        }

        if (clipPaths.length === 0) throw new Error('No hay clips para montar');

        const dimensions: Record<string, string> = {
            '9:16': '720x1280',
            '16:9': '1280x720',
            '1:1': '1080x1080',
        };
        const dim = dimensions[options.outputFormat || '9:16'];

        // Normalizar todos los clips al mismo formato
        const normalizedPaths: string[] = [];
        for (let i = 0; i < clipPaths.length; i++) {
            const normPath = path.join(tmpDir, `norm_${String(i).padStart(3, '0')}.mp4`);
            await execAsync(
                `ffmpeg -y -i "${clipPaths[i]}" -vf "scale=${dim}:force_original_aspect_ratio=decrease,pad=${dim}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30" -c:v libx264 -preset fast -crf 23 -c:a aac -ar 44100 "${normPath}"`
            );
            normalizedPaths.push(normPath);
        }

        // Crear lista para concatenar
        const listPath = path.join(tmpDir, 'clips.txt');
        await fs.writeFile(listPath, normalizedPaths.map(p => `file '${p}'`).join('\n'));

        const outputPath = path.join(tmpDir, 'output.mp4');
        await execAsync(
            `ffmpeg -y -f concat -safe 0 -i "${listPath}" -c:v libx264 -preset fast -crf 22 -c:a aac -map_metadata -1 "${outputPath}"`
        );

        // Añadir música si se pide
        if (options.addMusic && options.musicUrl) {
            try {
                const musicPath = path.join(tmpDir, 'music.mp3');
                const musicRes = await fetch(options.musicUrl);
                await fs.writeFile(musicPath, Buffer.from(await musicRes.arrayBuffer()));

                const withMusicPath = path.join(tmpDir, 'output_music.mp4');
                await execAsync(
                    `ffmpeg -y -i "${outputPath}" -i "${musicPath}" -filter_complex "[1:a]volume=0.12[music];[0:a][music]amix=inputs=2:duration=first[outa]" -map 0:v -map "[outa]" -c:v copy -c:a aac "${withMusicPath}"`
                );
                await fs.rename(withMusicPath, outputPath);
            } catch (e) {
                console.warn('[Assemble] Música falló, continuando sin ella');
            }
        }

        const finalBuffer = await fs.readFile(outputPath);
        console.log(`[Assemble] ✅ Video final: ${(finalBuffer.length / 1024 / 1024).toFixed(1)}MB`);
        return finalBuffer;

    } finally {
        await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    }
}
