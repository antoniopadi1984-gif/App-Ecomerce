import Replicate from "replicate";
import { prisma } from '@/lib/prisma';
import { REPLICATE_MODELS } from '../ai/replicate-models';
import { ElevenLabsService } from './elevenlabs-service';
import { uploadFileFromUrl, getOrCreateFolder } from '../google-drive';
import { getConnectionSecret } from '@/lib/server/connections';
import { google } from "googleapis";
import { getGoogleAuth } from '../google-auth';

export class AvatarPackService {
    private static async getReplicateClient(): Promise<Replicate> {
        const token = await getConnectionSecret('store-main', 'REPLICATE') || process.env.REPLICATE_API_TOKEN;
        if (!token) throw new Error("REPLICATE_API_TOKEN missing");
        return new Replicate({ auth: token });
    }

    private static async getDriveClient() {
        const auth = await getGoogleAuth('store-main');
        return google.drive({ version: "v3", auth });
    }

    static async generatePack(avatarId: string, productId: string, storeId: string) {
        const avatar = await (prisma as any).avatarProfile.findUnique({
            where: { id: avatarId },
            include: { product: true }
        });
        if (!avatar) throw new Error("Avatar not found");

        const replicate = await this.getReplicateClient();
        const drive = await this.getDriveClient();

        // 1. Get/Create Folder for this avatar
        const product = await (prisma as any).product.findUnique({ where: { id: productId } });
        if (!product?.driveRootPath) throw new Error("Product Drive structure missing");
        const structure = JSON.parse(product.driveRootPath as string);

        // Root for avatars is assetsGlobales.avatares
        // Adjusting folder name to follow 05_AVATARES_IA convention if needed, 
        // but structure.assetsGlobales.avatares is already the ID of the 'AVATARES_IA' folder.
        const avatarFolderName = `${avatar.avatarId || avatar.name.toUpperCase().replace(/\s+/g, '_')}`;
        const avatarFolderId = await getOrCreateFolder(avatarFolderName, structure.assetsGlobales.avatares);

        // --- 2. Generate Base Photos (Flux Kontext Pro) ---
        console.log(`[AvatarPack] Processing base photo for ${avatar.name}...`);

        let frontalUrl = avatar.imageUrl;

        if (!frontalUrl) {
            // IA_SCRATCH or no image provided
            const frontalPrompt = `Cinematic photo portrait of ${avatar.name}, a person with ${avatar.promptDNA || 'professional appearance'}, frontal view, neutral light grey studio background, high resolution, 8k, looking at camera.`;
            const frontalOutput: any = await replicate.run(REPLICATE_MODELS.IMAGE.FLUX_KONTEXT_PRO as any, { input: { prompt: frontalPrompt, aspect_ratio: "3:4" } });
            frontalUrl = Array.isArray(frontalOutput) ? frontalOutput[0] : frontalOutput;
        } else if (avatar.promptDNA?.includes('REAL_PHOTOS')) {
            // REAL_PHOTOS: Use identity keeping logic
            const frontalPrompt = `Cinematic photo portrait of the person in the reference image, high-end photography, maintaining facial identity but in a neutral studio background, professional lighting, high resolution.`;
            const frontalOutput: any = await replicate.run(REPLICATE_MODELS.IMAGE.FLUX_KONTEXT_PRO as any, {
                input: {
                    prompt: frontalPrompt,
                    image: frontalUrl,
                    prompt_strength: 0.6,
                    aspect_ratio: "3:4"
                }
            });
            frontalUrl = Array.isArray(frontalOutput) ? frontalOutput[0] : frontalOutput;
        }

        if (!frontalUrl) throw new Error("Failed to obtain base frontal photo");

        // Photo 3/4 Profile
        console.log(`[AvatarPack] Generating 3/4 profile...`);
        const profilePrompt = `Cinematic photo portrait of the same person from ${frontalUrl}, 3/4 profile view, same lighting, same clothes, high resolution.`;
        const profileOutput: any = await replicate.run(REPLICATE_MODELS.IMAGE.FLUX_KONTEXT_PRO as any, { input: { prompt: profilePrompt, image: frontalUrl, aspect_ratio: "3:4" } });
        const profileUrl = Array.isArray(profileOutput) ? profileOutput[0] : profileOutput;

        // Photo Lifestyle
        console.log(`[AvatarPack] Generating lifestyle...`);
        const lifestylePrompt = `Lifestyle photo of the same person from ${frontalUrl} in a modern context, professional environment, high resolution.`;
        const lifestyleOutput: any = await replicate.run(REPLICATE_MODELS.IMAGE.FLUX_KONTEXT_PRO as any, { input: { prompt: lifestylePrompt, image: frontalUrl, aspect_ratio: "16:9" } });
        const lifestyleUrl = Array.isArray(lifestyleOutput) ? lifestyleOutput[0] : lifestyleOutput;

        // --- 3. Generate Video Greeting (3s) using OmniHuman ---
        console.log(`[AvatarPack] Generating 3s greeting with OmniHuman...`);
        const greetingAudio = await ElevenLabsService.textToSpeech(`Hola, soy ${avatar.name}.`, avatar.voiceId || '21m00Tcm4TlvDq8ikWAM');

        const greetingVideo: any = await replicate.run(REPLICATE_MODELS.AVATAR.OMNI_HUMAN as any, {
            input: {
                image: frontalUrl,
                audio: `data:audio/mpeg;base64,${greetingAudio.toString('base64')}`,
                text: `Hola, soy ${avatar.name}`
            }
        });
        const greetingUrl = Array.isArray(greetingVideo) ? greetingVideo[0] : greetingVideo;

        // --- 4. Generate Video "Pointing/Using Product" (3s) ---
        console.log(`[AvatarPack] Generating 3s product interaction...`);
        const productVideo: any = await replicate.run(REPLICATE_MODELS.AVATAR.OMNI_HUMAN as any, {
            input: {
                image: frontalUrl,
                prompt: "person smiling and pointing at a product on the side, friendly, professional",
                duration: 3
            }
        });
        const productInteractionUrl = Array.isArray(productVideo) ? productVideo[0] : productVideo;

        // --- 5. Generate Expressions (Happiness, Surprise, Skepticism, Confidence, Urgency) ---
        const expressionTypes = [
            { type: 'EXPRESSION_HAPPINESS', name: 'Happiness', prompt: 'showing great happiness and joy', duration: 2 },
            { type: 'EXPRESSION_SURPRISE', name: 'Surprise', prompt: 'looking surprised and amazed', duration: 2 },
            { type: 'EXPRESSION_SKEPTICISM', name: 'Skepticism', prompt: 'looking skeptical and curious', duration: 2 },
            { type: 'EXPRESSION_CONFIDENCE', name: 'Confidence', prompt: 'looking confident and authoritative', duration: 2 },
            { type: 'EXPRESSION_URGENCY', name: 'Urgency', prompt: 'looking urgent and concerned', duration: 2 }
        ];

        const generatedExpressions: any[] = [];
        for (const exp of expressionTypes) {
            console.log(`[AvatarPack] Generating expression: ${exp.name}...`);
            const expVideo: any = await replicate.run(REPLICATE_MODELS.AVATAR.OMNI_HUMAN as any, {
                input: {
                    image: frontalUrl,
                    prompt: `person ${exp.prompt}`,
                    duration: exp.duration
                }
            });
            generatedExpressions.push({ ...exp, url: Array.isArray(expVideo) ? expVideo[0] : expVideo });
        }

        // --- 6. Save All Assets to Drive & DB ---
        const assetsToGenerate = [
            { type: 'FRONTAL_PHOTO', url: frontalUrl, name: '01_FOTO_FRONTAL.jpg', mimeType: 'image/jpeg' },
            { type: 'PROFILE_PHOTO', url: profileUrl, name: '02_FOTO_PERFIL_34.jpg', mimeType: 'image/jpeg' },
            { type: 'LIFESTYLE_PHOTO', url: lifestyleUrl, name: '03_FOTO_LIFESTYLE.jpg', mimeType: 'image/jpeg' },
            { type: 'GREETING_CLIP', url: greetingUrl, name: '04_CLIP_SALUDO.mp4', mimeType: 'video/mp4' },
            { type: 'PRODUCT_CLIP', url: productInteractionUrl, name: '05_CLIP_PRODUCTO.mp4', mimeType: 'video/mp4' },
            { type: 'STATIC_FRAME', url: frontalUrl, name: '06_FRAME_ESTATICO.jpg', mimeType: 'image/jpeg' }, // Using frontal as best frame
        ];

        // Add expressions
        generatedExpressions.forEach((exp, idx) => {
            assetsToGenerate.push({
                type: exp.type,
                url: exp.url,
                name: `07_EXPRESION_${exp.name.toUpperCase()}.mp4`,
                mimeType: 'video/mp4'
            });
        });

        for (const asset of assetsToGenerate) {
            console.log(`[AvatarPack] Uploading ${asset.name} to Drive...`);
            const driveFileId = await uploadFileFromUrl(asset.url, asset.name, avatarFolderId, asset.mimeType);

            await (prisma as any).avatarAsset.create({
                data: {
                    avatarProfileId: avatar.id,
                    productId,
                    type: asset.type,
                    url: asset.url,
                    driveFileId,
                    mime: asset.mimeType,
                    pathLocal: `https://drive.google.com/open?id=${driveFileId}`
                }
            });
        }


        // --- 7. Update Avatar Profile to ACTIVE ---
        await (prisma as any).avatarProfile.update({
            where: { id: avatarId },
            data: {
                imageUrl: frontalUrl,
                status: 'ACTIVE'
            }
        });

        console.log(`[AvatarPack] Successfully generated full pack for ${avatar.name}`);
        return { success: true, avatarFolderId };
    }
}
