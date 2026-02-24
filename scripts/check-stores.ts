import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('--- STORES ---');
    const stores = await prisma.store.findMany();
    for (const s of stores) {
        console.log(`Store: ${s.name} (ID: ${s.id})`);
        const conns = await prisma.connection.findMany({ where: { storeId: s.id } });
        for (const c of conns) {
            console.log(`  - Provider: ${c.provider} (ID: ${c.id})`);
            if (c.provider === 'SHOPIFY') {
                console.log(`    - ExtraConfig: ${c.extraConfig}`);
            }
        }
    }
}

main().finally(() => prisma.$disconnect());
