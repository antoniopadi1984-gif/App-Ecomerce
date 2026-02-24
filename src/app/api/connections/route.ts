import { NextRequest, NextResponse } from "next/server";
import { getStoreConnections, getStoreConnectionsWithSecrets } from "@/lib/server/connections";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        // Fast path for development/admin: default to store-main
        let storeId = 'store-main';

        // Only try to read header if absolutely available to avoid Next.js dev server overhead
        const reqStoreId = request.headers.get("x-store-id");
        if (reqStoreId && reqStoreId !== 'default-store') {
            storeId = reqStoreId;
        }

        const { searchParams } = new URL(request.url);
        const reveal = searchParams.get("reveal") === "true";

        console.log(`[API CONNECTIONS] GET /connections?reveal=${reveal} for store: ${storeId}`);

        let connections = reveal
            ? await getStoreConnectionsWithSecrets(storeId)
            : await getStoreConnections(storeId);

        // Fallback for empty stores in admin view
        if (connections.length === 0 && storeId !== 'store-main') {
            connections = reveal
                ? await getStoreConnectionsWithSecrets('store-main')
                : await getStoreConnections('store-main');
        }

        return NextResponse.json(connections);
    } catch (error: any) {
        console.error("[API CONNECTIONS FATAL]", error);
        return NextResponse.json({ error: "Server Hang/Error" }, { status: 500 });
    }
}
