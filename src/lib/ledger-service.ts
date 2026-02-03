"use server";

import prisma from "./prisma";

export async function recordOrderFinances(orderId: string) {
    try {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                items: {
                    include: {
                        product: {
                            include: { finance: true }
                        }
                    }
                }
            }
        });

        if (!order) return;

        // Clean existing entries for this order before re-calculating (idempotency)
        await prisma.ledgerEntry.deleteMany({
            where: { orderId: order.id }
        });

        const entries = [];

        // 1. REVENUE (PVP Final)
        entries.push({
            storeId: order.storeId,
            orderId: order.id,
            date: order.createdAt,
            type: 'INCOME',
            category: 'REVENUE',
            amount: order.totalPrice,
            description: `Ingreso Venta Pedido #${order.orderNumber}`
        });

        // 2. COGS (Coste de Producto)
        let totalCogs = 0;
        for (const item of order.items) {
            const unitCost = item.product?.finance?.unitCost || 0;
            totalCogs += unitCost * item.quantity;
        }
        if (totalCogs > 0) {
            entries.push({
                storeId: order.storeId,
                orderId: order.id,
                date: order.createdAt,
                type: 'EXPENSE',
                category: 'COGS',
                amount: -totalCogs,
                description: `Coste de Mercancía Pedido #${order.orderNumber}`
            });
        }

        // 3. COMMISSIONS (Pasarela de Pago - Estimado Stripe 2% + 0.25)
        // If COD, commission might be 0 or different.
        const paymentFee = order.paymentMethod === 'COD' ? 0 : (order.totalPrice * 0.02) + 0.25;
        if (paymentFee > 0) {
            entries.push({
                storeId: order.storeId,
                orderId: order.id,
                date: order.createdAt,
                type: 'EXPENSE',
                category: 'STRIPE_FEE',
                amount: -paymentFee,
                description: `Comisión de Pago Pedido #${order.orderNumber}`
            });
        }

        // 4. TAXES (IVA/VAT desglosado)
        // Default 21% (Spain) if country is ES or not specified
        const vatRate = 0.21;
        const vatAmount = order.totalPrice - (order.totalPrice / (1 + vatRate));
        entries.push({
            storeId: order.storeId,
            orderId: order.id,
            date: order.createdAt,
            type: 'EXPENSE',
            category: 'VAT',
            amount: -vatAmount,
            description: `IVA Soportado (${(vatRate * 100).toFixed(0)}%) Pedido #${order.orderNumber}`,
            metadata: JSON.stringify({ rate: vatRate, type: "INCLUDED_IN_PRICE" })
        });

        // 5. LOGISTICS (Shipping + Packaging)
        const shipping = order.estimatedLogisticsCost || 5.0; // Default estimate
        const packaging = 0.60; // Standard box cost
        entries.push({
            storeId: order.storeId,
            orderId: order.id,
            date: order.createdAt,
            type: 'EXPENSE',
            category: 'LOGISTICS',
            amount: -(shipping + packaging),
            description: `Gasto de Envío y Packing Pedido #${order.orderNumber}`,
            metadata: JSON.stringify({ shipping, packaging })
        });

        // Save entry log
        await prisma.ledgerEntry.createMany({
            data: entries
        });

        return { success: true };
    } catch (e) {
        console.error("Ledger Error:", e);
        return { success: false, error: "Failed to record finances" };
    }
}

export async function getDailyBreakdown(date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const entries = await prisma.ledgerEntry.findMany({
        where: {
            date: {
                gte: startOfDay,
                lte: endOfDay
            }
        }
    });

    const summary = {
        revenue: 0,
        cogs: 0,
        marketing: 0, // Need to fetch from CreativeAsset or Expense
        logistics: 0,
        fees: 0,
        taxes: 0,
        netProfit: 0
    };

    entries.forEach(e => {
        if (e.category === 'REVENUE') summary.revenue += e.amount;
        if (e.category === 'COGS') summary.cogs += Math.abs(e.amount);
        if (e.category === 'LOGISTICS') summary.logistics += Math.abs(e.amount);
        if (e.category === 'STRIPE_FEE') summary.fees += Math.abs(e.amount);
        if (e.category === 'VAT') summary.taxes += Math.abs(e.amount);
    });

    summary.netProfit = summary.revenue - summary.cogs - summary.logistics - summary.fees - summary.taxes;

    return summary;
}
