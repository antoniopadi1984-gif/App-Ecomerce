import { PrismaClient } from "@prisma/client";
import { calculateOrderProfit } from "./src/lib/logistics-engine.js";

const prisma = new PrismaClient();

async function fixRecentProfits() {
    const orders = await prisma.order.findMany({
        take: 50,
        orderBy: { createdAt: 'desc' },
        include: { items: true }
    });

    console.log(`[Fix] Recalculating profit for ${orders.length} recent orders...`);
    for (const o of orders) {
        if (o.items.length > 0) {
            await calculateOrderProfit(o.id);
            console.log(`  - Recalculated Order ${o.orderNumber}`);
        } else {
            console.log(`  - Skipping Order ${o.orderNumber}: No items found.`);
        }
    }
    process.exit(0);
}

fixRecentProfits().catch(e => {
    console.error(e);
    process.exit(1);
});
