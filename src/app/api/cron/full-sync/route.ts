import { NextRequest, NextResponse } from 'next/server';
 
export const runtime = 'nodejs';
export const maxDuration = 300;
 
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
 
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const response = await fetch(`${baseUrl}/api/system/full-sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}) // sync todas las tiendas
  });
 
  const result = await response.json();
  return NextResponse.json({ ok: true, result, timestamp: new Date().toISOString() });
}
