import { PrismaClient } from '@prisma/client';
import { encryptSecret } from './src/lib/server/crypto';

const prisma = new PrismaClient();

async function main() {
    console.log('--- UPDATING SHOPIFY CREDENTIALS ---');
    const storeId = 'cmlxrad5405b826d99j9kpgyy'; // AleCare Shop

    // Provided by user
    const token = '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';
    const domain = 'v1etfu-he.myshopify.com';

    // Encrypt the token
    const encrypted = encryptSecret(token);

    const extraConfig = JSON.stringify({
        shopUrl: domain,
        shop: domain,
        SHOPIFY_SHOP_DOMAIN: domain,
        appToken: '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',
        clientId: '05a6dca0c2ce414a7ce24b0827f0c153'
    });

    const conn = await prisma.connection.updateMany({
        where: { storeId, provider: 'SHOPIFY' },
        data: {
            accessToken: token, // Sometimes used instead of enc
            secretEnc: encrypted.enc,
            secretIv: encrypted.iv,
            secretTag: encrypted.tag,
            extraConfig: extraConfig,
            updatedAt: new Date()
        }
    });

    console.log(`Updated ${conn.count} Shopify connection(s) for AleCare Shop.`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
