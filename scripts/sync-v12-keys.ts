
import { PrismaClient } from "@prisma/client";
import { encryptSecret } from "../src/lib/server/crypto";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

// Load all env files
const envFiles = [".env", ".env.local"];
envFiles.forEach(file => {
    const p = path.resolve(process.cwd(), file);
    if (fs.existsSync(p)) {
        const config = dotenv.parse(fs.readFileSync(p));
        for (const k in config) process.env[k] = config[k];
    }
});

const prisma = new PrismaClient();

async function main() {
    console.log("🚀 [Sync] Executing PERSISTENT sync for store-main...");

    try {
        await prisma.$transaction(async (tx) => {
            // 1. Ensure store-main exists as Aleessence
            await tx.store.upsert({
                where: { id: "store-main" },
                update: { name: "Aleessence" },
                create: {
                    id: "store-main",
                    name: "Aleessence",
                    currency: "EUR"
                }
            });

            // 2. Clear old connections to start fresh
            await (tx as any).connection.deleteMany({
                where: { storeId: "store-main" }
            });

            const mappings = [
                { provider: "SHOPIFY", secret: process.env.SHOPIFY_ACCESS_TOKEN, extra: { shopName: "Aleessence", shopUrl: "aleessence.myshopify.com" } },
                { provider: "META", secret: process.env.META_ACCESS_TOKEN, extra: { appId: process.env.META_APP_ID } },
                { provider: "GEMINI", secret: process.env.GEMINI_API_KEY, extra: { model: "gemini-2.0-flash" } },
                { provider: "ANTHROPIC", secret: process.env.REPLICATE_API_TOKEN, extra: { model: "claude-3-5-sonnet", via: "Replicate" } },
                { provider: "REPLICATE", secret: process.env.REPLICATE_API_TOKEN, extra: {} },
                { provider: "ELEVENLABS", secret: process.env.ELEVENLABS_API_KEY, extra: { model: "eleven_multilingual_v2" } },
                { provider: "VERTEX", secret: process.env.VERTEX_AI_API_KEY, extra: { projectId: process.env.GOOGLE_CLOUD_PROJECT_ID } },
                { provider: "BEEPING", secret: process.env.BEEPING_API_KEY, extra: { apiUrl: process.env.BEEPING_API_URL } }
            ];

            for (const m of mappings) {
                if (!m.secret) continue;

                console.log(`🔌 Syncing ${m.provider}...`);
                const { enc, iv, tag } = encryptSecret(m.secret);

                await (tx as any).connection.create({
                    data: {
                        storeId: "store-main",
                        provider: m.provider.toUpperCase(),
                        secretEnc: enc,
                        secretIv: iv,
                        secretTag: tag,
                        extraConfig: JSON.stringify(m.extra),
                        isActive: true
                    }
                });
            }
        });
        console.log("✅ [Sync] Transaction committed successfully.");
    } catch (e) {
        console.error("❌ [Sync] Transaction failed:", e);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
