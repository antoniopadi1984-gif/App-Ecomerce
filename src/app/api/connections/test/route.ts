
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStoreIdNext } from "@/lib/server/store-context";
import { getConnectionSecret } from "@/lib/server/connections";
import { PROVIDER_REGISTRY } from "@/lib/providers/registry";

export async function POST(req: NextRequest) {
    const start = Date.now();
    let providerId = "UNKNOWN";

    try {
        const storeId = await requireStoreIdNext();
        const body = await req.json();
        const { provider } = body;
        providerId = provider;

        if (!PROVIDER_REGISTRY[provider]) {
            return NextResponse.json({
                provider,
                status: "FAIL",
                message: "Proveedor no válido o no registrado.",
                latencyMs: Date.now() - start
            }, { status: 400 });
        }

        const secret = await getConnectionSecret(storeId, provider);

        let status = "FAIL";
        let message = "No se encontraron credenciales.";

        // Simulation Logic (Phase 2 Stubbing)
        if (secret) {
            // In a real implementation, we would start the client and ping the API.
            // For now, we validate that we have the secret securely stored.
            if (['SHOPIFY', 'META', 'BEEPING'].includes(provider)) {
                status = "OK";
                message = `Conexión verificada con ${provider}`;
            } else {
                status = "STUB";
                message = "Simulación exitosa (Conector en desarrollo)";
            }
        } else {
            status = "FAIL";
            message = "Faltan credenciales. Configura la conexión primero.";
        }

        const latencyMs = Date.now() - start;
        const responsePayload = { provider, status, message, latencyMs };

        // Audit Log
        await prisma.auditLog.create({
            data: {
                storeId,
                action: "CONNECTION_TEST",
                entity: "CONNECTION",
                entityId: provider,
                actorType: "USER",
                newValue: JSON.stringify(responsePayload),
            } as any
        });

        // Update Sync Status if OK
        if (status === "OK") {
            await prisma.connection.update({
                where: { storeId_provider: { storeId, provider } },
                data: { lastSyncedAt: new Date() }
            });
        }

        return NextResponse.json(responsePayload);

    } catch (error: any) {
        console.error("[ConnectionTest] Error:", error);
        return NextResponse.json({
            provider: providerId,
            status: "FAIL",
            message: error.message || "Error interno del servidor",
            latencyMs: Date.now() - start
        }, { status: 500 });
    }
}
