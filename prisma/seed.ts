import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Seed base desactivado para evitar creación de tiendas temporales. Usa scripts específicos para cada tienda.\n");
    /*
    // 1. Store
    const store = await prisma.store.upsert({
        where: { id: "store-limpio" },
        update: {},
        create: {
            id: "store-limpio",
            name: "Tienda Limpia (Fase 0)",
            currency: "EUR",
            nomenclatureTemplate: "[PROD]_[CONC]_[VAR]_[LANG]",
            targetProfitMargin: 30.0,
        },
    });
    console.log(`  ✅ Store: ${store.id} — ${store.name}`);

    // 2. User + Access
    const user = await prisma.user.upsert({
        where: { email: "admin@ecombom.test" },
        update: {},
        create: {
            id: "user-limpio",
            email: "admin@ecombom.test",
            name: "Admin Fase0",
        },
    });

    await prisma.userStoreAccess.upsert({
        where: {
            userId_storeId: {
                userId: user.id,
                storeId: store.id,
            },
        },
        update: {},
        create: {
            userId: user.id,
            storeId: store.id,
            role: "ADMIN",
        },
    });
    console.log(`  ✅ User: ${user.email} → role ADMIN`);

    // ... (rest of the code remained commented out for safety)
    */
}

main()
    .catch((e) => {
        console.error("❌ Error en seed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
