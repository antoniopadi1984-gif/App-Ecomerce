import { prisma } from '@/lib/prisma';
import { BeepingClient } from '@/lib/beeping';
import { getConnectionSecret } from '@/lib/server/connections';

/**
 * syncBeepingOrders — Syncs orders from Beeping for a specific store.
 */
export async function syncBeepingOrders(storeId: string, syncDays: number = 30) {
    const apiKey = await getConnectionSecret(storeId, "BEEPING");
    if (!apiKey) {
        throw new Error(`Beeping no configurado para el store: ${storeId}`);
    }

    const client = new BeepingClient(apiKey);

    let totalSynced = 0;
    let errorCount = 0;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - syncDays);
    const fromDateStr = thirtyDaysAgo.toISOString().split('T')[0];

    // Note: client.getAllOrders fetches all pages. 
    // If we want to filter by date, we might need a custom loop since getAllOrders doesn't pass params.
    // However, for POST sync we want EVERYTHING (or last 30 days depending on usage).

    await client.getAllOrders(async (batch) => {
        for (const bo of batch) {
            try {
                // Filter by date if needed (getAllOrders doesn't pass from_date)
                if (bo.created_at && bo.created_at < fromDateStr) continue;

                const shopifyId = bo.external_id || null;
                const orderNumber = String(bo.id);
                const logisticsStatus = BeepingClient.mapStatus(bo);
                const status = mapBeepingToInternalStatus(logisticsStatus);

                const orderData = {
                    storeId,
                    orderNumber,
                    shopifyId,
                    logisticsProvider: "BEEPING",
                    trackingCode: bo.tracking_code || null,
                    logisticsStatus,
                    carrier: BeepingClient.mapCourier(bo.courier_id),
                    customerName: bo.customer_name || bo.delivery_name || null,
                    customerPhone: bo.phone || bo.delivery_phone || null,
                    addressLine1: bo.address || bo.delivery_address || null,
                    city: bo.city || bo.delivery_city || null,
                    province: bo.province || bo.delivery_province || null,
                    zip: bo.zip || bo.cp || bo.delivery_cp || null,
                    country: bo.country || bo.delivery_country || "ES",
                    totalPrice: parseFloat(bo.price || bo.total || 0),
                    paymentMethod: "COD",
                    status,
                    rawJson: JSON.stringify(bo),
                    updatedAt: new Date()
                };

                // Find existing order
                let existingOrder = null;
                if (shopifyId) {
                    existingOrder = await (prisma as any).order.findUnique({ where: { shopifyId } });
                } else {
                    existingOrder = await (prisma as any).order.findFirst({
                        where: { orderNumber, logisticsProvider: "BEEPING", storeId }
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
                console.error(`[Beeping Sync] Error processing order ${bo.id}:`, e);
                errorCount++;
            }
        }
    });

    console.log(`[Beeping Sync] Done. Synced: ${totalSynced}, Errors: ${errorCount}`);
    return { success: true, synced: totalSynced, errors: errorCount };
}

function mapBeepingToInternalStatus(logisticsStatus: string): string {
    const s = logisticsStatus.toLowerCase();
    if (s.includes('entregado')) return 'DELIVERED';
    if (s.includes('devuelto') || s.includes('siniestro')) return 'RETURNED';
    if (s.includes('tránsito') || s.includes('reparto') || s.includes('enviado') || s.includes('recogida')) return 'IN_TRANSIT';
    if (s.includes('cancelado')) return 'CANCELLED';
    return 'PENDING';
}
