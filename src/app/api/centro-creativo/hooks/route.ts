import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const conceptId = searchParams.get('conceptId');

    if (!productId || !conceptId) {
        return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    try {
        const hooks = await prisma.savedHook.findMany({
            where: { productId, conceptId },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ hooks });
    } catch (error) {
        console.error('Error fetching hooks:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { text, type, phase, aggressiveness, productId, conceptId } = body;

        if (!text || !productId || !conceptId) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        const hook = await prisma.savedHook.create({
            data: {
                productId,
                conceptId,
                text,
                type,
                phase,
                aggressiveness: Number(aggressiveness) || 0
            } as any
        });

        return NextResponse.json({ success: true, hook });
    } catch (error) {
        console.error('Error saving hook:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
