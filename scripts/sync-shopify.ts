
import * as dotenv from 'dotenv';
dotenv.config();

import { prisma } from '../src/lib/prisma';
import { syncShopifyHistory } from '../src/app/logistics/orders/actions';

async function run() {
    console.log("🚀 Starting Shopify Connection Initialization...");

    const shopDomain = process.env.SHOPIFY_SHOP_DOMAIN;
    const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
    const apiSecret = process.env.SHOPIFY_API_SECRET;

    if (!shopDomain || !accessToken) {
        console.error("❌ Missing SHOPIFY_SHOP_DOMAIN or SHOPIFY_ACCESS_TOKEN in .env");
        process.exit(1);
    }

    const defaultStoreId = "default-store";

    try {
        // 1. Ensure Store exists
        console.log("🏪 Checking for default store...");
        let store = await (prisma as any).store.findUnique({ where: { id: defaultStoreId } });
        if (!store) {
            console.log("➕ Creating default store...");
            store = await (prisma as any).store.create({
                data: {
                    id: defaultStoreId,
                    name: "Mi Tienda",
                    currency: "EUR"
                }
            });
        }

        // 2. Ensure SHOPIFY connection exists
        console.log("🔍 Checking for existing SHOPIFY connection...");
        let connection = await (prisma as any).connection.findFirst({
            where: { provider: "SHOPIFY", storeId: defaultStoreId }
        });

        if (!connection) {
            console.log("➕ Creating new SHOPIFY connection record...");
            connection = await (prisma as any).connection.create({
                data: {
                    provider: "SHOPIFY",
                    apiKey: accessToken,
                    apiSecret: apiSecret || "",
                    extraConfig: shopDomain,
                    storeId: defaultStoreId
                }
            });
        } else {
            console.log("🔄 Updating existing SHOPIFY connection...");
            connection = await (prisma as any).connection.update({
                where: { id: connection.id },
                data: {
                    apiKey: accessToken,
                    apiSecret: apiSecret || "",
                    extraConfig: shopDomain
                }
            });
        }

        console.log("✅ Connection record ready. ID:", connection.id);

        // 3. Trigger Sync
        console.log("📥 Triggering Shopify History Sync...");
        const result = await syncShopifyHistory(defaultStoreId);
        console.log("📊 Sync Result:", result);

    } catch (err) {
        console.error("❌ Process failed:", err);
    }

    process.exit(0);
}

run();
