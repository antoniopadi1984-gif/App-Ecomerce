import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { syncProductIndex } from '@/lib/services/drive-service';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
        return NextResponse.json({ error: 'Missing productId' }, { status: 400 });
    }

    try {
        const concepts = await prisma.concept.findMany({
            where: { productId },
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { creatives: true }
                }
            }
        });

        const formattedConcepts = concepts.map((c: any, index: number) => ({
            id: c.id,
            code: c.number ? `C${c.number}` : `C${index + 1}`,
            name: c.name,
            type: c.type || 'Concepto',
            meta_ad_id: null,
            status: c.status,
            creatives_count: c._count.creatives
        }));

        return NextResponse.json({ concepts: formattedConcepts });
    } catch (error) {
        console.error('Error fetching concepts:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, type, description, productId, storeId } = body;

        if (!name || !productId || !storeId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Use findFirst with orderBy for prisma compatibility
        const lastConcept: any = await prisma.concept.findFirst({
            where: { productId },
            orderBy: { createdAt: 'desc' }
        });

        const nextNumber = (lastConcept?.number || 0) + 1;

        const concept = await prisma.concept.create({
            data: {
                productId,
                storeId,
                name,
                type,
                hypothesis: description,
                number: nextNumber,
                status: 'TESTING',
                createdBy: 'HUMAN'
            } as any
        });

        return NextResponse.json({ success: true, concept });
    } catch (error) {
        console.error('Error creating concept:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { conceptId, status, productId, storeId } = body;

        if (!conceptId || !status) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const concept = await prisma.concept.update({
            where: { id: conceptId },
            data: { status }
        });

        if (productId && storeId) {
            await syncProductIndex(productId, storeId);
        }

        return NextResponse.json({ success: true, concept });
    } catch (error) {
        console.error('Error updating concept:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
