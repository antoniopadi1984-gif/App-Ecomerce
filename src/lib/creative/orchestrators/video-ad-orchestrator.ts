import { ImageGenerator } from '../generators/image-generator';
import { VoiceGenerator } from '../generators/voice-generator';
import { VideoAnimator } from '../generators/video-animator';
import { uploadBufferToGCS } from '../../services/gcs-upload-service';

export interface VideoAdConfig {
    avatarPrompt: string;
    script: string;
    voiceId?: string;
    concept: string;
    cropFactor?: number;
    format?: '9:16' | '16:9' | '1:1';
    mode?: 'auto' | 'ugc' | 'vsl' | 'broll' | 'lipsync';
}

export interface BatchOptions {
    quality?: 'fast' | 'standard' | 'premium';
    format?: string;
}

export interface VideoAdResult {
    concept: string;
    avatarUrl: string;
    audioUrl: string;
    videoUrl: string;
    cost: {
        image: number;
        voice: number;
        video: number;
        total: number;
    };
}

export class VideoAdOrchestrator {
    private imageGen: ImageGenerator;
    private voiceGen: VoiceGenerator;
    private animator: VideoAnimator;

    constructor() {
        this.imageGen = new ImageGenerator();
        this.voiceGen = new VoiceGenerator();
        this.animator = new VideoAnimator();
    }

    /**
     * Generar UN video completo (avatar + voz + animación)
     */
    async generateSingle(config: VideoAdConfig, opts: BatchOptions = {}): Promise<VideoAdResult> {
        console.log(`[VideoAdOrchestrator] 🚀 Generando video: ${config.concept}`);

        const startTime = Date.now();

        try {
            // PASO 1: Generar avatar (imagen)
            console.log('[VideoAdOrchestrator] 📸 Paso 1/3: Generando avatar...');
            const avatarUrl = await this.imageGen.generate({
                prompt: config.avatarPrompt,
                aspectRatio: '9:16',
                style: 'realistic'
            });

            // PASO 2: Generar voz
            console.log('[VideoAdOrchestrator] 🎙️ Paso 2/3: Generando voz...');
            const audioBuffer = await this.voiceGen.generate({
                text: config.script,
                voiceId: config.voiceId
            });
            const audioUrl = await uploadBufferToGCS(
                audioBuffer,
                `audio/v_${Date.now()}_${Math.random().toString(36).substring(7)}.mp3`
            );

            // PASO 3: Animar video
            console.log('[VideoAdOrchestrator] 🎬 Paso 3/3: Animando video...');
            const videoUrl = await this.animator.animate({
                imageUrl: avatarUrl,
                audioUrl: audioUrl,
                cropFactor: config.cropFactor,
                quality: opts.quality === 'premium' ? 'premium' : 'standard'
            });

            const duration = ((Date.now() - startTime) / 1000).toFixed(1);

            const cost = {
                image: this.imageGen.calculateCost(1),
                voice: this.voiceGen.calculateCost(config.script.length),
                video: this.animator.calculateCost(
                    this.animator.estimateDuration(config.script.length)
                ),
                total: 0
            };
            cost.total = cost.image + cost.voice + cost.video;

            console.log(`[VideoAdOrchestrator] ✅ Video completo en ${duration}s - Costo: $${cost.total.toFixed(3)}`);

            return {
                concept: config.concept,
                avatarUrl,
                audioUrl,
                videoUrl,
                cost
            };

        } catch (error) {
            console.error(`[VideoAdOrchestrator] ❌ Error generando video:`, error);
            throw error;
        }
    }

    /**
     * Generar múltiples videos en BATCH (10-15 variaciones en paralelo)
     */
    async generateBatch(configs: VideoAdConfig[], opts: BatchOptions = {}): Promise<VideoAdResult[]> {
        console.log(`[VideoAdOrchestrator] 🚀 Generando ${configs.length} videos en BATCH...`);

        const startTime = Date.now();

        try {
            // FASE 1: Generar TODOS los avatares en paralelo
            console.log('[VideoAdOrchestrator] 📸 FASE 1/3: Generando avatares en paralelo...');
            const avatarUrls = await this.imageGen.generateBatch(
                configs.map(c => ({
                    prompt: c.avatarPrompt,
                    aspectRatio: '9:16' as const,
                    style: 'realistic' as const
                }))
            );

            // FASE 2: Generar TODAS las voces en paralelo
            console.log('[VideoAdOrchestrator] 🎙️ FASE 2/3: Generando voces en paralelo...');
            const audioBuffers = await this.voiceGen.generateBatch(
                configs.map(c => ({
                    text: c.script,
                    voiceId: c.voiceId
                }))
            );

            const audioUrls = await Promise.all(
                audioBuffers.map((buffer, i) => uploadBufferToGCS(
                    buffer,
                    `audio/batch_${Date.now()}_${i}.mp3`
                ))
            );

            // FASE 3: Animar TODOS los videos en paralelo
            console.log('[VideoAdOrchestrator] 🎬 FASE 3/3: Animando videos en paralelo...');
            const videoUrls = await this.animator.animateBatch(
                avatarUrls.map((avatarUrl, i) => ({
                    imageUrl: avatarUrl,
                    audioUrl: audioUrls[i],
                    cropFactor: configs[i].cropFactor
                }))
            );

            const duration = ((Date.now() - startTime) / 1000).toFixed(1);

            // Crear resultados
            const results: VideoAdResult[] = configs.map((config, i) => {
                const cost = {
                    image: this.imageGen.calculateCost(1),
                    voice: this.voiceGen.calculateCost(config.script.length),
                    video: this.animator.calculateCost(
                        this.animator.estimateDuration(config.script.length)
                    ),
                    total: 0
                };
                cost.total = cost.image + cost.voice + cost.video;

                return {
                    concept: config.concept,
                    avatarUrl: avatarUrls[i],
                    audioUrl: audioUrls[i],
                    videoUrl: videoUrls[i],
                    cost
                };
            });

            const totalCost = results.reduce((sum, r) => sum + r.cost.total, 0);

            console.log(`[VideoAdOrchestrator] ✅ BATCH COMPLETO:`);
            console.log(`   - ${results.length} videos generados`);
            console.log(`   - Tiempo total: ${duration}s`);
            console.log(`   - Costo total: $${totalCost.toFixed(2)}`);
            console.log(`   - Costo promedio: $${(totalCost / results.length).toFixed(3)} por video`);

            return results;

        } catch (error) {
            console.error(`[VideoAdOrchestrator] ❌ Error en batch:`, error);
            throw error;
        }
    }
}
