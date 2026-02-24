
import prisma from "./prisma";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export type JobType = 'VIDEO_STT' | 'VIDEO_RENDER' | 'SHOPIFY_SYNC' | 'LOGISTICS_SYNC' | 'AI_EXTRACT' | 'MAINTENANCE' | 'UPDATE_CHECK' | 'META_SYNC_ACCOUNTS' | 'GENERATE_AVATAR_IMAGE' | 'CONTENT_ALMANAC' | 'CONTENT_COURSE' | 'CONTENT_EBOOK' | 'REPLICATE_CREATIVE' | 'REPLICATE_FINALIZE';

export interface JobHandler {
    handle: (payload: any, onProgress: (p: number) => Promise<void>, jobId: string) => Promise<any>;
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

    // Content Factory Handlers
    const contentGen = (await import("./handlers/content-gen")).default;
    registerHandler('CONTENT_ALMANAC', contentGen);
    registerHandler('CONTENT_COURSE', contentGen);
    registerHandler('CONTENT_EBOOK', contentGen);

    // Replicate Factory
    registerHandler('REPLICATE_CREATIVE', (await import("./handlers/replicate-creative")).default);
    registerHandler('REPLICATE_FINALIZE', (await import("./handlers/replicate-finalize")).default);
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

const LOCK_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const JOB_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Sequential Worker Loop
 */
export async function startWorker() {
    console.log("🚀 [Worker] Starting Robust Job Processor...");

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
        } catch (e) {
            console.error("💔 [Worker] Heartbeat failed:", e);
        } finally {
            isHeartbeating = false;
        }
    };

    // --- INTELLIGENT SCHEDULER ---
    let lastFullLogisticsSync = 0;
    let lastPriorityLogisticsSync = 0;

    const runScheduler = async () => {
        const now = Date.now();
        try {
            // Shopify Sync
            const shopifyExisting = await prisma.job.findFirst({
                where: { type: 'SHOPIFY_SYNC', status: { in: ['PENDING', 'PROCESSING'] } }
            });
            if (!shopifyExisting) {
                await createJob('SHOPIFY_SYNC', {});
            }

            // Logistics Sync
            const logisticsExisting = await prisma.job.findFirst({
                where: { type: 'LOGISTICS_SYNC', status: { in: ['PENDING', 'PROCESSING'] } }
            });

            if (!logisticsExisting) {
                const fiveMin = 5 * 60 * 1000;
                const tenMin = 10 * 60 * 1000;
                const sixtyMin = 60 * 60 * 1000;

                if (now - lastPriorityLogisticsSync > fiveMin) {
                    await createJob('LOGISTICS_SYNC', { segment: 'ACTIVE', priority: true });
                    lastPriorityLogisticsSync = now;
                }
                else if (now - lastFullLogisticsSync > tenMin) {
                    await createJob('LOGISTICS_SYNC', { segment: 'TRANSIT' });
                    lastFullLogisticsSync = now;
                }
                else if (now - (global as any).lastFinalLogisticsSync > sixtyMin) {
                    await createJob('LOGISTICS_SYNC', { segment: 'FINAL' });
                    (global as any).lastFinalLogisticsSync = now;
                }
            }
        } catch (e) {
            console.error("❌ [Worker] Scheduler Error:", e);
        }
    };

    // Start background loops
    updateHeartbeat();
    runScheduler();
    setInterval(updateHeartbeat, 60000);
    setInterval(runScheduler, 60000);

    while (true) {
        let job: any = null;
        let startTimestamp = Date.now();

        try {
            // 0. Recovery: Reset stale jobs
            const staleJobs = await prisma.job.findMany({
                where: {
                    status: 'PROCESSING',
                    lockedAt: { lt: new Date(Date.now() - LOCK_TIMEOUT_MS) }
                }
            });

            for (const stale of staleJobs) {
                console.warn(`♻️ [Worker] Recovering stale job ${stale.id} (${stale.type})`);
                await prisma.job.update({
                    where: { id: stale.id },
                    data: { status: 'PENDING', lockedAt: null }
                });
            }

            // 1. Find a pending job
            job = await prisma.job.findFirst({
                where: {
                    status: 'PENDING',
                    runAt: { lte: new Date() }
                },
                orderBy: { createdAt: 'asc' }
            });

            if (!job) {
                // Heartbeat log every 30 seconds if idle
                if (Date.now() % 30000 < 5000) {
                    console.log("💤 [Worker] Idle - Waiting for jobs...");
                }
                await new Promise(r => setTimeout(r, 5000));
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

            console.log(`📦 [Worker] [START] job=${job.id} type=${job.type} payload=${job.payload?.substring(0, 100)}...`);

            // 3. Execute with Timeout
            const handler = Handlers[job.type];
            if (!handler) throw new Error(`No handler for type ${job.type}`);

            const payload = JSON.parse(job.payload || '{}');

            // Promise race for execution timeout
            const executionPromise = handler.handle(payload, async (p) => {
                await prisma.job.update({ where: { id: job.id }, data: { progress: p } });
            }, job.id);

            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error("TIMEOUT")), JOB_TIMEOUT_MS);
            });

            const result = await Promise.race([executionPromise, timeoutPromise]);

            // 4. Complete
            const durationMs = Date.now() - startTimestamp;
            await prisma.job.update({
                where: { id: job.id },
                data: {
                    status: 'COMPLETED',
                    progress: 100,
                    result: JSON.stringify(result),
                    lockedAt: null,
                    // Auto-extract auditing fields if handler returned them
                    ...(result?.replicatePredictionId ? { replicatePredictionId: result.replicatePredictionId } : {}),
                    ...(result?.provider ? { provider: result.provider } : {})
                }
            });

            console.log(`✅ [Worker] [DONE] job=${job.id} type=${job.type} duration=${durationMs}ms`);

        } catch (error: any) {
            const durationMs = Date.now() - startTimestamp;
            console.error(`❌ [Worker] [ERROR] job=${job?.id || 'none'} type=${job?.type || 'none'} duration=${durationMs}ms error=`, error.message || error);

            if (job) {
                const errorMessage = error.message || String(error);
                try {
                    await prisma.job.update({
                        where: { id: job.id },
                        data: {
                            status: 'FAILED',
                            lastError: errorMessage,
                            lockedAt: null,
                            result: JSON.stringify({
                                error: errorMessage,
                                timestamp: new Date().toISOString()
                            })
                        }
                    });
                } catch (updateError) {
                    console.error("💔 [Worker] Critical failure updating job status:", updateError);
                }
            }

            await new Promise(r => setTimeout(r, 2000));
        }
    }
}

