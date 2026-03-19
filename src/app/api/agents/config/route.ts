import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DEFAULT_AGENT_PROMPTS } from '@/lib/ai/defaults/agent-prompts';

const SYSTEM_AGENTS_META: Record<string, { label: string; description: string; module: string; emoji: string }> = {
    NEURAL_MOTHER:      { label: 'Neural Mother',       description: 'Agente Jefe — diagnóstico ejecutivo y coordinación total',       module: 'mando',         emoji: '🧠' },
    FUNNEL_ARCHITECT:   { label: 'Funnel Architect',    description: 'Landing + Advertorial + Listicle + Oferta + CRO',               module: 'creativo',      emoji: '🏗️' },
    VIDEO_INTELLIGENCE: { label: 'Video Intelligence',  description: 'Análisis + guión + dirección + UGC — todo sobre vídeo',          module: 'creativo',      emoji: '🎬' },
    IMAGE_DIRECTOR:     { label: 'Image Director',      description: 'Imágenes estáticas + carruseles + JSON para IA',                 module: 'creativo',      emoji: '🎨' },
    CREATIVE_FORENSIC:  { label: 'Creative Forensic',   description: 'Disección forense de vídeos, landings y carruseles',             module: 'investigacion', emoji: '🔍' },
    RESEARCH_CORE:      { label: 'Research Core',       description: 'Investigación P1-P7: producto, avatares, ángulos',              module: 'investigacion', emoji: '🔬' },
    MEDIA_BUYER:        { label: 'Media Buyer',         description: 'Meta Ads: análisis, escalado, diagnóstico de creativos',        module: 'marketing',     emoji: '📡' },
    OPS_COMMANDER:      { label: 'Ops Commander',       description: 'Pedidos, incidencias, equipo, postventa',                      module: 'operaciones',   emoji: '⚙️' },
    DRIVE_INTELLIGENCE: { label: 'Drive Intelligence',  description: 'Organización automática, nomenclatura y clasificación',         module: 'drive',         emoji: '📁' },
};

export async function GET(req: NextRequest) {
    const storeId = req.nextUrl.searchParams.get('storeId');
    if (!storeId) return NextResponse.json({ error: 'storeId is required' }, { status: 400 });

    try {
        const existingConfigs = await (prisma as any).agentConfig.findMany({ where: { storeId } });
        const systemAgentIds = Object.keys(SYSTEM_AGENTS_META);
        const existingIds = new Set(existingConfigs.map((c: any) => c.agentId));

        const systemDefaults = systemAgentIds
            .filter(id => !existingIds.has(id))
            .map(id => ({
                agentId: id,
                systemPrompt: (DEFAULT_AGENT_PROMPTS as any)[id] || '',
                label: SYSTEM_AGENTS_META[id].label,
                description: SYSTEM_AGENTS_META[id].description,
                module: SYSTEM_AGENTS_META[id].module,
                emoji: SYSTEM_AGENTS_META[id].emoji,
                isCustom: false,
                isSystem: true,
                isActive: true
            }));

        const result = [
            ...existingConfigs.map((c: any) => ({
                ...c,
                isSystem: !!SYSTEM_AGENTS_META[c.agentId],
            })),
            ...systemDefaults
        ];

        return NextResponse.json(result);
    } catch (e: any) {
        console.error('[API Config GET]', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { storeId, agentId, systemPrompt, label, description, module: mod, emoji, isCustom, isActive } = body;

        if (!storeId || !agentId) {
            return NextResponse.json({ error: 'storeId and agentId are required' }, { status: 400 });
        }

        const config = await (prisma as any).agentConfig.upsert({
            where: { storeId_agentId: { storeId, agentId } },
            update: { systemPrompt, label, description, module: mod, emoji, isCustom: isCustom ?? true, isActive: isActive ?? true, updatedAt: new Date() },
            create: {
                storeId, agentId,
                systemPrompt: systemPrompt || (DEFAULT_AGENT_PROMPTS as any)[agentId] || '',
                label, description, module: mod, emoji,
                isCustom: isCustom ?? true, isActive: isActive ?? true,
            },
        });

        return NextResponse.json(config);
    } catch (e: any) {
        console.error('[API Config PUT]', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const POST = PUT;

export async function DELETE(req: NextRequest) {
    try {
        const { storeId, agentId } = await req.json();
        if (!storeId || !agentId) {
            return NextResponse.json({ error: 'storeId and agentId required' }, { status: 400 });
        }
        await (prisma as any).agentConfig.delete({
            where: { storeId_agentId: { storeId, agentId } }
        });
        return NextResponse.json({ ok: true });
    } catch (e: any) {
        console.error('[API Config DELETE]', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
