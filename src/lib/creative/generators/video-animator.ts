import Replicate from 'replicate';
import { getConnectionSecret } from '@/lib/server/connections';

export interface VideoAnimationOptions {
    imageUrl: string;
    audioUrl: string;
    cropFactor?: number;
}

export class VideoAnimator {
    private replicate!: Replicate;
    private isInitialized = false;

    constructor() { }

    private async initClients() {
        if (this.isInitialized) return;

        const token = await getConnectionSecret('store-main', 'REPLICATE') || process.env.REPLICATE_API_TOKEN;

        if (!token) {
            throw new Error('REPLICATE_API_TOKEN not configured in Database nor env vars');
        }

        this.replicate = new Replicate({
            auth: token
        });

        this.isInitialized = true;
    }

    /**
     * Animar avatar con audio usando LivePortrait
     */
    async animate(options: VideoAnimationOptions): Promise<string> {
        console.log('[VideoAnimator] 🎬 Animando video con Replicate LivePortrait...');

        try {
            await this.initClients();

            const output = await this.replicate.run(
                "fofr/live-portrait:89629de4f370173b28ccf588d19540a7c349cf3cc9a1935b22cd45f9b2b55a11",
                {
                    input: {
                        source_image: options.imageUrl,
                        driving_audio: options.audioUrl,
                        crop_factor: options.cropFactor ?? 1.7,
                        flag_do_crop: true,
                        flag_relative: true,
                        flag_pasteback: true,
                        flag_stitching: true
                    }
                }
            ) as unknown as string;

            console.log('[VideoAnimator] ✅ Video generado:', output);

            return output;

        } catch (error) {
            console.error('[VideoAnimator] ❌ Error:', error);
            throw error;
        }
    }

    /**
     * Animar múltiples videos en batch
     */
    async animateBatch(
        pairs: Array<{ imageUrl: string; audioUrl: string; cropFactor?: number }>
    ): Promise<string[]> {
        console.log(`[VideoAnimator] 🎬 Animando ${pairs.length} videos en batch...`);

        const startTime = Date.now();
        const promises = pairs.map(p => this.animate(p));
        const results = await Promise.allSettled(promises);

        const successful = results
            .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled')
            .map(r => r.value);

        const failed = results.filter(r => r.status === 'rejected').length;

        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`[VideoAnimator] ✅ Batch complete: ${successful.length} success, ${failed} failed in ${duration}s`);

        return successful;
    }

    /**
     * Calcular costo estimado de animación
     * LivePortrait: ~$0.01 per second of video
     */
    calculateCost(durationSeconds: number): number {
        return durationSeconds * 0.01;
    }

    /**
     * Estimar duración del video basado en longitud del texto
     */
    estimateDuration(textLength: number): number {
        // Promedio: 150 palabras por minuto = 2.5 palabras por segundo
        const words = textLength / 5; // aprox 5 chars por palabra
        const durationSeconds = (words / 2.5);
        return Math.ceil(durationSeconds);
    }
}
