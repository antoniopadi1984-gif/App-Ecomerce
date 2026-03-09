import { prisma } from '@/lib/prisma';

export interface AvatarMetricsSummary {
    avgCTR: number;
    avgCPA: number;
    avgROAS: number;
    avgHookRate: number;
    activeCreativesCount: number;
    totalCreatives: number;
    badges: string[];
    isBestAvatar: boolean;
}

export class AvatarPerformanceService {
    static async getPerformance(avatarId: string, productId?: string) {
        const creatives = await (prisma as any).creativeAsset.findMany({
            where: { avatarId },
            include: { concept: true }
        });

        if (creatives.length === 0) {
            return {
                summary: {
                    avgCTR: 0,
                    avgCPA: 0,
                    avgROAS: 0,
                    avgHookRate: 0,
                    activeCreativesCount: 0,
                    totalCreatives: 0,
                    badges: [],
                    isBestAvatar: false
                },
                creatives: []
            };
        }

        let totalSpend = 0;
        let totalRevenue = 0;
        let totalPurchases = 0;
        let totalClicks = 0;
        let totalHookRate = 0;
        let activeCount = 0;

        creatives.forEach((c: any) => {
            totalSpend += c.spend || 0;
            totalRevenue += c.revenue || 0;
            totalPurchases += c.purchases || 0;
            totalClicks += c.ctr ? (c.ctr * 1000) : 0; // Simplified for avg
            totalHookRate += c.hookRate || 0;
            if (c.processingStatus === 'DONE') activeCount++;
        });

        const avgCTR = creatives.reduce((acc: number, c: any) => acc + (c.ctr || 0), 0) / creatives.length;
        const avgCPA = totalPurchases > 0 ? totalSpend / totalPurchases : 0;
        const avgROAS = totalSpend > 0 ? totalRevenue / totalSpend : 0;
        const avgHookRate = totalHookRate / creatives.length;

        // Badge logic
        const badges: string[] = [];
        if (creatives.length >= 5) {
            if (avgCTR > 0.02) badges.push('ALTO RENDIMIENTO');

            if (productId) {
                const finance = await (prisma as any).productFinance.findUnique({ where: { productId } });
                if (finance?.targetCPA && avgCPA > finance.targetCPA) {
                    badges.push('BAJO RENDIMIENTO');
                }
            }
        }

        // Top 1 logic (needs comparison with other avatars of the same product)
        let isBestAvatar = false;
        if (productId) {
            const otherAvatars = await (prisma as any).avatarProfile.findMany({
                where: { productId, NOT: { id: avatarId } },
                select: { id: true }
            });

            // This is simplified. In a real scenario, we would compare ROAS or CTR.
            // For now, let's say if no other avatars have more spend + revenue, it's best.
            isBestAvatar = badges.includes('ALTO RENDIMIENTO') && otherAvatars.length > 0;
        }

        return {
            summary: {
                avgCTR: parseFloat(avgCTR.toFixed(4)),
                avgCPA: parseFloat(avgCPA.toFixed(2)),
                avgROAS: parseFloat(avgROAS.toFixed(2)),
                avgHookRate: parseFloat(avgHookRate.toFixed(2)),
                activeCreativesCount: activeCount,
                totalCreatives: creatives.length,
                badges,
                isBestAvatar: badges.includes('ALTO RENDIMIENTO') // Placeholder for top 1
            },
            creatives: creatives.map((c: any) => ({
                id: c.id,
                nomenclatura: c.nomenclatura || c.id,
                concepto: c.concept?.name || c.conceptCode || 'N/A',
                fase: c.funnelStage || 'TOF',
                ctr: c.ctr || 0,
                cpa: c.purchases > 0 ? c.spend / c.purchases : 0,
                roas: c.spend > 0 ? c.revenue / c.spend : 0,
                hookRate: c.hookRate || 0,
                estado: c.processingStatus
            }))
        };
    }

    static async suggestAvatar(productId: string, funnelStage?: string, conceptType?: string) {
        const avatars = await (prisma as any).avatarProfile.findMany({
            where: { productId },
            include: {
                creativeAssets: {
                    where: {
                        AND: [
                            funnelStage ? { funnelStage } : {},
                            conceptType ? { conceptCode: conceptType } : {}
                        ]
                    }
                }
            }
        });

        if (avatars.length === 0) return null;

        // Rank by ROAS then CTR
        const ranked = avatars.map((a: any) => {
            const assets = a.creativeAssets;
            if (assets.length === 0) return { avatar: a, score: 0 };

            const avgCTR = assets.reduce((acc: number, c: any) => acc + (c.ctr || 0), 0) / assets.length;
            const totalSpend = assets.reduce((acc: number, c: any) => acc + (c.spend || 0), 0);
            const totalRevenue = assets.reduce((acc: number, c: any) => acc + (c.revenue || 0), 0);
            const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0;

            return { avatar: a, score: (roas * 10) + (avgCTR * 100) };
        }).sort((a: any, b: any) => b.score - a.score);

        if (ranked[0].score > 0) return ranked[0].avatar;

        // Psychographic fallback (placeholder logic)
        return avatars[0];
    }
}
