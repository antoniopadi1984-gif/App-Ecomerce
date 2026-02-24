'use server';

import { prisma as db } from '@/lib/prisma';
import { askGemini } from '@/lib/ai';
import { revalidatePath } from 'next/cache';
import { VideoAdOrchestrator } from '@/lib/creative/orchestrators/video-ad-orchestrator';
import { CaptionGenerator } from '@/lib/creative/generators/caption-generator';
import { ImageGenerator } from '@/lib/creative/generators/image-generator';

/**
 * Creates a new Maestro Project
 */
export async function createMaestroProject(data: {
    name: string;
    productId: string;
    platform: string;
    language: string;
    avatarId?: string;
}) {
    const project = await db.creativeProject.create({
        data: {
            name: data.name,
            productId: data.productId,
            platform: data.platform,
            language: data.language,
            avatarId: data.avatarId,
            status: 'DRAFT',
            timelineState: 'INITIAL'
        }
    });
    return project;
}

/**
 * Ingests a video asset (simulated for now, would upload to S3)
 */
export async function ingestVideoAsset(projectId: string, fileName: string, fileType: string) {
    // Simulator: Create asset entry directly
    const asset = await db.maestroAsset.create({
        data: {
            projectId,
            type: 'RAW_VIDEO',
            source: 'UPLOAD',
            url: `/uploads/${fileName}`, // Mock path
            status: 'PROCESSING',
            metadata: JSON.stringify({ mime: fileType })
        }
    });

    // Trigger Analysis Job (Mock)
    // In real app: await queue.add('analyze', { assetId: asset.id })

    return asset;
}

/**
 * Analyzes video to extract hooks and clips (Simulated Gemini Vision)
 */
export async function analyzeVideoAsset(assetId: string) {
    // Update asset status
    await db.maestroAsset.update({
        where: { id: assetId },
        data: { status: 'READY' }
    });

    // Create mock clips
    await db.maestroClip.createMany({
        data: [
            { assetId, kind: 'HOOK', startTime: 0, endTime: 3, score: 9.5, transcript: 'Stop scrolling right now!' },
            { assetId, kind: 'BODY', startTime: 3, endTime: 15, score: 8.0, transcript: 'This product changed my life...' },
            { assetId, kind: 'CTA', startTime: 15, endTime: 20, score: 9.0, transcript: 'Click the link below.' }
        ]
    });

    return { success: true };
}

/**
 * Generates Scripts based on project data (Simulated Claude/Gemini)
 */
export async function generateMaestroScripts(projectId: string, context: string) {
    await db.maestroScript.create({
        data: {
            projectId,
            version: 1,
            content: `Script Version 1 based on ${context}`,
            isApproved: false
        }
    });
    return { success: true };
}

/**
 * Generates a real Video Variant using AI (Avatar + Voice + Animation)
 */
export async function generateMaestroVariant(data: {
    projectId: string;
    concept: string;
    avatarPrompt: string;
    script: string;
    voiceId?: string;
    cropFactor?: number;
}) {
    console.log(`[MaestroActions] 🚀 Generando variante: ${data.concept}`);

    try {
        const orchestrator = new VideoAdOrchestrator();
        const result = await orchestrator.generateSingle({
            avatarPrompt: data.avatarPrompt,
            script: data.script,
            voiceId: data.voiceId,
            concept: data.concept,
            cropFactor: data.cropFactor
        });

        // 1. Create the output asset
        const outputAsset = await db.maestroAsset.create({
            data: {
                projectId: data.projectId,
                type: 'VIDEO_VARIANT',
                source: 'AI_GENERATED',
                url: result.videoUrl,
                status: 'READY',
                metadata: JSON.stringify({
                    cost: result.cost,
                    audioUrl: result.audioUrl,
                    script: data.script,
                    thumbnailUrl: result.avatarUrl
                })
            }
        });

        // 2. Create the variant record
        const variant = await db.maestroVariant.create({
            data: {
                projectId: data.projectId,
                name: data.concept,
                outputAssetId: outputAsset.id,
                status: 'READY',
                recipeJson: JSON.stringify({
                    concept: data.concept,
                    avatarPrompt: data.avatarPrompt,
                    script: data.script,
                    voiceId: data.voiceId
                })
            }
        });

        revalidatePath('/centro-creativo');
        return { success: true, variant };
    } catch (error: any) {
        console.error('[MaestroActions] Error generating variant:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Adds Captions to an existing video asset
 */
export async function addCaptionsToMaestroAsset(assetId: string, audioUrl?: string) {
    console.log(`[MaestroActions] 💬 Agregando subtítulos al asset: ${assetId}`);

    try {
        const asset = await db.maestroAsset.findUnique({
            where: { id: assetId },
            include: { project: true }
        });

        if (!asset || !asset.url) throw new Error("Asset no encontrado o sin URL");

        // Determinar audioUrl: si no se pasa, usamos el del video (si Gemini lo soporta)
        // O si es un variant, extraemos el audioUrl de su metadata
        const effectiveAudioUrl = audioUrl || asset.url;

        const captionGen = new CaptionGenerator();
        const result = await captionGen.generateAndAddCaptions(asset.url, effectiveAudioUrl, 'bold');

        // Update asset with captioned version or create a new one
        const updatedAsset = await db.maestroAsset.update({
            where: { id: assetId },
            data: {
                url: result.captionedVideoUrl,
                status: 'READY',
                metadata: JSON.stringify({
                    ...(asset.metadata ? JSON.parse(asset.metadata as string) : {}),
                    hasCaptions: true,
                    segments: result.segments
                })
            }
        });

        return { success: true, asset: updatedAsset };
    } catch (error: any) {
        console.error('[MaestroActions] Error adding captions:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Generates Avatar Static Image (Real Vertex AI / Imagen 3)
 */
export async function generateAvatarStaticImage(avatarId: string, prompt: string) {
    try {
        const imageGen = new ImageGenerator();
        const imageUrl = await imageGen.generate({
            prompt: prompt,
            aspectRatio: '9:16',
            style: 'realistic'
        });

        await db.avatarProfile.update({
            where: { id: avatarId },
            data: {
                imageUrl: imageUrl,
                status: 'READY'
            }
        });

        // Create AvatarAsset record
        await db.avatarAsset.create({
            data: {
                avatarProfileId: avatarId,
                type: 'AVATAR_IMAGE',
                pathLocal: imageUrl,
                width: 1024,
                height: 1024
            }
        });

        return { success: true, imageUrl: imageUrl };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Get Project State for "Truth Layer"
 */
export async function getMaestroProjectState(projectId: string) {
    return await db.creativeProject.findUnique({
        where: { id: projectId },
        include: {
            maestroAssets: { include: { clips: true } },
            maestroScripts: true,
            maestroVariants: true,
            product: true,
            avatar: true
        }
    });
}

/**
 * Get all available products for the UI
 */
export async function getProducts() {
    try {
        const products = await db.product.findMany({
            where: {
                OR: [
                    { status: 'ACTIVE' },
                    { status: 'DRAFT' }
                ]
            },
            select: {
                id: true,
                title: true,
                driveFolderId: true,
                driveRootPath: true
            }
        });
        return { success: true, products };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * MAESTRO ENGINE: Video Analysis (Local)
 */
export async function analyzeVideoLocal(formData: FormData) {
    try {
        const res = await fetch("http://localhost:8000/analyze-video", {
            method: "POST",
            body: formData
        });
        if (!res.ok) throw new Error("Motor Local Error");
        return await res.json();
    } catch (e: any) {
        return { success: false, error: "Motor Offline. ¿Está corriendo dev:all?" };
    }
}

/**
 * MAESTRO ENGINE: Avatar Generation (Local)
 */
export async function generateAvatarLocal(formData: FormData) {
    try {
        const res = await fetch("http://localhost:8000/generate-avatar", {
            method: "POST",
            body: formData
        });
        if (!res.ok) throw new Error("Motor Local Error");
        return await res.json();
    } catch (e: any) {
        return { success: false, error: "Motor Offline. ¿Está corriendo dev:all?" };
    }
}

export async function verifySystemHealth() {
    const checks = {
        database: { status: 'PENDING', message: '' },
        engine: { status: 'PENDING', message: '' },
        avatar: { status: 'PENDING', message: 'Last generation check' }
    };

    try {
        // 1. DB
        await db.$queryRaw`SELECT 1`;
        checks.database = { status: 'OK', message: 'Connected' };
    } catch (e: any) {
        checks.database = { status: 'FAIL', message: e.message };
    }

    try {
        // 2. Engine
        const res = await fetch("http://localhost:8000/health");
        if (res.ok) checks.engine = { status: 'OK', message: 'Operational' };
        else checks.engine = { status: 'FAIL', message: 'Unreachable' };
    } catch (e: any) {
        checks.engine = { status: 'FAIL', message: e.message };
    }

    try {
        // 3. Avatar Check (Check for recent asset)
        const lastAsset = await db.avatarAsset.findFirst({ orderBy: { createdAt: 'desc' } });
        if (lastAsset) checks.avatar = { status: 'OK', message: `Last asset: ${lastAsset.pathLocal}` };
        else checks.avatar = { status: 'WARN', message: 'No assets generated yet' };
    } catch (e: any) {
        checks.avatar = { status: 'FAIL', message: e.message };
    }

    return checks;
}

/**
 * AGENTIC PRODUCTION: Automated Assembly
 */
export async function triggerAgenticProduction(productId: string, platform: string) {
    console.log(`[DirectorAgent] 🤖 Iniciando misión para: ${productId} en ${platform}`);

    // Workflow:
    // 1. Fetch Best Hook from Ingested Assets
    // 2. Generate optimized script for that hook
    // 3. Select best avatar
    // 4. Trigger Batch variant generation

    // MOCK:
    await new Promise(r => setTimeout(r, 2000));

    return {
        success: true,
        message: "Video Maestro Ensamblado y guardado en biblioteca.",
        assetId: "agentic-result-001"
    };
}

export async function fetchTrendRadar() {
    return {
        trends: [
            { id: 1, title: "ASMR Unboxing UGC", platform: "TIKTOK", virality: 0.98, hook: "I didn't expect this to be so small..." },
            { id: 2, title: "The 'Better than X' Hook", platform: "META", virality: 0.85, hook: "Stop buying name brand..." },
            { id: 3, title: "Problem/Solution Side-by-Side", platform: "TIKTOK", virality: 0.92, hook: "My hair before and after this..." }
        ]
    };
}

/**
 * AGENTIC PRODUCTION: Step 1 - Information Analysis
 */
export async function agenticStep1Analysis(productId: string) {
    const product = await db.product.findUnique({
        where: { id: productId },
        include: { avatarResearches: true }
    });

    if (!product) throw new Error("Producto no encontrado");

    const { getDirectorPrompt } = await import('@/lib/ai/prompts/director-agent');
    const systemPrompt = await getDirectorPrompt();

    const context = `
    PRODUCT INFO:
    Title: ${product.title}
    Description: ${product.description}
    Price: ${product.price}
    Category: ${product.productType}
    Research: ${JSON.stringify(product.avatarResearches)}
    `;

    const prompt = `
    ${systemPrompt}
    
    ---
    MANDATORY EXECUTION:
    Execute "STEP 1: INFORMATION ANALYSIS" based on this context:
    ${context}
    
    Respond in Spanish. Keep the elite copywriter tone.
    `;

    const res = await askGemini(prompt, undefined, { model: 'gemini-1.5-pro' });
    return { success: true, analysis: res.text };
}

/**
 * AGENTIC PRODUCTION: Step 2 - Strategy Calibration & Script Generation
 * (Note: Step 2 in prompt asks for input, this action handles the final generation after user input)
 */
export async function agenticGenerateScript(productId: string, calibrationInput: string, additionalNotes?: string) {
    const product = await db.product.findUnique({
        where: { id: productId }
    });

    const { getDirectorPrompt } = await import('@/lib/ai/prompts/director-agent');
    const systemPrompt = await getDirectorPrompt();

    const prompt = `
    ${systemPrompt}
    
    ---
    CONTEXT:
    Product: ${product?.title}
    User Selection: ${calibrationInput}
    Additional Info: ${additionalNotes}
    
    MANDATORY EXECUTION:
    Based on the calibration and the mandatory formula (Eugene Schwartz + $100k/day), generate:
    1. 5 INTERCHANGEABLE HOOKS
    2. 1 UNIVERSAL BODY
    3. WINNING ANALYSIS
    
    Respond in Spanish.
    `;

    const res = await askGemini(prompt, undefined, { model: 'gemini-1.5-pro' });
    return { success: true, script: res.text };
}

/**
 * AGENTIC PRODUCTION: Update System Prompt
 */
export async function updateAgentPrompt(newPrompt: string) {
    const { updateDirectorPrompt } = await import('@/lib/ai/prompts/director-agent');
    return await updateDirectorPrompt(newPrompt);
}
