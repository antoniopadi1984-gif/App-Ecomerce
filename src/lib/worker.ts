
import prisma from "./prisma";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export type JobType = 'VIDEO_STT' | 'VIDEO_RENDER' | 'SHOPIFY_SYNC' | 'LOGISTICS_SYNC' | 'AI_EXTRACT' | 'MAINTENANCE' | 'UPDATE_CHECK' | 'META_SYNC_ACCOUNTS' | 'GENERATE_AVATAR_IMAGE';

export interface JobHandler {
    handle: (payload: any, onProgress: (p: number) => Promise<void>) => Promise<any>;
}

const Handlers: Record<string, JobHandler> = {
    // Registered handlers
};

export async function initHandlers() {
    registerHandler('AI_EXTRACT', (await import("./handlers/ai-extract")).default);
    registerHandler('MAINTENANCE', (await import("./handlers/maintenance")).default);
    registerHandler('LOGISTICS_SYNC', (await import("./handlers/logistics-sync")).default);
    registerHandler('SHOPIFY_SYNC', (await import("./handlers/shopify-sync")).default);
    registerHandler('META_SYNC_ACCOUNTS', (await import("./handlers/meta-sync-accounts")).default);
    registerHandler('GENERATE_AVATAR_IMAGE', (await import("./handlers/generate-avatar-image")).default);
}

export function registerHandler(type: JobType, handler: JobHandler) {
    Handlers[type] = handler;
}

export async function createJob(type: JobType, payload: any) {
    let internalPayload = { ...payload };

    // Offload large Base64 strings to filesystem
    if (payload.imageBase64 && payload.imageBase64.length > 100000) { // > 100KB
        try {
            const jobsDir = path.resolve(process.cwd(), "uploads", "jobs");
            if (!fs.existsSync(jobsDir)) fs.mkdirSync(jobsDir, { recursive: true });

            const fileName = `job_${uuidv4()}.b64`;
            const filePath = path.join(jobsDir, fileName);

            // Save raw base64 to file
            fs.writeFileSync(filePath, payload.imageBase64);

            // Replace in payload with reference
            internalPayload.imageBase64 = `file://${fileName}`;
            console.log(`💾 [Worker] Large payload offloaded to: ${fileName}`);
        } catch (e) {
            console.error("❌ [Worker] Failed to offload large payload:", e);
        }
    }

    return prisma.job.create({
        data: {
            type,
            payload: JSON.stringify(internalPayload),
            status: 'PENDING'
        }
    });
}

/**
 * Sequential Worker Loop
 */
export async function startWorker() {
    console.log("🚀 [Worker] Starting Job Processor...");

    // Start Heartbeat Timer
    let isHeartbeating = false;
    const updateHeartbeat = async () => {
        if (isHeartbeating) return;
        isHeartbeating = true;
        try {
            await (prisma as any).systemHeartbeat.upsert({
                where: { id: 'singleton' },
                update: { timestamp: new Date(), status: 'OK' },
                create: { id: 'singleton', timestamp: new Date(), status: 'OK' }
            });
            console.log("💓 [Worker] Heartbeat updated");
        } catch (e) {
            console.error("💔 [Worker] Heartbeat failed:", e);
        } finally {
            isHeartbeating = false;
        }
    };

    // --- INTELLIGENT SCHEDULER (5/15 Min Polling) ---
    let lastFullLogisticsSync = 0;
    let lastPriorityLogisticsSync = 0;

    const runScheduler = async () => {
        console.log("⏰ [Worker] Running Intelligent Scheduler...");
        const now = Date.now();
        try {
            // 1. Shopify Sync (Every 2 min, as before)
            const shopifyExisting = await prisma.job.findFirst({
                where: { type: 'SHOPIFY_SYNC', status: { in: ['PENDING', 'PROCESSING'] } }
            });
            if (!shopifyExisting) {
                console.log(`🆕 [Worker] Auto-Enqueuing critical job: SHOPIFY_SYNC`);
                await createJob('SHOPIFY_SYNC', {});
            }

            // 2. Logistics Sync (Intelligent Polling - Hardening 6.4)
            const logisticsExisting = await prisma.job.findFirst({
                where: { type: 'LOGISTICS_SYNC', status: { in: ['PENDING', 'PROCESSING'] } }
            });

            if (!logisticsExisting) {
                const fiveMin = 5 * 60 * 1000;
                const tenMin = 10 * 60 * 1000;
                const sixtyMin = 60 * 60 * 1000;

                // Priority 1: PREPARACION / ACTIVE (5 min)
                if (now - lastPriorityLogisticsSync > fiveMin) {
                    console.log(`🆕 [Worker] Auto-Enqueuing PRIORITY Logistics Sync (Active/5m)`);
                    await createJob('LOGISTICS_SYNC', { segment: 'ACTIVE', priority: true });
                    lastPriorityLogisticsSync = now;
                }
                // Priority 2: EN TRANSITO (10 min)
                else if (now - lastFullLogisticsSync > tenMin) {
                    console.log(`🆕 [Worker] Auto-Enqueuing TRANSIT Logistics Sync (10m)`);
                    await createJob('LOGISTICS_SYNC', { segment: 'TRANSIT' });
                    lastFullLogisticsSync = now;
                }
                // Priority 3: FINAL RECONCILLATION (60 min)
                else if (now - (global as any).lastFinalLogisticsSync > sixtyMin) {
                    console.log(`🆕 [Worker] Auto-Enqueuing FINAL Logistics Reconcillation (60m)`);
                    await createJob('LOGISTICS_SYNC', { segment: 'FINAL' });
                    (global as any).lastFinalLogisticsSync = now;
                }
            }

            // 3. Meta Sync (Every 30-60 min - let's do 30 min)
            // ... can add similar logic for Meta if needed
        } catch (e) {
            console.error("❌ [Worker] Scheduler Error:", e);
        }
    };

    // Initial run and interval
    updateHeartbeat();
    runScheduler();

    setInterval(updateHeartbeat, 60000); // 60s
    setInterval(runScheduler, 60000); // 1 minute (Near-Instant)

    while (true) {
        let job: any = null;
        try {
            // 1. Find a pending job
            job = await prisma.job.findFirst({
                where: {
                    status: 'PENDING',
                    runAt: { lte: new Date() }
                },
                orderBy: { createdAt: 'asc' }
            });

            if (!job) {
                await new Promise(r => setTimeout(r, 5000)); // Sleep if no jobs
                continue;
            }

            // 2. Lock the job
            await prisma.job.update({
                where: { id: job.id },
                data: {
                    status: 'PROCESSING',
                    lockedAt: new Date(),
                    attempts: { increment: 1 }
                }
            });

            console.log(`📦 [Worker] Processing Job ${job.id} (${job.type})`);

            // 3. Execute
            const handler = Handlers[job.type];
            if (!handler) {
                throw new Error(`No handler registered for type ${job.type}`);
            }

            const payload = JSON.parse(job.payload || '{}');
            const result = await handler.handle(payload, async (p) => {
                await prisma.job.update({
                    where: { id: job.id },
                    data: { progress: p }
                });
            });

            // 4. Complete
            await prisma.job.update({
                where: { id: job.id },
                data: {
                    status: 'COMPLETED',
                    progress: 100,
                    result: JSON.stringify(result),
                    lockedAt: null
                }
            });

            console.log(`✅ [Worker] Job ${job.id} Completed`);

        } catch (error: any) {
            console.error(`❌ [Worker] Job Error:`, error);

            if (job) {
                // 5. Handle failure with granular reporting
                const errorMessage = error.message || String(error);
                const isQuotaError = errorMessage.includes('quota') || errorMessage.includes('rate limit');
                const isAuthError = errorMessage.includes('token') || errorMessage.includes('unauthorized') || errorMessage.includes('permission');

                try {
                    await (prisma as any).job.update({
                        where: { id: job.id },
                        data: {
                            status: 'FAILED',
                            lastError: errorMessage,
                            lockedAt: null,
                            result: JSON.stringify({
                                errorType: isQuotaError ? 'QUOTA_EXCEEDED' : isAuthError ? 'AUTH_FAILED' : 'INTERNAL_ERROR',
                                errorCode: error.code || 'UNKNOWN',
                                timestamp: new Date().toISOString()
                            })
                        }
                    });
                } catch (updateError) {
                    console.error("💔 [Worker] Critical: Failed to update job status to FAILED:", updateError);
                }
            }

            // SAFETY: Always sleep on error to prevent CPU-killing infinite loops
            await new Promise(r => setTimeout(r, 2000));
        }
    }
}

