import { prisma } from '@/lib/prisma';
import { DropeaClient } from '@/lib/dropea';
import { getConnectionSecret } from '@/lib/server/connections';

export async function syncDropeaOrders(storeId: string, syncDays: number = 30) {
    const apiKey = await getConnectionSecret(storeId, "DROPEA");
    if (!apiKey) {
        throw new Error(`Dropea no configurado para el store: ${storeId}`);
    }

    const client = new DropeaClient(apiKey);
    let totalSynced = 0;
    let errorCount = 0;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - syncDays);
    const fromDateStr = thirtyDaysAgo.toISOString().split('T')[0];

    await client.getAllOrders(async (batch) => {
        for (const bo of batch) {
            try {
                if (bo.created_at && bo.created_at < fromDateStr) continue;

                const shopifyId = bo.external_id || bo.metadata?.shopify_id || null;
                const orderNumber = String(bo.id);
                const logisticsStatus = bo.status;
                const status = mapDropeaToInternalStatus(logisticsStatus);

                const orderData = {
                    storeId,
                    orderNumber,
                    shopifyId,
                    logisticsProvider: "DROPEA",
                    trackingCode: bo.tracking_number || bo.tracking_code || null,
                    logisticsStatus,
                    carrier: bo.courier || bo.carrier || null,
                    customerName: bo.customer?.name || bo.customer_name || null,
                    customerPhone: bo.customer?.phone || bo.phone || null,
                    addressLine1: bo.customer?.address || bo.address || null,
                    city: bo.customer?.city || bo.city || null,
                    province: bo.customer?.province || bo.province || null,
                    zip: bo.customer?.zip || bo.zip || null,
                    country: bo.customer?.country || "ES",
                    totalPrice: parseFloat(bo.total || 0),
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
                        where: { orderNumber, logisticsProvider: "DROPEA", storeId }
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
                console.error(`[Dropea Sync] Error processing order ${bo.id}:`, e);
                errorCount++;
            }
        }
    });

    return { success: true, synced: totalSynced, errors: errorCount };
}

function mapDropeaToInternalStatus(status: string): string {
    const s = (status || '').toUpperCase();
    if (s === 'DELIVERED' || s === 'ENTREGADO') return 'DELIVERED';
    if (s === 'RETURNED' || s === 'DEVOLUCION' || s === 'RECHAZADO') return 'RETURNED';
    if (s === 'SHIPPED' || s === 'ENVIADO' || s === 'IN_TRANSIT') return 'IN_TRANSIT';
    if (s === 'CANCELLED' || s === 'CANCELADO') return 'CANCELLED';
    return 'PENDING';
}
