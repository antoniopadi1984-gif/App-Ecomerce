import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const storeId = request.headers.get('X-Store-Id');

        const products = await prisma.product.findMany({
            where: storeId ? { storeId } : {},
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
