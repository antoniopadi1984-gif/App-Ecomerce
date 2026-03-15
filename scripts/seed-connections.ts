// scripts/seed-connections.ts
// Ejecutar: npx ts-node scripts/seed-connections.ts

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {

    // ─── AleEssence (store-main) — tiene Beeping ───
    await prisma.connection.upsert({
        where: { storeId_provider: { storeId: 'store-main', provider: 'BEEPING' } },
        create: {
            storeId: 'store-main',
            provider: 'BEEPING',
            apiKey: process.env.BEEPING_API_KEY_ALEESSENCE || process.env.BEEPING_API_KEY || '',
            isActive: true,
        },
        update: {
            apiKey: process.env.BEEPING_API_KEY_ALEESSENCE || process.env.BEEPING_API_KEY || '',
            isActive: true,
        }
    });
    console.log('✅ Beeping → AleEssence (store-main)');

    // ─── AleCare MX (alecare-mx) — tiene 17track ───
    await prisma.connection.upsert({
        where: { storeId_provider: { storeId: 'alecare-mx', provider: '17TRACK' } },
        create: {
            storeId: 'alecare-mx',
            provider: '17TRACK',
            apiKey: process.env.TRACK17_API_KEY_ALECARE_MX || process.env.TRACK17_API_KEY || '',
            isActive: true,
        },
        update: {
            apiKey: process.env.TRACK17_API_KEY_ALECARE_MX || process.env.TRACK17_API_KEY || '',
            isActive: true,
        }
    });
    console.log('✅ 17track → AleCare MX (alecare-mx)');

    // ─── AleCare UK (cmlxrad5405b826d99j9kpgyy) — sin tracking aún ───
    console.log('ℹ️  AleCare UK — sin tracking configurado aún');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
