
import { NextResponse } from "next/server";
import { createJob } from "@/lib/worker";

export async function POST() {
    try {
        const job = await createJob('MAINTENANCE', {});
        return NextResponse.json({ success: true, jobId: job.id });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
