
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { DropeaClient } from "@/lib/dropea";
import { DroppiClient } from "@/lib/dropi";
import { recordOrderEvent } from "@/lib/logistics-engine";

export async function POST(req: NextRequest) {
    try {
        const payload = await req.json();
        const provider = req.nextUrl.searchParams.get("provider")?.toUpperCase(); // ?provider=DROPEA

        if (!provider || !['DROPEA', 'DROPPI'].includes(provider)) {
            return NextResponse.json({ success: false, message: "Invalid provider param" }, { status: 400 });
        }

        console.log(`[${provider} Webhook] Received payload`, payload);

        // Hypothetical Payload Mapping
        // Dropea/Droppi usually send: { order_id, status, tracking... }
        const externalId = payload.order_id || payload.id;
        const statusRaw = payload.status;

        if (!externalId) return NextResponse.json({ success: false, message: "No ID found" });

        // Search by ShopifyId (if mapped) or matching external implementation if we stored it
        // For now, assuming they send back the Shopify Order ID or we search by matching tracking
        const order = await prisma.order.findFirst({
            where: {
                OR: [
                    { shopifyId: externalId.toString() },
                    { trackingCode: payload.tracking_number }
                ]
            }
        });

        if (!order) return NextResponse.json({ success: true, message: "Order not found locally" });

        let mappedStatus = 'PENDING';
        if (provider === 'DROPEA') mappedStatus = DropeaClient.mapStatus(statusRaw);
        if (provider === 'DROPPI') mappedStatus = DroppiClient.mapStatus(statusRaw);

        await prisma.order.update({
            where: { id: order.id },
            data: {
                logisticsStatus: mappedStatus,
                ...(payload.tracking_number ? { trackingCode: payload.tracking_number } : {}),
                ...(payload.tracking_url ? { trackingUrl: payload.tracking_url } : {}),
                ...(mappedStatus === 'DELIVERED' ? { deliveredAt: new Date() } : {}),
                ...(mappedStatus === 'RETURNED' ? { returnedAt: new Date() } : {})
            }
        });

        await recordOrderEvent({
            orderId: order.id,
            source: provider as "DROPPI", // Type assertion is safe due to check above
            type: 'WEBHOOK_UPDATE',
            externalEventId: `hook-${Date.now()}`,
            description: `Actualización ${provider}: ${mappedStatus}`,
            payload: payload
        });

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
