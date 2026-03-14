import { NextRequest, NextResponse } from 'next/server';
import { ShopifyClient } from '@/lib/shopify';
import { getConnectionSecret, getConnectionMeta } from '@/lib/server/connections';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        const { searchParams } = new URL(request.url);
        const storeId = searchParams.get('storeId');
        const resolvedParams = await params;
        const shopifyId = decodeURIComponent(resolvedParams.id);

        if (!storeId) return NextResponse.json({ error: "Missing storeId" }, { status: 400 });

        const secret = await getConnectionSecret(storeId, 'SHOPIFY');
        const meta = await getConnectionMeta(storeId, 'SHOPIFY');

        if (!secret) return NextResponse.json({ error: "No connection found" }, { status: 404 });

        // Parse extraConfig to find shop domain
        let shop = '';
        try {
            const config = JSON.parse(meta?.extraConfig || '{}');
            shop = config.SHOPIFY_SHOP_DOMAIN || config.shopUrl || config.shop;
        } catch {}

        if (!shop) {
            const store = await prisma.store.findUnique({ where: { id: storeId } });
            shop = store?.domain || '';
        }

        if (!shop) return NextResponse.json({ error: "Shop domain not found" }, { status: 404 });

        const client = new ShopifyClient(shop, secret);
        // We might need to construct the full GID if only ID was passed, but top-bar uses full GID
        const data: any = await client.getProduct(shopifyId);

        if (!data || !data.product) {
            return NextResponse.json({ error: "Product not found in Shopify" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            product: {
                id: data.product.id,
                title: data.product.title,
                handle: data.product.handle,
                image: data.product.images?.nodes?.[0]?.url || null,
                price: data.product.variants?.nodes?.[0]?.price || '0',
                sku: data.product.variants?.nodes?.[0]?.sku || '',
                status: data.product.status
            }
        });

    } catch (e: any) {
        console.error("🛑 [Shopify Product API Error]", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
