import { NextRequest, NextResponse } from 'next/server';
import { AGENT_CONFIGS } from '@/lib/agents/agent-registry';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const dbProfiles = await prisma.agentProfile.findMany();
        // AGENT_CONFIGS es un Record, lo convertimos a array para el mapeo
        const merged = Object.values(AGENT_CONFIGS).map((config: any) => {
            const dbProfile = dbProfiles.find(p => p.role === config.role);
            return { 
                ...config, 
                systemPrompt: undefined, 
                dbOverride: dbProfile || null 
            };
        });
        return NextResponse.json(merged);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const { role, model, enabled, storeId } = await req.json();
        if (!role) return NextResponse.json({ error: 'role requerido' }, { status: 400 });

        // Nota: El modelo AgentProfile en el esquema actual requiere storeId y usa isActive
        // Dado que no hay un índice único solo en 'role', usamos findFirst + update/create
        // o asumimos que queremos el del store principal si no viene storeId
        const activeStoreId = storeId || 'store-main';

        const existing = await prisma.agentProfile.findFirst({
            where: { role, storeId: activeStoreId }
        });

        let profile;
        if (existing) {
            profile = await prisma.agentProfile.update({
                where: { id: existing.id },
                data: { 
                    model, 
                    isActive: enabled ?? true 
                },
            });
        } else {
            profile = await prisma.agentProfile.create({
                data: { 
                    role, 
                    model: model || 'gemini-3.1-flash-lite-preview', 
                    isActive: enabled ?? true,
                    storeId: activeStoreId,
                    name: role, // El nombre es obligatorio
                },
            });
        }

        return NextResponse.json(profile);
    } catch (e: any) {
        console.error('[Agent Config PUT Error]:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
