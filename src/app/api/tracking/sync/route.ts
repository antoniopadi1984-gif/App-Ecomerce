import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAllStores, get17trackClient } from '@/lib/helpers/get-store-connections';

const BATCH_SIZE = 40;

export async function POST(req: NextRequest) {
    const body = await req.json().catch(() => ({}));
    const targetStoreId = body.storeId; // opcional — si se pasa, solo procesa esa tienda

    const stores = targetStoreId
        ? await prisma.store.findMany({ where: { id: targetStoreId }, include: { connections: true } })
        : await getAllStores();

    const results: any[] = [];

    for (const store of stores) {
        const client = get17trackClient(store);
        if (!client) {
            results.push({ store: store.name, skipped: true, reason: 'Sin conexión 17TRACK' });
            continue;
        }

        const orders = await prisma.order.findMany({
            where: {
                storeId: store.id,
                trackingCode: { not: null },
                logisticsStatus: {
                    notIn: ['DELIVERED', 'RETURNED', 'CANCELLED', 'RETURN_TO_SENDER']
                }
            },
            take: 200,
            orderBy: { createdAt: 'desc' },
            select: { id: true, trackingCode: true, logisticsStatus: true }
        });

        if (!orders.length) {
            results.push({ store: store.name, checked: 0, updated: 0 });
            continue;
        }

        // Registrar
        for (let i = 0; i < orders.length; i += BATCH_SIZE) {
            const batch = orders.slice(i, i + BATCH_SIZE);
            await client.register(batch.map(o => ({
                number: o.trackingCode!,
                tag: o.id,
                lang: 'es',
            }))).catch(() => {});
            if (i + BATCH_SIZE < orders.length) await sleep(400);
        }

        // Consultar estados
        let updated = 0;
        for (let i = 0; i < orders.length; i += BATCH_SIZE) {
            const batch = orders.slice(i, i + BATCH_SIZE);
            const statuses = await client.getTrackInfo(
                batch.map(o => ({ number: o.trackingCode! }))
            ).catch(() => []);

            for (const s of statuses) {
                const order = batch.find(o => o.trackingCode === s.trackingNumber);
                if (!order || s.status === order.logisticsStatus) continue;

                await prisma.order.update({
                    where: { id: order.id },
                    data: {
                        logisticsStatus: s.status,
                        ...(s.delivered ? { deliveredAt: new Date() } : {}),
                        ...(s.returning ? { returnedAt: new Date() } : {}),
                        trackingLastEvent: s.lastDescription || undefined,
                        trackingLastLocation: s.lastLocation || undefined,
                        trackingLastUpdate: s.lastUpdate ? new Date(s.lastUpdate) : undefined,
                    }
                });
                updated++;
            }

            if (i + BATCH_SIZE < orders.length) await sleep(400);
        }

        results.push({ store: store.name, checked: orders.length, updated });
    }

    return NextResponse.json({ success: true, results });
}

function sleep(ms: number) {
    return new Promise(r => setTimeout(r, ms));
}
