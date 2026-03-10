import { NextRequest, NextResponse } from 'next/server';
import { ShopifyClient } from '@/lib/shopify';
import { getConnectionSecret, getConnectionMeta } from '@/lib/server/connections';
import { syncOrdersToDb } from '@/lib/handlers/shopify-sync';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { storeId, fromDate } = body;

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
        let allOrders: any[] = [];
        let cursor: string | undefined = undefined;
        let hasMore = true;
        let pagesCount = 0;

        while (hasMore && pagesCount < 20) {
            const data: any = await client.getOrdersHistorical({
                from: fromDate,
                cursor
            });

            if (data.orders && data.orders.length > 0) {
                allOrders = allOrders.concat(data.orders);
            }

            cursor = data.pageInfo.endCursor;
            hasMore = data.pageInfo.hasNextPage;
            pagesCount++;
        }

        const synced = await syncOrdersToDb(storeId, allOrders);

        return NextResponse.json({
            success: true,
            synced,
            total: allOrders.length,
            pages: pagesCount
        });
    } catch (e: any) {
        console.error("🛑 [Shopify Sync API Error]", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
