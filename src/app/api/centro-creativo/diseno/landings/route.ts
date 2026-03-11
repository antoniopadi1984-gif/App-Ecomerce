import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('productId');

        if (!productId || productId === 'GLOBAL') {
            return NextResponse.json({ success: false, error: "ProductId required" }, { status: 400 });
        }

        const clones = await prisma.landingClone.findMany({
            where: { productId },
            orderBy: { createdAt: 'desc' },
            take: 20
        });

        // Mapear a formato de la UI con datos simulados si no existen scores
        const landings = clones.map(c => {
            let analysis: any = {};
            if (c.assetsJson) {
                try {
                    analysis = JSON.parse(c.assetsJson).analysis || {};
                } catch (e) { }
            }

            return {
                id: c.id,
                name: c.originalUrl ? new URL(c.originalUrl).hostname : 'Landing sin nombre',
                url: c.originalUrl,
                screenshot: c.screenshotUrl,
                assets: analysis.assets || [],
                assetCount: analysis.assetCount || 0,
                structure: analysis.structure || [],
                productCount: analysis.productCount || 0,
                productsFound: analysis.productsFound || [],
                scores: {
                    hook: analysis.scores?.hook ?? 0,
                    mechanism: analysis.scores?.mechanism ?? 0,
                    offer: analysis.scores?.offer ?? 0
                },
                criticalPoints: analysis.criticalPoints || [],
                recommendations: analysis.recommendations || [],
                createdAt: c.createdAt
            };
        });

        return NextResponse.json({
            success: true,
            landings
        });

    } catch (error: any) {
        console.error('[API-LANDINGS] Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
