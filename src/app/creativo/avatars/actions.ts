"use server";

import { elevenLabs } from "@/lib/elevenlabs";
import { prisma } from "@/lib/prisma";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { v4 as uuidv4 } from "uuid";

/**
 * AVATAR UNIFIED ACTIONS
 * Consolidates features from Lab, Research and Legacy systems.
 */

export async function getFirstStoreId() {
    try {
        let store = await prisma.store.findFirst();
        if (!store) {
            store = await prisma.store.create({
                data: { name: "Mi Tienda Ecombom" }
            });
        }
        return { success: true, id: store.id };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function getElevenLabsVoices() {
    try {
        const res = await elevenLabs.getVoices();
        return res;
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function checkLocalEngineHealth() {
    try {
        const res = await fetch("http://localhost:8000/", { next: { revalidate: 0 } });
        if (!res.ok) return { status: "stopped", gpu: false };
        return await res.json();
    } catch (e) {
        return { status: "stopped", gpu: false };
    }
}

export async function generateAvatarScript(productContext: string, avatarType: string, language: string = "ES") {
    let productDetails = productContext;
    if (productContext.length === 25 || productContext.includes("-")) {
        const product = await prisma.product.findUnique({
            where: { id: productContext },
            include: { avatarResearches: true }
        });
        if (product) {
            productDetails = `${product.title}. Research: ${JSON.stringify(product.avatarResearches)}`;
        }
    }

    const prompt = `
        Actúa como un Copywriter de Respuesta Directa experto.
        Escribre un guión de 30 segundos para un video de un avatar de tipo "${avatarType}".
        Contexto del Producto: ${productDetails}

        Estructura ideal:
        1. HOOK (0-3s): Detener el scroll con una pregunta o afirmación impactante.
        2. PROBLEM (3-12s): Resaltar el dolor que resuelve el producto.
        3. SOLUTION/MECHANISM (12-22s): Introducir el producto y su ventaja única.
        4. CTA (22-30s): Llamada a la acción directa.

        Responde ÚNICAMENTE el texto del guión en el idioma "${language === 'en' ? 'INGLÉS' : 'ESPAÑOL'}", sin etiquetas de tiempo innecesarias fuera de [HOOK], [BODY], [CTA].
    `;

    try {
        const { text } = await generateText({
            model: google("gemini-1.5-pro"),
            prompt,
        });

        if (!text) return { success: false, error: "Gemini no generó un guión. Reintenta." };
        return { success: true, script: text };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

/**
 * Modern Avatar Profile Saving
 */
export async function saveAvatarProfile(storeId: string, data: {
    id?: string;
    productId?: string;
    name: string;
    sex: string;
    ageRange: string;
    region: string;
    voiceId?: string;
    hasGreyHair?: boolean;
    hasWrinkles?: boolean;
    hasAcne?: boolean;
    hasHairLoss?: boolean;
    skinTone?: string;
    customPrompt?: string;
    evolutionId?: string;
    evolutionStage?: string;
    imageUrl?: string;
    tier?: string;
    voiceStability?: number;
    voiceSimilarity?: number;
    voiceStyle?: number;
    voiceSpeakerBoost?: boolean;
    voiceLanguage?: string;
}) {
    const { createJob } = await import("@/lib/worker");
    try {
        const payload = {
            storeId,
            productId: data.productId || null,
            name: data.name,
            sex: data.sex,
            ageRange: data.ageRange,
            region: data.region,
            status: "GENERATING_IMAGE",
            evolutionId: data.evolutionId || null,
            evolutionStage: data.evolutionStage || null,
            metadataJson: JSON.stringify({
                voiceId: (data.voiceId && data.voiceId !== 'none') ? data.voiceId : null,
                voiceSettings: {
                    stability: data.voiceStability ?? 0.5,
                    similarity: data.voiceSimilarity ?? 0.75,
                    style: data.voiceStyle ?? 0,
                    use_speaker_boost: data.voiceSpeakerBoost !== false,
                    language: data.voiceLanguage || 'es'
                },
                customPrompt: data.customPrompt || null,
                traits: {
                    hasGreyHair: data.hasGreyHair || false,
                    hasWrinkles: data.hasWrinkles || false,
                    hasAcne: data.hasAcne || false,
                    hasHairLoss: data.hasHairLoss || false,
                    skinTone: data.skinTone || 'CLARO'
                }
            }),
            imageUrl: data.imageUrl || "/static/placeholders/avatar_female_older.png"
        };

        const profile = data.id
            ? await prisma.avatarProfile.update({ where: { id: data.id }, data: payload })
            : await prisma.avatarProfile.create({ data: payload });

        await createJob('GENERATE_AVATAR_IMAGE', {
            avatarProfileId: profile.id,
            tier: data.tier || 'premium'
        });

        return { success: true, data: profile };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

/**
 * Migration feature: Create avatar from research data
 */
export async function createAvatarFromResearchAction(productId: string, storeId: string) {
    try {
        const research = await prisma.researchRun.findFirst({
            where: { productId },
            orderBy: { createdAt: 'desc' },
            select: { results: true }
        });

        if (!research || !research.results) return { success: false, error: 'No research data found' };

        const researchData = JSON.parse(research.results);
        const avatars = researchData.v3_avatars || [];
        if (avatars.length === 0) return { success: false, error: 'No avatars found in research' };

        const topAvatar = avatars.sort((a: any, b: any) => (b.score || 0) - (a.score || 0))[0];

        const prompt = `Based on this target avatar, create a realistic person visualization config:
        Name: ${topAvatar.name}
        Demographics: ${topAvatar.demographics}
        Psychographics: ${topAvatar.psychographics}
        
        Generate a JSON object with:
        {
          "name": "realistic first name",
          "sex": "MALE/FEMALE",
          "ageRange": "18-25/25-35/35-45/45-55/55-65/65+",
          "region": "string",
          "traits": { "hair": "string", "clothing": "string" },
          "customPrompt": "detailed DALL-E/Flux prompt"
        }`;

        const { text } = await generateText({
            model: google("gemini-1.5-flash"),
            prompt,
        });

        const config = JSON.parse(text);

        return await saveAvatarProfile(storeId, {
            productId,
            name: config.name,
            sex: config.sex || "FEMALE",
            ageRange: config.ageRange || "35-45",
            region: config.region || "España",
            customPrompt: config.customPrompt,
            tier: 'premium'
        });

    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function retryAvatarGeneration(avatarProfileId: string) {
    const { createJob } = await import("@/lib/worker");
    try {
        await prisma.avatarProfile.update({
            where: { id: avatarProfileId },
            data: { status: 'GENERATING_IMAGE', lastError: null }
        });
        await createJob('GENERATE_AVATAR_IMAGE', { avatarProfileId });
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function createEvolutionPair(baseAvatarId: string) {
    const { createJob } = await import("@/lib/worker");
    try {
        const base = await prisma.avatarProfile.findUnique({ where: { id: baseAvatarId } });
        if (!base) throw new Error("Base avatar not found");

        const evolutionId = uuidv4();
        await prisma.avatarProfile.update({
            where: { id: baseAvatarId },
            data: { evolutionId, evolutionStage: "BEFORE" }
        });

        const after = await prisma.avatarProfile.create({
            data: {
                storeId: base.storeId,
                productId: base.productId,
                name: `${base.name} (Después)`,
                sex: base.sex,
                ageRange: base.ageRange,
                region: base.region,
                status: "DRAFT",
                evolutionId,
                evolutionStage: "AFTER",
                metadataJson: JSON.stringify({
                    ...JSON.parse(base.metadataJson || "{}"),
                    traits: {
                        ...JSON.parse(base.metadataJson || "{}").traits,
                        hasWrinkles: false,
                        hasAcne: false,
                        hasHairLoss: false,
                    }
                }),
                imageUrl: "/static/placeholders/avatar_female_older.png"
            }
        });

        await createJob('GENERATE_AVATAR_IMAGE', { avatarProfileId: base.id });
        await createJob('GENERATE_AVATAR_IMAGE', { avatarProfileId: after.id });

        return { success: true, evolutionId };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function getAvatarProfiles(storeId: string) {
    try {
        const avatars = await prisma.avatarProfile.findMany({
            where: { storeId },
            orderBy: { createdAt: 'desc' }
        });
        return { success: true, data: avatars };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function deleteAvatarProfile(id: string) {
    try {
        await prisma.avatarProfile.delete({ where: { id } });
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function synthesizeVoice(text: string, voiceId: string, settings: any) {
    try {
        const res = await elevenLabs.textToSpeech(text, voiceId, settings);
        return res;
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function cleanupLegacyAvatars(storeId?: string) {
    const { cleanupLegacyAvatars: internalCleanup } = await import("./cleanup");
    return await internalCleanup(storeId);
}

export async function getProductDriveFolder(productId: string) {
    try {
        const product = await prisma.product.findUnique({
            where: { id: productId },
            select: { driveFolderId: true, driveRootPath: true, title: true }
        });
        return { success: true, data: product };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

// Local Engine Proxies
export async function generateAvatarLocal(prompt: string, style: string, gender: string, ethnicity: string, age: string, image?: string) {
    try {
        const formData = new FormData();
        formData.append("prompt", prompt);
        formData.append("style", style);
        // ... call local engine ...
        return { success: true };
    } catch (e) {
        return { success: false, error: "Motor Local No Detectado" };
    }
}

/**
 * SCIENTIFIC SIMULATION (Collagen, Hair Growth, etc.)
 */
export async function generateScientificSimulation(avatarId: string, mode: string) {
    const { AvatarEngine } = await import("@/lib/avatar-engine");
    const { getConnectionSecret } = await import("@/lib/server/connections");
    const token = await getConnectionSecret("store-main", "REPLICATE") || process.env.REPLICATE_API_TOKEN;

    if (!token) return { success: false, error: "Replicate Master Engine no configurado. Ve a Canales e Infraestructura." };

    try {
        const avatar = await prisma.avatarProfile.findUnique({ where: { id: avatarId } });
        if (!avatar || !avatar.imageUrl) return { success: false, error: "Avatar sin imagen base" };

        const engine = new AvatarEngine(token);
        const res = await engine.generateScientificRecreation(mode as any, avatar.imageUrl);

        // Create an asset for this simulation
        await prisma.avatarAsset.create({
            data: {
                avatarProfileId: avatarId,
                type: 'SCIENTIFIC_SIMULATION',
                pathLocal: res.id, // Store prediction ID
                mime: mode // Store mode in mime as a workaround
            }
        });

        return { success: true, predictionId: res.id };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

/**
 * REAL LIPSYNC / MOTION GENERATION
 */
export async function generateAvatarMotion(avatarId: string, audioUrl: string, script: string) {
    const { VideoAdOrchestrator } = await import("@/lib/creative/orchestrators/video-ad-orchestrator");
    const avatar = await prisma.avatarProfile.findUnique({ where: { id: avatarId } });
    if (!avatar || !avatar.imageUrl) return { success: false, error: "Avatar sin imagen base" };

    try {
        const orchestrator = new VideoAdOrchestrator();
        const res = await orchestrator.generateSingle({
            avatarPrompt: avatar.name || "avatar",
            script: script,
            voiceId: JSON.parse(avatar.metadataJson || "{}").voiceId || undefined,
            concept: `LIPSYNC_${avatar.name}`,
            cropFactor: 1.7
        });

        return { success: true, videoUrl: res.videoUrl };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

/**
 * GET ALL ASSETS FOR AVATARS (Videos, Simulations, etc.)
 */
export async function getAvatarAssets(productId: string) {
    try {
        const [creatives, assets] = await Promise.all([
            prisma.generatedCreative.findMany({
                where: { productId, type: 'VIDEO' },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.avatarAsset.findMany({
                where: { avatarProfile: { productId } },
                include: { avatarProfile: true },
                orderBy: { createdAt: 'desc' }
            })
        ]);

        return { success: true, creatives, assets };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}
