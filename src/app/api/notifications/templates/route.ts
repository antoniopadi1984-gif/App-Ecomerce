import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createDefaultTemplates } from '@/lib/notifications';
 
export async function GET(req: NextRequest) {
  const storeId = req.nextUrl.searchParams.get('storeId');
  if (!storeId) return NextResponse.json({ error: 'storeId required' }, { status: 400 });
  await createDefaultTemplates(storeId); // idempotente
  const templates = await prisma.notificationTemplate.findMany({ where: { storeId }, orderBy: { trigger: 'asc' } });
  return NextResponse.json({ templates });
}
 
export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { storeId, trigger, channel, body: msgBody, isEnabled, id } = body;
  if (!storeId || !trigger) return NextResponse.json({ error: 'storeId and trigger required' }, { status: 400 });
  const data = { trigger, channel: channel || 'WHATSAPP', body: msgBody, isEnabled: isEnabled ?? true };
  let result;
  if (id) {
    result = await prisma.notificationTemplate.update({ where: { id }, data });
  } else {
    const existing = await prisma.notificationTemplate.findFirst({
      where: { storeId, trigger, channel: channel || 'WHATSAPP' }
    });
    if (existing) {
      result = await prisma.notificationTemplate.update({
        where: { id: existing.id },
        data
      });
    } else {
      result = await prisma.notificationTemplate.create({
        data: { storeId, name: trigger, ...data }
      });
    }
  }
  return NextResponse.json(result);
}
