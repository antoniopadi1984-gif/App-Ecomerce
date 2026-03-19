
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateExtensionAuth } from "@/lib/auth/auth-utils";

export async function POST(req: NextRequest) {
    try {
        const userPayload = { userId: "default" };

        const body = await req.json();
        const { advertiserUrl, advertiserName, platform = "META", productId: bodyProductId } = body;

        if (!advertiserUrl) {
            return NextResponse.json({ success: false, error: "Missing advertiserUrl" }, { status: 400 });
        }

        // Determine productId
        let productId = bodyProductId;
        // productId viene del body

        const storeId = req.headers.get("x-store-id") || "store-main";

        // Create job entry
        const spyJob = await prisma.competitorLibrary.create({
            data: {
                storeId,
                productId,
                advertiserUrl,
                advertiserName,
                platform,
                status: "PENDING"
            }
        });

        // Here we would typically trigger an async worker
        // for now just returning the job
        console.log(`[EXT-SPY] Job created: ${spyJob.id} for ${advertiserUrl}`);

        return NextResponse.json({
            success: true,
            jobId: spyJob.id,
            status: spyJob.status
        });
    } catch (error: any) {
        console.error("[EXT-SPY] Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
