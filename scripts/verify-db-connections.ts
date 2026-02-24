import { prisma } from "../src/lib/prisma";

async function verify() {
    console.log("🔍 Checking stores...");
    const stores = await (prisma as any).store.findMany();
    console.log("Stores found:", stores.map((s: any) => ({ id: s.id, name: s.name })));

    console.log("🔍 Checking connections for store-main...");
    const connections = await (prisma as any).connection.findMany({
        where: { storeId: 'store-main' }
    });

    console.log(`Found ${connections.length} connections for store-main:`);
    connections.forEach((c: any) => {
        console.log(` - ${c.provider} (Active: ${c.isActive})`);
    });

    if (connections.length === 0) {
        console.log("❌ No connections found in database!");
    } else {
        console.log("✅ Connections exist in database.");
    }
}

verify().catch(console.error);
