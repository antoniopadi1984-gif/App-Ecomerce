import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const storeId = 'cmlmpxvj2000026tge82a5c4x';
  try {
      await prisma.store.delete({ where: { id: storeId } });
      console.log(`Deleted store ${storeId}`);
  } catch (e) {
      console.log(`Store might already be deleted or constraint failed:`, e.message);
  }
}

run().finally(() => prisma.$disconnect());
