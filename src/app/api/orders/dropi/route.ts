import { NextRequest, NextResponse } from 'next/server';
import { DropiClient } from '@/lib/dropi';
import { getConnectionSecret } from '@/lib/server/connections';
import { syncDropiOrders } from '@/lib/handlers/dropi-sync';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { storeId, syncDays } = body;

        if (!storeId) {
            return NextResponse.json({ error: "Missing storeId" }, { status: 400 });
        }

        const result = await syncDropiOrders(storeId, syncDays || 30);
        return NextResponse.json(result);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get('storeId');

    if (!storeId) {
        return NextResponse.json({ error: "Missing storeId" }, { status: 400 });
    }

    const apiKey = await getConnectionSecret(storeId, "DROPI");
    if (!apiKey) return NextResponse.json({ error: "Dropi no configurado" }, { status: 400 });

    const client = new DropiClient(apiKey);

    try {
        const data = await client.getOrders({
            page: parseInt(searchParams.get('page') || '1'),
            per_page: parseInt(searchParams.get('per_page') || '50')
        });
        return NextResponse.json({ success: true, orders: data.data || data });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
