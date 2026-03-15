
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

        // Start async process (Steps 1-3)
        // We don't await the whole thing if we want to return fast, 
        // but the user says "El job debe ser asíncrono con polling".
        // Actually, we can return the promise or a jobId.
        // For now, let's run it and return success for the trigger.

        VoiceOverFlow.prepareForRemoval(videoId).catch(e => {
            console.error(`[VO-PREPARE-API] Async error for ${videoId}:`, e);
        });

        return NextResponse.json({ success: true, message: "Voice-over preparation started" });

    } catch (error: any) {
        console.error("[VO-PREPARE-API] Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
