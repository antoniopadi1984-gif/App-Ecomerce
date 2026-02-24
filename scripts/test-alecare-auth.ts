import { PrismaClient } from '@prisma/client';
import { ShopifyClient } from './src/lib/shopify';
import { decryptSecret } from './src/lib/server/crypto';

const prisma = new PrismaClient();

async function main() {
    console.log('--- SHOPIFY CONNECTION TEST ---');
    const storeId = 'cmlxrad5405b826d99j9kpgyy'; // AleCare Shop

    const conn = await prisma.connection.findFirst({
        where: { storeId, provider: 'SHOPIFY' }
    });

    if (!conn) {
        console.log('No Shopify connection found for AleCare Shop.');
        return;
    }

    console.log(`Found connection: ${conn.id}`);

    let secret = null;
    if (conn.secretEnc && conn.secretIv && conn.secretTag) {
        try {
            secret = decryptSecret({
                enc: conn.secretEnc,
                iv: conn.secretIv,
                tag: conn.secretTag
            });
            console.log('Successfully decrypted secret.');
        } catch (e) {
            console.error('Failed to decrypt secret:', e);
            return;
        }
    } else if (conn.apiKey || conn.accessToken) {
        secret = conn.accessToken || conn.apiKey;
        console.log('Using fallback unencrypted key.');
    } else {
        console.log('No secret found.');
        return;
    }

    let domain = '';
    try {
        if (conn.extraConfig) {
            const config = JSON.parse(conn.extraConfig);
            domain = config.shopUrl || config.shop || config.SHOPIFY_SHOP_DOMAIN || conn.extraConfig;
        }
    } catch (e) {
        domain = conn.extraConfig || '';
    }

    console.log(`Domain: ${domain}`);
    console.log(`Token ends with: ...${secret?.substring(secret.length - 4)}`);

    try {
        const shopify = new ShopifyClient(domain, secret!);
        console.log('Testing connection to /admin/api/2024-01/shop.json...');
        const shop = await shopify.request('/admin/api/2024-01/shop.json');
        console.log('Connection Successful! Shop Name:', shop.shop.name);
    } catch (e: any) {
        console.error('Connection Failed!');
        console.error(e.message);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
