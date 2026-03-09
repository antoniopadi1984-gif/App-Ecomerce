import { prisma } from '../prisma';

export class FatigueDetectorService {
    /**
     * Analiza todos los creativos activos de una tienda para detectar fatiga
     */
    static async analyzeStore(storeId: string) {
        const activeAssets = await (prisma as any).creativeAsset.findMany({
            where: { storeId, metaStatus: 'ACTIVO' },
            include: { dailyStats: { orderBy: { date: 'desc' }, take: 14 } }
        });

        const updates = [];
        for (const asset of activeAssets) {
            const fatigue = this.calculateFatigue(asset);
            updates.push((prisma as any).creativeAsset.update({
                where: { id: asset.id },
                data: {
                    fatigueScore: fatigue.score,
                    fatigueDaysLeft: fatigue.daysLeft,
                    ctrTrend: fatigue.trend,
                    metaStatus: fatigue.score > 0.8 ? 'FATIGADO' : 'ACTIVO'
                }
            }));
        }

        await Promise.all(updates);
        return { analyzed: activeAssets.length };
    }

    private static calculateFatigue(asset: any) {
        const stats = asset.dailyStats || [];
        if (stats.length < 3) return { score: 0, daysLeft: 30, trend: 'STABLE' };

        // 1. Tendencia de CTR
        const recentCTR = stats.slice(0, 3).reduce((sum: number, s: any) => sum + (s.ctr || 0), 0) / 3;
        const olderCTR = stats.slice(3, 10).reduce((sum: number, s: any) => sum + (s.ctr || 0), 0) / 7;

        let trend: 'UP' | 'STABLE' | 'DOWN' = 'STABLE';
        if (recentCTR < olderCTR * 0.85) trend = 'DOWN';
        if (recentCTR > olderCTR * 1.15) trend = 'UP';

        // 2. Frecuencia (si disponible, si no simulamos por días y spend)
        const frequency = asset.frequency || (stats.length * 0.1) + 1; // Simulación

        // 3. Puntuación de fatiga (0 a 1)
        let score = 0;
        if (trend === 'DOWN') score += 0.4;
        if (frequency > 2.2) score += 0.3;
        if (stats.length > 21) score += 0.2; // Más de 3 semanas

        // 4. Estimación de días restantes
        let daysLeft = 30;
        if (score > 0.7) daysLeft = Math.max(1, 5 - (stats.length % 3));
        else if (score > 0.4) daysLeft = 14;

        return { score, daysLeft, trend };
    }
}
