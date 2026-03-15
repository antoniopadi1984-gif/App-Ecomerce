import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const storeId = searchParams.get('storeId');
        const tabString = searchParams.get('tab') || 'VENTAS';
        const monthStr = searchParams.get('month');
        const yearStr = searchParams.get('year');
        const isAnnual = searchParams.get('annual') === 'true';

        if (!storeId || !yearStr) {
            return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
        }

        const month = monthStr ? parseInt(monthStr) : 1;
        const year = parseInt(yearStr);

        let start, end, slotsCount;

        if (isAnnual) {
            start = new Date(year, 0, 1);
            end = new Date(year + 1, 0, 1);
            slotsCount = 12; // 12 meses
        } else {
            start = new Date(year, month - 1, 1);
            end = new Date(year, month, 1);
            slotsCount = new Date(year, month, 0).getDate();
        }

        // Estructura base
        const buildSlotsArray = () => Array.from({ length: slotsCount }, () => 0);

        let data: any = {};

        switch (tabString) {
            case 'VENTAS':
            case 'CLIENTES':
            case 'COD_VS_CARD':
                const orders = await (prisma as any).order.findMany({
                    where: { storeId, createdAt: { gte: start, lt: end } },
                    select: { createdAt: true, totalPrice: true, paymentMethod: true, customerId: true, status: true },
                });

                // Generar métricas 1-31 o 1-12
                let dailyVentasV = buildSlotsArray();
                let dailyVentasP = buildSlotsArray();

                let dailyCOD_V = buildSlotsArray();
                let dailyCARD_V = buildSlotsArray();

                let customerMap = new Map();

                orders.forEach((o: any) => {
                    const slotIndex = isAnnual ? o.createdAt.getMonth() : o.createdAt.getDate() - 1;
                    const val = o.totalPrice || 0;

                    // Ventas / Pedidos
                    dailyVentasV[slotIndex] += val;
                    dailyVentasP[slotIndex] += 1;

                    // COD vs CARD
                    if (o.paymentMethod === 'COD') dailyCOD_V[slotIndex] += val;
                    else dailyCARD_V[slotIndex] += val;

                    // Clientes base
                    if (o.customerId) customerMap.set(o.customerId, (customerMap.get(o.customerId) || 0) + 1);
                });

                if (tabString === 'VENTAS') {
                    data = { metrics: [{ label: 'Facturación (€)', values: dailyVentasV }, { label: 'Pedidos (#)', values: dailyVentasP }] };
                } else if (tabString === 'COD_VS_CARD') {
                    data = { metrics: [{ label: 'Ventas COD (€)', values: dailyCOD_V }, { label: 'Ventas Tarjeta (€)', values: dailyCARD_V }] };
                } else {
                    // CLientes
                    let totalRepeat = 0;
                    customerMap.forEach(v => { if (v > 1) totalRepeat++; });

                    let repeatData = buildSlotsArray();
                    // Simplified simulation of daily repeat for UI mock
                    if (customerMap.size > 0) repeatData[0] = Math.round((totalRepeat / customerMap.size) * 100);

                    data = {
                        metrics: [
                            { label: 'Total Clientes', values: dailyVentasP },
                            { label: 'Tasa Recompra Global (%)', values: repeatData }
                        ]
                    };
                }
                break;

            case 'CREATIVOS':
                const creatives = await (prisma as any).creativeAsset.findMany({
                    where: { storeId, createdAt: { gte: start, lt: end } },
                });

                let dailySpend = buildSlotsArray();
                let dailyRev = buildSlotsArray();
                let dailyRoas = buildSlotsArray();

                creatives.forEach((c: any) => {
                    const slotIndex = isAnnual ? c.createdAt.getMonth() : c.createdAt.getDate() - 1;
                    dailySpend[slotIndex] += c.spend || 0;
                    dailyRev[slotIndex] += c.revenue || 0;
                });

                for (let i = 0; i < slotsCount; i++) {
                    dailyRoas[i] = dailySpend[i] > 0 ? Number((dailyRev[i] / dailySpend[i]).toFixed(2)) : 0;
                }

                data = { metrics: [{ label: 'Inversión (€)', values: dailySpend }, { label: 'Ingresos (€)', values: dailyRev }, { label: 'ROAS (x)', values: dailyRoas }] };
                break;

            case 'PRODUCTOS':
            case 'TRANSPORTISTAS':
            case 'EMPLEADOS':
            case 'AGENTES':
            default: {
                // Datos reales de órdenes agrupados por hora del día
                const ordersByHour = await (prisma as any).order.findMany({
                    where: { storeId, createdAt: { gte: start, lt: end } },
                    select: { createdAt: true, status: true }
                });

                const slots = buildSlotsArray();
                data = {
                    metrics: [
                        {
                            label: 'Volumen',
                            values: slots.map((_: any, i: number) =>
                                ordersByHour.filter((o: any) => new Date(o.createdAt).getHours() === i).length
                            )
                        },
                        {
                            label: 'Eficiencia',
                            values: slots.map((_: any, i: number) => {
                                const hourOrders = ordersByHour.filter((o: any) => new Date(o.createdAt).getHours() === i);
                                const total = hourOrders.length;
                                return total > 0
                                    ? Math.round((hourOrders.filter((o: any) => o.status === 'DELIVERED').length / total) * 100)
                                    : 0;
                            })
                        }
                    ]
                };
                break;
            }
        }

        return NextResponse.json({ ok: true, data, slotsCount, isAnnual });

    } catch (err: any) {
        console.error('[API /crm-forense]', err);
        return NextResponse.json({ error: err.message || 'Error interno' }, { status: 500 });
    }
}
