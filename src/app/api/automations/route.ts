import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
 
export async function GET(req: NextRequest) {
  const storeId = req.nextUrl.searchParams.get('storeId');
  if (!storeId) return NextResponse.json({ error: 'storeId required' }, { status: 400 });
  const rules = await (prisma as any).automationRule.findMany({ where: { storeId } });
  return NextResponse.json({ rules });
}
 
export async function PUT(req: NextRequest) {
  const { storeId, ruleId, isEnabled } = await req.json();
  if (!storeId || !ruleId) return NextResponse.json({ error: 'storeId and ruleId required' }, { status: 400 });
  const rule = await (prisma as any).automationRule.upsert({
    where: { storeId_ruleId: { storeId, ruleId } },
    update: { isEnabled },
    create: { storeId, ruleId, isEnabled }
  });
  return NextResponse.json(rule);
}
