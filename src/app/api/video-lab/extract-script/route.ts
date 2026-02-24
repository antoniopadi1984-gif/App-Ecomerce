import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

/**
 * Extract script/transcript from video using Replicate Whisper
 */
export async function POST(req: NextRequest) {
    try {
        const { driveFileId, videoUrl } = await req.json();

        if (!videoUrl && !driveFileId) {
            return NextResponse.json(
                { error: "videoUrl or driveFileId required" },
                { status: 400 }
            );
        }

        const { getConnectionSecret } = await import("@/lib/server/connections");
        const replicateToken = await getConnectionSecret("store-main", "REPLICATE") || process.env.REPLICATE_API_TOKEN;

        if (!replicateToken) {
            return NextResponse.json(
                { error: "Replicate Master Engine no configurado. Ve a Conexiones." },
                { status: 400 }
            );
        }

        const replicate = new Replicate({ auth: replicateToken });

        console.log("[ExtractScript] Starting transcription with Replicate Whisper...");

        // Use Whisper model for transcription
        const output = await replicate.run(
            "openai/whisper:4d50797290df275329f202e48c76360b3f22b08d28c196cbc54600319435f8d2",
            {
                input: {
                    audio: videoUrl,
                    model: "large-v3",
                    translate: false,
                    temperature: 0,
                    transcription: "plain text",
                    suppress_tokens: "-1",
                    logprob_threshold: -1.0,
                    no_speech_threshold: 0.6,
                    condition_on_previous_text: true,
                    compression_ratio_threshold: 2.4,
                    temperature_increment_on_fallback: 0.2
                }
            }
        ) as any;

        const transcript = output?.transcription || output?.text || String(output);

        console.log("[ExtractScript] ✅ Transcription complete");

        return NextResponse.json({
            success: true,
            script: transcript,
            provider: "replicate-whisper"
        });

    } catch (error: any) {
        console.error("[ExtractScript] Error:", error);
        return NextResponse.json(
            { error: error.message || "Transcription failed" },
            { status: 500 }
        );
    }
}
