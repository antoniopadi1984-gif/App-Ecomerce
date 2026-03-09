import { NextRequest, NextResponse } from 'next/server';
import { ElevenLabsService } from '@/lib/services/elevenlabs-service';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { text, voiceId, settings } = body;

        if (!text || !voiceId) {
            return NextResponse.json({ success: false, error: 'Text and voiceId required' }, { status: 400 });
        }

        const audioBuffer = await ElevenLabsService.textToSpeech(text, voiceId, settings);

        // Return base64 to play in frontend
        return NextResponse.json({
            success: true,
            audio: audioBuffer.toString('base64'),
            mimeType: 'audio/mpeg'
        });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
