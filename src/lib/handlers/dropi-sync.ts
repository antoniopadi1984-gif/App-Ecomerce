import { prisma } from '@/lib/prisma';
import { DropiClient } from '@/lib/dropi';
import { getConnectionSecret } from '@/lib/server/connections';

export async function syncDropiOrders(storeId: string, syncDays: number = 30) {
    const apiKey = await getConnectionSecret(storeId, "DROPI");
    if (!apiKey) {
        throw new Error(`Dropi no configurado para el store: ${storeId}`);
    }

    const client = new DropiClient(apiKey);
    let totalSynced = 0;
    let errorCount = 0;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - syncDays);
    const fromDateStr = thirtyDaysAgo.toISOString().split('T')[0];

    await client.getAllOrders(async (batch) => {
        for (const bo of batch) {
            try {
                if (bo.fecha && bo.fecha < fromDateStr) continue;

                // Dropi often uses 'guia' as a tracking code and 'id' as order number.
                const orderNumber = String(bo.id || bo.numero_orden || bo.consecutivo || '');
                if (!orderNumber) continue;

                const shopifyId = bo.external_id || bo.shopify_id || null;
                const logisticsStatus = bo.estado || bo.status;
                const status = mapDropiToInternalStatus(logisticsStatus);

                const orderData = {
                    storeId,
                    orderNumber,
                    shopifyId,
                    logisticsProvider: "DROPI",
                    trackingCode: bo.guia || bo.tracking_code || null,
                    logisticsStatus,
                    carrier: bo.transportadora || bo.carrier || null,
                    customerName: bo.cliente?.nombre || bo.nombre_cliente || null,
                    customerPhone: bo.cliente?.telefono || bo.telefono_cliente || null,
                    addressLine1: bo.cliente?.direccion || bo.direccion_cliente || null,
                    city: bo.cliente?.ciudad || bo.ciudad_cliente || null,
                    province: bo.cliente?.departamento || bo.departamento_cliente || null,
                    zip: bo.cliente?.codigo_postal || bo.cp || null,
                    country: "CO", // Default for Dropi.co
                    totalPrice: parseFloat(bo.total || bo.valor_total || 0),
                    paymentMethod: "COD",
                    status,
                    rawJson: JSON.stringify(bo),
                    updatedAt: new Date()
                };

                let existingOrder = null;
                if (shopifyId) {
                    existingOrder = await (prisma as any).order.findUnique({ where: { shopifyId } });
                } else {
                    existingOrder = await (prisma as any).order.findFirst({
                        where: { orderNumber, logisticsProvider: "DROPI", storeId }
                    });
                }

                if (existingOrder) {
                    await (prisma as any).order.update({
                        where: { id: existingOrder.id },
                        data: orderData
                    });
                } else {
                    await (prisma as any).order.create({
                        data: orderData
                    });
                }

                totalSynced++;
            } catch (e) {
                console.error(`[Dropi Sync] Error processing order ${bo.id}:`, e);
                errorCount++;
            }
        }
    });

    return { success: true, synced: totalSynced, errors: errorCount };
}

function mapDropiToInternalStatus(status: string): string {
    const s = (status || '').toUpperCase();
    if (s === 'ENTREGADO' || s === 'DELIVERED') return 'DELIVERED';
    if (s === 'DEVOLUCION' || s === 'RETURNED' || s === 'RECHAZADO') return 'RETURNED';
    if (s === 'EN_TRANSITO' || s === 'RECOGIDO' || s === 'IN_TRANSIT') return 'IN_TRANSIT';
    if (s === 'CANCELADO' || s === 'CANCELLED') return 'CANCELLED';
    return 'PENDING';
}
