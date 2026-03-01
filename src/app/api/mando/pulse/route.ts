import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const storeId = searchParams.get('storeId');

        if (!storeId) {
            return NextResponse.json({ error: 'storeId requerido' }, { status: 400 });
        }

        const store = await (prisma as any).store.findUnique({
            where: { id: storeId },
            select: { id: true, name: true, currency: true, adSpendSource: true },
        });

        if (!store) {
            return NextResponse.json({ error: 'Tienda no encontrada' }, { status: 404 });
        }

        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

        // Snapshot del día
        const snapshot = await (prisma as any).dailySnapshot.findFirst({
            where: { storeId, date: { gte: todayStart, lt: todayEnd } },
            orderBy: { createdAt: 'desc' },
        });

        // Finanzas del día
        const finance = await (prisma as any).dailyFinance.findFirst({
            where: { storeId, date: { gte: todayStart, lt: todayEnd } },
        });

        // AdMetrics del día — nivel ACCOUNT agregado
        const adMetrics = await (prisma as any).adMetricDaily.findMany({
            where: {
                storeId,
                date: { gte: todayStart, lt: todayEnd },
                level: 'ACCOUNT',
            },
        });

        // Agregar adMetrics (puede haber varios si hay múltiples cuentas)
        const totalAdSpend = adMetrics.reduce((acc: number, m: any) => {
            const raw = JSON.parse(m.metricsNorm || '{}');
            return acc + (raw.spend || 0);
        }, 0);
        const totalAdRevenue = adMetrics.reduce((acc: number, m: any) => {
            const raw = JSON.parse(m.metricsNorm || '{}');
            return acc + (raw.revenue || 0);
        }, 0);

        // Órdenes del día
        const orders = await (prisma as any).order.findMany({
            where: { storeId, createdAt: { gte: todayStart, lt: todayEnd } },
            select: {
                status: true,
                totalPrice: true,
                paymentMethod: true,
                netProfit: true,
                netMargin: true,
                fulfillmentStatus: true,
            },
        });

        const totalOrders = orders.length;
        const revenue = orders.reduce((s: number, o: any) => s + (o.totalPrice || 0), 0);
        const deliveredOrders = orders.filter((o: any) =>
            ['DELIVERED', 'delivered', 'ENTREGADO'].includes(o.status || '')
        ).length;
        const deliveryRate = totalOrders > 0 ? (deliveredOrders / totalOrders) * 100 : 0;
        const avgMargin = orders.length > 0
            ? orders.reduce((s: number, o: any) => s + (o.netMargin || 0), 0) / orders.length
            : 0;

        const spendFinal = totalAdSpend || snapshot?.spendAds || 0;
        const revenueFinal = revenue || snapshot?.revenueReal || 0;
        const roas = spendFinal > 0 ? revenueFinal / spendFinal : 0;
        const cpa = totalOrders > 0 ? spendFinal / totalOrders : 0;
        const sessions = finance?.visitors || snapshot?.metricsJson
            ? (() => { try { return JSON.parse(snapshot?.metricsJson || '{}').sessions || 0; } catch { return 0; } })()
            : 0;

        // Thresholds para semáforo
        const threshold = await (prisma as any).thresholdConfig.findFirst({
            where: { storeId },
            orderBy: { createdAt: 'desc' },
        });

        const isCOD = orders.some((o: any) => o.paymentMethod === 'COD') ||
            store.adSpendSource === 'COD';

        const metrics = {
            facturacionHoy: { value: revenueFinal, unit: store.currency },
            roas: { value: Math.round(roas * 100) / 100, unit: 'x' },
            cpa: { value: Math.round(cpa * 100) / 100, unit: store.currency },
            sesiones: { value: sessions, unit: '' },
            pedidos: { value: totalOrders, unit: '' },
            margenNeto: { value: Math.round(avgMargin * 10) / 10, unit: '%' },
            ...(isCOD ? { tasaEntrega: { value: Math.round(deliveryRate * 10) / 10, unit: '%' } } : {}),
        };

        // Semáforo automático
        function semaforo(key: string, value: number): 'green' | 'yellow' | 'red' {
            if (!threshold) return 'yellow';
            switch (key) {
                case 'roas':
                    if (value >= threshold.minRoas) return 'green';
                    if (value >= threshold.minRoas * 0.75) return 'yellow';
                    return 'red';
                case 'cpa':
                    const maxCpa = threshold.maxCpa || 999;
                    if (value <= maxCpa * 0.9) return 'green';
                    if (value <= maxCpa) return 'yellow';
                    return 'red';
                case 'tasaEntrega':
                    if (value >= threshold.minDeliveryRate) return 'green';
                    if (value >= threshold.minDeliveryRate * 0.85) return 'yellow';
                    return 'red';
                case 'margenNeto':
                    if (value >= threshold.minProfitPercent) return 'green';
                    if (value >= threshold.minProfitPercent * 0.75) return 'yellow';
                    return 'red';
                default:
                    return 'green';
            }
        }

        const metricsWithStatus = Object.fromEntries(
            Object.entries(metrics).map(([key, data]) => [
                key,
                { ...data, status: semaforo(key, (data as any).value) },
            ])
        );

        return NextResponse.json({
            ok: true,
            store: { id: store.id, name: store.name, currency: store.currency, isCOD },
            metrics: metricsWithStatus,
            threshold: threshold
                ? { minRoas: threshold.minRoas, maxCpa: threshold.maxCpa, minDeliveryRate: threshold.minDeliveryRate, minProfitPercent: threshold.minProfitPercent }
                : null,
            generatedAt: new Date().toISOString(),
        });
    } catch (err: any) {
        console.error('[API /mando/pulse]', err);
        return NextResponse.json({ error: err.message || 'Error interno' }, { status: 500 });
    }
}
