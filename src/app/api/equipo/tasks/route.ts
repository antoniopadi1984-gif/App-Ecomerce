import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
 
export async function GET(req: NextRequest) {
  const storeId = req.nextUrl.searchParams.get('storeId');
  if (!storeId) return NextResponse.json({ error: 'storeId required' }, { status: 400 });
  const tasks = await (prisma as any).task.findMany({
    where: { storeId },
    orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    take: 100
  });
  return NextResponse.json({ tasks });
}
 
export async function POST(req: NextRequest) {
  const { storeId, title, description, assignedTo, priority, dueDate, orderId } = await req.json();
  if (!storeId || !title) return NextResponse.json({ error: 'storeId y title requeridos' }, { status: 400 });
  const task = await (prisma as any).task.create({
    data: { storeId, title, description, assignedTo, priority: priority || 'MEDIUM',
            dueDate: dueDate ? new Date(dueDate) : null, orderId }
  });
  return NextResponse.json(task);
}
