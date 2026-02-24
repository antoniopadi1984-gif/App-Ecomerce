import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const products = await prisma.product.findMany({
        select: { id: true, title: true, storeId: true }
    });

    console.log(`Total Products: ${products.length}`);
    const byStore: Record<string, number> = {};
    for (const p of products) {
        byStore[p.storeId] = (byStore[p.storeId] || 0) + 1;
        if (p.title.includes('Regenera') || p.title.includes('MicroLift')) {
            console.log(`Product "${p.title}" belongs to store: ${p.storeId}`);
        }
    }
    console.log(byStore);
}

main().finally(() => prisma.$disconnect());
