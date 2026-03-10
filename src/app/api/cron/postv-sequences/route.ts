import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendNotification } from '@/lib/notifications';

export const runtime = 'nodejs';
export const maxDuration = 120;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const now = new Date();
  const results: any[] = [];

  // D+3: Enviar ebook a entregas de hace 3 días
  const d3Orders = await prisma.order.findMany({
    where: { status: 'DELIVERED', deliveredAt: { gte: new Date(now.getTime() - 4*24*60*60*1000), lte: new Date(now.getTime() - 3*24*60*60*1000) } }
  });
  for (const order of d3Orders) {
    const meta = JSON.parse(order.rawJson as string || '{}');
    if (!meta.postv_d3_sent) {
      await sendNotification(order.id, 'DELIVERED', 'WHATSAPP').catch(console.error);
      await prisma.order.update({ where: { id: order.id }, data: { rawJson: JSON.stringify({...meta, postv_d3_sent: true}) } });
      results.push({ orderId: order.id, action: 'd3_ebook' });
    }
  }

  // D+7: Solicitar review
  const d7Orders = await prisma.order.findMany({
    where: { status: 'DELIVERED', deliveredAt: { gte: new Date(now.getTime() - 8*24*60*60*1000), lte: new Date(now.getTime() - 7*24*60*60*1000) } }
  });
  for (const order of d7Orders) {
    const meta = JSON.parse(order.rawJson as string || '{}');
    if (!meta.postv_d7_sent) {
      await sendNotification(order.id, 'DELIVERED', 'WHATSAPP').catch(console.error);
      await prisma.order.update({ where: { id: order.id }, data: { rawJson: JSON.stringify({...meta, postv_d7_sent: true}) } });
      results.push({ orderId: order.id, action: 'd7_review' });
    }
  }

  return NextResponse.json({ ok: true, processed: results.length, results });
}
