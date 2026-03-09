import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ShopifyClient } from "@/lib/shopify";
import { syncOrdersToDb, syncProductsToDb } from "@/lib/handlers/shopify-sync";
import { syncBeepingOrders } from "@/lib/handlers/beeping-sync";
import { syncDropeaOrders } from "@/lib/handlers/dropea-sync";
import { getMetaAdsService } from "@/lib/marketing/meta-ads";
import { syncMetaInsights } from "@/lib/handlers/meta-insights-sync";
import { recalculateDailyFinance } from "@/lib/handlers/logistics-sync";
import { MetricsSnapshotService } from "@/lib/services/metrics-snapshot-service";
import { getConnectionSecret } from "@/lib/server/connections";
import { subDays } from "date-fns";

/**
 * 9.1 src/app/api/system/full-sync/route.ts
 * High-level orchestration for a complete system synchronization.
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { storeId: requestStoreId } = body;

        // If no specifically storeId provided, we could sync all, 
        // but typically one at a time via automation.
        const stores = requestStoreId
            ? await (prisma as any).store.findMany({ where: { id: requestStoreId } })
            : await (prisma as any).store.findMany();

        if (stores.length === 0) {
            return NextResponse.json({ error: "No stores found to sync" }, { status: 404 });
        }

        const overallResults: any = {};

        for (const store of stores) {
            const storeId = store.id;
            const results: any = { storeId, shopify: {}, beeping: {}, dropea: {}, meta: {}, finance: {} };

            console.log(`🚀 [FullSync] Starting unified sync for store: ${storeId}`);

            // 1 & 2. Shopify Sync (Orders & Products)
            try {
                const shop = await getConnectionSecret(storeId, 'SHOPIFY_SHOP');
                const token = await getConnectionSecret(storeId, 'SHOPIFY');
                if (shop && token) {
                    const client = new ShopifyClient(shop, token);

                    // Orders
                    const oData = await client.getOrdersHistorical({});
                    results.shopify.orders = await syncOrdersToDb(storeId, oData.orders);

                    // Products
                    const pData = await client.getProductsDetailed();
                    results.shopify.products = await syncProductsToDb(storeId, pData.products);
                }
            } catch (e: any) {
                results.shopify.error = e.message;
            }

            // 3. Beeping Sync
            try {
                results.beeping = await syncBeepingOrders(storeId, 30);
            } catch (e: any) {
                results.beeping.error = e.message;
            }

            // 4. Dropea Sync
            try {
                results.dropea = await syncDropeaOrders(storeId, 30);
            } catch (e: any) {
                results.dropea.error = e.message;
            }

            // 5. Dropi Sync (Placeholder for now)
            results.dropi = { success: true, message: "Dropi sync skipped (pending API docs)" };

            // 6. Meta Accounts Sync
            try {
                const metaService = await getMetaAdsService(prisma, storeId);
                const accounts = await metaService.getAdAccounts();
                for (const acc of accounts) {
                    await (prisma as any).metaAdAccount.upsert({
                        where: { storeId_accountId: { storeId, accountId: acc.id } },
                        update: { name: acc.name, currency: acc.currency },
                        create: {
                            storeId,
                            accountId: acc.id,
                            name: acc.name,
                            currency: acc.currency,
                            isActive: false // Default to false
                        }
                    });
                }
                results.meta.accountsCount = accounts.length;

                // 7. Meta Insights Sync (Last 30 days)
                // We'll sync only for ACTIVE accounts to save API calls
                const activeAccounts = await (prisma as any).metaAdAccount.findMany({
                    where: { storeId, isActive: true }
                });

                results.meta.insights = { syncedAccounts: 0, totalDays: 30, totalRecords: 0 };
                for (const acc of activeAccounts) {
                    const records = await syncMetaInsights(storeId, acc.accountId, 30);
                    results.meta.insights.syncedAccounts++;
                    results.meta.insights.totalRecords += records;
                }
            } catch (e: any) {
                results.meta.error = e.message;
            }

            // 8. Recalculate DailyFinance
            try {
                await recalculateDailyFinance(storeId, 30);
                results.finance.recalc = "OK";
            } catch (e: any) {
                results.finance.error = e.message;
            }

            // 9. Rebuild DailySnapshot (90 days)
            try {
                // Rebuild snapshots for specific window
                const today = new Date();
                for (let i = 0; i < 90; i++) {
                    const date = subDays(today, i);
                    await MetricsSnapshotService.generateDailySnapshot(storeId, date, false);
                }
                results.finance.snapshots = "OK";
            } catch (e: any) {
                results.finance.snapshotError = e.message;
            }

            overallResults[storeId] = results;
        }

        return NextResponse.json({ success: true, results: overallResults });

    } catch (error: any) {
        console.error("[Full Sync API Error]", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
