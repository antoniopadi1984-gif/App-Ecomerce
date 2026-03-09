import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const storeId = request.headers.get('X-Store-Id');
    if (!storeId) return NextResponse.json({ error: 'Missing Store ID' }, { status: 400 });

    const brands = await (prisma as any).competitorBrand.findMany({
        where: { storeId },
        include: { _count: { select: { ads: true, landings: true } } },
        orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json({ brands });
}

export async function POST(request: NextRequest) {
    const storeId = request.headers.get('X-Store-Id');
    if (!storeId) return NextResponse.json({ error: 'Missing Store ID' }, { status: 400 });

    const body = await request.json();
    const { name, websiteUrl, productId, trackingActive } = body;

    if (!name) return NextResponse.json({ error: 'Missing Name' }, { status: 400 });

    const brand = await (prisma as any).competitorBrand.create({
        data: {
            name,
            websiteUrl,
            storeId,
            productId,
            trackingActive: trackingActive ?? true
        }
    });

    return NextResponse.json({ ok: true, brand });
}
