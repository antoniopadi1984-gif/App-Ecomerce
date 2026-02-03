"use server";

import prisma from "@/lib/prisma";

export async function getSpyHistory() {
    try {
        const captures = await prisma.adSpyCapture.findMany({
            orderBy: { createdAt: "desc" },
            take: 20
        });

        return { success: true, data: captures };
    } catch (error) {
        console.error(error);
        return { success: false, data: [] };
    }
}

export async function processCapture(captureId: string) {
    const { askGemini } = await import("@/lib/ai");
    const prisma = (await import("@/lib/prisma")).default;

    try {
        const capture = await (prisma as any).adSpyCapture.findUnique({ where: { id: captureId } });
        if (!capture) return { success: false, error: "Capture not found" };

        const engineUrl = "http://localhost:8000";

        // 1. Metadata Cleaning & MP4 Assembly (if needed)
        // For cascade level 1 (direct) or 2 (stream), we clean metadata.
        // For now, we simulate the cleaning if engine is offline or call remove-metadata.
        let cleanedUrl = capture.url;
        try {
            const formData = new FormData();
            // In a real scenario, we'd fetch the video and send it. 
            // For now, if it's a direct URL, we pass it.
            const cleanRes = await fetch(`${engineUrl}/remove-metadata-from-url`, {
                method: "POST",
                body: JSON.stringify({ url: capture.url })
            }).then(r => r.json()).catch(() => null);

            if (cleanRes?.success) cleanedUrl = cleanRes.output_url;
        } catch (e) {
            console.log("Metadata cleaning skipped or failed:", e);
        }

        // 2. STT & Script Generation via Gemini Vision/Audio
        const sttPrompt = `
            Analyze this advertisement video.
            1. Extract the COMPLETE Word-for-Word script of the speaker/text.
            2. Re-write the script as a "Clean Script" for maximum marketing impact (No emojis, professional tone).
            
            RESPOND ONLY IN JSON FORMAT:
            {
                "originalScript": "...",
                "cleanScript": "..."
            }
        `;

        console.log(`[AdSpy] Processing STT for capture ${captureId}`);
        const aiResponse = await askGemini(sttPrompt, capture.originalUrl);

        let sttScript = ""; // Initialize sttScript here
        if (aiResponse.text) {
            try {
                const cleaned = aiResponse.text.replace(/```json/g, "").replace(/```/g, "").trim();
                const json = JSON.parse(cleaned);
                sttScript = json.cleanScript || json.originalScript; // Assign to sttScript
                await (prisma as any).adSpyCapture.update({
                    where: { id: captureId },
                    data: {
                        sttScript: sttScript, // Use the assigned sttScript
                        status: 'PROCESSED',
                        cleanedUrl // Ensure cleanedUrl is also updated here
                    }
                });
                console.log(`[AdSpy] STT Success for ${captureId}`);
            } catch (e) {
                console.error(`[AdSpy] JSON Parse error for ${captureId}:`, aiResponse.text);
                sttScript = aiResponse.text; // Assign raw text if JSON parsing fails
                await (prisma as any).adSpyCapture.update({
                    where: { id: captureId },
                    data: {
                        sttScript: sttScript, // Use the assigned sttScript
                        status: 'PROCESSED',
                        cleanedUrl // Ensure cleanedUrl is also updated here
                    }
                });
            }
        } else {
            console.error(`[AdSpy] AI failed for ${captureId}:`, aiResponse.error);
            await (prisma as any).adSpyCapture.update({
                where: { id: captureId },
                data: { status: 'ERROR' }
            });
            return { success: false, error: aiResponse.error || "AI processing failed" }; // Return early on AI failure
        }

        return { success: true, sttScript, cleanedUrl };
    } catch (error: any) {
        console.error("Process Capture Error:", error);
        return { success: false, error: error.message };
    }
}

export async function saveSpySession(data: any) {
    try {
        const capture = await prisma.adSpyCapture.create({
            data: {
                type: data.type || "VIDEO",
                platform: data.platform,
                url: data.cleanVideoUrl || "https://example.com",
                originalUrl: data.originalUrl || "",
                title: data.title,
                captureMethod: data.captureMethod || "direct",
                metadata: JSON.stringify(data.analysis || {}),
                status: "INBOX"
            }
        });

        // Auto-trigger processing
        await processCapture(capture.id);

        return { success: true, capture };
    } catch (e) {
        console.error(e);
        return { success: false };
    }
}
