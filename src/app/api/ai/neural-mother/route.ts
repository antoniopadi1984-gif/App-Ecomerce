import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AiRouter } from '@/lib/ai/router';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
    const storeId = req.headers.get('X-Store-Id');
    const { productId, query, contextType } = await req.json();
    // contextType: 'DAILY_BRIEFING' | 'CREATIVE_ANALYSIS' | 'OPS_REVIEW' | 'AD_PERFORMANCE' | 'CUSTOM'

    if (!storeId) return NextResponse.json({ error: 'storeId required' }, { status: 400 });

    // Cargar contexto completo del negocio
    const [product, research, metaInsights, recentOrders, financials, branding] = await Promise.all([
        productId ? prisma.product.findUnique({ where: { id: productId }, select: { title: true, description: true, productType: true, breakevenROAS: true, cpaMax: true } }) : null,
        productId ? prisma.researchStep.findMany({ where: { productId }, orderBy: { createdAt: 'desc' }, take: 7 }) : [],
        (prisma as any).adMetricDaily.findMany({ where: { storeId }, orderBy: { date: 'desc' }, take: 10 }),
        prisma.order.findMany({ where: { storeId, createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }, select: { status: true, totalPrice: true, netProfit: true, fulfillmentStatus: true }, take: 100 }),
        (prisma as any).dailyFinance.findMany({ where: { storeId }, orderBy: { date: 'desc' }, take: 7 }),
        productId ? (prisma as any).productBranding.findUnique({ where: { productId } }) : null,
    ]);

    // Calcular KPIs rápidos
    const totalRevenue = recentOrders.reduce((s: number, o: any) => s + (o.totalPrice || 0), 0);
    const deliveredOrders = recentOrders.filter((o: any) => o.status === 'DELIVERED').length;
    const deliveryRate = recentOrders.length > 0 ? (deliveredOrders / recentOrders.length * 100).toFixed(1) : '0';

    const context = {
        producto: product,
        researchDisponible: research.map((r: any) => ({ step: r.stepKey, hasData: !!r.outputJson })),
        metaInsights7d: metaInsights.slice(0, 5),
        kpis7d: { totalRevenue, totalOrders: recentOrders.length, deliveryRate: `${deliveryRate}%` },
        financials7d: financials,
        brandingDisponible: !!branding,
    };

    const { agentDispatcher } = await import('@/lib/agents/agent-dispatcher');
    const result = await agentDispatcher.dispatch({
        role: 'neural-mother',
        prompt: query || `Genera un briefing ejecutivo del estado actual del negocio para la tienda. Identifica la acción más importante a tomar ahora mismo.`,
        context: JSON.stringify(context),
        storeId: storeId || ''
    });

    return NextResponse.json({ ok: true, response: result.text, contextUsed: Object.keys(context) });
}
