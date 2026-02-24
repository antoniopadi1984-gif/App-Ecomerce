import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/creative/batch?productId=xxx
 * Lists active and recent batches for a product.
 */
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");

    if (!productId) {
        return NextResponse.json({ error: "Missing productId" }, { status: 400 });
    }

    try {
        const db = prisma as any;
        const batches = await db.creativeBatch.findMany({
            where: { productId },
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: {
                jobs: {
                    select: { status: true }
                }
            }
        });

        return NextResponse.json({ batches });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
