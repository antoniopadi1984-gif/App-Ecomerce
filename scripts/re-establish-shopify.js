const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const store = await prisma.store.findFirst({ where: { id: 'store-main' } });
    if (!store) {
        console.error('Store store-main not found');
        return;
    }

    const shopDomain = process.env.SHOPIFY_SHOP_DOMAIN;
    const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

    if (!shopDomain || !accessToken) {
        console.error('Shopify env vars missing');
        return;
    }

    const connection = await prisma.connection.upsert({
        where: {
            id: 'conn-shopify-main'
        },
        update: {
            apiKey: accessToken,
            extraConfig: shopDomain,
            isActive: true
        },
        create: {
            id: 'conn-shopify-main',
            storeId: store.id,
            provider: 'SHOPIFY',
            apiKey: accessToken,
            extraConfig: shopDomain,
            isActive: true
        }
    });

    console.log('Shopify Connection re-established:', connection.id);
}

main().catch(console.error).finally(() => prisma.$disconnect());
