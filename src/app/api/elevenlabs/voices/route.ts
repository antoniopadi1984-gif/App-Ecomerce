import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    const res = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: { 'xi-api-key': apiKey! }
    });
    const data = await res.json();
    
    const voices = (data.voices || []).map((v: any) => ({
        voice_id: v.voice_id,
        name: v.name,
        category: v.category,
        language: v.labels?.language || v.labels?.accent || 'en',
        gender: v.labels?.gender || '',
        age: v.labels?.age || '',
        use_case: v.labels?.use_case || '',
        description: v.labels?.description || '',
        preview_url: v.preview_url,
    }));

    // Ordenar: español primero, luego inglés
    voices.sort((a: any, b: any) => {
        if (a.language === 'es' && b.language !== 'es') return -1;
        if (b.language === 'es' && a.language !== 'es') return 1;
        return 0;
    });

    return NextResponse.json({ voices, total: voices.length });
}
