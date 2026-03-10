
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { DropeaClient } from "@/lib/dropea";
import { DropiClient } from "@/lib/dropi";
import { recordOrderEvent } from "@/lib/logistics-engine";

export async function POST(req: NextRequest) {
    try {
        const payload = await req.json();
        const provider = req.nextUrl.searchParams.get("provider")?.toUpperCase(); // ?provider=DROPEA

        if (!provider || !['DROPEA', 'DROPPI', 'DROPI'].includes(provider)) {
            return NextResponse.json({ success: false, message: "Invalid provider param" }, { status: 400 });
        }

        console.log(`[${provider} Webhook] Received payload`, payload);

        // Hypothetical Payload Mapping
        // Dropea/Droppi usually send: { order_id, status, tracking... }
        const externalId = payload.order_id || payload.id;
        const statusRaw = payload.status;

        if (!externalId) return NextResponse.json({ success: false, message: "No ID found" });

        // Search by shopifyId, orderNumber or trackingCode
        const order = await (prisma as any).order.findFirst({
            where: {
                OR: [
                    { shopifyId: externalId.toString() },
                    { orderNumber: externalId.toString() },
                    { trackingCode: payload.tracking_number || payload.tracking_code }
                ],
                logisticsProvider: provider
            }
        });

        if (!order) return NextResponse.json({ success: true, message: "Order not found locally" });

        let mappedStatus = 'PENDING';
        if (provider === 'DROPEA') mappedStatus = DropeaClient.mapStatus(statusRaw);
        if (provider === 'DROPPI' || provider === 'DROPI') mappedStatus = DropiClient.mapStatus(statusRaw);

        await (prisma as any).order.update({
            where: { id: order.id },
            data: {
                logisticsStatus: statusRaw, // Keep raw for reference
                status: mappedStatus,
                ...(payload.tracking_number || payload.tracking_code ? { trackingCode: payload.tracking_number || payload.tracking_code } : {}),
                ...(payload.tracking_url ? { trackingUrl: payload.tracking_url } : {}),
                ...(payload.carrier || payload.courier ? { carrier: payload.carrier || payload.courier } : {}),
                ...(mappedStatus === 'DELIVERED' ? { deliveredAt: new Date() } : {}),
                ...(mappedStatus === 'RETURNED' ? { returnedAt: new Date() } : {})
            }
        });

        await recordOrderEvent({
            orderId: order.id,
            source: provider as any,
            type: 'LOGISTICS_UPDATE',
            description: `Actualización ${provider}: ${mappedStatus} (${statusRaw})`,
            payload: payload
        });

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
