import prisma from "@/lib/prisma";
import { getCarrierTrackingUrl } from "./logistics-engine";

export type TriggerType = 'CONFIRMATION' | 'PREPARATION' | 'TRACKING' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'INCIDENCE';

/**
 * Sends a notification based on a trigger type.
 */
export async function sendNotification(
    orderId: string,
    trigger: TriggerType,
    channel: 'WHATSAPP' | 'EMAIL' = 'WHATSAPP'
) {
    console.log(`[NOTIF] Processing ${trigger} for Order ${orderId} via ${channel}...`);

    // 1. Get Order & Template
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { store: true }
    });
    if (!order) return { success: false, error: "Order not found" };

    const template = await (prisma as any).notificationTemplate.findFirst({
        where: {
            trigger: trigger,
            channel: channel,
            storeId: order.storeId,
            isEnabled: true
        }
    });

    if (!template) {
        console.log(`[NOTIF] No active template found for ${trigger}. Skipping.`);
        return { success: false, error: "No template" };
    }

    // 2. Variable Replacement (Handles both {{var}} and {var})
    let message = template.body;
    const orderNum = order.orderNumber || "";
    const cleanOrderNumber = orderNum.startsWith('#') ? orderNum.slice(1) : orderNum;

    const normalizedTrackingUrl = order.trackingUrl || getCarrierTrackingUrl(order.carrier || "GLS", order.trackingCode || "");

    const replacements: Record<string, string> = {
        'customer_name': order.customerName || 'Cliente',
        'name': order.customerName || 'Cliente',
        'order_number': cleanOrderNumber,
        'tracking': order.trackingCode || 'Pendiente',
        'tracking_url': normalizedTrackingUrl,
        'trackingUrl': normalizedTrackingUrl,
        'product': order.productTitle || 'Pedido'
    };

    for (const [key, val] of Object.entries(replacements)) {
        const regex1 = new RegExp(`{{${key}}}`, 'g');
        const regex2 = new RegExp(`{${key}}`, 'g');
        message = message.replace(regex1, val).replace(regex2, val);
    }

    // 3. Send via Official WhatsApp Service
    const { sendOfficialWhatsApp } = await import("./whatsapp-service");
    await sendOfficialWhatsApp({
        phoneNumber: order.customerPhone || "",
        content: message,
        category: 'UTILITY',
        orderId: orderId,
        storeId: order.storeId,
        isAi: true
    });

    // 4. Update Order Flag
    const updateData: any = {};
    if (trigger === 'CONFIRMATION') updateData.msgConfirmationSent = true;
    if (trigger === 'TRACKING') updateData.msgTrackingSent = true;
    if (trigger === 'OUT_FOR_DELIVERY' || trigger === 'DELIVERED') updateData.msgDeliverySent = true;
    if (trigger === 'INCIDENCE') updateData.msgIncidenceSent = true;

    await prisma.order.update({
        where: { id: orderId },
        data: updateData
    });

    return { success: true, message: "Sent successfully" };
}

export async function createDefaultTemplates(storeId: string) {
    const defaults = [
        {
            name: 'CONFIRMATION',
            trigger: 'CONFIRMATION',
            body: "Hola {{name}}, hemos recibido tu pedido #{{orderNumber}} de {{product}}. En breve lo prepararemos. ¡Gracias por confiar en nosotros!",
            channel: 'WHATSAPP'
        },
        {
            name: 'TRACKING',
            trigger: 'TRACKING',
            body: "¡Buenas noticias {{name}}! Tu pedido #{{orderNumber}} ya ha salido. Tu tracking es: {{tracking}}. Puedes seguirlo aquí: {{trackingUrl}}",
            channel: 'WHATSAPP'
        },
        {
            name: 'OUT_FOR_DELIVERY',
            trigger: 'OUT_FOR_DELIVERY',
            body: "Hola {{name}}, tu pedido está HOY en reparto 🚚. Por favor, estate atento al teléfono/timbre. ¡Que lo disfrutes!",
            channel: 'WHATSAPP'
        },
        {
            name: 'INCIDENCE',
            trigger: 'INCIDENCE',
            body: "Hola {{name}}, hubo un problema con la entrega de tu pedido. Por favor respóndenos para coordinar una nueva entrega.",
            channel: 'WHATSAPP'
        }
    ];

    for (const t of defaults) {
        const exists = await prisma.notificationTemplate.findFirst({
            where: { storeId, name: t.name, channel: t.channel }
        });

        if (!exists) {
            await prisma.notificationTemplate.create({
                data: {
                    storeId,
                    name: t.name,
                    trigger: t.trigger,
                    channel: t.channel,
                    body: t.body,
                    isEnabled: true
                }
            });
        }
    }
}
