import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { syncShopifyHistory, syncBeepingStatuses } from "@/app/pedidos/actions";
import { MetricsSnapshotService } from "@/lib/services/metrics-snapshot-service";
import { subDays } from "date-fns";

export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get("authorization");
        // Simple security check if needed, otherwise allow internal cron

        console.log("🚀 [FullSync] Starting Unified Automated Sync...");

        const store = await (prisma as any).store.findFirst();
        if (!store) throw new Error("No store found");

        // 1. Shopify Recent Sync (Fetch new orders)
        console.log("📦 [FullSync] Syncing recent Shopify orders...");
        await syncShopifyHistory(store.id);

        // 2. Beeping Status Sync (Fetch logistics updates)
        console.log("🚚 [FullSync] Syncing Beeping statuses...");
        await syncBeepingStatuses(0);

        // 3. Regenerate Snapshots (Today & Yesterday)
        // This also triggers Meta Ads sync inside MetricsSnapshotService
        console.log("📊 [FullSync] Regenerating snapshots (Today & Yesterday)...");
        const today = new Date();
        const yesterday = subDays(today, 1);

        await MetricsSnapshotService.generateDailySnapshot(store.id, yesterday, true);
        await MetricsSnapshotService.generateDailySnapshot(store.id, today, true);

        return NextResponse.json({
            success: true,
            message: "Sincronización completa finalizada con éxito.",
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error("❌ [FullSync] Failed:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
