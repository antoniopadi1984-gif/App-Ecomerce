import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('productId');

        if (!productId || productId === 'GLOBAL') {
            return NextResponse.json({ libraries: [] });
        }

        const libraries = await (prisma as any).competitorLibrary.findMany({
            where: { productId },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ success: true, libraries });
    } catch (error: any) {
        console.error('[API-LIBRARIES] Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
