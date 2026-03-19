
import { NextRequest, NextResponse } from "next/server";
import { VoiceOverFlow } from "@/lib/video/voiceover-flow";
import { validateExtensionAuth } from "@/lib/auth/auth-utils";

export async function POST(req: NextRequest) {
    try {
        const userPayload = await validateExtensionAuth(req);
        if (!userPayload) {
            return NextResponse.json({ success: false, error: "UNAUTHORIZED" }, { status: 401 });
        }

        const { videoId } = await req.json();

        if (!videoId) {
            return NextResponse.json({ success: false, error: "videoId is required" }, { status: 400 });
        }

        const result = await VoiceOverFlow.executeRemoval(videoId);

        return NextResponse.json({ success: true, url: result.url });

    } catch (error: any) {
        console.error("[VO-REMOVE-API] Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
