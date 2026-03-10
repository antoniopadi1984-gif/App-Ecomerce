import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
 
export async function GET(req: NextRequest) {
  const productId = req.nextUrl.searchParams.get('productId');
  const step = req.nextUrl.searchParams.get('step'); // P1, P2, P3, P4, P5
  if (!productId) return NextResponse.json({ error: 'productId required' }, { status: 400 });
 
  const query: any = { where: { productId }, orderBy: { createdAt: 'desc' } };
  if (step) query.where.stepKey = step;
 
  const steps = await prisma.researchStep.findMany({ ...query, take: step ? 1 : 10 });
 
  const results = steps.map((s: any) => ({
    stepKey: s.stepKey,
    outputJson: s.outputJson ? JSON.parse(s.outputJson) : null,
    outputText: s.outputText,
    createdAt: s.createdAt
  }));
 
  return NextResponse.json({ results, total: results.length });
}
