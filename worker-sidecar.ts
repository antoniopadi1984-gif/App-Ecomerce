
import { PrismaClient } from '@prisma/client';
import { MediaCleaningPipeline } from './src/lib/media/pipeline';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();
const CONCURRENCY_LIMIT = 5;

async function processCapture(capture: any) {
    try {
        console.log(`[Worker] Cleaning ${capture.id} (${capture.assetType})...`);

        // 1. Create or get job
        const totalSteps = capture.assetType === 'VIDEO' ? MediaCleaningPipeline.VIDEO_STEPS.length : MediaCleaningPipeline.IMAGE_STEPS.length;

        // @ts-ignore
        const job = await prisma.mediaJob.upsert({
            where: { captureId: capture.id },
            create: {
                captureId: capture.id,
                status: 'PROCESSING',
                totalSteps,
                stepsLog: JSON.stringify([])
            },
            update: {
                status: 'PROCESSING',
                totalSteps,
                currentStep: 0,
                stepsLog: JSON.stringify([])
            }
        });

        const type = (capture.assetType === 'VIDEO' || capture.assetType === 'GIF') ? 'video' : 'image';

        const result = await MediaCleaningPipeline.clean(
            capture.storeId,
            capture.assetUrl,
            type,
            async (stepNum, stepName) => {
                // Background progress update
                const currentLogs = JSON.parse(job.stepsLog || '[]');
                currentLogs.push({ step: stepName, status: 'DONE', timestamp: new Date().toISOString() });

                // @ts-ignore
                await prisma.mediaJob.update({
                    where: { id: job.id },
                    data: {
                        currentStep: stepNum,
                        stepsLog: JSON.stringify(currentLogs)
                    }
                });
            }
        );

        // @ts-ignore
        await prisma.extensionCapture.update({
            where: { id: capture.id },
            data: {
                cleanedUrl: result.cleanedUrl,
                audioJson: result.audioPaths ? JSON.stringify(result.audioPaths) : null,
                status: 'CLEANED'
            }
        });

        // @ts-ignore
        await prisma.mediaJob.update({
            where: { id: job.id },
            data: { status: 'COMPLETED' }
        });

        console.log(`[Worker] Successfully cleaned ${capture.id}`);
    } catch (e: any) {
        console.error(`[Worker] Failed to clean ${capture.id}:`, e);
        try {
            await prisma.extensionCapture.update({
                where: { id: capture.id },
                data: { status: 'FAILED_CLEANING' }
            });

            // @ts-ignore
            await prisma.mediaJob.update({
                where: { captureId: capture.id },
                data: {
                    status: 'FAILED',
                    error: e.message
                }
            });
        } catch (dbError) {
            console.error('[Worker] Fatal database error during error reporting:', dbError);
        }
    }
}

async function main() {
    console.log(`🚀 Worker Sidecar starting... (Concurrency limit: ${CONCURRENCY_LIMIT})`);

    while (true) {
        try {
            const captures = await prisma.extensionCapture.findMany({
                where: {
                    status: 'PENDING_CLEANING'
                },
                take: CONCURRENCY_LIMIT
            });

            if (captures.length > 0) {
                console.log(`[Worker] Found ${captures.length} captures to process. Processing in parallel...`);
                // Process batch in parallel
                await Promise.all(captures.map(c => processCapture(c)));
            } else {
                // No captures, wait a bit
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        } catch (error) {
            console.error('[Worker] Loop error:', error);
            await new Promise(resolve => setTimeout(resolve, 10000));
        }
    }
}

main()
    .catch(e => {
        console.error('Worker crashed:', e);
        process.exit(1);
    });
