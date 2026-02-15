
import { NextResponse } from "next/server";
import { BackfillService } from "@/lib/services/backfill-service";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const startDateParam = searchParams.get('startDate');
        const startDate = startDateParam ? new Date(startDateParam) : new Date("2025-01-01");

        let storeId = searchParams.get('storeId');
        if (!storeId) {
            const store = await (prisma as any).store.findFirst();
            storeId = store?.id;
        }

        if (!storeId) {
            return NextResponse.json({ error: "No store found" }, { status: 400 });
        }

        console.log(`[API] Triggering historical backfill for store ${storeId} from ${startDate.toISOString()}`);

        // Run in background (don't await fully to avoid timeout in some environments, 
        // but for now we expect a quick start or long-running process handled by the server)
        const result = await BackfillService.runBackfill(storeId, startDate);

        return NextResponse.json(result);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
