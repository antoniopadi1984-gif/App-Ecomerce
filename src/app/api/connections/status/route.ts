import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hasActiveConnection } from "@/lib/server/connections";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get("storeId");

    if (!storeId) {
        return NextResponse.json({ error: "Missing storeId" }, { status: 400 });
    }

    const providers = [
        'BEEPING', 'DROPEA', 'DROPI', 'SHOPIFY', 'META',
        'GOOGLE_CLOUD', 'ELEVENLABS', 'GEMINI', 'REPLICATE'
    ];

    try {
        const results: Record<string, string> = {};

        await Promise.all(providers.map(async (p) => {
            const isConnected = await hasActiveConnection(storeId, p);
            results[p] = isConnected ? "connected" : "missing";
        }));

        return NextResponse.json(results);
    } catch (error) {
        console.error("Connection Status API Error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
