
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const job = await (prisma as any).job.findUnique({
            where: { id }
        });

        if (!job) {
            return NextResponse.json({ error: "Job not found" }, { status: 404 });
        }

        return NextResponse.json({
            id: job.id,
            status: job.status,
            progress: job.progress,
            result: job.result ? JSON.parse(job.result) : null,
            error: job.lastError
        });
    } catch (e) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
