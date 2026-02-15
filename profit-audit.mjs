import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function auditProfit() {
    const orders = await prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { items: { include: { product: { include: { finance: true } } } } }
    });

    console.log("--- PROFIT AUDIT (TOP 5 RECENT) ---");
    for (const o of orders) {
        console.log(`Order: ${o.orderNumber} | Status: ${o.status} | Total: ${o.totalPrice}`);
        console.log(`Estimated Profit: ${o.estimatedProfit} | Net Profit: ${o.netProfit}`);
        o.items.forEach(item => {
            const pf = item.product?.finance;
            console.log(`  - Item: ${item.title} | Qty: ${item.quantity} | Product Unit Cost: ${pf?.unitCost || 'MISSING'}`);
        });
        console.log("-----------------------------------");
    }
    process.exit(0);
}

auditProfit().catch(e => {
    console.error(e);
    process.exit(1);
});
