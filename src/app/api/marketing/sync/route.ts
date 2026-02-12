
import { NextResponse } from "next/server";
import { IntradaySyncService } from "@/lib/services/intraday-service";

export async function POST(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const storeId = "default-store"; // For now, or get from session
        const win = (searchParams.get('window') || 'DAY') as any;
        const days = parseInt(searchParams.get('days') || '1');
        const force = searchParams.get('force') === 'true';
        const safeDays = force ? Math.min(days, 90) : Math.min(days, 14);

        console.log(`[Marketing Sync] Triggering sync for store ${storeId}, window: ${win}, days: ${safeDays} (force: ${force})`);

        let totalSynced = 0;
        const logs: string[] = [];

        // Backfill loop for historical data
        for (let i = 0; i < safeDays; i++) {
            const targetDate = new Date();
            targetDate.setDate(targetDate.getDate() - i);
            const res = await IntradaySyncService.syncWindow(storeId, win, targetDate);
            if (res.success) {
                totalSynced += res.synced || 0;
                logs.push(...(res.logs || []));
            }

            // Small pause between days if multi-day sync
            if (safeDays > 1 && i < safeDays - 1) {
                await new Promise(r => setTimeout(r, 1000));
            }
        }

        return NextResponse.json({ success: true, synced: totalSynced, debugLogs: logs });
    } catch (e: any) {
        return NextResponse.json({
            error: e.message,
            stack: e.stack,
            type: e.constructor.name
        }, { status: 500 });
    }
}
