import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
 
export const dynamic = 'force-dynamic';
 
export async function GET(req: NextRequest, { params }: { params: Promise<{ storeId: string }> | { storeId: string } }) {
  const resolvedParams = await params;
  const { storeId } = resolvedParams;
  const today = new Date(); today.setHours(0,0,0,0);
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
 
  const [store, connections, finance7d, pendingOrders] = await Promise.all([
    prisma.store.findUnique({ where: { id: storeId } }),
    prisma.connection.findMany({ where: { storeId, isActive: true }, select: { provider: true, isActive: true } }),
    (prisma as any).dailyFinance.findMany({ where: { storeId, date: { gte: weekAgo } } }),
    prisma.order.count({ where: { storeId, status: { in: ['PENDING', 'PROCESSING'] } } })
  ]);
 
  const revenue7d = finance7d.reduce((s: number, d: any) => s + (d.revenue || 0), 0);
  const spend7d = finance7d.reduce((s: number, d: any) => s + (d.adSpend || 0), 0);
  const roas7d = spend7d > 0 ? revenue7d / spend7d : 0;
  const orders7d = finance7d.reduce((s: number, d: any) => s + (d.orders || 0), 0);
  const aov7d = orders7d > 0 ? revenue7d / orders7d : 0;
 
  const connMap: Record<string, boolean> = {};
  connections.forEach(c => { connMap[c.provider] = c.isActive; });
 
  return NextResponse.json({
    store: { id: storeId, name: store?.name, currency: store?.currency },
    kpis: {
      revenue7d: Math.round(revenue7d * 100) / 100,
      spend7d: Math.round(spend7d * 100) / 100,
      roas7d: Math.round(roas7d * 100) / 100,
      orders7d,
      aov7d: Math.round(aov7d * 100) / 100,
      pendingOrders
    },
    connections: connMap,
  });
}
