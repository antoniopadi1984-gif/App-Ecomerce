import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AgentId } from '@prisma/client';
import { getAgentSystemPrompt } from '@/lib/agents/agent-utils';

/**
 * GET: Devuelve todos los AgentConfig para un storeId.
 * Si un agentId no tiene config en BD, devuelve el default.
 * POST/PUT: Upsert AgentConfig.
 */

export async function GET(req: NextRequest) {
    const storeId = req.nextUrl.searchParams.get('storeId');

    if (!storeId) {
        return NextResponse.json({ error: "storeId is required" }, { status: 400 });
    }

    try {
        const existingConfigs = await prisma.agentConfig.findMany({
            where: { storeId }
        });

        // Generar lista completa de 11 agentes (AgentId enum)
        const allAgentIds = Object.values(AgentId);

        const fullConfigs = await Promise.all(allAgentIds.map(async (agentId) => {
            const config = existingConfigs.find(c => c.agentId === agentId);

            if (config) {
                return {
                    agentId,
                    systemPrompt: config.systemPrompt,
                    examples: config.examples,
                    updatedAt: config.updatedAt
                };
            }

            // Si no existe, obtener default
            const defaultPrompt = await getAgentSystemPrompt(storeId, agentId);
            return {
                agentId,
                systemPrompt: defaultPrompt,
                examples: [],
                updatedAt: new Date()
            };
        }));

        return NextResponse.json(fullConfigs);

    } catch (e: any) {
        console.error("[API Config GET]", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const { storeId, agentId, systemPrompt, examples } = await req.json();

        if (!storeId || !agentId) {
            return NextResponse.json({ error: "storeId and agentId are required" }, { status: 400 });
        }

        const config = await prisma.agentConfig.upsert({
            where: {
                storeId_agentId: {
                    storeId,
                    agentId: agentId as AgentId
                }
            },
            update: {
                systemPrompt,
                examples: examples || [],
                updatedAt: new Date()
            },
            create: {
                storeId,
                agentId: agentId as AgentId,
                systemPrompt: systemPrompt || await getAgentSystemPrompt(storeId, agentId),
                examples: examples || []
            }
        });

        return NextResponse.json(config);

    } catch (e: any) {
        console.error("[API Config PUT]", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// Mantener POST como alias de PUT para compatibilidad
export const POST = PUT;
