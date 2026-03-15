import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { get17trackClient } from '@/lib/17track';

export async function POST(req: NextRequest) {
    const { storeId, limit = 100 } = await req.json();

    const store = storeId
        ? await prisma.store.findUnique({ where: { id: storeId } })
        : await prisma.store.findFirst();
    if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 });

    const client = get17trackClient(store);
    if (!client) return NextResponse.json(
        { error: 'TRACK17_API_KEY no configurada para esta tienda' },
        { status: 400 }
    );

    const orders = await prisma.order.findMany({
        where: {
            storeId: store.id,
            trackingCode: { not: null },
            logisticsStatus: {
                notIn: ['DELIVERED', 'RETURNED', 'CANCELLED', 'RETURN_TO_SENDER']
            }
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: { id: true, trackingCode: true, logisticsStatus: true }
    });

    if (!orders.length) return NextResponse.json({
        success: true, updated: 0, message: 'No hay trackings pendientes'
    });

    // Registrar en 17track (idempotente)
    await client.register(orders.map(o => ({ number: o.trackingCode! })))
        .catch(() => {});

    // Obtener estados
    const statuses = await client.getTrackInfo(orders.map(o => ({ number: o.trackingCode! })));

    let updated = 0;
    for (const s of statuses) {
        const order = orders.find(o => o.trackingCode === s.trackingNumber);
        if (!order || s.status === order.logisticsStatus) continue;

        await prisma.order.update({
            where: { id: order.id },
            data: {
                logisticsStatus: s.status,
                ...(s.delivered ? { deliveredAt: new Date() } : {}),
                ...(s.status === 'RETURNED' ? { returnedAt: new Date() } : {}),
            }
        });
        updated++;
    }

    return NextResponse.json({ success: true, checked: orders.length, updated });
}
