import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureProductDrive } from "@/lib/drive/schema";

// Helper for Extension to upload scraped data directly to Product Drive
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { userId, storeId, productId, type, url, metadata } = body;

        if (!userId || !storeId || !productId || !type) {
            return NextResponse.json({ error: "Missing required params (userId, storeId, productId, type)" }, { status: 400 });
        }

        // 1. Ensure Product Drive Structure
        await ensureProductDrive(storeId, productId);

        // 2. Identify Type (AD_SPY, COMPETITOR_IMAGE, LANDING_SNAPSHOT)
        let saveResult;

        if (type === "AD_SPY") {
            saveResult = await (prisma as any).adSpyCapture.create({
                data: {
                    type: "VIDEO_AD",
                    platform: "META",
                    url: url || "",
                    metadata: JSON.stringify(metadata)
                }
            });
        } else if (type === "COMPETITOR_IMAGE") {
            saveResult = await (prisma as any).driveAsset.create({
                data: {
                    productId,
                    driveFileId: "ext_" + Date.now(), // Real implementation uses Google Drive API push
                    drivePath: `Store/${storeId}/Products/${productId}/Assets_Competencia/`,
                    assetType: "IMAGE",
                    sourceUrl: url,
                    category: "Competitor",
                    createdBy: userId
                }
            });
        } else if (type === "LANDING_SNAPSHOT") {
            saveResult = await (prisma as any).competitorLanding.create({
                data: {
                    productId,
                    url,
                    type: "SALES_PAGE",
                    structureJson: JSON.stringify(metadata),
                    status: "DETECTED"
                }
            });
        }

        return NextResponse.json({ success: true, message: `Captured and saved to Drive schema`, data: saveResult });
    } catch (err: any) {
        console.error("Ext Capture Error:", err);
        return NextResponse.json({ error: "Failed to process capture" }, { status: 500 });
    }
}
