import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const maxDuration = 300;
export const runtime = 'nodejs';

const DIM: Record<string, { w: number; h: number }> = {
    '9:16': { w: 720,  h: 1280 },
    '16:9': { w: 1920, h: 1080 },
    '1:1':  { w: 1080, h: 1080 },
};

// Voz española por defecto en HeyGen
const HEYGEN_ES_VOICE = '689f48196a9a43c4bbbb67c14fdbb4c6';

async function replicateRun(model: string, input: Record<string, any>, maxWait = 180000): Promise<string> {
    const token = process.env.REPLICATE_API_TOKEN;
    let createRes: Response = new Response('{}', { status: 500 });
    let pred: any = {};

    for (let attempt = 1; attempt <= 3; attempt++) {
        createRes = await fetch(
            `https://api.replicate.com/v1/models/${model}/predictions`,
            {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ input }),
            }
        );
        pred = await createRes.json();
        if (createRes.status === 429) { await new Promise(r => setTimeout(r, attempt * 10000)); continue; }
        break;
    }
    if (!createRes.ok) throw new Error(`${model} ${createRes.status}: ${pred.detail || pred.title}`);

    const predId = pred.id;
    const start = Date.now();
    while (Date.now() - start < maxWait) {
        await new Promise(r => setTimeout(r, 4000));
        const poll = await fetch(`https://api.replicate.com/v1/predictions/${predId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const pd = await poll.json();
        console.log(`[${model}] ${predId} → ${pd.status}`);
        if (pd.status === 'succeeded') {
            const out = pd.output;
            return Array.isArray(out) ? out[0] : (typeof out === 'string' ? out : String(out));
        }
        if (pd.status === 'failed') throw new Error(`${model} failed: ${pd.error}`);
    }
    throw new Error(`Timeout ${model}`);
}

export async function POST(req: NextRequest) {
    const storeId = req.headers.get('X-Store-Id') || 'store-main';
    try {
        const {
            avatarId, script, elevenLabsVoiceId, voiceSettings,
            emotion = 'Friendly', speed = 1, addCaptions = false,
            videoFormat = '9:16', productId,
        } = await req.json();

        if (!avatarId || !script) return NextResponse.json({ error: 'avatarId y script requeridos' }, { status: 400 });

        const token = process.env.REPLICATE_API_TOKEN;
        const dim = DIM[videoFormat] || DIM['9:16'];

        // PASO 1: HeyGen genera video con voz española
        console.log(`[HeyGen] Generando video con avatar ${avatarId}`);
        const heygenInput = {
            avatar_id: avatarId,
            input_text: script,
            avatar_style: 'normal',
            voice_id: HEYGEN_ES_VOICE,
            voice_speed: speed,
            voice_emotion: emotion,
            caption: false, // subtítulos los añadimos nosotros
            width: dim.w,
            height: dim.h,
        };

        const heygenVideoUrl = await replicateRun('heygen/avatar-iv', heygenInput, 280000);
        console.log(`[HeyGen] ✅ Video: ${heygenVideoUrl.slice(0, 80)}`);

        let finalVideoUrl = heygenVideoUrl;

        // PASO 2: Si hay voz ElevenLabs — generar audio y hacer lipsync
        if (elevenLabsVoiceId) {
            console.log(`[ElevenLabs] Generando audio con voz ${elevenLabsVoiceId}`);
            const elRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${elevenLabsVoiceId}`, {
                method: 'POST',
                headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY!, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: script,
                    model_id: 'eleven_v3',
                    voice_settings: {
                        stability: voiceSettings?.stability ?? 0.5,
                        similarity_boost: voiceSettings?.similarity_boost ?? 0.8,
                        style: voiceSettings?.style ?? 0.3,
                        use_speaker_boost: true,
                    },
                }),
            });

            if (!elRes.ok) throw new Error(`ElevenLabs ${elRes.status}`);
            const audioBuffer = Buffer.from(await elRes.arrayBuffer());
            const audioBase64 = `data:audio/mpeg;base64,${audioBuffer.toString('base64')}`;
            console.log(`[ElevenLabs] ✅ Audio generado`);

            // PASO 3: LipSync — sincronizar labios con nuevo audio
            console.log(`[LipSync] Sincronizando labios...`);
            const lipsyncModels = [
                { model: 'sync/lipsync-2-pro', input: { video: heygenVideoUrl, audio: audioBase64 } },
                { model: 'sync/lipsync-2',     input: { video: heygenVideoUrl, audio: audioBase64 } },
                { model: 'kwaivgi/kling-lip-sync', input: { video_url: heygenVideoUrl, audio_file: audioBase64 } },
                { model: 'latentlabs/latentsync', input: { video: heygenVideoUrl, audio: audioBase64 } },
            ];

            for (const { model, input } of lipsyncModels) {
                try {
                    finalVideoUrl = await replicateRun(model, input, 120000);
                    console.log(`[LipSync] ✅ ${model}`);
                    break;
                } catch (e: any) {
                    console.warn(`[LipSync] ⚠️ ${model}: ${e.message}`);
                }
            }
        }

        // Guardar en biblioteca
        if (productId) {
            try {
                await (prisma.creativeAsset as any).create({
                    data: { productId, storeId, type: 'VIDEO', concept: `HeyGen — ${avatarId}`, videoUrl: finalVideoUrl, status: 'READY' }
                });
            } catch {}
        }

        return NextResponse.json({
            success: true,
            videoUrl: finalVideoUrl,
            heygenVideoUrl,
            usedLipsync: elevenLabsVoiceId ? true : false,
        });

    } catch (e: any) {
        console.error('[HeyGen generate]', e.message);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
