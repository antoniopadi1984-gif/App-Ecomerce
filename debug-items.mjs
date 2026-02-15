import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function debugItems() {
    const orders = await prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { items: true }
    });

    for (const o of orders) {
        console.log(`Order ${o.orderNumber} (ID: ${o.id}) - Items: ${o.items.length}`);
    }
    process.exit(0);
}

debugItems();
