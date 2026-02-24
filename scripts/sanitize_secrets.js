const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SENSITIVE_KEYS = [
    'GEMINI_API_KEY',
    'ELEVENLABS_API_KEY',
    'REPLICATE_API_TOKEN',
    'META_ACCESS_TOKEN',
    'SHOPIFY_ACCESS_TOKEN',
    'DROPEA_API_KEY',
    'DROPI_API_KEY',
    'BEEPING_API_KEY',
    'GA4_API_SECRET',
    'GOOGLE_SERVICE_ACCOUNT_KEY'
];

async function cleanSecrets() {
    const conns = await prisma.connection.findMany();
    let cleaned = 0;

    for (const c of conns) {
        if (!c.extraConfig) continue;

        try {
            const extra = JSON.parse(c.extraConfig);
            let modified = false;

            for (const key of SENSITIVE_KEYS) {
                if (extra[key] !== undefined) {
                    delete extra[key];
                    modified = true;
                }
            }

            // Also explicitly delete Tienda metadata from global connections to be absolutely safe
            if (c.provider !== 'SHOPIFY') {
                if (extra.TIENDA || extra.Tienda || extra.tienda) {
                    delete extra.TIENDA;
                    delete extra.Tienda;
                    delete extra.tienda;
                    modified = true;
                }
            }

            if (modified) {
                await prisma.connection.update({
                    where: { id: c.id },
                    data: { extraConfig: JSON.stringify(extra) }
                });
                console.log(`[${c.provider}] Sanitized metadata.`);
                cleaned++;
            }
        } catch (e) {
            console.error(`Failed to parse extraConfig for ${c.id}: ${e.message}`);
        }
    }

    console.log(`Cleaned up ${cleaned} connections.`);
}

cleanSecrets().finally(() => prisma.$disconnect());
