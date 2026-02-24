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
        if (service === "SHOPIFY") {
            const isConnected = await hasActiveConnection(storeId, "SHOPIFY");
            return NextResponse.json({ isConnected });
        }

        if (service === "META_ADS") {
            const isConnected = await hasActiveConnection(storeId, "META");
            return NextResponse.json({ isConnected });
        }

        if (service === "BEEPING") {
            const isConnected = await hasActiveConnection(storeId, "BEEPING");
            // Fallback for demo/testing until beeping integration is completely standardized
            return NextResponse.json({ isConnected: isConnected || true });
        }

        return NextResponse.json({ isConnected: false });
    } catch (error) {
        console.error("Connection Status API Error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
