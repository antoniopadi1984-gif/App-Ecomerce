import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/video-lab/drive-files
 * List actual files from product's Google Drive folder
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const productId = searchParams.get("productId");
        const folderId = searchParams.get("folderId");

        if (!productId) {
            return NextResponse.json({ error: "productId required" }, { status: 400 });
        }

        // Get product's Drive folder ID if folderId not provided
        const product = await prisma.product.findUnique({
            where: { id: productId },
            select: { driveFolderId: true, title: true }
        });

        if (!product || !product.driveFolderId) {
            return NextResponse.json({ error: "Product has no Drive folder configured" }, { status: 404 });
        }

        const targetFolderId = folderId || product.driveFolderId;

        // Setup Google Drive API
        const auth = new google.auth.GoogleAuth({
            credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || "{}"),
            scopes: ["https://www.googleapis.com/auth/drive.readonly"]
        });

        const drive = google.drive({ version: "v3", auth });

        console.log(`[API] Listing Drive files for folder: ${targetFolderId}`);

        // Optimization: Fetch storage and files in parallel
        const [filesRes, aboutRes] = await Promise.all([
            drive.files.list({
                q: `'${targetFolderId}' in parents and trashed=false`,
                fields: "files(id, name, mimeType, createdTime, webViewLink, thumbnailLink)",
                pageSize: 100,
                orderBy: "folder,name"
            }),
            drive.about.get({
                fields: "storageQuota,user"
            })
        ]).catch(err => {
            console.error("[API] Drive API Promise.all Error:", err);
            throw err;
        });

        const storage = aboutRes.data.storageQuota;
        console.log(`[API] Storage Quota fetched:`, storage);
        console.log(`[API] Account:`, aboutRes.data.user?.emailAddress);

        const files = (filesRes.data.files || []).map(file => ({
            id: file.id,
            name: file.name,
            mimeType: file.mimeType,
            type: getAssetType(file.mimeType || ""),
            isFolder: file.mimeType === "application/vnd.google-apps.folder",
            createdTime: file.createdTime,
            webViewLink: file.webViewLink,
            thumbnailLink: file.thumbnailLink,
        }));

        // Get breadcrumbs/parent info if we are in a subfolder
        let parentInfo = null;
        if (folderId && folderId !== product.driveFolderId) {
            try {
                const parentRes = await drive.files.get({
                    fileId: folderId,
                    fields: "id, name, parents"
                });
                parentInfo = {
                    id: parentRes.data.id,
                    name: parentRes.data.name,
                    parentId: parentRes.data.parents?.[0] || product.driveFolderId
                };
            } catch (e) {
                console.warn("Could not fetch parent info", e);
            }
        }

        return NextResponse.json({
            files,
            count: files.length,
            product: product.title,
            currentFolderId: targetFolderId,
            parentInfo,
            storage: {
                limit: storage?.limit || "0",
                usageInDrive: storage?.usageInDrive || "0",
                usage: storage?.usage || "0"
            }
        });

    } catch (error: any) {
        console.error("[API] Error listing Drive files:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

function getAssetType(mimeType: string): string {
    if (mimeType.startsWith("video/")) return "video";
    if (mimeType.startsWith("image/")) return "image";
    if (mimeType.includes("pdf") || mimeType.includes("document")) return "document";
    return "other";
}
