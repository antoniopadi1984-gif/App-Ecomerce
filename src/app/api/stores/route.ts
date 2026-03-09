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
        return NextResponse.json({ success: true, stores });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to fetch stores' }, { status: 500 });
    }
}
