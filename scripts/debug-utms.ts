
import { prisma } from "../src/lib/prisma";

async function debugOrders() {
    const orders = await prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            source: true,
            medium: true,
            campaign: true,
            content: true,
            adsetId: true,
            totalPrice: true
        }
    });
    console.log("Sample Orders Debug:");
    console.log(JSON.stringify(orders, null, 2));

    const metrics = await prisma.adMetricDaily.findMany({
        take: 5,
        orderBy: { date: 'desc' },
        select: {
            id: true,
            level: true,
            externalId: true,
            name: true
        }
    });

    console.log("Sample Metrics Debug:");
    console.log(JSON.stringify(metrics, null, 2));
}

debugOrders()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
