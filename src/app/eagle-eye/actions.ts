"use server";

import prisma from "@/lib/prisma";

export async function getEagleEyeStats() {
    // 1. Sales & Marketing
    const orders = await prisma.order.findMany();
    const totalRevenue = orders.reduce((acc, o) => acc + o.totalPrice, 0);
    const totalOrders = orders.length;

    // 4. Creative Performance Summary & Spend Calculation
    const creatives = await prisma.creativeAsset.findMany();
    const winningCreatives = creatives.filter(c => c.verdict === "ESCALAR").length;

    // Calculate Real Spend from Creatives
    const adSpend = creatives.reduce((acc, c) => acc + c.spend, 0);
    const roas = adSpend > 0 ? totalRevenue / adSpend : 0;

    // 2. Logistics & Delivery (Based on real delivery status)
    const deliveredOrders = orders.filter(o => o.logisticsStatus?.toLowerCase() === "entregado" || o.status === "DELIVERED");
    const deliveryRate = totalOrders > 0 ? deliveredOrders.length / totalOrders : 0;
    const incisions = orders.filter(o => o.incidenciaType).length;

    // 3. Profitability (Real CPA)
    const realCPA = deliveredOrders.length > 0 ? adSpend / deliveredOrders.length : 0;

    return {
        sales: {
            revenue: totalRevenue,
            orders: totalOrders,
            spend: adSpend,
            roas: roas,
            sessions: 15400, // Dummy for now
            conversionRate: (totalOrders / 15400) * 100
        },
        logistics: {
            delivered: deliveredOrders.length,
            deliveryRate: deliveryRate * 100,
            incidences: incisions,
            returns: 5 // Dummy
        },
        creatives: {
            total: creatives.length,
            winners: winningCreatives,
            winRate: creatives.length > 0 ? (winningCreatives / creatives.length) * 100 : 0
        },
        performance: {
            realCPA: realCPA,
            targetCPA: 15 // Example target
        }
    };
}
