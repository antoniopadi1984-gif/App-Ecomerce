import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { url, type, title, metadata } = body;

        if (!url) {
            return NextResponse.json({ success: false, error: "Missing URL" }, { status: 400 });
        }

        const capture = await (prisma as any).adSpyCapture.create({
            data: {
                url,
                type: type || "VIDEO",
                platform: body.platform || metadata?.platforms?.[0] || "META",
                title: title || metadata?.libraryId || "Anuncio Capturado",
                originalUrl: metadata?.sourceUrl,
                captureMethod: body.captureMethod || "direct",
                metadata: JSON.stringify(metadata || {}),
                status: "INBOX"
            }
        });

        console.log(`[CAPTURE] Saved via ${capture.captureMethod} for ${capture.platform}`);
        return NextResponse.json({ success: true, id: capture.id });
    } catch (error: any) {
        console.error("Capture API Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
