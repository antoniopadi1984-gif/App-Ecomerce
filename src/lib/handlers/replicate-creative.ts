import { JobHandler } from "../worker";
import { prisma } from "../prisma";
import { replicateClient } from "../replicate-client";
import { resolveModel } from "../ai/model-registry";
import path from "path";
import fs from "fs";

/**
 * Replicate Creative Handler
 * This worker triggers the prediction on Replicate.
 * In robust mode, it also waits for completion and finalizes.
 */
const replicateCreativeHandler: JobHandler = {
    handle: async (payload, onProgress, jobId) => {
        const { batchId, type, tier, inputSpec } = payload;

        console.log(`[ReplicateWorker] Running Job: ${jobId} (Batch: ${batchId})`);

        await onProgress(10);

        // 1. Fetch Job from DB
        const db = prisma as any;
        const job = await db.creativeJob.findUnique({
            where: { id: jobId },
            include: { batch: true }
        });

        if (!job) throw new Error(`Job not found: ${jobId}`);
        if (job.status !== 'PENDING') {
            console.log(`[ReplicateWorker] Job already in state: ${job.status}. Skipping.`);
            return { skipped: true, reason: 'Already processed' };
        }

        // 2. Resolve Model via Registry
        const model = resolveModel(type, tier);
        await onProgress(30);

        // 3. Create Prediction via Centralized Client
        try {
            const prediction = await replicateClient.createPrediction({
                jobId,
                ref: model.ref,
                version: model.version,
                input: inputSpec,
                isImage: type === 'STATIC_AD'
            });

            await onProgress(50);

            // 4. Update Job with Prediction ID
            await db.creativeJob.update({
                where: { id: jobId },
                data: {
                    replicatePredictionId: prediction.id,
                    status: 'STARTING',
                    costEstimate: model.estimatedCost || 0
                }
            });

            // 5. ROBUST FALLBACK: Wait for completion and finalize
            console.log(`⏳ [Worker] Waiting for Replicate prediction ${prediction.id} (Creative)...`);
            const finalPrediction = await replicateClient.waitForPrediction(prediction.id);

            if (finalPrediction.status === 'succeeded' && finalPrediction.output) {
                console.log(`✅ [Worker] Creative Prediction succeeded! Finalizing.`);

                const output = finalPrediction.output;
                const outputUrls = Array.isArray(output) ? output : [output];
                const primaryUrl = outputUrls[0];

                // Download to Local
                const uploadsDir = path.resolve(process.cwd(), "public", "uploads", "creative");
                const ext = type === 'STATIC_AD' ? 'png' : 'mp4';
                const fileName = `${jobId}_original.${ext}`;
                const localPath = path.join(uploadsDir, fileName);

                await replicateClient.downloadFile(primaryUrl, localPath);
                const publicUrl = `/uploads/creative/${fileName}`;

                // Mark Job as Succeeded in DB (so it matches the finalize logic if it were called by webhook)
                await db.creativeJob.update({
                    where: { id: jobId },
                    data: {
                        status: 'SUCCEEDED',
                        resultJson: JSON.stringify(finalPrediction),
                        costActual: model.estimatedCost // Use estimate for now if not returned
                    }
                });

                // Note: In a production environment, we could still create a REPLICATE_FINALIZE job
                // but since we are doing it here for robustness, we'll just return success.
                // However, to keep compatibility with the library/registry system, 
                // we'll update the generated creative here if possible.

                const creativeData: any = {
                    productId: job.batch.productId,
                    storeId: job.batch.storeId,
                    type: type === 'STATIC_AD' ? 'IMAGE' : 'VIDEO',
                    videoUrl: publicUrl,
                    concept: `Generación Automática - Batch ${job.batch.id}`,
                    prompt: inputSpec.prompt || '',
                    generationCost: model.estimatedCost || 0,
                    metadataJson: JSON.stringify({
                        renditions: { "1:1": publicUrl, "4:5": publicUrl, "9:16": publicUrl },
                        batchId: job.batch.id,
                        jobId: job.id,
                        predictionId: prediction.id
                    })
                };

                await db.generatedCreative.create({
                    data: {
                        ...creativeData,
                        status: 'GENERATED'
                    }
                });

                // Update Batch failure count? No, but update completed? 
                // The batch update logic is usually in finalize. 
                // Let's increment costActual in batch
                await db.creativeBatch.update({
                    where: { id: job.batch.id },
                    data: { costActual: { increment: model.estimatedCost || 0 } }
                });
            }

            await onProgress(100);
            return { success: true, predictionId: prediction.id };

        } catch (error: any) {
            console.error(`[ReplicateWorker] Error triggering prediction:`, error);

            await db.creativeJob.update({
                where: { id: jobId },
                data: {
                    status: 'FAILED',
                    error: error.message || String(error)
                }
            });

            // Update Batch failure count
            await db.creativeBatch.update({
                where: { id: batchId },
                data: { failureCount: { increment: 1 } }
            });

            throw error;
        }
    }
};

export default replicateCreativeHandler;
