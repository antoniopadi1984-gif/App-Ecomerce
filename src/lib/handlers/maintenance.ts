import { JobHandler } from "../worker";
import prisma from "../prisma";
import fs from "fs";
import path from "path";

const maintenanceHandler: JobHandler = {
    handle: async (payload, onProgress) => {
        const stats = {
            deletedFiles: 0,
            freedBytes: 0,
            jobsCleaned: 0
        };

        const uploadDir = path.join(process.cwd(), "public/uploads");
        const outputDir = path.join(process.cwd(), "public/outputs");
        const now = Date.now();

        await onProgress(10);

        // 1. Clean Uploads (TTL 48h)
        const uploadTTL = 48 * 60 * 60 * 1000;
        if (fs.existsSync(uploadDir)) {
            const files = fs.readdirSync(uploadDir);
            for (const file of files) {
                const filePath = path.join(uploadDir, file);
                const stat = fs.statSync(filePath);
                if (now - stat.mtimeMs > uploadTTL) {
                    // Safety: check if referenced in DB
                    const isReferenced = await checkReferences(file);
                    if (!isReferenced) {
                        fs.unlinkSync(filePath);
                        stats.deletedFiles++;
                        stats.freedBytes += stat.size;
                    }
                }
            }
        }

        await onProgress(50);

        // 2. Clean Outputs (TTL 14d) - Strict
        const outputTTL = 14 * 24 * 60 * 60 * 1000;
        if (fs.existsSync(outputDir)) {
            const files = fs.readdirSync(outputDir);
            for (const file of files) {
                const filePath = path.join(outputDir, file);
                const stat = fs.statSync(filePath);
                if (now - stat.mtimeMs > outputTTL) {
                    const isReferenced = await checkReferences(file);
                    if (!isReferenced) {
                        fs.unlinkSync(filePath);
                        stats.deletedFiles++;
                        stats.freedBytes += stat.size;
                    }
                }
            }
        }

        await onProgress(80);

        // 3. Clean Jobs (> 30 days)
        const jobTTL = new Date(now - 30 * 24 * 60 * 60 * 1000);
        const deletedJobs = await (prisma as any).job.deleteMany({
            where: {
                status: { in: ['COMPLETED', 'FAILED'] },
                updatedAt: { lt: jobTTL }
            }
        });
        stats.jobsCleaned = deletedJobs.count;

        await onProgress(100);
        return stats;
    }
};

async function checkReferences(filename: string): Promise<boolean> {
    const db = prisma as any;
    // Check key tables
    const refSpy = await db.adSpyCapture.findFirst({
        where: { OR: [{ url: { contains: filename } }, { originalUrl: { contains: filename } }] }
    });
    if (refSpy) return true;

    const refAsset = await db.creativeAsset?.findFirst({
        where: { url: { contains: filename } }
    });
    if (refAsset) return true;

    return false;
}

export default maintenanceHandler;
