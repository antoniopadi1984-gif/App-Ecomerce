import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const storeId = searchParams.get('storeId');

        if (!storeId) {
            return NextResponse.json({ ok: false, error: 'missing storeId' }, { status: 400 });
        }

        const config = await prisma.finanzasConfig.findUnique({
            where: { storeId }
        });

        if (!config) {
            return NextResponse.json({ ok: true, data: null });
        }

        return NextResponse.json({
            ok: true,
            data: {
                thresholds: config.thresholdsJson ? JSON.parse(config.thresholdsJson) : null,
                kpiOrder: config.kpiOrderJson ? JSON.parse(config.kpiOrderJson) : null,
                kpiEnabled: config.kpiEnabledJson ? JSON.parse(config.kpiEnabledJson) : null,
            }
        });
    } catch (e: any) {
        return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { storeId, thresholds, kpiOrder, kpiEnabled } = body;

        if (!storeId) {
            return NextResponse.json({ ok: false, error: 'missing storeId' }, { status: 400 });
        }

        const updateData: any = {};
        if (thresholds !== undefined) updateData.thresholdsJson = JSON.stringify(thresholds);
        if (kpiOrder !== undefined) updateData.kpiOrderJson = JSON.stringify(kpiOrder);
        if (kpiEnabled !== undefined) updateData.kpiEnabledJson = JSON.stringify(kpiEnabled);

        const config = await prisma.finanzasConfig.upsert({
            where: { storeId },
            update: updateData,
            create: {
                storeId,
                ...updateData
            }
        });

        return NextResponse.json({ ok: true });
    } catch (e: any) {
        return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
    }
}
