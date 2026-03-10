import { saveConnectionSecret } from "./connections";
import { prisma } from "@/lib/prisma";

export class AutoConnectionService {
    static async run() {
        console.log("⚙️ [AutoConnection] Checking for available API keys in environment...");

        // Ensure we have a default store
        const store = await (prisma as any).store.upsert({
            where: { id: 'store-main' },
            update: {
                // Solo actualiza domain si existe en env — NUNCA sobreescribe name
                ...(process.env.SHOPIFY_SHOP_DOMAIN ? { domain: process.env.SHOPIFY_SHOP_DOMAIN } : {})
            },
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

        // 2. META (link even without AD_ACCOUNT_ID — user can add it later)
        if (process.env.META_ACCESS_TOKEN) {
            await saveConnectionSecret({
                storeId,
                provider: 'META',
                secret: process.env.META_ACCESS_TOKEN,
                extraConfig: {
                    META_AD_ACCOUNT_ID: process.env.META_AD_ACCOUNT_ID || '',
                    META_APP_ID: process.env.META_APP_ID || ''
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

        // 7. ANTHROPIC — REMOVED: Claude is a child of REPLICATE (parentProviderId)
        //    It shows as a sub-icon on the Replicate card, no separate DB row needed.

        // 8. GOOGLE_CLOUD (Master Node — includes Maps, Sheets, Drive, GA4, BigQuery as children)
        if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY && process.env.GOOGLE_CLOUD_PROJECT_ID) {
            await saveConnectionSecret({
                storeId,
                provider: 'GOOGLE_CLOUD',
                secret: process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
                extraConfig: {
                    GOOGLE_CLOUD_PROJECT_ID: process.env.GOOGLE_CLOUD_PROJECT_ID,
                    GCS_BUCKET_NAME: process.env.GCS_BUCKET_NAME || '',
                    GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
                    GA4_PROPERTY_ID: process.env.GA4_PROPERTY_ID || '',
                    GOOGLE_CLOUD_LOCATION: process.env.GOOGLE_CLOUD_LOCATION || 'eu'
                }
            });
            console.log("✅ [AutoConnection] Google Cloud Platform linked (Maps, Sheets, Drive, GA4 included).");
        }

        // 9. GA4 — REMOVED: GA4 is a child of GOOGLE_CLOUD (parentProviderId)
        //    Property ID is stored in GOOGLE_CLOUD's extraConfig above.

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
