import { prisma } from '@/lib/prisma';
import { elevenLabs } from '@/lib/elevenlabs';
import { agentDispatcher } from '@/lib/agents/agent-dispatcher';
import { DEFAULT_AGENT_PROMPTS } from '@/lib/ai/defaults/agent-prompts';
import { uploadToProduct } from '@/lib/services/drive-service';
import { writeFile, unlink, mkdir, readFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomBytes } from 'crypto';
import { spawn } from 'child_process';

/**
 * BACKGROUND JOB: Analyzes a competitor video using the IA Pro stack.
 * 1. ElevenLabs Scribe v2 (transcription)
 * 2. Gemini 3.1 Pro (visual + psychological analysis)
 * 3. Gemini 3.1 Flash Lite (auto-tagging)
 */
export async function processCompetitorVideo(
    videoId: string,
    url: string,
    productId: string,
    storeId: string,
    driveFolderId?: string
) {
    console.log(`[Job] 🎬 Starting analysis for video ${videoId} (Product: ${productId})`);

    const tempDir = join(tmpdir(), 'ecombom-comp-analysis');
    await mkdir(tempDir, { recursive: true });
    const runId = randomBytes(8).toString('hex');
    const videoPath = join(tempDir, `video_${runId}.mp4`);
    const audioPath = join(tempDir, `audio_${runId}.mp3`);

    try {
        // 1. Download Video
        console.log(`[Job] Downloading video from ${url}...`);
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to download video: ${response.statusText}`);
        const buffer = Buffer.from(await response.arrayBuffer());
        await writeFile(videoPath, buffer);

        // 2. Upload to Drive
        console.log(`[Job] Uploading to Google Drive...`);
        let driveUrl = "";
        try {
            const uploadRes = await uploadToProduct(buffer, `COMP_${videoId}.mp4`, 'video/mp4', productId, storeId, { fileType: 'COMP_VIDEO' });
            driveUrl = uploadRes.driveUrl;
        } catch (driveErr) {
            console.error("[Job] Drive upload failed:", driveErr);
        }

        // 3. Extract Audio (for ElevenLabs)
        console.log(`[Job] Extracting audio...`);
        await extractAudio(videoPath, audioPath);
        const audioBuffer = await readFile(audioPath);

        // 4. Transcription (ElevenLabs Scribe v2)
        console.log(`[Job] Transcribing with ElevenLabs Scribe v2...`);
        // Convert buffer to Blob for ElevenLabs client
        const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
        const transcriptionResult = await elevenLabs.speechToText(audioBlob as any);

        if (!transcriptionResult.success) {
            console.error(`[Job] ElevenLabs STT failed: ${transcriptionResult.error}`);
        }
        const transcript = transcriptionResult.data?.text || "";
        console.log(`[Job] Transcription complete. Length: ${transcript.length}`);

        // 5. Visual + Psychological Analysis (Gemini 3.1 Pro Preview)
        console.log(`[Job] Running Gemini 3.1 Pro analysis...`);

        // Fetch product context
        const product = await prisma.product.findUnique({
            where: { id: productId },
            include: {
                avatarResearches: { orderBy: { createdAt: 'desc' }, take: 1 }
            }
        });

        const avatarContext = product?.avatarResearches?.[0]
            ? `Avatar Pains: ${product.avatarResearches[0].fears}, Desires: ${product.avatarResearches[0].desires}`
            : "No specific avatar research found for this product.";

        const analysisPrompt = `
        CORE METHODOLOGY:
        ${DEFAULT_AGENT_PROMPTS.VIDEO_INTELLIGENCE}

        TASK:
        Analyze this competitor video for the product "${product?.title}".
        
        TRANSCRIPTION:
        "${transcript}"

        PRODUCT CONTEXT:
        ${avatarContext}

        INSTRUCTIONS:
        1. Perform a deep visual and psychological analysis.
        2. Identify why this video is (or isn't) working based on the IA Pro framework.
        3. Determine the Hook type, the Framework used, and the Funnel Phase.
        4. Return a JSON object with:
           {
             "hookDetected": "A 1-clause summary of the hook",
             "hookType": "C1 (Problema) | C3 (Mecanismo) | etc",
             "framework": "UGC | VSL | Side-by-side | etc",
             "fase": "COLD | WARM | HOT",
             "analysis": "A detailed paragraph explaining why this video works",
             "psychologicalTriggers": ["trigger1", "trigger2"],
             "visualCues": ["cue1", "cue2"]
           }
        `;

        // We send the video file as base64 for multimodal analysis
        const videoBase64 = buffer.toString('base64');

        const analysisResponse = await agentDispatcher.dispatch({
            model: 'gemini-3.1-pro-preview',
            prompt: analysisPrompt,
            video: videoBase64,
            videoMimeType: 'video/mp4',
            jsonSchema: true
        });

        let analysisData: any = {};
        try {
            analysisData = JSON.parse(analysisResponse.text);
        } catch (e) {
            console.error("[Job] Failed to parse Gemini Pro response:", e);
            analysisData = { analysis: analysisResponse.text };
        }

        // 6. Auto-tagging (Gemini 3.1 Flash Lite Preview)
        console.log(`[Job] Running Gemini 3.1 Flash Lite tagging...`);
        const taggingPrompt = `
        Based on this analysis and transcript, provide a list of 5-8 short lowercase tags for categorizing this creative in a library.
        Analysis: ${analysisData.analysis}
        Tags only, comma separated.
        `;

        const taggingResponse = await agentDispatcher.dispatch({
            model: 'gemini-3.1-flash-lite-preview',
            prompt: taggingPrompt,
            jsonSchema: false
        });

        const tags = taggingResponse.text.split(',').map(t => t.trim().toLowerCase());

        // 7. Update Database
        console.log(`[Job] Updating database for video ${videoId}...`);
        await (prisma as any).competitorVideo.update({
            where: { id: videoId },
            data: {
                status: 'LISTO',
                previewUrl: driveUrl,
                hookDetected: analysisData.hookDetected,
                hookType: analysisData.hookType,
                framework: analysisData.framework,
                fase: analysisData.fase,
                idioma: product?.marketLanguage || 'ES',
                analysisJson: JSON.stringify({
                    transcript,
                    analysis: analysisData.analysis,
                    psychologicalTriggers: analysisData.psychologicalTriggers,
                    visualCues: analysisData.visualCues,
                    tags,
                    fullRawResponse: analysisData
                })
            }
        });

        console.log(`[Job] ✅ Analysis complete for video ${videoId}`);

    } catch (error: any) {
        console.error(`[Job] ❌ Error analyzing video ${videoId}:`, error);
        await (prisma as any).competitorVideo.update({
            where: { id: videoId },
            data: { status: 'ERROR' }
        }).catch(() => { });
    } finally {
        // Cleanup temp files
        await unlink(videoPath).catch(() => { });
        await unlink(audioPath).catch(() => { });
    }
}

async function extractAudio(inputPath: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const ffmpeg = spawn('ffmpeg', [
            '-i', inputPath,
            '-vn',
            '-codec:a', 'libmp3lame',
            '-ar', '16000',
            '-ac', '1',
            '-b:a', '64k',
            outputPath
        ]);

        ffmpeg.on('close', (code) => {
            if (code === 0) resolve();
            else reject(new Error(`FFmpeg failed with code ${code}`));
        });

        ffmpeg.on('error', reject);
    });
}
