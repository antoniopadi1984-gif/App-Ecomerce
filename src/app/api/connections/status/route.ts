import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hasActiveConnection } from "@/lib/server/connections";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get("storeId");
    const service = searchParams.get("service");

    if (!storeId || !service) {
        return NextResponse.json({ error: "Missing required params" }, { status: 400 });
    }

    try {
        const isConnected = await hasActiveConnection(storeId, service);
        return NextResponse.json({ isConnected });
    } catch (error) {
        console.error("Connection Status API Error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
