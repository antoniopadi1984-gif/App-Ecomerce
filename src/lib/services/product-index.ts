/**
 * ─── Product Index Service ───────────────────────────────────────────────────
 * Agrega datos de DB en un índice unificado por producto.
 * Los agentes llaman a este servicio para conocer el estado completo.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { prisma } from '@/lib/prisma';

export interface ProductFullIndex {
    product: {
        id: string; title: string; niche?: string; productFamily?: string;
        country?: string; marketLanguage: string;
        pvpEstimated?: number; breakevenROAS?: number; cpaMax?: number;
    };
    research: {
        hasRun: boolean; lastRunId?: string;
        steps: { stepKey: string; createdAt: Date; hasOutput: boolean }[];
    };
    creatives: {
        total: number; byStage: Record<string, number>;
        byConcept: Record<string, { count: number; avgRoas: number; status: string }>;
        assets: Array<{
            id: string; name: string; nomenclatura?: string; funnelStage?: string;
            conceptCode?: string; type: string; processingStatus: string;
            spend: number; revenue: number; ctr?: number; verdict?: string;
            driveFileId?: string; drivePath?: string; hookText?: string;
        }>;
    };
    competitors: { count: number; urls: string[] };
    landings: { count: number };
    driveReady: boolean;
}

const cache = new Map<string, { data: ProductFullIndex; expires: number }>();
const TTL = 3 * 60 * 1000; // 3 minutes

export async function getProductFullIndex(
    productId: string,
    storeId: string,
    opts?: { skipCache?: boolean }
): Promise<ProductFullIndex | null> {
    if (!opts?.skipCache) {
        const hit = cache.get(productId);
        if (hit && hit.expires > Date.now()) return hit.data;
    }

    try {
        const [product, researchSteps, creativeAssets, competitors, driveFiles] = await Promise.all([
            (prisma as any).product.findUnique({
                where: { id: productId },
                select: {
                    id: true, title: true, niche: true, productFamily: true,
                    country: true, marketLanguage: true,
                    pvpEstimated: true, breakevenROAS: true, cpaMax: true,
                    driveSetupDone: true,
                }
            }),
            (prisma as any).researchStep.findMany({
                where: { productId },
                select: { stepKey: true, runId: true, createdAt: true, outputText: true },
                orderBy: { createdAt: 'desc' },
                take: 50,
            }),
            (prisma as any).creativeAsset.findMany({
                where: { productId },
                select: {
                    id: true, name: true, nomenclatura: true, funnelStage: true,
                    conceptCode: true, type: true, processingStatus: true,
                    spend: true, revenue: true, ctr: true, verdict: true,
                    driveFileId: true, drivePath: true, hookText: true, versionNumber: true,
                },
                orderBy: { createdAt: 'desc' },
            }),
            (prisma as any).competitorAnalysis?.findMany({
                where: { productId },
                select: { url: true },
            }).catch(() => []),
            (prisma as any).driveFile?.findMany({
                where: { productId },
                select: { id: true },
                take: 1,
            }).catch(() => []),
        ]);

        if (!product) return null;

        // Process research
        const stepsByKey = researchSteps.reduce((acc: any, s: any) => {
            if (!acc[s.stepKey]) acc[s.stepKey] = s;
            return acc;
        }, {});
        const lastRunId = researchSteps[0]?.runId;

        // Process creatives
        const byStage: Record<string, number> = {};
        const byConcept: Record<string, { count: number; totalRev: number; totalSpend: number; statuses: string[] }> = {};
        for (const a of creativeAssets) {
            if (a.funnelStage) byStage[a.funnelStage] = (byStage[a.funnelStage] ?? 0) + 1;
            if (a.conceptCode) {
                if (!byConcept[a.conceptCode]) byConcept[a.conceptCode] = { count: 0, totalRev: 0, totalSpend: 0, statuses: [] };
                byConcept[a.conceptCode].count++;
                byConcept[a.conceptCode].totalRev += a.revenue ?? 0;
                byConcept[a.conceptCode].totalSpend += a.spend ?? 0;
                if (a.verdict) byConcept[a.conceptCode].statuses.push(a.verdict);
            }
        }
        const byConceptSummary = Object.fromEntries(
            Object.entries(byConcept).map(([k, v]: [string, any]) => [k, {
                count: v.count,
                avgRoas: v.totalSpend > 0 ? v.totalRev / v.totalSpend : 0,
                status: v.statuses.includes('WINNER') ? 'WINNER' : v.statuses.includes('LOSER') ? 'LOSER' : 'TESTING',
            }])
        );

        const index: ProductFullIndex = {
            product: {
                id: product.id, title: product.title, niche: product.niche,
                productFamily: product.productFamily, country: product.country,
                marketLanguage: product.marketLanguage ?? 'ES',
                pvpEstimated: product.pvpEstimated, breakevenROAS: product.breakevenROAS,
                cpaMax: product.cpaMax,
            },
            research: {
                hasRun: researchSteps.length > 0,
                lastRunId,
                steps: Object.values(stepsByKey).map((s: any) => ({
                    stepKey: s.stepKey, createdAt: s.createdAt, hasOutput: !!s.outputText
                })),
            },
            creatives: {
                total: creativeAssets.length,
                byStage,
                byConcept: byConceptSummary,
                assets: creativeAssets,
            },
            competitors: {
                count: competitors?.length ?? 0,
                urls: (competitors ?? []).map((c: any) => c.url),
            },
            landings: { count: 0 },
            driveReady: product.driveSetupDone && (driveFiles?.length ?? 0) > 0,
        };

        cache.set(productId, { data: index, expires: Date.now() + TTL });
        return index;
    } catch (e) {
        console.error('[ProductIndex] Error building index:', e);
        return null;
    }
}

export function invalidateProductCache(productId: string) {
    cache.delete(productId);
}
