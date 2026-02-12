import { prisma } from '@/lib/prisma';

/**
 * Service para persistir creativos generados en la base de datos
 */
export class CreativeStorageService {

    /**
     * Guardar video generado
     */
    static async saveVideo(data: {
        productId?: string;
        storeId?: string;
        type: 'VIDEO';
        stage?: 'COLD' | 'WARM' | 'HOT';

        avatarUrl?: string;
        audioUrl?: string;
        videoUrl: string;
        thumbnailUrl?: string;
        captionsUrl?: string;

        concept: string;
        script?: string;
        prompt?: string;
        generatedBy?: string;

        generationCost: number;
    }) {
        console.log('[CreativeStorage] Saving video:', data.concept);

        const creative = await prisma.generatedCreative.create({
            data: {
                ...data,
                generatedBy: data.generatedBy || 'creative-factory',
                status: 'GENERATED'
            }
        });

        console.log('[CreativeStorage] ✅ Saved:', creative.id);

        return creative;
    }

    /**
     * Guardar batch de videos
     */
    static async saveBatch(videos: Array<{
        productId?: string;
        storeId?: string;
        type: 'VIDEO';
        stage?: 'COLD' | 'WARM' | 'HOT';

        avatarUrl?: string;
        audioUrl?: string;
        videoUrl: string;

        concept: string;
        script?: string;
        generationCost: number;
    }>) {
        console.log(`[CreativeStorage] Saving batch: ${videos.length} videos`);

        const created = await Promise.all(
            videos.map(video => this.saveVideo(video))
        );

        console.log(`[CreativeStorage] ✅ Batch saved: ${created.length} videos`);

        return created;
    }

    /**
     * Obtener creativos por producto
     */
    /**
     * Obtener creativos por producto
     */
    static async getByProduct(productId: string, options?: {
        type?: string;
        generatedBy?: string;
        limit?: number;
    }) {
        return prisma.generatedCreative.findMany({
            where: {
                productId,
                ...(options?.type && { type: options.type }),
                ...(options?.generatedBy && { generatedBy: options.generatedBy })
            },
            orderBy: { createdAt: 'desc' },
            take: options?.limit
        });
    }

    /**
     * Obtener creativos por stage
     */
    static async getByStage(stage: 'COLD' | 'WARM' | 'HOT', productId?: string) {
        return prisma.generatedCreative.findMany({
            where: {
                stage,
                ...(productId && { productId })
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    /**
     * Obtener top performers (por CTR)
     */
    static async getTopPerformers(limit: number = 10, type?: string) {
        return prisma.generatedCreative.findMany({
            where: {
                ctr: { not: null },
                ...(type && { type })
            },
            orderBy: { ctr: 'desc' },
            take: limit
        });
    }

    /**
     * Obtener creativos recientes
     */
    static async getRecent(limit: number = 50) {
        return prisma.generatedCreative.findMany({
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: {
                product: { select: { title: true, id: true } },
                store: { select: { name: true, id: true } }
            }
        });
    }

    /**
     * Actualizar URL de video con captions
     */
    static async updateCaptionsUrl(creativeId: string, captionsUrl: string) {
        return prisma.generatedCreative.update({
            where: { id: creativeId },
            data: { captionsUrl }
        });
    }

    /**
     * Actualizar métricas de performance
     */
    static async updatePerformance(
        creativeId: string,
        metrics: {
            views?: number;
            clicks?: number;
            conversions?: number;
            spend?: number;
            revenue?: number;
        }
    ) {
        const creative = await prisma.generatedCreative.findUnique({
            where: { id: creativeId }
        });

        if (!creative) {
            throw new Error('Creative not found');
        }

        // Calcular CTR
        let ctr: number | undefined;
        if (metrics.views && metrics.clicks) {
            ctr = (metrics.clicks / metrics.views) * 100;
        } else if (creative.views && creative.clicks) {
            const totalViews = creative.views + (metrics.views || 0);
            const totalClicks = creative.clicks + (metrics.clicks || 0);
            ctr = (totalClicks / totalViews) * 100;
        }

        return prisma.generatedCreative.update({
            where: { id: creativeId },
            data: {
                views: { increment: metrics.views || 0 },
                clicks: { increment: metrics.clicks || 0 },
                conversions: { increment: metrics.conversions || 0 },
                spend: { increment: metrics.spend || 0 },
                revenue: { increment: metrics.revenue || 0 },
                ctr
            }
        });
    }

    /**
     * Marcar como aprobado
     */
    static async approve(creativeId: string) {
        return prisma.generatedCreative.update({
            where: { id: creativeId },
            data: { status: 'APPROVED' }
        });
    }

    /**
     * Archivar creative
     */
    static async archive(creativeId: string) {
        return prisma.generatedCreative.update({
            where: { id: creativeId },
            data: { status: 'ARCHIVED' }
        });
    }

    /**
     * Rate creative (1-5)
     */
    static async rate(creativeId: string, rating: number) {
        if (rating < 1 || rating > 5) {
            throw new Error('Rating must be between 1 and 5');
        }

        return prisma.generatedCreative.update({
            where: { id: creativeId },
            data: { userRating: rating }
        });
    }

    /**
     * Set AI quality score (1-10)
     */
    static async setQualityScore(creativeId: string, score: number) {
        if (score < 1 || score > 10) {
            throw new Error('Score must be between 1 and 10');
        }

        return prisma.generatedCreative.update({
            where: { id: creativeId },
            data: { qualityScore: score }
        });
    }

    /**
     * Obtener analytics summary
     */
    static async getAnalytics(productId?: string, days: number = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const creatives = await prisma.generatedCreative.findMany({
            where: {
                ...(productId && { productId }),
                createdAt: { gte: startDate }
            }
        });

        const totalCost = creatives.reduce((sum, c) => sum + c.generationCost, 0);
        const totalSpend = creatives.reduce((sum, c) => sum + c.spend, 0);
        const totalRevenue = creatives.reduce((sum, c) => sum + c.revenue, 0);
        const totalViews = creatives.reduce((sum, c) => sum + c.views, 0);
        const totalClicks = creatives.reduce((sum, c) => sum + c.clicks, 0);
        const totalConversions = creatives.reduce((sum, c) => sum + c.conversions, 0);

        return {
            totalCreatives: creatives.length,
            totalCost,
            totalSpend,
            totalRevenue,
            roi: totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0,
            totalViews,
            totalClicks,
            totalConversions,
            avgCTR: totalViews > 0 ? (totalClicks / totalViews) * 100 : 0,
            conversionRate: totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0,
            byType: this.groupByField(creatives, 'type'),
            byStage: this.groupByField(creatives, 'stage')
        };
    }

    private static groupByField(creatives: any[], field: string) {
        const grouped: Record<string, number> = {};
        creatives.forEach(c => {
            const key = c[field] || 'unknown';
            grouped[key] = (grouped[key] || 0) + 1;
        });
        return grouped;
    }
}
