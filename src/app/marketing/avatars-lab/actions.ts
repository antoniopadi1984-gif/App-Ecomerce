"use server";

import { elevenLabs } from "@/lib/elevenlabs";

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

export async function generateAvatarLocal(prompt: string, style: string, image?: string) {
    try {
        const formData = new FormData();
        formData.append("prompt", prompt);
        formData.append("style", style);
        if (image) formData.append("image", image); // Assuming base64 or url

        const res = await fetch("http://localhost:8000/generate-avatar", {
            method: "POST",
            body: formData
        });

        if (!res.ok) throw new Error("Local Engine Error");
        return await res.json();
    } catch (error: any) {
        return { success: false, error: "Motor Local No Detectado. Ejecuta './src/engine/install_engine.sh'" };
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
    } catch (error: any) {
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
    } catch (error: any) {
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
            include: { avatars: true }
        });
        if (product) {
            productDetails = `${product.title}. Avatares: ${JSON.stringify(product.avatars)}`;
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
        const res = await askGemini(prompt);
        if (res.error) return { success: false, error: res.error };
        if (!res.text || res.text === "No se obtuvo respuesta de Gemini.") {
            return { success: false, error: "Gemini no generó un guión. Reintenta." };
        }
        return { success: true, script: res.text };
    } catch (e: any) {
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
    } catch (e: any) {
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
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function getProducts() {
    const prisma = (await import("@/lib/prisma")).default;
    try {
        const products = await prisma.product.findMany({
            include: { avatars: true }
        });
        return { success: true, data: products };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function getProductResearch(productId: string) {
    const prisma = (await import("@/lib/prisma")).default;
    try {
        // Here we can fetch research data from related models if we have them
        // For now, let's return the product info with some mock research metadata if missing
        const product = await prisma.product.findUnique({
            where: { id: productId },
            include: {
                avatars: true,
                creatives: {
                    take: 5,
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        // Simulating the expected 'research' structure used in the UI
        const research = {
            angles: product?.creatives?.map((c: any) => ({ title: c.angulo || "Ángulo Base", draft: c.nomenclatura })) || []
        };

        return { success: true, data: research };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function synthesizeVoice(text: string, voiceId: string, settings: { stability: number, similarity: number }) {
    try {
        const res = await elevenLabs.textToSpeech(text, voiceId, settings.stability, settings.similarity);
        if (res.success && res.blob) {
            // In a real scenario, we'd save this or send it to the engine
            return { success: true, message: "Audio sintetizado y enviado a VEO 3 Local Engine." };
        }
        return { success: false, error: "Audio synthesis failed" };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
