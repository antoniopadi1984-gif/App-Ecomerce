import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { productId, type, resultText, jobId } = body;

        if (!productId || !resultText) {
            return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
        }

        // Find current max version for this type
        const lastVersion = await (prisma as any).copyArtifact.findFirst({
            where: { productId, type },
            orderBy: { version: 'desc' }
        });

        const newVersion = (lastVersion?.version || 0) + 1;

        const artifact = await (prisma as any).copyArtifact.create({
            data: {
                productId,
                type: type || "General Copy",
                content: resultText,
                version: newVersion,
                source: "CLAUDE"
            }
        });

        if (jobId) {
            await (prisma as any).copyJob.update({
                where: { id: jobId },
                data: { status: "COMPLETED" }
            });

            await (prisma as any).copyConversationLink.create({
                data: {
                    jobId,
                    artifactId: artifact.id,
                    notes: "Importado vía extensión Bridge"
                }
            });
        }

        revalidatePath('/marketing/research');

        return NextResponse.json({ success: true, id: artifact.id, version: newVersion });
    } catch (error: any) {
        console.error("Copy Import API Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
