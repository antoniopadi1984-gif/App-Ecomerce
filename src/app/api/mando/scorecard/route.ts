import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type WeekData = {
    revenue: number; sessions: number; adSpend: number;
    orders: number; delivered: number; returned: number;
    confirmadas: number; reintentos: number;
    newCustomers: number;
    creativesLaunched: number; creativesWinner: number;
    cogs: number; shippingCost: number; netProfit: number;
};

function emptyWeek(): WeekData {
    return {
        revenue: 0, sessions: 0, adSpend: 0,
        orders: 0, delivered: 0, returned: 0,
        confirmadas: 0, reintentos: 0,
        newCustomers: 0,
        creativesLaunched: 0, creativesWinner: 0,
        cogs: 0, shippingCost: 0, netProfit: 0,
    };
}

function getWeekOfMonth(date: Date, monthStart: Date): number {
    const diff = date.getTime() - monthStart.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return Math.min(Math.floor(days / 7), 3); // 0-3 → semana 1-4
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const storeId = searchParams.get('storeId');
        const now = new Date();
        const month = parseInt(searchParams.get('month') || String(now.getMonth() + 1));
        const year = parseInt(searchParams.get('year') || String(now.getFullYear()));

        if (!storeId) {
            return NextResponse.json({ error: 'storeId requerido' }, { status: 400 });
        }

        const store = await (prisma as any).store.findUnique({
            where: { id: storeId },
            select: { id: true, name: true, currency: true, adSpendSource: true, targetProfitMargin: true },
        });
        if (!store) return NextResponse.json({ error: 'Tienda no encontrada' }, { status: 404 });

        const monthStart = new Date(year, month - 1, 1);
        const monthEnd = new Date(year, month, 1);

        // ── Datos semanales ──────────────────────────────────────
        const weeks: WeekData[] = [emptyWeek(), emptyWeek(), emptyWeek(), emptyWeek()];

        // DailyFinance
        const finances = await (prisma as any).dailyFinance.findMany({
            where: { storeId, date: { gte: monthStart, lt: monthEnd } },
        });
        for (const f of finances) {
            const w = getWeekOfMonth(new Date(f.date), monthStart);
            weeks[w].revenue += f.totalRevenue || 0;
            weeks[w].sessions += f.visitors || 0;
            weeks[w].adSpend += f.adSpend || 0;
            weeks[w].orders += f.ordersCount || 0;
            weeks[w].delivered += f.deliveredCount || 0;
            weeks[w].returned += f.returnedCount || 0;
            weeks[w].cogs += f.cogs || 0;
            weeks[w].shippingCost += f.shippingCost || 0;
            weeks[w].netProfit += f.netProfit || 0;
        }

        // AdMetricDaily — nivel ACCOUNT
        const adMetrics = await (prisma as any).adMetricDaily.findMany({
            where: { storeId, date: { gte: monthStart, lt: monthEnd }, level: 'ACCOUNT' },
        });
        for (const m of adMetrics) {
            const w = getWeekOfMonth(new Date(m.date), monthStart);
            const norm = JSON.parse(m.metricsNorm || '{}');
            weeks[w].adSpend = Math.max(weeks[w].adSpend, norm.spend || 0); // prefer real meta spend
        }

        // Orders del mes
        const orders = await (prisma as any).order.findMany({
            where: { storeId, createdAt: { gte: monthStart, lt: monthEnd } },
            select: {
                createdAt: true, status: true, totalPrice: true, paymentMethod: true,
                netProfit: true, netMargin: true, confirmationAttempts: true,
                customerId: true, fulfillmentStatus: true,
            },
        });

        for (const o of orders) {
            const w = getWeekOfMonth(new Date(o.createdAt), monthStart);
            if (o.confirmationAttempts > 1) weeks[w].reintentos++;
            if (['CONFIRMED', 'confirmed'].includes(o.status || '')) weeks[w].confirmadas++;
        }

        // Nuevos clientes: primer pedido del mes
        const customerIds = [...new Set(orders.map((o: any) => o.customerId).filter(Boolean))];
        if (customerIds.length > 0) {
            const customers = await (prisma as any).customer.findMany({
                where: { id: { in: customerIds }, totalOrders: 1 },
                select: { id: true },
            });
            const newIds = new Set(customers.map((c: any) => c.id));
            for (const o of orders) {
                const w = getWeekOfMonth(new Date(o.createdAt), monthStart);
                if (newIds.has(o.customerId)) weeks[w].newCustomers++;
            }
        }

        // Creativos del mes
        const creatives = await (prisma as any).creativeAsset.findMany({
            where: { storeId, createdAt: { gte: monthStart, lt: monthEnd } },
            select: { createdAt: true, verdict: true, revenue: true, spend: true },
        });
        for (const c of creatives) {
            const w = getWeekOfMonth(new Date(c.createdAt), monthStart);
            weeks[w].creativesLaunched++;
            if ((c.revenue || 0) > 0 && (c.spend || 0) > 0 && (c.revenue / c.spend) >= 2) {
                weeks[w].creativesWinner++;
            }
        }

        // ── Acumulados ────────────────────────────────────────────
        const acc = weeks.reduce(
            (a, w) => ({
                revenue: a.revenue + w.revenue,
                sessions: a.sessions + w.sessions,
                adSpend: a.adSpend + w.adSpend,
                orders: a.orders + w.orders,
                delivered: a.delivered + w.delivered,
                returned: a.returned + w.returned,
                confirmadas: a.confirmadas + w.confirmadas,
                reintentos: a.reintentos + w.reintentos,
                newCustomers: a.newCustomers + w.newCustomers,
                creativesLaunched: a.creativesLaunched + w.creativesLaunched,
                creativesWinner: a.creativesWinner + w.creativesWinner,
                cogs: a.cogs + w.cogs,
                shippingCost: a.shippingCost + w.shippingCost,
                netProfit: a.netProfit + w.netProfit,
            }),
            emptyWeek()
        );

        // ── Objetivos mensuales ───────────────────────────────────
        const goal = await (prisma as any).monthlyGoal.findFirst({
            where: { storeId, month, year },
        });

        // ── Métricas derivadas por semana ─────────────────────────
        function deriveWeek(w: WeekData) {
            const roas = w.adSpend > 0 ? w.revenue / w.adSpend : 0;
            const cpa = w.orders > 0 ? w.adSpend / w.orders : 0;
            const deliveryRate = w.orders > 0 ? (w.delivered / w.orders) * 100 : 0;
            const returnRate = w.orders > 0 ? (w.returned / w.orders) * 100 : 0;
            const confirmRate = w.orders > 0 ? (w.confirmadas / w.orders) * 100 : 0;
            const netMargin = w.revenue > 0 ? (w.netProfit / w.revenue) * 100 : 0;
            const costPerSession = w.sessions > 0 ? w.adSpend / w.sessions : 0;
            const ratioAcierto = w.creativesLaunched > 0 ? (w.creativesWinner / w.creativesLaunched) * 100 : 0;
            const envioMedio = w.orders > 0 ? w.shippingCost / w.orders : 0;
            const recurrentes = w.orders - w.newCustomers;
            return { ...w, roas, cpa, deliveryRate, returnRate, confirmRate, netMargin, costPerSession, ratioAcierto, envioMedio, recurrentes };
        }

        const weeksD = weeks.map(deriveWeek);
        const accD = deriveWeek(acc);

        const isCOD = store.adSpendSource !== 'SHOPIFY' ||
            orders.some((o: any) => o.paymentMethod === 'COD');

        return NextResponse.json({
            ok: true,
            month, year,
            store: { id: store.id, name: store.name, currency: store.currency, isCOD, targetProfitMargin: store.targetProfitMargin },
            weeks: weeksD,
            accumulated: accD,
            goal: goal || null,
            generatedAt: new Date().toISOString(),
        });
    } catch (err: any) {
        console.error('[API /mando/scorecard]', err);
        return NextResponse.json({ error: err.message || 'Error interno' }, { status: 500 });
    }
}

// ── PATCH: editar objetivo inline ─────────────────────────────
export async function PATCH(req: NextRequest) {
    try {
        const body = await req.json();
        const { storeId, month, year, field, value } = body;

        if (!storeId || !month || !year || !field) {
            return NextResponse.json({ error: 'Parámetros requeridos: storeId, month, year, field' }, { status: 400 });
        }

        const allowed = ['adSpendBudget', 'targetRoas', 'breakevenRoas', 'maxCpa', 'maxCpc', 'expectedConvRate', 'expectedAvgTicket'];
        if (!allowed.includes(field)) {
            return NextResponse.json({ error: `Campo no permitido: ${field}` }, { status: 400 });
        }

        const goal = await (prisma as any).monthlyGoal.upsert({
            where: { storeId_month_year: { storeId, month: parseInt(month), year: parseInt(year) } },
            create: {
                storeId, month: parseInt(month), year: parseInt(year),
                [field]: parseFloat(value),
            },
            update: { [field]: parseFloat(value) },
        });

        return NextResponse.json({ ok: true, goal });
    } catch (err: any) {
        console.error('[API /mando/scorecard PATCH]', err);
        return NextResponse.json({ error: err.message || 'Error interno' }, { status: 500 });
    }
}
