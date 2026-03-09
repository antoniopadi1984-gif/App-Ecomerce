import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('productId');

        if (!productId || productId === 'GLOBAL') {
            return NextResponse.json({ landings: [] });
        }

        const landings = await (prisma as any).landingClone.findMany({
            where: { productId },
            orderBy: { createdAt: 'desc' }
        });

        // Add some mock asset count since the DB field is a JSON string of assets mapping
        const mappedLandings = landings.map((l: any) => {
            let assetCount = 0;
            try {
                if (l.assetsJson) {
                    const assets = JSON.parse(l.assetsJson);
                    assetCount = Object.keys(assets).length;
                }
            } catch (e) { }

            return {
                ...l,
                assetCount
            };
        });

        return NextResponse.json({ success: true, landings: mappedLandings });
    } catch (error: any) {
        console.error('[API-LANDINGS] Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
