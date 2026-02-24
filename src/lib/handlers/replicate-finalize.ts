import { JobHandler } from "../worker";
import { prisma } from "../prisma";
import { CreativeStorageService } from "../creative/services/creative-storage-service";
import fs from "fs";
import path from "path";
import axios from "axios";

/**
 * Replicate Finalize Handler
 * Downloads result from Replicate, saves to storage, and generates renditions.
 */
const replicateFinalizeHandler: JobHandler = {
    handle: async (payload, onProgress) => {
        const jobId = payload.jobId; // Get from payload if needed
        const { type = 'CREATIVE' } = payload;
        const db = prisma as any;

        if (type === 'AVATAR') {
            const avatar = await db.avatarProfile.findUnique({ where: { id: jobId } });
            if (!avatar || !avatar.metadataJson) throw new Error("Avatar profile not found");

            const metadata = JSON.parse(avatar.metadataJson);
            const output = metadata.webhookUpdate?.output;
            if (!output) throw new Error("No output in avatar webhook data");

            const primaryUrl = Array.isArray(output) ? output[0] : output;

            await onProgress(30);

            const avatarDir = path.resolve(process.cwd(), "public", "api", "avatars", "asset", jobId);
            // Ensure path exists - the current system uses /api/avatars/asset/[id] as a public path
            // But usually maps to data/avatars/[id]/avatar.png
            const storageDir = path.resolve(process.cwd(), "data", "avatars", jobId);
            if (!fs.existsSync(storageDir)) fs.mkdirSync(storageDir, { recursive: true });

            const localPath = path.join(storageDir, "avatar.png");

            console.log(`[Finalize-Avatar] Downloading ${primaryUrl} to ${localPath}`);
            const response = await axios({ method: 'GET', url: primaryUrl, responseType: 'stream' });
            const writer = fs.createWriteStream(localPath);
            response.data.pipe(writer);
            await new Promise<void>((resolve, reject) => {
                writer.on('finish', () => resolve());
                writer.on('error', (err) => reject(err));
            });

            await db.avatarProfile.update({
                where: { id: jobId },
                data: {
                    imageUrl: `/api/avatars/asset/${jobId}`,
                    status: 'READY_IMAGE'
                }
            });

            await onProgress(100);
            return { success: true };
        }

        const job = await db.creativeJob.findUnique({
            where: { id: jobId },
            include: { batch: true }
        });

        if (!job || !job.resultJson) throw new Error("Job or results not found");

        await onProgress(10);
        const result = JSON.parse(job.resultJson);
        const output = result.output;

        if (!output) throw new Error("No output in Replicate result");

        // Unified URL array (some models return string, some array)
        const outputUrls = Array.isArray(output) ? output : [output];
        const primaryUrl = outputUrls[0];

        await onProgress(30);

        // 1. Download to Local / GCS
        // Using a simplified local storage for this implementation
        const uploadsDir = path.resolve(process.cwd(), "public", "uploads", "creative");
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

        const ext = job.batch.type === 'STATIC_AD' ? 'png' : 'mp4';
        const fileName = `${jobId}_original.${ext}`;
        const localPath = path.join(uploadsDir, fileName);

        console.log(`[Finalize] Downloading ${primaryUrl} to ${localPath}`);
        const response = await axios({
            method: 'GET',
            url: primaryUrl,
            responseType: 'stream'
        });

        const writer = fs.createWriteStream(localPath);
        response.data.pipe(writer);

        await new Promise<void>((resolve, reject) => {
            writer.on('finish', () => resolve());
            writer.on('error', (err) => reject(err));
        });

        await onProgress(60);

        // 2. Generate Renditions (Simulated for this phase)
        // In a real scenario, we'd use Sharp (images) or FFmpeg (videos)
        const publicUrl = `/uploads/creative/${fileName}`;
        const renditions = {
            "1:1": publicUrl, // Placeholders for now
            "4:5": publicUrl,
            "9:16": publicUrl
        };

        // 3. Persist in Creative Storage
        const creativeData: any = {
            productId: job.batch.productId,
            storeId: job.batch.storeId,
            type: job.batch.type === 'STATIC_AD' ? 'IMAGE' : 'VIDEO',
            videoUrl: publicUrl,
            concept: `Generación Automática - Batch ${job.batch.id}`,
            prompt: job.payloadJson ? JSON.parse(job.payloadJson).prompt : '',
            generationCost: job.costActual || 0,
            metadataJson: JSON.stringify({
                renditions,
                batchId: job.batch.id,
                jobId: job.id,
                predictionId: job.replicatePredictionId
            })
        };

        if (creativeData.type === 'VIDEO') {
            await CreativeStorageService.saveVideo(creativeData);
        } else {
            // Placeholder for saveImage if needed, or generic create
            await db.generatedCreative.create({
                data: {
                    ...creativeData,
                    status: 'GENERATED'
                }
            });
        }

        await onProgress(90);

        // 4. Update Batch Cost Total
        await db.creativeBatch.update({
            where: { id: job.batch.id },
            data: {
                costActual: { increment: job.costActual || 0 }
            }
        });

        // Check if batch is completed
        const uncompletedJobs = await db.creativeJob.count({
            where: {
                batchId: job.batch.id,
                status: { notIn: ['SUCCEEDED', 'FAILED', 'CANCELED'] }
            }
        });

        if (uncompletedJobs === 0) {
            await db.creativeBatch.update({
                where: { id: job.batch.id },
                data: { status: 'COMPLETED' }
            });
        }

        await onProgress(100);
        return { success: true, url: publicUrl, renditions };
    }
};

export default replicateFinalizeHandler;
