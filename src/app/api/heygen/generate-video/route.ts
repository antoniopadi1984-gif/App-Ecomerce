import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const maxDuration = 300;

const DIM: Record<string, { w: number; h: number }> = {
    '9:16': { w: 720,  h: 1280 },
    '16:9': { w: 1920, h: 1080 },
    '1:1':  { w: 1080, h: 1080 },
};

export async function POST(req: NextRequest) {
    const storeId = req.headers.get('X-Store-Id') || 'store-main';
    try {
        const {
            avatarId, script, voiceId, emotion = 'Friendly',
            speed = 1, addCaptions = false, videoFormat = '9:16',
            productId,
        } = await req.json();

        if (!avatarId || !script) return NextResponse.json({ error: 'avatarId y script requeridos' }, { status: 400 });

        const token = process.env.REPLICATE_API_TOKEN;
        const dim = DIM[videoFormat] || DIM['9:16'];

        // Construir input para heygen/avatar-iv
        const input: Record<string, any> = {
            avatar_id: avatarId,
            input_text: script,
            avatar_style: 'normal',
            voice_speed: speed,
            voice_emotion: emotion,
            caption: addCaptions,
            width: dim.w,
            height: dim.h,
        };

        // HeyGen usa sus propias voces — ElevenLabs se aplica en post-producción
        // if (voiceId) input.voice_id = voiceId; // No compatible

        // Lanzar predicción en Replicate
        const createRes = await fetch('https://api.replicate.com/v1/models/heygen/avatar-iv/predictions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ input }),
        });

        const pred = await createRes.json();
        if (!createRes.ok) throw new Error(`Replicate ${createRes.status}: ${pred.detail || pred.title}`);

        const predId = pred.id;
        console.log(`[HeyGen] ▶ ${predId} | ${avatarId}`);

        // Polling
        const start = Date.now();
        while (Date.now() - start < 280000) {
            await new Promise(r => setTimeout(r, 5000));
            const poll = await fetch(`https://api.replicate.com/v1/predictions/${predId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const pollData = await poll.json();
            console.log(`[HeyGen] ${predId} → ${pollData.status}`);

            if (pollData.status === 'succeeded') {
                const output = pollData.output;
                const videoUrl = typeof output === 'string' ? output : output?.url?.() || String(output);

                // Guardar en biblioteca
                if (productId) {
                    try {
                        await (prisma.creativeAsset as any).create({
                            data: {
                                productId, storeId,
                                type: 'VIDEO',
                                concept: `HeyGen — ${avatarId}`,
                                videoUrl,
                                status: 'READY',
                            }
                        });
                    } catch {}
                }

                return NextResponse.json({ success: true, videoUrl, predId });
            }

            if (pollData.status === 'failed') throw new Error(`HeyGen falló: ${pollData.error}`);
        }

        throw new Error('Timeout — el video tardó demasiado');

    } catch (e: any) {
        console.error('[HeyGen generate]', e.message);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
