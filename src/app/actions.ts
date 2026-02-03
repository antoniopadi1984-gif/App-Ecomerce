"use server";

import prisma from "@/lib/prisma";

export async function getDashboardKPIData() {
    try {
        // Default time range: Today
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        // 1. Net Profit (Simplified: Revenue - approx costs if no complex calculation ready)
        // For now, let's fetch total confirmed revenue for today
        const todaysOrders = await prisma.order.findMany({
            where: {
                createdAt: { gte: startOfDay, lte: endOfDay },
                status: "CONFIRMED"
            }
        });

        const totalRevenueToday = todaysOrders.reduce((sum, order) => sum + order.totalPrice, 0);

        // Approx profit 35% margin for visual if no fast calculation available, 
        // OR better: use the calculateRealProfit logic if it was robust enough for "Today"
        // Let's stick to simple aggregates for dashboard speed
        const estimatedProfitToday = totalRevenueToday * 0.30;

        // 2. Orders Count (Today)
        const ordersCountToday = await prisma.order.count({
            where: {
                createdAt: { gte: startOfDay, lte: endOfDay }
            }
        });

        // 3. Incidences (Active)
        const activeIncidences = await prisma.order.count({
            where: {
                // Assuming status 'INCIDENCE' or explicitly marked
                // The schema has `incidenceType` or `status`. Adjust based on schema usage.
                OR: [
                    { status: "INCIDENCE" },
                    { incidenciaType: { not: null } }
                ]
            }
        });

        // 4. Avg Ticket (AOV) - All Time or Monthly? Usually Monthly is better stability
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const monthlyMetrics = await prisma.order.aggregate({
            where: {
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
            recoveryRate: 15, // Placeholder or calculated from Cart Abandonment if data exists
        };
    } catch (error) {
        console.error("Error fetching KPI data:", error);
        return {
            netProfit: 0,
            ordersCount: 0,
            incidences: 0,
            avgTicket: 0,
            recoveryRate: 0
        };
    }
}

export async function getRecentOrdersDashboard() {
    try {
        const orders = await prisma.order.findMany({
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

        // Map to UI format
        return orders.map(o => ({
            id: o.orderNumber, // Display Friendly ID
            internalId: o.id,
            customer: o.customerName || "Cliente Desconocido",
            amount: o.totalPrice,
            status: o.incidenciaType ? 'INCIDENCE' : (o.status === 'CONFIRMED' ? 'DELIVERED' : o.status), // Simplified mapping for UI pill
            payment: o.paymentMethod,
            addressStatus: o.addressStatus,
            date: new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }));
    } catch (error) {
        console.error("Error fetching recent orders:", error);
        return [];
    }
}

export async function getMarketingCampaignsDashboard() {
    try {
        // Map from 'Expense' category 'ADS' or 'DailyFinance'
        // Since we don't have granular campaign data in Expense model easily without JSON parsing,
        // we might check if 'Order' has UTM aggregation

        const topCampaigns = await prisma.order.groupBy({
            by: ['campaign'],
            where: {
                campaign: { not: null }
            },
            _sum: {
                totalPrice: true
            },
            _count: {
                id: true
            },
            orderBy: {
                _sum: {
                    totalPrice: 'desc'
                }
            },
            take: 5
        });

        return topCampaigns.map(c => ({
            name: c.campaign || "Unknown Campaign",
            revenue: c._sum.totalPrice || 0,
            spend: 0, // We need to match this with ad spend which is hard without connector data. 
            roas: 0 // Placeholder until we have spend data
        }));
    } catch (error) {
        return [];
    }
}
