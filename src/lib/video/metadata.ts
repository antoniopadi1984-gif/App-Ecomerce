import { spawn } from 'child_process';
import { writeFile, unlink, mkdir, readFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomBytes } from 'crypto';

/**
 * VIDEO METADATA REMOVAL & PROCESSING
 
 * Uses ffmpeg to clean metadata and prepare videos for analysis
 */
interface VideoProcessingResult {
    success: boolean;
    cleanFilePath?: string;
    originalSize?: number;
    cleanSize?: number;
    duration?: number;
    resolution?: { width: number; height: number };
    error?: string;
}

/**
 * Removes ALL metadata from video file using ffmpeg
 
 * -map_metadata -1: removes all metadata
 
 * -fflags +bitexact: ensures reproducible output
 
 * -codec copy: no re-encoding (fast)
 */
export async function removeVideoMetadata(
    inputBuffer: Buffer,
    originalFileName: string
): Promise<VideoProcessingResult> {
    const tempDir = join(tmpdir(), 'ecombom-video');
    await mkdir(tempDir, { recursive: true });
    const inputId = randomBytes(8).toString('hex');
    const ext = originalFileName.split('.').pop() || 'mp4';
    const inputPath = join(tempDir, `input_${inputId}.${ext}`);
    const outputPath = join(tempDir, `clean_${inputId}.${ext}`);

    try {

        // Write input buffer to temp file
        await writeFile(inputPath, inputBuffer);


        // Execute ffmpeg to remove metadata
        await new Promise<void>((resolve, reject) => {
            const ffmpeg = spawn('ffmpeg', [
                '-i', inputPath,
                '-map_metadata', '-1',
                // Remove all metadata
                '-fflags', '+bitexact',
                // Reproducible output
                '-codec', 'copy',
                // No re-encoding
                '-f', ext === 'mp4' ? 'mp4' : 'mov',
                outputPath
            ]);

            let stderr = '';
            ffmpeg.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            ffmpeg.on('close', (code) => {
                if (code === 0) {
                    resolve();
                }
                else {
                    reject(new Error(`ffmpeg failed with code ${code}: ${stderr}`));
                }
            });

            ffmpeg.on('error', reject);
        });


        // Get video info
        const videoInfo = await getVideoInfo(outputPath);


        // Read clean file
        const { readFile } = await import('fs/promises');
        const cleanBuffer = await readFile(outputPath);


        // Cleanup temp files
        await unlink(inputPath);
        await unlink(outputPath);

        return {
            success: true,
            cleanFilePath: outputPath,
            originalSize: inputBuffer.length,
            cleanSize: cleanBuffer.length,
            duration: videoInfo.duration,
            resolution: videoInfo.resolution
        };
    }
    catch (error: any) {
        console.error('[removeVideoMetadata] Error:', error);

        // Cleanup on error
        try {
            await unlink(inputPath);
            await unlink(outputPath);
        }
        catch { }
        return { success: false, error: error.message };
    }
}

/**
 * Get video information using ffprobe
 */
async function getVideoInfo(filePath: string): Promise<{
    duration: number;
    resolution: { width: number; height: number };
    fps: number;
}> {
    return new Promise((resolve, reject) => {
        const ffprobe = spawn('ffprobe', [
            '-v', 'error',
            '-show_entries', 'stream=width,height,r_frame_rate,duration',
            '-show_entries', 'format=duration',
            '-of', 'json',
            filePath
        ]);

        let stdout = '';
        ffprobe.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        ffprobe.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`ffprobe failed with code ${code}`));
                return;
            }

            try {
                const data = JSON.parse(stdout);
                const videoStream = data.streams?.find((s: any) => s.width && s.height);
                const duration = parseFloat(data.format?.duration || videoStream?.duration || '0');
                let fps = 30;
                // default
                if (videoStream?.r_frame_rate) {
                    const [num, den] = videoStream.r_frame_rate.split('/').map(Number);
                    fps = num / den;
                }
                resolve({
                    duration,
                    resolution: { width: videoStream?.width || 0, height: videoStream?.height || 0 },
                    fps
                });
            }
            catch (error) {
                reject(error);
            }
        });

        ffprobe.on('error', reject);
    });
}

/**
 * Converts video to WebM for optimized web delivery
 
 * Uses libvpx-vp9 for high quality/compression ratio
 */
export async function convertToWebM(
    inputBuffer: Buffer,
    originalFileName: string
): Promise<Buffer> {
    const tempDir = join(tmpdir(), 'ecombom-webm');
    await mkdir(tempDir, { recursive: true });
    const inputId = randomBytes(8).toString('hex');
    const inputPath = join(tempDir, `input_${inputId}.mp4`);
    const outputPath = join(tempDir, `output_${inputId}.webm`);

    try {
        await writeFile(inputPath, inputBuffer);
        await new Promise<void>((resolve, reject) => {
            const ffmpeg = spawn('ffmpeg', [
                '-i', inputPath,
                '-c:v', 'libvpx-vp9',
                '-crf', '30',
                // Constant Rate Factor (Good balance)
                '-b:v', '0',
                // Force CRF to control quality
                '-c:a', 'libopus',
                '-b:a', '128k',
                '-deadline', 'realtime',
                // Fastest encoding
                outputPath
            ]);

            ffmpeg.on('close', (code) => {
                if (code === 0) resolve();
                else reject(new Error(`WebM conversion failed: ${code}`));
            });
            ffmpeg.on('error', reject);
        });

        const cleanBuffer = await readFile(outputPath);
        await unlink(inputPath);
        await unlink(outputPath);
        return cleanBuffer;
    }
    catch (error) {
        console.error('[convertToWebM] Error:', error);
        throw error;
    }
}

/**
 * Converts image to WebP for optimized web delivery
 
 * Uses libwebp with optimized flags
 */
export async function convertToWebP(
    inputBuffer: Buffer
): Promise<Buffer> {
    const tempDir = join(tmpdir(), 'ecombom-webp');
    await mkdir(tempDir, { recursive: true });
    const inputId = randomBytes(8).toString('hex');
    const inputPath = join(tempDir, `input_${inputId}`);
    const outputPath = join(tempDir, `output_${inputId}.webp`);

    try {
        await writeFile(inputPath, inputBuffer);
        await new Promise<void>((resolve, reject) => {
            const ffmpeg = spawn('ffmpeg', [
                '-i', inputPath,
                '-quality', '75',
                '-compression_level', '6',
                // Max effort for compression
                outputPath
            ]);

            ffmpeg.on('close', (code) => {
                if (code === 0) resolve();
                else reject(new Error(`WebP conversion failed: ${code}`));
            });
            ffmpeg.on('error', reject);
        });

        const cleanBuffer = await readFile(outputPath);
        await unlink(inputPath);
        await unlink(outputPath);
        return cleanBuffer;
    }
    catch (error) {
        console.error('[convertToWebP] Error:', error);
        throw error;
    }
}

/**
 * Extract clips from video based on time ranges
 */
export async function extractVideoClip(
    inputBuffer: Buffer,
    startTime: number,
    endTime: number,
    outputFormat: '9:16' | '16:9' | '1:1' = '9:16'
): Promise<Buffer> {
    const tempDir = join(tmpdir(), 'ecombom-clips');
    await mkdir(tempDir, { recursive: true });
    const inputId = randomBytes(8).toString('hex');
    const inputPath = join(tempDir, `input_${inputId}.mp4`);
    const outputPath = join(tempDir, `clip_${inputId}.mp4`);

    try {
        await writeFile(inputPath, inputBuffer);
        const duration = endTime - startTime;


        // Crop filters for different aspect ratios
        const cropFilters: Record<string, string> = {
            '9:16': 'crop=ih*9/16:ih',
            // Vertical
            '16:9': 'crop=iw:iw*9/16',
            // Horizontal
            '1:1': 'crop=min(iw\\,ih):min(iw\\,ih)'
            // Square
        };

        await new Promise<void>((resolve, reject) => {
            const ffmpeg = spawn('ffmpeg', [
                '-ss', startTime.toString(),
                '-i', inputPath,
                '-t', duration.toString(),
                '-vf', cropFilters[outputFormat],
                '-codec:v', 'libx264',
                '-preset', 'fast',
                '-crf', '23',
                '-codec:a', 'aac',
                '-b:a', '128k',
                outputPath
            ]);

            let stderr = '';
            ffmpeg.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            ffmpeg.on('close', (code) => {
                if (code === 0) {
                    resolve();
                }
                else {
                    reject(new Error(`ffmpeg clip extraction failed: ${stderr}`));
                }
            });

            ffmpeg.on('error', reject);
        });

        const { readFile } = await import('fs/promises');
        const clipBuffer = await readFile(outputPath);
        await unlink(inputPath);
        await unlink(outputPath);
        return clipBuffer;
    }
    catch (error) {
        console.error('[extractVideoClip] Error:', error);
        throw error;
    }
}

/**
 * Auto-detect best clips using scene detection
 */
export async function detectVideoScenes(
    inputBuffer: Buffer,
    minClipDuration: number = 3,
    maxClips: number = 10
): Promise<Array<{ start: number; end: number; score: number }>> {
    const tempDir = join(tmpdir(), 'ecombom-scenes');
    await mkdir(tempDir, { recursive: true });
    const inputId = randomBytes(8).toString('hex');
    const inputPath = join(tempDir, `input_${inputId}.mp4`);

    try {
        await writeFile(inputPath, inputBuffer);


        // Use ffmpeg scene detection
        const scenes = await new Promise<Array<{ start: number; end: number }>>((resolve, reject) => {
            const ffmpeg = spawn('ffmpeg', [
                '-i', inputPath,
                '-vf', 'select=gt(scene\\,0.3),metadata=print:file=-',
                '-f', 'null', '-'
            ]);

            let stderr = '';
            const timestamps: number[] = [];
            ffmpeg.stderr.on('data', (data) => {
                const output = data.toString();
                stderr += output;

                // Parse scene change timestamps from metadata
                const matches = output.matchAll(/pts_time:([\d.]+)/g);
                for (const match of matches) {
                    timestamps.push(parseFloat(match[1]));
                }
            });

            ffmpeg.on('close', (code) => {

                // Build clips from timestamps
                const clips: Array<{ start: number; end: number }> = [];
                for (let i = 0; i < timestamps.length - 1; i++) {
                    const start = timestamps[i];
                    const end = timestamps[i + 1];
                    const duration = end - start;
                    if (duration >= minClipDuration) {
                        clips.push({ start, end });
                    }
                }
                resolve(clips.slice(0, maxClips));
            });

            ffmpeg.on('error', reject);
        });

        await unlink(inputPath);


        // Add score (simple heuristic: prefer clips of 5-15 seconds)
        return scenes.map(scene => ({
            ...scene,
            score: Math.max(0, 1 - Math.abs((scene.end - scene.start) - 10) / 10)
        })).sort((a, b) => b.score - a.score);
    }
    catch (error) {
        console.error('[detectVideoScenes] Error:', error);
        throw error;
    }
}

/**
 * Extract audio and transcribe using Gemini
 */
export async function extractVideoScript(
    inputBuffer: Buffer
): Promise<{ transcript: string; timestamps: Array<{ time: number; text: string }> }> {
    const tempDir = join(tmpdir(), 'ecombom-audio');
    await mkdir(tempDir, { recursive: true });
    const inputId = randomBytes(8).toString('hex');
    const inputPath = join(tempDir, `input_${inputId}.mp4`);
    const audioPath = join(tempDir, `audio_${inputId}.mp3`);

    try {
        await writeFile(inputPath, inputBuffer);


        // Extract audio
        await new Promise<void>((resolve, reject) => {
            const ffmpeg = spawn('ffmpeg', [
                '-i', inputPath,
                '-vn',
                // No video
                '-codec:a', 'libmp3lame',
                '-ar', '16000',
                // 16kHz sample rate (optimal for speech)
                '-ac', '1',
                // Mono
                '-b:a', '64k',
                audioPath
            ]);

            ffmpeg.on('close', (code) => {
                if (code === 0) resolve();
                else reject(new Error(`Audio extraction failed with code ${code}`));
            });
            ffmpeg.on('error', reject);
        });


        // Read audio file and convert to base64
        const audioBuffer = await readFile(audioPath);
        const base64Audio = audioBuffer.toString('base64');


        // Use Gemini to transcribe audio
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite-preview' });

        const result = await model.generateContent([
            { inlineData: { mimeType: 'audio/mp3', data: base64Audio } },
            { text: `Transcribe the exact spoken words from this audio. Return ONLY the spoken script, no timestamps or labels. If no speech, return "NO_SPEECH_DETECTED"` }
        ]);

        const transcription = result.response.text().trim();

        await unlink(inputPath);
        await unlink(audioPath);

        if (transcription === 'NO_SPEECH_DETECTED' || transcription.length < 10) {
            return { transcript: '', timestamps: [] };
        }

        return {
            transcript: transcription,
            timestamps: []
            // Simple version without timestamps
        };
    }
    catch (error) {
        console.error('[extractVideoScript] Error:', error);
        throw error;
    }
}

/**
 * Check if ffmpeg is available
 */
export async function checkFFmpegAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
        const ffmpeg = spawn('ffmpeg', ['-version']);
        ffmpeg.on('close', (code) => {
            resolve(code === 0);
        });
        ffmpeg.on('error', () => {
            resolve(false);
        });
    });
}
