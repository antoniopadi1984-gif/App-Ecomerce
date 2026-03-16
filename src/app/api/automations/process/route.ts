import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { executeAutomations } from "@/lib/automation/executor";

export const maxDuration = 60;
export const runtime = "nodejs";

/**
 * GET /api/automations/process
 * Cron job — procesa automatizaciones diferidas pendientes (D+3, D+7, D+14)
 * Vercel cron: "0 9 * * *" (cada día a las 9:00)
 */
export async function GET(req: NextRequest) {
    try {
        const now = new Date();

        const pending = await (prisma as any).scheduledAutomation.findMany({
            where: {
                status: "PENDING",
                scheduledAt: { lte: now },
            },
            take: 50,
        }).catch(() => []);

        const results = [];

        for (const job of pending) {
            try {
                const result = await executeAutomations(
                    job.storeId,
                    job.trigger,
                    job.orderId
                );

                await (prisma as any).scheduledAutomation.update({
                    where: { id: job.id },
                    data: {
                        status: result.errors.length === 0 ? "DONE" : "ERROR",
                        processedAt: new Date(),
                    },
                }).catch(() => {});

                results.push({ id: job.id, ruleId: job.ruleId, ...result });
            } catch (e: any) {
                results.push({ id: job.id, error: e.message });
            }
        }

        return NextResponse.json({ processed: results.length, results });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
