import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
 
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const { status, assignedTo, title, priority, dueDate } = await req.json();
  const data: any = { updatedAt: new Date() };
  if (status) { data.status = status; if (status === 'DONE') data.completedAt = new Date(); }
  if (assignedTo !== undefined) data.assignedTo = assignedTo;
  if (title) data.title = title;
  if (priority) data.priority = priority;
  if (dueDate) data.dueDate = new Date(dueDate);
  const task = await (prisma as any).task.update({ where: { id: resolvedParams.id }, data });
  return NextResponse.json(task);
}
 
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  await (prisma as any).task.delete({ where: { id: resolvedParams.id } });
  return NextResponse.json({ ok: true });
}
