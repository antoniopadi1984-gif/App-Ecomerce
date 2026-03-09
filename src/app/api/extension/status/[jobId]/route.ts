
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateExtensionAuth } from "@/lib/auth/auth-utils";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ jobId: string }> }
) {
    try {
        const userPayload = await validateExtensionAuth(req);
        if (!userPayload) {
            return NextResponse.json({ success: false, error: "UNAUTHORIZED" }, { status: 401 });
        }

        const { jobId } = await params;

        const job = await prisma.mediaJob.findUnique({
            where: { id: jobId },
            include: {
                capture: {
                    select: {
                        status: true,
                        cleanedUrl: true,
                        assetUrl: true,
                        assetType: true
                    }
                }
            }
        });

        if (!job) {
            return NextResponse.json({ success: false, error: "JOB_NOT_FOUND" }, { status: 404 });
        }

        // Parse logs
        const logs = job.stepsLog ? JSON.parse(job.stepsLog) : [];

        return NextResponse.json({
            success: true,
            jobId: job.id,
            status: job.status,
            progress: {
                current: job.currentStep,
                total: job.totalSteps,
                percentage: job.totalSteps > 0 ? Math.round((job.currentStep / job.totalSteps) * 100) : 0
            },
            logs,
            result: job.status === 'COMPLETED' ? {
                originalUrl: job.capture.assetUrl,
                cleanedUrl: job.capture.cleanedUrl
            } : null,
            error: job.error
        });

    } catch (error: any) {
        console.error("[JOB-STATUS] Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
