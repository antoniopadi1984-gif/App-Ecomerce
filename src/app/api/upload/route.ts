import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json(
                { success: false, error: "No file uploaded" },
                { status: 400 }
            );
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Ensure directory exists
        const uploadDir = join(process.cwd(), "public", "uploads", "products");
        try {
            await mkdir(uploadDir, { recursive: true });
        } catch (error) {
            // Ignore if directory already exists
        }

        const ext = file.name.split('.').pop() || 'tmp';
        const filename = `${uuidv4()}.${ext}`;
        const path = join(uploadDir, filename);

        await writeFile(path, buffer);

        // Return the public URL
        const fileUrl = `/uploads/products/${filename}`;

        return NextResponse.json({ success: true, url: fileUrl });
    } catch (error: any) {
        console.error("[Upload API] Error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Upload failed" },
            { status: 500 }
        );
    }
}
