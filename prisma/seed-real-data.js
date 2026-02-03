const { PrismaClient } = require("@prisma/client");
const { PrismaLibSql } = require("@prisma/adapter-libsql");

const adapter = new PrismaLibSql({ url: "file:./dev.db" });
const prisma = new PrismaClient({ adapter });

async function main() {
    const shopDomain = "f7z7nn-ei.myshopify.com";
    const accessToken = "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";
    const apiSecret = "c25de7c4eeecfae6e1fe2d354391f31d";

    try {
        const store = await prisma.store.upsert({
            where: { id: "default-store" },
            update: {
                name: "Nano Banana Store",
                domain: shopDomain
            },
            create: {
                id: "default-store",
                name: "Nano Banana Store",
                domain: shopDomain,
                currency: "EUR"
            }
        });

        await prisma.connection.upsert({
            where: {
                storeId_provider: {
                    storeId: store.id,
                    provider: "SHOPIFY"
                }
            },
            update: {
                apiKey: accessToken,
                apiSecret: apiSecret,
                extraConfig: shopDomain,
                isActive: true
            },
            create: {
                storeId: store.id,
                provider: "SHOPIFY",
                apiKey: accessToken,
                apiSecret: apiSecret,
                extraConfig: shopDomain,
                isActive: true
            }
        });

        // Seed Beeping Connection
        const beepingKey = process.env.BEEPING_API_KEY || "Basic YW50b25pb3BhZGkxOTg0QGdtYWlsLmNvbTpBbGVqYW5kcm8xMTIyKg==";
        await prisma.connection.upsert({
            where: {
                storeId_provider: {
                    storeId: store.id,
                    provider: "BEEPING"
                }
            },
            update: {
                apiKey: beepingKey,
                extraConfig: "https://app.gobeeping.com/api",
                isActive: true
            },
            create: {
                storeId: store.id,
                provider: "BEEPING",
                apiKey: beepingKey,
                extraConfig: "https://app.gobeeping.com/api",
                isActive: true
            }
        });

        // Seed Meta Connection
        const metaToken = "EAAUrcewVAhYBQIZCNLmemweZBlPnZAuqaAMvAiuZAZCZAWV3qYDxroHrqk9VU7wq48LgXlb0aT1tlOdT3EZAMiwZBljpzsacAgA4y99UjcZBtP4nO5E9agQaZCWvqWAZAjOTcAPiibLPKUGOup0bx12arZACjIgJK8ezytbknHEcgPq6jvA4sKPaAw7u2RDF8s7aZCOyomXiggFZAzH4J96ivQVUbE";
        const metaSecret = "8aeb3dc0cb174d3b5c80b00d901554d4";

        await prisma.connection.upsert({
            where: {
                storeId_provider: {
                    storeId: store.id,
                    provider: "META"
                }
            },
            update: {
                apiKey: "META_APP_METRICAS",
                apiSecret: metaSecret,
                accessToken: metaToken,
                isActive: true
            },
            create: {
                storeId: store.id,
                provider: "META",
                apiKey: "META_APP_METRICAS",
                apiSecret: metaSecret,
                accessToken: metaToken,
                isActive: true
            }
        });

        console.log("✅ Conexiones (Shopify + Beeping + Meta) establecidas en la base de datos.");
    } catch (err) {
        console.error("❌ Error en el seed:", err);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
