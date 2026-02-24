"use server";

import { prisma } from "../../../lib/prisma";
import { ResearchOrchestrator } from "../../../lib/research/research-orchestrator";
import { generateStaticAdsFromResearchAction as generateStaticAds } from "../static-ads/actions";
import { generateProLayout, pushToShopify } from "../../marketing/landing-lab/actions";
// DriveSync will be imported dynamically

export async function launchMVPRapidly(storeId: string, data: {
    title: string;
    description: string;
    imageUrl?: string;
    country: string;
    niche?: string;
    unitCost: number;
    shippingCost: number;
    returnCost: number;
    vatPercent: number;
    isCod: boolean;
}) {
    console.log(`🚀 [MVP Rapid Launch] Starting for: ${data.title}`);

    try {
        // 1. Create Product
        const product = await prisma.product.create({
            data: {
                storeId,
                title: data.title,
                description: data.description,
                imageUrl: data.imageUrl,
                unitCost: data.unitCost,
                shippingCost: data.shippingCost,
                returnCost: data.returnCost,
                vatPercent: data.vatPercent,
                status: 'ACTIVE',
                tags: `${data.country}, ${data.niche || 'General'}, ${data.isCod ? 'COD' : 'PREPAID'}`
            }
        });

        // 2. Start Deep Research (Async/Background-ish but we wait for essential part)
        const orchestrator = new ResearchOrchestrator(product.id);
        const researchResult = await orchestrator.runFullResearch();

        // 3. Generate Ads (Static variants)
        await generateStaticAds(product.id);

        // 4. Generate Landing Landing Pages
        const layout = await generateProLayout({
            type: 'PRODUCT_PAGE',
            productId: product.id,
            useProSections: true
        });

        // 5. Drive Sync
        try {
            const googleConn = await prisma.connection.findFirst({
                where: { provider: "GOOGLE", isActive: true }
            });

            if (googleConn && googleConn.accessToken) {
                const { DriveSync } = await import("../../../lib/research/drive-sync");
                const ds = new DriveSync(googleConn.accessToken, googleConn.apiSecret || undefined);
                await ds.createProductStructure(product.id, data.title);
            }
        } catch (e) {
            console.error("Drive Sync failed, continuing...", e);
        }

        return {
            success: true,
            productId: product.id,
            runId: 'runId' in researchResult ? researchResult.runId : undefined
        };

    } catch (error: any) {
        console.error("🛑 [MVP Rapid Launch] FAILED:", error);
        return { success: false, error: error.message };
    }
}
