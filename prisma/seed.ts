import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Ejecutando seed de Producto Limpio...\n");

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

    // 3. Supplier
    const supplier = await prisma.supplier.upsert({
        where: { id: "supplier-limpio" },
        update: {},
        create: {
            id: "supplier-limpio",
            storeId: store.id,
            name: "Proveedor Test AliExpress",
            contactName: "Zhang Wei",
            email: "test@aliexpress.test",
            phone: "+86-000-0000000",
            rating: 4,
        },
    });
    console.log(`  ✅ Supplier: ${supplier.name}`);

    // 4. Product
    const product = await prisma.product.upsert({
        where: { id: "product-limpio" },
        update: {},
        create: {
            id: "product-limpio",
            storeId: store.id,
            supplierId: supplier.id,
            title: "Producto Limpio - Fase 0 Diagnóstico",
            description: "Producto seed para validación end-to-end del sistema EcomBom Control.",
            handle: "producto-limpio-fase0",
            price: 39.99,
            compareAtPrice: 59.99,
            unitCost: 8.50,
            imageUrl: "https://placehold.co/600x600/1e293b/f8fafc?text=Producto+Limpio",
            status: "ACTIVE",
            tags: "seed,fase0,diagnostico",
            productType: "Physical",
            vendor: "EcomBom Test",
            inventoryQuantity: 100,
            country: "ES",
            vatPercent: 21,
            driveFolderId: "PLACEHOLDER_DRIVE_FOLDER_ID",
            niche: "Health & Wellness",
            problemToSolve: "Producto de prueba para validar el sistema completo",
            targetMargin: 40,
        },
    });
    console.log(`  ✅ Product: ${product.title} (${product.id})`);

    // 5. ProductFinance
    await prisma.productFinance.upsert({
        where: { productId: product.id },
        update: {},
        create: {
            productId: product.id,
            unitCost: 8.50,
            sellingPrice: 39.99,
            shippingCost: 4.50,
            returnCost: 6.00,
            taxes: 0,
            packagingCost: 0.80,
            codFee: 1.20,
            insuranceFee: 0.50,
            expectedDeliveryRate: 0.82,
            targetCPA: 12.00,
        },
    });
    console.log(`  ✅ ProductFinance: coste ${8.50}€, PVP ${39.99}€`);

    // 6. CompetitorLinks (3)
    const competitors = [
        { type: "AMAZON", url: "https://amazon.es/dp/B0EXAMPLE1", notes: "Competitor principal - Amazon ES" },
        { type: "ALIEXPRESS", url: "https://aliexpress.com/item/0000000.html", notes: "Fuente del proveedor" },
        { type: "COMPETITOR", url: "https://competitor-store.com/product", notes: "Tienda competidora directa" },
    ];

    for (const comp of competitors) {
        await prisma.competitorLink.create({
            data: {
                productId: product.id,
                type: comp.type,
                url: comp.url,
                notes: comp.notes,
            },
        });
    }
    console.log(`  ✅ CompetitorLinks: ${competitors.length} creados`);

    // 7. ResearchSources (3)
    const sources = [
        { type: "REVIEW", url: "https://trustpilot.com/review/example", content: "4.2/5 estrellas - 230 reviews" },
        { type: "FORUM", url: "https://reddit.com/r/health/example", content: "Discusión de usuarios sobre el producto" },
        { type: "ARTICLE", url: "https://healthline.com/article/example", content: "Estudio clínico sobre ingredientes" },
    ];

    for (const src of sources) {
        await prisma.researchSource.create({
            data: {
                productId: product.id,
                type: src.type,
                url: src.url,
                content: src.content,
            },
        });
    }
    console.log(`  ✅ ResearchSources: ${sources.length} creadas`);

    // 8. Connections (5, todas inactivas por defecto)
    const connections = [
        { provider: "SHOPIFY", apiKey: null, extraConfig: '{"domain":"test.myshopify.com"}' },
        { provider: "GOOGLE_SHEETS", apiKey: null, extraConfig: null },
        { provider: "META", apiKey: null, extraConfig: '{"adAccountId":"act_000000"}' },
        { provider: "BEEPING", apiKey: null, extraConfig: '{"apiUrl":"https://app.gobeeping.com/api"}' },
        { provider: "REPLICATE", apiKey: null, extraConfig: null },
    ];

    for (const conn of connections) {
        await prisma.connection.upsert({
            where: {
                storeId_provider: {
                    storeId: store.id,
                    provider: conn.provider,
                },
            },
            update: {},
            create: {
                storeId: store.id,
                provider: conn.provider,
                apiKey: conn.apiKey,
                extraConfig: conn.extraConfig,
                isActive: false,
            },
        });
    }
    console.log(`  ✅ Connections: ${connections.length} (todas isActive: false)`);

    // 9. AuditLog entry for seed
    await prisma.auditLog.create({
        data: {
            storeId: store.id,
            userId: user.id,
            action: "SEED_EXECUTED",
            entity: "SYSTEM",
            entityId: "phase0-seed",
            newValue: JSON.stringify({
                storeId: store.id,
                productId: product.id,
                supplierId: supplier.id,
                timestamp: new Date().toISOString(),
            }),
        },
    });
    console.log(`  ✅ AuditLog: seed registrado\n`);

    console.log("═══════════════════════════════════════════");
    console.log("  🎯 SEED COMPLETADO — IDs de referencia:");
    console.log("═══════════════════════════════════════════");
    console.log(`  Store:    ${store.id}`);
    console.log(`  User:     ${user.id} (${user.email})`);
    console.log(`  Supplier: ${supplier.id}`);
    console.log(`  Product:  ${product.id}`);
    console.log("═══════════════════════════════════════════\n");
}

main()
    .catch((e) => {
        console.error("❌ Error en seed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
