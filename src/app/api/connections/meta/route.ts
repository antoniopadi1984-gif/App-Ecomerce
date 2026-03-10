import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    if (!storeId) return NextResponse.json({ connected: false });

    const connection = await prisma.connection.findFirst({
        where: { storeId, provider: 'META', isActive: true },
        select: { id: true, isActive: true, lastSyncedAt: true, extraConfig: true }
    });

    if (!connection) return NextResponse.json({ connected: false });

    let config: any = {};
    try { config = JSON.parse(connection.extraConfig || '{}'); } catch { }

    return NextResponse.json({
        connected: true,
        adAccountId: config.adAccountId || null,
        pixelId: config.pixelId || null,
        businessId: config.businessId || null,
        lastSyncedAt: connection.lastSyncedAt,
    });
}

export async function POST(request: Request) {
    try {
        const { storeId, accessToken, adAccountId, pixelId, businessId } = await request.json();

        if (!storeId || !accessToken || !adAccountId) {
            return NextResponse.json(
                { success: false, error: 'storeId, accessToken and adAccountId required' },
                { status: 400 }
            );
        }

        const validateRes = await fetch(
            `https://graph.facebook.com/v25.0/me?access_token=${accessToken}`
        );
        const validateData = await validateRes.json();

        if (validateData.error) {
            return NextResponse.json(
                { success: false, error: `Invalid Meta token: ${validateData.error.message}` },
                { status: 400 }
            );
        }

        const cleanAccountId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;

        const connection = await prisma.connection.upsert({
            where: { storeId_provider: { storeId, provider: 'META' } },
            update: {
                accessToken,
                isActive: true,
                extraConfig: JSON.stringify({ adAccountId: cleanAccountId, pixelId, businessId }),
                lastSyncedAt: new Date(),
            },
            create: {
                storeId,
                provider: 'META',
                accessToken,
                isActive: true,
                extraConfig: JSON.stringify({ adAccountId: cleanAccountId, pixelId, businessId }),
            }
        });

        return NextResponse.json({
            success: true,
            connectionId: connection.id,
            userId: validateData.id,
            userName: validateData.name,
        });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const { storeId } = await request.json();
    await prisma.connection.updateMany({
        where: { storeId, provider: 'META' },
        data: { isActive: false }
    });
    return NextResponse.json({ success: true });
}
