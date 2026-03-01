
import { prisma } from "@/lib/prisma";
import { ShopifyClient } from "@/lib/shopify";
import { IntradaySyncService } from "./intraday-service";
import { MetricsSnapshotService } from "./metrics-snapshot-service";
import { eachDayOfInterval, startOfDay, endOfDay, format } from "date-fns";
import { upsertShopifyOrder } from "@/app/operaciones/pedidos/actions";

export class BackfillService {
    /**
     * Comprehensive backfill for a store starting from 2025-01-01
     */
    static async runBackfill(storeId: string, startDate: Date = new Date("2025-01-01")) {
        console.log(`[BackfillService] Starting global backfill for store ${storeId} from ${startDate.toISOString()}...`);

        try {
            // 1. Audit Log: Start backfill
            await prisma.auditLog.create({
                data: {
                    storeId,
                    action: "BACKFILL_START",
                    entity: "SYSTEM",
                    entityId: "backfill-service",
                    oldValue: JSON.stringify({ startDate: startDate.toISOString() }),
                    newValue: "IN_PROGRESS"
                } as any
            });

            // 2. Shopify Backfill (Orders)
            await this.backfillShopify(storeId, startDate);

            // 3. Meta Ads Backfill & Snapshot Generation (Day by Day)
            await this.backfillMetaAndSnapshots(storeId, startDate);

            // 4. Audit Log: Completed
            await prisma.auditLog.create({
                data: {
                    storeId,
                    action: "BACKFILL_COMPLETED",
                    entity: "SYSTEM",
                    entityId: "backfill-service",
                    oldValue: "IN_PROGRESS",
                    newValue: "COMPLETED"
                } as any
            });

            return { success: true, message: "Backfill completed successfully from " + format(startDate, 'yyyy-MM-dd') };
        } catch (error: any) {
            console.error(`[BackfillService] Critical error during backfill:`, error);
            return { success: false, error: error.message };
        }
    }

    private static async backfillShopify(storeId: string, startDate: Date) {
        console.log(`[BackfillService] Backfilling Shopify orders...`);

        const store = await (prisma as any).store.findUnique({
            where: { id: storeId },
            include: { connections: true }
        });

        if (!store) throw new Error("Store not found");
        const shopifyConn = store.connections.find((c: any) => c.provider === "SHOPIFY");
        if (!shopifyConn) {
            console.warn(`[BackfillService] No Shopify connection found for store ${storeId}. Skipping orders.`);
            return;
        }

        const shopify = new ShopifyClient(shopifyConn.extraConfig!, shopifyConn.apiKey!);

        // Fetch ALL orders since startDate
        await shopify.getAllOrders(async (batch) => {
            console.log(`[BackfillService] Processing Shopify batch of ${batch.length} orders...`);
            for (const order of batch) {
                try {
                    await upsertShopifyOrder(order, storeId);
                } catch (e) {
                    console.error(`[BackfillService] Error upserting Shopify order ${order.id}:`, e);
                }
            }
        }, { minDate: startDate.toISOString() });
    }

    private static async backfillMetaAndSnapshots(storeId: string, startDate: Date) {
        const today = endOfDay(new Date());
        const days = eachDayOfInterval({ start: startOfDay(startDate), end: today });

        console.log(`[BackfillService] Iterating ${days.length} days for Meta Ads & Snapshots...`);

        for (const day of days) {
            const dateStr = format(day, 'yyyy-MM-dd');
            console.log(`[BackfillService] Processing day: ${dateStr}`);

            // 1. Sync Meta Ads for this specific day
            try {
                const res = await IntradaySyncService.syncWindow(storeId, 'DAY', day);
                if (!res.success) {
                    console.error(`[BackfillService] Meta Ads sync failed for ${dateStr}: ${res.error}`);
                }
            } catch (e) {
                console.error(`[BackfillService] Fatal error syncing Meta for ${dateStr}:`, e);
            }

            // 2. Generate/Update Snapshot for this day
            try {
                // Task 5: Implement Snapshot Engine properly
                // For now, call the generator to ensure daily data is coherent
                await MetricsSnapshotService.generateDailySnapshot(storeId, day, true);
            } catch (e) {
                console.error(`[BackfillService] Snapshot generation failed for ${dateStr}:`, e);
            }

            // Small pause to avoid hitting API rate limits too hard during deep backfill
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
}
