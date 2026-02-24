import ffmpeg from 'fluent-ffmpeg';
import { Storage } from '@google-cloud/storage';
import { createWriteStream, unlinkSync } from 'fs';
import { Readable } from 'stream';
import { join } from 'path';
import { tmpdir } from 'os';

/**
 * Caption Generator - Genera subtítulos y los graba en el video
 * Usa Whisper API para transcripción
 */
export class CaptionGenerator {
    private storage: Storage;
    private bucketName: string;

    constructor() {
        this.storage = new Storage({
            projectId: process.env.GOOGLE_CLOUD_PROJECT_ID
        });
        this.bucketName = process.env.GCS_BUCKET_NAME || '';
    }

    /**
     * Transcribir audio con Gemini
     */
    async transcribe(audioUrl: string): Promise<Array<{
        start: number;
        end: number;
        text: string;
    }>> {
        console.log('[CaptionGenerator] Transcribiendo con Gemini...');

        try {
            const { GoogleGenerativeAI } = await import('@google/generative-ai');
            const genAI = new GoogleGenerativeAI(process.env.VERTEX_AI_API_KEY || '');
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-002' });

            // Download audio
            const response = await fetch(audioUrl);
            const audioBuffer = await response.arrayBuffer();
            const base64Audio = Buffer.from(audioBuffer).toString('base64');

            // Transcribe con Gemini
            const result = await model.generateContent([
                {
                    inlineData: {
                        data: base64Audio,
                        mimeType: 'audio/mp3'
                    }
                },
                {
                    text: `Transcribe this audio and return a JSON array with segments. Each segment should have:
- "start": timestamp in seconds (estimate based on speech pace)
- "end": end timestamp in seconds
- "text": the transcribed text

Return ONLY the JSON array, no additional text.

Example format:
[
  {"start": 0, "end": 3, "text": "First sentence here"},
  {"start": 3, "end": 7, "text": "Second sentence here"}
]`
                }
            ]);

            const transcription = result.response.text();

            // Parse JSON response
            const jsonMatch = transcription.match(/\[[\s\S]*\]/);
            if (!jsonMatch) {
                throw new Error('No valid JSON found in transcription');
            }

            const segments = JSON.parse(jsonMatch[0]);

            console.log(`[CaptionGenerator] ✅ Transcrito: ${segments.length} segmentos`);

            return segments;

        } catch (error) {
            console.error('[CaptionGenerator] Gemini transcription error:', error);
            throw error;
        }
    }

    /**
     * Generar archivo SRT desde segments
     */
    generateSRT(segments: Array<{ start: number; end: number; text: string }>): string {
        let srt = '';

        segments.forEach((seg, i) => {
            const startTime = this.formatSRTTime(seg.start);
            const endTime = this.formatSRTTime(seg.end);

            srt += `${i + 1}\n`;
            srt += `${startTime} --> ${endTime}\n`;
            srt += `${seg.text}\n\n`;
        });

        return srt;
    }

    private formatSRTTime(seconds: number): string {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 1000);

        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
    }

    /**
     * Burn-in subtítulos en video
     */
    async addCaptionsToVideo(
        videoUrl: string,
        segments: Array<{ start: number; end: number; text: string }>,
        style: 'bold' | 'clean' | 'animated' = 'bold'
    ): Promise<string> {
        console.log('[CaptionGenerator] Agregando subtítulos al video...');

        return new Promise(async (resolve, reject) => {
            const tempVideo = join(tmpdir(), `video_${Date.now()}.mp4`);
            const tempSRT = join(tmpdir(), `subs_${Date.now()}.srt`);
            const outputVideo = join(tmpdir(), `output_${Date.now()}.mp4`);

            try {
                // Download video
                const videoResponse = await fetch(videoUrl);
                const videoStream = createWriteStream(tempVideo);
                if (videoResponse.body) {
                    // @ts-ignore
                    Readable.fromWeb(videoResponse.body).pipe(videoStream);
                }

                await new Promise<void>((res, rej) => {
                    videoStream.on('finish', () => res());
                    videoStream.on('error', rej);
                });

                // Generate SRT file
                const srtContent = this.generateSRT(segments);
                require('fs').writeFileSync(tempSRT, srtContent);

                // FFmpeg subtitle style
                const subtitleStyle = this.getSubtitleStyle(style);

                // Add subtitles with FFmpeg
                ffmpeg(tempVideo)
                    .outputOptions([
                        `-vf subtitles=${tempSRT}:force_style='${subtitleStyle}'`
                    ])
                    .output(outputVideo)
                    .on('end', async () => {
                        console.log('[CaptionGenerator] ✅ Subtítulos agregados');

                        // Upload to GCS
                        const bucket = this.storage.bucket(this.bucketName);
                        const filename = `videos/captioned_${Date.now()}.mp4`;

                        await bucket.upload(outputVideo, {
                            destination: filename,
                            metadata: { contentType: 'video/mp4' }
                        });

                        await bucket.file(filename).makePublic();
                        const publicUrl = `https://storage.googleapis.com/${this.bucketName}/${filename}`;

                        // Cleanup
                        unlinkSync(tempVideo);
                        unlinkSync(tempSRT);
                        unlinkSync(outputVideo);

                        resolve(publicUrl);
                    })
                    .on('error', (err) => {
                        console.error('[CaptionGenerator] FFmpeg error:', err);
                        unlinkSync(tempVideo);
                        unlinkSync(tempSRT);
                        reject(err);
                    })
                    .run();

            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Estilos de subtítulos para FFmpeg
     */
    private getSubtitleStyle(style: 'bold' | 'clean' | 'animated'): string {
        const styles = {
            bold: "FontName=Arial Black,FontSize=24,PrimaryColour=&H00FFFF00,OutlineColour=&H00000000,BorderStyle=3,Outline=2,Shadow=0,Bold=1",
            clean: "FontName=Arial,FontSize=20,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=1,Outline=1,Shadow=1",
            animated: "FontName=Impact,FontSize=26,PrimaryColour=&H00FFFF00,OutlineColour=&H00000000,BorderStyle=3,Outline=3,Shadow=2,Bold=1"
        };

        return styles[style] || styles.bold;
    }

    /**
     * Proceso completo: transcribir + agregar subtítulos
     */
    async generateAndAddCaptions(
        videoUrl: string,
        audioUrl: string,
        style: 'bold' | 'clean' | 'animated' = 'bold'
    ): Promise<{
        captionedVideoUrl: string;
        segments: Array<{ start: number; end: number; text: string }>;
    }> {
        console.log('[CaptionGenerator] 🎬 Proceso completo de subtítulos...');

        // 1. Transcribir
        const segments = await this.transcribe(audioUrl);
        console.log(`[CaptionGenerator] ✅ Transcrito: ${segments.length} segmentos`);

        // 2. Agregar al video
        const captionedVideoUrl = await this.addCaptionsToVideo(videoUrl, segments, style);
        console.log(`[CaptionGenerator] ✅ Video con subtítulos: ${captionedVideoUrl}`);

        return {
            captionedVideoUrl,
            segments
        };
    }

    /**
     * Batch: agregar subtítulos a múltiples videos
     */
    async batchAddCaptions(
        videos: Array<{ videoUrl: string; audioUrl: string }>,
        style: 'bold' | 'clean' | 'animated' = 'bold'
    ): Promise<Array<{
        originalVideoUrl: string;
        captionedVideoUrl: string;
        segments: Array<{ start: number; end: number; text: string }>;
    }>> {
        console.log(`[CaptionGenerator] 🚀 Batch: ${videos.length} videos`);

        const results = await Promise.all(
            videos.map(async (video) => {
                const result = await this.generateAndAddCaptions(
                    video.videoUrl,
                    video.audioUrl,
                    style
                );

                return {
                    originalVideoUrl: video.videoUrl,
                    ...result
                };
            })
        );

        console.log(`[CaptionGenerator] ✅ Batch completo: ${results.length} videos`);

        return results;
    }
}
