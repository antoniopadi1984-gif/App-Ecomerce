import { prisma } from '../prisma';

/**
 * VOC Insight Service - Para manejar Voice of Customer insights con categorización
 */

export interface VOCInsightData {
    productId: string;
    researchRunId?: string;
    phrase: string;
    category: 'PAIN' | 'DESIRE' | 'OBJECTION' | 'TRIGGER';
    emotionalIntensity: number; // 1-10
    funnelStage?: 'COLD' | 'WARM' | 'HOT';
    frequency?: number;
    verbatimSource?: string;
}

export class VOCInsightService {
    /**
     * Guarda un VOC insight en la DB
     */
    static async save(data: VOCInsightData) {
        return await (prisma as any).vOCInsight.create({
            data: {
                productId: data.productId,
                researchRunId: data.researchRunId,
                phrase: data.phrase,
                category: data.category,
                emotionalIntensity: data.emotionalIntensity,
                funnelStage: data.funnelStage,
                frequency: data.frequency || 1,
                verbatimSource: data.verbatimSource
            }
        });
    }

    /**
     * Guarda múltiples insights en batch
     */
    static async saveBatch(insights: VOCInsightData[]) {
        const results = [];
        for (const insight of insights) {
            results.push(await this.save(insight));
        }
        return results;
    }

    /**
     * Obtiene insights por producto
     */
    static async getByProduct(productId: string, options?: {
        category?: 'PAIN' | 'DESIRE' | 'OBJECTION' | 'TRIGGER';
        funnelStage?: 'COLD' | 'WARM' | 'HOT';
        minIntensity?: number;
    }) {
        const where: any = { productId };

        if (options?.category) where.category = options.category;
        if (options?.funnelStage) where.funnelStage = options.funnelStage;
        if (options?.minIntensity) {
            where.emotionalIntensity = { gte: options.minIntensity };
        }

        return await (prisma as any).vOCInsight.findMany({
            where,
            orderBy: [
                { emotionalIntensity: 'desc' },
                { frequency: 'desc' }
            ]
        });
    }

    /**
     * Get TOP insights por categoría
     */
    static async getTopByCategory(productId: string, limit: number = 20) {
        const categories = ['PAIN', 'DESIRE', 'OBJECTION', 'TRIGGER'];
        const results: Record<string, any[]> = {};

        for (const category of categories) {
            results[category] = await (prisma as any).vOCInsight.findMany({
                where: { productId, category },
                orderBy: [
                    { emotionalIntensity: 'desc' },
                    { frequency: 'desc' }
                ],
                take: limit
            });
        }

        return results;
    }

    /**
     * Analytics: Intensity heatmap
     */
    static async getIntensityHeatmap(productId: string) {
        const insights = await (prisma as any).vOCInsight.findMany({
            where: { productId },
            select: {
                category: true,
                funnelStage: true,
                emotionalIntensity: true
            }
        });

        const heatmap: Record<string, Record<string, number>> = {};

        for (const insight of insights) {
            const key = `${insight.category}_${insight.funnelStage || 'GENERAL'}`;
            if (!heatmap[key]) heatmap[key] = { count: 0, avgIntensity: 0, totalIntensity: 0 };

            heatmap[key].count++;
            heatmap[key].totalIntensity += insight.emotionalIntensity;
            heatmap[key].avgIntensity = heatmap[key].totalIntensity / heatmap[key].count;
        }

        return heatmap;
    }

    /**
     * Get stats summary
     */
    static async getStats(productId: string) {
        const total = await (prisma as any).vOCInsight.count({ where: { productId } });
        const byCategory = await (prisma as any).vOCInsight.groupBy({
            by: ['category'],
            where: { productId },
            _count: true
        });

        const avgIntensity = await (prisma as any).vOCInsight.aggregate({
            where: { productId },
            _avg: { emotionalIntensity: true }
        });

        return {
            total,
            byCategory: byCategory.map((c: any) => ({ category: c.category, count: c._count })),
            avgIntensity: avgIntensity._avg.emotionalIntensity
        };
    }
}
