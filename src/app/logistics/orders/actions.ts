'use server';

import { pushOrderToBeeping } from '../../operaciones/pedidos/actions';
import prisma from '@/lib/prisma';
import { BeepingClient } from '@/lib/beeping';
import { calculateOrderProfit } from '@/lib/logistics-engine';
import { revalidatePath } from 'next/cache';

export async function exportOrderToBeeping(orderId: string) {
    // Deprecated — delega a pushOrderToBeeping
    return pushOrderToBeeping(orderId);
}

export async function syncBeepingStatuses(limit = 0) {
    try {
        const { getAllStores, getBeepingClient } = await import('@/lib/helpers/get-store-connections');
        const stores = await getAllStores();

        let totalUpdated = 0;
        let totalProcessed = 0;

        for (const store of stores) {
            const client = getBeepingClient(store);
            if (!client) {
                console.log(`[Beeping Sync] Store ${store.name} — sin conexión Beeping, omitiendo`);
                continue;
            }

            console.log(`[Beeping Sync] Procesando tienda: ${store.name} (${store.id})`);
            let updated = 0;
            let processed = 0;

            await client.getAllOrders(async (batch) => {
                for (const bo of batch) {
                    processed++;
                    const externalId = bo.external_id || bo.ref || bo.reference;
                    if (!externalId) continue;

                    const local = await (prisma as any).order.findFirst({
                        where: {
                            storeId: store.id,
                            OR: [
                                { shopifyId: externalId.toString() },
                                { orderNumber: bo.ref },
                                { orderNumber: `#${bo.ref}` },
                            ]
                        }
                    });

                    if (!local) continue;

                    const status = BeepingClient.mapStatus(bo);
                    const courier = BeepingClient.mapCourier(bo.courier_id);

                    const updateData: any = {
                        logisticsStatus: status,
                        carrier: courier,
                        trackingCode: bo.tracking_number,
                        logisticsProvider: 'BEEPING',
                        trackingUrl: bo.tracking_url || local.trackingUrl,
                        shippingCost: bo.shipping_cost ? parseFloat(bo.shipping_cost) : local.shippingCost,
                        finalStatus: (['DELIVERED', 'RETURNED'].includes(status)) ? status : local.finalStatus,
                    };

                    if (status === 'DELIVERED' && !local.deliveredAt) updateData.deliveredAt = new Date();
                    if (status === 'RETURNED' && !local.returnedAt) updateData.returnedAt = new Date();

                    await (prisma as any).order.update({ where: { id: local.id }, data: updateData });
                    await calculateOrderProfit(local.id);
                    updated++;
                }
            });

            console.log(`[Beeping Sync] ${store.name}: ${updated}/${processed} actualizados`);
            totalUpdated += updated;
            totalProcessed += processed;
        }

        revalidatePath('/logistics/orders');
        return {
            success: true,
            message: `Sync completo: ${totalUpdated}/${totalProcessed} pedidos actualizados en ${stores.length} tiendas`
        };
    } catch (error: any) {
        console.error('Beeping sync error:', error);
        return { success: false, message: error.message };
    }
}
