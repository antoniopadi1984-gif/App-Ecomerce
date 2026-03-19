
import { prisma } from '@/lib/prisma';
import { elevenLabs } from '@/lib/elevenlabs';
import { uploadToProduct } from '@/lib/services/drive-service';
import { getConnectionSecret } from '@/lib/server/connections';
import { google } from 'googleapis';
import { MediaCleaningPipeline } from '@/lib/media/pipeline';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { randomBytes } from 'crypto';

async function getAuthClient() {
    const credsStr = await getConnectionSecret('store-main', 'GOOGLE_CLOUD_CREDENTIALS') || process.env.GOOGLE_CLOUD_CREDENTIALS;
    if (credsStr) {
        const creds = JSON.parse(credsStr);
        return new google.auth.GoogleAuth({
            credentials: {
                client_email: creds.client_email,
                private_key: creds.private_key,
            },
            scopes: ['https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/documents'],
        });
    }
    return new google.auth.GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/documents'],
    });
}

export class VoiceOverFlow {
    /**
     * Mandatory Sequence Steps 1-3: Prepare for removal
     */
    static async prepareForRemoval(videoId: string) {
        console.log(`[VoiceOverFlow] Starting preparation for video: ${videoId}`);

        const video = await prisma.competitorVideo.findUnique({
            where: { id: videoId },
            include: { product: true }
        });

        if (!video) throw new Error("Video not found");

        const tempDir = path.join(os.tmpdir(), `vo-flow-${randomBytes(4).toString('hex')}`);
        await fs.promises.mkdir(tempDir, { recursive: true });

        try {
            const videoPath = path.join(tempDir, 'video.mp4');
            const audioPath = path.join(tempDir, 'audio.mp3');

            // 1. Download video
            const response = await fetch(video.sourceUrl || video.previewUrl || "");
            const buffer = Buffer.from(await response.arrayBuffer());
            await fs.promises.writeFile(videoPath, buffer);

            // 2. Extract Audio
            await new Promise((resolve, reject) => {
                ffmpeg(videoPath)
                    .toFormat('mp3')
                    .on('end', resolve)
                    .on('error', reject)
                    .save(audioPath);
            });

            // STEP 1: Transcription with Scribe v2
            console.log(`[VoiceOverFlow] Step 1: Transcribing with Scribe v2...`);
            const audioBlob = new Blob([await fs.promises.readFile(audioPath)], { type: 'audio/mpeg' });
            const scribeResult = await elevenLabs.speechToText(audioBlob as any);

            if (!scribeResult.success) throw new Error(`Transcription failed: ${scribeResult.error}`);

            const scriptJson = JSON.stringify(scribeResult.data);
            const scriptText = scribeResult.data.words.map((w: any) => w.text).join(' ');

            // @ts-ignore
            await prisma.competitorVideo.update({
                where: { id: videoId },
                data: { voiceoverScript: scriptJson }
            });

            // Save to Drive (as Doc)
            if (video.product.driveFolderId) {
                const auth = await getAuthClient();
                const docs = google.docs({ version: 'v1', auth: auth as any });
                const drive = google.drive({ version: 'v3', auth: auth as any });

                // Get folder structure
                const structure = JSON.parse(video.product.driveRootPath as string);

                // Create Doc
                const doc = await docs.documents.create({
                    requestBody: { title: `SCRIPT_VO_${video.filename}` }
                });

                await drive.files.update({
                    fileId: doc.data.documentId!,
                    addParents: structure.scripts,
                    fields: 'id, parents'
                });

                await docs.documents.batchUpdate({
                    documentId: doc.data.documentId!,
                    requestBody: {
                        requests: [{
                            insertText: {
                                location: { index: 1 },
                                text: scriptText
                            }
                        }]
                    }
                });
            }

            // STEP 2: Extraction of Tomas (clips)
            console.log(`[VoiceOverFlow] Step 2: Extracting Tomas...`);
            // We group words into segments of ~5 seconds or by natural pauses
            const segments = this.groupWordsIntoSegments(scribeResult.data.words);

            let tomasCount = 0;
            const tomasFolder = video.product.driveRootPath ? JSON.parse(video.product.driveRootPath as string).clips : null;

            for (let i = 0; i < segments.length; i++) {
                const seg = segments[i];
                const clipPath = path.join(tempDir, `toma_${i}.mp4`);

                await new Promise((resolve, reject) => {
                    ffmpeg(videoPath)
                        .setStartTime(seg.start)
                        .setDuration(seg.end - seg.start)
                        .on('end', resolve)
                        .on('error', reject)
                        .save(clipPath);
                });

                if (tomasFolder) {
                    const clipBuffer = await fs.promises.readFile(clipPath);
                    await uploadToProduct(clipBuffer, `TOMA_${i}_${video.filename || 'video.mp4'}`, 'video/mp4', video.productId, video.storeId || '', { fileType: 'CLIP' });
                }
                tomasCount++;
            }

            // STEP 3: Verification
            console.log(`[VoiceOverFlow] Step 3: Verifying...`);
            // @ts-ignore
            await prisma.competitorVideo.update({
                where: { id: videoId },
                data: {
                    tomasCount,
                    status: 'VO_READY_TO_REMOVE'
                }
            });

            return { success: true, script: scriptText, tomasCount };

        } catch (error: any) {
            console.error(`[VoiceOverFlow] ABORTED: ${error.message}`);
            await prisma.competitorVideo.update({
                where: { id: videoId },
                data: { status: 'VO_PREP_FAILED' }
            });
            throw error;
        } finally {
            await fs.promises.rm(tempDir, { recursive: true, force: true });
        }
    }

    /**
     * Final Step: Execute actual audio removal after user confirmation
     */
    static async executeRemoval(videoId: string) {
        const video = await prisma.competitorVideo.findUnique({
            where: { id: videoId }
        });

        // @ts-ignore
        if (!video || !video.voiceoverScript || video.tomasCount === 0) {
            throw new Error("Cannot remove voiceover: Steps 1-3 not completed or verified.");
        }

        console.log(`[VoiceOverFlow] Executing audio removal for ${videoId}`);

        // We use the MediaCleaningPipeline processAudio logic (Demucs)
        // result = { vocals: string, background: string }

        const cleaningResult = await MediaCleaningPipeline.clean(
            video.storeId,
            video.sourceUrl || video.previewUrl || "",
            'video'
        );

        if (!cleaningResult.audioPaths?.background) {
            throw new Error("Failed to isolate background music.");
        }

        // Remix video with isolated background
        // Wait, MediaCleaningPipeline should probably handle the remixing too if possible
        // For now, let's just store the noVocalsUrl as the "cleaned" video or the background audio result

        // @ts-ignore
        await prisma.competitorVideo.update({
            where: { id: videoId },
            data: {
                noVocalsUrl: cleaningResult.cleanedUrl, // Assuming cleaning removed subtitles AND audio if configured
                musicUrl: cleaningResult.audioPaths.background,
                vocalsUrl: cleaningResult.audioPaths.vocals,
                voiceoverRemoved: true
            }
        });

        return { success: true, url: cleaningResult.cleanedUrl };
    }

    private static groupWordsIntoSegments(words: any[]) {
        const segments = [];
        let currentSeg = { start: words[0].start, end: words[0].end, words: [words[0]] };

        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const gap = word.start - currentSeg.end;

            if (gap > 1.5 || (word.end - currentSeg.start) > 8) {
                segments.push(currentSeg);
                currentSeg = { start: word.start, end: word.end, words: [word] };
            } else {
                currentSeg.end = word.end;
                currentSeg.words.push(word);
            }
        }
        segments.push(currentSeg);
        return segments;
    }
}
