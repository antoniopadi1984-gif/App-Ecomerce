import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('productId');
        const status = searchParams.get('status');
        const page = parseInt(searchParams.get('page') || '1');
        const pageSize = parseInt(searchParams.get('pageSize') || '25');
        const storeId = request.headers.get('X-Store-Id') || searchParams.get('storeId');

        const where: any = {};
        if (storeId) where.storeId = storeId;

        // Global vs Product Filtering
        if (productId && productId !== 'GLOBAL' && productId !== 'ALL') {
            where.items = {
                some: {
                    productId: productId
                }
            };
        }

        // Status Filtering (Normalized EcomBoom states)
        if (status && status !== 'ALL') {
            if (status === 'FRAUD') {
                where.OR = [
                    { riskLevel: 'HIGH' },
                    { riskScore: { gt: 80 } }
                ];
            } else if (status === 'DRAFT') {
                where.orderType = { in: ['DRAFT', 'ABANDONED'] };
            } else if (status === 'INCIDENCE') {
                where.logisticsStatus = { in: ['INCIDENCE', 'ERROR', 'INCIDENCIA', 'SINIESTRO'] };
            } else if (status === 'PROCESSING') {
                where.logisticsStatus = { in: ['PROCESSING', 'PREPARACION', 'PREPARANDO'] };
            } else if (status === 'IN_TRANSIT') {
                where.logisticsStatus = { in: ['IN_TRANSIT', 'SHIPPED', 'EN TRANSITO', 'ENVIADO'] };
            } else if (status === 'OUT_FOR_DELIVERY') {
                where.logisticsStatus = { in: ['OUT_FOR_DELIVERY', 'EN REPARTO'] };
            } else if (status === 'DELIVERED') {
                where.logisticsStatus = { in: ['DELIVERED', 'ENTREGADO'] };
            } else if (status === 'RETURNED' || status === 'RETURN_TO_SENDER') {
                where.logisticsStatus = { in: ['RETURNED', 'DEVUELTO', 'RETURN_TO_SENDER', 'RETORNO'] };
            } else if (status === 'CANCELLED') {
                where.status = 'CANCELLED';
            } else if (status === 'PENDING') {
                where.status = 'PENDING';
                where.logisticsStatus = { notIn: ['CANCELLED', 'RETURNED', 'DELIVERED'] };
            } else {
                where.status = status;
            }
        }

        console.error(`[ORDERS API] StoreId: ${storeId} | Where clause:`, JSON.stringify(where));

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where,
                include: {
                    items: true,
                    attribution: true
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize
            }),
            prisma.order.count({ where })
        ]);

        return NextResponse.json({
            success: true,
            debugWhere: where,
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
        console.error('[API] Error fetching unified orders:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch orders' },
            { status: 500 }
        );
    }
}
