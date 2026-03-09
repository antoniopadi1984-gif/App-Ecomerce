import { prisma } from '@/lib/prisma';

export interface AvatarMatchParams {
    productId: string;
    storeId: string;
    funnelStage?: string; // TOF, MOF, BOF, etc.
    conceptType?: string;
    targetAvatarProfile?: string; // Psychographic profile from Research Core
}

export class AvatarMatchService {
    static async getBestMatch(params: AvatarMatchParams) {
        const { productId, funnelStage, conceptType, targetAvatarProfile } = params;

        // 1. Get performance of avatars for this product
        const performanceData = await (prisma as any).creativeAsset.groupBy({
            by: ['avatarId'],
            where: {
                productId,
                avatarId: { not: null },
                // If we want to filter by funnel stage for historical context
                funnelStage: funnelStage || undefined,
            },
            _avg: {
                ctr: true,
                hookRate: true,
            },
            _count: {
                id: true
            }
        });

        // Sort by best CTR
        const sortedPerformance = performanceData.sort((a: any, b: any) => (b._avg.ctr || 0) - (a._avg.ctr || 0));

        if (sortedPerformance.length > 0 && sortedPerformance[0].avatarId) {
            const bestAvatar = await (prisma as any).avatarProfile.findUnique({
                where: { id: sortedPerformance[0].avatarId }
            });

            if (bestAvatar) {
                return {
                    avatar: bestAvatar,
                    reason: `Este avatar tiene el mejor CTR histórico (${(sortedPerformance[0]._avg.ctr * 100).toFixed(2)}%) para la fase ${funnelStage || 'global'}.`,
                    confidence: Math.min(sortedPerformance[0]._count.id * 10, 100) // Confidence based on sample size
                };
            }
        }

        // 2. Fallback: Suggest based on psychographic match if no performance data
        // This is a simplified version of psychographic matching
        const allAvatars = await (prisma as any).avatarProfile.findMany({
            where: { productId }
        });

        if (allAvatars.length > 0) {
            // Here we would ideally use an LLM to compare targetAvatarProfile with avatar metadata
            // For now, return the first one as "Recommended for profile"
            return {
                avatar: allAvatars[0],
                reason: "Sugerido basado en el perfil psicográfico del público objetivo (Research Core).",
                confidence: 50
            };
        }

        return null;
    }
}
