import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
 
export async function GET(req: NextRequest) {
  const storeId = req.nextUrl.searchParams.get('storeId');
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');
  if (!storeId) return NextResponse.json({ error: 'storeId required' }, { status: 400 });
  const messages = await (prisma as any).message.findMany({
    where: { order: { storeId } },
    orderBy: { timestamp: 'desc' },
    take: limit,
    include: { order: { select: { orderNumber: true, customerName: true } } }
  });
  return NextResponse.json({ messages });
}
