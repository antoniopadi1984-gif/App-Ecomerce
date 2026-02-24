
import { prisma } from "../src/lib/prisma";
import { saveConnectionSecret } from "../src/lib/server/connections";

async function main() {
    const store = await prisma.store.findFirst();
    if (!store) throw new Error("No store found");

    console.log("🛠️ Setting up connections for Evidence...");

    // 1. SHOPIFY (Active, OK)
    await saveConnectionSecret({
        storeId: store.id,
        provider: "SHOPIFY",
        secret: "shpat_mock_secret_123",
        extraConfig: { shop: "evidence-store.myshopify.com" }
    });
    console.log("✅ Shopify Connected (Mock Data)");

    // 2. GOOGLE_SHEETS (Active, STUB)
    await saveConnectionSecret({
        storeId: store.id,
        provider: "GOOGLE_SHEETS",
        secret: "mock_service_account_json",
        extraConfig: { sheetId: "12345" }
    });
    console.log("✅ Google Sheets Connected (Stub Data)");
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
