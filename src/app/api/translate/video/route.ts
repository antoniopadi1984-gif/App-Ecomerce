import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;
export const runtime = "nodejs";

/**
 * POST /api/translate/video
 * Traduce un vídeo completo a otro idioma via HeyGen
 * Body: { videoUrl, targetLanguage, sourceLanguage? }
 */
export async function POST(req: NextRequest) {
    try {
        const { videoUrl, targetLanguage = "es", sourceLanguage = "auto" } = await req.json();
        if (!videoUrl) return NextResponse.json({ error: "videoUrl requerida" }, { status: 400 });

        const token = process.env.REPLICATE_API_TOKEN;
        if (!token) return NextResponse.json({ error: "REPLICATE_API_TOKEN no configurado" }, { status: 500 });

        // HeyGen video translation via Replicate
        const res = await fetch("https://api.replicate.com/v1/models/heygen/video-translation/predictions", {
            method: "POST",
            headers: { "Authorization": `Token ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                input: {
                    video_url: videoUrl,
                    output_language: targetLanguage,
                    translate_audio_only: false,
                }
            })
        });
        const pred = await res.json();
        if (pred.error) return NextResponse.json({ error: pred.error }, { status: 500 });

        // Poll
        let result = pred;
        let attempts = 0;
        while (result.status !== "succeeded" && result.status !== "failed" && attempts < 100) {
            await new Promise(r => setTimeout(r, 5000));
            const poll = await fetch(`https://api.replicate.com/v1/predictions/${pred.id}`, {
                headers: { "Authorization": `Token ${token}` }
            });
            result = await poll.json();
            attempts++;
        }

        if (result.status === "failed") return NextResponse.json({ error: result.error }, { status: 500 });

        const outputUrl = Array.isArray(result.output) ? result.output[0] : result.output;
        return NextResponse.json({ success: true, translatedVideoUrl: outputUrl, predictionId: pred.id });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
