
import { NextResponse } from "next/server";
import { createJob } from "@/lib/worker";

/**
 * Endpoint to trigger an automated logistics sync via background worker.
 * Can be called by a cron job or manually.
 */
export async function POST() {
    try {
        const job = await createJob('LOGISTICS_SYNC', {});
        return NextResponse.json({
            success: true,
            message: "Logistics sync job queued",
            jobId: job.id
        });
    } catch (e: any) {
        console.error("[Logistics Sync API Error]", e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
