
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { BeepingClient } from "@/lib/beeping";
import { recordOrderEvent } from "@/lib/logistics-engine";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
    try {
        const payload = await req.json();

        // Beeping typically sends: { event: "order_updated", data: { ...order_details... } }
        // Or sometimes just the order object depending on config.
        // Let's assume standard payload.

        const data = payload.data || payload;
        const shopifyId = data.external_id || data.order_id; // Beeping maps Shopify ID to external_id usually

        if (!shopifyId) {
            return NextResponse.json({ success: false, message: "No external_id found" }, { status: 400 });
        }

        console.log(`[Beeping Webhook] Received update for ${shopifyId}`);

        // Find Order
        const order = await prisma.order.findUnique({
            where: { shopifyId: shopifyId.toString() }
        });

        if (!order) {
            console.warn(`[Beeping Webhook] Order ${shopifyId} not found locally.`);
            return NextResponse.json({ success: true, message: "Order not found, ignored" });
        }

        // Map Status
        const mappedStatus = BeepingClient.mapStatus(data);

        const trackingCode = data.tracking_number || data.tracking_code;
        const trackingUrl = data.tracking_url;

        // Update DB
        const updatedOrder = await prisma.order.update({
            where: { id: order.id },
            data: {
                logisticsStatus: mappedStatus,
                ...(trackingCode ? { trackingCode } : {}),
                ...(trackingUrl ? { trackingUrl } : {}),
                // Accounting fields from Beeping Webhook
                shippingCost: data.shipping_cost ? parseFloat(data.shipping_cost) : order.shippingCost,
                // capturing more fields if available
                finalStatus: (mappedStatus === 'DELIVERED' || mappedStatus === 'RETURNED' || mappedStatus === 'RETURN_TO_SENDER') ? mappedStatus : order.finalStatus,
                // If delivered, set dates
                ...(mappedStatus === 'DELIVERED' ? { deliveredAt: new Date() } : {}),
                ...(mappedStatus === 'RETURNED' || mappedStatus === 'RETURN_TO_SENDER' ? { returnedAt: new Date() } : {})
            }
        });

        // Recalculate profit for accounting (Imported from logistics-engine below)
        const { calculateOrderProfit } = await import("@/lib/logistics-engine");
        await calculateOrderProfit(updatedOrder.id);

        // [FASE 5] Trigger Content Delivery Automations
        const { DeliveryEngine } = await import("@/lib/marketing/contents/delivery-engine");
        await DeliveryEngine.onOrderStatusChange(order.id, mappedStatus);

        // Record Event
        await recordOrderEvent({
            orderId: order.id,
            source: 'BEEPING',
            type: 'WEBHOOK_UPDATE',
            externalEventId: `hook-${Date.now()}`,
            description: `Actualización automática Beeping: ${mappedStatus}`,
            payload: payload
        });

        revalidatePath("/pedidos");
        revalidatePath("/logistics/dashboard");

        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error("[Beeping Webhook Error]", e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
