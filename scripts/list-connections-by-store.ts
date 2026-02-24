
import { prisma } from "../src/lib/prisma";

async function main() {
    console.log("🔍 LISTADO DE CONEXIONES POR STORE (Real DB Inventory)");
    console.log("--------------------------------------------------------------------------------");

    const stores = await prisma.store.findMany({
        include: {
            connections: true
        }
    });

    if (stores.length === 0) {
        console.log("❌ No stores found in database.");
        return;
    }

    for (const store of stores) {
        console.log(`\n🏪 STORE: ${store.name} (${store.id})`);

        if (store.connections.length === 0) {
            console.log("   (No connections configured)");
            continue;
        }

        const tableData = store.connections.map(c => ({
            Provider: c.provider,
            Enabled: c.isActive ? "✅" : "❌",
            HasSecret: (c.secretEnc && c.secretIv) ? "🔐 Encrypted" : ((c as any).apiKey ? "⚠️ Plaintext" : "❌ Missing"),
            Updated: c.updatedAt.toISOString().split('T')[0]
        }));

        console.table(tableData);
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
