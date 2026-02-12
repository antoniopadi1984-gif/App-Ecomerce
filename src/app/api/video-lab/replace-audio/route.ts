import { NextRequest, NextResponse } from "next/server";
import { elevenLabs } from "@/lib/elevenlabs";
import { spawn } from "child_process";
import { writeFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { randomBytes } from "crypto";

/**
 * Replace audio in video with new TTS audio from ElevenLabs
 */
export async function POST(req: NextRequest) {
    try {
        const { videoUrl, newScript, voiceId } = await req.json();

        if (!videoUrl || !newScript) {
            return NextResponse.json(
                { error: "videoUrl and newScript required" },
                { status: 400 }
            );
        }

        console.log("[ReplaceAudio] Step 1: Generating audio with ElevenLabs...");

        // Generate new audio with ElevenLabs
        const voice = voiceId || process.env.ELEVENLABS_VOICE_FEMALE || "EXAVITQu4vr4xnSDxMaL";
        const audioResult = await elevenLabs.textToSpeech(newScript, voice);

        if (!audioResult.success || !audioResult.blob) {
            throw new Error("Failed to generate audio: " + audioResult.error);
        }

        console.log("[ReplaceAudio] Step 2: Downloading video...");

        // Download video
        const videoResponse = await fetch(videoUrl);
        if (!videoResponse.ok) {
            throw new Error("Failed to download video");
        }
        const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());

        // Save to temp files
        const tempVideoPath = join(tmpdir(), `video_${randomBytes(8).toString('hex')}.mp4`);
        const tempAudioPath = join(tmpdir(), `audio_${randomBytes(8).toString('hex')}.mp3`);
        const outputVideoPath = join(tmpdir(), `output_${randomBytes(8).toString('hex')}.mp4`);

        await writeFile(tempVideoPath, videoBuffer);
        await writeFile(tempAudioPath, Buffer.from(await audioResult.blob.arrayBuffer()));

        console.log("[ReplaceAudio] Step 3: Replacing audio with FFmpeg...");

        // Replace audio with FFmpeg
        await new Promise<void>((resolve, reject) => {
            const ffmpeg = spawn("ffmpeg", [
                "-i", tempVideoPath,      // Input video
                "-i", tempAudioPath,      // Input audio
                "-c:v", "copy",           // Copy video codec (no re-encode)
                "-map", "0:v:0",          // Use video from first input
                "-map", "1:a:0",          // Use audio from second input
                "-shortest",              // Match shortest duration
                "-y",                     // Overwrite output
                outputVideoPath
            ]);

            let stderr = "";
            ffmpeg.stderr.on("data", (data) => {
                stderr += data.toString();
            });

            ffmpeg.on("close", (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`FFmpeg failed: ${stderr}`));
                }
            });

            ffmpeg.on("error", reject);
        });

        console.log("[ReplaceAudio] Step 4: Reading output video...");

        // Read output video
        const fs = require("fs");
        const outputBuffer = fs.readFileSync(outputVideoPath);

        // Cleanup temp files
        await Promise.all([
            unlink(tempVideoPath).catch(() => { }),
            unlink(tempAudioPath).catch(() => { }),
            unlink(outputVideoPath).catch(() => { })
        ]);

        // Return as base64 for now (in production, upload to Drive)
        const outputBase64 = outputBuffer.toString('base64');

        console.log("[ReplaceAudio] ✅ Complete");

        return NextResponse.json({
            success: true,
            message: "Audio replaced successfully",
            videoBase64: outputBase64,
            size: outputBuffer.length
        });

    } catch (error: any) {
        console.error("[ReplaceAudio] Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to replace audio" },
            { status: 500 }
        );
    }
}
