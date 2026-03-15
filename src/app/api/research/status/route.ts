import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    const productId = req.nextUrl.searchParams.get('productId');
    if (!productId) return NextResponse.json({ error: 'productId requerido' }, { status: 400 });

    const run = await (prisma as any).researchRun?.findFirst({
        where: { productId },
        orderBy: { createdAt: 'desc' },
        select: {
            id: true, status: true, progress: true,
            currentPhase: true, logs: true, results: true,
            createdAt: true, updatedAt: true
        }
    }) || null;

    // Alternativa: leer desde researchStep si no hay researchRun
    const steps = await (prisma as any).researchStep?.findMany({
        where: { productId },
        orderBy: { createdAt: 'desc' },
        select: { stepKey: true, status: true, createdAt: true }
    }) || [];

    const completedSteps = steps.map((s: any) => s.stepKey);
    const allSteps = ['P1', 'P2', 'P2.1', 'P4', 'P3'];
    const progress = Math.round((completedSteps.length / allSteps.length) * 100);
    const isReady = allSteps.every((s: string) => completedSteps.includes(s));

    return NextResponse.json({
        ok: true,
        runId: run?.id || null,
        status: isReady ? 'READY' : completedSteps.length > 0 ? 'PROCESSING' : 'PENDING',
        progress,
        completedSteps,
        pendingSteps: allSteps.filter((s: string) => !completedSteps.includes(s)),
        currentPhase: run?.currentPhase || completedSteps[completedSteps.length - 1] || null,
        logs: run?.logs || null,
        results: isReady ? (run?.results ? JSON.parse(run.results) : null) : null
    });
}
