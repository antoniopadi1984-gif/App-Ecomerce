import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const stores = await prisma.store.findMany({
            select: {
                id: true,
                name: true,
                currency: true,
                domain: true,
            },
            orderBy: { name: 'asc' }
        });

        console.log(`[API/stores] Devolviendo ${stores.length} tiendas:`, stores.map(s => s.id));

        return NextResponse.json({ success: true, stores });
    } catch (error: any) {
        console.error('[API/stores] Error:', error.message);
        return NextResponse.json(
            { success: false, error: error.message, stores: [] },
            { status: 500 }
        );
    }
}
