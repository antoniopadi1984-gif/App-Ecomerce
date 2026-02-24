import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const storeId = 'cmlxrad5405b826d99j9kpgyy';
    console.log('--- CHECKING ALECARE SHOP DATA ---');

    const pCount = await prisma.product.count({ where: { storeId } });
    const oCount = await prisma.order.count({ where: { storeId } });

    console.log(`Products: ${pCount}`);
    console.log(`Orders: ${oCount}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
