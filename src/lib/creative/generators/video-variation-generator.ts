import Replicate from 'replicate';
import { Storage } from '@google-cloud/storage';
import { getConnectionSecret, getConnectionMeta } from '@/lib/server/connections';
import ffmpeg from 'fluent-ffmpeg';
import { createWriteStream, createReadStream, unlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

/**
 * Sistema de variaciones de videos
 * Toma un video existente y genera múltiples variaciones con diferentes avatares
 */
export class VideoVariationGenerator {
    private replicate!: Replicate;
    private storage!: Storage;
    private bucketName!: string;

    private isInitialized = false;

    constructor() { }

    private async initClients() {
        if (this.isInitialized) return;

        const replicateToken = await getConnectionSecret('store-main', 'REPLICATE') || process.env.REPLICATE_API_TOKEN;
        const meta = await getConnectionMeta('store-main', 'GCP');

        this.bucketName = meta?.GCS_BUCKET_NAME || process.env.GCS_BUCKET_NAME || '';
        const projectId = meta?.GOOGLE_CLOUD_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT_ID || '';

        this.replicate = new Replicate({
            auth: replicateToken || ''
        });

        this.storage = new Storage({
            projectId: projectId
        });

        this.isInitialized = true;
    }

    /**
     * Extraer audio de un video
     */
    async extractAudio(videoUrl: string): Promise<string> {
        console.log('[VideoVariations] Extrayendo audio del video...');
        await this.initClients();

        return new Promise(async (resolve, reject) => {
            const tempVideo = join(tmpdir(), `video_${Date.now()}.mp4`);
            const tempAudio = join(tmpdir(), `audio_${Date.now()}.mp3`);

            try {
                // Download video
                const response = await fetch(videoUrl);
                const fileStream = createWriteStream(tempVideo);

                if (response.body) {
                    const { Readable } = await import('stream');
                    // @ts-ignore
                    Readable.fromWeb(response.body).pipe(fileStream);
                }

                await new Promise((res, rej) => {
                    fileStream.on('finish', () => res(undefined));
                    fileStream.on('error', rej);
                });

                // Extract audio
                ffmpeg(tempVideo)
                    .output(tempAudio)
                    .audioCodec('libmp3lame')
                    .on('end', async () => {
                        console.log('[VideoVariations] ✅ Audio extraído');

                        // Upload to GCS
                        const bucket = this.storage.bucket(this.bucketName);
                        const filename = `audio/extracted_${Date.now()}.mp3`;

                        await bucket.upload(tempAudio, {
                            destination: filename,
                            metadata: { contentType: 'audio/mpeg' }
                        });

                        await bucket.file(filename).makePublic();
                        const publicUrl = `https://storage.googleapis.com/${this.bucketName}/${filename}`;

                        // Cleanup
                        unlinkSync(tempVideo);
                        unlinkSync(tempAudio);

                        resolve(publicUrl);
                    })
                    .on('error', (err) => {
                        unlinkSync(tempVideo);
                        reject(err);
                    })
                    .run();

            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Generar variaciones de un video con diferentes avatares
     */
    async generateVariations(
        videoUrl: string,
        avatarPrompts: string[],
        maxVariations: number = 5
    ): Promise<Array<{ avatarUrl: string; videoUrl: string }>> {
        console.log(`[VideoVariations] Generando ${maxVariations} variaciones...`);

        // 1. Extraer audio del video original
        const audioUrl = await this.extractAudio(videoUrl);
        console.log('[VideoVariations] Audio URL:', audioUrl);

        // 2. Generar nuevos avatares
        const { ImageGenerator } = await import('./image-generator');
        const imageGen = new ImageGenerator();

        const selectedPrompts = avatarPrompts.slice(0, maxVariations);
        const avatarUrls = await imageGen.generateBatch(
            selectedPrompts.map(prompt => ({
                prompt,
                aspectRatio: '9:16' as const,
                style: 'realistic' as const
            }))
        );

        // 3. Animar cada avatar con el audio extraído
        const { VideoAnimator } = await import('./video-animator');
        const animator = new VideoAnimator();

        const videoUrls = await animator.animateBatch(
            avatarUrls.map(avatarUrl => ({
                imageUrl: avatarUrl,
                audioUrl
            }))
        );

        // 4. Retornar variaciones
        const variations = avatarUrls.map((avatarUrl, i) => ({
            avatarUrl,
            videoUrl: videoUrls[i]
        }));

        console.log(`[VideoVariations] ✅ ${variations.length} variaciones generadas`);

        return variations;
    }

    /**
     * Generar variaciones desde video en Google Drive
     */
    async generateFromDrive(
        driveFileId: string,
        avatarPrompts: string[],
        maxVariations: number = 5
    ): Promise<Array<{ avatarUrl: string; videoUrl: string }>> {
        console.log('[VideoVariations] Cargando video desde Drive...');

        // Download from Drive
        const driveUrl = `https://drive.google.com/uc?export=download&id=${driveFileId}`;

        return this.generateVariations(driveUrl, avatarPrompts, maxVariations);
    }
    /**
     * Quick Generation Wrapper
     */
    async generateQuickVariations(params: {
        sourceVideoUrl: string;
        variationType: 'AVATAR_SWAP' | 'VOICE_CHANGE' | 'BOTH';
        count: number;
        funnelStage?: string;
    }): Promise<Array<{
        videoUrl: string;
        avatarUrl: string;
        audioUrl?: string;
        voiceId?: string;
        prompt?: string;
        cost?: number;
    }>> {
        console.log('[VideoVariations] Quick generation:', params);

        // 1. Generate Prompts (Simple logic for now)
        // In a real scenario, this would use LLM to generate diverse prompts based on funnelStage
        const styles = ['professional', 'friendly', 'energetic', 'trustworthy', 'casual'];
        const prompts = Array(params.count).fill(0).map((_, i) =>
            `Professional avatar, ${styles[i % styles.length]} style, ${params.funnelStage || 'neutral'} expression, 4k, photorealistic, studio lighting`
        );

        // 2. Generate
        const results = await this.generateVariations(
            params.sourceVideoUrl,
            prompts,
            params.count
        );

        // 3. Map results
        return results.map((r, i) => ({
            videoUrl: r.videoUrl,
            avatarUrl: r.avatarUrl,
            prompt: prompts[i],
            cost: 0.15 // Estimated cost placeholder (Input 0.05 + Output 0.10 roughly)
        }));
    }
}
