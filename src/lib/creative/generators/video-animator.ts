import { getConnectionSecret } from '@/lib/server/connections';
import Replicate from 'replicate';
import { REPLICATE_MODELS } from '@/lib/ai/replicate-models';

async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 3, baseDelayMs = 12000): Promise<T> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (err: any) {
            const is429 = err?.message?.includes('429') || err?.status === 429;
            if (is429 && attempt < maxAttempts) {
                const delay = baseDelayMs * attempt;
                console.warn(`[VideoAnimator] 429 — retry ${attempt}/${maxAttempts} en ${delay}ms`);
                await new Promise(r => setTimeout(r, delay));
            } else { throw err; }
        }
    }
    throw new Error('Max retries exceeded');
}

function extractUrl(output: any): string {
    const url = Array.isArray(output) ? output[0] : output;
    return typeof url === 'string' ? url : url?.url?.() || String(url);
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

        if (quality === 'premium') {
            // PIPELINE PREMIUM: Imagen → Kling v3 video → Kling LipSync
            console.log('[VideoAnimator] 🎬 PREMIUM: Kling v3 → LipSync');
            const videoOutput = await withRetry(() => replicate.run(REPLICATE_MODELS.VIDEO.KLING_V3 as any, {
                input: {
                    start_image: opts.imageUrl,
                    prompt: 'person talking naturally to camera, realistic head movement, UGC advertisement style',
                    duration: 5,
                    aspect_ratio: '9:16',
                }
            }));
            const videoUrl = extractUrl(videoOutput);

            // Lipsync sobre el video generado
            const lipsyncOutput = await withRetry(() => replicate.run(REPLICATE_MODELS.AVATAR.KLING_LIPSYNC as any, {
                input: {
                    video_url: videoUrl,
                    audio_file: opts.audioUrl,
                }
            }));
            return extractUrl(lipsyncOutput);

        } else if (quality === 'fast') {
            // PIPELINE FAST: LipSync-2 directo (más rápido)
            console.log('[VideoAnimator] 🎬 FAST: LipSync-2 directo');
            const output = await withRetry(() => replicate.run(REPLICATE_MODELS.AVATAR.LIPSYNC_2 as any, {
                input: {
                    video: opts.imageUrl,
                    audio: opts.audioUrl,
                }
            }));
            return extractUrl(output);

        } else {
            // PIPELINE STANDARD: Imagen → Kling v2 → Kling LipSync
            console.log('[VideoAnimator] 🎬 STANDARD: Kling v2 → LipSync');

            // Paso 1: Generar video base desde imagen
            const videoOutput = await withRetry(() => replicate.run(REPLICATE_MODELS.VIDEO.KLING_V2 as any, {
                input: {
                    start_image: opts.imageUrl,
                    prompt: 'person talking naturally to camera, realistic natural movement, UGC style',
                    duration: 5,
                    aspect_ratio: '9:16',
                }
            }));
            const videoUrl = extractUrl(videoOutput);
            console.log('[VideoAnimator] ✅ Video base generado:', videoUrl?.slice(0, 60));

            // Paso 2: Sincronizar labios con audio
            const lipsyncOutput = await withRetry(() => replicate.run(REPLICATE_MODELS.AVATAR.KLING_LIPSYNC as any, {
                input: {
                    video_url: videoUrl,
                    audio_file: opts.audioUrl,
                }
            }));
            return extractUrl(lipsyncOutput);
        }
    }

    async animateBatch(configs: {
        imageUrl: string;
        audioUrl: string;
        cropFactor?: number;
        quality?: 'standard' | 'premium' | 'fast';
    }[]): Promise<string[]> {
        // Secuencial para evitar rate limits
        const results: string[] = [];
        for (const c of configs) {
            results.push(await this.animate(c));
            await new Promise(r => setTimeout(r, 3000));
        }
        return results;
    }

    calculateCost(durationSeconds: number): number {
        return durationSeconds * 0.04;
    }

    estimateDuration(charCount: number): number {
        return Math.ceil(charCount / 15);
    }
}
