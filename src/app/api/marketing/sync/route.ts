
import { NextResponse } from "next/server";
import { IntradaySyncService } from "@/lib/services/intraday-service";

export async function POST(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const storeId = "default-store"; // For now, or get from session
        const win = (searchParams.get('window') || 'DAY') as any;
        const days = parseInt(searchParams.get('days') || '1');

        console.log(`[Marketing Sync] Triggering sync for store ${storeId}, window: ${win}, days: ${days}`);

        let totalSynced = 0;
        const logs: string[] = [];

        // Backfill loop for historical data
        for (let i = 0; i < days; i++) {
            const targetDate = new Date();
            targetDate.setDate(targetDate.getDate() - i);
            const res = await IntradaySyncService.syncWindow(storeId, win, targetDate);
            if (res.success) {
                totalSynced += res.synced || 0;
                logs.push(...(res.logs || []));
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
