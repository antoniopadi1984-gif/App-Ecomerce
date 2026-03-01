import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const headers = req.headers;

        // Identify Provider
        const userAgent = headers.get("user-agent")?.toLowerCase() || "";
        const shopifyTopic = headers.get("x-shopify-topic");
        const beepingSignature = headers.get("x-beeping-signature");

        let provider = "UNKNOWN";

        if (shopifyTopic) provider = "SHOPIFY";
        else if (beepingSignature) provider = "BEEPING";
        else if (body.event_type && body.data) provider = "DROPI"; // Common webhook pattern for Dropi

        console.log(`[Webhook] Received from ${provider}:`, body);

        // Business Logic based on Provider
        switch (provider) {
            case "SHOPIFY":
                await handleShopifyWebhook(shopifyTopic!, body);
                break;
            case "BEEPING":
                await handleBeepingWebhook(body);
                break;
            case "DROPI":
                await handleDropiWebhook(body);
                break;
            default:
                // Generic handler or logging
                break;
        }

        return NextResponse.json({ status: "success", provider });
    } catch (error) {
        console.error("[Webhook Error]:", error);
        return NextResponse.json({ status: "error", message: "Failed to process webhook" }, { status: 500 });
    }
}

// Handler Logic
async function handleShopifyWebhook(topic: string, data: any) {
    console.log(`[Shopify Webhook] Processing topic: ${topic}`);

    if (topic === "orders/create" || topic === "orders/updated") {
        const shopifyId = data.id.toString();

        const connection = await prisma.connection.findFirst({ where: { provider: "SHOPIFY" } });
        if (!connection) return;

        // Determine Store ID robustly
        let storeId = connection.storeId;
        const storeExists = await prisma.store.findUnique({ where: { id: storeId } });

        if (!storeExists) {
            console.error(`[Webhook] Target store ${storeId} not found for provider SHOPIFY`);
            return;
        }

        // Detect Logistics Provider (Priority: Line Item Service > Fulfillment Company > Manual)
        let detectedProvider = "MANUAL";
        const firstLine = data.line_items?.[0];
        const service = firstLine?.fulfillment_service;
        if (service) {
            const s = service.toLowerCase();
            if (s.includes('beeping')) detectedProvider = "BEEPING";
            else if (s.includes('dropea')) detectedProvider = "DROPEA";
            else if (s.includes('dropi')) detectedProvider = "DROPI";
            else if (s.includes('amazon')) detectedProvider = "AMAZON";
            else if (s !== "manual") detectedProvider = service.toUpperCase();
        }

        // UTM Extraction Logic
        const extractUtms = (data: any) => {
            const utms: any = {};

            // 1. From landing_site (Typical for Ads)
            if (data.landing_site) {
                try {
                    const url = new URL(data.landing_site, "http://placeholder.com");
                    const params = url.searchParams;
                    utms.source = params.get('utm_source') || params.get('source');
                    utms.medium = params.get('utm_medium') || params.get('medium');
                    utms.campaign = params.get('utm_campaign') || params.get('campaign');
                    utms.content = params.get('utm_content') || params.get('content'); // Often Ad ID or name
                    utms.term = params.get('utm_term') || params.get('term'); // Often AdSet ID or name
                    utms.adId = params.get('utm_id') || params.get('ad_id');
                } catch (e) { }
            }

            // 2. From note_attributes (Backup - some themes capture these)
            if (data.note_attributes) {
                data.note_attributes.forEach((attr: any) => {
                    const name = attr.name.toLowerCase();
                    if (name.includes('utm_source')) utms.source = utms.source || attr.value;
                    if (name.includes('utm_medium')) utms.medium = utms.medium || attr.value;
                    if (name.includes('utm_campaign')) utms.campaign = utms.campaign || attr.value;
                    if (name.includes('utm_content')) utms.content = utms.content || attr.value;
                    if (name.includes('utm_term')) utms.term = utms.term || attr.value;
                    if (name.includes('ad_id')) utms.adId = utms.adId || attr.value;
                });
            }

            return utms;
        };

        const utms = extractUtms(data);

        // Upsert order in our DB
        const order = await prisma.order.upsert({
            where: { shopifyId },
            update: {
                totalPrice: parseFloat(data.total_price),
                financialStatus: data.financial_status,
                logisticsProvider: detectedProvider,
                customerPhone: data.customer?.phone || data.shipping_address?.phone,
                customerEmail: data.customer?.email || data.contact_email,
                addressLine1: data.shipping_address?.address1,
                city: data.shipping_address?.city,
                zip: data.shipping_address?.zip,
                province: data.shipping_address?.province,
                rawJson: JSON.stringify(data),
                status: (data.financial_status === "paid" || detectedProvider === "BEEPING") ? "CONFIRMED" : "PENDING",
                // Attribution Mapping
                source: utms.source,
                medium: utms.medium,
                campaign: utms.campaign,
                content: utms.content,
                term: utms.term,
                adId: utms.adId,
                adsetId: utms.term // Map term to adsetId as fallback
            },
            create: {
                storeId: storeId,
                shopifyId,
                orderNumber: data.name,
                customerName: `${data.customer?.first_name || ""} ${data.customer?.last_name || ""}`.trim(),
                customerEmail: data.customer?.email || data.contact_email,
                customerPhone: data.customer?.phone || data.shipping_address?.phone,
                totalPrice: parseFloat(data.total_price),
                addressLine1: data.shipping_address?.address1 || "",
                city: data.shipping_address?.city || "",
                province: data.shipping_address?.province || "",
                zip: data.shipping_address?.zip || "",
                country: data.shipping_address?.country || "",
                status: (data.financial_status === "paid" || detectedProvider === "BEEPING") ? "CONFIRMED" : "PENDING",
                logisticsProvider: detectedProvider,
                rawJson: JSON.stringify(data),
                // Attribution Mapping
                source: utms.source,
                medium: utms.medium,
                campaign: utms.campaign,
                content: utms.content,
                term: utms.term,
                adId: utms.adId,
                adsetId: utms.term
            }
        });

        // Automatic Geocoding & Address Validation
        const { autoGeocodeOrder } = await import("@/lib/geocoding");
        await autoGeocodeOrder(order.id);

        // IMMEDIATE DISPATCH TO BEEPING (Regardless of Payment Status)
        if (detectedProvider === "BEEPING") {
            try {
                const { pushOrderToBeeping } = await import("@/app/operaciones/pedidos/actions");
                console.log(`[Webhook] Auto-dispatching Order ${order.orderNumber} to BEEPING...`);
                await pushOrderToBeeping(order.id);
            } catch (dispatchErr) {
                console.error("[Webhook] Failed to auto-dispatch to Beeping:", dispatchErr);
            }
        }

        // CRITICAL FIX: Sync Line Items for Statistics
        const { syncOrderItemsAndProducts } = await import("@/app/operaciones/pedidos/actions");
        await syncOrderItemsAndProducts(data, order.id, storeId);
    }
}

async function handleBeepingWebhook(data: any) {
    console.log(`[Beeping Webhook] Order Update:`, data);

    const externalId = data.external_id || data.shopify_id;
    if (!externalId) return;

    const order = await prisma.order.findUnique({ where: { shopifyId: externalId.toString() } });
    if (!order) return;

    const { syncSingleOrderBeeping } = await import("@/app/operaciones/pedidos/actions");
    await syncSingleOrderBeeping(order.id);
}

async function handleDropiWebhook(data: any) {
    // Logic for dropshipping sync
}
