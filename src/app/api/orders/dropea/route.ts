import { NextRequest, NextResponse } from 'next/server';
import { DropeaClient } from '@/lib/dropea';
import { getConnectionSecret } from '@/lib/server/connections';
import { syncDropeaOrders } from '@/lib/handlers/dropea-sync';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { storeId, syncDays } = body;

        if (!storeId) {
            return NextResponse.json({ error: "Missing storeId" }, { status: 400 });
        }

        const result = await syncDropeaOrders(storeId, syncDays || 30);
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

    const apiKey = await getConnectionSecret(storeId, "DROPEA");
    if (!apiKey) return NextResponse.json({ error: "Dropea no configurado" }, { status: 400 });

    const client = new DropeaClient(apiKey);

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
