import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanConnections() {
    console.log('Fetching connections...');
    const conns = await prisma.connection.findMany({
        select: { id: true, provider: true, extraConfig: true, storeId: true }
    });

    console.table(conns.map(c => ({
        id: c.id,
        provider: c.provider,
        store: c.storeId,
        config: c.extraConfig ? String(c.extraConfig).substring(0, 50) : 'none'
    })));

    console.log('Looking for Tienda Limpia in SHOPIFY connections to delete...');
    for (const c of conns) {
        if (c.provider === 'SHOPIFY' && c.extraConfig && typeof c.extraConfig === 'string' && c.extraConfig.includes('test.myshopify.com')) {
            console.log(`Deleting zombie connection: ${c.id}`);
            await prisma.connection.delete({ where: { id: c.id } });
            console.log('Deleted successfully.');
        }
    }
}

cleanConnections()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
