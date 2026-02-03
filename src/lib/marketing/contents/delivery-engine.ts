import { prisma } from "@/lib/prisma";
import { processClowdbotMessage } from "@/lib/clowdbot-engine";

export class DeliveryEngine {
    /**
     * Triggered when an order status changes (SHIPPED, DELIVERED, etc.)
     */
    static async onOrderStatusChange(orderId: string, newStatus: string) {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { store: true }
        });

        if (!order) return;

        // 1. Fetch active campaigns for this trigger
        const campaigns = await (prisma as any).contentCampaign.findMany({
            where: {
                storeId: order.storeId,
                triggerEvent: newStatus,
                isActive: true
            },
            include: { asset: true }
        });

        for (const campaign of campaigns) {
            // 2. Authorization check (If requireApproval is true, we might just tag the order for human review or send a draft)
            // For MVP, we send directly if authorized or notify human
            if (campaign.requireApproval) {
                console.log(`[DeliveryEngine] Campaign ${campaign.name} requires approval for Order ${orderId}`);
                continue;
            }

            // 3. Deliver Content
            await this.deliverAssetToOrder(order, campaign.asset);
        }
    }

    private static async deliverAssetToOrder(order: any, asset: any) {
        try {
            const { sendOfficialWhatsApp } = await import("@/lib/whatsapp-service");

            const message = `¡Hola ${order.customerName}! 🎉 Tenemos un regalo para ti por tu pedido #${order.orderNumber}. 
                             Aquí tienes tu ${asset.name}: http://ecombom.local${asset.fileUrl}`;

            await sendOfficialWhatsApp({
                phoneNumber: order.customerPhone,
                content: message,
                category: 'MARKETING',
                orderId: order.id,
                storeId: order.storeId,
                isAi: true
            });

            // 4. Log Delivery
            await (prisma as any).contentDeliveryLog.create({
                data: {
                    storeId: order.storeId,
                    orderId: order.id,
                    assetId: asset.id,
                    status: 'SENT',
                    channel: 'WHATSAPP'
                }
            });

            console.log(`[DeliveryEngine] Successfully delivered ${asset.name} to ${order.customerPhone}`);
        } catch (error: any) {
            console.error(`[DeliveryEngine] Failed to deliver asset: ${error.message}`);
        }
    }
}
