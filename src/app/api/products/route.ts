import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const products = await prisma.product.findMany({
            select: {
                id: true,
                title: true,
                status: true,
                imageUrl: true,
                productFamily: true,
                createdAt: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json({
            success: true,
            products: products.map(p => ({
                id: p.id,
                title: p.title,
                status: p.status,
                imageUrl: p.imageUrl,
                productFamily: p.productFamily
            }))
        });
    } catch (error) {
        console.error('[API] Error fetching products:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch products' },
            { status: 500 }
        );
    }
}
