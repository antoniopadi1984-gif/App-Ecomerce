import axios from 'axios';
import { getConnectionSecret } from '@/lib/server/connections';

const BASE_URL = 'https://api.elevenlabs.io/v1';

export interface VoiceSettings {
    stability: number;
    similarity_boost: number;
    style?: number;
    use_speaker_boost?: boolean;
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
    private static async getHeaders() {
        const apiKey = await getConnectionSecret('store-main', 'ELEVENLABS') || process.env.ELEVENLABS_API_KEY;
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
        const response = await axios.post(
            `${BASE_URL}/text-to-speech/${voiceId}`,
            {
                text,
                model_id: 'eleven_v3',
                voice_settings: settings || {
                    stability: 0.5,
                    similarity_boost: 0.8,
                    style: 0.0,
                    use_speaker_boost: true
                },
            },
            {
                headers,
                responseType: 'arraybuffer',
            }
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

    static async speechToText(audioBlob: Blob): Promise<{ text: string }> {
        const headers = await this.getHeaders();
        const formData = new FormData();
        formData.append('file', audioBlob, 'audio.mp3');
        formData.append('model_id', 'scribe_v1');
        
        try {
            const response = await axios.post(
                `${BASE_URL}/speech-to-text`,
                formData,
                { headers: { ...headers, 'Content-Type': 'multipart/form-data' } }
            );
            return response.data;
        } catch (e: any) {
            console.error('ElevenLabs Scribe failed:', e?.response?.data || e);
            throw new Error(e?.response?.data?.detail?.message || 'Scribe failed');
        }
    }

    static async generateMusic(prompt: string, duration_seconds: number): Promise<Buffer> {
        const headers = await this.getHeaders();
        try {
            const response = await axios.post(
                `${BASE_URL}/sound-generation`,
                { text: prompt, duration_seconds },
                { headers, responseType: 'arraybuffer' }
            );
            return Buffer.from(response.data);
        } catch (e: any) {
            console.error('ElevenLabs Music failed:', e?.response?.data || e);
            throw new Error('Music generation failed');
        }
    }
}
