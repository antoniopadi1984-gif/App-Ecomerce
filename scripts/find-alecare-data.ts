import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- SEARCHING FOR ALECARE DATA IN STORE-MAIN ---');
    const storeId = 'store-main'; // Aleessence (Default)

    const products = await prisma.product.findMany({
        where: { storeId }
    });

    const alecareProducts = products.filter(p =>
        p.title.toLowerCase().includes('alecare') ||
        p.handle?.toLowerCase().includes('alecare')
    );

    console.log(`Found ${alecareProducts.length} products matching 'alecare' in store-main:`);
    alecareProducts.forEach(p => console.log(` - ID: ${p.id}, Title: ${p.title}`));

    if (alecareProducts.length > 0) {
        console.log('\n--- This means the data was synced into the WRONG store context ---');
    } else {
        console.log('\nNo Alecare products found in store-main either. Data might be completely missing.');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
