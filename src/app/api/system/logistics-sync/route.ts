import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncBeepingOrders } from "@/lib/handlers/beeping-sync";
import { syncDropeaOrders } from "@/lib/handlers/dropea-sync";
import { syncOrdersToDb } from "@/lib/handlers/shopify-sync";
import { ShopifyClient } from "@/lib/shopify";
import { getConnectionSecret } from "@/lib/server/connections";
import { recalculateDailyFinance } from "@/lib/handlers/logistics-sync";

/**
 * 9.2 src/app/api/system/logistics-sync/route.ts
 * Single provider or multi-provider logistics sync
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { storeId, provider = "ALL", days = 30 } = body;

        if (!storeId) return NextResponse.json({ error: "Missing storeId" }, { status: 400 });

        const results: any = { shopify: {}, beeping: {}, dropea: {}, dropi: {}, finance: {} };

        // SHOPIFY
        if (provider === "ALL" || provider === "SHOPIFY") {
            try {
                const shop = await getConnectionSecret(storeId, 'SHOPIFY_SHOP');
                const token = await getConnectionSecret(storeId, 'SHOPIFY');
                if (shop && token) {
                    const client = new ShopifyClient(shop, token);
                    const oData = await client.getOrdersHistorical({});
                    results.shopify.count = await syncOrdersToDb(storeId, oData.orders);
                }
            } catch (e: any) { results.shopify.error = e.message; }
        }

        // BEEPING
        if (provider === "ALL" || provider === "BEEPING") {
            try {
                results.beeping = await syncBeepingOrders(storeId, days);
            } catch (e: any) { results.beeping.error = e.message; }
        }

        // DROPEA
        if (provider === "ALL" || provider === "DROPEA") {
            try {
                results.dropea = await syncDropeaOrders(storeId, days);
            } catch (e: any) { results.dropea.error = e.message; }
        }

        // DROPI (Placeholder)
        if (provider === "ALL" || provider === "DROPI") {
            results.dropi = { message: "Dropi sync is a placeholder" };
        }

        // Recalculate Finance for the days synced
        try {
            await recalculateDailyFinance(storeId, days);
            results.finance.recalc = "OK";
        } catch (e: any) { results.finance.error = e.message; }

        return NextResponse.json({ success: true, synced: provider, results });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
