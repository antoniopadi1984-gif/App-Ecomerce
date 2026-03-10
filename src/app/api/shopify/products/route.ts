import { NextRequest, NextResponse } from 'next/server';
import { ShopifyClient } from '@/lib/shopify';
import { getConnectionSecret, getConnectionMeta } from '@/lib/server/connections';
import { syncProductsToDb } from '@/lib/handlers/shopify-sync';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const storeId = searchParams.get('storeId') || req.headers.get('X-Store-Id');

        if (!storeId) {
            return NextResponse.json({ error: "Missing storeId" }, { status: 400 });
        }

        const secret = await getConnectionSecret(storeId, 'SHOPIFY');
        const meta = await getConnectionMeta(storeId, 'SHOPIFY');

        if (!secret) return NextResponse.json({ connected: false, products: [] });

        let shop = meta?.extraConfig?.SHOPIFY_SHOP_DOMAIN
            || meta?.extraConfig?.Tienda
            || meta?.extraConfig?.shopDomain;

        if (!shop) {
            const store = await (prisma as any).store.findUnique({ where: { id: storeId } });
            shop = store?.domain;
        }

        // Hardfall: mapear por storeId conocido si todo lo anterior falla
        if (!shop) {
            const domainMap: Record<string, string> = {
                'store-main': 'f7z7nn-ei.myshopify.com',
                'store-alecare-mx': 'im8zf5-6c.myshopify.com',
                'store-alecare-uk': 'v1ethu-he.myshopify.com',
            };
            shop = domainMap[storeId] ?? null;
        }

        if (!shop) return NextResponse.json({ connected: false, products: [] });

        const client = new ShopifyClient(shop, secret);
        const data: any = await client.getProductsDetailed(50); // Fetch first 50 for the selector

        // Get info about synced products in EcomBoom
        const ecomProducts = await prisma.product.findMany({
            where: { storeId },
            select: { id: true, sku: true }
        });
        const skuToId = new Map(ecomProducts.map(p => [p.sku, p.id]));

        const products = (data.products || []).map((p: any) => ({
            id: p.id,
            title: p.title,
            handle: p.handle,
            image: p.images?.nodes?.[0]?.url || null,
            variants: p.variants || [],
            status: p.status,
            ecomBoomId: skuToId.get(p.variants?.nodes?.[0]?.sku) || skuToId.get(p.variants?.[0]?.sku) || null
        }));

        return NextResponse.json({
            success: true,
            connected: true,
            products
        });
    } catch (e: any) {
        console.error("🛑 [Shopify Products GET Error]", e);
        return NextResponse.json({ error: e.message, connected: false }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { storeId } = body;

        if (!storeId) {
            return NextResponse.json({ error: "Missing storeId" }, { status: 400 });
        }

        const secret = await getConnectionSecret(storeId, 'SHOPIFY');
        const meta = await getConnectionMeta(storeId, 'SHOPIFY');

        let shop = meta?.extraConfig?.SHOPIFY_SHOP_DOMAIN
            || meta?.extraConfig?.Tienda
            || meta?.extraConfig?.shopDomain;

        if (!shop) {
            const store = await (prisma as any).store.findUnique({ where: { id: storeId } });
            shop = store?.domain;
        }

        // Hardfall: mapear por storeId conocido si todo lo anterior falla
        if (!shop) {
            const domainMap: Record<string, string> = {
                'store-main': 'f7z7nn-ei.myshopify.com',
                'store-alecare-mx': 'im8zf5-6c.myshopify.com',
                'store-alecare-uk': 'v1ethu-he.myshopify.com',
            };
            shop = domainMap[storeId] ?? null;
        }

        if (!secret || !shop) {
            return NextResponse.json({ error: "Shopify connection or domain not found" }, { status: 400 });
        }

        const client = new ShopifyClient(shop, secret);
        let allProducts: any[] = [];
        let cursor: string | undefined = undefined;
        let hasMore = true;
        let pagesCount = 0;

        while (hasMore && pagesCount < 20) {
            const data: any = await client.getProductsDetailed(50, cursor);

            if (data.products && data.products.length > 0) {
                allProducts = allProducts.concat(data.products);
            }

            cursor = data.pageInfo.endCursor;
            hasMore = data.pageInfo.hasNextPage;
            pagesCount++;
        }

        const synced = await syncProductsToDb(storeId, allProducts);

        return NextResponse.json({
            success: true,
            synced,
            total: allProducts.length,
            pages: pagesCount
        });
    } catch (e: any) {
        console.error("🛑 [Shopify Products Sync API Error]", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
