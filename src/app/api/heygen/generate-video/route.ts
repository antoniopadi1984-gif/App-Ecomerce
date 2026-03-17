import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const maxDuration = 300;
export const runtime = 'nodejs';

const DIM: Record<string, { w: number; h: number }> = {
    '9:16': { w: 720,  h: 1280 },
    '16:9': { w: 1920, h: 1080 },
    '1:1':  { w: 1080, h: 1080 },
};

const HEYGEN_ES_VOICE = '689f48196a9a43c4bbbb67c14fdbb4c6';

async function replicateRun(model: string, input: Record<string, any>, maxWait = 180000): Promise<string> {
    const token = process.env.REPLICATE_API_TOKEN;
    const createRes = await fetch(
        `https://api.replicate.com/v1/models/${model}/predictions`,
        { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ input }) }
    );
    const pred = await createRes.json();
    if (!createRes.ok) throw new Error(`${model} ${createRes.status}: ${pred.detail}`);
    const predId = pred.id;
    const start = Date.now();
    while (Date.now() - start < maxWait) {
        await new Promise(r => setTimeout(r, 4000));
        const poll = await fetch(`https://api.replicate.com/v1/predictions/${predId}`, { headers: { 'Authorization': `Bearer ${token}` } });
        const pd = await poll.json();
        if (pd.status === 'succeeded') { const o = pd.output; return Array.isArray(o) ? o[0] : String(o); }
        if (pd.status === 'failed') throw new Error(`${model}: ${pd.error}`);
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

        const apiKey = process.env.HEYGEN_API_KEY!;
        const dim = DIM[videoFormat] || DIM['9:16'];

        // PASO 1: HeyGen API directa — crear video
        console.log(`[HeyGen] Creando video con ${avatarId}`);
        const createRes = await fetch('https://api.heygen.com/v2/video/generate', {
            method: 'POST',
            headers: { 'X-Api-Key': apiKey, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                video_inputs: [{
                    character: {
                        type: 'avatar',
                        avatar_id: avatarId,
                        avatar_style: 'normal',
                    },
                    voice: {
                        type: 'text',
                        input_text: script,
                        voice_id: HEYGEN_ES_VOICE,
                        speed: speed,
                        emotion: emotion,
                    },
                    background: { type: 'color', value: '#FAFAFA' },
                }],
                caption: addCaptions,
                dimension: { width: dim.w, height: dim.h },
            }),
        });

        const createData = await createRes.json();
        if (!createRes.ok || createData.error) {
            throw new Error(`HeyGen create: ${JSON.stringify(createData.error || createData)}`);
        }

        const videoId = createData.data?.video_id;
        if (!videoId) throw new Error('No se obtuvo video_id de HeyGen');
        console.log(`[HeyGen] Video ID: ${videoId}`);

        // PASO 2: Polling hasta completar
        let heygenVideoUrl = '';
        const start = Date.now();
        while (Date.now() - start < 240000) {
            await new Promise(r => setTimeout(r, 5000));
            const statusRes = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${videoId}`, {
                headers: { 'X-Api-Key': apiKey }
            });
            const statusData = await statusRes.json();
            const status = statusData.data?.status;
            console.log(`[HeyGen] ${videoId} → ${status}`);

            if (status === 'completed') {
                heygenVideoUrl = statusData.data?.video_url || statusData.data?.video_url_caption || '';
                break;
            }
            if (status === 'failed') throw new Error(`HeyGen falló: ${statusData.data?.error}`);
        }

        if (!heygenVideoUrl) throw new Error('HeyGen timeout — no completó en 4 minutos');
        console.log(`[HeyGen] ✅ ${heygenVideoUrl.slice(0, 80)}`);

        let finalVideoUrl = heygenVideoUrl;

        // PASO 3: Si hay voz ElevenLabs — reemplazar audio con LipSync
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
            if (!elRes.ok) throw new Error(`ElevenLabs ${elRes.status}: ${await elRes.text()}`);
            const audioBuffer = Buffer.from(await elRes.arrayBuffer());
            const audioBase64 = `data:audio/mpeg;base64,${audioBuffer.toString('base64')}`;
            console.log(`[ElevenLabs] ✅ Audio generado`);

            // LipSync cascade
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

        return NextResponse.json({ success: true, videoUrl: finalVideoUrl, heygenVideoUrl, usedLipsync: !!elevenLabsVoiceId });

    } catch (e: any) {
        console.error('[HeyGen generate]', e.message);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
