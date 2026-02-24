import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveModel } from "@/lib/ai/model-registry";
import { createJob } from "@/lib/worker";

/**
 * POST /api/creative/batch
 * Creates a mass generation batch and enqueues creative jobs.
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            productId,
            storeId = 'store-main',
            type,
            tier = 'balanced',
            quantity = 1,
            budgetMax,
            specs // Base spec for the jobs
        } = body;

        if (!type || !productId) {
            return NextResponse.json({ error: "Missing type or productId" }, { status: 400 });
        }

        const model = resolveModel(type, tier);
        const costEstimate = (model.estimatedCost || 0) * quantity;

        // 1. Create Batch
        const db = prisma as any;
        const batch = await db.creativeBatch.create({
            data: {
                productId,
                storeId,
                type,
                tier,
                quantity,
                budgetMax,
                costEstimate,
                status: 'PROCESSING',
                metadataJson: JSON.stringify(specs)
            }
        });

        console.log(`[BatchAPI] Created Batch: ${batch.id} (${quantity} jobs)`);

        // 2. Create N Jobs
        const jobsData = Array.from({ length: quantity }).map(() => ({
            batchId: batch.id,
            status: 'PENDING',
            payloadJson: JSON.stringify(specs),
            costEstimate: model.estimatedCost || 0
        }));

        // Prisma batch create
        await db.creativeJob.createMany({
            data: jobsData
        });

        // Fetch the created jobs to get their IDs for enqueuing
        const createdJobs = await db.creativeJob.findMany({
            where: { batchId: batch.id }
        });

        // 3. Enqueue Jobs in the worker system
        for (const job of createdJobs) {
            await createJob('REPLICATE_CREATIVE', {
                jobId: job.id,
                batchId: batch.id,
                type,
                tier,
                inputSpec: specs
            });
        }

        return NextResponse.json({
            success: true,
            batchId: batch.id,
            jobCount: createdJobs.length,
            costEstimate
        });

    } catch (error: any) {
        console.error("[BatchAPI] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
