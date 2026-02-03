
const { createClient } = require('@libsql/client');
const DATABASE_URL = process.env.DATABASE_URL || "file:./prisma/dev.db";

async function run() {
    const client = createClient({ url: DATABASE_URL });
    console.log("🛠️ Applying schema updates...");

    try {
        await client.execute(`
            CREATE TABLE IF NOT EXISTS "ProviderStatusMap" (
                "id" TEXT NOT NULL PRIMARY KEY,
                "provider" TEXT NOT NULL,
                "rawStatus" TEXT NOT NULL,
                "normalizedStatus" TEXT NOT NULL,
                "labelEs" TEXT NOT NULL,
                "severity" TEXT NOT NULL,
                "isFinal" BOOLEAN NOT NULL DEFAULT 0,
                "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" DATETIME NOT NULL
            );
        `);
        console.log("✅ Created ProviderStatusMap");

        await client.execute(`CREATE UNIQUE INDEX IF NOT EXISTS "ProviderStatusMap_provider_rawStatus_key" ON "ProviderStatusMap"("provider", "rawStatus");`);
        console.log("✅ Created Index for ProviderStatusMap");

        try {
            await client.execute(`ALTER TABLE "DailySnapshot" ADD COLUMN "dataCompleteness" TEXT DEFAULT '{}'`);
            console.log("✅ Added dataCompleteness to DailySnapshot");
        } catch (e) {
            // LibSQL duplicate coolumn error handling might vary, we catch generally.
            // If it fails it likely exists.
            console.log("ℹ️ Note on column addition:", e.message);
        }

    } catch (e) {
        console.error("❌ Migration failed:", e);
    }
}

run();
