import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
    const storeId = req.headers.get('X-Store-Id') || 'store-main';

    const customers = await (prisma as any).customer.findMany({
        where: { storeId },
        select: {
            id: true, totalOrders: true, totalSpent: true,
            avgTicket: true, createdAt: true,
            orders: {
                orderBy: { createdAt: 'desc' },
                take: 1,
                select: { createdAt: true }
            }
        }
    });

    const now = Date.now();
    const updates: any[] = [];

    for (const customer of customers) {
        const lastOrderDays = customer.orders[0]
            ? Math.floor((now - new Date(customer.orders[0].createdAt).getTime()) / 86400000)
            : 999;

        // RFM Score
        const recencyScore   = lastOrderDays <= 30 ? 5 : lastOrderDays <= 90 ? 4 : lastOrderDays <= 180 ? 3 : lastOrderDays <= 365 ? 2 : 1;
        const frequencyScore = customer.totalOrders >= 5 ? 5 : customer.totalOrders >= 3 ? 4 : customer.totalOrders >= 2 ? 3 : customer.totalOrders >= 1 ? 2 : 1;
        const monetaryScore  = customer.totalSpent >= 500 ? 5 : customer.totalSpent >= 200 ? 4 : customer.totalSpent >= 100 ? 3 : customer.totalSpent >= 50 ? 2 : 1;
        const rfmScore = ((recencyScore + frequencyScore + monetaryScore) / 15) * 100;

        // Segment
        const segment = rfmScore >= 80 ? 'CHAMPION' : rfmScore >= 60 ? 'LOYAL' : rfmScore >= 40 ? 'AT_RISK' : 'LOST';

        // LTV predicho a 12 meses
        const ageMonths = Math.max(1, (now - new Date(customer.createdAt).getTime()) / (30 * 86400000));
        const monthlyValue = customer.totalSpent / ageMonths;
        const predictedLtv12m = monthlyValue * 12;

        updates.push((prisma as any).customerLTV.upsert({
            where: { customerId: customer.id },
            create: { customerId: customer.id, storeId, predictedLtv12m, rfmScore, segment },
            update: { predictedLtv12m, rfmScore, segment, lastCalculated: new Date() }
        }).catch(() => {}));
    }

    await Promise.all(updates);

    // Resumen por segmento
    const segments = await (prisma as any).customerLTV.groupBy({
        by: ['segment'],
        where: { storeId },
        _count: { id: true },
        _sum: { predictedLtv12m: true }
    }).catch(() => []);

    return NextResponse.json({
        ok: true,
        analyzed: customers.length,
        segments: segments.map((s: any) => ({
            segment: s.segment,
            count: s._count.id,
            totalLtv: Math.round(s._sum.predictedLtv12m || 0)
        }))
    });
}
