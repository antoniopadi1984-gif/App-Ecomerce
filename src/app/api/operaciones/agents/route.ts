import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const DEFAULT_AGENTS = [
    'FINANZAS', 'CRM', 'CREATIVO', 'INVESTIGACION',
    'MARKETING', 'MANDO', 'OPERACIONES', 'DIRECTOR'
];

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const storeId = searchParams.get('storeId');

        if (!storeId) {
            return NextResponse.json({ error: 'storeId requerido' }, { status: 400 });
        }

        // Cargamos de la nueva tabla agent_configs
        let agents = await prisma.agentConfig.findMany({
            where: { storeId },
        });

        // Asegurar que todos los agentes por defecto existen
        const existingIds = new Set(agents.map(a => a.agentId));
        const missingIds = DEFAULT_AGENTS.filter(id => !existingIds.has(id as any));

        if (missingIds.length > 0) {
            for (const id of missingIds) {
                await prisma.agentConfig.create({
                    data: {
                        storeId,
                        agentId: id as any,
                        systemPrompt: `Eres un experto especializado en ${id}. Responde de forma concisa y estratégica.`,
                        examples: [],
                    }
                });
            }

            agents = await prisma.agentConfig.findMany({
                where: { storeId },
            });
        }

        // Mapear para compatibilidad con el frontend AgentesPage
        const mappedAgents = agents.map(a => ({
            ...a,
            role: a.agentId,
            name: `Agente ${a.agentId}`, // Nombre por defecto
            isActive: true // Por defecto activos ya que no hay columna en el nuevo spec
        }));

        return NextResponse.json({ ok: true, agents: mappedAgents });
    } catch (err: any) {
        console.error('[API /operaciones/agents GET]', err);
        return NextResponse.json({ error: err.message || 'Error interno' }, { status: 500 });
    }
}
