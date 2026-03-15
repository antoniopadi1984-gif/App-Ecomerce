import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
    const { storeId, phoneNumberId, accessToken, businessId } = await req.json();
    if (!storeId) return NextResponse.json({ error: 'storeId requerido' }, { status: 400 });

    await (prisma as any).connection.upsert({
        where: { storeId_provider: { storeId: storeId, provider: 'WHATSAPP' } },
        create: {
            storeId,
            provider: 'WHATSAPP',
            secretEnc: accessToken,
            accessToken,
            isActive: true,
            extraConfig: JSON.stringify({ phoneNumberId, businessId, accessToken })
        },
        update: {
            secretEnc: accessToken,
            accessToken,
            isActive: true,
            extraConfig: JSON.stringify({ phoneNumberId, businessId, accessToken })
        }
    });

    return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
    const storeId = req.nextUrl.searchParams.get('storeId') || req.headers.get('X-Store-Id') || 'store-main';

    const conn = await (prisma as any).connection.findFirst({
        where: { storeId, provider: 'WHATSAPP', isActive: true },
        select: { extraConfig: true, isActive: true, createdAt: true }
    });

    if (!conn) return NextResponse.json({ configured: false });

    const config = JSON.parse(conn.extraConfig || '{}');
    return NextResponse.json({
        configured: true,
        phoneNumberId: config.phoneNumberId,
        businessId: config.businessId,
        hasToken: !!config.accessToken
    });
}
