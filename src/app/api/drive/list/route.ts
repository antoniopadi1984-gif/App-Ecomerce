import { NextRequest, NextResponse } from 'next/server';
import { listProductFolder } from '@/lib/services/drive-service';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const subPath = searchParams.get('subPath') ?? undefined;
    const storeId = request.headers.get('X-Store-Id') ?? '';

    if (!productId) return NextResponse.json({ files: [] });

    try {
        const files = await listProductFolder(productId, subPath);
        return NextResponse.json({ files });
    } catch (e) {
        console.warn('[Drive/list]', e);
        return NextResponse.json({ files: [] });
    }
}
