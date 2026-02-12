"use server";

import { prisma } from "@/lib/prisma";
import { askGemini } from "@/lib/ai";
import { revalidatePath } from "next/cache";

export async function constructOffer(productId: string, type: string) {
    try {
        const product = await (prisma as any).product.findUnique({
            where: { id: productId },
            include: { finance: true, avatars: { take: 1, orderBy: { createdAt: 'desc' } } }
        });

        const prompt = `
            Actúa como un Estratega de Ofertas Irresistibles.
            Diseña una oferta de tipo ${type} para el producto ${product.title}.
            Precio unitario: ${product.finance?.sellingPrice}.
            Costa unitario: ${product.finance?.unitCost}.
            
            NECESITO (JSON):
            {
               "name": "...",
               "structure": "2x1 / Pack Premium / ...",
               "price": 0,
               "psychologicalTriggers": ["Escasez", "Bonus digital", "..."],
               "avatarAligment": "Por qué esto atrae al avatar detectado",
               "profitSimulation": {
                  "gross": 0,
                  "estimatedNet": 0,
                  "riskLevel": "Bajo/Medio/Alto"
               }
            }
        `;

        const res = await askGemini(prompt, "Eres un genio de las ofertas.");
        const data = JSON.parse((res.text || "").match(/\{[\s\S]*\}/)?.[0] || "{}");

        // Save to PricingOffer
        const offer = await (prisma as any).pricingOffer.create({
            data: {
                storeId: product.storeId,
                productId,
                offerName: data.name,
                productName: product.title,
                salePrice: data.price,
                productCost: product.finance?.unitCost || 0,
                notes: data.avatarAligment,
                marginPercent: (data.profitSimulation.estimatedNet / data.price) * 100
            }
        });

        revalidatePath(`/marketing/offer-os`);
        return offer;
    } catch (e: any) {
        throw new Error(e.message);
    }
}

export async function getOffers(productId: string) {
    return await (prisma as any).pricingOffer.findMany({ where: { productId }, orderBy: { createdAt: 'desc' } });
}
