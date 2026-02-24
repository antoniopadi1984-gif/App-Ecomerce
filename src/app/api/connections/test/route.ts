
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getConnectionSecret, getConnectionMeta } from "@/lib/server/connections";

/**
 * Valid provider IDs (mirrors PROVIDER_REGISTRY keys without importing client-only module)
 */
const VALID_PROVIDERS = new Set([
    'SHOPIFY', 'META', 'REPLICATE', 'ANTHROPIC', 'GOOGLE_CLOUD', 'VERTEX',
    'GEMINI', 'GA4', 'GOOGLE_MAPS', 'CLARITY', 'ELEVENLABS', 'BEEPING',
    'DROPEA', 'DROPI', 'GCP'
]);

/**
 * POST /api/connections/test
 * Tests a real connection to each provider's API
 */
export async function POST(req: NextRequest) {
    const start = Date.now();
    let providerId = "UNKNOWN";

    try {
        // Try to get storeId from DB (fallback to store-main)
        const store = await prisma.store.findFirst({ where: { id: 'store-main' } })
            || await prisma.store.findFirst();
        const storeId = store?.id || 'store-main';

        const body = await req.json();
        const provider = (body.provider || '').toUpperCase();
        providerId = provider;

        if (!VALID_PROVIDERS.has(provider)) {
            return NextResponse.json({
                provider,
                status: "FAIL",
                message: "Proveedor no válido o no registrado.",
                latencyMs: Date.now() - start
            }, { status: 400 });
        }

        const secret = await getConnectionSecret(storeId, provider);
        const meta = await getConnectionMeta(storeId, provider);

        if (!secret) {
            return NextResponse.json({
                provider,
                status: "FAIL",
                message: "No se encontraron credenciales. Configura la conexión primero.",
                latencyMs: Date.now() - start
            });
        }

        // Parse extraConfig
        let extraConfig: Record<string, any> = {};
        if (meta?.extraConfig) {
            try {
                extraConfig = typeof meta.extraConfig === 'string'
                    ? JSON.parse(meta.extraConfig)
                    : meta.extraConfig;
            } catch (e) { /* ignore */ }
        }

        let status = "FAIL";
        let message = "Test no implementado para este proveedor.";
        let details: any = {};

        // ─── REAL API TESTS ───
        switch (provider.toUpperCase()) {
            case 'SHOPIFY': {
                const domain = extraConfig.SHOPIFY_SHOP_DOMAIN || process.env.SHOPIFY_SHOP_DOMAIN;
                if (!domain) {
                    message = "SHOPIFY_SHOP_DOMAIN no configurado.";
                    break;
                }
                const res = await fetch(`https://${domain}/admin/api/2024-01/shop.json`, {
                    headers: { 'X-Shopify-Access-Token': secret }
                });
                if (res.ok) {
                    const data = await res.json();
                    status = "OK";
                    message = `Conectado a ${data.shop?.name || domain}`;
                    details = { shopName: data.shop?.name, plan: data.shop?.plan_name };
                } else {
                    message = `Shopify respondió ${res.status}: ${res.statusText}`;
                }
                break;
            }

            case 'META': {
                const res = await fetch(`https://graph.facebook.com/v19.0/me?access_token=${secret}&fields=id,name`);
                if (res.ok) {
                    const data = await res.json();
                    status = "OK";
                    message = `Conectado como ${data.name || data.id}`;
                    details = { userId: data.id, userName: data.name };
                } else {
                    const err = await res.json().catch(() => ({}));
                    message = `Meta API Error: ${err?.error?.message || res.statusText}`;
                }
                break;
            }

            case 'GEMINI': {
                const res = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${secret}`);
                if (res.ok) {
                    const data = await res.json();
                    const models = data.models?.length || 0;
                    status = "OK";
                    message = `API Key válida (${models} modelos disponibles)`;
                    details = { modelsAvailable: models };
                } else {
                    const err = await res.json().catch(() => ({}));
                    message = `Gemini Error: ${err?.error?.message || res.statusText}`;
                }
                break;
            }

            case 'ELEVENLABS': {
                const res = await fetch('https://api.elevenlabs.io/v1/user', {
                    headers: { 'xi-api-key': secret }
                });
                if (res.ok) {
                    const data = await res.json();
                    status = "OK";
                    const tier = data.subscription?.tier || 'unknown';
                    const chars = data.subscription?.character_count || 0;
                    const limit = data.subscription?.character_limit || 0;
                    message = `Plan: ${tier} | Caracteres: ${chars.toLocaleString()}/${limit.toLocaleString()}`;
                    details = { tier, characters: chars, limit };
                } else {
                    message = `ElevenLabs Error: ${res.statusText}`;
                }
                break;
            }

            case 'REPLICATE': {
                const res = await fetch('https://api.replicate.com/v1/account', {
                    headers: { 'Authorization': `Bearer ${secret}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    status = "OK";
                    message = `Cuenta: ${data.username || data.github_url || 'verificada'}`;
                    details = { username: data.username, type: data.type };
                } else if (res.status === 401) {
                    message = "Token de Replicate inválido o expirado.";
                } else {
                    message = `Replicate Error: ${res.statusText}`;
                }
                break;
            }

            case 'BEEPING': {
                const baseUrl = extraConfig.BEEPING_API_URL || process.env.BEEPING_API_URL || 'https://app.gobeeping.com/api';
                try {
                    const res = await fetch(`${baseUrl}/orders?take=1`, {
                        headers: { 'Authorization': secret }
                    });
                    if (res.ok || res.status === 200) {
                        status = "OK";
                        message = "Beeping API conectada";
                    } else if (res.status === 401) {
                        message = "Credenciales de Beeping inválidas.";
                    } else {
                        message = `Beeping respondió ${res.status}`;
                    }
                } catch (e: any) {
                    message = `No se puede conectar a Beeping: ${e.message}`;
                }
                break;
            }

            case 'GOOGLE_CLOUD': {
                // Validate that the service account JSON is valid
                try {
                    const saKey = JSON.parse(secret);
                    if (saKey.type === 'service_account' && saKey.project_id && saKey.private_key) {
                        status = "OK";
                        message = `SA: ${saKey.client_email?.split('@')[0] || 'ok'} | Project: ${saKey.project_id}`;
                        details = {
                            projectId: saKey.project_id,
                            clientEmail: saKey.client_email,
                            subServices: ['Maps', 'Sheets', 'Drive', 'GA4', 'BigQuery', 'GCS']
                        };
                    } else {
                        message = "El JSON del Service Account es inválido (falta type, project_id o private_key).";
                    }
                } catch (e) {
                    message = "El secreto no es un JSON válido de Service Account.";
                }
                break;
            }

            case 'CLARITY': {
                // Clarity just needs a project ID, no API test needed
                if (extraConfig.CLARITY_PROJECT_ID) {
                    status = "OK";
                    message = `Project ID: ${extraConfig.CLARITY_PROJECT_ID}`;
                } else {
                    message = "CLARITY_PROJECT_ID no configurado.";
                }
                break;
            }

            case 'DROPEA':
            case 'DROPI': {
                status = "STUB";
                message = "Credenciales almacenadas (test real pendiente de implementación)";
                break;
            }

            default: {
                if (secret) {
                    status = "STUB";
                    message = "Credenciales almacenadas correctamente";
                }
            }
        }

        const latencyMs = Date.now() - start;
        const responsePayload = { provider, status, message, latencyMs, details };

        // Audit Log
        try {
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
        } catch (e) {
            // Audit log failure should not block the response
        }

        // Update Sync Status if OK
        if (status === "OK") {
            try {
                await prisma.connection.updateMany({
                    where: { storeId, provider },
                    data: { lastSyncedAt: new Date() }
                });
            } catch (e) {
                // Ignore update errors
            }
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
