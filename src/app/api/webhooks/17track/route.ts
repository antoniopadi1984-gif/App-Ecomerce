// src/app/api/webhooks/17track/route.ts
// 17track llama aquí cuando cambia el estado de un tracking
// Configurar esta URL en: https://api.17track.net/admin/settings

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { TrackSeventeenClient } from '@/lib/17track';
import { recordOrderEvent } from '@/lib/logistics-engine';
import { revalidatePath } from 'next/cache';

export async function POST(req: NextRequest) {
    try {
        const rawBody = await req.text();
        const signature = req.headers.get('sign') || '';
        const apiKey = process.env.TRACK17_API_KEY || '';

        // Verificar firma (seguridad — rechazar si no viene de 17track)
        if (apiKey && signature) {
            const valid = TrackSeventeenClient.verifyWebhookSignature(rawBody, signature, apiKey);
            if (!valid) {
                console.warn('[17track Webhook] Firma inválida — rechazado');
                return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
            }
        }

        const payload = JSON.parse(rawBody);
        const event = payload.event; // TRACKING_UPDATED | TRACKING_STOPPED

        if (event === 'TRACKING_STOPPED') {
            // Sin acción necesaria — el cron ya no lo procesará porque estará DELIVERED/RETURNED
            console.log(`[17track Webhook] Tracking stopped: ${payload.data?.number}`);
            return NextResponse.json({ success: true });
        }

        if (event !== 'TRACKING_UPDATED') {
            return NextResponse.json({ success: true }); // ignorar eventos desconocidos
        }

        const data = payload.data;
        if (!data?.number) return NextResponse.json({ success: true });

        // Parsear el estado del paquete
        const client = new TrackSeventeenClient(apiKey);
        const parsed = client.parseTrackInfo(data);

        // Buscar el pedido — primero por tag (orderId guardado al registrar), luego por trackingCode
        const orderId = data.tag; // guardamos el orderId de EcomBoom como tag al registrar
        const order = orderId
            ? await prisma.order.findUnique({ where: { id: orderId } })
            : await prisma.order.findFirst({ where: { trackingCode: data.number } });

        if (!order) {
            console.warn(`[17track Webhook] Pedido no encontrado para tracking ${data.number}`);
            return NextResponse.json({ success: true });
        }

        // Actualizar pedido
        await prisma.order.update({
            where: { id: order.id },
            data: {
                logisticsStatus: parsed.status,
                trackingLastEvent: parsed.lastDescription || undefined,
                trackingLastLocation: parsed.lastLocation || undefined,
                trackingLastUpdate: parsed.lastUpdate ? new Date(parsed.lastUpdate) : undefined,
                ...(parsed.delivered ? { deliveredAt: new Date() } : {}),
                ...(parsed.returning ? { returnedAt: new Date() } : {}),
            }
        });

        // Registrar evento en timeline
        await recordOrderEvent({
            orderId: order.id,
            source: '17TRACK',
            type: 'WEBHOOK_UPDATE',
            externalEventId: `17track-${data.number}-${Date.now()}`,
            description: `${parsed.status}${parsed.lastLocation ? ` — ${parsed.lastLocation}` : ''}`,
            payload: data,
        });

        revalidatePath('/logistics/orders');

        return NextResponse.json({ success: true });

    } catch (e: any) {
        console.error('[17track Webhook Error]', e);
        // Devolver 200 aunque falle — 17track reintenta 3 veces si recibe != 200
        return NextResponse.json({ success: false, error: e.message });
    }
}
