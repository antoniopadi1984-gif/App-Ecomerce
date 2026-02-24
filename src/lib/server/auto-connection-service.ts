import { saveConnectionSecret } from "./connections";
import { prisma } from "@/lib/prisma";

export class AutoConnectionService {
    static async run() {
        console.log("⚙️ [AutoConnection] Checking for available API keys in environment...");

        // Ensure we have a default store
        const store = await (prisma as any).store.upsert({
            where: { id: 'store-main' },
            update: {},
            create: {
                id: 'store-main',
                name: 'Aleessence',
                domain: process.env.SHOPIFY_SHOP_DOMAIN || 'f7z7nn-ei.myshopify.com',
                currency: 'EUR'
            }
        });

        const storeId = store.id;

        // 1. SHOPIFY
        if (process.env.SHOPIFY_ACCESS_TOKEN && process.env.SHOPIFY_SHOP_DOMAIN) {
            await saveConnectionSecret({
                storeId,
                provider: 'SHOPIFY',
                secret: process.env.SHOPIFY_ACCESS_TOKEN,
                extraConfig: {
                    SHOP_NAME: 'Aleessence',
                    SHOPIFY_SHOP_DOMAIN: process.env.SHOPIFY_SHOP_DOMAIN
                }
            });
            console.log("✅ [AutoConnection] Shopify linked.");
        }

        // 2. META
        if (process.env.META_ACCESS_TOKEN && process.env.META_AD_ACCOUNT_ID) {
            await saveConnectionSecret({
                storeId,
                provider: 'META',
                secret: process.env.META_ACCESS_TOKEN,
                extraConfig: {
                    META_AD_ACCOUNT_ID: process.env.META_AD_ACCOUNT_ID
                }
            });
            console.log("✅ [AutoConnection] Meta linked.");
        }

        // 3. GEMINI
        if (process.env.GEMINI_API_KEY) {
            await saveConnectionSecret({
                storeId,
                provider: 'GEMINI',
                secret: process.env.GEMINI_API_KEY,
                extraConfig: {
                    GEMINI_API_KEY: process.env.GEMINI_API_KEY
                }
            });
            console.log("✅ [AutoConnection] Gemini linked.");
        }

        // 4. ELEVENLABS
        if (process.env.ELEVENLABS_API_KEY) {
            await saveConnectionSecret({
                storeId,
                provider: 'ELEVENLABS',
                secret: process.env.ELEVENLABS_API_KEY,
                extraConfig: {
                    ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY
                }
            });
            console.log("✅ [AutoConnection] ElevenLabs linked.");
        }

        // 5. REPLICATE
        if (process.env.REPLICATE_API_TOKEN) {
            await saveConnectionSecret({
                storeId,
                provider: 'REPLICATE',
                secret: process.env.REPLICATE_API_TOKEN,
                extraConfig: {
                    REPLICATE_API_TOKEN: process.env.REPLICATE_API_TOKEN
                }
            });
            console.log("✅ [AutoConnection] Replicate linked.");
        }

        // 6. BEEPING
        if (process.env.BEEPING_API_KEY) {
            await saveConnectionSecret({
                storeId,
                provider: 'BEEPING',
                secret: process.env.BEEPING_API_KEY,
                extraConfig: {
                    BEEPING_API_URL: process.env.BEEPING_API_URL || 'https://app.gobeeping.com/api'
                }
            });
            console.log("✅ [AutoConnection] Beeping linked.");
        }

        // 7. ANTHROPIC (Using Replicate token as per registry)
        if (process.env.REPLICATE_API_TOKEN) {
            await saveConnectionSecret({
                storeId,
                provider: 'ANTHROPIC',
                secret: process.env.REPLICATE_API_TOKEN,
                extraConfig: {
                    REPLICATE_API_TOKEN: process.env.REPLICATE_API_TOKEN
                }
            });
            console.log("✅ [AutoConnection] Anthropic (via Replicate) linked.");
        }

        // 8. GCP
        if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY && process.env.GOOGLE_CLOUD_PROJECT_ID) {
            await saveConnectionSecret({
                storeId,
                provider: 'GCP',
                secret: process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
                extraConfig: {
                    GOOGLE_CLOUD_PROJECT_ID: process.env.GOOGLE_CLOUD_PROJECT_ID,
                    GCS_BUCKET_NAME: process.env.GCS_BUCKET_NAME || ''
                }
            });
            console.log("✅ [AutoConnection] GCP linked.");
        }

        // 9. GA4
        if (process.env.GA4_MEASUREMENT_ID && process.env.GA4_API_SECRET) {
            await saveConnectionSecret({
                storeId,
                provider: 'GA4',
                secret: process.env.GA4_API_SECRET,
                extraConfig: {
                    GA4_MEASUREMENT_ID: process.env.GA4_MEASUREMENT_ID,
                    GA4_PROPERTY_ID: process.env.GA4_PROPERTY_ID || ''
                }
            });
            console.log("✅ [AutoConnection] GA4 linked.");
        }

        // 10. DROPEA
        if (process.env.DROPEA_API_KEY) {
            await saveConnectionSecret({
                storeId,
                provider: 'DROPEA',
                secret: process.env.DROPEA_API_KEY,
                extraConfig: {
                    DROPEA_API_KEY: process.env.DROPEA_API_KEY
                }
            });
            console.log("✅ [AutoConnection] Dropea linked.");
        }

        // 11. DROPI
        if (process.env.DROPI_API_KEY) {
            await saveConnectionSecret({
                storeId,
                provider: 'DROPI',
                secret: process.env.DROPI_API_KEY,
                extraConfig: {
                    DROPI_API_KEY: process.env.DROPI_API_KEY
                }
            });
            console.log("✅ [AutoConnection] Dropi linked.");
        }
    }
}
