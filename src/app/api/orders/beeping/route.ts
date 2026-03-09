import { NextRequest, NextResponse } from 'next/server';
import { BeepingClient } from '@/lib/beeping';
import { getConnectionSecret } from '@/lib/server/connections';
import { syncBeepingOrders } from '@/lib/handlers/beeping-sync';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const storeId = req.headers.get('X-Store-Id') || searchParams.get('storeId');

    if (!storeId) return NextResponse.json({ error: "Missing storeId" }, { status: 400 });

    const apiKey = await getConnectionSecret(storeId, "BEEPING");
    if (!apiKey) return NextResponse.json({ error: "Beeping no configurado para esta tienda" }, { status: 400 });

    const client = new BeepingClient(apiKey);

    const from_date = searchParams.get('from_date') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const per_page = parseInt(searchParams.get('per_page') || '50');
    const shop_id = searchParams.get('shop_id') || undefined;

    try {
        const data = await client.getOrders({ from_date, page, per_page, shop_id });
        const orders = Array.isArray(data) ? data : (data.data || []);
        return NextResponse.json({ success: true, orders, total: orders.length });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { storeId } = body;

        if (!storeId) return NextResponse.json({ error: "Missing storeId" }, { status: 400 });

        const result = await syncBeepingOrders(storeId, 365); // Full sync (1 year)
        return NextResponse.json(result);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { action, id, storeId, data } = body;

        if (!storeId || !id || !action) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const apiKey = await getConnectionSecret(storeId, "BEEPING");
        if (!apiKey) return NextResponse.json({ error: "Beeping no configurado" }, { status: 400 });

        const client = new BeepingClient(apiKey);
        let apiResponse;

        switch (action) {
            case 'confirm':
                apiResponse = await client.markAsReady(id);
                await (prisma as any).order.updateMany({
                    where: { orderNumber: String(id), storeId, logisticsProvider: "BEEPING" },
                    data: { status: "IN_TRANSIT", logisticsStatus: "Enviado" }
                });
                break;
            case 'cancel':
                apiResponse = await client.cancelOrder(id);
                await (prisma as any).order.updateMany({
                    where: { orderNumber: String(id), storeId, logisticsProvider: "BEEPING" },
                    data: { status: "CANCEL_PENDING", finalStatus: "CANCELLED" }
                });
                break;
            case 'update':
                apiResponse = await client.updateOrder(id, data.orderData, data.lines);
                // Update basic fields if provided
                if (data.orderData) {
                    await (prisma as any).order.updateMany({
                        where: { orderNumber: String(id), storeId, logisticsProvider: "BEEPING" },
                        data: {
                            customerName: data.orderData.customer_name,
                            customerPhone: data.orderData.phone,
                            addressLine1: data.orderData.address,
                            city: data.orderData.city
                        }
                    });
                }
                break;
            default:
                return NextResponse.json({ error: "Action not supported" }, { status: 400 });
        }

        // Find internal order ID
        const order = await (prisma as any).order.findFirst({
            where: { orderNumber: String(id), storeId, logisticsProvider: "BEEPING" }
        });

        if (order) {
            // Registrar evento
            await (prisma as any).orderEvent.create({
                data: {
                    orderId: order.id,
                    type: "BEEPING_ACTION",
                    source: "MANUAL",
                    description: action,
                    createdAt: new Date()
                }
            });
        }

        return NextResponse.json({ success: true, result: apiResponse });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
