import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
import crypto from 'crypto';

// Quick inline encryption copied from original logic to avoid TS module resolution errors
const AES_KEY = process.env.ENCRYPTION_KEY || '12345678123456781234567812345678';
function encryptSecret(text: string) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(AES_KEY), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return { enc: encrypted, iv: iv.toString('hex'), tag: authTag };
}

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
            accessToken: token, // fallback // Note no status here!
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
