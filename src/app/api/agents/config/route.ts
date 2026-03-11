import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AgentId } from '@prisma/client';
import { getAgentSystemPrompt } from '@/lib/agents/agent-utils';

const ALL_AGENT_IDS = Object.values(AgentId);

// Store module/label/description in examples array as a meta entry
function extractMeta(examples: unknown[]): { module?: string; label?: string; description?: string } {
    try {
        const entry = (examples || []).find((e: any) => e?.__meta === true);
        return (entry as any) || {};
    } catch { return {}; }
}

function buildExamples(examples: unknown[], mod?: string, label?: string, description?: string) {
    const cleaned = (examples || []).filter((e: any) => !e?.__meta);
    const meta: Record<string, unknown> = { __meta: true };
    if (mod)         meta.module      = mod;
    if (label)       meta.label       = label;
    if (description) meta.description = description;
    if (Object.keys(meta).length > 1) cleaned.push(meta);
    return cleaned;
}

/**
 * GET /api/agents/config?storeId=X
 * Returns all AgentConfig for a store. Falls back to default prompt if not configured.
 */
export async function GET(req: NextRequest) {
    const storeId = req.nextUrl.searchParams.get('storeId');
    if (!storeId) return NextResponse.json({ error: 'storeId is required' }, { status: 400 });

    try {
        const existingConfigs = await prisma.agentConfig.findMany({ where: { storeId } });

        const fullConfigs = await Promise.all(ALL_AGENT_IDS.map(async (agentId) => {
            const config = existingConfigs.find(c => c.agentId === agentId);
            const meta   = config ? extractMeta(config.examples as unknown[]) : {};
            const examples = (config?.examples as unknown[] || []).filter((e: any) => !e?.__meta);

            if (config) {
                return { agentId, systemPrompt: config.systemPrompt, examples, updatedAt: config.updatedAt, ...meta };
            }
            const defaultPrompt = await getAgentSystemPrompt(storeId, agentId);
            return { agentId, systemPrompt: defaultPrompt, examples: [], updatedAt: new Date() };
        }));

        return NextResponse.json(fullConfigs);
    } catch (e: any) {
        console.error('[API Config GET]', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

/**
 * PUT /api/agents/config
 * Upsert AgentConfig. Also persists module/label/description in examples metadata.
 */
export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { storeId, agentId, systemPrompt, examples, module: mod, label, description } = body;

        if (!storeId || !agentId) {
            return NextResponse.json({ error: 'storeId and agentId are required' }, { status: 400 });
        }

        if (!ALL_AGENT_IDS.includes(agentId as AgentId)) {
            return NextResponse.json({ error: `'${agentId}' no es un AgentId válido` }, { status: 400 });
        }

        const builtExamples = buildExamples(examples || [], mod, label, description) as any[];

        const config = await prisma.agentConfig.upsert({
            where: { storeId_agentId: { storeId, agentId: agentId as AgentId } },
            update: { systemPrompt, examples: builtExamples, updatedAt: new Date() },
            create: {
                storeId,
                agentId: agentId as AgentId,
                systemPrompt: systemPrompt || await getAgentSystemPrompt(storeId, agentId),
                examples: builtExamples,
            },
        });

        const savedMeta = extractMeta(config.examples as unknown[]);
        return NextResponse.json({ ...config, ...savedMeta });

    } catch (e: any) {
        console.error('[API Config PUT]', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const POST = PUT;

/**
 * DELETE /api/agents/config
 * Removes the AgentConfig for a given storeId + agentId (resets to default).
 */
export async function DELETE(req: NextRequest) {
    try {
        const { storeId, agentId } = await req.json();
        if (!storeId || !agentId) {
            return NextResponse.json({ error: 'storeId and agentId required' }, { status: 400 });
        }
        await prisma.agentConfig.deleteMany({
            where: { storeId, agentId: agentId as AgentId }
        });
        return NextResponse.json({ ok: true });
    } catch (e: any) {
        console.error('[API Config DELETE]', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
