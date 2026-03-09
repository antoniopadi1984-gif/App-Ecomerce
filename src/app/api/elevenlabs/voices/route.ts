import { NextRequest, NextResponse } from 'next/server';

import { ElevenLabsService } from '@/lib/services/elevenlabs-service';

export async function GET() {
    try {
        const voices = await ElevenLabsService.getVoices();
        return NextResponse.json({ success: true, voices });
    } catch (e: any) {
        console.error('[ElevenLabs/voices]', e);
        return NextResponse.json({ success: false, voices: [], error: e.message });
    }
}
