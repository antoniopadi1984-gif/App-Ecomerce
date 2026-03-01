import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const storeId = request.headers.get('X-Store-Id');

    const where: any = {};
    if (productId) where.productId = productId;
    if (storeId) where.storeId = storeId;

    const assets = await (prisma as any).creativeAsset.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 200,
    });

    return NextResponse.json({ assets });
}
