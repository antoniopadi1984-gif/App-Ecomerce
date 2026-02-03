
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const db = prisma as any;
        const rules = await db.fulfillmentRule.findMany();

        // Seed if empty
        if (rules.length === 0) {
            const seed = [
                { provider: 'BEEPING', country: 'ES', baseShippingCost: 6.5, codFeeFixed: 1.5, codFeePercent: 3, taxPercent: 21 },
                { provider: 'DROPEA', country: 'ES', baseShippingCost: 5.9, codFeeFixed: 1.0, codFeePercent: 2, taxPercent: 21 },
            ];
            await db.fulfillmentRule.createMany({ data: seed });
            return NextResponse.json(seed);
        }

        return NextResponse.json(rules);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const data = await req.json();
        const db = prisma as any;

        const rule = await db.fulfillmentRule.upsert({
            where: { id: data.id || 'new' },
            update: data,
            create: { ...data, storeId: (await prisma.store.findFirst())?.id }
        });

        return NextResponse.json(rule);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
