const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clean() {
    const conns = await prisma.connection.findMany();
    console.log(`Found ${conns.length} connections.`);

    // Group by base provider (split by _)
    const groups = {};
    for (const c of conns) {
        if (c.provider === 'SHOPIFY') continue; // keep shopify as is

        const base = c.provider.split('_')[0];
        if (!groups[base]) groups[base] = [];
        groups[base].push(c);
    }

    // For each base provider, keep the earliest one, delete the rest.
    // Also strip out 'TIENDA' from extraConfig
    for (const base in groups) {
        const sorted = groups[base].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        const keep = sorted[0];
        const deletes = sorted.slice(1);

        console.log(`[${base}] Keeping ${keep.id} (${keep.provider}), deleting ${deletes.length} others.`);

        if (keep.provider !== base) {
            console.log(`  -> Renaming ${keep.provider} to ${base}`);
            await prisma.connection.update({
                where: { id: keep.id },
                data: { provider: base }
            });
        }

        if (keep.extraConfig) {
            try {
                const conf = JSON.parse(keep.extraConfig);
                if (conf.TIENDA || conf.Tienda || conf.tienda) {
                    delete conf.TIENDA;
                    delete conf.Tienda;
                    delete conf.tienda;
                    await prisma.connection.update({
                        where: { id: keep.id },
                        data: { extraConfig: JSON.stringify(conf) }
                    });
                    console.log(`  -> Cleaned TIENDA from extraConfig`);
                }
            } catch (e) { }
        }

        for (const d of deletes) {
            await prisma.connection.delete({ where: { id: d.id } });
            console.log(`  -> Deleted duplicate ${d.id} (${d.provider})`);
        }
    }

    console.log("Done.");
}

clean().finally(() => prisma.$disconnect());
