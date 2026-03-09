import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CompetitorService } from '@/lib/services/competitor-service';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const storeId = request.headers.get('X-Store-Id');

    const where: any = {};
    if (productId && productId !== 'GLOBAL') where.productId = productId;
    if (storeId) where.storeId = storeId;

    const landings = await (prisma as any).competitorLanding.findMany({
        where,
        include: { brand: true, extractedAssets: true },
        orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ landings });
}

export async function POST(request: NextRequest) {
    const storeId = request.headers.get('X-Store-Id');
    if (!storeId) return NextResponse.json({ error: 'Missing Store ID' }, { status: 400 });

    const body = await request.json();
    const { url, productId, brandId } = body;

    if (!url) return NextResponse.json({ error: 'Missing URL' }, { status: 400 });

    try {
        const landing = await CompetitorService.importLanding({
            url,
            storeId,
            productId,
            brandId
        });

        return NextResponse.json({ ok: true, landing });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
