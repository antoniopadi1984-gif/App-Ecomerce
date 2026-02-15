const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const existing = await prisma.store.findMany({ select: { id: true, name: true } });
    console.log('Stores existentes:', JSON.stringify(existing));

    if (existing.length < 2) {
        const stores = [
            { name: 'Nano Banana Store', domain: 'nanobanana.com', currency: 'EUR' },
            { name: 'Test Store B', domain: 'testb.com', currency: 'USD' },
        ];
        for (const s of stores) {
            const exists = existing.find((e) => e.name === s.name);
            if (!exists) {
                const created = await prisma.store.create({ data: s });
                console.log('Creado:', created.id, created.name);
            }
        }
    }

    const final = await prisma.store.findMany({
        select: { id: true, name: true, domain: true, currency: true }
    });
    console.log('Final:', JSON.stringify(final, null, 2));
}

main().finally(() => prisma.$disconnect());
