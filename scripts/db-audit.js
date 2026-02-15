const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const productsList = await prisma.product.findMany({ select: { id: true, title: true, handle: true } });
        console.log('--- PRODUCTS ---');
        productsList.forEach(p => console.log(`ID: ${p.id} | Title: ${p.title} | Handle: ${p.handle}`));

        const storeCount = await prisma.store.count();
        const ordersCount = await prisma.order.count();
        const adMetricsCount = await prisma.adMetricDaily.count();
        const snapshotsCount = await prisma.dailySnapshot.count();

        console.log('\n--- COUNTS ---');
        console.log('Stores:', storeCount);
        console.log('Orders:', ordersCount);
        console.log('Ad Metrics:', adMetricsCount);
        console.log('Daily Snapshots:', snapshotsCount);

        const adMetricWindows = await prisma.adMetricDaily.groupBy({
            by: ['window'],
            _count: { _all: true }
        });
        console.log('\n--- AD METRIC WINDOWS ---');
        adMetricWindows.forEach(w => console.log(`Window: ${w.window} | Count: ${w._count._all}`));

        console.log('\n--- ORDERS BY PRODUCT ---');
        for (const p of productsList) {
            const count = await prisma.orderItem.count({ where: { productId: p.id } });
            console.log(`Product: ${p.title} | ID: ${p.id} | Orders: ${count}`);
        }

        if (storeCount > 0) {
            const firstStore = await prisma.store.findFirst();
            console.log('\nSample Store:', firstStore.id, firstStore.name);
        }

    } catch (e) {
        console.error('Audit Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
