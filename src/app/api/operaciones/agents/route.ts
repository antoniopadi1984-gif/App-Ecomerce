import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const DEFAULT_AGENTS = [
    'MANDO', 'MEDIA_BUYING', 'COPYWRITING', 'VIDEO_EDITOR',
    'LANDING_DESIGNER', 'CRO_SPECIALIST', 'AOV_SPECIALIST',
    'BRANDING', 'COD_CONFIRMATION', 'ORDER_FOLLOWUP',
    'CART_RECOVERY', 'RESEARCH_ANALYST'
];

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const storeId = searchParams.get('storeId');

        if (!storeId) {
            return NextResponse.json({ error: 'storeId requerido' }, { status: 400 });
        }

        let agents = await prisma.agentProfile.findMany({
            where: { storeId },
        });

        // Ensure all default agents exist
        const existingRoles = new Set(agents.map(a => a.role));
        const missingRoles = DEFAULT_AGENTS.filter(rol => !existingRoles.has(rol));

        if (missingRoles.length > 0) {
            const dataToInsert = missingRoles.map(role => ({
                storeId,
                role,
                name: `Agente: ${role}`,
                systemPrompt: `Eres un experto especializado en ${role}.`,
                isActive: true,
            }));
            for (const agent of dataToInsert) {
                await prisma.agentProfile.create({ data: agent });
            }

            agents = await prisma.agentProfile.findMany({
                where: { storeId },
            });
        }

        return NextResponse.json({ ok: true, agents });
    } catch (err: any) {
        console.error('[API /operaciones/agents GET]', err);
        return NextResponse.json({ error: err.message || 'Error interno' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, storeId, systemPrompt, isActive } = body;

        if (!id || !storeId) {
            return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
        }

        const agent = await prisma.agentProfile.update({
            where: { id },
            data: {
                systemPrompt: systemPrompt !== undefined ? systemPrompt : undefined,
                isActive: isActive !== undefined ? isActive : undefined,
            }
        });

        return NextResponse.json({ ok: true, agent });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
