import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateImage, generateVideo, replicateRequest, pollPrediction } from '@/lib/replicate-client';
import { ElevenLabsService } from '@/lib/services/elevenlabs-service';
import { uploadToProduct } from '@/lib/services/drive-service';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

const execAsync = promisify(exec);
export const runtime = 'nodejs';
export const maxDuration = 300;

// Banco de avatares UGC — personas que no existen, con producto en mano
const UGC_AVATAR_PROMPTS = [
    // Mujeres 35-50 — skincare
    "candid photo of a real woman in her 40s, natural makeup, casual home setting, holding skincare product, slightly imperfect, authentic UGC style, not a model, genuine expression, soft natural lighting, iPhone camera quality, vertical portrait",
    // Hombres 30-45 — general
    "candid photo of a real man in his 35s, casual clothes, home or gym setting, holding product, authentic UGC style, not a model, natural lighting, genuine smile, smartphone selfie quality",
    // Mujeres 50-65 — antiaging
    "candid photo of a real woman in her 55s, natural look, no heavy makeup, sitting at home, holding product near face, authentic testimonial style, genuine expression, warm lighting, realistic",
    // Joven mujer 25-35
    "candid photo of a young woman in her late 20s, casual outfit, modern apartment, holding product, authentic social media style, not a professional model, natural beauty, warm tones",
];

export async function POST(req: NextRequest) {
    const storeId = req.headers.get('X-Store-Id') || 'store-main';
    try {
        const body = await req.json();
        const { productId, script, voiceId, avatarStyle = 'woman_40s', format = '9:16', addSubtitles = true } = body;

        if (!productId || !script) {
            return NextResponse.json({ error: 'productId y script requeridos' }, { status: 400 });
        }

        const product = await prisma.product.findUnique({ where: { id: productId }, select: { title: true, imageUrl: true } });
        const branding = await (prisma as any).productBranding.findUnique({ where: { productId } });
        const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ugc-'));

        try {
            // STEP 1: Generate realistic UGC avatar image
            console.log(`[UGC] Generating avatar image for style: ${avatarStyle}...`);
            const avatarPromptBase = UGC_AVATAR_PROMPTS[
                avatarStyle === 'woman_40s' ? 0 :
                avatarStyle === 'man_35s' ? 1 :
                avatarStyle === 'woman_55s' ? 2 : 3
            ];
            const productDesc = branding?.packagingDesc || product?.title || 'beauty product';
            const avatarPrompt = avatarPromptBase.replace('skincare product', productDesc).replace('product', productDesc);

            // Use Imagen 3 (Nano Banana) for avatar - best realism for humans
            const avatarImageUrl = await generateImage({
                prompt: avatarPrompt,
                mode: 'imagen3',
                aspectRatio: '9:16'
            });

            // STEP 2: Generate TTS audio with natural voice
            console.log(`[UGC] Generating TTS audio...`);
            const audioBuffer = await ElevenLabsService.textToSpeech(
                script,
                voiceId || 'EXAVITQu4vr4xnSDxMaL', // default natural female voice
                { stability: 0.4, similarity_boost: 0.7, style: 0.5, use_speaker_boost: true }
            );
            const audioPath = path.join(tmpDir, 'voice.mp3');
            await fs.writeFile(audioPath, audioBuffer);

            // STEP 3: Generate base UGC video with Omni Human
            console.log(`[UGC] Generating base video with Omni mode...`);
            const ugcVideoUrl = await generateVideo({
                prompt: `${avatarPrompt}. Talking directly to camera, natural hand gestures, holding ${productDesc}. Authentic UGC testimonial style. Not perfectly polished.`,
                mode: 'omni',
                aspectRatio: format as any,
                duration: 8
            });

            // STEP 4: Merge audio with generated video
            console.log(`[UGC] Merging audio and video...`);
            const videoPath = path.join(tmpDir, 'ugc_raw.mp4');
            const videoRes = await fetch(ugcVideoUrl);
            if (!videoRes.ok) throw new Error("Failed to download generated video");
            const videoBuf = Buffer.from(await videoRes.arrayBuffer());
            await fs.writeFile(videoPath, videoBuf);

            const intermediatePath = path.join(tmpDir, 'ugc_audio_merged.mp4');
            await execAsync(
                `ffmpeg -i '${videoPath}' -i '${audioPath}' -c:v copy -c:a aac -map 0:v -map 1:a -shortest '${intermediatePath}' -y`
            );

            // STEP 5: Perfect Lipsync with lipsync-2-pro
            console.log(`[UGC] Performing high-quality lipsync...`);
            const lipsyncPred = await replicateRequest('/models/sync/lipsync-2-pro/predictions', {
                input: {
                    video: `data:video/mp4;base64,${(await fs.readFile(intermediatePath)).toString('base64')}`,
                    audio: `data:audio/mp3;base64,${(await fs.readFile(audioPath)).toString('base64')}`,
                    fps: 25, 
                    resize_factor: 1
                }
            });

            let lipsyncUrl = lipsyncPred.status === 'succeeded' ? lipsyncPred.output : await pollPrediction(lipsyncPred.id, 180_000);
            if (Array.isArray(lipsyncUrl)) lipsyncUrl = lipsyncUrl[0];

            // STEP 6: Add stylized subtitles
            const finalPath = path.join(tmpDir, 'ugc_final.mp4');
            const syncedVideoPath = path.join(tmpDir, 'synced.mp4');
            
            if (typeof lipsyncUrl === 'string' && lipsyncUrl.startsWith('http')) {
                const syncedRes = await fetch(lipsyncUrl);
                await fs.writeFile(syncedVideoPath, Buffer.from(await syncedRes.arrayBuffer()));
            } else {
                await fs.copyFile(intermediatePath, syncedVideoPath);
            }

            if (addSubtitles) {
                console.log(`[UGC] Adding subtitles...`);
                const srtPath = path.join(tmpDir, 'subs.srt');
                const srtContent = generateUGCSRT(script);
                await fs.writeFile(srtPath, srtContent);

                // TikTok/Reels style subtitles
                await execAsync(
                    `ffmpeg -i '${syncedVideoPath}' -vf "subtitles='${srtPath}':force_style='FontSize=22,FontName=Arial,Bold=1,PrimaryColour=&HFFFFFF,OutlineColour=&H000000,Outline=3,Alignment=2'" '${finalPath}' -y`
                ).catch(() => fs.copyFile(syncedVideoPath, finalPath));
            } else {
                await fs.copyFile(syncedVideoPath, finalPath);
            }

            // STEP 7: Upload to Drive and Save in DB
            console.log(`[UGC] Uploading final video to Drive...`);
            const finalBuf = await fs.readFile(finalPath);
            const ugcName = `UGC_${avatarStyle}_${Date.now()}.mp4`;
            const upload = await uploadToProduct(
                finalBuf, ugcName, 'video/mp4', productId, storeId,
                { subfolderName: '05_VIDEOS/UGC', conceptCode: 'UGC', funnelStage: 'TOF' }
            );

            const asset = await (prisma as any).creativeAsset.create({
                data: {
                    productId,
                    storeId,
                    type: 'VIDEO',
                    name: ugcName,
                    driveFileId: upload.driveFileId,
                    drivePath: upload.drivePath,
                    driveUrl: upload.driveUrl,
                    processingStatus: 'DONE',
                    conceptCode: 'UGC',
                    funnelStage: 'TOF',
                    tagsJson: JSON.stringify({ 
                        type: 'UGC_AVATAR', 
                        avatarStyle, 
                        hasSubtitles: addSubtitles, 
                        script 
                    })
                }
            });

            return NextResponse.json({ 
                ok: true, 
                driveFileId: upload.driveFileId, 
                driveUrl: upload.driveUrl, 
                avatarImageUrl,
                assetId: asset.id
            });

        } finally {
            await fs.rm(tmpDir, { recursive: true, force: true });
        }
    } catch (error: any) {
        console.error('[UGC API Error]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

function generateUGCSRT(script: string): string {
    const sentences = script.match(/[^.!?]+[.!?]+/g) || [script];
    let srt = '';
    let t = 0;
    sentences.forEach((s, i) => {
        const d = Math.max(2, s.split(/\s+/).length * 0.45);
        srt += `${i + 1}\n${fmt(t)} --> ${fmt(t + d)}\n${s.trim()}\n\n`;
        t += d;
    });
    return srt;
}

function fmt(s: number): string {
    const h = Math.floor(s / 3600).toString().padStart(2, '0');
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
    const sec = Math.floor(s % 60).toString().padStart(2, '0');
    const ms = Math.floor((s % 1) * 1000).toString().padStart(3, '0');
    return `${h}:${m}:${sec},${ms}`;
}
