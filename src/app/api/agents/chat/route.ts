import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AiRouter } from '@/lib/ai/router';
import { TaskType } from '@/lib/ai/providers/interfaces';

export const maxDuration = 60;
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { message, context, storeId, agentRole } = body;

        if (!message || !storeId) {
            return NextResponse.json(
                { success: false, error: 'message and storeId are required' },
                { status: 400 }
            );
        }

        // Load agent profile if role specified
        let systemPrompt = 'Eres un asistente de operaciones de ecommerce. Responde de forma concisa y accionable.';

        if (agentRole) {
            const profile = await prisma.agentProfile.findFirst({
                where: { storeId, role: agentRole, isActive: true },
            });
            if (profile) {
                systemPrompt = profile.systemPrompt || systemPrompt;
            }
        }

        // Build full prompt with context
        const fullPrompt = context
            ? `CONTEXTO ACTUAL:\n${JSON.stringify(context, null, 2)}\n\nPREGUNTA DEL USUARIO:\n${message}`
            : message;

        const result = await AiRouter.dispatch(
            storeId,
            TaskType.RESEARCH_FAST,
            fullPrompt,
            { context: systemPrompt }
        );

        // Log agent action
        await prisma.agentAction.create({
            data: {
                storeId,
                agentRole: agentRole || 'GENERAL',
                input: message,
                output: result.text,
                tokensUsed: result.usage ? (result.usage.inputTokens + result.usage.outputTokens) : 0,
            } as any,
        }).catch(() => { }); // Non-critical

        return NextResponse.json({
            success: true,
            response: result.text,
            model: result.raw?.model || 'unknown',
        });

    } catch (error: any) {
        console.error('[agents/chat] Error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Error interno' },
            { status: 500 }
        );
    }
}
