import { PrismaClient } from "@prisma/client";
import { encryptSecret } from "../src/lib/server/crypto";

const prisma = new PrismaClient();

async function migrate() {
    console.log("🚀 [Migration] Starting connection credential encryption...");

    const connections = await (prisma as any).connection.findMany({
        where: {
            secretEnc: null,
            OR: [
                { apiKey: { not: null } },
                { apiSecret: { not: null } },
                { accessToken: { not: null } }
            ]
        }
    });

    console.log(`[Migration] Found ${connections.length} connections to migrate.`);

    for (const conn of connections) {
        // Encontrar el secreto relevante (el primero que tenga valor)
        const secret = conn.apiKey || conn.apiSecret || conn.accessToken;

        if (!secret) {
            console.log(`[Migration] Skipping ${conn.provider} for store ${conn.storeId} (Empty secret)`);
            continue;
        }

        console.log(`[Migration] Encrypting credentials for ${conn.provider} (Store: ${conn.storeId})...`);

        try {
            const { enc, iv, tag } = encryptSecret(secret);

            await (prisma as any).connection.update({
                where: { id: conn.id },
                data: {
                    secretEnc: enc,
                    secretIv: iv,
                    secretTag: tag,
                    // Marcamos como migrado limpiando (o dejando) los campos antiguos según política
                    // Para seguridad extrema, mejor limpiarlos tras confirmar éxito
                }
            });
            console.log(`[Migration] ✅ Success for ${conn.provider}`);
        } catch (err: any) {
            console.error(`[Migration] ❌ Failed to encrypt ${conn.id}:`, err.message);
        }
    }

    console.log("🏁 [Migration] Finished.");
}

migrate()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
