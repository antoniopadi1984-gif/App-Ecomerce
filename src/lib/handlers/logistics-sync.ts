import { JobHandler } from "../worker";
import { syncBeepingOrders } from "./beeping-sync";
import { syncDropeaOrders } from "./dropea-sync";
import { prisma } from '@/lib/prisma';

const logisticsSyncHandler: JobHandler = {
    handle: async (payload, onProgress, jobId) => {
        const storeId = payload.storeId || 'store-main';
        const provider = payload.provider?.toUpperCase(); // BEEPING | DROPEA
        const days = payload.days || 30;

        console.log(`🚀 [Worker] Starting Logistics Sync for ${storeId} (Provider: ${provider || 'ALL'}, Days: ${days})...`);

        await onProgress(10);

        let results: any = {};

        // 1. Sync Beeping
        if (!provider || provider === 'BEEPING') {
            try {
                results.beeping = await syncBeepingOrders(storeId, days);
            } catch (e: any) {
                results.beeping = { success: false, error: e.message };
            }
        }

        await onProgress(50);

        // 2. Sync Dropea
        if (!provider || provider === 'DROPEA') {
            try {
                results.dropea = await syncDropeaOrders(storeId, days);
            } catch (e: any) {
                results.dropea = { success: false, error: e.message };
            }
        }

        await onProgress(80);

        // 3. Recalculate DailyFinance for the affected days (8.3 Sincronización Cruzada)
        try {
            console.log(`📊 [DailyFinance] Recalculating last ${days} days for store ${storeId}...`);
            await recalculateDailyFinance(storeId, days);
            results.dailyFinance = { success: true };
        } catch (e: any) {
            console.error(`❌ [DailyFinance] Error during recalculation:`, e);
            results.dailyFinance = { success: false, error: e.message };
        }

        await onProgress(100);

        console.log("✅ [Worker] Logistics Sync Completed:", results);

        return results;
    }
};

/**
 * 8.3 Sincronización Cruzada — DailyFinance por Día
 * Recalcula métricas financieras y logísticas por día basándose en los pedidos.
 */
export async function recalculateDailyFinance(storeId: string, days: number = 30) {
    // Definir mapeos de estados según lógica del sistema
    const statusMaps = {
        DELIVERED: ['DELIVERED', 'ENTREGADO'],
        RETURNED: ['RETURNED', 'DEVUELTO', 'RETURN_TO_SENDER', 'RETORNO'],
        INCIDENCE: ['INCIDENCE', 'ERROR', 'INCIDENCIA', 'SINIESTRO'],
        CANCELLED: ['CANCELLED']
    };

    for (let i = 0; i <= days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);

        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);

        // 1. Obtener pedidos del día
        const orders = await prisma.order.findMany({
            where: {
                storeId,
                createdAt: {
                    gte: date,
                    lt: nextDay
                }
            },
            include: { items: true }
        });

        // 2. Agrupar métricas
        let totalRevenue = 0;
        let cogs = 0;
        let shippingCost = 0;
        let deliveredCount = 0;
        let returnedCount = 0;
        let cancelledCount = 0;
        let incidencesCount = 0;

        orders.forEach(order => {
            const status = (order.status || "").toUpperCase();
            const logStatus = (order.logisticsStatus || "").toUpperCase();

            // Recuento de estados
            if (statusMaps.CANCELLED.includes(status)) {
                cancelledCount++;
            } else {
                // Solo sumamos revenue si no está cancelado
                totalRevenue += order.totalPrice || 0;

                // Estos campos en DailyFinance deben actualizarse
                if (statusMaps.DELIVERED.includes(logStatus) || statusMaps.DELIVERED.includes(status)) {
                    deliveredCount++;
                }

                if (statusMaps.RETURNED.includes(logStatus) || statusMaps.RETURNED.includes(status)) {
                    returnedCount++;
                }

                if (statusMaps.INCIDENCE.includes(logStatus)) {
                    incidencesCount++;
                }

                // Cogs y Shipping (consistencia financiera)
                cogs += order.items.reduce((sum, item) => sum + (item.unitCost * item.quantity), 0);
                shippingCost += order.estimatedLogisticsCost || 0;
            }
        });

        // 3. Update/Upsert DailyFinance
        const dailyRecord = await prisma.dailyFinance.upsert({
            where: {
                storeId_date: { storeId, date }
            },
            update: {
                deliveredCount,
                returnedCount,
                cancelledCount,
                incidencesCount,
                totalRevenue,
                ordersCount: orders.length,
                cogs,
                shippingCost
            },
            create: {
                storeId,
                date,
                deliveredCount,
                returnedCount,
                cancelledCount,
                incidencesCount,
                totalRevenue,
                ordersCount: orders.length,
                cogs,
                shippingCost,
                adSpend: 0,
                visitors: 0,
                netProfit: 0 // Se calculará abajo
            }
        });

        // 4. Recalcular netProfit global del día (Revenue - Spend - Cogs - Shipping - Comms)
        const netProfit = dailyRecord.totalRevenue - dailyRecord.adSpend - dailyRecord.cogs - dailyRecord.shippingCost - (dailyRecord.communicationCost || 0);

        await prisma.dailyFinance.update({
            where: { id: dailyRecord.id },
            data: { netProfit }
        });
    }
}

export default logisticsSyncHandler;
