import { REPLICATE_MODELS } from '@/lib/ai/replicate-models';

// Cadenas de fallback por calidad
const VIDEO_MODELS_CASCADE = {
    premium:  ['kwaivgi/kling-v3', 'kwaivgi/kling-v2.6', 'minimax/video-01', 'wan-ai/wan-2.2-s2v', 'lightricks/ltx-video'],
    standard: ['kwaivgi/kling-v2.6', 'minimax/video-01', 'wan-ai/wan-2.2-s2v', 'lightricks/ltx-video'],
    fast:     ['lightricks/ltx-video', 'wan-ai/wan-2.1', 'kwaivgi/kling-v2.6'],
};

const LIPSYNC_MODELS_CASCADE = [
    'kwaivgi/kling-lip-sync',
    'sync/lipsync-2-pro',
    'sync/lipsync-2',
    'latentlabs/latentsync',
    'pixverse-ai/lipsync',
];

// Inputs por modelo de video
function buildVideoInput(model: string, imageUrl: string, quality: string) {
    if (model.includes('kling')) {
        return {
            start_image: imageUrl,
            prompt: 'person talking naturally to camera, realistic natural movement, UGC advertisement style',
            duration: quality === 'premium' ? 10 : 5,
            aspect_ratio: '9:16',
        };
    }
    if (model.includes('minimax') || model.includes('hailuo')) {
        return {
            first_frame_image: imageUrl,
            prompt: 'person talking naturally to camera, UGC style',
            duration: 6,
        };
    }
    if (model.includes('wan')) {
        return {
            image: imageUrl,
            prompt: 'person talking naturally to camera, UGC advertisement style',
            duration: 5,
        };
    }
    if (model.includes('ltx')) {
        return {
            image: imageUrl,
            prompt: 'person talking naturally to camera, UGC style',
            duration: 5,
            aspect_ratio: '9:16',
        };
    }
    if (model.includes('luma') || model.includes('dream-machine')) {
        return {
            prompt: 'person talking naturally to camera, UGC style',
            keyframes: { frame0: { type: 'image', url: imageUrl } },
        };
    }
    return { image: imageUrl, prompt: 'person talking naturally to camera', duration: 5 };
}

// Inputs por modelo de lipsync
function buildLipsyncInput(model: string, videoUrl: string, audioUrl: string) {
    if (model.includes('kling-lip-sync')) {
        return { video_url: videoUrl, audio_file: audioUrl };
    }
    if (model.includes('sync/lipsync')) {
        return { video: videoUrl, audio: audioUrl };
    }
    if (model.includes('latentlabs') || model.includes('latentsync')) {
        return { video: videoUrl, audio: audioUrl };
    }
    if (model.includes('pixverse')) {
        return { video_url: videoUrl, audio_url: audioUrl };
    }
    return { video: videoUrl, audio: audioUrl };
}

async function replicateRunWithFallback(
    models: string[],
    inputFn: (model: string) => Record<string, any>,
    maxWaitMs = 180000
): Promise<string> {
    const token = process.env.REPLICATE_API_TOKEN;
    let lastError = '';

    for (const model of models) {
        try {
            console.log(`[Replicate] 🎯 Intentando: ${model}`);
            
            // Retry 429 para este modelo
            let createRes: Response = new Response('{}', { status: 500 });
            let pred: any = {};
            
            for (let attempt = 1; attempt <= 3; attempt++) {
                createRes = await fetch(
                    `https://api.replicate.com/v1/models/${model}/predictions`,
                    {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ input: inputFn(model) }),
                    }
                );
                pred = await createRes.json();
                
                if (createRes.status === 429) {
                    const waitMs = attempt * 12000;
                    console.warn(`[Replicate] 429 retry ${attempt}/3 en ${waitMs}ms | ${model}`);
                    await new Promise(r => setTimeout(r, waitMs));
                    continue;
                }
                break;
            }

            if (!createRes.ok) {
                lastError = `${model} → ${createRes.status}: ${pred.detail || pred.title}`;
                console.warn(`[Replicate] ⚠️ ${lastError} — probando siguiente modelo`);
                continue;
            }

            const predId = pred.id;
            console.log(`[Replicate] ▶ ${predId} | ${model}`);

            // Polling
            const start = Date.now();
            while (Date.now() - start < maxWaitMs) {
                await new Promise(r => setTimeout(r, 4000));
                const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${predId}`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                const pollData = await pollRes.json();
                console.log(`[Replicate] ${predId} → ${pollData.status}`);

                if (pollData.status === 'succeeded') {
                    const output = pollData.output;
                    const url = Array.isArray(output) ? output[0] : output;
                    console.log(`[Replicate] ✅ ${model} completado`);
                    return typeof url === 'string' ? url : String(url);
                }
                if (pollData.status === 'failed' || pollData.status === 'canceled') {
                    lastError = `${model} → ${pollData.status}: ${pollData.error}`;
                    console.warn(`[Replicate] ⚠️ ${lastError} — probando siguiente modelo`);
                    break;
                }
            }
        } catch (err: any) {
            lastError = `${model} → ${err.message}`;
            console.warn(`[Replicate] ⚠️ Error en ${model}: ${err.message} — probando siguiente`);
        }

        // Delay entre modelos
        await new Promise(r => setTimeout(r, 3000));
    }

    throw new Error(`Todos los modelos fallaron. Último error: ${lastError}`);
}

export class VideoAnimator {
    async animate(opts: {
        imageUrl: string;
        audioUrl: string;
        cropFactor?: number;
        quality?: 'standard' | 'premium' | 'fast';
    }): Promise<string> {
        const quality = opts.quality || 'standard';
        const videoModels = VIDEO_MODELS_CASCADE[quality] || VIDEO_MODELS_CASCADE.standard;

        console.log(`[VideoAnimator] 🎬 ${quality.toUpperCase()} — cascade: ${videoModels.join(' → ')}`);

        // Paso 1: Generar video base con cascade de modelos
        const videoUrl = await replicateRunWithFallback(
            videoModels,
            (model) => buildVideoInput(model, opts.imageUrl, quality)
        );
        console.log(`[VideoAnimator] ✅ Video base: ${videoUrl.slice(0, 80)}`);

        // Paso 2: LipSync con cascade de modelos
        console.log(`[VideoAnimator] 🎤 LipSync cascade: ${LIPSYNC_MODELS_CASCADE.join(' → ')}`);
        return await replicateRunWithFallback(
            LIPSYNC_MODELS_CASCADE,
            (model) => buildLipsyncInput(model, videoUrl, opts.audioUrl)
        );
    }

    async animateBatch(configs: {
        imageUrl: string;
        audioUrl: string;
        cropFactor?: number;
        quality?: 'standard' | 'premium' | 'fast';
    }[]): Promise<string[]> {
        const results: string[] = [];
        for (const c of configs) {
            results.push(await this.animate(c));
            await new Promise(r => setTimeout(r, 3000));
        }
        return results;
    }

    calculateCost(durationSeconds: number): number { return durationSeconds * 0.04; }
    estimateDuration(charCount: number): number { return Math.ceil(charCount / 15); }
}
