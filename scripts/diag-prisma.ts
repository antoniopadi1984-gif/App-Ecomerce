import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- PRISMA DIAGNOSTIC ---');
    const connections = await prisma.connection.findMany({
        include: {
            store: true
        }
    });
    console.log(`Total Connections found by Prisma: ${connections.length}`);
    connections.forEach(c => {
        console.log(`ID: ${c.id} | StoreId: ${c.storeId} | Provider: ${c.provider} | StoreName: ${c.store?.name || 'N/A'}`);
    });

    const stores = await prisma.store.findMany();
    console.log(`Total Stores found by Prisma: ${stores.length}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
