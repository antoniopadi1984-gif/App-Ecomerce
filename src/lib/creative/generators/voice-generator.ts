import { Storage } from '@google-cloud/storage';
import { getConnectionSecret, getConnectionMeta } from '@/lib/server/connections';

export interface VoiceGenerationOptions {
    text: string;
    voiceId?: string;
    stability?: number;
    similarityBoost?: number;
}

export class VoiceGenerator {
    private apiKey!: string;
    private storage!: Storage;
    private bucketName!: string;
    private projectId!: string;
    private isInitialized = false;

    constructor() { }

    private async initClients() {
        if (this.isInitialized) return;

        const apiKey = await getConnectionSecret('store-main', 'ELEVENLABS') || process.env.ELEVENLABS_API_KEY;
        const meta = await getConnectionMeta('store-main', 'GCP');

        this.apiKey = apiKey || '';
        this.bucketName = meta?.GCS_BUCKET_NAME || process.env.GCS_BUCKET_NAME || '';
        this.projectId = meta?.GOOGLE_CLOUD_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT_ID || '';

        // If bucket info isn't found and we know it's missing, log warning instead of crashing
        if (!this.bucketName) {
            console.warn('[VoiceGenerator] Warning: GCS_BUCKET_NAME is not configured.');
        }

        this.storage = new Storage({
            projectId: this.projectId
        });

        this.isInitialized = true;
    }

    /**
     * Generar voz con ElevenLabs
     */
    async generate(options: VoiceGenerationOptions): Promise<string> {
        console.log('[VoiceGenerator] 🎙️ Generando audio con ElevenLabs...');

        try {
            await this.initClients();

            const voice = options.voiceId || process.env.ELEVENLABS_VOICE_FEMALE || '';

            if (!this.apiKey) {
                throw new Error('ELEVENLABS API key not found in Database Connections nor in process.env');
            }

            const response = await fetch(
                `https://api.elevenlabs.io/v1/text-to-speech/${voice}`,
                {
                    method: 'POST',
                    headers: {
                        'xi-api-key': this.apiKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        text: options.text,
                        model_id: 'eleven_v3',
                        voice_settings: {
                            stability: options.stability ?? 0.5,
                            similarity_boost: options.similarityBoost ?? 0.75,
                            style: 0.0,
                            use_speaker_boost: true
                        }
                    })
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`ElevenLabs error: ${response.status} - ${errorText}`);
            }

            console.log('[VoiceGenerator] ✅ Audio generated, uploading to GCS...');

            const audioBuffer = Buffer.from(await response.arrayBuffer());
            const publicUrl = await this.uploadToStorage(audioBuffer);

            console.log('[VoiceGenerator] ✅ Complete:', publicUrl);

            return publicUrl;

        } catch (error) {
            console.error('[VoiceGenerator] ❌ Error:', error);
            throw error;
        }
    }

    /**
     * Generar múltiples audios en batch
     */
    async generateBatch(scriptsArray: VoiceGenerationOptions[]): Promise<string[]> {
        console.log(`[VoiceGenerator] 🎙️ Generando ${scriptsArray.length} audios en batch...`);

        const startTime = Date.now();
        const promises = scriptsArray.map(opts => this.generate(opts));
        const results = await Promise.allSettled(promises);

        const successful = results
            .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled')
            .map(r => r.value);

        const failed = results.filter(r => r.status === 'rejected').length;

        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`[VoiceGenerator] ✅ Batch complete: ${successful.length} success, ${failed} failed in ${duration}s`);

        return successful;
    }

    private async uploadToStorage(buffer: Buffer): Promise<string> {
        const filename = `audio/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.mp3`;

        try {
            const bucket = this.storage.bucket(this.bucketName);
            const file = bucket.file(filename);

            await file.save(buffer, {
                metadata: {
                    contentType: 'audio/mpeg',
                    cacheControl: 'public, max-age=31536000'
                }
            });

            await file.makePublic();

            return `https://storage.googleapis.com/${this.bucketName}/${filename}`;

        } catch (error) {
            console.error('[VoiceGenerator] Upload error:', error);
            throw new Error(`Failed to upload to GCS: ${error}`);
        }
    }

    /**
     * Calcular costo de generación
     * ElevenLabs: ~$0.30 per 1000 characters
     */
    calculateCost(textLength: number): number {
        return (textLength / 1000) * 0.30;
    }
}
