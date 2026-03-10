import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AiRouter } from '@/lib/ai/router';
import { TaskType } from '@/lib/ai/providers/interfaces';
 
export const runtime = 'nodejs';
export const maxDuration = 300;
 
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
 
  const stores = await prisma.store.findMany();
  const results = [];
 
  for (const store of stores) {
    // Obtener KPIs de última semana
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const finance = await (prisma as any).dailyFinance.findMany({
      where: { storeId: store.id, date: { gte: weekAgo } },
      orderBy: { date: 'desc' }
    });
 
    const totalRevenue = finance.reduce((s: number, d: any) => s + (d.revenue || 0), 0);
    const totalSpend = finance.reduce((s: number, d: any) => s + (d.adSpend || 0), 0);
    const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0;
 
    const prompt = `Eres el Agente Jefe de EcomBoom. Análisis semanal de la tienda ${store.name}.
    Datos de la semana: Revenue €${totalRevenue.toFixed(2)}, Ad Spend €${totalSpend.toFixed(2)}, ROAS ${roas.toFixed(2)}x.
    Genera un análisis ejecutivo con: 1) Estado general, 2) Alertas críticas, 3) Tres acciones prioritarias para esta semana.`;
 
    const result = await AiRouter.dispatch(store.id, TaskType.DIRECTOR_STRATEGY, prompt, {});
    results.push({ storeId: store.id, storeName: store.name, analysis: result.text });
  }
 
  return NextResponse.json({ ok: true, results, timestamp: new Date().toISOString() });
}
