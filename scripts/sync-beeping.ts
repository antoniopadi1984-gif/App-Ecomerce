
import * as dotenv from 'dotenv';
dotenv.config();

import { prisma } from '../src/lib/prisma';
import { BeepingClient } from '../src/lib/beeping';
import { calculateOrderProfit } from '../src/lib/logistics-engine';

async function run() {
    console.log("🚀 Starting Beeping FULL HISTORY Sync with Accounting...");

    const apiKey = process.env.BEEPING_API_KEY;
    if (!apiKey) {
        console.error("❌ Missing BEEPING_API_KEY in .env");
        process.exit(1);
    }

    const client = new BeepingClient(apiKey);
    let totalUpdated = 0;
    let totalProcessed = 0;

    try {
        console.log("📥 Fetching ALL orders from Beeping...");

        await client.getAllOrders(async (batch) => {
            for (const bo of batch) {
                totalProcessed++;
                const externalId = bo.external_id || bo.ref || bo.reference;
                if (!externalId) continue;

                const status = BeepingClient.mapStatus(bo);
                const courier = BeepingClient.mapCourier(bo.courier_id);

                const localOrder = await (prisma as any).order.findFirst({
                    where: {
                        OR: [
                            { shopifyId: externalId.toString() },
                            { orderNumber: bo.ref },
                            { orderNumber: `#${bo.ref}` },
                            { orderNumber: bo.reference }
                        ]
                    }
                });

                if (localOrder) {
                    const updateData: any = {
                        logisticsStatus: status,
                        carrier: courier,
                        trackingCode: bo.tracking_number,
                        logisticsProvider: "BEEPING",
                        trackingUrl: bo.tracking_url || localOrder.trackingUrl,
                        shippingCost: bo.shipping_cost ? parseFloat(bo.shipping_cost) : localOrder.shippingCost,
                        finalStatus: (status === 'DELIVERED' || status === 'RETURNED') ? status : localOrder.finalStatus
                    };

                    if (status === 'DELIVERED' && !localOrder.deliveredAt) updateData.deliveredAt = new Date();
                    if (status === 'RETURNED' && !localOrder.returnedAt) updateData.returnedAt = new Date();

                    await (prisma as any).order.update({
                        where: { id: localOrder.id },
                        data: updateData
                    });

                    // Recalculate profit for accounting
                    await calculateOrderProfit(localOrder.id);
                    totalUpdated++;
                }
            }
            console.log(`✨ Progress: ${totalProcessed} processed, ${totalUpdated} matched/updated.`);
        });

        console.log(`🏁 Full Sync Completed. Processed ${totalProcessed} total Beeping orders. Updated ${totalUpdated} local records.`);

    } catch (err) {
        console.error("❌ Beeping Full Sync failed:", err);
    }

    process.exit(0);
}

run();
