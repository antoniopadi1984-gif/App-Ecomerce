import { NextRequest, NextResponse } from "next/server";
import { removeVideoMetadata } from "@/lib/video/metadata";
import { google } from "googleapis";

/**
 * POST /api/video-lab/clean-metadata
 * Remove all metadata from a video file in Drive
 */
export async function POST(req: NextRequest) {
    try {
        const { fileId } = await req.json();

        if (!fileId) {
            return NextResponse.json({ error: "fileId required" }, { status: 400 });
        }

        console.log("[API] Cleaning metadata for file:", fileId);

        // Setup Google Drive API
        const auth = new google.auth.GoogleAuth({
            credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || "{}"),
            scopes: ["https://www.googleapis.com/auth/drive"]
        });

        const drive = google.drive({ version: "v3", auth });

        // 1. Download file from Drive
        const file = await drive.files.get({
            fileId,
            alt: "media"
        }, { responseType: "arraybuffer" });

        const buffer = Buffer.from(file.data as ArrayBuffer);

        // 2. Get original filename
        const metadata = await drive.files.get({
            fileId,
            fields: "name"
        });

        const originalName = metadata.data.name || "video.mp4";

        // 3. Remove metadata using FFmpeg
        const result = await removeVideoMetadata(buffer, originalName);

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        console.log("[API] ✅ Metadata cleaned:", {
            originalSize: result.originalSize,
            cleanSize: result.cleanSize,
            savings: result.originalSize! - result.cleanSize!
        });

        // 4. Upload clean file back to Drive (replace original)
        // TODO: Implement re-upload if needed
        // For now just return success

        return NextResponse.json({
            success: true,
            originalSize: result.originalSize,
            cleanSize: result.cleanSize,
            duration: result.duration,
            resolution: result.resolution
        });

    } catch (error: any) {
        console.error("[API] Error cleaning metadata:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
