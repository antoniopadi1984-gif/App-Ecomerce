import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AiRouter } from '@/lib/ai/router';
import { TaskType } from '@/lib/ai/providers/interfaces';
import { getAgentSystemPrompt } from '@/lib/agents/agent-utils';

export const maxDuration = 60;
export const runtime = 'nodejs';

/**
 * Endpoint dinámico para los agentes de EcomBoom
 * Soporta /api/agents/finanzas-chat, /api/agents/director-chat, etc.
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ agentSlug: string }> }
) {
    try {
        const { agentSlug } = await params;
        const body = await request.json();
        const { messages, context, storeId } = body;

        if (!messages || !Array.isArray(messages) || !storeId) {
            return NextResponse.json(
                { success: false, error: 'messages (Array) and storeId are required' },
                { status: 400 }
            );
        }

        // Extraer el nombre del módulo del slug (ej: finanzas-chat -> finanzas)
        const moduloId = agentSlug.replace('-chat', '');

        // Obtener prompt centralizado (REGLA ABSOLUTA)
        const systemPrompt = await getAgentSystemPrompt(storeId, moduloId);

        // --- ENRIQUECIMIENTO DE CONTEXTO ---
        let finalContext = { ...context };

        // Si es el Director, buscamos el Scorecard GLOBAL para cumplir regla de "todos los módulos"
        if (moduloId === 'director') {
            try {
                // Fetch direct from Prisma for speed and completeness
                const now = new Date();
                const month = now.getMonth() + 1;
                const year = now.getFullYear();

                // Resumen rápido de finanzas del mes
                const finances = await (prisma as any).dailyFinance.findMany({
                    where: { storeId, date: { gte: new Date(year, month - 1, 1), lt: new Date(year, month, 1) } },
                });

                const totals = finances.reduce((acc: any, curr: any) => ({
                    revenue: acc.revenue + (curr.totalRevenue || 0),
                    adSpend: acc.adSpend + (curr.adSpend || 0),
                    orders: acc.orders + (curr.ordersCount || 0),
                    netProfit: acc.netProfit + (curr.netProfit || 0),
                }), { revenue: 0, adSpend: 0, orders: 0, netProfit: 0 });

                // Resumen de CRM (pedidos rpa/pendientes)
                const pendingOrders = await (prisma as any).order.count({
                    where: { storeId, status: { in: ['PENDING', 'pending', 'MANUAL_REVIEW'] } }
                });

                // Resumen de Creativos
                const totalCreatives = await (prisma as any).creativeAsset.count({ where: { storeId } });

                finalContext = {
                    ...finalContext,
                    globalData: {
                        month: `${month}/${year}`,
                        finances: totals,
                        crm: { pendingOrders },
                        creative: { totalCreatives },
                        message: "VISION GLOBAL ACTIVADA: El Director tiene acceso a todos los módulos."
                    }
                };
            } catch (e) {
                console.error("Error fetching global context for Director:", e);
            }
        }

        // Construir el prompt final incluyendo el contexto enriquecido
        const latestMessage = messages[messages.length - 1].content;
        const historyContext = messages.slice(0, -1).map(m => `${m.role === 'user' ? 'Usuario' : 'Asistente'}: ${m.content}`).join('\n');

        const fullPrompt = `
SISTEMA: ${systemPrompt}

CONTEXTO ENRIQUECIDO (SNAPSHOT):
${JSON.stringify(finalContext, null, 2)}

HISTORIAL RECIENTE:
${historyContext}

ULTIMO MENSAJE DEL USUARIO:
${latestMessage}
`.trim();

        // Ejecutar vía AiRouter
        const result = await AiRouter.dispatch(
            storeId,
            TaskType.RESEARCH_FAST,
            fullPrompt,
            { context: systemPrompt }
        );

        // Log de acción del agente
        await prisma.agentAction.create({
            data: {
                storeId,
                agentRole: moduloId.toUpperCase(),
                input: latestMessage,
                output: result.text,
                tokensUsed: result.usage ? (result.usage.inputTokens + result.usage.outputTokens) : 0,
            } as any,
        }).catch(() => { });

        return NextResponse.json({
            success: true,
            response: result.text,
            model: result.raw?.model || 'unknown',
        });

    } catch (error: any) {
        console.error(`[api/agents/chat] Error:`, error);
        return NextResponse.json(
            { success: false, error: error.message || 'Error interno' },
            { status: 500 }
        );
    }
}
