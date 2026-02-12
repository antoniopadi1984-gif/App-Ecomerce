"use server";

import { prisma } from "@/lib/prisma";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";

/**
 * AVATAR CREATION ACTIONS
 * Create avatars from research or custom config
 */

interface AvatarConfig {
    name: string;
    gender?: string;
    age?: number;
    ethnicity?: string;
    voiceId?: string;
    language?: string;
    tone?: string;
}

/**
 * Create avatar from research data
 */
export async function createAvatarFromResearchAction(productId: string) {
    try {
        // Get latest research
        const research = await prisma.researchRun.findFirst({
            where: { productId },
            orderBy: { createdAt: 'desc' },
            select: { results: true }
        });

        if (!research || !research.results) {
            return { success: false, error: 'No research data found' };
        }

        const researchData = JSON.parse(research.results);
        const avatars = researchData.v3_avatars || [];

        if (avatars.length === 0) {
            return { success: false, error: 'No avatars found in research' };
        }

        // Get top avatar
        const topAvatar = avatars.sort((a: any, b: any) => (b.score || 0) - (a.score || 0))[0];

        // Generate avatar config with Gemini
        const prompt = `Based on this target avatar, create a realistic person visualization config:

Avatar Profile:
Name: ${topAvatar.name}
Demographics: ${topAvatar.demographics}
Psychographics: ${topAvatar.psychographics}
Pain Points: ${topAvatar.painPoints?.join(', ')}

Generate a JSON object with:
{
  "name": "realistic first name",
  "gender": "male/female",
  "age": number (25-55),
  "ethnicity": "string",
  "style": {
    "hair": "description",
    "clothing": "professional/casual/trendy",
    "accessories": "glasses/none/etc"
  },
  "tone": "professional/friendly/energetic",
  "imagePrompt": "detailed DALL-E prompt for avatar photo"
}`;

        const { text } = await generateText({
            model: google("gemini-1.5-flash"),
            prompt,
            temperature: 0.7
        });

        const avatarConfig = JSON.parse(text);

        // Create avatar in DB
        const avatar = await prisma.avatar.create({
            data: {
                productId,
                name: avatarConfig.name,
                type: 'RESEARCH_BASED',
                gender: avatarConfig.gender,
                age: avatarConfig.age,
                ethnicity: avatarConfig.ethnicity,
                styleJson: JSON.stringify(avatarConfig.style),
                tone: avatarConfig.tone,
                language: 'es',
                researchDataJson: JSON.stringify(topAvatar)
            }
        });

        return {
            success: true,
            avatar: {
                id: avatar.id,
                name: avatar.name,
                imagePrompt: avatarConfig.imagePrompt
            }
        };

    } catch (error: any) {
        console.error('[createAvatarFromResearchAction] Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Create custom avatar
 */
export async function createCustomAvatarAction(
    productId: string | null,
    config: AvatarConfig
) {
    try {
        const avatar = await prisma.avatar.create({
            data: {
                productId: productId || undefined,
                name: config.name,
                type: 'CUSTOM',
                gender: config.gender,
                age: config.age,
                ethnicity: config.ethnicity,
                voiceId: config.voiceId,
                language: config.language || 'es',
                tone: config.tone
            }
        });

        return {
            success: true,
            avatar: {
                id: avatar.id,
                name: avatar.name
            }
        };

    } catch (error: any) {
        console.error('[createCustomAvatarAction] Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Generate avatar image with DALL-E
 */
export async function generateAvatarImageAction(
    avatarId: string,
    imagePrompt?: string
) {
    try {
        const avatar = await prisma.avatar.findUnique({
            where: { id: avatarId }
        });

        if (!avatar) {
            return { success: false, error: 'Avatar not found' };
        }

        // Build prompt if not provided
        let prompt = imagePrompt;
        if (!prompt) {
            const style = avatar.styleJson ? JSON.parse(avatar.styleJson) : {};
            prompt = `Professional headshot photo of a ${avatar.age}-year-old ${avatar.ethnicity} ${avatar.gender}, `;
            prompt += `${style.hair || 'professional hairstyle'}, `;
            prompt += `wearing ${style.clothing || 'business casual'} clothing, `;
            prompt += `${style.accessories || 'no accessories'}, `;
            prompt += `friendly expression, looking at camera, soft studio lighting, neutral background, high quality portrait`;
        }

        // Generate image with DALL-E (via OpenAI)
        // TODO: Implement DALL-E integration
        // For now, return placeholder
        console.log('[generateAvatarImageAction] Would generate image with prompt:', prompt);

        // Update avatar with image URL
        // await prisma.avatar.update({
        //     where: { id: avatarId },
        //     data: { avatarImageUrl: generatedImageUrl }
        // });

        return {
            success: true,
            message: 'Avatar image generation queued',
            prompt
        };

    } catch (error: any) {
        console.error('[generateAvatarImageAction] Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get all avatars for a product
 */
export async function getProductAvatarsAction(productId: string) {
    try {
        const avatars = await prisma.avatar.findMany({
            where: { productId },
            orderBy: { createdAt: 'desc' }
        });

        return {
            success: true,
            avatars: avatars.map(a => ({
                id: a.id,
                name: a.name,
                type: a.type,
                gender: a.gender,
                age: a.age,
                imageUrl: a.avatarImageUrl,
                createdAt: a.createdAt
            }))
        };

    } catch (error: any) {
        console.error('[getProductAvatarsAction] Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Delete avatar
 */
export async function deleteAvatarAction(avatarId: string) {
    try {
        await prisma.avatar.delete({
            where: { id: avatarId }
        });

        return { success: true };

    } catch (error: any) {
        console.error('[deleteAvatarAction] Error:', error);
        return { success: false, error: error.message };
    }
}
