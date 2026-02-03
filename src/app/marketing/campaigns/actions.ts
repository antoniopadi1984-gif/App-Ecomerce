"use server";

import prisma from "@/lib/prisma";
import { MetaAdsClient } from "@/lib/meta-ads";

export async function getCampaignAnalytics() {
    // 1. Fetch Active Meta Connection
    const connection = await prisma.connection.findFirst({
        where: {
            OR: [{ provider: "FACEBOOK" }, { provider: "META" }],
            isActive: true
        }
    });

    let fbCampaigns: any[] = [];
    let isConnected = false;

    if (connection && connection.apiKey && connection.extraConfig) {
        try {
            // Assume extraConfig might be the ID directly or a JSON {"adAccountId": "..."}
            let adAccountId = connection.extraConfig;
            if (adAccountId.trim().startsWith("{")) {
                const json = JSON.parse(adAccountId);
                adAccountId = json.adAccountId || json.adAccount || adAccountId;
            }

            const meta = new MetaAdsClient(connection.apiKey, adAccountId);
            fbCampaigns = await meta.getCampaignInsights(30);
            isConnected = true;
        } catch (e) {
            console.error("Failed to fetch Meta Ads data:", e);
        }
    }

    // 2. Fetch Local Orders with UTM parameters (Shopify Attribution - Source of Truth for Revenue)
    const orders = await prisma.order.findMany({
        where: {
            OR: [
                { campaign: { not: null } },
                { source: { contains: "facebook" } },
                { source: { contains: "instagram" } },
                { source: { contains: "meta" } }
            ],
            status: { not: "CANCELLED" } // Only valid orders
        },
        select: {
            id: true,
            totalPrice: true,
            createdAt: true,
            campaign: true,
            source: true,
            medium: true,
            content: true, // Often used for Creative
            term: true,    // Often used for AdSet
        },
        orderBy: { createdAt: 'desc' }
    });

    // 3. Merge Datasets
    // We create a map where Key = Normalized Campaign Name
    const analysisMap = new Map<string, any>();

    // A. Populate with Facebook Data first (Source of Cost)
    fbCampaigns.forEach(fb => {
        const key = fb.campaignName.trim(); // Exact match or fuzzy could be added
        analysisMap.set(key, {
            id: fb.campaignId,
            name: fb.campaignName,
            platform: "Meta Ads",
            spend: fb.spend,
            impressions: fb.impressions,
            clicks: fb.clicks,
            fbRevenue: fb.revenue, // Pixel revenue (for reference)
            revenue: 0, // Will fill with Shopify
            orders: 0,
            source: "connected"
        });
    });

    // B. Merge Shopify Data (Source of Revenue)
    orders.forEach(order => {
        const campName = order.campaign || "Unknown Facebook Campaign";
        // Try to find matching FB Campaign
        // Simple strategy: check if map has the key, or if any key includes this UTM string
        let matchKey: string | undefined = undefined;

        if (analysisMap.has(campName)) {
            matchKey = campName;
        } else {
            // Fuzzy Search: keys containing the UTM or vice versa
            for (const [key, val] of analysisMap.entries()) {
                if (key.toLowerCase().includes(campName.toLowerCase()) || campName.toLowerCase().includes(key.toLowerCase())) {
                    matchKey = key;
                    break;
                }
            }
        }

        if (matchKey) {
            // Associated with existing FB Campaign
            const entry = analysisMap.get(matchKey);
            entry.revenue += order.totalPrice;
            entry.orders += 1;
        } else {
            // New entry (Organic or Untracked Campaign)
            if (!analysisMap.has(campName)) {
                analysisMap.set(campName, {
                    id: `local-${campName}`,
                    name: campName,
                    platform: order.source || "organic/other",
                    spend: 0, // No spend data if not in FB API
                    impressions: 0,
                    clicks: 0,
                    fbRevenue: 0,
                    revenue: 0,
                    orders: 0,
                    source: "local"
                });
            }
            const entry = analysisMap.get(campName);
            entry.revenue += order.totalPrice;
            entry.orders += 1;
        }
    });

    // 4. Calculate Final Metrics & Generate Opinion
    const finalCampaigns = Array.from(analysisMap.values())
        // Filter out tiny artifacts
        .filter(c => c.spend > 0 || c.revenue > 0)
        .map(c => {
            c.roas = c.spend > 0 ? c.revenue / c.spend : (c.revenue > 0 ? 99 : 0); // 99 indicates ∞ (organic)
            c.cpa = c.orders > 0 ? c.spend / c.orders : 0;
            c.cpc = c.clicks > 0 ? c.spend / c.clicks : 0;
            c.ctr = c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0;
            c.expertOpinion = generateMediaBuyerOpinion(c);
            return c;
        })
        .sort((a, b) => b.roas - a.roas); // Sort by ROAS descending

    return finalCampaigns;
}

function generateMediaBuyerOpinion(camp: any): string {
    if (camp.spend === 0 && camp.revenue > 0) return "🔥 Retorno Orgánico puro. Escalar creatividades similares en Paid.";
    if (camp.spend === 0) return "Sin datos de gasto.";

    if (camp.roas > 4) return "🚀 **ESCALA AGRESIVA**: ROAS excepcional. Aumentar presupuesto 20% cada 48h. Duplicar adsets ganadores.";
    if (camp.roas > 2.5) return "✅ **Rentable**: Zona de confort. Mantener y optimizar creatividades con bajo CTR.";
    if (camp.roas > 1.5) return "⚠️ **Vigilar**: ROAS marginal. Revisar CPC y Frecuencia. Si lleva >5 días así, matar anuncios caros.";
    if (camp.roas > 0.5) return "🛑 **KILL ZONE**: Apagar inmediatamente si ha gastado >1.5x CPA objetivo sin ventas claras.";

    return "💀 **MUERTA**: Quemando dinero. Pausar AdSets y replantear ángulo creativo.";
}
