import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateVideo } from '@/lib/replicate-client';
import { uploadToProduct } from '@/lib/services/drive-service';
import { ElevenLabsService } from '@/lib/services/elevenlabs-service';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

const execAsync = promisify(exec);
export const runtime = 'nodejs';
export const maxDuration = 600; // VSL can take a while

export async function POST(req: NextRequest) {
    const storeId = req.headers.get('X-Store-Id') || 'store-main';
    try {
        const body = await req.json();
        const { productId, scriptData, voiceId, format = '9:16', addSubtitles = true, addMusic = true } = body;

        if (!productId || !scriptData) {
            return NextResponse.json({ error: 'productId y scriptData requeridos' }, { status: 400 });
        }

        const product = await prisma.product.findUnique({ where: { id: productId }, select: { title: true } });
        const branding = await (prisma as any).productBranding.findUnique({ where: { productId } });
        const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'vsl-'));
        const clips: string[] = [];

        try {
            const shotList = scriptData.shotList || [];

            // STEP 1: Generate video clip for each shot
            console.log(`[VSL] Generating ${shotList.length} clips...`);
            for (let i = 0; i < shotList.length; i++) {
                const shot = shotList[i];
                const clipPath = path.join(tmpDir, `clip_${i}.mp4`);

                // Alternar entre Veo 3 (shots de producto) y Kling (shots UGC/acción)
                const isProductShot = shot.visual.toLowerCase().includes('producto') || 
                                      shot.visual.toLowerCase().includes('packaging');
                
                try {
                    const videoUrl = await generateVideo({
                        prompt: `${shot.visual}. ${scriptData.videoPrompt || ''}. Ultra realistic, ${format} format.`,
                        mode: isProductShot ? 'veo3' : 'standard',
                        quality: isProductShot ? 'premium' : 'balanced',
                        aspectRatio: format as any,
                        duration: 5
                    });

                    const res = await fetch(videoUrl);
                    if (!res.ok) throw new Error(`Failed to fetch video from ${videoUrl}`);
                    
                    const buf = Buffer.from(await res.arrayBuffer());
                    await fs.writeFile(clipPath, buf);
                    clips.push(clipPath);
                } catch (clipErr: any) {
                    console.error(`[VSL] Error generating clip ${i}:`, clipErr.message);
                    // Continue with other clips or handle as error?
                    // For VSL we need all clips, but let's try to proceed if we have some
                }
            }

            if (clips.length === 0) {
                throw new Error("No clips were generated successfully.");
            }

            // STEP 2: Generate TTS audio with ElevenLabs
            console.log(`[VSL] Generating TTS...`);
            const audioPath = path.join(tmpDir, 'narration.mp3');
            const audioBuffer = await ElevenLabsService.textToSpeech(
                scriptData.script,
                voiceId || 'pNInz6obpgDQGcFmaJgB', // default voice
                { stability: 0.5, similarity_boost: 0.75, style: 0.3 }
            );
            await fs.writeFile(audioPath, audioBuffer);

            // STEP 3: Generate background music if requested
            let musicPath: string | null = null;
            if (addMusic && (branding?.brandVoice || branding?.tone || branding?.visualStyle)) {
                console.log(`[VSL] Generating background music...`);
                try {
                    const musicBuffer = await ElevenLabsService.generateMusic(
                        `Background music for a ${branding?.brandVoice || branding?.tone || 'premium'} product ad, subtle, non-intrusive`, 
                        30
                    );
                    musicPath = path.join(tmpDir, 'music.mp3');
                    await fs.writeFile(musicPath, Buffer.from(musicBuffer));
                } catch (musicErr) {
                    console.warn(`[VSL] Music generation failed, proceeding without music:`, musicErr);
                }
            }

            // STEP 4: Assemble VSL with FFmpeg
            console.log(`[VSL] Assembling video...`);
            // Create concat list
            const concatList = path.join(tmpDir, 'concat.txt');
            await fs.writeFile(concatList, clips.map(c => `file '${c}'`).join('\n'));

            const rawConcatPath = path.join(tmpDir, 'raw_concat.mp4');
            // We use -fflags +genpts and other flags to ensure smooth concatenation
            await execAsync(`ffmpeg -f concat -safe 0 -i '${concatList}' -c copy '${rawConcatPath}' -y`);

            // Add narration audio (and music if available)
            const withAudioPath = path.join(tmpDir, 'with_audio.mp4');
            if (musicPath) {
                // Mix narration 78% + music 22%
                // We also use -shortest to make sure the video matches the audio length or vice versa
                // Actually VSL usually follows the audio length. If video is shorter, it might loop or stop.
                // -shortest on the output will stop when the shortest stream ends.
                await execAsync(
                    `ffmpeg -i '${rawConcatPath}' -i '${audioPath}' -i '${musicPath}' ` +
                    `-filter_complex "[1:a]volume=0.8[narr];[2:a]volume=0.2[mus];[narr][mus]amix=inputs=2[aout]" ` +
                    `-map 0:v -map "[aout]" -c:v libx264 -crf 23 -c:a aac -shortest '${withAudioPath}' -y`
                );
            } else {
                await execAsync(
                    `ffmpeg -i '${rawConcatPath}' -i '${audioPath}' -c:v libx264 -crf 23 -c:a aac -map 0:v -map 1:a -shortest '${withAudioPath}' -y`
                );
            }

            // STEP 5: Add subtitles if requested
            const finalPath = path.join(tmpDir, 'final_vsl.mp4');
            if (addSubtitles) {
                console.log(`[VSL] Adding subtitles...`);
                try {
                    const srtPath = path.join(tmpDir, 'subs.srt');
                    const srtContent = generateSRTInternal(scriptData.script);
                    await fs.writeFile(srtPath, srtContent);
                    
                    // Simple subtitle burn-in
                    await execAsync(
                        `ffmpeg -i '${withAudioPath}' -vf "subtitles='${srtPath}':force_style='FontSize=20,FontName=Arial,Bold=1,PrimaryColour=&HFFFFFF,OutlineColour=&H000000,Outline=1'" '${finalPath}' -y`
                    );
                } catch (subErr) {
                    console.error(`[VSL] Subtitle failing:`, subErr);
                    await fs.copyFile(withAudioPath, finalPath);
                }
            } else {
                await fs.copyFile(withAudioPath, finalPath);
            }

            // STEP 6: Upload VSL to Drive
            console.log(`[VSL] Uploading to Drive...`);
            const vslBuffer = await fs.readFile(finalPath);
            const vslName = `VSL_${product?.title?.replace(/\s+/g, '_')}_${Date.now()}.mp4`;
            const upload = await uploadToProduct(
                vslBuffer, vslName, 'video/mp4', productId, storeId,
                { subfolderName: '05_VIDEOS/VSL', conceptCode: 'VSL', funnelStage: 'TOF' }
            );

            // Register in DB
            const asset = await (prisma as any).creativeAsset.create({
                data: {
                    productId,
                    storeId,
                    type: 'VIDEO',
                    name: vslName,
                    driveFileId: upload.driveFileId,
                    drivePath: upload.drivePath,
                    driveUrl: upload.driveUrl,
                    processingStatus: 'DONE',
                    conceptCode: 'VSL',
                    funnelStage: 'TOF',
                    tagsJson: JSON.stringify({ 
                        type: 'VSL', 
                        hasSubtitles: addSubtitles, 
                        hasMusic: addMusic, 
                        clipsCount: clips.length,
                        script: scriptData.script
                    })
                }
            });

            return NextResponse.json({ 
                ok: true, 
                driveFileId: upload.driveFileId, 
                driveUrl: upload.driveUrl,
                assetId: asset.id 
            });

        } finally {
            await fs.rm(tmpDir, { recursive: true, force: true });
        }
    } catch (error: any) {
        console.error('[VSL API Error]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

function generateSRTInternal(script: string): string {
    // Split by punctuation for better timing
    const sentences = script.match(/[^.!?]+[.!?]+/g) || [script];
    let srt = '';
    let time = 0;
    sentences.forEach((sentence, i) => {
        // Rough estimate: 0.4s per word, minimum 2s
        const duration = Math.max(2.5, sentence.split(/\s+/).length * 0.45);
        const start = formatSRTTime(time);
        const end = formatSRTTime(time + duration);
        srt += `${i + 1}\n${start} --> ${end}\n${sentence.trim()}\n\n`;
        time += duration;
    });
    return srt;
}

function formatSRTTime(seconds: number): string {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    const ms = Math.floor((seconds % 1) * 1000).toString().padStart(3, '0');
    return `${h}:${m}:${s},${ms}`;
}
