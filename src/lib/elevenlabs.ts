/**
 * ElevenLabs API Client for EcomBoom Control
 * Handles voice synthesis and cloning.
 */

export class ElevenLabsClient {
    private apiKey: string;
    private baseUrl = "https://api.elevenlabs.io/v1";

    constructor(apiKey?: string) {
        this.apiKey = apiKey || process.env.ELEVENLABS_API_KEY || "";
    }

    async getVoices() {
        if (!this.apiKey) return { success: false, error: "No API Key" };
        try {
            const response = await fetch(`${this.baseUrl}/voices`, {
                headers: { "xi-api-key": this.apiKey }
            });
            const data = await response.json();
            return { success: true, voices: data.voices };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    async textToSpeech(text: string, voiceId: string, stability = 0.5, similarity = 0.75) {
        if (!this.apiKey) return { success: false, error: "No API Key" };
        try {
            const response = await fetch(`${this.baseUrl}/text-to-speech/${voiceId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "xi-api-key": this.apiKey
                },
                body: JSON.stringify({
                    text,
                    model_id: "eleven_multilingual_v2",
                    voice_settings: {
                        stability,
                        similarity_boost: similarity
                    }
                })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail?.message || "Speech synthesis failed");
            }

            const audioBlob = await response.blob();
            // In a real app, we'd upload this to R2/S3 or return the stream
            // For now, we return a success signal
            return { success: true, blob: audioBlob };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }
}

export const elevenLabs = new ElevenLabsClient();
