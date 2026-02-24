import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- PRISMA DIAGNOSTIC ---');

    const stores = await prisma.store.findMany();
    console.log(`Total Stores found by Prisma: ${stores.length}`);
    for (const store of stores) {
        const prodCount = await prisma.product.count({ where: { storeId: store.id } });
        console.log(`Store: ${store.name} (${store.id}) -> Products: ${prodCount}`);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
