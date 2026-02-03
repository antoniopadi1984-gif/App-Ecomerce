"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// --- EDITOR ACTIONS ---

// 1. Save Project State
// state is a huge JSON string containing tracks, clips, volume levels...
export async function saveProjectState(projectId: string, state: any) {
    try {
        await prisma.creativeProject.update({
            where: { id: projectId },
            data: {
                timelineState: JSON.stringify(state),
                // We could calculate total duration from state here if needed
            }
        });
        revalidatePath(`/marketing/creative-lab/editor/${projectId}`);
        return { success: true };
    } catch (e) {
        console.error("Error saving project:", e);
        return { success: false, error: "Failed to save" };
    }
}

// 2. Create New Project
export async function createProject(name: string, productId?: string) {
    const defaultState = {
        tracks: [
            { id: 'video-track-1', type: 'video', clips: [] },
            { id: 'audio-track-1', type: 'audio', clips: [] },
            { id: 'text-track-1', type: 'text', clips: [] }
        ],
        settings: { fps: 30, width: 1080, height: 1920 }
    };

    const project = await prisma.creativeProject.create({
        data: {
            name,
            productId,
            timelineState: JSON.stringify(defaultState)
        }
    });

    return project;
}

// 3. FRANKENSTEIN GENERATOR (The "Magic" Button)
interface GenConfig {
    structure: 'PAS' | 'AIDA' | 'RETARGETING';
    productId: string;
    targetDuration?: number;
}

export async function generateFrankensteinComposition(config: GenConfig) {
    // 1. Fetch best clips for the product
    const assets = await prisma.creativeAsset.findMany({
        where: { productId: config.productId },
        orderBy: { hookRate: 'desc' } // Prioritize best hooks
    });

    if (assets.length === 0) return { success: false, error: "No assets found for this product. Upload some clips first." };

    const timelineState: any = {
        tracks: [
            { id: 'video-track-1', type: 'video', clips: [] },
            { id: 'audio-track-1', type: 'audio', clips: [] },
            { id: 'text-track-1', type: 'text', clips: [] }
        ],
        settings: { fps: 30, width: 1080, height: 1920 }
    };

    let currentTime = 0;

    // Structure Logic
    // PAS: Problem -> Agitate -> Solution
    // AIDA: Attention -> Interest -> Desire -> Action

    let composition = [];
    if (config.structure === 'PAS') {
        composition = [
            { type: 'HOOK', name: 'Problem Hook', duration: 3 },
            { type: 'BODY', name: 'Agitation/Body', duration: 15 },
            { type: 'CTA', name: 'Solution/CTA', duration: 5 }
        ];
    } else if (config.structure === 'AIDA') {
        composition = [
            { type: 'HOOK', name: 'Attention Hook', duration: 3 },
            { type: 'BODY', name: 'Interest/Body', duration: 10 },
            { type: 'BODY', name: 'Desire/Proof', duration: 10 },
            { type: 'CTA', name: 'Action/CTA', duration: 5 }
        ];
    } else { // RETARGETING
        composition = [
            { type: 'HOOK', name: 'Familiarity Hook', duration: 3 },
            { type: 'BODY', name: 'Trust/UGC/Proof', duration: 20 },
            { type: 'CTA', name: 'Scarcity/CTA', duration: 5 }
        ];
    }

    for (const step of composition) {
        // Heuristic: try to find an asset that matches the step type in its name
        const match = assets.find(a => a.name.toUpperCase().includes(step.type)) || assets[Math.floor(Math.random() * assets.length)];

        timelineState.tracks[0].clips.push({
            id: `clip-${Date.now()}-${step.name}`,
            assetId: match.id,
            name: match.name,
            start: currentTime,
            duration: step.duration,
            offset: 0
        });
        currentTime += step.duration;
    }

    // Create Project
    const project = await prisma.creativeProject.create({
        data: {
            name: `Frankenstein [${config.structure}] - ${new Date().toLocaleDateString()}`,
            productId: config.productId,
            timelineState: JSON.stringify(timelineState),
            duration: currentTime,
            aspectRatio: "9:16"
        }
    });

    return { success: true, projectId: project.id };
}

// 4. AI SIMULATIONS (ElevenLabs, Veo, Avatars)

export async function generateElevenLabsVoice(text: string, voiceId: string) {
    // Mock API call
    await new Promise(r => setTimeout(r, 1500));
    return {
        success: true,
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", // Dummy
        duration: 10
    };
}

export async function generateVeoVideo(prompt: string, type: 'text-to-video' | 'image-to-video') {
    // Mock API call
    await new Promise(r => setTimeout(r, 3000));
    return {
        success: true,
        videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4", // Dummy
        duration: 5
    };
}

/**
 * NEW: Realistic AI Avatar Generation (Nano Banana + Veo 3)
 */
export async function generateAvatarVideo(data: {
    productId: string;
    script: string;
    avatarId: string;
    backgroundStyle: string;
}) {
    console.log(`[AI Avatar] Generating for product ${data.productId} with avatar ${data.avatarId}...`);
    // Simulation logic for Veo 3 realistic avatar
    await new Promise(r => setTimeout(r, 5000));

    return {
        success: true,
        videoUrl: "https://v1.padicdn.com/examples/avatar-demo.mp4", // Dummy
        duration: 15,
        thumbnail: "https://v1.padicdn.com/examples/avatar-thumb.jpg"
    };
}

/**
 * NEW: Get Smart Prompt Context
 * Harvests winners and research to guide the AI
 */
export async function getSmartPromptContext(productId: string) {
    try {
        const product = await prisma.product.findUnique({
            where: { id: productId },
            include: {
                creatives: {
                    orderBy: { hookRate: 'desc' },
                    take: 3
                },
                avatars: {
                    take: 1
                }
            }
        });

        if (!product) return { success: false, context: "" };

        const winners = product.creatives.map(c => `- ${c.name} (Hook: ${c.hookRate || 'N/A'}%)`).join('\n');
        const research = product.avatars[0];

        const context = `
PRODUCTO: ${product.title}
INVESTIGACIÓN (Miedos/Deseos): ${research?.fears || 'No data'}
CREATIVOS GANADORES (Referencia):
${winners}
ESTILO: Direct-Response, Premium, Directo al grano.
        `;

        return { success: true, context };
    } catch (e) {
        return { success: false, context: "" };
    }
}

/**
 * NEW: High-performance Asset Optimization (WebP/WebM)
 */
export async function optimizeAssetExport(assetId: string, format: 'webp' | 'webm') {
    console.log(`[Optimization] Converting asset ${assetId} to ${format}...`);
    // Placeholder for server-side processing (Sharp/FFmpeg)
    await new Promise(r => setTimeout(r, 2000));

    return {
        success: true,
        optimizedUrl: `https://v1.padicdn.com/optimized/${assetId}.${format}`,
        format: format
    };
}

/**
 * NEW: Massive Metadata Removal (Asset Sanitization)
 */
export async function cleanAssetMetadata(assetIds: string[]) {
    console.log(`[Sanitization] Cleaning metadata for assets: ${assetIds.join(', ')}...`);
    // Simulated loop for cleaning EXIF/GPS/Metadata
    for (const id of assetIds) {
        await new Promise(r => setTimeout(r, 500));
        console.log(`[Sanitization] Asset ${id} cleaned.`);
    }

    revalidatePath("/marketing/creative-lab");
    return { success: true, message: `${assetIds.length} archivos saneados (metadata eliminada).` };
}

/**
 * NEW: Competitor Video Replication
 */
export async function replicateCompetitorVideo(data: {
    videoUrl?: string;
    targetProductId: string;
    assetId?: string; // New: Support for local library videos
}) {
    console.log(`[Replication] Analyzing source: ${data.videoUrl || data.assetId || 'Upload'}...`);

    // 1. Simulate Transcription & OCR
    await new Promise(r => setTimeout(r, 2000));

    // 2. Fetch product info
    const product = await prisma.product.findUnique({
        where: { id: data.targetProductId },
        include: { avatars: true }
    });

    const originalScript = "¡Mira este producto increíble que acabo de encontrar!";
    const newScript = `Hola, ¿buscas un ${product?.title || 'producto'}? Esto es lo que necesitas...`;

    // 3. Return the blueprint for the editor
    return {
        success: true,
        originalTranscript: originalScript,
        suggestedScript: newScript,
        suggestedAvatar: product?.avatars?.[0], // Link back to existing research
        message: "Source analyzed. Guión replicado con tu producto y avatar favorito listo."
    };
}

/**
 * NEW: Video Translation & Dubbing (with Subtitle Removal)
 */
export async function translateAndDubVideo(data: {
    assetId: string;
    targetLanguage: string;
    removeOriginalSubtitles: boolean;
}) {
    console.log(`[Translation] Translating asset ${data.assetId} to ${data.targetLanguage}...`);
    // 1. Remove Subtitles (Inpainting simulation)
    if (data.removeOriginalSubtitles) {
        await new Promise(r => setTimeout(r, 1500));
        console.log(`[Translation] Subtitles removed via Inpainting AI.`);
    }

    // 2. Translate & Dub (Perfect LipSync simulation)
    await new Promise(r => setTimeout(r, 3000));

    return {
        success: true,
        videoUrl: `https://v1.padicdn.com/translations/${data.assetId}-${data.targetLanguage}.mp4`,
        dubbingStatus: "Perfect Lip-Sync applied",
        message: `Video traducido a ${data.targetLanguage} con éxito.`
    };
}
