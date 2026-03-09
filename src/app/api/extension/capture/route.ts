
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
        const { url, assetType, assetUrl, metadata, productId: bodyProductId } = body;

        if (!url || !assetType || !assetUrl) {
            return NextResponse.json({ success: false, error: "Missing required fields (url, assetType, assetUrl)" }, { status: 400 });
        }

        // Determine productId: from body or from user's active product
        let productId = bodyProductId;
        if (!productId) {
            const user = await prisma.user.findUnique({
                where: { id: userPayload.userId },
                select: { activeProductId: true }
            });
            productId = user?.activeProductId;
        }

        // Get storeId
        const storeId = req.headers.get("x-store-id") || "store-main";

        // Determine initial status: images/videos need cleaning
        const needsCleaning = assetType === "IMAGE" || assetType === "VIDEO" || assetType === "GIF";
        const initialStatus = needsCleaning ? "PENDING_CLEANING" : "SAVED";

        // Save capture
        const capture = await prisma.extensionCapture.create({
            data: {
                storeId,
                productId,
                userId: userPayload.userId,
                url,
                assetType, // IMAGE, VIDEO, GIF, LANDING, AD
                assetUrl,
                metadata: metadata ? JSON.stringify(metadata) : null,
                status: initialStatus
            }
        });

        // Create initial job record if cleaning is needed
        let jobId = null;
        if (needsCleaning) {
            const totalSteps = assetType === 'VIDEO' ? 23 : 10;
            const job = await prisma.mediaJob.create({
                data: {
                    captureId: capture.id,
                    status: 'PENDING',
                    totalSteps,
                    stepsLog: JSON.stringify([])
                }
            });
            jobId = job.id;
        }

        return NextResponse.json({
            success: true,
            id: capture.id,
            jobId: jobId
        });

        // Optional: If it's a video/ad, we might want to also create a CompetitorAd entry
        // for deeper analysis later.

        return NextResponse.json({ success: true, id: capture.id });
    } catch (error: any) {
        console.error("[EXT-CAPTURE] Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const userPayload = await validateExtensionAuth(req);
        if (!userPayload) {
            return NextResponse.json({ success: false, error: "UNAUTHORIZED" }, { status: 401 });
        }

        const captures = await prisma.extensionCapture.findMany({
            where: { userId: userPayload.userId },
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        return NextResponse.json({ success: true, captures });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
