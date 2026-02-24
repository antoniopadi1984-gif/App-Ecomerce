import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- PRISMA DATA DIAGNOSTIC ---');

    const stores = await prisma.store.findMany();
    console.log(`\nFound ${stores.length} Stores:`);
    for (const store of stores) {
        const prodCount = await prisma.product.count({ where: { storeId: store.id } });
        const orderCount = await prisma.order.count({ where: { storeId: store.id } });
        console.log(`- ${store.name} (${store.id}): ${prodCount} Products, ${orderCount} Orders`);
    }

    const connections = await prisma.connection.findMany({
        where: { provider: 'SHOPIFY' },
        include: { store: true }
    });

    console.log(`\nFound ${connections.length} Shopify Connections:`);
    for (const conn of connections) {
        console.log(`- Connection ID: ${conn.id} | Store: ${conn.store?.name} (${conn.storeId})`);
    }

    // Let's check if there are any products/orders without a valid storeId or a mismatched one
    const allProducts = await prisma.product.findMany({ select: { id: true, storeId: true, title: true } });
    const uniqueStoreIdsInProducts = [...new Set(allProducts.map(p => p.storeId))];
    console.log(`\nUnique storeIds found in Products table:`, uniqueStoreIdsInProducts);

}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
