"use server";

import { elevenLabs } from "@/lib/elevenlabs";

export async function getFirstStoreId() {
    console.log("🔍 [Actions] getFirstStoreId started");
    const prisma = (await import("@/lib/prisma")).default;
    try {
        let store = await prisma.store.findFirst();
        console.log("🏪 [Actions] Store found:", store?.id || "NONE");
        if (!store) {
            console.log("✨ [Actions] No store found, creating default...");
            // Create a default store if none exists to prevent FK errors
            store = await prisma.store.create({
                data: { name: "Mi Tienda Ecombom" }
            });
            console.log("✅ [Actions] Default store created:", store.id);
        }
        return { success: true, id: store.id };
    }
    catch (e: any) {
        console.error("❌ [Actions] getFirstStoreId ERROR:", e.message);
        return { success: false, error: e.message };
    }
}

export async function getElevenLabsVoices() {
    try {
        const res = await elevenLabs.getVoices();
        return res;
    }
    catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function checkLocalEngineHealth() {
    try {
        const res = await fetch("http://localhost:8000/", { next: { revalidate: 0 } });
        if (!res.ok) return { status: "stopped", gpu: false };
        return await res.json();
    }
    catch (e) {
        return { status: "stopped", gpu: false };
    }
}

export async function generateAvatarLocal(
    prompt: string,
    style: string,
    gender: string = "Neutro",
    ethnicity: string = "Caucásico",
    age: string = "25",
    image?: string
) {
    try {
        const formData = new FormData();
        formData.append("prompt", prompt);
        formData.append("style", style);
        formData.append("gender", gender);
        formData.append("ethnicity", ethnicity);
        formData.append("age", age);

        if (image) formData.append("image", image);
        // Assuming base64 or url
        const res = await fetch("http://localhost:8000/generate-avatar", {
            method: "POST",
            body: formData
        });

        if (!res.ok) throw new Error("Local Engine Error");
        return await res.json();
    }
    catch (error: any) {
        return { success: false, error: "Motor Local No Detectado o Error de Conexión." };
    }
}

export async function generateSimulationFX(mode: string, image?: string) {
    try {
        const formData = new FormData();
        formData.append("mode", mode);
        if (image) formData.append("subject_image", image);

        const res = await fetch("http://localhost:8000/generate-simulation", {
            method: "POST",
            body: formData
        });

        if (!res.ok) throw new Error("Local Engine Error");
        return await res.json();
    }
    catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function generateProductInteraction(product: string, action: string, image?: string) {
    try {
        const formData = new FormData();
        formData.append("product_name", product);
        formData.append("action", action);
        if (image) formData.append("subject_image", image);

        const res = await fetch("http://localhost:8000/generate-interaction", {
            method: "POST",
            body: formData
        });

        if (!res.ok) throw new Error("Local Engine Error");
        return await res.json();
    }
    catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function generateAvatarScript(productContext: string, avatarType: string, language: string = "ES") {
    const { askGemini } = await import("@/lib/ai");
    const prisma = (await import("@/lib/prisma")).default;

    let productDetails = productContext;
    if (productContext.length === 25 || productContext.includes("-")) { // ID detection
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
        const res = await askGemini(prompt, undefined, {
            model: "gemini-1.5-pro",
            apiVersion: "v1beta"
        });
        if (res.error) return { success: false, error: res.error };
        if (!res.text || res.text === "No se obtuvo respuesta de Gemini.") {
            return { success: false, error: "Gemini no generó un guión. Reintenta." };
        }
        return { success: true, script: res.text };
    }
    catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function analyzeUploadedVideo(imageBase64: string, productId?: string, productName?: string, language: string = "ES") {
    const { createJob } = await import("@/lib/worker");

    try {
        const job = await createJob('AI_EXTRACT', {
            imageBase64,
            productId,
            productName,
            language
        });

        return { success: true, jobId: job.id };
    }
    catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function translateVideoScript(script: string, targetLang: string) {
    const { askGemini } = await import("@/lib/ai");
    const prompt = `Traduce este guión de anuncio al idioma "${targetLang}". Mantén el tono persuasivo y de respuesta directa.
 Guión: ${script}`;

    try {
        const res = await askGemini(prompt);
        if (res.error) return { success: false, error: res.error };
        return { success: true, translatedScript: res.text };
    }
    catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function saveAvatarProfile(storeId: string, data: {
    id?: string;
    name: string;
    sex: string;
    ageRange: string;
    region: string;
    voiceId?: string;
    hasGreyHair?: boolean;
    hasWrinkles?: boolean;
    hasAcne?: boolean;
    customPrompt?: string;
    evolutionId?: string;
    evolutionStage?: string;
    imageUrl?: string;
}) {
    console.log("🚀 [Actions] saveAvatarProfile started", { storeId, name: data.name, id: data.id });
    const prisma = (await import("@/lib/prisma")).default;
    const { createJob } = await import("@/lib/worker");
    try {
        const payload = {
            storeId,
            name: data.name,
            sex: data.sex,
            ageRange: data.ageRange,
            region: data.region,
            status: "GENERATING_IMAGE",
            evolutionId: data.evolutionId || null,
            evolutionStage: data.evolutionStage || null,
            metadataJson: JSON.stringify({
                voiceId: (data.voiceId && data.voiceId !== 'none') ? data.voiceId : null,
                customPrompt: data.customPrompt || null,
                traits: {
                    hasGreyHair: data.hasGreyHair || false,
                    hasWrinkles: data.hasWrinkles || false,
                    hasAcne: data.hasAcne || false
                }
            }),
            imageUrl: data.imageUrl || "/static/placeholders/avatar_placeholder.png"
        };

        let profile;
        if (data.id) {
            console.log("💾 [Actions] Updating profile in DB:", data.id);
            profile = await (prisma.avatarProfile as any).update({
                where: { id: data.id },
                data: payload
            });
        }
        else {
            console.log("💾 [Actions] Creating new profile in DB...");
            profile = await (prisma.avatarProfile as any).create({
                data: payload
            });
        }

        // Enqueue image generation job
        console.log("📦 [Actions] Enqueuing job for profile:", profile.id);
        await createJob('GENERATE_AVATAR_IMAGE', { avatarProfileId: profile.id });

        console.log("✅ [Actions] Profile saved successfully");
        return { success: true, data: profile };
    }
    catch (e: any) {
        console.error("❌ [Actions] Error in saveAvatarProfile:", e.message);
        return { success: false, error: e.message };
    }
}

export async function createEvolutionPair(baseAvatarId: string) {
    console.log("🧬 [Actions] createEvolutionPair started for:", baseAvatarId);
    const prisma = (await import("@/lib/prisma")).default;
    const { createJob } = await import("@/lib/worker");
    const { v4: uuidv4 } = await import("uuid");

    try {
        const base = await prisma.avatarProfile.findUnique({ where: { id: baseAvatarId } });
        if (!base) throw new Error("Base avatar not found");

        const evolutionId = uuidv4();

        // 1. Update Base to be "BEFORE"
        await (prisma.avatarProfile as any).update({
            where: { id: baseAvatarId },
            data: { evolutionId, evolutionStage: "BEFORE" }
        });

        // 2. Create "AFTER" profile
        const after = await (prisma.avatarProfile as any).create({
            data: {
                storeId: base.storeId,
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
                        hasGreyHair: JSON.parse(base.metadataJson || "{}").traits?.hasGreyHair || false,
                        hasWrinkles: false, // Evolution goal: remove wrinkles
                        hasAcne: false // Evolution goal: remove acne
                    }
                }),
                imageUrl: "/static/placeholders/avatar_placeholder.png"
            }
        });

        // 3. Trigger Jobs
        await createJob('GENERATE_AVATAR_IMAGE', { avatarProfileId: base.id });
        await createJob('GENERATE_AVATAR_IMAGE', { avatarProfileId: after.id });

        return { success: true, evolutionId };
    }
    catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function retryAvatarGeneration(avatarProfileId: string) {
    const { createJob } = await import("@/lib/worker");
    const prisma = (await import("@/lib/prisma")).default;
    try {
        await (prisma.avatarProfile as any).update({
            where: { id: avatarProfileId },
            data: { status: 'GENERATING_IMAGE', lastError: null }
        });
        await createJob('GENERATE_AVATAR_IMAGE', { avatarProfileId });
        return { success: true };
    }
    catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function deleteAvatarProfile(id: string) {
    const prisma = (await import("@/lib/prisma")).default;
    try {
        await prisma.avatarProfile.delete({ where: { id } });
        return { success: true };
    }
    catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function getAvatarProfiles(storeId: string) {
    const prisma = (await import("@/lib/prisma")).default;
    try {
        const avatars = await prisma.avatarProfile.findMany({
            where: { storeId },
            orderBy: { createdAt: 'desc' }
        });
        return { success: true, data: avatars };
    }
    catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function synthesizeVoice(text: string, voiceId: string, settings: { stability: number, similarity: number }) {
    try {
        const res = await elevenLabs.textToSpeech(text, voiceId, { stability: settings.stability, similarity: settings.similarity });
        if (res.success && res.blob) {
            return { success: true, message: "Audio sintetizado y listo." };
        }
        return { success: false, error: "Audio synthesis failed" };
    }
    catch (error: any) {
        return { success: false, error: error.message };
    }
}
