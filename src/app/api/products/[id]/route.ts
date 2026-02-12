import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        const resolvedParams = await params;
        const productId = resolvedParams.id;
        if (!productId) {
            return NextResponse.json({ success: false, error: 'Product ID is required' }, { status: 400 });
        }

        const product = await prisma.product.findUnique({
            where: { id: productId },
            include: {
                metaConfig: true,
                supplier: {
                    select: {
                        name: true,
                        alias: true
                    }
                },
                finance: true
            }
        });

        if (!product) {
            return NextResponse.json(
                { success: false, error: 'Producto no encontrado' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            product
        });
    } catch (error: any) {
        console.error('[API] Error fetching product:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to fetch product details' },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        const resolvedParams = await params;
        const productId = resolvedParams.id;
        const body = await request.json();

        const updatedProduct = await prisma.product.update({
            where: { id: productId },
            data: {
                ...body,
                updatedAt: new Date()
            },
            include: {
                metaConfig: true
            }
        });

        return NextResponse.json({
            success: true,
            product: updatedProduct
        });
    } catch (error: any) {
        console.error('[API] Error updating product:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to update product' },
            { status: 500 }
        );
    }
}
