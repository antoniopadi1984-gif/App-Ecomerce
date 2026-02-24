import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const stores = await prisma.store.findMany();
  console.log("=== STORES ===");
  console.table(stores.map(s => ({ id: s.id, name: s.name, domain: s.domain })));

  const connections = await prisma.connection.findMany({
    include: { store: true }
  });
  console.log("=== CONNECTIONS ===");
  console.table(connections.map(c => ({
    id: c.id,
    provider: c.provider,
    storeId: c.storeId,
    storeName: c.store?.name,
    config: typeof c.extraConfig === 'string' ? c.extraConfig.substring(0, 50) : JSON.stringify(c.extraConfig).substring(0, 50)
  })));
}

run().catch(console.error).finally(() => prisma.$disconnect());
