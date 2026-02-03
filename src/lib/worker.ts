
import prisma from "./prisma";

export type JobType = 'VIDEO_STT' | 'VIDEO_RENDER' | 'SHOPIFY_SYNC' | 'LOGISTICS_SYNC' | 'AI_EXTRACT' | 'MAINTENANCE' | 'UPDATE_CHECK';

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
}

export function registerHandler(type: JobType, handler: JobHandler) {
    Handlers[type] = handler;
}

export async function createJob(type: JobType, payload: any) {
    return prisma.job.create({
        data: {
            type,
            payload: JSON.stringify(payload),
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
    setInterval(async () => {
        try {
            await (prisma as any).systemHeartbeat.upsert({
                where: { id: 'singleton' },
                update: { timestamp: new Date(), status: 'OK' },
                create: { id: 'singleton', timestamp: new Date(), status: 'OK' }
            });
        } catch (e) {
            console.error("💔 [Worker] Heartbeat failed:", e);
        }
    }, 30000); // Every 30s

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
            }
        }
    }
}

