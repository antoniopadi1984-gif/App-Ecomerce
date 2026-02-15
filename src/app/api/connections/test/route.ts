import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { safeConfigError } from "@/lib/security/safe-ui";

interface TestResult {
    provider: string;
    status: "OK" | "FAIL" | "STUB";
    message: string;
    latencyMs?: number;
}

async function testShopify(connection: any): Promise<TestResult> {
    const domain = process.env.SHOPIFY_SHOP_DOMAIN;
    const token = process.env.SHOPIFY_ACCESS_TOKEN;
    if (!domain || !token) {
        return { provider: "SHOPIFY", status: "FAIL", message: safeConfigError("SHOPIFY_ACCESS_TOKEN") };
    }
    const start = Date.now();
    try {
        const res = await fetch(`https://${domain}/admin/api/2024-01/shop.json`, {
            headers: { "X-Shopify-Access-Token": token },
            signal: AbortSignal.timeout(10000),
        });
        const latencyMs = Date.now() - start;
        if (res.ok) {
            const data = await res.json();
            return { provider: "SHOPIFY", status: "OK", message: `Conectado: ${data.shop?.name || domain}`, latencyMs };
        }
        return { provider: "SHOPIFY", status: "FAIL", message: `HTTP ${res.status}: ${res.statusText}`, latencyMs };
    } catch (e: any) {
        return { provider: "SHOPIFY", status: "FAIL", message: `Error: ${e.message}`, latencyMs: Date.now() - start };
    }
}

async function testMeta(connection: any): Promise<TestResult> {
    const token = process.env.META_ACCESS_TOKEN;
    if (!token) {
        return { provider: "META", status: "FAIL", message: safeConfigError("META_ACCESS_TOKEN") };
    }
    const start = Date.now();
    try {
        const res = await fetch(`https://graph.facebook.com/v19.0/me?access_token=${token}`, {
            signal: AbortSignal.timeout(10000),
        });
        const latencyMs = Date.now() - start;
        if (res.ok) {
            const data = await res.json();
            return { provider: "META", status: "OK", message: `Conectado: ${data.name || data.id}`, latencyMs };
        }
        const err = await res.json().catch(() => ({}));
        return { provider: "META", status: "FAIL", message: `HTTP ${res.status}: ${(err as any).error?.message || res.statusText}`, latencyMs };
    } catch (e: any) {
        return { provider: "META", status: "FAIL", message: `Error: ${e.message}`, latencyMs: Date.now() - start };
    }
}

async function testBeeping(connection: any): Promise<TestResult> {
    const apiKey = process.env.BEEPING_API_KEY;
    const apiUrl = process.env.BEEPING_API_URL || "https://app.gobeeping.com/api";
    if (!apiKey) {
        return { provider: "BEEPING", status: "FAIL", message: safeConfigError("BEEPING_API_KEY") };
    }
    const start = Date.now();
    try {
        const res = await fetch(`${apiUrl}/shipments?limit=1`, {
            headers: { "Authorization": apiKey },
            signal: AbortSignal.timeout(10000),
        });
        const latencyMs = Date.now() - start;
        if (res.ok) {
            return { provider: "BEEPING", status: "OK", message: "Conexión verificada (shipments endpoint)", latencyMs };
        }
        return { provider: "BEEPING", status: "FAIL", message: `HTTP ${res.status}: ${res.statusText}`, latencyMs };
    } catch (e: any) {
        return { provider: "BEEPING", status: "FAIL", message: `Error: ${e.message}`, latencyMs: Date.now() - start };
    }
}

async function testGoogleSheets(connection: any): Promise<TestResult> {
    const serviceKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    if (!serviceKey) {
        return { provider: "GOOGLE_SHEETS", status: "FAIL", message: safeConfigError("GOOGLE_SERVICE_ACCOUNT_KEY") };
    }
    try {
        const parsed = JSON.parse(serviceKey);
        if (parsed.client_email) {
            return { provider: "GOOGLE_SHEETS", status: "STUB", message: `Service Account detectada: ${parsed.client_email}. Verificación real requiere Token OAuth.` };
        }
        return { provider: "GOOGLE_SHEETS", status: "FAIL", message: "Service Account JSON inválido" };
    } catch {
        return { provider: "GOOGLE_SHEETS", status: "FAIL", message: "Error en la configuración de Google Sheets" };
    }
}

async function testReplicate(connection: any): Promise<TestResult> {
    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) {
        return { provider: "REPLICATE", status: "FAIL", message: safeConfigError("REPLICATE_API_TOKEN") };
    }
    const start = Date.now();
    try {
        const res = await fetch("https://api.replicate.com/v1/account", {
            headers: { "Authorization": `Bearer ${token}` },
            signal: AbortSignal.timeout(10000),
        });
        const latencyMs = Date.now() - start;
        if (res.ok) {
            const data = await res.json();
            return { provider: "REPLICATE", status: "OK", message: `Conectado: ${data.username || "account OK"}`, latencyMs };
        }
        return { provider: "REPLICATE", status: "FAIL", message: `HTTP ${res.status}: ${res.statusText}`, latencyMs };
    } catch (e: any) {
        return { provider: "REPLICATE", status: "FAIL", message: `Error: ${e.message}`, latencyMs: Date.now() - start };
    }
}

const TESTERS: Record<string, (conn: any) => Promise<TestResult>> = {
    SHOPIFY: testShopify,
    META: testMeta,
    BEEPING: testBeeping,
    GOOGLE_SHEETS: testGoogleSheets,
    REPLICATE: testReplicate,
};

export async function POST(req: NextRequest) {
    try {
        const { provider, connectionId } = await req.json();
        const storeId = req.headers.get("X-Store-Id");

        if (!provider) {
            return NextResponse.json({ error: "provider es requerido" }, { status: 400 });
        }

        // Get connection if connectionId provided
        let connection = null;
        if (connectionId) {
            connection = await prisma.connection.findUnique({ where: { id: connectionId } });
        }

        const tester = TESTERS[provider];
        if (!tester) {
            const result: TestResult = {
                provider,
                status: "STUB",
                message: `No hay test implementado para ${provider}. Marcar como STUB.`,
            };
            return NextResponse.json(result);
        }

        const result = await tester(connection);

        // Log the test in audit with store context
        const resolvedStoreId = storeId || (await prisma.store.findFirst())?.id;
        if (resolvedStoreId) {
            await logAudit({
                storeId: resolvedStoreId,
                action: "CONNECTION_TEST",
                entity: "CONNECTION",
                entityId: connectionId || provider,
                newValue: result,
                actorType: "HUMAN",
            });
        }

        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json(
            { provider: "UNKNOWN", status: "FAIL", message: error.message },
            { status: 500 }
        );
    }
}
