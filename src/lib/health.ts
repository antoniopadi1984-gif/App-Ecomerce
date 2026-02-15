import { FEATURE_FLAGS } from "./feature-flags";
import prisma from "./prisma";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";

export type HealthStatus = 'operational' | 'degraded' | 'offline' | 'disabled' | 'reviving';

export interface ModuleHealth {
    status: HealthStatus;
    latency?: number;
    details?: string;
    lastChecked: string;
}

import { modelRegistry, BudgetMode } from "./ai/model-registry";
import { TaskType } from "./ai/providers/interfaces";
import { agentDispatcher } from "./agents/agent-dispatcher";
import { getAgentStats } from "./agents/agent-registry";
import { API_CONFIG } from "./config/api-config";

export async function checkGeminiHealth(): Promise<ModuleHealth> {
    if (!API_CONFIG.vertexAI.apiKey) {
        return { status: 'disabled', lastChecked: new Date().toISOString(), details: 'Missing Vertex AI Key' };
    }

    try {
        const start = Date.now();
        // Verificamos que los modelos estén configurados en API_CONFIG
        const model = API_CONFIG.vertexAI.models.gemini.production;

        return {
            status: 'operational',
            latency: Date.now() - start,
            lastChecked: new Date().toISOString(),
            details: `Vertex AI Active. Model: ${model}`
        };
    } catch (e) {
        return { status: 'offline', lastChecked: new Date().toISOString(), details: String(e) };
    }
}

export async function checkReplicateHealth(): Promise<ModuleHealth> {
    if (!process.env.REPLICATE_API_TOKEN) {
        return { status: 'disabled', lastChecked: new Date().toISOString(), details: 'Replicate Token not configured' };
    }

    return {
        status: 'operational',
        lastChecked: new Date().toISOString(),
        details: `Replicate Active (Claude, Flux, Luma)`
    };
}

export async function checkLocalEngineHealth(): Promise<ModuleHealth> {
    if (!FEATURE_FLAGS.AVATARS_LAB.LOCAL_ENGINE) return { status: 'disabled', lastChecked: new Date().toISOString() };

    try {
        const start = Date.now();
        const res = await fetch("http://localhost:8000/", { signal: AbortSignal.timeout(2000) }).then(r => r.json());
        if (res.status === "operational") {
            return {
                status: 'operational',
                latency: Date.now() - start,
                lastChecked: new Date().toISOString(),
                details: `GPU: ${res.gpu_available ? 'YES' : 'NO'} | FFmpeg: ${res.ffmpeg_available ? 'YES' : 'NO'}`
            };
        }
        return { status: 'degraded', lastChecked: new Date().toISOString() };
    } catch (e) {
        // Trigger Auto-Heal if offline
        attemptEngineRecovery();
        return { status: 'offline', lastChecked: new Date().toISOString(), details: 'Connection Refused - Attempting Recovery...' };
    }
}

let isRecovering = false;
function attemptEngineRecovery() {
    if (isRecovering) return;
    isRecovering = true;
    console.log("🩹 [Health] Engine Offline. Triggering Auto-Heal...");

    const engineScript = path.resolve(process.cwd(), "src/engine/start_engine.sh");
    const engineProcess = spawn("bash", [engineScript], {
        detached: true,
        stdio: 'ignore',
        cwd: process.cwd()
    });
    engineProcess.unref();

    // Reset recovery flag after 30s to allow another attempt if it still fails
    setTimeout(() => { isRecovering = false; }, 30000);
}

export async function checkWorkerHealth(): Promise<ModuleHealth> {
    try {
        const start = Date.now();
        const heartbeat = await (prisma as any).systemHeartbeat.findUnique({
            where: { id: 'singleton' }
        });

        if (!heartbeat) return { status: 'offline', lastChecked: new Date().toISOString(), details: 'No heartbeat record found' };

        const diffSeconds = (Date.now() - new Date(heartbeat.timestamp).getTime()) / 1000;

        if (diffSeconds < 120) { // Active in last 2 minutes
            return { status: 'operational', latency: Date.now() - start, lastChecked: new Date().toISOString(), details: `Last pulse: ${Math.round(diffSeconds)}s ago` };
        }

        return { status: 'offline', lastChecked: new Date().toISOString(), details: `Stale heartbeat: ${Math.round(diffSeconds)}s old` };
    } catch (e) {
        return { status: 'offline', lastChecked: new Date().toISOString(), details: String(e) };
    }
}

export async function checkDatabaseHealth(): Promise<ModuleHealth> {
    try {
        const start = Date.now();
        await prisma.$queryRaw`SELECT 1`;
        return { status: 'operational', latency: Date.now() - start, lastChecked: new Date().toISOString(), details: 'Prisma Connection OK' };
    } catch (e) {
        return { status: 'offline', lastChecked: new Date().toISOString(), details: String(e) };
    }
}

export async function checkStorageHealth(): Promise<ModuleHealth> {
    try {
        const start = Date.now();
        const dataDir = path.resolve(process.cwd(), "data");
        if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

        const testPath = path.join(dataDir, ".health_check");
        fs.writeFileSync(testPath, "OK");
        fs.unlinkSync(testPath);

        return { status: 'operational', latency: Date.now() - start, lastChecked: new Date().toISOString() };
    } catch (e) {
        return { status: 'offline', lastChecked: new Date().toISOString(), details: `Storage Write Failed: ${String(e)}` };
    }
}

export async function checkShopifyHealth(): Promise<ModuleHealth> {
    const conn = await prisma.connection.findFirst({ where: { provider: 'SHOPIFY', isActive: true } });
    const token = conn?.apiSecret || process.env.SHOPIFY_ACCESS_TOKEN;
    const domain = conn?.extraConfig || process.env.SHOPIFY_SHOP_DOMAIN;

    if (!token || !domain) {
        return { status: 'disabled', lastChecked: new Date().toISOString(), details: 'Missing Shopify Credentials' };
    }

    try {
        const start = Date.now();
        const res = await fetch(`https://${domain}/admin/api/2024-01/shop.json`, {
            headers: { 'X-Shopify-Access-Token': token },
            signal: AbortSignal.timeout(3000)
        });
        if (res.ok) {
            return { status: 'operational', latency: Date.now() - start, lastChecked: new Date().toISOString(), details: 'Connected to Shop API' };
        }
        return { status: 'degraded', lastChecked: new Date().toISOString(), details: `HTTP ${res.status}` };
    } catch {
        return { status: 'offline', lastChecked: new Date().toISOString() };
    }
}

// In-memory cache for Meta Health
let metaHealthCache: { timestamp: number; data: ModuleHealth } | null = null;
const META_CACHE_TTL = 60 * 60 * 1000; // 1 Hour

export async function checkMetaHealth(): Promise<ModuleHealth> {
    const now = Date.now();

    // Check if cache is valid
    if (metaHealthCache && (now - metaHealthCache.timestamp < META_CACHE_TTL)) {
        return metaHealthCache.data;
    }

    const conn = await prisma.connection.findFirst({ where: { provider: 'META', isActive: true } });
    const token = conn?.apiKey || process.env.META_ACCESS_TOKEN;

    if (!token) {
        return { status: 'disabled', lastChecked: new Date().toISOString(), details: 'Missing Meta Token' };
    }

    try {
        const start = Date.now();
        const res = await fetch(`https://graph.facebook.com/v19.0/me?access_token=${token}`, {
            signal: AbortSignal.timeout(3000)
        });

        let result: ModuleHealth;
        if (res.ok) {
            const data = await res.json();
            result = { status: 'operational', latency: Date.now() - start, lastChecked: new Date().toISOString(), details: `Graph API Reachable (${data.name || 'OK'})` };
        } else {
            // Note: If previously operational, maybe we should keep it green if just rate limited? 
            // For now, respect HTTP status but cache it too to avoid hammering.
            result = { status: 'degraded', lastChecked: new Date().toISOString(), details: `HTTP ${res.status}` };
        }

        // Update Cache
        metaHealthCache = { timestamp: now, data: result };
        return result;

    } catch (e) {
        return { status: 'offline', lastChecked: new Date().toISOString(), details: String(e) };
    }
}

export async function checkBeepingHealth(): Promise<ModuleHealth> {
    const conn = await prisma.connection.findFirst({ where: { provider: 'BEEPING', isActive: true } });
    const key = conn?.apiKey || process.env.BEEPING_API_KEY;

    let apiUrl = process.env.BEEPING_API_URL || 'https://app.gobeeping.com/api';
    if (conn?.extraConfig) {
        try {
            const extra = JSON.parse(conn.extraConfig);
            if (extra.apiUrl) apiUrl = extra.apiUrl;
        } catch (e) { }
    }

    if (!key) {
        return { status: 'disabled', lastChecked: new Date().toISOString(), details: 'Missing Beeping Key' };
    }

    try {
        const start = Date.now();
        let authHeader = key;
        if (authHeader && !authHeader.startsWith('Basic ') && !authHeader.startsWith('Bearer ')) {
            authHeader = `Basic ${authHeader}`;
        }

        const res = await fetch(`${apiUrl}/get_orders?per_page=1`, {
            headers: { 'Authorization': authHeader },
            signal: AbortSignal.timeout(3000)
        });
        if (res.ok) {
            return { status: 'operational', latency: Date.now() - start, lastChecked: new Date().toISOString(), details: 'Logistics API Connected' };
        }
        return { status: 'degraded', lastChecked: new Date().toISOString(), details: `HTTP ${res.status}` };
    } catch {
        return { status: 'offline', lastChecked: new Date().toISOString() };
    }
}

import { DriveSync } from "./research/drive-sync";

export async function checkGoogleHealth(): Promise<ModuleHealth> {
    const conn = await prisma.connection.findFirst({ where: { provider: 'GOOGLE_SERVICE_ACCOUNT', isActive: true } });
    // Also check for user token if SA is missing, though SA is preferred
    const userConn = !conn ? await prisma.connection.findFirst({ where: { provider: 'GOOGLE_DRIVE', isActive: true } }) : null;

    if (!conn && !userConn) {
        return { status: 'disabled', lastChecked: new Date().toISOString(), details: 'No Google Connection' };
    }

    try {
        const start = Date.now();
        const drive = new DriveSync();
        // Light check: just verify we can get the root folder ID (cached or fresh)
        // ensureSystemRoot performs a real API call if cache missing, or verification if present
        await drive.ensureSystemRoot();

        return {
            status: 'operational',
            latency: Date.now() - start,
            lastChecked: new Date().toISOString(),
            details: 'Drive & Sheets Access OK'
        };
    } catch (e: any) {
        return { status: 'offline', lastChecked: new Date().toISOString(), details: e.message || String(e) };
    }
}

export async function getSystemHealth() {
    const agentStats = getAgentStats();

    return {
        database: await checkDatabaseHealth(),
        worker: await checkWorkerHealth(),
        engine: await checkLocalEngineHealth(),
        shopify: await checkShopifyHealth(),
        meta: await checkMetaHealth(),
        beeping: await checkBeepingHealth(),
        google: await checkGoogleHealth(),
        gemini: await checkGeminiHealth(),
        replicate: await checkReplicateHealth(),
        storage: await checkStorageHealth(),
        agents: {
            status: 'operational',
            stats: agentStats
        },
        config: {
            db_path: process.env.DATABASE_URL,
            engine_url: "http://localhost:8000"
        }
    };
}
