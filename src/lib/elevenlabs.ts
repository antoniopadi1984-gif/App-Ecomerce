/**
 * ElevenLabs API Client for EcomBoom Control
 * Handles voice synthesis and cloning.
 */
import { getConnectionSecret } from '@/lib/server/connections';

export class ElevenLabsClient {
    private baseUrl = "https://api.elevenlabs.io";

    private async getApiKey(): Promise<string> {
        return await getConnectionSecret('store-main', 'ELEVENLABS') || process.env.ELEVENLABS_API_KEY || "";
    }

    /**
     * List all available voices (Saved voices)
     */
    async getVoices(voiceType: string = "saved", pageSize: number = 50) {
        const apiKey = await this.getApiKey();
        if (!apiKey) return { success: false, error: "No API Key configuration in Database" };
        try {
            const response = await fetch(`${this.baseUrl}/v2/voices?voice_type=${voiceType}&page_size=${pageSize}`, {
                headers: { "xi-api-key": apiKey }
            });
            const data = await response.json();
            return { success: true, voices: data.voices };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Text to Speech (using eleven_v3 by default)
     * Supports SSML-like tags and audio tags [laughs], [sighs], etc.
     */
    async textToSpeech(text: string, voiceId: string, options: {
        stability?: number,
        similarity?: number,
        style?: number,
        model_id?: string,
        output_format?: string
    } = {}) {
        const apiKey = await this.getApiKey();
        if (!apiKey) return { success: false, error: "No API Key in Database" };

        const {
            stability = 0.5,
            similarity = 0.75,
            style = 0,
            model_id = "eleven_v3",
            output_format = "mp3_44100_128"
        } = options;

        try {
            const response = await fetch(`${this.baseUrl}/v1/text-to-speech/${voiceId}/stream?output_format=${output_format}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "xi-api-key": apiKey
                },
                body: JSON.stringify({
                    text,
                    model_id,
                    voice_settings: {
                        stability,
                        similarity_boost: similarity,
                        style
                    }
                })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail?.message || "Speech synthesis failed");
            }

            const audioBlob = await response.blob();
            return { success: true, blob: audioBlob };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Text to Dialogue (Multiple voices in one generation)
     */
    async textToDialogue(dialogue: { voice_id: string, text: string }[], model_id: string = "eleven_v3") {
        const apiKey = await this.getApiKey();
        if (!apiKey) return { success: false, error: "No API Key in Database" };

        try {
            const response = await fetch(`${this.baseUrl}/v1/text-to-dialogue`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "xi-api-key": apiKey
                },
                body: JSON.stringify({
                    model_id,
                    dialogue
                })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail?.message || "Dialogue generation failed");
            }

            const audioBlob = await response.blob();
            return { success: true, blob: audioBlob };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Speech to Text / Transcription (Scribe V2)
     */
    async speechToText(audioFile: Blob | File) {
        const apiKey = await this.getApiKey();
        if (!apiKey) return { success: false, error: "No API Key in Database" };

        try {
            const formData = new FormData();
            formData.append("file", audioFile);

            const response = await fetch(`${this.baseUrl}/v1/speech-to-text?model_id=scribe_v2&timestamps_granularity=word`, {
                method: "POST",
                headers: {
                    "xi-api-key": apiKey
                },
                body: formData
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail?.message || "Transcription failed");
            }

            const data = await response.json();
            return { success: true, data };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Sound Effect Generation
     */
    async generateSoundEffect(prompt: string, duration_seconds: number = 0.5) {
        const apiKey = await this.getApiKey();
        if (!apiKey) return { success: false, error: "No API Key in Database" };

        try {
            const response = await fetch(`${this.baseUrl}/v1/sound-generation`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "xi-api-key": apiKey
                },
                body: JSON.stringify({
                    text: prompt,
                    duration_seconds
                })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail?.message || "Sound generation failed");
            }

            const audioBlob = await response.blob();
            return { success: true, blob: audioBlob };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Music Generation
     */
    async generateMusic(prompt: string, duration_seconds: number = 45) {
        const apiKey = await this.getApiKey();
        if (!apiKey) return { success: false, error: "No API Key in Database" };

        try {
            const response = await fetch(`${this.baseUrl}/v1/music/generations`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "xi-api-key": apiKey
                },
                body: JSON.stringify({
                    prompt,
                    duration_seconds
                })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail?.message || "Music generation failed");
            }

            const audioBlob = await response.blob();
            return { success: true, blob: audioBlob };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Voice Isolator (Clean audio from background music/noise)
     */
    async audioIsolation(audioFile: Blob | File) {
        const apiKey = await this.getApiKey();
        if (!apiKey) return { success: false, error: "No API Key in Database" };

        try {
            const formData = new FormData();
            formData.append("file", audioFile);

            const response = await fetch(`${this.baseUrl}/v1/audio-isolation`, {
                method: "POST",
                headers: {
                    "xi-api-key": apiKey
                },
                body: formData
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail?.message || "Audio isolation failed");
            }

            const audioBlob = await response.blob();
            return { success: true, blob: audioBlob };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Voice Cloning / Add Voice
     */
    async addVoice(name: string, audioFiles: (Blob | File)[]) {
        const apiKey = await this.getApiKey();
        if (!apiKey) return { success: false, error: "No API Key in Database" };

        try {
            const formData = new FormData();
            formData.append("name", name);
            audioFiles.forEach((file, index) => {
                formData.append("files", file);
            });

            const response = await fetch(`${this.baseUrl}/v1/voices/add`, {
                method: "POST",
                headers: {
                    "xi-api-key": apiKey
                },
                body: formData
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail?.message || "Voice cloning failed");
            }

            const data = await response.json();
            return { success: true, voice_id: data.voice_id };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }
}

export const elevenLabs = new ElevenLabsClient();
