
import { prisma } from "../src/lib/prisma";
import { getMetaAdsService } from "../src/lib/marketing/meta-ads";

async function diagnose() {
    console.log("=== STARTING DIAGNOSIS ===");

    // 1. Check Store & Token
    const store = await prisma.store.findFirst();
    if (!store) {
        console.error("No store found!");
        return;
    }
    console.log(`Store ID: ${store.id}, Name: ${store.name}`);

    // 2. Initialize Service
    try {
        const service = await getMetaAdsService(prisma, store.id);
        console.log("Meta Service Initialized.");

        // 3. Fetch Accounts
        console.log("Fetching Ad Accounts...");
        const accounts = await service.getAdAccounts();
        console.log(`Found ${accounts.length} accounts:`);
        accounts.forEach((acc: any) => {
            console.log(` - ID: ${acc.id}, Name: ${acc.name}, Status: ${acc.account_status}`);
        });

        if (accounts.length === 0) {
            console.warn("WARNING: No accounts found. Check Token scopes or user permissions.");
        }

        // 4. Check DB Data for today
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const metrics = await prisma.adMetricDaily.findMany({
            where: {
                storeId: store.id,
                date: { gte: today }
            },
            select: {
                level: true,
                platform: true,
                externalId: true,
                name: true,
                // account_id: true -- Not in schema, parsing from JSON
                metricsNorm: true
            }
        });

        console.log(`\nDB Metrics for Today (${today.toISOString()}): ${metrics.length} records.`);

        // Group by Account (Parsed from Norm)
        const byAccount: any = {};
        metrics.forEach((m: any) => {
            const norm = JSON.parse(m.metricsNorm as string);
            const accId = norm.account_id || 'UNKNOWN';
            const accName = norm.account_name || 'UNKNOWN';

            if (!byAccount[accId]) byAccount[accId] = { name: accName, count: 0, campaigns: new Set() };
            byAccount[accId].count++;
            if (m.level === 'CAMPAIGN') byAccount[accId].campaigns.add(m.name);
        });

        Object.keys(byAccount).forEach(k => {
            console.log(`Account ${k} (${byAccount[k].name}): ${byAccount[k].count} metrics. Campaigns: ${Array.from(byAccount[k].campaigns).join(', ')}`);
        });

    } catch (e: any) {
        console.error("Diagnosis Failed:", e);
    }
}

diagnose()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
