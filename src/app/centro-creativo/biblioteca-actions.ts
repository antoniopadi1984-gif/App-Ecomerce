'use server';

import { prisma } from '@/lib/prisma';
import { CREATIVE_CONCEPTS, AUDIENCE_TYPES, AWARENESS_LEVELS, generateNomenclature, getDriveFolderPath } from '@/lib/creative/spencer-knowledge';

// ============================================================
// LIBRARY ASSET MANAGEMENT
// ============================================================

export interface LibraryFilters {
    storeId: string;
    productId?: string;
    type?: 'VIDEO' | 'IMAGE' | 'STATIC' | 'ALL';
    concept?: number;           // C1-C7
    audienceType?: string;      // COLD/WARM/HOT/RETARGET
    awarenessLevel?: string;    // O1-O5
    funnelStage?: string;       // TOP/MIDDLE/BOTTOM
    status?: string;            // ACTIVO/PAUSADO/WINNER/KILL
    search?: string;            // Nomenclature/name search
    limit?: number;
    offset?: number;
}

/**
 * Get library assets with rich filtering
 */
export async function getLibraryAssets(filters: LibraryFilters) {
    try {
        const where: any = { storeId: filters.storeId };

        if (filters.productId) where.productId = filters.productId;
        if (filters.type && filters.type !== 'ALL') where.type = filters.type;
        if (filters.concept) where.concept = filters.concept;
        if (filters.audienceType) where.audienceType = filters.audienceType;
        if (filters.funnelStage) where.funnelStage = filters.funnelStage;
        if (filters.status) where.status = filters.status;

        if (filters.search) {
            where.OR = [
                { name: { contains: filters.search, mode: 'insensitive' } },
                { nomenclatura: { contains: filters.search, mode: 'insensitive' } },
            ];
        }

        const [assets, total] = await Promise.all([
            (prisma as any).creativeAsset.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: filters.limit || 50,
                skip: filters.offset || 0,
                include: {
                    product: { select: { id: true, title: true } },
                },
            }),
            (prisma as any).creativeAsset.count({ where }),
        ]);

        return { assets, total };
    } catch (error: any) {
        console.error('[biblioteca-actions] getLibraryAssets error:', error);
        return { assets: [], total: 0 };
    }
}

/**
 * Rename an asset (name + nomenclatura)
 */
export async function renameAsset(assetId: string, newName: string, newNomenclatura?: string) {
    try {
        const data: any = { name: newName, updatedAt: new Date() };
        if (newNomenclatura) data.nomenclatura = newNomenclatura;

        await (prisma as any).creativeAsset.update({
            where: { id: assetId },
            data,
        });

        return { success: true };
    } catch (error: any) {
        console.error('[biblioteca-actions] renameAsset error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Generate a Spencer nomenclature for an asset
 */
export async function generateAssetNomenclature(params: {
    brand: string;
    angle: string;
    hook: string;
    variant: string;
    editor?: string;
    type: 'VIDEO' | 'STATIC';
}) {
    return generateNomenclature({
        brand: params.brand,
        angle: params.angle,
        hook: params.hook,
        variant: params.variant,
        editor: params.editor,
        type: params.type === 'VIDEO' ? 'VIDEO' : 'STATIC',
    });
}

/**
 * Get asset performance by joining with AdMetricDaily
 */
export async function getAssetPerformance(assetId: string) {
    try {
        const asset = await (prisma as any).creativeAsset.findUnique({
            where: { id: assetId },
        });

        if (!asset) return null;

        // Try to find metrics by nomenclature or asset ID
        const metrics = await (prisma as any).adMetricDaily.findMany({
            where: {
                OR: [
                    { creativeAssetId: assetId },
                    ...(asset.nomenclatura ? [{ adName: { contains: asset.nomenclatura } }] : []),
                ],
            },
            orderBy: { date: 'desc' },
            take: 30,
        });

        if (metrics.length === 0) {
            return { assetId, hasMetrics: false, aggregate: null, daily: [] };
        }

        // Aggregate metrics
        const totals = metrics.reduce((acc: any, m: any) => ({
            impressions: acc.impressions + (m.impressions || 0),
            clicks: acc.clicks + (m.clicks || 0),
            spend: acc.spend + (m.spend || 0),
            conversions: acc.conversions + (m.conversions || 0),
            revenue: acc.revenue + (m.revenue || 0),
            threeSecViews: acc.threeSecViews + (m.threeSecViews || 0),
            thruPlays: acc.thruPlays + (m.thruPlays || 0),
        }), { impressions: 0, clicks: 0, spend: 0, conversions: 0, revenue: 0, threeSecViews: 0, thruPlays: 0 });

        const aggregate = {
            hookRate: totals.impressions > 0 ? (totals.threeSecViews / totals.impressions) : 0,
            ctr: totals.impressions > 0 ? (totals.clicks / totals.impressions) : 0,
            cpa: totals.conversions > 0 ? (totals.spend / totals.conversions) : 0,
            roas: totals.spend > 0 ? (totals.revenue / totals.spend) : 0,
            totalSpend: totals.spend,
            totalConversions: totals.conversions,
            totalRevenue: totals.revenue,
        };

        return { assetId, hasMetrics: true, aggregate, daily: metrics };
    } catch (error: any) {
        console.error('[biblioteca-actions] getAssetPerformance error:', error);
        return { assetId, hasMetrics: false, aggregate: null, daily: [] };
    }
}

/**
 * Bulk update funnel stage for multiple assets
 */
export async function bulkUpdateFunnelStage(assetIds: string[], funnelStage: string) {
    try {
        await (prisma as any).creativeAsset.updateMany({
            where: { id: { in: assetIds } },
            data: { funnelStage, updatedAt: new Date() },
        });
        return { success: true, updated: assetIds.length };
    } catch (error: any) {
        console.error('[biblioteca-actions] bulkUpdateFunnelStage error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Bulk update concept for multiple assets
 */
export async function bulkUpdateConcept(assetIds: string[], concept: number) {
    try {
        await (prisma as any).creativeAsset.updateMany({
            where: { id: { in: assetIds } },
            data: { concept, updatedAt: new Date() },
        });
        return { success: true, updated: assetIds.length };
    } catch (error: any) {
        console.error('[biblioteca-actions] bulkUpdateConcept error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Bulk update status for multiple assets
 */
export async function bulkUpdateStatus(assetIds: string[], status: string) {
    try {
        await (prisma as any).creativeAsset.updateMany({
            where: { id: { in: assetIds } },
            data: { status, updatedAt: new Date() },
        });
        return { success: true, updated: assetIds.length };
    } catch (error: any) {
        console.error('[biblioteca-actions] bulkUpdateStatus error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get filter options for the library UI (with counts)
 */
export async function getLibraryFilterOptions(storeId: string) {
    return {
        concepts: CREATIVE_CONCEPTS.map(c => ({ ...c })),
        audiences: AUDIENCE_TYPES.map(a => ({ ...a })),
        awarenessLevels: AWARENESS_LEVELS.map(a => ({ ...a })),
        funnelStages: [
            { id: 'TOP', label: '🔝 Top' },
            { id: 'MIDDLE', label: '🔄 Middle' },
            { id: 'BOTTOM', label: '🎯 Bottom' },
        ],
        statuses: [
            { id: 'ACTIVO', label: '🟢 Activo', color: '#22c55e' },
            { id: 'PAUSADO', label: '🟡 Pausado', color: '#eab308' },
            { id: 'WINNER', label: '🏆 Winner', color: '#3b82f6' },
            { id: 'KILL', label: '❌ Kill', color: '#ef4444' },
        ],
    };
}
