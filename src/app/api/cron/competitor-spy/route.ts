import { NextRequest, NextResponse } from 'next/server';
import { runCompetitorSpy } from '@/lib/cron/competitor-spy';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function GET(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Leer storeId desde query param o ejecutar para todas las tiendas en BD
    const storeId = req.nextUrl.searchParams.get('storeId');

    let results: any[] = [];

    if (storeId) {
        results = await runCompetitorSpy(storeId);
    } else {
        // Obtener todas las tiendas activas desde BD
        const { prisma } = await import('@/lib/prisma');
        const stores = await prisma.store.findMany({
            where: { status: 'ACTIVE' },
            select: { id: true }
        });
        for (const store of stores) {
            const r = await runCompetitorSpy(store.id);
            results.push(...r);
        }
    }

    return NextResponse.json({ ok: true, total: results.length, results });
}
