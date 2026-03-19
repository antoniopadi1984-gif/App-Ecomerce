import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ShopifyClient } from '@/lib/shopify';

export async function POST(request: Request) {
    try {
        const { storeId } = await request.json();

        if (!storeId) {
            return NextResponse.json({ success: false, error: 'storeId required' }, { status: 400 });
        }

        const connection = await prisma.connection.findFirst({
            where: { storeId, provider: 'SHOPIFY', isActive: true }
        });

        if (!connection) {
            return NextResponse.json({
                success: false,
                error: 'No active Shopify connection for this store'
            }, { status: 404 });
        }

        const shopDomain = connection.extraConfig || '';
        const accessToken = connection.apiKey || '';

        if (!shopDomain || !accessToken) {
            return NextResponse.json({ success: false, error: 'Shopify credentials incomplete' }, { status: 400 });
        }

        const shopify = new ShopifyClient(shopDomain, accessToken);
        const data = await shopify.getProducts();
        const shopifyProducts = data?.products || [];

        let synced = 0;
        let errors = 0;

        for (const sp of shopifyProducts) {
            try {
                const variant = sp.variants?.[0];
                await prisma.product.upsert({
                    where: { id: String(sp.id) },
                    update: {
                        title: sp.title,
                        description: sp.body_html || null,
                        imageUrl: sp.image?.src || null,
                        price: parseFloat(variant?.price || '0'),
                        sku: variant?.sku || null,
                        variantId: variant?.id ? String(variant.id) : null,
                        handle: sp.handle || null,
                        vendor: sp.vendor || null,
                        productType: sp.product_type || null,
                        tags: sp.tags || null,
                        status: sp.status?.toUpperCase() === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
                        updatedAt: new Date(),
                    },
                    create: {
                        storeId,
                        shopifyId: String(sp.id),
                        title: sp.title,
                        description: sp.body_html || null,
                        imageUrl: sp.image?.src || null,
                        price: parseFloat(variant?.price || '0'),
                        sku: variant?.sku || null,
                        variantId: variant?.id ? String(variant.id) : null,
                        handle: sp.handle || null,
                        vendor: sp.vendor || null,
                        productType: sp.product_type || null,
                        tags: sp.tags || null,
                        status: sp.status?.toUpperCase() === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
                        country: 'ES',
                    }
                });
                synced++;
            } catch (e) {
                errors++;
                console.error(`[Shopify Sync] Failed product ${sp.id}:`, e);
            }
        }

        await prisma.connection.update({
            where: { id: connection.id },
            data: { lastSyncedAt: new Date() }
        });

        return NextResponse.json({ success: true, synced, errors, total: shopifyProducts.length });

    } catch (error: any) {
        console.error('[Shopify Sync] Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
