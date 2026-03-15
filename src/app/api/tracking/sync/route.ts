// src/app/api/tracking/sync/route.ts
// Sync polling — llamado por cron cada 4h
// Procesa en lotes de 40 (límite de la API)

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { get17trackClient } from '@/lib/17track';

const BATCH_SIZE = 40; // límite hard de 17track

export async function POST(req: NextRequest) {
    const { storeId, limit = 200 } = await req.json();

    const store = storeId
        ? await prisma.store.findUnique({ where: { id: storeId } })
        : await prisma.store.findFirst();
    if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 });

    const client = get17trackClient(store);
    if (!client) return NextResponse.json(
        { error: 'TRACK17_API_KEY no configurada para esta tienda' },
        { status: 400 }
    );

    // Pedidos con tracking activo (no finalizados)
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
        select: { id: true, trackingCode: true, logisticsStatus: true, shopifyId: true }
    });

    if (!orders.length) {
        return NextResponse.json({ success: true, checked: 0, updated: 0, registered: 0 });
    }

    // PASO 1 — Registrar trackings nuevos en 17track (idempotente: ignora duplicados)
    // Incluir orderId como tag para correlacionar en webhook
    let registered = 0;
    for (let i = 0; i < orders.length; i += BATCH_SIZE) {
        const batch = orders.slice(i, i + BATCH_SIZE);
        try {
            const result = await client.register(
                batch.map(o => ({
                    number: o.trackingCode!,
                    tag: o.id, // orderId de EcomBoom — lo recibimos de vuelta en el webhook
                    lang: 'es',
                }))
            );
            registered += result.accepted.length;
        } catch (e: any) {
            console.error(`[17track] Register batch ${i} error:`, e.message);
        }

        // Rate limit: 3 req/s
        if (i + BATCH_SIZE < orders.length) await sleep(400);
    }

    // PASO 2 — Consultar estado actual de todos los trackings
    let updated = 0;
    for (let i = 0; i < orders.length; i += BATCH_SIZE) {
        const batch = orders.slice(i, i + BATCH_SIZE);
        try {
            const statuses = await client.getTrackInfo(
                batch.map(o => ({ number: o.trackingCode! }))
            );

            for (const s of statuses) {
                const order = batch.find(o => o.trackingCode === s.trackingNumber);
                if (!order) continue;
                if (s.status === order.logisticsStatus) continue; // sin cambio

                await prisma.order.update({
                    where: { id: order.id },
                    data: {
                        logisticsStatus: s.status,
                        ...(s.delivered ? { deliveredAt: new Date() } : {}),
                        ...(s.returning ? { returnedAt: new Date() } : {}),
                        // Guardar último evento para mostrar en UI
                        trackingLastEvent: s.lastDescription || undefined,
                        trackingLastLocation: s.lastLocation || undefined,
                        trackingLastUpdate: s.lastUpdate ? new Date(s.lastUpdate) : undefined,
                    }
                });
                updated++;
            }
        } catch (e: any) {
            console.error(`[17track] GetTrackInfo batch ${i} error:`, e.message);
        }

        if (i + BATCH_SIZE < orders.length) await sleep(400);
    }

    return NextResponse.json({
        success: true,
        checked: orders.length,
        registered,
        updated,
    });
}

function sleep(ms: number) {
    return new Promise(r => setTimeout(r, ms));
}
