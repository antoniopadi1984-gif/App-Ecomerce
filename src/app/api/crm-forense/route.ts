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

        if (!storeId || !monthStr || !yearStr) {
            return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
        }

        const month = parseInt(monthStr);
        const year = parseInt(yearStr);
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 1);
        const daysInMonth = new Date(year, month, 0).getDate();

        // Estructura base de días 1-31
        const buildDaysArray = () => Array.from({ length: daysInMonth }, () => 0);

        let data: any = {};

        switch (tabString) {
            case 'VENTAS':
            case 'CLIENTES':
            case 'COD_VS_CARD':
                const orders = await (prisma as any).order.findMany({
                    where: { storeId, createdAt: { gte: start, lt: end } },
                    select: { createdAt: true, totalPrice: true, paymentMethod: true, customerId: true, status: true },
                });

                // Generar métricas 1-31
                let dailyVentasV = buildDaysArray();
                let dailyVentasP = buildDaysArray();

                let dailyCOD_V = buildDaysArray();
                let dailyCARD_V = buildDaysArray();

                let customerMap = new Map();

                orders.forEach((o: any) => {
                    const dayIndex = o.createdAt.getDate() - 1;
                    const val = o.totalPrice || 0;

                    // Ventas / Pedidos
                    dailyVentasV[dayIndex] += val;
                    dailyVentasP[dayIndex] += 1;

                    // COD vs CARD
                    if (o.paymentMethod === 'COD') dailyCOD_V[dayIndex] += val;
                    else dailyCARD_V[dayIndex] += val;

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

                    let repeatData = buildDaysArray();
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

                let dailySpend = buildDaysArray();
                let dailyRev = buildDaysArray();
                let dailyRoas = buildDaysArray();

                creatives.forEach((c: any) => {
                    const dayIndex = c.createdAt.getDate() - 1;
                    dailySpend[dayIndex] += c.spend || 0;
                    dailyRev[dayIndex] += c.revenue || 0;
                });

                for (let i = 0; i < daysInMonth; i++) {
                    dailyRoas[i] = dailySpend[i] > 0 ? Number((dailyRev[i] / dailySpend[i]).toFixed(2)) : 0;
                }

                data = { metrics: [{ label: 'Inversión (€)', values: dailySpend }, { label: 'Ingresos (€)', values: dailyRev }, { label: 'ROAS (x)', values: dailyRoas }] };
                break;

            case 'PRODUCTOS':
            case 'TRANSPORTISTAS':
            case 'EMPLEADOS':
            case 'AGENTES':
            default:
                // Mock data structure fallback until entities are fully populated 
                data = {
                    metrics: [
                        { label: 'Volumen', values: buildDaysArray().map(() => Math.floor(Math.random() * 50)) },
                        { label: 'Eficiencia', values: buildDaysArray().map(() => Math.floor(Math.random() * 100)) }
                    ]
                }
                break;
        }

        return NextResponse.json({ ok: true, data, daysInMonth });

    } catch (err: any) {
        console.error('[API /crm-forense]', err);
        return NextResponse.json({ error: err.message || 'Error interno' }, { status: 500 });
    }
}
