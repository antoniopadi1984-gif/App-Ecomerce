import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BeepingClient } from '@/lib/beeping';
import { getConnectionSecret } from '@/lib/server/connections';

/**
 * 8.1 GET /api/orders — Vista Unificada de Pedidos
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const storeId = searchParams.get('storeId');

        if (!storeId) {
            return NextResponse.json({ error: "storeId is required" }, { status: 400 });
        }

        const provider = searchParams.get('provider'); // BEEPING|DROPEA|DROPI|SHOPIFY|ALL
        const status = searchParams.get('status');
        const dateFrom = searchParams.get('dateFrom');
        const dateTo = searchParams.get('dateTo');
        const search = searchParams.get('search');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');

        const skip = (page - 1) * limit;

        const where: any = { storeId };

        if (provider && provider !== 'ALL') {
            where.logisticsProvider = provider;
        }

        if (status && status !== 'ALL') {
            where.status = status;
        }

        if (dateFrom || dateTo) {
            where.createdAt = {};
            if (dateFrom) where.createdAt.gte = new Date(dateFrom);
            if (dateTo) where.createdAt.lte = new Date(dateTo);
        }

        if (search) {
            where.OR = [
                { customerName: { contains: search, mode: 'insensitive' } },
                { orderNumber: { contains: search, mode: 'insensitive' } },
                { trackingCode: { contains: search, mode: 'insensitive' } }
            ];
        }

        // 1. Fetch orders with necessary relations
        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where,
                include: {
                    items: true,
                    customer: true,
                    attribution: true
                },
                orderBy: { updatedAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.order.count({ where })
        ]);

        // 2. Process profits and calculate summary
        let totalRevenue = 0;
        let totalProfit = 0;
        const providerCounts: Record<string, number> = {};

        // Para el summary, solemos necesitar el total filtrado, pero el query de findMany está paginado.
        // Si el usuario quiere el summary DE TODOS los pedidos filtrados (no solo de la página),
        // deberíamos hacer un query de agregación por separado.

        // Pero el requerimiento dice "Devolver: { summary: { totalRevenue, totalProfit, byProvider: { BEEPING: count... } } }"
        // Esto usualmente se refiere al total global bajo ese filtro.

        const summaryQuery = await prisma.order.findMany({
            where,
            include: { items: true }
        });

        summaryQuery.forEach(o => {
            totalRevenue += o.totalPrice;

            // Recalcular profit si está ausente
            let profit = o.netProfit;
            if (profit === null || profit === undefined) {
                const itemsCost = o.items.reduce((acc, item) => acc + (item.unitCost * item.quantity), 0);
                profit = o.totalPrice - o.estimatedLogisticsCost - itemsCost;
            }
            totalProfit += profit;

            const prov = o.logisticsProvider || 'UNKNOWN';
            providerCounts[prov] = (providerCounts[prov] || 0) + 1;
        });

        return NextResponse.json({
            orders,
            total,
            page,
            pages: Math.ceil(total / limit),
            summary: {
                totalRevenue,
                totalProfit,
                byProvider: providerCounts
            }
        });

    } catch (error: any) {
        console.error("[API Orders GET]", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * 8.2 POST /api/orders — Crear Pedido Manual
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { storeId, provider, customerName, customerPhone, address, products, totalPrice, paymentMethod } = body;

        if (!storeId || !provider || !customerName || !customerPhone) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        if (provider === 'SHOPIFY') {
            return NextResponse.json({ error: "No es posible crear pedidos manuales para Shopify desde aquí" }, { status: 400 });
        }

        // 1. Crear en DB local
        const order = await prisma.order.create({
            data: {
                storeId,
                customerName,
                customerPhone,
                addressLine1: address,
                totalPrice,
                paymentMethod: paymentMethod || "COD",
                status: "PENDING",
                logisticsProvider: provider,
                items: {
                    create: (products || []).map((p: any) => ({
                        title: p.title || "Producto Manual",
                        sku: p.sku || "",
                        quantity: p.quantity || 1,
                        price: p.price || 0,
                        unitCost: p.unitCost || 0,
                        totalPrice: (p.price || 0) * (p.quantity || 1)
                    }))
                }
            },
            include: { items: true }
        });

        // 2. Notificar al proveedor logístico si es BEEPING
        if (provider === 'BEEPING') {
            const apiKey = await getConnectionSecret(storeId, "BEEPING");
            if (apiKey) {
                const client = new BeepingClient(apiKey);
                try {
                    // Mapear al formato Beeping
                    const beepingPayload = {
                        customer_name: customerName,
                        phone: customerPhone,
                        address: address,
                        city: body.city || "",
                        province: body.province || "",
                        cp: body.zip || body.cp || "",
                        country: body.country || "Spain",
                        price: totalPrice,
                        payment_method_id: paymentMethod === 'COD' ? 1 : 2, // Asunción estándar 1=COD
                        lines: (products || []).map((p: any) => ({
                            sku: p.sku,
                            quantity: p.quantity,
                            price: p.price
                        }))
                    };
                    const bOrder = await client.createOrder(beepingPayload);
                    // Actualizar con ID de Beeping si corresponde
                    if (bOrder && bOrder.id) {
                        await prisma.order.update({
                            where: { id: order.id },
                            data: { orderNumber: String(bOrder.id) }
                        });
                    }
                } catch (be) {
                    console.error("[POST Order] Error creating in Beeping:", be);
                }
            }
        }

        return NextResponse.json(order);

    } catch (error: any) {
        console.error("[API Orders POST]", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
