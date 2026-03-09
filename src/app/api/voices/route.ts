import { NextRequest, NextResponse } from 'next/server';
import { ElevenLabsService } from '@/lib/services/elevenlabs-service';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const gender = searchParams.get('gender');
        const accent = searchParams.get('accent');
        const age = searchParams.get('age');

        let voices = await ElevenLabsService.getVoices();

        // ElevenLabs returns labels in a record. We filter them here.
        if (gender || accent || age) {
            voices = voices.filter(v => {
                const labels = v.labels || {};
                let match = true;
                if (gender && labels.gender !== gender) match = false;
                if (accent && labels.accent !== accent) match = false;
                if (age && labels.age !== age) match = false;
                return match;
            });
        }

        return NextResponse.json({ success: true, voices });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
