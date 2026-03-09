
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateExtensionAuth } from "@/lib/auth/auth-utils";

export async function POST(req: NextRequest) {
    try {
        const userPayload = await validateExtensionAuth(req);
        if (!userPayload) {
            return NextResponse.json({ success: false, error: "UNAUTHORIZED" }, { status: 401 });
        }

        const body = await req.json();
        const { productId } = body;

        if (!productId) {
            return NextResponse.json({ success: false, error: "Missing productId" }, { status: 400 });
        }

        // Verify product exists
        const product = await prisma.product.findUnique({
            where: { id: productId }
        });

        if (!product) {
            return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
        }

        // Save as active for the user
        await prisma.user.update({
            where: { id: userPayload.userId },
            data: { activeProductId: productId }
        });

        return NextResponse.json({
            success: true,
            productId,
            productTitle: product.title
        });
    } catch (error: any) {
        console.error("[EXT-SET-ACTIVE] Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
