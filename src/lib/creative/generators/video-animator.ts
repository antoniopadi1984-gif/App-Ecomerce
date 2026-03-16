import { getConnectionSecret } from '@/lib/server/connections';
import Replicate from 'replicate';
import { REPLICATE_MODELS } from '@/lib/ai/replicate-models';

// Retry para 429
async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 3, baseDelayMs = 12000): Promise<T> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (err: any) {
            const is429 = err?.message?.includes('429') || err?.status === 429;
            if (is429 && attempt < maxAttempts) {
                const delay = baseDelayMs * attempt;
                console.warn(`[VideoAnimator] 429 rate limit — retry ${attempt}/${maxAttempts} en ${delay}ms`);
                await new Promise(r => setTimeout(r, delay));
            } else {
                throw err;
            }
        }
    }
    throw new Error('Max retries exceeded');
}

export class VideoAnimator {
    async animate(opts: {
        imageUrl: string;
        audioUrl: string;
        cropFactor?: number;
        quality?: 'standard' | 'premium' | 'fast';
    }): Promise<string> {
        const token = await getConnectionSecret('store-main', 'REPLICATE') || process.env.REPLICATE_API_TOKEN;
        const replicate = new Replicate({ auth: token! });

        const quality = opts.quality || 'standard';

        let output: any;

        if (quality === 'premium') {
            // Kling v3 — mejor calidad para ads finales
            console.log('[VideoAnimator] 🎬 Usando Kling v3 (premium)');
            output = await withRetry(() => replicate.run(REPLICATE_MODELS.VIDEO.KLING_V3 as any, {
                input: {
                    start_image: opts.imageUrl,
                    prompt: 'person talking naturally to camera, realistic head movement, UGC style',
                    duration: 10,
                    aspect_ratio: '9:16',
                    negative_prompt: 'blurry, distorted, unnatural'
                }
            }));
        } else if (quality === 'fast') {
            // Kling v2 — rápido y económico
            console.log('[VideoAnimator] 🎬 Usando Kling v2 (fast)');
            output = await withRetry(() => replicate.run(REPLICATE_MODELS.VIDEO.KLING_V2 as any, {
                input: {
                    start_image: opts.imageUrl,
                    prompt: 'person talking naturally to camera, realistic movement',
                    duration: 5,
                    aspect_ratio: '9:16'
                }
            }));
        } else {
            // OmniHuman — lipsync con audio real (standard)
            console.log('[VideoAnimator] 🎬 Usando OmniHuman (standard lipsync)');
            output = await withRetry(() => replicate.run(REPLICATE_MODELS.AVATAR.OMNI_HUMAN as any, {
                input: {
                    image: opts.imageUrl,
                    audio: opts.audioUrl,
                    crop_factor: opts.cropFactor || 0.9
                }
            }));
        }

        const url = Array.isArray(output) ? output[0] : output;
        return typeof url === 'string' ? url : url?.url?.() || String(url);
    }

    async animateBatch(configs: { imageUrl: string; audioUrl: string; cropFactor?: number; quality?: 'standard' | 'premium' | 'fast' }[]): Promise<string[]> {
        return Promise.all(configs.map(c => this.animate(c)));
    }

    calculateCost(durationSeconds: number): number {
        return durationSeconds * 0.04;
    }

    estimateDuration(charCount: number): number {
        return Math.ceil(charCount / 15);
    }
}
