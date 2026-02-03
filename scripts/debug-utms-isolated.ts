
import { PrismaClient } from '@prisma/client';

// @ts-ignore
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: "file:../prisma/dev.db"
        }
    }
});

async function debugOrders() {
    try {
        const orders = await prisma.order.findMany({
            take: 10,
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
        console.log("=== LATEST ORDERS (UTM DEBUG) ===");
        orders.forEach((o: any) => {
            console.log(`Order ${o.id}: Campaign="${o.campaign}" AdSet="${o.adsetId}" Ad="${o.content}" Price=${o.totalPrice}`);
        });

        const metrics = await prisma.adMetricDaily.findMany({
            take: 5,
            orderBy: { date: 'desc' },
            select: {
                level: true,
                externalId: true,
                name: true
            }
        });

        console.log("\n=== LATEST METRICS (ID DEBUG) ===");
        metrics.forEach((m: any) => {
            console.log(`${m.level} ${m.name}: ID="${m.externalId}"`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

debugOrders();
