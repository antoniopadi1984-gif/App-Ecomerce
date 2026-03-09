
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateExtensionAuth } from "@/lib/auth/auth-utils";

export async function GET(req: NextRequest) {
    try {
        const user = await validateExtensionAuth(req);
        if (!user) {
            return NextResponse.json({ success: false, error: "UNAUTHORIZED", expired: true }, { status: 401 });
        }

        // Get storeId from header or fallback
        const storeId = req.headers.get("x-store-id") || "store-main";

        // Fetch products for the store
        // We could filter by user associations if needed, but for now products by store.
        const products = await prisma.product.findMany({
            where: { storeId },
            select: {
                id: true,
                title: true,
                handle: true,
                imageUrl: true,
                status: true
            },
            orderBy: { updatedAt: "desc" }
        });

        return NextResponse.json({
            success: true,
            products
        });
    } catch (error: any) {
        console.error("[EXT-PRODUCTS] Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
