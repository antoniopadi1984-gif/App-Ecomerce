import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getMetaAdsService } from '@/lib/marketing/meta-ads';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get('storeId');

    if (!storeId) {
        return NextResponse.json({ error: "Missing storeId" }, { status: 400 });
    }

    try {
        const metaService = await getMetaAdsService(prisma, storeId);
        const accounts = await metaService.getAdAccounts();

        // Sync with BD
        for (const acc of accounts) {
            await (prisma as any).metaAdAccount.upsert({
                where: { storeId_accountId: { storeId, accountId: acc.id } },
                update: {
                    name: acc.name,
                    currency: acc.currency,
                    status: acc.account_status === 1 ? 'ACTIVE' : 'INACTIVE'
                },
                create: {
                    storeId,
                    accountId: acc.id,
                    name: acc.name,
                    currency: acc.currency,
                    status: acc.account_status === 1 ? 'ACTIVE' : 'INACTIVE',
                    isActive: false
                }
            });
        }

        const dbAccounts = await (prisma as any).metaAdAccount.findMany({
            where: { storeId }
        });

        return NextResponse.json({ success: true, accounts: dbAccounts });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { storeId, accountId, isActive } = body;

        if (!storeId || !accountId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const updated = await (prisma as any).metaAdAccount.update({
            where: { storeId_accountId: { storeId, accountId } },
            data: { isActive: !!isActive }
        });

        return NextResponse.json({ success: true, account: updated });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
