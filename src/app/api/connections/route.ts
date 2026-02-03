import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const connections = await prisma.connection.findMany({
            where: { isActive: true },
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
