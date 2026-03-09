import { NextRequest, NextResponse } from 'next/server';
import { ElevenLabsService } from '@/lib/services/elevenlabs-service';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const voiceId = formData.get('voiceId') as string;
        const settingsJson = formData.get('settings') as string;
        const settings = settingsJson ? JSON.parse(settingsJson) : undefined;

        if (!file || !voiceId) {
            return NextResponse.json({ success: false, error: 'File and voiceId required' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const audioBuffer = await ElevenLabsService.speechToSpeech(buffer, voiceId, settings);

        return NextResponse.json({
            success: true,
            audio: audioBuffer.toString('base64'),
            mimeType: 'audio/mpeg'
        });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
