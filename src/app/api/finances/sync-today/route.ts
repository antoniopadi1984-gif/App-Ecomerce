import { NextRequest, NextResponse } from "next/server";
import { MetricsSnapshotService } from "@/lib/services/metrics-snapshot-service";
import { requireStoreIdNext } from "@/lib/server/store-context";

export async function GET(request: NextRequest) {
    try {
        const storeId = await requireStoreIdNext();

        // Sincronizar los últimos 120 días para cubrir histórico (Oct, Nov, Dic, Ene, Feb)
        const today = new Date();
        const startPath = new Date();
        startPath.setDate(today.getDate() - 120);

        console.log(`[sync-today] Triggering backfill from ${startPath.toISOString()} to ${today.toISOString()}`);

        // Ejecutamos en segundo plano para no bloquear al usuario
        MetricsSnapshotService.generateRangeSnapshots(storeId, startPath, today)
            .then(() => console.log(`[sync-today] Full backfill completed`))
            .catch(e => console.error(`[sync-today] Full backfill failed:`, e));

        return NextResponse.json({
            success: true,
            message: "Sincronización histórica iniciada",
            date: today.toISOString()
        });
    } catch (error: any) {
        console.error("[sync-today] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
