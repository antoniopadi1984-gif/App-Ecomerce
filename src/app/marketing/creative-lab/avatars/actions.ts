"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { askGemini } from "@/lib/ai";

/**
 * Avatar Lab: Visual Identity Generation
 */
export async function createAvatar(storeId: string, data: { name: string, sex: string, ageRange: string, region: string }) {
    try {
        // 1. Prompt Gemini to generate a HIGH-QUALITY Image Prompt for "Nano Banana"
        const promptGen = `
            Genera un prompt fotorealista para una IA generadora de imágenes (Nano Banana).
            Persona: ${data.sex === 'MALE' ? 'Hombre' : 'Mujer'} de ${data.ageRange}, de la región de ${data.region}.
            Estilo: Retrato profesional, iluminación de estudio, fondo neutro, ropa casual premium, mirada segura a cámara.
            
            RESPONDE SOLO CON EL PROMPT EN INGLÉS.
        `;
        const visualPrompt = await askGemini(promptGen, "Eres un experto en Prompts visuales para Midjourney y Nano Banana.");

        // 2. Generate Image (Simulation: In a real app we would call DALL-E/Flux/NanoBanana API here)
        // For now, we use a placeholder or a generated path
        const fileName = `avatar_${Date.now()}.png`;
        const imageUrl = `/uploads/avatars/${fileName}`; // Real integration would save the file here

        // 3. Save to DB
        const avatar = await (prisma as any).avatarProfile.create({
            data: {
                storeId,
                name: data.name,
                sex: data.sex,
                ageRange: data.ageRange,
                region: data.region,
                imageUrl,
                status: 'READY',
                metadataJson: JSON.stringify({ visualPrompt: visualPrompt.text })
            }
        });

        revalidatePath("/marketing/creative-lab/avatars");
        return avatar;
    } catch (error: any) {
        console.error("🛑 [AvatarLab] Error:", error.message);
        throw new Error(`Error al crear avatar: ${error.message}`);
    }
}

export async function getAvatarProfiles(storeId: string) {
    return await (prisma as any).avatarProfile.findMany({
        where: { storeId },
        orderBy: { createdAt: 'desc' }
    });
}

export async function deleteAvatarProfile(id: string) {
    await (prisma as any).avatarProfile.delete({ where: { id } });
    revalidatePath("/marketing/creative-lab/avatars");
}
