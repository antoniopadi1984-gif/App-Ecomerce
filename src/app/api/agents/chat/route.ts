import { NextRequest, NextResponse } from 'next/server';
import { agentDispatcher } from '@/lib/agents/agent-dispatcher';
import { AgentRole } from '@/lib/agents/agent-registry';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        const { role, prompt, context, storeId, productId } = await req.json();
        if (!prompt) return NextResponse.json({ error: 'prompt requerido' }, { status: 400 });

        // Crear registro inicial de la ejecución
        // Nota: Adaptado al esquema actual (input/output/status)
        const agentRun = await prisma.agentRun.create({
            data: {
                storeId: storeId || 'store-main',
                agentProfileId: role || 'general',
                input: prompt.slice(0, 2000),
                status: 'RUNNING',
            }
        });

        const result = await agentDispatcher.dispatch({ 
            role: role as AgentRole, 
            prompt, 
            context,
            storeId 
        });

        // Actualizar con el resultado
        await prisma.agentRun.update({
            where: { id: agentRun.id },
            data: {
                status: 'SUCCESS',
                output: result.text.slice(0, 5000),
                latency: result.usage?.totalTokens || 0, // Usamos latency para guardar tokens si no existe tokensUsed
            }
        });

        return NextResponse.json({
            success: true,
            runId: agentRun.id,
            role: result.role,
            model: result.model,
            content: result.text, // Mapeamos result.text -> content para la respuesta esperada
            usage: result.usage,
            cost: result.cost,
        });
    } catch (e: any) {
        console.error('[Agent Chat API Error]:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const storeId = searchParams.get('storeId');
        const runs = await prisma.agentRun.findMany({
            where: storeId ? { storeId } : {},
            orderBy: { createdAt: 'desc' },
            take: 20,
        });
        return NextResponse.json(runs);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
