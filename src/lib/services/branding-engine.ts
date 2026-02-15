
import { prisma } from "@/lib/prisma";

export interface BrandingProfile {
    brandVoice: string;
    targetAudience: string;
    usps: string[];
    adAngles: string[];
    visualGuidelines?: string;
}

export class BrandingEngine {
    static async getProfile(productId: string) {
        return await (prisma as any).productBranding.findUnique({
            where: { productId }
        });
    }

    static async saveProfile(productId: string, data: BrandingProfile) {
        return await (prisma as any).productBranding.upsert({
            where: { productId },
            create: {
                productId,
                brandVoice: data.brandVoice,
                targetAudience: data.targetAudience,
                usps: JSON.stringify(data.usps),
                adAngles: JSON.stringify(data.adAngles),
                visualGuidelines: data.visualGuidelines
            },
            update: {
                brandVoice: data.brandVoice,
                targetAudience: data.targetAudience,
                usps: JSON.stringify(data.usps),
                adAngles: JSON.stringify(data.adAngles),
                visualGuidelines: data.visualGuidelines,
                updatedAt: new Date()
            }
        });
    }

    /**
     * Blueprint for AI Generation (Placeholder for future automation)
     */
    static async generateDraftProfile(productId: string, productDescription: string) {
        // This will eventually call Gemini to generate a branding profile
        // For now, it returns a template based on the description
        return {
            brandVoice: "Profesional, directo y orientado a resultados.",
            targetAudience: "Personas interesadas en la eficiencia y el bienestar.",
            usps: ["Fácil de usar", "Resultados rápidos", "Calidad premium"],
            adAngles: ["Ahorra tiempo", "Mejora tu estilo de vida", "Garantía de satisfacción"]
        };
    }
}
