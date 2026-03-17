import { REPLICATE_MODELS } from '@/lib/ai/replicate-models';

async function replicateRun(model: string, input: Record<string, any>, maxWaitMs = 180000): Promise<string> {
    const token = process.env.REPLICATE_API_TOKEN;

    // Crear predicción con retry 429
    let createRes: Response = new Response('{}', { status: 500 });
    let pred: any = {};
    for (let attempt = 1; attempt <= 5; attempt++) {
        createRes = await fetch('https://api.replicate.com/v1/predictions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model, input }),
        });
        pred = await createRes.json();
        if (createRes.status === 429) {
            const waitMs = attempt * 15000;
            console.warn(`[Replicate] 429 — retry ${attempt}/5 en ${waitMs}ms | ${model}`);
            await new Promise(r => setTimeout(r, waitMs));
            continue;
        }
        break;
    }

    if (!createRes.ok) {
        throw new Error(`Replicate ${createRes.status}: ${pred.detail || pred.title || JSON.stringify(pred)}`);
    }

    const predId = pred.id;
    console.log(`[Replicate] ▶ ${predId} | ${model}`);

    // Polling hasta completar
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
            return typeof url === 'string' ? url : String(url);
        }
        if (pollData.status === 'failed' || pollData.status === 'canceled') {
            throw new Error(`Predicción ${pollData.status}: ${pollData.error || 'sin detalle'}`);
        }
    }
    throw new Error(`Timeout esperando predicción ${predId}`);
}

export class VideoAnimator {
    async animate(opts: {
        imageUrl: string;
        audioUrl: string;
        cropFactor?: number;
        quality?: 'standard' | 'premium' | 'fast';
    }): Promise<string> {
        const quality = opts.quality || 'standard';

        if (quality === 'premium') {
            console.log('[VideoAnimator] 🎬 PREMIUM: Kling v3 → LipSync');
            const videoUrl = await replicateRun(REPLICATE_MODELS.VIDEO.KLING_V3, {
                start_image: opts.imageUrl,
                prompt: 'person talking naturally to camera, realistic head movement, UGC advertisement style',
                duration: 5,
                aspect_ratio: '9:16',
            });
            return await replicateRun(REPLICATE_MODELS.AVATAR.KLING_LIPSYNC, {
                video_url: videoUrl,
                audio_file: opts.audioUrl,
            });

        } else if (quality === 'fast') {
            console.log('[VideoAnimator] 🎬 FAST: LipSync-2');
            return await replicateRun(REPLICATE_MODELS.AVATAR.LIPSYNC_2, {
                video: opts.imageUrl,
                audio: opts.audioUrl,
            });

        } else {
            console.log('[VideoAnimator] 🎬 STANDARD: Kling v2.6 → LipSync');
            const videoUrl = await replicateRun(REPLICATE_MODELS.VIDEO.KLING_V2, {
                start_image: opts.imageUrl,
                prompt: 'person talking naturally to camera, realistic natural movement, UGC style',
                duration: 5,
                aspect_ratio: '9:16',
            });
            console.log('[VideoAnimator] ✅ Video base:', videoUrl?.slice(0, 80));
            return await replicateRun(REPLICATE_MODELS.AVATAR.KLING_LIPSYNC, {
                video_url: videoUrl,
                audio_file: opts.audioUrl,
            });
        }
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
