"use server";

import { prisma } from "@/lib/prisma";
import { uploadToDrive, createProductDriveStructure } from "@/lib/google-drive";
import {
    removeVideoMetadata,
    detectVideoScenes,
    extractVideoClip,
    extractVideoScript,
    checkFFmpegAvailable
} from "@/lib/video/metadata";

/**
 * PRODUCT CREATION WITH DRIVE STRUCTURE
 */
export async function createProductWithDriveAction(data: {
    storeId: string;
    title: string;
    description?: string;
    niche?: string;
    country?: string;
}) {
    try {
        // 1. Create product in database
        const product = await prisma.product.create({
            data: {
                storeId: data.storeId,
                title: data.title,
                description: data.description,
                niche: data.niche,
                country: data.country || 'ES',
                status: 'ACTIVE'
            }
        });

        // 2. Create Drive structure
        try {
            const structure = await createProductDriveStructure(product.id, product.title);
            console.log('✅ Drive structure created:', structure);
        } catch (driveError) {
            console.error('⚠️ Drive structure creation failed:', driveError);
            // Don't fail product creation if Drive fails
        }

        return { success: true, product };

    } catch (error: any) {
        console.error('[createProductWithDriveAction] Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * UPLOAD VIDEO WITH METADATA REMOVAL
 */
export async function uploadAndCleanVideoAction(
    productId: string,
    fileBuffer: Buffer,
    fileName: string
) {
    try {
        // Check ffmpeg availability
        const ffmpegAvailable = await checkFFmpegAvailable();
        if (!ffmpegAvailable) {
            throw new Error('FFmpeg not installed. Please install ffmpeg to process videos.');
        }

        // 1. Remove metadata
        console.log('🧹 Removing metadata from:', fileName);
        const cleanResult = await removeVideoMetadata(fileBuffer, fileName);

        if (!cleanResult.success) {
            throw new Error(cleanResult.error || 'Metadata removal failed');
        }

        // 2. Upload to Drive (videos-raw folder)
        console.log('📤 Uploading clean video to Drive...');
        const driveFileId = await uploadToDrive(
            productId,
            fileBuffer,
            `clean_${fileName}`,
            'video/mp4',
            'videos-raw'
        );

        // 3. Create video asset record
        const videoAsset = await (prisma as any).videoAsset.create({
            data: {
                productId,
                driveFileId,
                fileName: `clean_${fileName}`,
                originalSize: cleanResult.originalSize,
                cleanSize: cleanResult.cleanSize,
                duration: cleanResult.duration,
                resolution: JSON.stringify(cleanResult.resolution),
                hasMetadata: false,
                status: 'UPLOADED'
            }
        });

        return {
            success: true,
            videoAsset,
            driveFileId,
            stats: {
                removed: ((cleanResult.originalSize! - cleanResult.cleanSize!) / cleanResult.originalSize! * 100).toFixed(2) + '%',
                duration: cleanResult.duration + 's',
                resolution: `${cleanResult.resolution?.width}x${cleanResult.resolution?.height}`
            }
        };

    } catch (error: any) {
        console.error('[uploadAndCleanVideoAction] Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * AUTO-DETECT AND EXTRACT CLIPS
 */
export async function analyzeVideoClipsAction(videoAssetId: string) {
    try {
        // 1. Get video asset
        const videoAsset = await (prisma as any).videoAsset.findUnique({
            where: { id: videoAssetId }
        });

        if (!videoAsset) {
            throw new Error('Video asset not found');
        }

        // TODO: Download video from Drive
        // For now, assuming we have the buffer
        const videoBuffer = Buffer.from([]); // Placeholder

        // 2. Detect scenes
        console.log('🔍 Analyzing video for best clips...');
        const scenes = await detectVideoScenes(videoBuffer, 3, 10);

        // 3. Save clips to database
        const clips = await Promise.all(
            scenes.map(async (scene, index) => {
                return await (prisma as any).videoClip.create({
                    data: {
                        productId: videoAsset.productId,
                        videoAssetId: videoAsset.id,
                        startTime: scene.start,
                        endTime: scene.end,
                        duration: scene.end - scene.start,
                        score: scene.score,
                        clipNumber: index + 1,
                        status: 'DETECTED'
                    }
                });
            })
        );

        return {
            success: true,
            clipsDetected: clips.length,
            clips: clips.map(c => ({
                id: c.id,
                start: c.startTime,
                end: c.endTime,
                duration: c.duration,
                score: c.score
            }))
        };

    } catch (error: any) {
        console.error('[analyzeVideoClipsAction] Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * EXPORT SELECTED CLIP TO DRIVE
 */
export async function exportClipAction(
    clipId: string,
    format: '9:16' | '16:9' | '1:1' = '9:16'
) {
    try {
        const clip = await (prisma as any).videoClip.findUnique({
            where: { id: clipId },
            include: { videoAsset: true }
        });

        if (!clip) {
            throw new Error('Clip not found');
        }

        // TODO: Download original video from Drive
        const videoBuffer = Buffer.from([]); // Placeholder

        // Extract clip
        console.log(`✂️ Extracting clip ${clip.clipNumber} in ${format} format...`);
        const clipBuffer = await extractVideoClip(
            videoBuffer,
            clip.startTime,
            clip.endTime,
            format
        );

        // Upload to Drive (clips folder)
        const fileName = `clip_${clip.clipNumber}_${format.replace(':', 'x')}.mp4`;
        const driveFileId = await uploadToDrive(
            clip.productId,
            clipBuffer,
            fileName,
            'video/mp4',
            'clips'
        );

        // Update clip record
        await (prisma as any).videoClip.update({
            where: { id: clipId },
            data: {
                driveFileId,
                exportedFormat: format,
                status: 'EXPORTED'
            }
        });

        return {
            success: true,
            driveFileId,
            fileName
        };

    } catch (error: any) {
        console.error('[exportClipAction] Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * EXTRACT SCRIPT FROM VIDEO
 */
export async function extractScriptAction(videoAssetId: string) {
    try {
        const videoAsset = await (prisma as any).videoAsset.findUnique({
            where: { id: videoAssetId }
        });

        if (!videoAsset) {
            throw new Error('Video asset not found');
        }

        // TODO: Download video from Drive
        const videoBuffer = Buffer.from([]); // Placeholder

        console.log('🎬 Extracting script from video...');
        const script = await extractVideoScript(videoBuffer);

        // Save script
        await (prisma as any).videoScript.create({
            data: {
                productId: videoAsset.productId,
                videoAssetId: videoAsset.id,
                transcript: script.transcript,
                timestampsJson: JSON.stringify(script.timestamps),
                language: 'es' // TODO: Auto-detect
            }
        });

        // Upload script to Drive
        const scriptContent = `# Video Script - ${videoAsset.fileName}\n\n${script.transcript}`;
        await uploadToDrive(
            videoAsset.productId,
            Buffer.from(scriptContent, 'utf-8'),
            `script_${videoAsset.fileName}.txt`,
            'text/plain',
            'scripts'
        );

        return {
            success: true,
            transcript: script.transcript,
            timestamps: script.timestamps
        };

    } catch (error: any) {
        console.error('[extractScriptAction] Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * GET PRODUCT VIDEOS AND CLIPS
 */
export async function getProductVideosAction(productId: string) {
    try {
        const videos = await (prisma as any).videoAsset.findMany({
            where: { productId },
            include: {
                clips: {
                    orderBy: { score: 'desc' }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return {
            success: true,
            videos: videos.map((v: any) => ({
                id: v.id,
                fileName: v.fileName,
                duration: v.duration,
                resolution: JSON.parse(v.resolution || '{}'),
                clipsCount: v.clips.length,
                clips: v.clips.map((c: any) => ({
                    id: c.id,
                    start: c.startTime,
                    end: c.endTime,
                    duration: c.duration,
                    score: c.score,
                    status: c.status
                }))
            }))
        };

    } catch (error: any) {
        console.error('[getProductVideosAction] Error:', error);
        return { success: false, error: error.message };
    }
}
