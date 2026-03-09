import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const storeId = request.headers.get('X-Store-Id');

    const where: any = {};
    if (productId && productId !== 'GLOBAL') where.productId = productId;
    if (storeId) where.storeId = storeId;

    // Fetching from the NEW artifacts table
    const artifacts = await (prisma as any).creativeArtifact.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { concept: true },
        take: 500,
    });

    // 1. Group Versions (using the new nomenclature logic)
    // [SKU]_C[N]_V[N][suffix] -> Base is [SKU]_C[N]
    const groupedAssets: any[] = [];
    const groups: Record<string, any[]> = {};

    artifacts.forEach((art: any) => {
        const groupKey = art.creativeCode.replace(/_V\d+[a-z]?$/, '') || 'MISC';
        if (!groups[groupKey]) groups[groupKey] = [];
        groups[groupKey].push(art);
    });

    Object.values(groups).forEach(group => {
        // Sort by version desc, then variantSuffix desc
        const sorted = group.sort((a, b) => {
            if (b.version !== a.version) return b.version - a.version;
            return (b.variantSuffix || '').localeCompare(a.variantSuffix || '');
        });

        const master = sorted[0];
        groupedAssets.push({
            ...master,
            id: master.id,
            name: master.creativeCode,
            versionCount: sorted.length,
            allVersions: sorted,
            nomenclatura: master.creativeCode
        });
    });

    // 2. Leaderboard
    const leaderboard = groupedAssets
        .slice(0, 5)
        .map(a => ({
            id: a.id,
            name: a.creativeCode,
            ctr: a.metrics?.[0]?.ctr || 0,
            status: 'DRAFT'
        }));

    return NextResponse.json({
        assets: groupedAssets,
        leaderboard,
        opportunities: artifacts.length > 0 ? [
            {
                id: 'opp1',
                title: 'Oportunidad de Reutilización',
                text: `El creativo "${artifacts[0]?.creativeCode}" está listo para iterar.`,
                action: 'Crear variante'
            }
        ] : []
    });
}
