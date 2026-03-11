import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const stores = await prisma.store.findMany({
    select: { id: true, name: true, domain: true }
  });
  console.log('STORES:');
  console.dir(stores, { depth: null });

  const products = await prisma.product.findMany({
    take: 5,
    select: { id: true, title: true, storeId: true }
  });
  console.log('PRODUCTS:');
  console.dir(products, { depth: null });
}

main().catch(console.error).finally(() => prisma.$disconnect());
