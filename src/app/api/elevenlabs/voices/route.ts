import { NextRequest, NextResponse } from 'next/server';

// GET /api/elevenlabs/voices — proxy to ElevenLabs API
export async function GET() {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) return NextResponse.json({ voices: [] });

    try {
        const res = await fetch('https://api.elevenlabs.io/v1/voices', {
            headers: { 'xi-api-key': apiKey },
        });
        const data = await res.json();
        return NextResponse.json({ voices: data.voices ?? [] });
    } catch (e) {
        console.warn('[ElevenLabs/voices]', e);
        return NextResponse.json({ voices: [] });
    }
}
