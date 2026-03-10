import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { replicateClient } from "@/lib/replicate-client";
import { createJob } from "@/lib/worker";

/**
 * POST /api/webhooks/replicate
 * Secure webhook receiver for Replicate predictions.
 */
export async function POST(req: Request) {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get("jobId");
    const token = searchParams.get("token");

    if (!jobId || !token) {
        return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    // 1. Validate HMAC Signature
    if (!replicateClient.validateWebhookToken(jobId, token)) {
        console.error(`[Webhook] Invalid security token for Job: ${jobId}`);
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { status, output, metrics, error } = body;

        console.log(`[Webhook] Received update for Job: ${jobId} (Status: ${status})`);

        const db = prisma as any;

        // --- ROUTING: Avatar vs Creative Job ---
        const avatar = await db.avatarProfile.findUnique({ where: { id: jobId } });

        if (avatar) {
            console.log(`[Webhook] Processing AVATAR update for: ${jobId}`);
            const isTerminal = ['succeeded', 'failed', 'canceled'].includes(status);

            await db.avatarProfile.update({
                where: { id: jobId },
                data: {
                    status: status === 'succeeded' ? 'READY_IMAGE' : (status === 'failed' ? 'FAILED_IMAGE' : 'GENERATING_IMAGE'),
                    lastError: error || undefined,
                    metadataJson: JSON.stringify({
                        ...JSON.parse(avatar.metadataJson || "{}"),
                        webhookUpdate: body
                    })
                }
            });

            if (status === 'succeeded' && output) {
                // For avatars, we can finalize immediately or enqueue a simple download job
                await createJob('REPLICATE_FINALIZE', { jobId, type: 'AVATAR' });
            }
            return NextResponse.json({ ok: true });
        }

        const job = await db.creativeJob.findUnique({
            where: { id: jobId }
        });

        if (!job) {
            console.error(`[Webhook] Job not found: ${jobId}`);
            return NextResponse.json({ ok: true }); // Always 200 to Replicate
        }

        // 2. Idempotency Check: Ignore if already terminal
        if (job.terminalAt || ['SUCCEEDED', 'FAILED', 'CANCELED'].includes(job.status)) {
            console.log(`[Webhook] Job ${jobId} already in terminal state. Ignoring.`);
            return NextResponse.json({ ok: true });
        }

        // 3. Update Job State
        const isTerminal = ['succeeded', 'failed', 'canceled'].includes(status);

        await db.creativeJob.update({
            where: { id: jobId },
            data: {
                status: status.toUpperCase(),
                resultJson: JSON.stringify(body),
                terminalAt: isTerminal ? new Date() : undefined,
                error: error || undefined,
                costActual: metrics?.predict_time ? (metrics.predict_time * 0.001) : undefined // Simplified cost logic
            }
        });

        // 4. If Succeeded, Enqueue Finalization
        if (status === 'succeeded') {
            console.log(`[Webhook] Job ${jobId} succeeded. Enqueuing finalization...`);
            await createJob('REPLICATE_FINALIZE', { jobId, type: 'CREATIVE' });
        }

        return NextResponse.json({ ok: true });

    } catch (err: any) {
        console.error("[Webhook] Processing Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
