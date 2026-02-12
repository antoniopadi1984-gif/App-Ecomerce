import { NextRequest, NextResponse } from "next/server";
import { AssetOrganizer } from "@/lib/drive/asset-organizer";

/**
 * POST /api/video-lab/ai-classify
 * Use AI to classify video and suggest concept + folder
 */
export async function POST(req: NextRequest) {
    try {
        const { fileId, fileName, productId } = await req.json();

        if (!fileId || !fileName || !productId) {
            return NextResponse.json({
                error: "fileId, fileName, and productId required"
            }, { status: 400 });
        }

        console.log("[API] AI classifying:", fileName);

        const organizer = new AssetOrganizer();
        const result = await organizer.organizeFile(fileId, fileName, productId);

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        console.log("[API] ✅ Classified:", result.newPath);

        return NextResponse.json({
            success: true,
            targetPath: result.newPath,
            message: `Clasificado en: ${result.newPath}`
        });

    } catch (error: any) {
        console.error("[API] Error classifying:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
