/**
 * GET /api/shopify/products?storeId=X
 *
 * Fetches products from the Shopify store linked to storeId,
 * and enriches each with an ecomBoomId if there's a matching
 * EcomBoom product (linked via shopifyId field or handle).
 *
 * Returns a simplified list ready for the topbar selector.
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ShopifyClient } from "@/lib/shopify";

export interface ShopifyProductItem {
    id: string;           // Shopify product ID (string)
    title: string;
    handle: string;
    image: string | null; // First image src or null
    variants: { price: string }[];
    status: string;
    ecomBoomId: string | null; // EcomBoom product ID if linked
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get("storeId");

    if (!storeId) {
        return NextResponse.json({ error: "storeId requerido" }, { status: 400 });
    }

    try {
        // 1. Get the Shopify connection for this store
        //    Pattern used by rest of app: provider="shopify", domain in extraConfig, token in apiKey/accessToken
        const shopifyConn = await prisma.connection.findFirst({
            where: {
                storeId,
                provider: "shopify",
                isActive: true,
            },
            select: {
                extraConfig: true, // Shopify domain (myshopify.com URL)
                apiKey: true,      // Access token (legacy field used across app)
                accessToken: true, // Fallback
            },
        });

        if (!shopifyConn?.extraConfig || !(shopifyConn.apiKey || shopifyConn.accessToken)) {
            // Store not connected to Shopify — return empty list gracefully
            return NextResponse.json({ products: [], connected: false });
        }

        const shopifyDomain = shopifyConn.extraConfig;
        const shopifyToken = shopifyConn.apiKey || shopifyConn.accessToken!;

        // 2. Fetch products from Shopify
        const client = new ShopifyClient(shopifyDomain, shopifyToken);
        const shopifyData = await client.getProducts();
        const rawProducts: any[] = shopifyData?.products || [];

        // 3. Get all EcomBoom products for this store to cross-reference
        const ecomProducts = await prisma.product.findMany({
            where: { storeId },
            select: { id: true, handle: true, shopifyId: true },
        });

        const handleMap = new Map(
            ecomProducts.filter((p) => p.handle).map((p) => [p.handle!, p.id])
        );
        const shopifyIdMap = new Map(
            ecomProducts
                .filter((p) => p.shopifyId)
                .map((p) => [String(p.shopifyId), p.id])
        );

        // 4. Build enriched list
        const products: ShopifyProductItem[] = rawProducts.map((p: any) => {
            const shopifyId = String(p.id);
            const ecomBoomId =
                shopifyIdMap.get(shopifyId) ||
                handleMap.get(p.handle) ||
                null;

            return {
                id: shopifyId,
                title: p.title,
                handle: p.handle,
                image: p.images?.[0]?.src || null,
                variants: (p.variants || []).map((v: any) => ({ price: v.price })),
                status: p.status,
                ecomBoomId,
            };
        });

        return NextResponse.json({ products, connected: true });
    } catch (error: any) {
        console.error("[API /shopify/products] Error:", error);
        return NextResponse.json(
            { error: "Error al cargar productos de Shopify", detail: error.message },
            { status: 500 }
        );
    }
}
