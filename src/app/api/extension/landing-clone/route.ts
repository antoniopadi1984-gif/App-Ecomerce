
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateExtensionAuth } from "@/lib/auth/auth-utils";

export async function POST(req: NextRequest) {
    try {
        const userPayload = await validateExtensionAuth(req);
        if (!userPayload) {
            return NextResponse.json({ success: false, error: "UNAUTHORIZED" }, { status: 401 });
        }

        const body = await req.json();
        const { originalUrl, productId: bodyProductId } = body;

        if (!originalUrl) {
            return NextResponse.json({ success: false, error: "Missing originalUrl" }, { status: 400 });
        }

        // Determine productId
        let productId = bodyProductId;
        if (!productId) {
            const user = await prisma.user.findUnique({
                where: { id: userPayload.userId },
                select: { activeProductId: true }
            });
            productId = user?.activeProductId;
        }

        const storeId = req.headers.get("x-store-id") || "store-main";

        // Create clone entry
        const cloneJob = await prisma.landingClone.create({
            data: {
                storeId,
                productId,
                originalUrl,
                status: "PENDING"
            }
        });

        console.log(`[EXT-CLONE] Job created: ${cloneJob.id} for ${originalUrl}`);

        return NextResponse.json({
            success: true,
            jobId: cloneJob.id,
            status: cloneJob.status
        });
    } catch (error: any) {
        console.error("[EXT-CLONE] Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
