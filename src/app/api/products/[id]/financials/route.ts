import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SnapshotService } from '@/lib/services/snapshot-service';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, startOfDay } from 'date-fns';

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id: productId } = await context.params;
        const { searchParams } = new URL(request.url);

        // Default to current month if no dates provided
        const now = new Date();
        const start = searchParams.get('start') ? new Date(searchParams.get('start')!) : startOfMonth(now);
        const end = searchParams.get('end') ? new Date(searchParams.get('end')!) : endOfMonth(now);

        // 1. Fetch Product Finance Base
        const product = await prisma.product.findUnique({
            where: { id: productId },
            include: { finance: true }
        });

        if (!product) {
            return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
        }

        // 2. Fetch Order Items for this product in range
        const orderItems = await prisma.orderItem.findMany({
            where: {
                productId,
                order: {
                    createdAt: { gte: start, lte: end },
                    status: { notIn: ['CANCELLED', 'ABANDONED'] }
                }
            },
            include: {
                order: true
            }
        });

        // 3. Aggregate Monthly/Daily Stats
        const stats = orderItems.reduce((acc: any, item) => {
            const day = format(item.order.createdAt, 'yyyy-MM-dd');
            if (!acc[day]) {
                acc[day] = { revenue: 0, units: 0, orders: new Set() };
            }
            acc[day].revenue += item.totalPrice || 0;
            acc[day].units += item.quantity || 0;
            acc[day].orders.add(item.orderId);
            return acc;
        }, {});

        // 4. Calculate Unit Economics
        const finance = product.finance || { unitCost: 0, sellingPrice: 0, shippingCost: 0, returnCost: 0 };

        const summary = {
            totalRevenue: orderItems.reduce((sum, i) => sum + (i.totalPrice || 0), 0),
            totalUnits: orderItems.reduce((sum, i) => sum + (i.quantity || 0), 0),
            totalOrders: new Set(orderItems.map(i => i.orderId)).size,
            cogs: orderItems.reduce((sum, i) => sum + ((i.unitCost || finance.unitCost || 0) * (i.quantity || 0)), 0),
            unitEconomics: finance
        };

        // 5. Fetch Ad Spend for this product if tracked (CreativeAsset usually keeps it)
        const creativeAssets = await prisma.creativeAsset.findMany({
            where: { productId }
        });
        const totalAdSpend = creativeAssets.reduce((sum, a) => sum + (a.spend || 0), 0);

        return NextResponse.json({
            success: true,
            data: {
                summary: {
                    ...summary,
                    adSpend: totalAdSpend,
                    netProfit: summary.totalRevenue - summary.cogs - totalAdSpend // Simplified for now
                },
                dailyStats: Object.entries(stats).map(([date, data]: [string, any]) => ({
                    date,
                    revenue: data.revenue,
                    units: data.units,
                    orderCount: data.orders.size
                }))
            }
        });
    } catch (error) {
        console.error('[API] Error fetching product financials:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch financials' },
            { status: 500 }
        );
    }
}
