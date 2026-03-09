import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BeepingClient } from '@/lib/beeping';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { event, order_id, status, tracking, courier_id } = body;

        if (!order_id) {
            return NextResponse.json({ success: false, error: "Missing order_id" });
        }

        // Buscar Order
        const orderNumber = String(order_id);
        const order = await (prisma as any).order.findFirst({
            where: { orderNumber, logisticsProvider: "BEEPING" }
        });

        if (!order) {
            // Find storeId from connection metadata or payload if possible
            // Usually we need the shop_id linked to a Store in our DB
            const connection = await (prisma as any).connection.findFirst({
                where: { provider: "BEEPING", extraConfig: { contains: String(body.shop_id || '') } }
            });

            const storeId = connection?.storeId || 'store-main';

            // Create basic order
            const mockBo = { status, order_shipment_status_id: status, ...body };
            const logisticsStatus = BeepingClient.mapStatus(mockBo);

            await (prisma as any).order.create({
                data: {
                    storeId,
                    orderNumber,
                    logisticsProvider: "BEEPING",
                    logisticsStatus,
                    status: mapBeepingToInternalStatus(logisticsStatus),
                    trackingCode: tracking || body.tracking_code || null,
                    carrier: courier_id ? BeepingClient.mapCourier(courier_id) : null,
                    customerName: body.customer_name || body.delivery_name || "Sync Webhook",
                    paymentMethod: "COD",
                    totalPrice: parseFloat(body.price || body.total || 0),
                    rawJson: JSON.stringify(body),
                    updatedAt: new Date()
                }
            });

            return NextResponse.json({ success: true, message: "Order created from webhook" });
        }

        // Mapear el nuevo estado logístico
        // Reutilizamos BeepingClient.mapStatus si el body tiene la estructura bo
        const mockBo = { status, order_shipment_status_id: status, ...body };
        const logisticsStatus = BeepingClient.mapStatus(mockBo);
        const internalStatus = mapBeepingToInternalStatus(logisticsStatus);

        await (prisma as any).order.update({
            where: { id: order.id },
            data: {
                logisticsStatus,
                status: internalStatus,
                trackingCode: tracking || body.tracking_code || order.trackingCode,
                carrier: courier_id ? BeepingClient.mapCourier(courier_id) : order.carrier,
                updatedAt: new Date()
            }
        });

        // Evento
        await (prisma as any).orderEvent.create({
            data: {
                orderId: order.id,
                type: event || "WEBHOOK_UPDATE",
                source: "WEBHOOK_BEEPING",
                description: `Webhook: ${logisticsStatus}`,
                payload: JSON.stringify(body),
                createdAt: new Date()
            }
        });

        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error('[Beeping Webhook Error]', e);
        return NextResponse.json({ success: true }); // Siempre 200 para evitar reintentos infinitos si falla el mapeo
    }
}

function mapBeepingToInternalStatus(logisticsStatus: string): string {
    const s = logisticsStatus.toLowerCase();
    if (s.includes('entregado')) return 'DELIVERED';
    if (s.includes('devuelto') || s.includes('siniestro')) return 'RETURNED';
    if (s.includes('tránsito') || s.includes('reparto') || s.includes('enviado') || s.includes('recogida')) return 'IN_TRANSIT';
    if (s.includes('cancelado')) return 'CANCELLED';
    return 'PENDING';
}
