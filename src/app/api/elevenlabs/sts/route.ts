import { NextRequest, NextResponse } from 'next/server';
import { ElevenLabsService } from '@/lib/services/elevenlabs-service';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const audioFile = formData.get('audioFile') as File || formData.get('audio') as File;
        const voiceId = formData.get('targetVoiceId') as string || formData.get('voiceId') as string;
        const storeId = formData.get('storeId') as string;
        const settingsJson = formData.get('settings') as string;

        if (!audioFile || !voiceId) {
            return NextResponse.json({ error: 'Missing audioFile or targetVoiceId' }, { status: 400 });
        }

        const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
        const settings = settingsJson ? JSON.parse(settingsJson) : undefined;

        const outputBuffer = await ElevenLabsService.speechToSpeech(audioBuffer, voiceId, settings);

        return new NextResponse(new Uint8Array(outputBuffer), {
            headers: {
                'Content-Type': 'audio/mpeg',
            },
        });
    } catch (error: any) {
        console.error('[ElevenLabs/STS] Error:', error.response?.data || error.message);
        return NextResponse.json({ error: 'Failed to transform voice' }, { status: 500 });
    }
}
