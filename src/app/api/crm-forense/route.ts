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

            case 'PRODUCTOS': {
                const prodOrders = await (prisma as any).order.findMany({
                    where: { storeId, createdAt: { gte: start, lt: end } },
                    select: { createdAt: true, totalPrice: true, status: true, lineItems: true },
                });
                const prodMap: Record<string, { units: number; revenue: number; returns: number }> = {};
                for (const o of prodOrders) {
                    let items: any[] = [];
                    try { items = JSON.parse(o.lineItems || '[]'); } catch {}
                    for (const item of items) {
                        const name = item.title || item.name || 'Desconocido';
                        if (!prodMap[name]) prodMap[name] = { units: 0, revenue: 0, returns: 0 };
                        prodMap[name].units += item.quantity || 1;
                        prodMap[name].revenue += (item.price || 0) * (item.quantity || 1);
                        if (['RETURNED', 'DEVUELTO'].includes(o.status || '')) prodMap[name].returns++;
                    }
                }
                const products = Object.entries(prodMap)
                    .sort((a, b) => b[1].revenue - a[1].revenue)
                    .slice(0, 20)
                    .map(([name, m]) => ({ name, ...m, returnRate: m.units > 0 ? Math.round((m.returns / m.units) * 100) : 0 }));
                data = { type: 'table', columns: ['Producto', 'Unidades', 'Ingresos', 'Devoluciones %'], rows: products };
                break;
            }

            case 'TRANSPORTISTAS': {
                const shipOrders = await (prisma as any).order.findMany({
                    where: { storeId, createdAt: { gte: start, lt: end } },
                    select: { createdAt: true, fulfillmentProvider: true, status: true, totalPrice: true, shippingCost: true },
                });
                const carrierMap: Record<string, { total: number; delivered: number; returned: number; revenue: number; cost: number }> = {};
                for (const o of shipOrders) {
                    const carrier = o.fulfillmentProvider || 'Sin asignar';
                    if (!carrierMap[carrier]) carrierMap[carrier] = { total: 0, delivered: 0, returned: 0, revenue: 0, cost: 0 };
                    carrierMap[carrier].total++;
                    carrierMap[carrier].revenue += o.totalPrice || 0;
                    carrierMap[carrier].cost += o.shippingCost || 0;
                    if (['DELIVERED', 'ENTREGADO'].includes(o.status || '')) carrierMap[carrier].delivered++;
                    if (['RETURNED', 'DEVUELTO'].includes(o.status || '')) carrierMap[carrier].returned++;
                }
                const carriers = Object.entries(carrierMap).map(([name, m]) => ({
                    name,
                    total: m.total,
                    deliveryRate: m.total > 0 ? Math.round((m.delivered / m.total) * 100) : 0,
                    returnRate: m.total > 0 ? Math.round((m.returned / m.total) * 100) : 0,
                    avgShippingCost: m.total > 0 ? Math.round(m.cost / m.total * 100) / 100 : 0,
                })).sort((a, b) => b.total - a.total);
                data = { type: 'table', columns: ['Transportista', 'Pedidos', 'Entrega %', 'Devolución %', 'Coste Envío'], rows: carriers };
                break;
            }

            case 'EMPLEADOS': {
                const agentOrders = await (prisma as any).order.findMany({
                    where: { storeId, createdAt: { gte: start, lt: end } },
                    select: { createdAt: true, status: true, totalPrice: true, assignedAgentId: true, confirmationAttempts: true },
                });
                const agentMap: Record<string, { confirmed: number; total: number; revenue: number; attempts: number }> = {};
                for (const o of agentOrders) {
                    const agentId = o.assignedAgentId || 'Sin asignar';
                    if (!agentMap[agentId]) agentMap[agentId] = { confirmed: 0, total: 0, revenue: 0, attempts: 0 };
                    agentMap[agentId].total++;
                    agentMap[agentId].revenue += o.totalPrice || 0;
                    agentMap[agentId].attempts += o.confirmationAttempts || 1;
                    if (['CONFIRMED', 'confirmed'].includes(o.status || '')) agentMap[agentId].confirmed++;
                }
                const employees = Object.entries(agentMap).map(([id, m]) => ({
                    name: id,
                    pedidos: m.total,
                    confirmRate: m.total > 0 ? Math.round((m.confirmed / m.total) * 100) : 0,
                    revenue: Math.round(m.revenue * 100) / 100,
                    avgAttempts: m.total > 0 ? Math.round((m.attempts / m.total) * 10) / 10 : 0,
                })).sort((a, b) => b.confirmRate - a.confirmRate);
                data = { type: 'table', columns: ['Agente', 'Pedidos', 'Confirmación %', 'Facturación', 'Intentos medio'], rows: employees };
                break;
            }

            case 'AGENTES': {
                const agentRuns = await (prisma as any).agentRun.findMany({
                    where: { storeId, createdAt: { gte: start, lt: end } },
                    select: { createdAt: true, agentRole: true, status: true, tokens: true, cost: true },
                }).catch(() => []);
                const runMap: Record<string, { runs: number; tokens: number; cost: number; errors: number }> = {};
                for (const r of agentRuns) {
                    const role = r.agentRole || 'unknown';
                    if (!runMap[role]) runMap[role] = { runs: 0, tokens: 0, cost: 0, errors: 0 };
                    runMap[role].runs++;
                    runMap[role].tokens += r.tokens || 0;
                    runMap[role].cost += r.cost || 0;
                    if (r.status === 'ERROR') runMap[role].errors++;
                }
                const slots = buildSlotsArray();
                const slotData = slots.map((_: any, i: number) =>
                    agentRuns.filter((r: any) => {
                        const d = new Date(r.createdAt);
                        return isAnnual ? d.getMonth() === i : d.getDate() - 1 === i;
                    }).length
                );
                data = {
                    metrics: [{ label: 'Ejecuciones IA', values: slotData }],
                    summary: Object.entries(runMap).map(([role, m]) => ({
                        role, runs: m.runs, tokens: m.tokens,
                        cost: Math.round(m.cost * 1000) / 1000,
                        errorRate: m.runs > 0 ? Math.round((m.errors / m.runs) * 100) : 0
                    }))
                };
                break;
            }

            default: {
                data = { metrics: [{ label: 'Sin datos', values: buildSlotsArray() }] };
                break;
            }
        }

        return NextResponse.json({ ok: true, data, slotsCount, isAnnual });

    } catch (err: any) {
        console.error('[API /crm-forense]', err);
        return NextResponse.json({ error: err.message || 'Error interno' }, { status: 500 });
    }
}
