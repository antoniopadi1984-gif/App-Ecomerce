import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const store = await prisma.store.findFirst();
        if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

        const config = await (prisma as any).clowdbotConfig.findUnique({
            where: { storeId: store.id }
        });

        return NextResponse.json(config);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch config" }, { status: 500 });
    }
}
