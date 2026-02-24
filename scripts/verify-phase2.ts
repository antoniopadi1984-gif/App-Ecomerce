
import { prisma } from "../src/lib/prisma";
import { saveConnectionSecret, getConnectionSecret, deleteConnection } from "../src/lib/server/connections";

async function main() {
    console.log("🧪 VERIFICACIÓN FASE 2: LIFECYCLE DE CONEXIONES");
    console.log("------------------------------------------------");

    // 0. Setup
    const store = await prisma.store.findFirst();
    if (!store) throw new Error("No store found");
    const storeId = store.id;
    const PROVIDER = "TEST_PROVIDER_PHASE2";
    const SECRET = "secret_super_seguro_123";

    try {
        // 1. CREATE / SAVE (Vault)
        console.log(`\n1️⃣  Guardando conexión cifrada para ${PROVIDER}...`);
        await saveConnectionSecret({
            storeId,
            provider: PROVIDER,
            secret: SECRET,
            extraConfig: { test: true }
        });
        console.log("✅ Guardado OK.");

        // 2. READ (Decrypt)
        console.log(`\n2️⃣  Recuperando y descifrando secreto...`);
        const decrypted = await getConnectionSecret(storeId, PROVIDER);
        if (decrypted === SECRET) {
            console.log("✅ Descifrado COINCIDE.");
        } else {
            console.error("❌ Descifrado FALLÓ:", decrypted);
        }

        // 3. MOCK TEST (JSON Output)
        console.log(`\n3️⃣  Simulando /api/connections/test...`);
        const testResult = {
            success: true,
            provider: PROVIDER,
            details: { status: "connected", latency: "12ms" },
            timestamp: new Date().toISOString()
        };
        console.log("📄 JSON Response:");
        console.log(JSON.stringify(testResult, null, 2));

        // 4. DELETE (Audit)
        console.log(`\n4️⃣  Eliminando conexión...`);
        // First get ID
        const conn = await prisma.connection.findUnique({
            where: { storeId_provider: { storeId, provider: PROVIDER } }
        });

        if (conn) {
            await deleteConnection(conn.id);
            console.log("✅ Eliminado OK.");
        } else {
            console.error("❌ No se encontró la conexión para borrar.");
        }

        // 5. VERIFY AUDIT LOG
        console.log(`\n5️⃣  Verificando AuditLog...`);
        const log = await prisma.auditLog.findFirst({
            where: {
                entity: "CONNECTION",
                entityId: PROVIDER,
                action: "CONNECTION_DELETED"
            },
            orderBy: { createdAt: 'desc' }
        });

        if (log) {
            console.log("✅ Audit Log encontrado:");
            console.table([{
                Action: log.action,
                Entity: log.entity,
                EntityId: log.entityId,
                Time: log.createdAt.toISOString()
            }]);
        } else {
            console.error("❌ No se encontró AuditLog.");
        }

    } catch (e) {
        console.error("💥 Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
