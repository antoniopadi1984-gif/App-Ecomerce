"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { MetaAdsClient } from "@/lib/meta-ads";

export async function syncMetaAdsMetrics() {
    try {
        const connection = await prisma.connection.findFirst({
            where: { provider: "META", isActive: true }
        });

        if (!connection || !connection.accessToken || !connection.extraConfig) {
            return { success: false, message: "No se encontró conexión activa con Meta Ads." };
        }

        const meta = new MetaAdsClient(connection.accessToken, connection.extraConfig);
        const insights = await meta.getAdInsights(30); // Last 30 days

        let updatedCount = 0;
        for (const ad of insights) {
            // Try to find a creative asset whose nomenclature or name matches the ad name
            // Meta often has ad names like "UGC_001_A"
            const creative = await prisma.creativeAsset.findFirst({
                where: {
                    OR: [
                        { nomenclatura: ad.adName },
                        { name: ad.adName }
                    ]
                }
            });

            if (creative) {
                await prisma.creativeAsset.update({
                    where: { id: creative.id },
                    data: {
                        spend: ad.spend,
                        ctr: ad.ctr,
                        // We keep the revenue/purchases from Shopify if they are more reliable,
                        // or we could blend them. Meta revenue is often estimated.
                    }
                });
                updatedCount++;
            }
        }

        revalidatePath("/marketing/creatives");
        return { success: true, message: `Sincronizados metrics de ${updatedCount} anuncios de Meta.` };
    } catch (error: any) {
        console.error("Meta Sync Error:", error);
        return { success: false, message: error.message };
    }
}

export async function getCreativeAssets() {
    try {
        const creatives = await prisma.creativeAsset.findMany({
            include: {
                product: { include: { finance: true } }
            },
            orderBy: {
                spend: 'desc'
            }
        });
        return { success: true, data: creatives };
    } catch (error) {
        console.error("Error fetching creatives:", error);
        return { success: false, error: "Failed to fetch creatives" };
    }
}

/**
 * GENERADOR DE NOMENCLATURA INTELIGENTE (Agente de Marketing Profundo)
 * Estructura: [PROD]-[ANGULO]-[CONCEPTO]-[VERSION]
 */
export async function generateSmartNomenclature(productId: string, angle?: string, concept?: string) {
    try {
        const product = await prisma.product.findUnique({
            where: { id: productId },
            select: { title: true }
        });

        if (!product) return "ERR";

        // Acrónimo ultra-corto (Ej: Nano Banana -> NB)
        const acronym = product.title
            .split(' ')
            .filter(w => w.length > 2)
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

        // Ángulo corto (Ej: Regalo -> R1, Problema -> P1) o 2 letras
        let activeAngle = "T0";
        if (angle) {
            activeAngle = angle.trim().slice(0, 2).toUpperCase();
        } else {
            const avatar = await prisma.avatarResearch.findFirst({
                where: { productId },
                orderBy: { createdAt: 'desc' }
            });
            if (avatar?.mainDesire) {
                activeAngle = avatar.mainDesire.trim().slice(0, 2).toUpperCase();
            }
        }

        // Concepto (Ej: UGC -> U, Stat -> S)
        const activeConcept = concept ? concept.trim().charAt(0).toUpperCase() : "1";

        const count = await prisma.creativeAsset.count({
            where: { productId }
        });

        const version = count + 1;

        // Formato final ultra-compacto: NB-R1-U1
        return `${acronym}-${activeAngle}${activeConcept}-V${version}`;
    } catch (e) {
        return "NOM-ERR";
    }
}

export async function createCreativeAsset(data: {
    name: string;
    type: string;
    productId: string;
    nomenclatura?: string;
    editor?: string;
    angulo?: string;
    driveUrl?: string;
}) {
    try {
        await prisma.creativeAsset.create({
            data: {
                name: data.name,
                type: data.type,
                productId: data.productId,
                nomenclatura: data.nomenclatura,
                editor: data.editor,
                angulo: data.angulo,
                driveUrl: data.driveUrl,
                // Initial metrics
                spend: 0,
                revenue: 0,
                purchases: 0,
                verdict: "TESTING"
            }
        });
        revalidatePath("/marketing/creatives");
        return { success: true };
    } catch (error) {
        console.error("Error creating creative:", error);
        return { success: false, error: "Failed to create creative" };
    }
}

export async function updateCreativeMetrics(id: string, metrics: {
    spend?: number;
    revenue?: number;
    purchases?: number;
    hookRate?: number;
    ctr?: number;
    verdict?: string;
}) {
    try {
        await prisma.creativeAsset.update({
            where: { id },
            data: {
                ...metrics
            }
        });
        revalidatePath("/marketing/creatives");
        return { success: true };
    } catch (error) {
        console.error("Error updating creative metrics:", error);
        return { success: false, error: "Failed to update metrics" };
    }
}

export async function getAvailableProducts() {
    try {
        const products = await prisma.product.findMany({
            select: { id: true, title: true }
        });
        return { success: true, data: products };
    } catch (error) {
        return { success: false, error: "Failed to fetch products" };
    }
}

export async function syncCreativeMetricsFromOrders() {
    try {
        const creatives = await prisma.creativeAsset.findMany();
        const orders = await prisma.order.findMany({
            where: {
                content: { not: null } // Only orders with UTM Content
            }
        });

        // Map nomenclature to metrics
        const metricsMap = new Map<string, { revenue: number, purchases: number }>();

        for (const order of orders) {
            if (!order.content) continue;
            // Clean UTM content string
            const utm = order.content.trim();
            const current = metricsMap.get(utm) || { revenue: 0, purchases: 0 };

            // Only count if confirmed/paid or delivered? 
            // For revenue usually we count valid orders.
            if (order.financialStatus === 'paid' || order.status === 'CONFIRMED' || order.logisticsStatus === 'Entregado') {
                current.revenue += order.totalPrice;
                current.purchases += 1;
            }
            metricsMap.set(utm, current);
        }

        // Update each creative
        for (const creative of creatives) {
            // Match nomenclature or name (fuzzy match if needed, but strict for now)
            const stats = metricsMap.get(creative.nomenclatura || creative.name) || metricsMap.get(creative.name); // Try nomenclature first then name

            if (stats) {
                await prisma.creativeAsset.update({
                    where: { id: creative.id },
                    data: {
                        revenue: stats.revenue,
                        purchases: stats.purchases
                    }
                });
            }
        }

        revalidatePath("/marketing/creatives");
        return { success: true, message: `Synced ${orders.length} orders to creatives.` };
    } catch (error) {
        console.error("Sync error:", error);
        return { success: false, error: "Sync failed" };
    }
}

/**
 * MASTER AI CONTEXT: Cotejar todos los datos (entregas, envios, cpc, roas real)
 */
export async function getAgentMarketPerformance() {
    try {
        const creatives = await prisma.creativeAsset.findMany({
            include: { product: { include: { finance: true } } }
        });

        const performanceData = creatives.map(c => {
            const f = c.product?.finance;
            const rev = c.revenue;
            const spend = c.spend;
            const purchases = c.purchases;

            // Break-even Calculations
            const marginPerUnit = (f?.sellingPrice || 0) - (f?.unitCost || 0) - (f?.shippingCost || 0);
            const breakEvenRoas = (f?.sellingPrice || 0) / (marginPerUnit || 1);
            const realRoas = spend > 0 ? rev / spend : 0;
            const targetCpa = f?.targetCPA || marginPerUnit;

            return {
                creative: c.name,
                nomenclatura: c.nomenclatura,
                spend,
                revenue: rev,
                roas: realRoas.toFixed(2),
                breakEvenRoas: breakEvenRoas.toFixed(2),
                cpa: purchases > 0 ? (spend / purchases).toFixed(2) : 0,
                targetCpa: targetCpa?.toFixed(2),
                verdict: c.verdict,
                status: realRoas > breakEvenRoas ? "PROFITABLE" : "LOSS"
            };
        });

        return { success: true, data: performanceData };
    } catch (e) {
        return { success: false, data: [] };
    }
}
