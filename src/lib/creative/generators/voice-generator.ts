import { ElevenLabsService } from '@/lib/services/elevenlabs-service';

export class VoiceGenerator {
    private charGenerated = 0;
    private costPer1000Chars = 0.003; // eleven_v3

    async generate(opts: { text: string; voiceId?: string }): Promise<Buffer> {
        const voiceId = opts.voiceId
            || process.env.ELEVENLABS_VOICE_FEMALE
            || '21m00Tcm4TlvDq8ikWAM';

        // SIEMPRE eleven_v3 — NO eleven_multilingual_v1
        const audioBuffer = await ElevenLabsService.textToSpeech(
            opts.text, voiceId, {
                stability: 0.5,
                similarity_boost: 0.75,
                style: 0.0
            }
        );

        this.charGenerated += opts.text.length;
        return Buffer.from(audioBuffer);
    }

    async generateBatch(configs: { text: string; voiceId?: string }[]): Promise<Buffer[]> {
        return Promise.all(configs.map(c => this.generate(c)));
    }

    calculateCost(chars: number): number {
        return (chars / 1000) * this.costPer1000Chars;
    }

    getTotalCost(): number {
        return this.calculateCost(this.charGenerated);
    }
}
