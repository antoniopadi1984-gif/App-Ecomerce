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
}

export interface SceneResult {
    sceneId: number;
    clipUrl: string;
    audioUrl: string;
    lipsyncUrl?: string;
    status: 'pending' | 'processing' | 'done' | 'error';
    error?: string;
}

// Modelos de video por tipo de escena
const VIDEO_MODEL_BY_SCENE: Record<string, string[]> = {
    talking_head: ['kwaivgi/kling-v2.6', 'minimax/video-01', 'wan-ai/wan-2.2-s2v'],
    product_demo:  ['kwaivgi/kling-v3', 'kwaivgi/kling-v2.6', 'minimax/video-01'],
    broll:         ['kwaivgi/kling-v3', 'minimax/video-01', 'lightricks/ltx-video'],
    lipsync:       ['kwaivgi/kling-v2.6', 'minimax/video-01'],
    text_overlay:  ['kwaivgi/kling-v2.6', 'lightricks/ltx-video'],
};

async function replicateRunScene(model: string, input: Record<string, any>): Promise<string> {
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
            console.warn(`[Scene] 429 retry ${attempt}/4 en ${wait}ms`);
            await new Promise(r => setTimeout(r, wait));
            continue;
        }
        break;
    }

    if (!createRes.ok) throw new Error(`${model} ${createRes.status}: ${pred.detail || pred.title}`);

    const predId = pred.id;
    const start = Date.now();
    while (Date.now() - start < 180000) {
        await new Promise(r => setTimeout(r, 4000));
        const poll = await fetch(`https://api.replicate.com/v1/predictions/${predId}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        const pollData = await poll.json();
        if (pollData.status === 'succeeded') {
            const out = pollData.output;
            const url = Array.isArray(out) ? out[0] : out;
            return typeof url === 'string' ? url : String(url);
        }
        if (pollData.status === 'failed') throw new Error(`${model} failed: ${pollData.error}`);
    }
    throw new Error(`Timeout ${model}`);
}

async function runWithFallback(models: string[], input: Record<string, any>): Promise<string> {
    for (const model of models) {
        try {
            console.log(`[Pipeline] 🎯 ${model}`);
            return await replicateRunScene(model, input);
        } catch (e: any) {
            console.warn(`[Pipeline] ⚠️ ${model} falló: ${e.message}`);
        }
    }
    throw new Error('Todos los modelos fallaron');
}

// Generar audio ElevenLabs para una escena
export async function generateSceneAudio(text: string, voiceId: string, settings?: {
    stability?: number;
    similarity_boost?: number;
    style?: number;
    speed?: number;
}): Promise<Buffer> {
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
    if (!res.ok) throw new Error(`ElevenLabs ${res.status}`);
    const buffer = await res.arrayBuffer();
    return Buffer.from(buffer);
}

// Generar clip de una escena
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
        // 1. Generar audio
        console.log(`[Scene ${scene.id}] 🎙️ Generando audio...`);
        const audioBuffer = await generateSceneAudio(scene.spokenText, voiceId, voiceSettings);
        const audioBase64 = `data:audio/mpeg;base64,${audioBuffer.toString('base64')}`;
        result.audioUrl = audioBase64;

        // 2. Construir prompt visual completo
        const productContext = scene.includeProduct && productImageUrl
            ? ` The person is ${scene.productAction === 'holding' ? 'holding' : scene.productAction === 'applying' ? 'applying' : 'showing'} the product.`
            : '';

        const fullPrompt = `${scene.visualPrompt}${productContext} Camera angle: ${scene.cameraAngle}. Emotion: ${scene.emotion}. Vertical 9:16 format. Cinematic quality. UGC authentic style.`;

        // 3. Generar video base según tipo de escena
        const models = VIDEO_MODEL_BY_SCENE[scene.sceneType] || VIDEO_MODEL_BY_SCENE.talking_head;
        
        const videoInput: any = {
            start_image: avatarImageUrl,
            prompt: fullPrompt,
            duration: scene.duration,
            aspect_ratio: '9:16',
        };

        // Si el modelo es Kling, usar start_image. Si es minimax, usar first_frame_image
        console.log(`[Scene ${scene.id}] 🎬 Generando clip...`);
        
        let videoUrl = '';
        for (const model of models) {
            try {
                const inp = model.includes('minimax') || model.includes('hailuo')
                    ? { ...videoInput, first_frame_image: avatarImageUrl, prompt: fullPrompt, duration: scene.duration }
                    : model.includes('wan')
                    ? { image: avatarImageUrl, prompt: fullPrompt, duration: scene.duration }
                    : videoInput;
                
                videoUrl = await replicateRunScene(model, inp);
                result.clipUrl = videoUrl;
                console.log(`[Scene ${scene.id}] ✅ Clip generado con ${model}`);
                break;
            } catch (e: any) {
                console.warn(`[Scene ${scene.id}] ⚠️ ${model}: ${e.message}`);
            }
        }

        if (!videoUrl) throw new Error('No se pudo generar clip de video');

        // 4. LipSync
        if (scene.sceneType === 'talking_head' || scene.sceneType === 'lipsync') {
            console.log(`[Scene ${scene.id}] 🎤 Aplicando LipSync...`);
            const lipsyncModels = ['kwaivgi/kling-lip-sync', 'sync/lipsync-2-pro', 'sync/lipsync-2', 'latentlabs/latentsync'];
            
            for (const lsModel of lipsyncModels) {
                try {
                    const lsInput = lsModel.includes('kling-lip-sync')
                        ? { video_url: videoUrl, audio_file: audioBase64 }
                        : { video: videoUrl, audio: audioBase64 };
                    
                    const lipsyncUrl = await replicateRunScene(lsModel, lsInput);
                    result.lipsyncUrl = lipsyncUrl;
                    result.clipUrl = lipsyncUrl; // usar lipsync como clip final
                    console.log(`[Scene ${scene.id}] ✅ LipSync con ${lsModel}`);
                    break;
                } catch (e: any) {
                    console.warn(`[Scene ${scene.id}] LipSync ${lsModel}: ${e.message}`);
                }
            }
        }

        result.status = 'done';
    } catch (e: any) {
        result.status = 'error';
        result.error = e.message;
        console.error(`[Scene ${scene.id}] ❌ Error: ${e.message}`);
    }

    return result;
}

// Montar video final con FFmpeg
export async function assembleVideo(
    sceneResults: SceneResult[],
    options: {
        addMusic?: boolean;
        musicUrl?: string;
        addSubtitles?: boolean;
        subtitles?: Array<{ start: number; end: number; text: string }>;
        transitionType?: 'fade' | 'cut' | 'dissolve';
        outputFormat?: '9:16' | '16:9' | '1:1';
    } = {}
): Promise<Buffer> {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ecomboom-'));
    
    try {
        // Descargar clips
        const clipPaths: string[] = [];
        for (let i = 0; i < sceneResults.length; i++) {
            const scene = sceneResults[i];
            if (scene.status !== 'done' || !scene.clipUrl) continue;
            
            const clipPath = path.join(tmpDir, `clip_${i}.mp4`);
            
            if (scene.clipUrl.startsWith('data:')) {
                // base64
                const base64Data = scene.clipUrl.split(',')[1];
                await fs.writeFile(clipPath, Buffer.from(base64Data, 'base64'));
            } else {
                // URL remota
                const res = await fetch(scene.clipUrl);
                const buffer = await res.arrayBuffer();
                await fs.writeFile(clipPath, Buffer.from(buffer));
            }
            clipPaths.push(clipPath);
        }

        if (clipPaths.length === 0) throw new Error('No hay clips para montar');

        // Crear lista de clips para FFmpeg
        const listPath = path.join(tmpDir, 'clips.txt');
        const listContent = clipPaths.map(p => `file '${p}'`).join('\n');
        await fs.writeFile(listPath, listContent);

        // Configurar dimensiones según formato
        const dimensions = {
            '9:16': '720x1280',
            '16:9': '1280x720',
            '1:1': '1080x1080',
        }[options.outputFormat || '9:16'];

        const outputPath = path.join(tmpDir, 'output.mp4');

        // Comando FFmpeg con transiciones
        let ffmpegCmd: string;
        
        if (options.transitionType === 'fade') {
            // Concatenar con fade entre clips
            const filterParts: string[] = [];
            clipPaths.forEach((_, i) => {
                filterParts.push(`[${i}:v]scale=${dimensions},setsar=1,fps=30[v${i}]`);
            });
            const vInputs = clipPaths.map((_, i) => `[v${i}]`).join('');
            filterParts.push(`${vInputs}concat=n=${clipPaths.length}:v=1:a=0[outv]`);
            
            const inputs = clipPaths.map(p => `-i "${p}"`).join(' ');
            ffmpegCmd = `ffmpeg -y ${inputs} -filter_complex "${filterParts.join(';')}" -map "[outv]" -c:v libx264 -preset fast -crf 23 "${outputPath}"`;
        } else {
            // Concatenación simple
            ffmpegCmd = `ffmpeg -y -f concat -safe 0 -i "${listPath}" -vf "scale=${dimensions},setsar=1" -c:v libx264 -preset fast -crf 23 -map_metadata -1 "${outputPath}"`;
        }

        console.log('[FFmpeg] Montando video...');
        await execAsync(ffmpegCmd);

        // Añadir música si se especifica
        if (options.addMusic && options.musicUrl) {
            const musicPath = path.join(tmpDir, 'music.mp3');
            const musicRes = await fetch(options.musicUrl);
            const musicBuffer = await musicRes.arrayBuffer();
            await fs.writeFile(musicPath, Buffer.from(musicBuffer));

            const withMusicPath = path.join(tmpDir, 'output_music.mp4');
            await execAsync(
                `ffmpeg -y -i "${outputPath}" -i "${musicPath}" -filter_complex "[1:a]volume=0.15[music];[0:a][music]amix=inputs=2:duration=first[outa]" -map 0:v -map "[outa]" -c:v copy -c:a aac "${withMusicPath}"`
            );
            await fs.rename(withMusicPath, outputPath);
        }

        // Leer resultado
        const finalBuffer = await fs.readFile(outputPath);
        console.log(`[FFmpeg] ✅ Video montado: ${(finalBuffer.length / 1024 / 1024).toFixed(1)}MB`);
        return finalBuffer;

    } finally {
        // Limpiar tmp
        await fs.rm(tmpDir, { recursive: true, force: true });
    }
}
