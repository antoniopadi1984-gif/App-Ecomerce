"use server";

import prisma from "@/lib/prisma";
import { askGemini } from "@/lib/ai";

export async function getProducts() {
    try {
        const products = await prisma.product.findMany({
            select: { id: true, title: true }
        });
        return { success: true, products };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function generateStaticConcepts(productName: string, targetAudience: string, imageBase64?: string) {
    try {
        const prompt = `
            Actúa como un Director de Arte Sr. y Estratega de Creativos en Meta Ads.
            
            PRODUCTO: ${productName}
            AUDIENCIA: ${targetAudience}
            
            Tu tarea es generar 2 Conceptos de Anuncios Estáticos de Alto Impacto.
            Cada concepto debe incluir:
            - Un Hook Visual (Descripción detallada para un diseñador/IA).
            - Un Headline rompedor.
            - Un Ad Copy corto y persuasivo.
            - Un Ángulo de Marketing.
            - Un AI Prompt para Midjourney v6/DALL-E 3 para generar la imagen de fondo.

            FORMATO DE RESPUESTA: JSON PURO (Sin markdown).
            [
              {
                "id": 1,
                "hook": "...",
                "headline": "...",
                "copy": "...",
                "angle": "...",
                "prompt": "..."
              }
            ]
        `;

        const response = await askGemini(prompt, undefined, imageBase64);

        // Parsing logic (same as in deep research)
        const cleanAndParse = (text: string) => {
            try {
                // Remove potential markdown blocks
                let cleaned = text.trim();
                if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/^```json/, "");
                if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```/, "");
                if (cleaned.endsWith('```')) cleaned = cleaned.replace(/```$/, "");

                const firstBracket = cleaned.indexOf('[');
                const lastBracket = cleaned.lastIndexOf(']');

                if (firstBracket !== -1 && lastBracket !== -1) {
                    cleaned = cleaned.substring(firstBracket, lastBracket + 1);
                }

                return JSON.parse(cleaned);
            } catch (e) {
                console.error("JSON Parse Error:", e, text);
                return null;
            }
        };

        const parsed = cleanAndParse(response.text || "");
        if (!parsed) {
            console.error("Failed to parse response:", response.text);
            throw new Error("Error al procesar la respuesta de la IA. Inténtalo de nuevo o usa el modo Ahorro.");
        }

        return { success: true, concepts: parsed };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * TEMPLATE-BASED STATIC AD GENERATION
 * Quick generation using pre-built templates
 */

/**
 * Generate static ads from research using templates
 */
export async function generateStaticAdsFromResearchAction(
    productId: string,
    templateCount: number = 5
) {
    try {
        // Get product + research
        const product = await prisma.product.findUnique({
            where: { id: productId },
            select: {
                title: true,
                price: true,
                compareAtPrice: true,
                productImages: true
            }
        });

        if (!product) {
            return { success: false, error: 'Product not found' };
        }

        // Get latest research
        const research = await prisma.researchRun.findFirst({
            where: { productId },
            orderBy: { createdAt: 'desc' },
            select: { results: true }
        });

        const raw = research?.results;
        const researchData = typeof raw === 'string' ? JSON.parse(raw) : (raw || {});

        // Get random templates
        const templates = await prisma.creativeTemplate.findMany({
            take: templateCount,
            orderBy: { usageCount: 'asc' } // Use least used first
        });

        if (templates.length === 0) {
            return { success: false, error: 'No templates found. Run seed first.' };
        }

        // Generate ad for each template
        const createdAds = [];

        for (const template of templates) {
            const creative = await prisma.creative.create({
                data: {
                    productId,
                    type: 'STATIC',
                    subtype: 'AD',
                    title: `${template.name} - ${product.title}`,
                    funnelStage: template.funnelStage,
                    status: 'DRAFT',
                    dimensions: JSON.parse(template.supportedFormats || '["1080x1920"]')[0],
                    format: 'png'
                }
            });

            // Increment usage
            await prisma.creativeTemplate.update({
                where: { id: template.id },
                data: { usageCount: { increment: 1 } }
            });

            createdAds.push({
                id: creative.id,
                templateName: template.name,
                funnelStage: template.funnelStage
            });
        }

        return {
            success: true,
            message: `Generated ${createdAds.length} static ads`,
            ads: createdAds
        };

    } catch (error: any) {
        console.error('[generateStaticAdsFromResearchAction] Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get all creatives for a product
 */
export async function getProductCreativesAction(productId: string) {
    try {
        const creatives = await prisma.creative.findMany({
            where: { productId },
            include: {
                avatar: {
                    select: {
                        name: true,
                        avatarImageUrl: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return {
            success: true,
            creatives: creatives.map(c => ({
                id: c.id,
                type: c.type,
                title: c.title,
                funnelStage: c.funnelStage,
                status: c.status,
                assetUrl: c.assetUrl,
                thumbnailUrl: c.thumbnailUrl,
                avatar: c.avatar,
                dimensions: c.dimensions,
                createdAt: c.createdAt
            }))
        };

    } catch (error: any) {
        console.error('[getProductCreativesAction] Error:', error);
        return { success: false, error: error.message };
    }
}
