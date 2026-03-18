import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        // Obtener primera tienda activa
        const store = await (prisma as any).store.findFirst({
            select: { id: true, name: true, domain: true }
        });

        return NextResponse.json({
            user: { name: 'EcomBoom User' },
            store: store ? { id: store.id, name: store.name } : null,
            authenticated: true,
        });
    } catch (e: any) {
        return NextResponse.json({ authenticated: false }, { status: 401 });
    }
}
