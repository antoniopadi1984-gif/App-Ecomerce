import { NextRequest, NextResponse } from 'next/server';
import { ElevenLabsService } from '@/lib/services/elevenlabs-service';

export async function POST(req: NextRequest) {
    try {
        const { text, voiceId, storeId, settings } = await req.json();

        if (!text || !voiceId) {
            return NextResponse.json({ error: 'Missing text or voiceId' }, { status: 400 });
        }

        // We can pass storeId if we want to support multiple ElevenLabs accounts
        // For now the service is hardcoded to 'store-main' but we can make it dynamic
        const audioBuffer = await ElevenLabsService.textToSpeech(text, voiceId, settings);

        return new NextResponse(new Uint8Array(audioBuffer), {
            headers: {
                'Content-Type': 'audio/mpeg',
                'Cache-Control': 'no-cache',
            },
        });
    } catch (error: any) {
        console.error('[ElevenLabs/TTS] Error:', error.response?.data || error.message);
        return NextResponse.json({ error: 'Failed to generate preview' }, { status: 500 });
    }
}
