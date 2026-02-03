
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'very-secure-key-32-chars-long-!!'; // Must be 32 chars
const IV_LENGTH = 16;

function encrypt(text: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

async function setupMetaToken() {
    const token = "EAASxXNtqub4BQpsNY4Bdw15N0yT8UinNtkZB1Cibo5oHnJlZCQtBfK0wGxdpbYyTBrjZBNFIQglXXwRLdotdaay1BHZAI5zOeHrMcuC9rxbjcYzpEXyoQWAID1vZAJycDJ9TOJYqbQx4FGgz19Vqp2Lj8xiF3TljhnHAUhpBknGFOfKoHNpxzJTwlPp0y5wZDZD";
    const encryptedToken = encrypt(token);
    const storeId = "default-store";

    console.log("🔌 [Setup] Connecting directly to DB...");
    const prisma = new PrismaClient(); // USARA EL URL DE ENV O SCHEMA

    console.log("🔒 [Setup] Saving Meta Ads Token...");

    await prisma.connection.upsert({
        where: { storeId_provider: { storeId, provider: 'META_ADS' } },
        update: { accessToken: encryptedToken, isActive: true },
        create: {
            storeId,
            provider: 'META_ADS',
            accessToken: encryptedToken,
            isActive: true,
            scope: 'READ_ONLY'
        }
    });

    console.log("✅ Token saved securely.");

    console.log("📡 [Setup] Queuing META_SYNC_ACCOUNTS job...");
    await prisma.job.create({
        data: {
            type: 'META_SYNC_ACCOUNTS',
            payload: JSON.stringify({ storeId }),
            status: 'PENDING'
        }
    });

    console.log("🚀 Setup complete.");
    await prisma.$disconnect();
}

setupMetaToken().catch(console.error);
