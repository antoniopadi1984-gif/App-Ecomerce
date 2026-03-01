"use server";

import { revalidatePath } from "next/cache";
import { getCustomerHistory } from "@/lib/logistics-engine";
import prisma from "@/lib/prisma";
import { processClowdbotMessage } from "@/lib/clowdbot-engine";

export interface ChatSession {
    id: string; // Order ID
    customerName: string;
    customerPhone: string;
    orderNumber: string;
    lastMessage: string;
    lastMessageAt: Date;
    status: string;
    unreadCount: number;
    aiMode: boolean;
    whatsappAccountId?: string;
    riskScore?: number;
    riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
    lastMessageCost?: number;
    lastMessageStatus?: string;
}

export interface ChatMessage {
    id: string;
    sender: 'AGENT' | 'CUSTOMER' | 'SYSTEM' | 'AI';
    content: string;
    timestamp: Date;
    isRead: boolean;
    whatsappAccountId?: string;
    status?: string;
    cost?: number;
}

export async function getInboxConversations() {
    try {
        const orders = await (prisma as any).order.findMany({
            where: { customerPhone: { not: null } },
            take: 50, // Increased for better initial view
            orderBy: { updatedAt: 'desc' },
            distinct: ['customerPhone'] // Show one conversation per customer
        });

        const config = await (prisma as any).clowdbotConfig.findFirst();

        const chats: ChatSession[] = await Promise.all(orders.map(async (o: any) => {
            const lastMsg = await (prisma as any).message.findFirst({
                where: { orderId: o.id },
                orderBy: { timestamp: 'desc' }
            });

            return {
                id: o.id,
                customerName: o.customerName || "Desconocido",
                customerPhone: o.customerPhone || "",
                orderNumber: o.orderNumber || "??",
                lastMessage: lastMsg?.content || "Sin mensajes",
                lastMessageAt: lastMsg?.timestamp || o.updatedAt,
                status: o.logisticsStatus || "PENDING",
                unreadCount: 0,
                aiMode: config?.isActive || false,
                revenue: o.totalPrice,
                carrier: o.carrier || "Standard",
                trackingNumber: o.trackingCode,
                email: o.customerEmail,
                whatsappAccountId: lastMsg?.whatsappAccountId,
                riskScore: o.riskScore,
                riskLevel: o.riskLevel,
                lastMessageCost: lastMsg?.cost || 0,
                lastMessageStatus: lastMsg?.status || 'SENT'
            } as any;
        }));

        return { success: true, data: chats };
    } catch (error) {
        console.error("Inbox Fetch Error:", error);
        return { success: false, data: [] };
    }
}

export async function getGlobalCustomers(query?: string) {
    try {
        const where = query ? {
            OR: [
                { customerName: { contains: query } },
                { customerPhone: { contains: query } },
                { customerEmail: { contains: query } },
                { orderNumber: { contains: query } }
            ]
        } : {};

        const orders = await (prisma as any).order.findMany({
            where,
            take: 100,
            orderBy: { createdAt: 'desc' },
            distinct: ['customerPhone']
        });

        return {
            success: true,
            data: orders.map((o: any) => ({
                id: o.id,
                customerName: o.customerName || "Desconocido",
                customerPhone: o.customerPhone || "",
                lastOrderAt: o.createdAt,
                totalSpent: o.totalPrice, // Simplified for now
                status: o.logisticsStatus
            }))
        };
    } catch (e) {
        return { success: false, data: [] };
    }
}

export async function getConversationMessages(orderId: string) {
    try {
        const messages = await (prisma as any).message.findMany({
            where: { orderId },
            orderBy: { timestamp: 'asc' }
        });

        const mapped: ChatMessage[] = messages.map((m: any) => ({
            id: m.id,
            sender: m.sender as any,
            content: m.content,
            timestamp: m.timestamp,
            isRead: m.isRead,
            whatsappAccountId: m.whatsappAccountId,
            status: m.status,
            cost: m.cost
        }));

        return { success: true, data: mapped };
    } catch (e) {
        return { success: false, data: [] };
    }
}

export async function sendWhatsAppMessage(orderId: string, content: string, asAi = false, whatsappAccountId?: string) {
    try {
        const order = await (prisma as any).order.findUnique({ where: { id: orderId } });
        if (!order) throw new Error("Order not found");

        // 1. Send via Official WhatsApp Service
        const { sendOfficialWhatsApp } = await import("@/lib/whatsapp-service");
        const result = await sendOfficialWhatsApp({
            phoneNumber: order.customerPhone || "N/A",
            content: content,
            category: 'SERVICE',
            orderId: order.id,
            storeId: order.storeId,
            whatsappAccountId: whatsappAccountId,
            isAi: asAi
        });

        if (!result.success) throw new Error(result.error);

        return {
            success: true,
            data: {
                id: result.messageId,
                sender: asAi ? 'AI' : 'AGENT',
                content: content,
                timestamp: new Date(),
                isRead: true,
                status: 'SENT',
                cost: result.cost
            }
        };
    } catch (e) {
        console.error("Error sending message:", e);
        return { success: false, error: "Failed to send message" };
    }
}

// SIMULATE INCOMING MESSAGE (For testing Clowdbot)
export async function syncHistoricalData() {
    // 1. Get all configured sheets for this store
    // 2. Fetch rows using GoogleSheetsClient
    // 3. Map columns to Order model (Email, Phone, Status, etc.)
    // 4. Upsert into prisma.order
    return { success: true, message: "Sincronización histórica iniciada" };
}

export async function simulateIncomingMessage(orderId: string, content: string) {
    try {
        const order = await (prisma as any).order.findUnique({ where: { id: orderId } });
        if (!order) return { success: false };

        // 1. Save customer message
        await (prisma as any).message.create({
            data: {
                orderId: order.id,
                customerContact: order.customerPhone || order.customerEmail,
                sender: "CUSTOMER",
                content: content,
                channel: "WHATSAPP",
                isRead: false
            }
        });

        // 2. Process with Clowdbot Engine
        await processClowdbotMessage(orderId, content, "WHATSAPP");

        return { success: true };
    } catch (error) {
        return { success: false };
    }
}

export async function sendTestMessage(phoneNumber: string, content: string) {
    try {
        const store = await (prisma as any).store.findFirst();
        if (!store) throw new Error("Store not found");

        const { sendOfficialWhatsApp } = await import("@/lib/whatsapp-service");
        const result = await sendOfficialWhatsApp({
            phoneNumber,
            content,
            category: 'SERVICE',
            storeId: store.id,
            isAi: false
        });

        if (!result.success) throw new Error(result.error);

        return { success: true, cost: result.cost };
    } catch (error: any) {
        console.error("Error sending test message:", error);
        return { success: false, error: error.message };
    }
}

export async function checkWhatsAppConfig() {
    try {
        const count = await (prisma as any).whatsAppAccount.count({
            where: {
                isActive: true,
                phoneNumber: { not: null },
                accessToken: { not: null }
            }
        });
        return { success: true, count };
    } catch (error) {
        return { success: false, count: 0 };
    }
}

export async function getCustomerFullHistory(orderId: string) {
    try {
        const order = await (prisma as any).order.findUnique({
            where: { id: orderId }
        });
        if (!order) return { success: true, data: [] };

        const history = await getCustomerHistory(order.customerEmail, order.customerPhone);
        return { success: true, data: history };
    } catch (error) {
        return { success: false, data: [] };
    }
}

export async function sendTrackingTrigger(orderId: string) {
    const order = await (prisma as any).order.findUnique({ where: { id: orderId } });
    if (!order) return { success: false };
    const msg = `Hola ${order.customerName}, tu pedido #${order.orderNumber} está EN REPARTO hoy 📦.`;
    return sendWhatsAppMessage(orderId, msg, true);
}
