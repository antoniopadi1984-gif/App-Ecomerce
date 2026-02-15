import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const storeId = request.headers.get("X-Store-Id");

        const connections = await prisma.connection.findMany({
            where: {
                isActive: true,
                ...(storeId ? { storeId } : {}),
            },
            select: {
                id: true,
                provider: true,
                updatedAt: true,
                isActive: true
            }
        });
        return NextResponse.json(connections);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch connections" }, { status: 500 });
    }
}
