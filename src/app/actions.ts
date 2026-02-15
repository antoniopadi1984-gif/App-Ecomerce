"use server";

import prisma from "@/lib/prisma";

export async function getDashboardKPIData(storeId?: string) {
    try {
        // Resolver store
        const resolvedStoreId = storeId || (await prisma.store.findFirst())?.id;
        if (!resolvedStoreId) return { netProfit: 0, ordersCount: 0, incidences: 0, avgTicket: 0, recoveryRate: 0 };

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const todaysOrders = await prisma.order.findMany({
            where: {
                storeId: resolvedStoreId,
                createdAt: { gte: startOfDay, lte: endOfDay },
                status: "CONFIRMED"
            }
        });

        const totalRevenueToday = todaysOrders.reduce((sum, order) => sum + order.totalPrice, 0);
        const estimatedProfitToday = totalRevenueToday * 0.30;

        const ordersCountToday = await prisma.order.count({
            where: {
                storeId: resolvedStoreId,
                createdAt: { gte: startOfDay, lte: endOfDay }
            }
        });

        const activeIncidences = await prisma.order.count({
            where: {
                storeId: resolvedStoreId,
                OR: [
                    { status: "INCIDENCE" },
                    { incidenciaType: { not: null } }
                ]
            }
        });

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const monthlyMetrics = await prisma.order.aggregate({
            where: {
                storeId: resolvedStoreId,
                createdAt: { gte: startOfMonth }
            },
            _avg: { totalPrice: true },
            _count: { id: true }
        });

        return {
            netProfit: estimatedProfitToday,
            ordersCount: ordersCountToday,
            incidences: activeIncidences,
            avgTicket: monthlyMetrics._avg.totalPrice || 0,
            recoveryRate: 15,
        };
    } catch (error) {
        console.error("Error fetching KPI data:", error);
        return { netProfit: 0, ordersCount: 0, incidences: 0, avgTicket: 0, recoveryRate: 0 };
    }
}

export async function getRecentOrdersDashboard(storeId?: string) {
    try {
        const resolvedStoreId = storeId || (await prisma.store.findFirst())?.id;

        const orders = await prisma.order.findMany({
            where: resolvedStoreId ? { storeId: resolvedStoreId } : {},
            take: 5,
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                orderNumber: true,
                customerName: true,
                totalPrice: true,
                status: true,
                paymentMethod: true,
                addressStatus: true,
                createdAt: true,
                incidenciaType: true
            }
        });

        return orders.map(o => ({
            id: o.orderNumber,
            internalId: o.id,
            customer: o.customerName || "Cliente Desconocido",
            amount: o.totalPrice,
            status: o.incidenciaType ? 'INCIDENCE' : (o.status === 'CONFIRMED' ? 'DELIVERED' : o.status),
            payment: o.paymentMethod,
            addressStatus: o.addressStatus,
            date: new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }));
    } catch (error) {
        console.error("Error fetching recent orders:", error);
        return [];
    }
}

export async function getMarketingCampaignsDashboard(storeId?: string) {
    try {
        const resolvedStoreId = storeId || (await prisma.store.findFirst())?.id;

        const topCampaigns = await prisma.order.groupBy({
            by: ['campaign'],
            where: {
                ...(resolvedStoreId ? { storeId: resolvedStoreId } : {}),
                campaign: { not: null }
            },
            _sum: { totalPrice: true },
            _count: { id: true },
            orderBy: { _sum: { totalPrice: 'desc' } },
            take: 5
        });

        return topCampaigns.map(c => ({
            name: c.campaign || "Unknown Campaign",
            revenue: c._sum.totalPrice || 0,
            spend: 0,
            roas: 0
        }));
    } catch (error) {
        return [];
    }
}

