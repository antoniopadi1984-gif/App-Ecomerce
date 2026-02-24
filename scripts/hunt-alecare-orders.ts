import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- LOCATING ALECARE DATA ---');

    // 1. Check all unique store IDs in the Orders table
    const orderStores = await prisma.order.groupBy({
        by: ['storeId'],
        _count: { _all: true }
    });

    console.log('\\nOrder counts by storeId:');
    for (const os of orderStores) {
        let storeName = 'Unknown';
        if (os.storeId) {
            const store = await prisma.store.findUnique({ where: { id: os.storeId } });
            if (store) storeName = store.name;
        }
        console.log(`- storeId: ${os.storeId || 'NULL'} (${storeName}) -> Count: ${os._count._all}`);
    }

    // 2. Search for UK / Nov-Dec orders regardless of store ID
    console.log('\\nSearching for potential AleCare orders (UK, Nov/Dec 2023 or 2024)...');

    const possibleOrders = await prisma.order.findMany({
        where: {
            OR: [
                { country: { in: ['UK', 'United Kingdom', 'GB', 'Great Britain', 'Reino Unido'] } },
                {
                    createdAt: {
                        gte: new Date('2023-11-01'),
                        lte: new Date('2024-12-31') // Broad range to catch anything
                    }
                }
            ]
        },
        take: 10,
        select: { id: true, storeId: true, country: true, createdAt: true, customerName: true }
    });

    console.log(`Found ${possibleOrders.length} samples:`);
    possibleOrders.forEach(o => {
        console.log(`- ID: ${o.id} | Store: ${o.storeId} | Country: ${o.country} | Date: ${o.createdAt.toISOString().split('T')[0]} | Name: ${o.customerName}`);
    });

}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
