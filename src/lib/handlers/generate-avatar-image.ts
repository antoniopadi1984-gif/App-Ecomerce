
import { JobHandler } from "../worker";
import prisma from "../prisma";
import fs from "fs";
import path from "path";

const generateAvatarImageHandler: JobHandler = {
    handle: async (payload, onProgress) => {
        const { avatarProfileId } = payload;
        if (!avatarProfileId) throw new Error("Missing avatarProfileId in payload");

        const db = prisma as any;

        // 1. Initial Status Update
        try {
            await db.avatarProfile.update({
                where: { id: avatarProfileId },
                data: { status: 'GENERATING_IMAGE', lastError: null }
            });
        } catch (e) {
            console.log(`⚠️ [Worker] Could not update status for ${avatarProfileId} (likely deleted).`);
            return { success: false, error: "Profile deleted" };
        }
        await onProgress(10);

        // 2. Get Profile Data
        const profile = await db.avatarProfile.findUnique({
            where: { id: avatarProfileId }
        });
        if (!profile) {
            console.log(`⚠️ [Worker] Profile ${avatarProfileId} no longer exists. Skipping job.`);
            return { success: false, error: "Profile deleted" };
        }

        try {
            // 3. Call Python Engine
            const metadata = JSON.parse(profile.metadataJson || "{}");
            const traits = metadata.traits || {};
            const customPrompt = metadata.customPrompt || "";

            const formData = new URLSearchParams();
            formData.append("name", profile.name);
            formData.append("sex", profile.sex);
            formData.append("ageRange", profile.ageRange || "25");
            formData.append("country", profile.region || "Global");

            // Inyectar modificadores ultra-realistas
            const baseStyle = "photorealistic, 8k resolution, raw photo, highly detailed skin textures, cinematic lighting, masterpiece, sharp focus";
            formData.append("style", customPrompt ? `${customPrompt}, ${baseStyle}` : baseStyle);

            formData.append('hasGreyHair', (traits.hasGreyHair || false).toString());
            formData.append('hasWrinkles', (traits.hasWrinkles || false).toString());
            formData.append('hasAcne', (traits.hasAcne || false).toString());
            if (profile.evolutionStage) formData.append('evolutionStage', profile.evolutionStage);
            if (metadata.voiceId) formData.append('voiceId', metadata.voiceId);

            console.log(`🚀 [Worker] Requesting image generation for: ${profile.name}`);
            const engineRes = await fetch("http://localhost:8000/avatar/image", {
                method: "POST",
                body: formData
            });

            if (!engineRes.ok) throw new Error(`Engine Error: ${engineRes.statusText}`);
            const engineData = await engineRes.json();

            if (!engineData.success) throw new Error(engineData.error || "Generation failed in engine");
            await onProgress(60);

            // 4. Handle Asset Storage
            const avatarDir = path.resolve(process.cwd(), "data", "avatars", avatarProfileId);
            if (!fs.existsSync(avatarDir)) fs.mkdirSync(avatarDir, { recursive: true });

            const localPath = path.join(avatarDir, "avatar.png");
            const publicPath = `/api/avatars/asset/${avatarProfileId}`; // Internal API route

            // Download real asset from engine or simulate if it's a mock url
            // In this specific system, /static in the engine is often available or we fetch it.
            let imageUrl = engineData.preview_url;
            if (imageUrl.startsWith("/")) {
                imageUrl = `http://localhost:8000${imageUrl}`;
            }

            console.log(`📥 [Worker] Downloading asset from: ${imageUrl}`);
            const imgRes = await fetch(imageUrl);
            if (!imgRes.ok) throw new Error("Failed to download generated image");

            const buffer = await imgRes.arrayBuffer();
            fs.writeFileSync(localPath, Buffer.from(buffer));
            await onProgress(90);

            // 5. Update DB (Asset + Profile)
            await db.avatarAsset.create({
                data: {
                    avatarProfileId,
                    type: "AVATAR_IMAGE",
                    pathLocal: publicPath,
                    mime: "image/png"
                }
            });

            if (!publicPath) throw new Error("Generated Image URL is empty");

            await db.avatarProfile.update({
                where: { id: avatarProfileId },
                data: {
                    status: 'READY_IMAGE',
                    imageUrl: publicPath // Update main image for quick access
                }
            });

            await onProgress(100);
            return { success: true, localPath: publicPath };

        } catch (error: any) {
            console.error(`❌ [Worker] Generation Job Failed:`, error.message);

            await db.avatarProfile.update({
                where: { id: avatarProfileId },
                data: {
                    status: 'FAILED_IMAGE',
                    lastError: error.message
                }
            });

            throw error; // Re-throw to mark job as FAILED
        }
    }
};

export default generateAvatarImageHandler;
