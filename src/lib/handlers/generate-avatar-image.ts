import { JobHandler } from "../worker";
import prisma from "../prisma";
import fs from "fs";
import path from "path";
import { replicateClient } from "../ai/replicate-client";
import { resolveModel } from "../ai/model-registry";

const generateAvatarImageHandler: JobHandler = {
    handle: async (payload, onProgress, jobId) => {
        const { avatarProfileId, tier = 'premium' } = payload;
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
            const metadata = JSON.parse(profile.metadataJson || "{}");
            const traits = metadata.traits || {};
            const customPrompt = metadata.customPrompt || "";

            // --- ADVANCED PROMPT ENGINEERING FOR FLUX PRO ---
            const gender = profile.sex === 'MALE' ? 'man' : 'woman';
            const age = profile.ageRange || "35";
            let region = profile.region || "";

            // Mapping common regions to adjectives
            const regionMap: Record<string, string> = {
                'España': 'Spanish',
                'Spain': 'Spanish',
                'Italia': 'Italian',
                'Italy': 'Italian',
                'Francia': 'French',
                'France': 'French',
                'Alemania': 'German',
                'Germany': 'German',
                'Portugal': 'Portuguese',
                'México': 'Mexican',
                'Mexico': 'Mexican',
                'EEUU': 'American',
                'USA': 'American'
            };

            const regionAdj = regionMap[region] || region;

            // Generate a random seed if none exists to force variation
            const seed = Math.floor(Math.random() * 1000000);

            let promptParts = [
                `High-end premium commercial portrait of a ${age} year old ${regionAdj} ${gender}.`,
                `Cinematic lighting, fashion photography style, professional studio background with soft bokeh, 8k resolution, masterpiece.`,
                `Sharp focus on eyes, highly detailed skin texture, pores visible, natural and hyper-realistic facial features.`,
                `Wearing stylish elegant clothing, professional and confident expression, looking directly into the camera.`
            ];

            if (traits.hasGreyHair) promptParts.push("Salt and pepper hair, visible grey roots, realistic hair texture.");
            if (traits.hasWrinkles) promptParts.push("Visible wrinkles, crow's feet, realistic aged skin patterns, fine lines around eyes and forehead.");
            if (traits.hasAcne) promptParts.push("Skin imperfections, visible acne scars, slight redness, textured skin with blemishes.");
            if (traits.hasHairLoss) promptParts.push("Receding hairline, thinning hair on top, visible scalp through hair, realistic balding pattern.");

            const skinTone = traits.skinTone || 'CLARO';
            promptParts.push(`${skinTone.toLowerCase()} skin tone.`);

            if (customPrompt) {
                promptParts.push(`Atmosphere: ${customPrompt}`);
            }

            const finalPrompt = promptParts.join(" ");

            // 3. Resolve Model
            const model = resolveModel('AVATAR_PORTRAIT', tier);

            // 4. Trigger Replicate Prediction
            console.log(`🚀 [Worker] Triggering REPLICATE for: ${profile.name} Tier: ${tier}`);
            const prediction = await replicateClient.createPrediction({
                jobId: avatarProfileId, // Using profileId as reference for the webhook
                ref: model.ref,
                version: model.version,
                input: {
                    prompt: finalPrompt,
                    aspect_ratio: "3:4",
                    output_format: "png",
                    output_quality: 100,
                    seed: seed
                },
                isImage: true
            });

            // 4.5. Store Prediction ID in Job record immediately for auditing
            await db.job.update({
                where: { id: jobId },
                data: {
                    replicatePredictionId: prediction.id,
                    provider: 'Replicate'
                }
            });

            await onProgress(80);

            // 5. Update Profile with Prediction ID
            await db.avatarProfile.update({
                where: { id: avatarProfileId },
                data: {
                    metadataJson: JSON.stringify({
                        ...metadata,
                        replicatePredictionId: prediction.id,
                        modelUsed: model.ref,
                        finalPrompt
                    })
                }
            });

            // 6. ROBUST FALLBACK: Wait for completion and finalize (Required for Local Dev)
            // Even if webhooks work, doing it here in the worker ensures completion
            console.log(`⏳ [Worker] Waiting for Replicate prediction ${prediction.id} to complete...`);
            const finalPrediction = await replicateClient.waitForPrediction(prediction.id);

            if (finalPrediction.status === 'succeeded' && finalPrediction.output) {
                console.log(`✅ [Worker] Prediction succeeded! Finalizing image for ${avatarProfileId}`);

                const output = finalPrediction.output;
                const primaryUrl = Array.isArray(output) ? output[0] : output;

                const storageDir = path.resolve(process.cwd(), "data", "avatars", avatarProfileId);
                const localPath = path.join(storageDir, "avatar.png");

                await replicateClient.downloadFile(primaryUrl, localPath);

                await db.avatarProfile.update({
                    where: { id: avatarProfileId },
                    data: {
                        imageUrl: `/api/avatars/asset/${avatarProfileId}`,
                        status: 'READY_IMAGE'
                    }
                });

                console.log(`✨ [Worker] Avatar ${avatarProfileId} is now READY.`);
            }

            await onProgress(100);
            return {
                success: true,
                predictionId: prediction.id,
                replicatePredictionId: prediction.id, // For Job worker auto-save
                provider: 'Replicate',
                status: 'READY_IMAGE'
            };

        } catch (error: any) {
            console.error(`❌ [Worker] Generation Job Failed:`, error.message);

            await db.avatarProfile.update({
                where: { id: avatarProfileId },
                data: {
                    status: 'FAILED_IMAGE',
                    lastError: error.message
                }
            });

            throw error;
        }
    }
};

export default generateAvatarImageHandler;
