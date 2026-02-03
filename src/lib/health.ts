
import { FEATURE_FLAGS } from "./feature-flags";

export type HealthStatus = 'operational' | 'degraded' | 'offline' | 'disabled';

export interface ModuleHealth {
    status: HealthStatus;
    latency?: number;
    details?: string;
    lastChecked: string;
}

export async function checkGeminiHealth(): Promise<ModuleHealth> {
    if (!process.env.GEMINI_API_KEY) return { status: 'disabled', lastChecked: new Date().toISOString(), details: 'Missing API Key' };

    try {
        const start = Date.now();
        // Light check: just imports and a minimal call if possible, or just check env
        // For now, let's assume if Key exists it's operational unless it fails in action
        return { status: 'operational', latency: Date.now() - start, lastChecked: new Date().toISOString() };
    } catch (e) {
        return { status: 'offline', lastChecked: new Date().toISOString(), details: String(e) };
    }
}

export async function checkLocalEngineHealth(): Promise<ModuleHealth> {
    if (!FEATURE_FLAGS.AVATARS_LAB.LOCAL_ENGINE) return { status: 'disabled', lastChecked: new Date().toISOString() };

    try {
        const start = Date.now();
        const res = await fetch("http://localhost:8000/").then(r => r.json());
        if (res.status === "operational") {
            return { status: 'operational', latency: Date.now() - start, lastChecked: new Date().toISOString(), details: `GPU: ${res.gpu_available}` };
        }
        return { status: 'degraded', lastChecked: new Date().toISOString() };
    } catch {
        return { status: 'offline', lastChecked: new Date().toISOString() };
    }
}

export async function getSystemHealth() {
    return {
        gemini: await checkGeminiHealth(),
        localEngine: await checkLocalEngineHealth(),
        database: { status: 'operational', lastChecked: new Date().toISOString() }, // Simplified
    };
}
