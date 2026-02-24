import { PrismaClient } from "@prisma/client";
import { encryptSecret } from "./src/lib/server/crypto";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

// Cargar todos los posibles envs
const envFiles = [".env", ".env.local", ".env.production"];
envFiles.forEach(file => {
    const p = path.resolve(process.cwd(), file);
    if (fs.existsSync(p)) {
        const config = dotenv.parse(fs.readFileSync(p));
        for (const k in config) process.env[k] = config[k];
    }
});

const prisma = new PrismaClient();

async function auditAndSync() {
    console.log("--- AUDIT & SYNC START ---");

    const store = await prisma.store.findFirst();
    if (!store) {
        console.error("CRITICAL: No store found in database.");
        return;
    }
    const storeId = store.id;
    console.log(`Target Store: ${store.name} (${storeId})`);

    const mappings = [
        { provider: "SHOPIFY", secret: process.env.SHOPIFY_ACCESS_TOKEN, extra: { shopUrl: process.env.SHOPIFY_SHOP_DOMAIN } },
        { provider: "META", secret: process.env.META_ACCESS_TOKEN, extra: { businessId: process.env.META_BUSINESS_ID || "N/A", adAccountId: process.env.META_AD_ACCOUNT_ID || "N/A", pixelId: process.env.META_PIXEL_ID || "N/A" } },
        { provider: "BEEPING", secret: process.env.BEEPING_API_KEY || process.env.BEEPING_API_TOKEN, extra: { storeId: process.env.BEEPING_STORE_ID || "N/A" } },
        { provider: "GEMINI", secret: process.env.GEMINI_API_KEY, extra: { model: "gemini-1.5-pro" } },
        { provider: "ANTHROPIC", secret: process.env.ANTHROPIC_API_KEY, extra: {} },
        { provider: "REPLICATE", secret: process.env.REPLICATE_API_TOKEN, extra: {} },
        { provider: "ELEVENLABS", secret: process.env.ELEVENLABS_API_KEY, extra: {} },
        { provider: "GA4", secret: process.env.GOOGLE_SERVICE_ACCOUNT_KEY, extra: { propertyId: process.env.GA4_PROPERTY_ID || "N/A" } },
        { provider: "GOOGLE_DRIVE", secret: process.env.GOOGLE_SERVICE_ACCOUNT_KEY, extra: { rootFolderId: process.env.DRIVE_ROOT_FOLDER_ID || "N/A" } },
        { provider: "WHATSAPP", secret: process.env.WHATSAPP_ACCESS_TOKEN, extra: { phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || "N/A", wabaId: process.env.WHATSAPP_WABA_ID || "N/A" } }
    ];

    for (const m of mappings) {
        if (!m.secret) {
            console.log(`[PASS] ${m.provider} - No key found in environment.`);
            continue;
        }

        console.log(`[SYNC] ${m.provider} - Key detected. Updating DB...`);
        const { enc, iv, tag } = encryptSecret(m.secret);

        await (prisma as any).connection.upsert({
            where: { storeId_provider: { storeId, provider: m.provider.toUpperCase() } },
            update: {
                secretEnc: enc,
                secretIv: iv,
                secretTag: tag,
                extraConfig: JSON.stringify(m.extra),
                isActive: true,
                updatedAt: new Date()
            },
            create: {
                storeId,
                provider: m.provider.toUpperCase(),
                secretEnc: enc,
                secretIv: iv,
                secretTag: tag,
                extraConfig: JSON.stringify(m.extra),
                isActive: true
            }
        });
    }

    const currentConns = await (prisma as any).connection.findMany({ where: { storeId } });
    console.log(`--- TOTAL ACTIVE CONNECTIONS IN DB: ${currentConns.length} ---`);
    currentConns.forEach((c: any) => console.log(` - ${c.provider}: ${c.isActive ? 'ACTIVE' : 'INACTIVE'}`));

    console.log("--- AUDIT & SYNC COMPLETE ---");
}

auditAndSync()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
