"use server";

import prisma from "./prisma";

/**
 * WhatsApp Service (Meta Cloud API Official Integration)
 * Standardizes sending and cost tracking per Meta's Conversation-Based Pricing.
 */

export type WhatsAppCategory = 'MARKETING' | 'UTILITY' | 'AUTHENTICATION' | 'SERVICE';

const PRICING: Record<WhatsAppCategory, number> = {
    MARKETING: 0.11,
    UTILITY: 0.05,
    AUTHENTICATION: 0.03,
    SERVICE: 0.04
};

export async function sendOfficialWhatsApp(data: {
    phoneNumber: string;
    content: string;
    category: WhatsAppCategory;
    orderId?: string;
    storeId: string;
    whatsappAccountId?: string;
    isAi?: boolean;
}) {
    try {
        // 0. Configuration & Validation
        if (!data.phoneNumber || data.phoneNumber === "") {
            return { success: false, error: "Número de teléfono del destinatario no configurado" };
        }

        const account = data.whatsappAccountId
            ? await (prisma as any).whatsAppAccount.findUnique({ where: { id: data.whatsappAccountId } })
            : await (prisma as any).whatsAppAccount.findFirst({ where: { isActive: true } });

        if (!account) {
            return { success: false, error: "No hay ninguna cuenta de WhatsApp configurada o activa en el sistema" };
        }

        const cost = PRICING[data.category];

        // 1. OFFICIAL META API CALL
        const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
        const accessToken = account.accessToken || process.env.WHATSAPP_ACCESS_TOKEN;
        
        if (!phoneNumberId || !accessToken) {
          return { success: false, error: 'WHATSAPP_PHONE_NUMBER_ID o WHATSAPP_ACCESS_TOKEN no configurados en .env' };
        }
        
        const waResponse = await fetch(
          `https://graph.facebook.com/v25.0/${phoneNumberId}/messages`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              to: data.phoneNumber,
              type: 'text',
              text: { body: data.content }
            })
          }
        );
        
        if (!waResponse.ok) {
          const errBody = await waResponse.json().catch(() => ({}));
          console.error('[WHATSAPP] API Error:', errBody);
          return { success: false, error: `Meta API error: ${errBody?.error?.message || waResponse.statusText}` };
        }
        
        const waData = await waResponse.json();
        console.log(`[META ${data.category}] Sent to ${data.phoneNumber} | WA msg id: ${waData.messages?.[0]?.id}`);

        // 2. Persist Message with Status & Cost
        const msg = await (prisma as any).message.create({
            data: {
                orderId: data.orderId,
                customerContact: data.phoneNumber,
                sender: data.isAi ? 'AI' : 'AGENT',
                content: data.content,
                channel: 'WHATSAPP',
                whatsappAccountId: data.whatsappAccountId,
                status: 'SENT',
                cost: cost,
                isRead: true,
                timestamp: new Date()
            }
        });

        // 3. Update DAILY FINANCE
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        await (prisma as any).dailyFinance.upsert({
            where: {
                storeId_date: {
                    storeId: data.storeId,
                    date: today
                }
            },
            update: {
                communicationCost: { increment: cost }
            },
            create: {
                storeId: data.storeId,
                date: today,
                communicationCost: cost
            }
        });

        return { success: true, messageId: msg.id, cost };
    } catch (error) {
        console.error("[WHATSAPP SERVICE ERROR]:", error);
        return { success: false, error: "Failed to send official message" };
    }
}
