import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id: productId } = await context.params;
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const page = parseInt(searchParams.get('page') || '1');
        const pageSize = parseInt(searchParams.get('pageSize') || '10');

        const where: any = {};

        // Contexto Global Support (Priority 1 fix)
        if (productId && productId !== 'ALL') {
            where.items = {
                some: {
                    productId: productId
                }
            };
        }

        if (status && status !== 'ALL') {
            if (status === 'FRAUD') {
                where.riskLevel = 'HIGH';
            } else if (status === 'DRAFT') {
                where.orderType = { in: ['DRAFT', 'ABANDONED'] };
            } else {
                where.status = status;
            }
        }

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where,
                include: {
                    items: true
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize
            }),
            prisma.order.count({ where })
        ]);

        return NextResponse.json({
            success: true,
            data: {
                orders,
                pagination: {
                    total,
                    page,
                    pageSize,
                    totalPages: Math.ceil(total / pageSize)
                }
            }
        });
    } catch (error) {
        console.error('[API] Error fetching product orders:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch orders' },
            { status: 500 }
        );
    }
}
