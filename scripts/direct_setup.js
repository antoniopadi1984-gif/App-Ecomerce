
const { createClient } = require('@libsql/client');
const crypto = require('crypto');

const ENCRYPTION_KEY = 'very-secure-key-32-chars-long-!!'; // Must be 32 chars
const IV_LENGTH = 16;
const DATABASE_URL = process.env.DATABASE_URL || "file:./prisma/dev.db";

function encrypt(text) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

async function run() {
    const client = createClient({ url: DATABASE_URL });
    const token = "EAASxXNtqub4BQpsNY4Bdw15N0yT8UinNtkZB1Cibo5oHnJlZCQtBfK0wGxdpbYyTBrjZBNFIQglXXwRLdotdaay1BHZAI5zOeHrMcuC9rxbjcYzpEXyoQWAID1vZAJycDJ9TOJYqbQx4FGgz19Vqp2Lj8xiF3TljhnHAUhpBknGFOfKoHNpxzJTwlPp0y5wZDZD";
    const encryptedToken = encrypt(token);
    const storeId = "default-store";

    console.log("🔒 [Setup] Saving encrypted token directly to DB...");

    await client.execute("PRAGMA foreign_keys = OFF;");

    // Upsert Connection
    await client.execute({
        sql: `INSERT INTO "Connection" (id, storeId, provider, accessToken, isActive, createdAt, updatedAt) 
          VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON CONFLICT(storeId, provider) DO UPDATE SET accessToken=excluded.accessToken, isActive=1, updatedAt=CURRENT_TIMESTAMP`,
        args: [crypto.randomUUID(), storeId, 'META_ADS', encryptedToken, 1]
    });

    // Create Job
    await client.execute({
        sql: `INSERT INTO "Job" (id, type, payload, status, createdAt, updatedAt) 
          VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        args: [crypto.randomUUID(), 'META_SYNC_ACCOUNTS', JSON.stringify({ storeId }), 'PENDING']
    });

    console.log("✅ Done.");
}

run().catch(console.error);
