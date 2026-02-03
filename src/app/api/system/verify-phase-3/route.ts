
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { calculateOrderProfit } from "@/lib/finances";
import maintenanceHandler from "@/lib/handlers/maintenance";
import fs from "fs";
import path from "path";

export async function GET() {
    try {
        const results: any = {};
        const db = prisma as any;

        // 1. Profit Test
        const store = await db.store.findFirst();
        const p = await db.product.create({ data: { title: "Test verification", storeId: store.id, finance: { create: { unitCost: 10 } } } });
        const o = await db.order.create({
            data: {
                storeId: store.id, status: 'DELIVERED', logisticsProvider: 'BEEPING', country: 'ES',
                items: { create: { product: { connect: { id: p.id } }, title: 'Test', quantity: 1, price: 50 } }
            }
        });
        const r = await db.fulfillmentRule.create({ data: { provider: 'BEEPING', country: 'ES', baseShippingCost: 5, storeId: store.id } });

        const v1 = await calculateOrderProfit(o.id);
        await db.fulfillmentRule.update({ where: { id: r.id }, data: { baseShippingCost: 20 } });
        const v2 = await calculateOrderProfit(o.id);

        results.profit_recalculation = v1.netProfit !== v2.netProfit;
        results.v1 = v1.netProfit;
        results.v2 = v2.netProfit;

        // 2. Maintenance Safety Test
        const uploadsDir = path.join(process.cwd(), "public/uploads");
        const safeFile = "safe_v.mp4";
        fs.writeFileSync(path.join(uploadsDir, safeFile), "safe");
        await db.adSpyCapture.create({ data: { type: 'VIDEO', platform: 'TIKTOK', url: safeFile } });

        await maintenanceHandler.handle({}, async () => { });
        results.maintenance_safety = fs.existsSync(path.join(uploadsDir, safeFile));

        // Cleanup
        await db.order.delete({ where: { id: o.id } });
        await db.product.delete({ where: { id: p.id } });
        await db.fulfillmentRule.delete({ where: { id: r.id } });
        await db.adSpyCapture.deleteMany({ where: { url: safeFile } });
        if (fs.existsSync(path.join(uploadsDir, safeFile))) fs.unlinkSync(path.join(uploadsDir, safeFile));

        return NextResponse.json(results);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
