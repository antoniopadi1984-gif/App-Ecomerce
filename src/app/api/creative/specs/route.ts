import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const productId = searchParams.get("productId");

        if (!productId) {
            return NextResponse.json({ error: "Missing productId" }, { status: 400 });
        }

        const product = await prisma.product.findUnique({
            where: { id: productId },
            include: {
                avatarResearches: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                },
                angles: {
                    where: { isWinner: true },
                    take: 3
                }
            }
        });

        if (!product) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        const research = product.avatarResearches[0] || {};
        const angles = product.angles.length > 0 ? product.angles : [];

        // Build strategic context
        const context = {
            productName: product.title,
            description: product.description,
            angles: angles.map(a => ({
                title: a.title,
                hook: a.hook,
                benefit: a.benefit
            })),
            targetAvatar: {
                desires: research.desires,
                fears: research.fears,
                mainDesire: research.mainDesire
            },
            compliance: {
                safeMode: !!searchParams.get("safeMode") // Default to store preference if needed
            }
        };

        // Standardized prompt builders
        const specs = {
            STATIC_AD: {
                prompt: `High-end commercial photography for ${product.title}. Aesthetic: Premium, clean, minimal. Narrative hook: ${angles[0]?.hook || 'Unbeatable value'}. Target emotions: ${research.desires || 'Satisfaction'}.`,
                aspect_ratio: "1:1"
            },
            IMAGE_TO_VIDEO: {
                prompt: `A dynamic UGC-style video showcasing ${product.title}. The person looks ${research.howTheyTalk || 'happy and relatable'}. Action: Unboxing and testing. Hook: ${angles[0]?.benefit || 'Saves time'}.`,
                aspect_ratio: "9:16"
            },
            AVATAR_LIPSYNC: {
                prompt: `A professional spokesperson presenting ${product.title}. Script focus: ${research.whyItSells || 'Key product features'}. Tone: Persuasive but natural.`,
                aspect_ratio: "9:16"
            },
            COPYWRITING: {
                prompt: `Write a high-converting Facebook Ad copy for ${product.title}. Angle: ${angles[0]?.title || 'Direct Response'}. Focus on: ${research.mainDesire || 'Primary benefit'}. Include a strong Hook and CTA.`,
                format: "AD_STATIC"
            }
        };

        return NextResponse.json({ success: true, context, specs });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
