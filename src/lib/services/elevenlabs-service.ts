import axios from 'axios';
import { getConnectionSecret } from '@/lib/server/connections';

const BASE_URL = 'https://api.elevenlabs.io/v1';

export interface VoiceSettings {
    stability: number;
    similarity_boost: number;
    style?: number;
    use_speaker_boost?: boolean;
    speed?: number;  // 0.7 – 1.3, velocidad del habla (ElevenLabs v3)
}

export interface Voice {
    voice_id: string;
    name: string;
    samples?: any[];
    category?: string;
    labels?: Record<string, string>;
    preview_url?: string;
}

export class ElevenLabsService {
    private static async getHeaders(): Promise<Record<string, string>> {
        const apiKey = (await getConnectionSecret('store-main', 'ELEVENLABS') || process.env.ELEVENLABS_API_KEY) ?? '';
        return {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json',
        };
    }

    static async getVoices(): Promise<Voice[]> {
        const headers = await this.getHeaders();
        const response = await axios.get(`${BASE_URL}/voices`, { headers });
        return response.data.voices;
    }

    static async textToSpeech(text: string, voiceId: string, settings?: VoiceSettings): Promise<Buffer> {
        const headers = await this.getHeaders();
        const payload: Record<string, any> = {
            text,
            model_id: 'eleven_v3',
            voice_settings: {
                stability: settings?.stability ?? 0.5,
                similarity_boost: settings?.similarity_boost ?? 0.8,
                style: settings?.style ?? 0.0,
                use_speaker_boost: settings?.use_speaker_boost ?? true,
            },
        };
        // speaking_rate es un campo a nivel raíz en eleven_v3
        if (settings?.speed && settings.speed !== 1.0) {
            payload.speaking_rate = settings.speed;
        }
        const response = await axios.post(
            `${BASE_URL}/text-to-speech/${voiceId}`,
            payload,
            { headers, responseType: 'arraybuffer' }
        );
        return Buffer.from(response.data);
    }

    static async speechToSpeech(audioBuffer: Buffer, voiceId: string, settings?: VoiceSettings): Promise<Buffer> {
        const headers = await this.getHeaders();
        const formData = new FormData();
        formData.append('audio', new Blob([new Uint8Array(audioBuffer)]), 'input.mp3');

        if (settings) {
            formData.append('voice_settings', JSON.stringify(settings));
        }

        const response = await axios.post(
            `${BASE_URL}/speech-to-speech/${voiceId}`,
            formData,
            {
                headers: {
                    ...headers,
                    'Content-Type': 'multipart/form-data',
                },
                responseType: 'arraybuffer',
            }
        );
        return Buffer.from(response.data);
    }

    static async addVoice(name: string, description: string, audioFiles: { buffer: Buffer, name: string }[]): Promise<string> {
        const headers = await this.getHeaders();
        const formData = new FormData();
        formData.append('name', name);
        formData.append('description', description);

        audioFiles.forEach((file) => {
            formData.append('files', new Blob([new Uint8Array(file.buffer)]), file.name);
        });

        const response = await axios.post(
            `${BASE_URL}/voices/add`,
            formData,
            {
                headers: {
                    ...headers,
                    'Content-Type': 'multipart/form-data',
                }
            }
        );
        return response.data.voice_id;
    }

    static async speechToText(audioBlob: Blob, options?: { language?: string, storeId?: string }): Promise<{ text: string; words?: any[] }> {
        const formData = new FormData();
        const file = new File([audioBlob], 'audio.mp3', { type: 'audio/mp3' });
        formData.append('file', file);
        formData.append('model_id', 'scribe_v2');  // más preciso, timestamps por palabra
        if (options?.language) formData.append('language_code', options.language);

        const apiKey = await getConnectionSecret(options?.storeId || 'store-main', 'ELEVENLABS') || process.env.ELEVENLABS_API_KEY;
        if (!apiKey) throw new Error("ELEVENLABS_API_KEY no configurado");

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minutos de timeout para STT

        try {
            const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
                method: 'POST',
                headers: { 'xi-api-key': apiKey },
                body: formData,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(`ElevenLabs STT error: ${err.detail || response.statusText}`);
            }

            const data = await response.json();
            return { text: data.text || '', words: data.words };
        } catch (e: any) {
            clearTimeout(timeoutId);
            if (e.name === 'AbortError') throw new Error("ElevenLabs STT timeout (2 min). El audio es demasiado largo o el servicio no responde.");
            throw e;
        }
    }

    static async generateMusic(prompt: string, durationSeconds: number = 30): Promise<ArrayBuffer> {
        const response = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
            method: 'POST',
            headers: {
                'xi-api-key': process.env.ELEVENLABS_API_KEY!,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: prompt,
                duration_seconds: durationSeconds,
                prompt_influence: 0.3,
            }),
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(`ElevenLabs music error: ${err.detail || response.statusText}`);
        }

        return response.arrayBuffer();
    }

    /**
     * Dubbing — traduce un vídeo manteniendo la voz original del locutor.
     * Devuelve un dubbingId que se puede consultar con getDubbingStatus().
     */
    static async dubVideo(
        videoUrl: string,
        targetLang: string,
        sourceLanguage?: string
    ): Promise<{ dubbing_id: string; expected_duration_sec: number }> {
        const headers = await this.getHeaders();
        const res = await fetch('https://api.elevenlabs.io/v1/dubbing', {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                source_url: videoUrl,
                target_lang: targetLang,
                source_lang: sourceLanguage || 'auto',
                num_speakers: 0,  // auto-detect
                watermark: false,
                highest_resolution: true
            })
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(`ElevenLabs dubbing error: ${err.detail || res.statusText}`);
        }
        return res.json();
    }

    /**
     * Obtener el estado de un job de dubbing.
     * status: 'dubbing' | 'dubbed' | 'failed'
     */
    static async getDubbingStatus(dubbingId: string): Promise<{
        dubbing_id: string;
        name: string;
        status: string;
        target_languages: string[];
        num_speakers: number;
        error?: string;
    }> {
        const headers = await this.getHeaders();
        const res = await fetch(
            `https://api.elevenlabs.io/v1/dubbing/${dubbingId}`,
            { headers }
        );
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(`ElevenLabs dubbing status error: ${err.detail || res.statusText}`);
        }
        return res.json();
    }

    /**
     * Voice Design — crea una nueva voz desde una descripción en texto.
     * Devuelve el voiceId generado y un preview de audio.
     */
    static async designVoice(params: {
        voiceDescription: string;
        text: string;
    }): Promise<{ voice_id: string; previews: any[] }> {
        const headers = await this.getHeaders();
        const res = await fetch('https://api.elevenlabs.io/v1/voice-generation/generate-voice', {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                voice_description: params.voiceDescription,
                text: params.text
            })
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(`ElevenLabs voice design error: ${err.detail || res.statusText}`);
        }
        return res.json();
    }
}
