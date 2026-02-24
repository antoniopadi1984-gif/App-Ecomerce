
import { NextResponse } from "next/server";
import { MetricsSnapshotService } from "@/lib/services/metrics-snapshot-service";
import { prisma } from "@/lib/prisma";
import { startOfMonth, subMonths } from "date-fns";

export async function POST(req: Request) {
    try {
        const { storeId, months = 1 } = await req.json();

        if (!storeId) {
            return NextResponse.json({ error: "Store ID is required" }, { status: 400 });
        }

        console.log(`[Maintenance] Starting Snapshot Rebuild for store ${storeId} (last ${months} months)`);

        // Rebuild from the start of the specified number of months ago
        const startDate = startOfMonth(subMonths(new Date(), months - 1));

        // This is a long-running task, ideally it should be a job
        // For now, we run it for the current month for speed in the API response
        await MetricsSnapshotService.generateRangeSnapshots(
            storeId,
            startDate,
            new Date()
        );

        return NextResponse.json({
            success: true,
            message: `Rebuild triggered for ${storeId} from ${startDate.toISOString()}`
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
