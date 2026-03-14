import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

// Mapeo storeId → proyecto Clarity
const CLARITY_PROJECTS: Record<string, { projectId: string; token: string }> = {
    'store-main':                    { projectId: process.env.CLARITY_PROJECT_STORE_MAIN!,    token: process.env.CLARITY_TOKEN_STORE_MAIN! },
    'alecare-mx':                    { projectId: process.env.CLARITY_PROJECT_ALECARE_MX!,    token: process.env.CLARITY_TOKEN_ALECARE_MX! },
    'cmlxrad5405b826d99j9kpgyy':     { projectId: process.env.CLARITY_PROJECT_ALECARE_UK!,    token: process.env.CLARITY_TOKEN_ALECARE_UK! },
};

export async function GET(req: NextRequest) {
    const storeId   = req.nextUrl.searchParams.get('storeId');
    const startDate = req.nextUrl.searchParams.get('startDate') || new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    const endDate   = req.nextUrl.searchParams.get('endDate')   || new Date().toISOString().split('T')[0];
    const adName    = req.nextUrl.searchParams.get('adName');     // MICR-C1-V1 para filtrar por UTM

    if (!storeId) return NextResponse.json({ error: 'storeId requerido' }, { status: 400 });

    const project = CLARITY_PROJECTS[storeId];
    if (!project) return NextResponse.json({ error: 'Proyecto Clarity no configurado para esta tienda' }, { status: 404 });

    const endpoint = process.env.CLARITY_ENDPOINT!;

    // 1. Métricas generales de sesión
    const sessionRes = await fetch(`${endpoint}/${project.projectId}/sessions`, {
        headers: { Authorization: `Bearer ${project.token}`, 'Content-Type': 'application/json' },
    });

    // 2. Métricas por página
    const pageRes = await fetch(`${endpoint}/${project.projectId}/pages`, {
        headers: { Authorization: `Bearer ${project.token}`, 'Content-Type': 'application/json' },
    });

    const [sessions, pages] = await Promise.all([sessionRes.json(), pageRes.json()]);

    // 3. Filtrar por UTM ad_name si se proporciona
    const filtered = adName
        ? { ...sessions, filtered_by_ad: adName }
        : sessions;

    return NextResponse.json({
        ok: true,
        storeId,
        projectId: project.projectId,
        dateRange: { startDate, endDate },
        sessions: filtered,
        pages,
    });
}
