"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getCustomers(query?: string, page = 1, limit = 50) {
    try {
        const where: any = {};
        if (query) {
            where.OR = [
                { name: { contains: query, mode: 'insensitive' } },
                { phone: { contains: query } },
                { email: { contains: query, mode: 'insensitive' } },
            ];
        }

        const [customers, total] = await Promise.all([
            (prisma as any).customer.findMany({
                where,
                take: limit,
                skip: (page - 1) * limit,
                orderBy: { lastOrderAt: 'desc' },
                include: {
                    orders: {
                        select: { id: true, orderNumber: true, status: true, totalPrice: true, createdAt: true }
                    }
                }
            }),
            (prisma as any).customer.count({ where })
        ]);

        return { success: true, data: customers, total };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function getCustomerDetail(customerId: string) {
    try {
        const customer = await (prisma as any).customer.findUnique({
            where: { id: customerId },
            include: {
                orders: {
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!customer) throw new Error("Cliente no encontrado");

        // Fetch conversations (messages linked to any of their orders)
        const orderIds = customer.orders.map((o: any) => o.id);
        const messages = await (prisma as any).message.findMany({
            where: { orderId: { in: orderIds } },
            orderBy: { timestamp: 'asc' }
        });

        return { success: true, data: { ...customer, messages } };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function updateCustomer(customerId: string, data: any) {
    try {
        const updated = await (prisma as any).customer.update({
            where: { id: customerId },
            data
        });
        revalidatePath('/customers');
        return { success: true, data: updated };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

/**
 * Maintenance: Sync customers from orders
 * Run this to populate the Customer table from existing Orders
 */
export async function syncCustomersFromOrders() {
    try {
        const orders = await (prisma as any).order.findMany({
            where: { customerPhone: { not: null } },
            orderBy: { createdAt: 'desc' }
        });

        // Group by phone
        const customerMap = new Map();
        for (const order of orders) {
            if (!customerMap.has(order.customerPhone)) {
                customerMap.set(order.customerPhone, {
                    storeId: order.storeId,
                    name: order.customerName || "Desconocido",
                    email: order.customerEmail,
                    phone: order.customerPhone,
                    addressLine1: order.addressLine1,
                    city: order.city,
                    zip: order.zip,
                    country: order.country,
                    totalOrders: 0,
                    totalSpent: 0,
                    lastOrderAt: order.createdAt,
                    orderIds: []
                });
            }
            const c = customerMap.get(order.customerPhone);
            c.totalOrders += 1;
            c.totalSpent += order.totalPrice || 0;
            c.orderIds.push(order.id);
            if (new Date(order.createdAt) > new Date(c.lastOrderAt)) {
                c.lastOrderAt = order.createdAt;
            }
        }

        // Upsert customers and update orders
        for (const [phone, data] of customerMap.entries()) {
            const customer = await (prisma as any).customer.upsert({
                where: { storeId_phone: { storeId: data.storeId, phone } },
                update: {
                    totalOrders: data.totalOrders,
                    totalSpent: data.totalSpent,
                    avgTicket: data.totalSpent / data.totalOrders,
                    lastOrderAt: data.lastOrderAt
                },
                create: {
                    storeId: data.storeId,
                    name: data.name,
                    email: data.email,
                    phone: data.phone,
                    addressLine1: data.addressLine1,
                    city: data.city,
                    zip: data.zip,
                    country: data.country,
                    totalOrders: data.totalOrders,
                    totalSpent: data.totalSpent,
                    avgTicket: data.totalSpent / data.totalOrders,
                    lastOrderAt: data.lastOrderAt
                }
            });

            // Link orders
            await (prisma as any).order.updateMany({
                where: { id: { in: data.orderIds } },
                data: { customerId: customer.id }
            });
        }

        return { success: true, count: customerMap.size };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}
