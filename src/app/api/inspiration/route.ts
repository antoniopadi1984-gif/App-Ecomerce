import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { InspirationService } from '@/lib/services/inspiration-service';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const storeId = request.headers.get('x-store-id');
    const productId = searchParams.get('productId');

    if (!storeId) return NextResponse.json({ error: 'Store ID required' }, { status: 400 });

    try {
        const assets = await (prisma as any).inspirationAsset.findMany({
            where: {
                storeId,
                ...(productId && productId !== 'GLOBAL' ? { productId } : {})
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ ok: true, assets });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const storeId = request.headers.get('x-store-id');
    if (!storeId) return NextResponse.json({ error: 'Store ID required' }, { status: 400 });

    try {
        const data = await request.json();
        const asset = await InspirationService.importAsset({
            ...data,
            storeId
        });

        return NextResponse.json({ ok: true, asset });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
