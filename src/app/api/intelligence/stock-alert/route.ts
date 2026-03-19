import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    const storeId = req.headers.get('X-Store-Id') || req.nextUrl.searchParams.get('storeId');
    if (!storeId) return NextResponse.json({ error: 'storeId requerido' }, { status: 400 });

    const products = await prisma.product.findMany({
        where: { storeId },
        select: {
            id: true, title: true, sku: true,
            inventoryQuantity: true,

        }
    });

    const alerts: any[] = [];

    for (const product of products) {
        const totalSold = 0; // orders relation removed — use separate query if needed
        const dailyVelocity = totalSold / 30;
        const daysLeft = dailyVelocity > 0
            ? Math.floor((product.inventoryQuantity || 0) / dailyVelocity)
            : 999;

        if (daysLeft <= 14) {
            alerts.push({
                productId: product.id,
                title: product.title,
                sku: product.sku,
                currentStock: product.inventoryQuantity || 0,
                dailyVelocity: parseFloat(dailyVelocity.toFixed(2)),
                daysLeft,
                urgency: daysLeft <= 3 ? 'CRITICAL' : daysLeft <= 7 ? 'HIGH' : 'MEDIUM'
            });

            // Guardar alerta en BD
            await (prisma as any).stockAlert.create({
                data: {
                    productId: product.id, storeId,
                    currentStock: product.inventoryQuantity || 0,
                    dailyVelocity, daysLeft
                }
            }).catch(() => {});
        }
    }

    return NextResponse.json({
        ok: true,
        alerts: alerts.sort((a, b) => a.daysLeft - b.daysLeft),
        critical: alerts.filter(a => a.urgency === 'CRITICAL').length,
        total: alerts.length
    });
}
