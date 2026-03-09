import { prisma } from "@/lib/prisma";
import cron from "node-cron";
import { syncBeepingOrders } from "@/lib/handlers/beeping-sync";
import { syncMetaInsights } from "@/lib/handlers/meta-insights-sync";
import { syncOrdersToDb } from "@/lib/handlers/shopify-sync";
import { ShopifyClient } from "@/lib/shopify";
import { getConnectionSecret } from "@/lib/server/connections";
import { MetricsSnapshotService } from "@/lib/services/metrics-snapshot-service";
import { subDays } from "date-fns";

export async function registerNodeOnly() {
    const { spawn } = await import("child_process");
    const path = await import("path");

    // Evita duplicados en dev/hot reload
    if ((global as any)._workerStarted) {
        console.log("⏭️ [Instrumentation] Worker already started, skipping...");
        return;
    }
    (global as any)._workerStarted = true;

    console.log("⚙️ [Instrumentation] System initializing...");

    // Auto-connection (no bloquea)
    (async () => {
        try {
            const { AutoConnectionService } = await import("@/lib/server/auto-connection-service");
            await AutoConnectionService.run();
        } catch (e) {
            console.error("❌ [Instrumentation] AutoConnection failed:", e);
        }
    })();

    // Worker/Engine & Cron Jobs
    (async () => {
        try {
            // Solo en producción o si se fuerza activamos el worker y crons
            if (process.env.NODE_ENV !== "production" && !process.env.FORCE_WORKER) {
                console.log("🛑 [Instrumentation] Worker & Crons disabled in development mode.");
                return;
            }

            console.log("🚀 [Instrumentation] Auto-Starting Worker Sidecar...");
            const { initHandlers, startWorker } = await import("@/lib/worker");
            await initHandlers();
            startWorker();
            console.log("✅ [Instrumentation] Worker Sidecar is now backgrounded.");

            // --- 9.4 CRON JOBS AUTOMÁTICOS ---
            console.log("⏰ [Instrumentation] Initializing Scheduled Tasks...");

            /**
             * Helper para ejecutar con Lock en SystemHeartbeat
             */
            const withLock = async (jobName: string, task: () => Promise<void>) => {
                try {
                    const heartbeat = await (prisma as any).systemHeartbeat.findUnique({ where: { id: "singleton" } });

                    // Si el estado es RUNNING y el timestamp es de hace menos de 10 min, asumimos que está bloqueado
                    if (heartbeat?.status === "RUNNING_" + jobName &&
                        heartbeat.timestamp > new Date(Date.now() - 10 * 60 * 1000)) {
                        console.log(`[Cron] Job ${jobName} is already running, skipping...`);
                        return;
                    }

                    // Adquirir Lock
                    await (prisma as any).systemHeartbeat.upsert({
                        where: { id: "singleton" },
                        update: { status: "RUNNING_" + jobName, timestamp: new Date() },
                        create: { id: "singleton", status: "RUNNING_" + jobName, timestamp: new Date() }
                    });

                    console.log(`[Cron] [START] ${jobName}`);
                    await task();
                    console.log(`[Cron] [FINISH] ${jobName}`);

                    // Liberar Lock
                    await (prisma as any).systemHeartbeat.update({
                        where: { id: "singleton" },
                        data: { status: "OK", timestamp: new Date() }
                    });
                } catch (e: any) {
                    console.error(`[Cron] [ERROR] ${jobName}:`, e.message);
                    await (prisma as any).systemHeartbeat.update({
                        where: { id: "singleton" },
                        data: { status: "ERROR_" + jobName, timestamp: new Date() }
                    }).catch(() => { });
                }
            };

            // 1. Beeping Sync: cada 6 horas (00:00, 06:00, 12:00, 18:00)
            cron.schedule("0 */6 * * *", () => {
                withLock("BEEPING_SYNC", async () => {
                    const stores = await (prisma as any).store.findMany();
                    for (const store of stores) {
                        await syncBeepingOrders(store.id, 7); // Sync last 7 days frequently
                    }
                });
            });

            // 2. Meta Insights: cada hora
            cron.schedule("0 * * * *", () => {
                withLock("META_INSIGHTS_SYNC", async () => {
                    const stores = await (prisma as any).store.findMany();
                    for (const store of stores) {
                        const activeAccounts = await (prisma as any).metaAdAccount.findMany({
                            where: { storeId: store.id, isActive: true }
                        });
                        for (const acc of activeAccounts) {
                            await syncMetaInsights(store.id, acc.accountId, 1); // Sync last 1 day hourly
                        }
                        await MetricsSnapshotService.generateDailySnapshot(store.id, new Date(), true);
                    }
                });
            });

            // 3. Shopify Orders: cada 2 horas (órdenes de las últimas 24h)
            cron.schedule("0 */2 * * *", () => {
                withLock("SHOPIFY_SYNC", async () => {
                    const stores = await (prisma as any).store.findMany();
                    for (const store of stores) {
                        const shop = await getConnectionSecret(store.id, 'SHOPIFY_SHOP');
                        const token = await getConnectionSecret(store.id, 'SHOPIFY');
                        if (shop && token) {
                            const client = new ShopifyClient(shop, token);
                            // Últimas 24h aprox.
                            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
                            const data = await client.getOrdersHistorical({ from: yesterday });
                            await syncOrdersToDb(store.id, data.orders);
                        }
                    }
                });
            });

            // 4. DailySnapshot Rebuild: cada noche a las 2:00 AM
            cron.schedule("0 2 * * *", () => {
                withLock("SNAPSHOT_REBUILD", async () => {
                    const stores = await (prisma as any).store.findMany();
                    const yesterday = subDays(new Date(), 1);
                    for (const store of stores) {
                        await MetricsSnapshotService.generateDailySnapshot(store.id, yesterday, true);
                    }
                });
            });

            console.log("🚀 [Instrumentation] Auto-Starting EcomBoom Control Engine...");
            const engineScript = path.resolve(process.cwd(), "src/engine/start_engine.sh");
            const engineProcess = spawn("bash", [engineScript], {
                detached: true,
                stdio: "ignore",
                cwd: process.cwd(),
            });
            engineProcess.unref();

        } catch (e) {
            console.error("❌ [Instrumentation] Failed to auto-start worker or crons:", e);
            (global as any)._workerStarted = false;
        }
    })();
}
