import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/usage/summary
 * 
 * Obtener resumen de uso de APIs
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const storeId = searchParams.get('storeId');
        const days = parseInt(searchParams.get('days') || '30');

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Obtener logs de uso de AI
        const usageLogs = await prisma.aiUsageLog.findMany({
            where: {
                ...(storeId && { storeId }),
                createdAt: { gte: startDate }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Agrupar por modelo/servicio
        const byModel: Record<string, {
            count: number;
            totalTokens: number;
            totalCost: number;
        }> = {};

        usageLogs.forEach(log => {
            const model = log.model || 'unknown';
            if (!byModel[model]) {
                byModel[model] = { count: 0, totalTokens: 0, totalCost: 0 };
            }
            byModel[model].count += 1;
            byModel[model].totalTokens += (log.inputTokens || 0) + (log.outputTokens || 0);
            byModel[model].totalCost += log.estimatedCostEur || 0;
        });

        // Calcular totales
        const totalCost = Object.values(byModel).reduce((sum, m) => sum + m.totalCost, 0);
        const totalCalls = usageLogs.length;

        // Agrupar por día para gráfico
        const byDay: Record<string, number> = {};
        usageLogs.forEach(log => {
            const day = log.createdAt.toISOString().split('T')[0];
            byDay[day] = (byDay[day] || 0) + (log.estimatedCostEur || 0);
        });

        return NextResponse.json({
            success: true,
            summary: {
                totalCost,
                totalCalls,
                period: `${days} days`,
                byModel,
                byDay
            }
        });

    } catch (error: any) {
        console.error('[API] Error fetching usage:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

/**
 * POST /api/usage/log
 * 
 * Registrar uso de API
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { storeId, model, feature, tokensUsed, cost, provider } = body;

        await prisma.aiUsageLog.create({
            data: {
                storeId: storeId || null,
                model,
                taskType: feature || 'unknown',
                provider: provider || 'unknown',
                inputTokens: tokensUsed || body.inputTokens || 0,
                outputTokens: body.outputTokens || 0,
                estimatedCostEur: cost || body.estimatedCostEur || 0,
                status: 'COMPLETED'
            }
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('[API] Error logging usage:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
