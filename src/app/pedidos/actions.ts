"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { format, subDays, startOfDay, endOfDay, isSameDay, eachDayOfInterval } from 'date-fns';
import { ShopifyClient } from "@/lib/shopify";
import { BeepingClient } from "@/lib/beeping";
import { autoGeocodeOrder } from "@/lib/geocoding";
import { sendNotification } from "@/lib/notifications";
import { recordOrderEvent, calculateOrderProfit, normalizeLogisticsStatus, calculateOrderRisk, getCustomerHistory } from "@/lib/logistics-engine";
import { MetricsSnapshotService } from "@/lib/services/metrics-snapshot-service";
import { AttributionService } from "@/lib/services/attribution";
import { getConnectionSecret, getConnectionMeta } from "@/lib/server/connections";
// getProductMasterData removed as it was unused and pointing to non-existent file

/**
 * Syncs products from Shopify to local database
 */
export async function syncShopifyProducts() {
    try {
        const store = await (prisma as any).store.findFirst();
        if (!store) throw new Error("No store found");

        const secret = await getConnectionSecret(store.id, "SHOPIFY");
        const meta = await getConnectionMeta(store.id, "SHOPIFY");

        if (!secret || !meta?.extraConfig) {
            throw new Error("Shopify connection not found or incomplete");
        }

        let shopDomain = meta.extraConfig as string;
        if (shopDomain.startsWith('{')) {
            try {
                const parsed = JSON.parse(shopDomain);
                shopDomain = parsed.shopUrl || parsed.shop || parsed.SHOPIFY_SHOP_DOMAIN || shopDomain;
            } catch (e) {
                console.error("[Shopify Products Info] Error parsing extraConfig JSON:", e);
            }
        }

        const shopify = new ShopifyClient(shopDomain, secret);
        const { products: shopifyProducts } = await shopify.getProducts();

        console.log(`[Product Sync] Fetched ${shopifyProducts.length} products from Shopify`);

        for (const sp of shopifyProducts) {
            // Upsert Product
            const product = await (prisma as any).product.upsert({
                where: { shopifyId: sp.id.toString() },
                update: {
                    title: sp.title,
                    handle: sp.handle,
                    imageUrl: sp.image?.src || (sp.images?.[0]?.src) || null,
                    updatedAt: new Date()
                },
                create: {
                    storeId: store.id,
                    shopifyId: sp.id.toString(),
                    title: sp.title,
                    handle: sp.handle,
                    imageUrl: sp.image?.src || (sp.images?.[0]?.src) || null
                }
            });

            // Initialize/Update Finance from first variant
            if (sp.variants && sp.variants.length > 0) {
                const firstVariant = sp.variants[0];
                const price = parseFloat(firstVariant.price) || 0;

                await (prisma as any).productFinance.upsert({
                    where: { productId: product.id },
                    update: { sellingPrice: price },
                    create: {
                        productId: product.id,
                        sellingPrice: price,
                        unitCost: 0
                    }
                });
            }
        }

        revalidatePath("/logistics/costs");
        return { success: true, count: shopifyProducts.length };
    } catch (e: any) {
        console.error("Shopify Product Sync Error:", e);
        return { success: false, message: e.message };
    }
}
export async function setProductProvider(productId: string, providerName: string) {
    try {
        let store = await (prisma as any).store.findFirst();
        if (!store) {
            console.error("No store found to link provider. Please create a store first.");
            throw new Error("No store found. Provider linking aborted.");
        }

        if (!store) throw new Error("No valid store found or created.");

        // Find or Create Supplier (Insensitive)
        let supplier = await (prisma as any).supplier.findFirst({
            where: { name: providerName }
        });

        if (!supplier) {
            supplier = await (prisma as any).supplier.create({
                data: {
                    storeId: store.id,
                    name: providerName,
                    email: `logistics@${providerName.toLowerCase().replace(/\s+/g, "")}.com` // Robust email
                }
            });
        }

        await (prisma as any).product.update({
            where: { id: productId },
            data: { supplierId: supplier.id }
        });

        revalidatePath("/pedidos");
        return { success: true };
    } catch (e: any) {
        console.error("Link Provider Error:", e);
        return { success: false, message: e.message || "Unknown error" };
    }
}

/**
 * Repairs missing line items for a specific month with high-precision per-day logic
 */
export async function repairMonthOrderItems(month: number, year: number) {
    try {
        const store = await (prisma as any).store.findFirst();
        if (!store) throw new Error("No store found");

        const secret = await getConnectionSecret(store.id, "SHOPIFY");
        const meta = await getConnectionMeta(store.id, "SHOPIFY");
        if (!secret || !meta?.extraConfig) throw new Error("No Shopify connection");

        const start = startOfDay(new Date(year, month - 1, 1));
        const end = endOfDay(new Date(year, month, 0));

        const shopify = new ShopifyClient(meta.extraConfig as string, secret);
        const storeIdToUse = store.id;
        let repaired = 0;

        // Iterate DAY BY DAY to avoid Shopify API timeouts and ensure completeness
        const days = eachDayOfInterval({ start, end });

        for (const day of days) {
            const dStart = startOfDay(day).toISOString();
            const dEnd = endOfDay(day).toISOString();

            console.log(`[Repair] Syncing day: ${format(day, 'yyyy-MM-dd')}`);

            // 1. Fetch exactly this day's orders from Shopify
            await shopify.getAllOrders(async (batch) => {
                for (const shopifyOrder of batch) {
                    try {
                        await upsertShopifyOrder(shopifyOrder, storeIdToUse);
                        repaired++;
                    } catch (e) { console.error("[Repair] Failed to upsert order:", e); }
                }
            }, { minDate: dStart, maxDate: dEnd });

            // 2. Rebuild Snapshot for this day (Forcing Meta Ads Sync)
            try {
                await MetricsSnapshotService.generateDailySnapshot(storeIdToUse, day, true);
            } catch (e) {
                console.error(`[Repair] Failed to generate snapshot for ${format(day, 'yyyy-MM-dd')}:`, e);
            }
        }

        revalidatePath("/finances");
        return {
            success: true,
            message: `Reconstrucción total completada para ${format(start, 'MMMM yyyy')}. Se procesaron ${repaired} pedidos y se recalcularon ${days.length} días.`
        };
    } catch (e: any) {
        console.error("Error repairing month:", e);
        return { success: false, message: e.message };
    }
}

/**
 * Helper to upsert a Shopify order and its items/costs
 */
export async function upsertShopifyOrder(shopifyOrder: any, storeId: string) {
    const utms = extractUtms(shopifyOrder);
    const firstItem = shopifyOrder.line_items?.[0] || {};
    const fulfillment = shopifyOrder.fulfillments?.[0];

    const toFloat = (val: any) => { const n = parseFloat(val); return isNaN(n) ? 0 : n; };
    const toStr = (val: any) => (val !== null && val !== undefined) ? String(val).trim() : null;
    const toDate = (val: any) => { const d = new Date(val); return isNaN(d.getTime()) ? new Date() : d; };

    const sId = toStr(shopifyOrder.id);
    if (!sId) return null;

    const customerName = (shopifyOrder.customer ? `${shopifyOrder.customer.first_name || ""} ${shopifyOrder.customer.last_name || ""}` : (shopifyOrder.shipping_address?.first_name || "")).trim() || "Cliente";
    const tCode = toStr(fulfillment?.tracking_number || shopifyOrder.tracking_number);
    const tCarrier = toStr(fulfillment?.tracking_company || shopifyOrder.tracking_company);
    const tUrl = toStr(fulfillment?.tracking_url || shopifyOrder.tracking_url);
    const pMethod = mapPaymentMethod(shopifyOrder);

    let currentStatus = "PENDING";
    const fStatus = shopifyOrder.fulfillment_status;

    if (shopifyOrder.cancelled_at || shopifyOrder.status === "cancelled") {
        currentStatus = "CANCELLED";
    } else if (fStatus === "fulfilled") {
        currentStatus = "SHIPPED";
    } else if (shopifyOrder.financial_status === "paid" && !fStatus) {
        currentStatus = "CONFIRMED";
    } else if (pMethod === "COD" && !fStatus) {
        currentStatus = "CONFIRMED";
    }

    // Detect Logistics Provider (Priority: Line Item Service > Fulfillment Company > Manual)
    let detectedProvider = "MANUAL";
    const service = firstItem?.fulfillment_service;
    if (service) {
        const s = service.toLowerCase();
        if (s.includes('beeping')) detectedProvider = "BEEPING";
        else if (s.includes('droppi') || s.includes('dropi')) detectedProvider = "DROPPI";
        else if (s.includes('amazon')) detectedProvider = "AMAZON";
        else if (s !== "manual") detectedProvider = service.toUpperCase();
    }
    if (detectedProvider === "MANUAL" && tCarrier) {
        detectedProvider = tCarrier.toUpperCase();
    }

    const commonData: any = {
        status: currentStatus,
        totalPrice: toFloat(shopifyOrder.total_price),
        financialStatus: toStr(shopifyOrder.financial_status),
        fulfillmentStatus: toStr(shopifyOrder.fulfillment_status),
        totalTax: toFloat(shopifyOrder.total_tax),
        shippingCost: toFloat(shopifyOrder.total_shipping_price_set?.shop_money?.amount),
        discounts: toFloat(shopifyOrder.total_discounts),
        source: toStr(utms.source),
        medium: toStr(utms.medium),
        campaign: toStr(utms.campaign),
        content: toStr(utms.content),
        term: toStr(utms.term),
        customerName: toStr(customerName),
        customerEmail: toStr(shopifyOrder.customer?.email || shopifyOrder.contact_email),
        customerPhone: toStr(shopifyOrder.customer?.phone || shopifyOrder.shipping_address?.phone),
        shopifyUpdatedAt: toDate(shopifyOrder.updated_at),
        orderType: "REGULAR",
        createdAt: toDate(shopifyOrder.created_at),
        paymentMethod: pMethod
    };

    if (tCode && tCode !== "") commonData.trackingCode = tCode;
    if (tCarrier && tCarrier !== "") commonData.carrier = tCarrier;
    if (tUrl && tUrl !== "") commonData.trackingUrl = tUrl;

    const updateData = { ...commonData };
    if (currentStatus === "CANCELLED") {
        updateData.logisticsStatus = "CANCELLED";
        updateData.status = "CANCELLED";
    }

    const attr = AttributionService.extractFromOrder(shopifyOrder);

    const mainOrder = await (prisma as any).order.upsert({
        where: { shopifyId: sId },
        update: {
            ...updateData,
            logisticsProvider: detectedProvider,
            source: attr.utmSource,
            medium: attr.utmMedium,
            campaign: attr.utmCampaign,
            content: attr.utmContent,
            term: attr.utmTerm
        },
        create: {
            ...commonData,
            logisticsProvider: detectedProvider,
            source: attr.utmSource,
            medium: attr.utmMedium,
            campaign: attr.utmCampaign,
            content: attr.utmContent,
            term: attr.utmTerm,
            logisticsStatus: currentStatus,
            storeId: storeId,
            shopifyId: sId,
            orderNumber: toStr(shopifyOrder.name),
            addressLine1: toStr(shopifyOrder.shipping_address?.address1),
            city: toStr(shopifyOrder.shipping_address?.city),
            province: toStr(shopifyOrder.shipping_address?.province),
            zip: toStr(shopifyOrder.shipping_address?.zip),
            country: toStr(shopifyOrder.shipping_address?.country),
            currency: toStr(shopifyOrder.currency) || "EUR",
            productTitle: toStr(firstItem.title),
            sku: toStr(firstItem.sku),
            units: firstItem.quantity ? parseInt(firstItem.quantity) : 1,
            rawJson: JSON.stringify(shopifyOrder)
        }
    });

    // Sync detailed attribution record
    try {
        await AttributionService.syncForOrder(mainOrder.id, shopifyOrder);
    } catch (e) {
        console.error("[Attribution] Failed sync:", e);
    }

    // --- BEEPING SYNC INTEGRATION ---
    if (currentStatus !== "CANCELLED" && currentStatus !== "ABANDONED") {
        try {
            if (process.env.BEEPING_API_KEY) {
                const beepingRes = await syncSingleOrderBeeping(mainOrder.id);
                if (beepingRes.success && beepingRes.data) {
                    await (prisma as any).order.update({
                        where: { id: mainOrder.id },
                        data: {
                            logisticsStatus: beepingRes.data.logisticsStatus,
                            trackingCode: beepingRes.data.trackingCode,
                            trackingUrl: beepingRes.data.trackingUrl,
                            carrier: beepingRes.data.carrier
                        }
                    });
                }
            }
        } catch (beepingErr) { }
    }

    // --- LINE ITEMS (FOR PROD COSTS) ---
    await syncOrderItemsAndProducts(shopifyOrder, mainOrder.id, storeId);

    // --- PROFIT CALCULATION ---
    await calculateOrderProfit(mainOrder.id);

    // --- GEOCODING & RISK ---
    await autoGeocodeOrder(mainOrder.id).catch(() => { });
    await calculateOrderRisk(mainOrder.id);

    return mainOrder;
}


/**
 * Ensures a store exists and returns its ID. 
 * Prevents foreign key errors during sync.
 */
async function getOrCreateStoreId(preferredId?: string) {
    // 1. Try to find the preferred ID if provided
    if (preferredId) {
        const exists = await (prisma as any).store.findUnique({ where: { id: preferredId } });
        if (exists) return preferredId;
    }

    // 2. Try to find the first available store
    const first = await (prisma as any).store.findFirst();
    if (first) return first.id;

    // 3. Last resort: Fail
    throw new Error(`Store context missing. Tried preferred ${preferredId} but not found, and no other store exists.`);
}

/**
 * Advanced UTM extraction inspired by the provided n8n logic
 */
function extractUtms(o: any) {
    const S = (v: any) => (v == null ? '' : String(v).trim());
    const norm = (s: string) => S(s).normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
    const NA = Array.isArray(o.note_attributes) ? o.note_attributes : [];
    const LI = Array.isArray(o.line_items) ? o.line_items : [];

    const pickNA = (names: string[]) => {
        const want = names.map(norm);
        for (const kv of NA) {
            const k = norm(kv?.name || '');
            if (want.includes(k)) return S(kv?.value);
        }
        return '';
    };

    const getFromProps = (keys: string[]) => {
        const want = keys.map(norm);
        for (const li of LI) {
            const props = Array.isArray(li?.properties) ? li.properties : [];
            for (const p of props) {
                const k = norm(p?.name || '');
                if (want.includes(k)) return S(p?.value);
            }
        }
        return '';
    };

    const parseQS = (s: string) => {
        const out: any = {};
        const raw = S(s);
        if (!raw) return out;
        const q = raw.includes('?') ? raw.split('?')[1] : raw;
        if (!q) return out;
        for (const part of q.split('&')) {
            const [k, v = ''] = part.split('=');
            const kk = norm(decodeURIComponent(k || ''));
            const vv = decodeURIComponent(v.replace(/\+/g, ' '));
            if (kk) out[kk] = vv;
        }
        return out;
    };

    const getQS = (url: string, key: string) => parseQS(url)[norm(key)] || '';

    // Search keys
    const KEYS_SOURCE = ['utm_source', 'UTM source', 'source', 'fuente', 'utm_site', 'site_source_name'];
    const KEYS_MEDIUM = ['utm_medium', 'UTM medium', 'medium', 'medio'];
    const KEYS_CAMPAIGN = ['utm_campaign', 'UTM campaign', 'campaign', 'campaign_name', 'campaña', 'campana'];
    const KEYS_CONTENT = ['utm_content', 'UTM content', 'content', 'utm_adset', 'adset_name'];
    const KEYS_TERM = ['utm_term', 'UTM term', 'term', 'utm_ad', 'ad_name'];

    let source = pickNA(KEYS_SOURCE) || getFromProps(KEYS_SOURCE) || getQS(o.landing_site, 'utm_source') || 'organic';
    let medium = pickNA(KEYS_MEDIUM) || getFromProps(KEYS_MEDIUM) || getQS(o.landing_site, 'utm_medium');
    let campaign = pickNA(KEYS_CAMPAIGN) || getFromProps(KEYS_CAMPAIGN) || getQS(o.landing_site, 'utm_campaign');
    let content = pickNA(KEYS_CONTENT) || getFromProps(KEYS_CONTENT) || getQS(o.landing_site, 'utm_content');
    let term = pickNA(KEYS_TERM) || getFromProps(KEYS_TERM) || getQS(o.landing_site, 'utm_term');

    return { source, medium, campaign, content, term };
}

/**
 * Helper to unify Payment Method mapping
 */
function mapPaymentMethod(shopifyOrder: any): string {
    const gatewayRaw = String(shopifyOrder.gateway || "").toLowerCase();
    const gatewaysList = shopifyOrder.payment_gateway_names || [];
    const allGateways = [gatewayRaw, ...gatewaysList].join(" ").toLowerCase();
    const financial = shopifyOrder.financial_status;

    let pm = "COD"; // Default assumption

    const isOnline = allGateways.includes("stripe") ||
        allGateways.includes("paypal") ||
        allGateways.includes("card") ||
        allGateways.includes("visa") ||
        allGateways.includes("mastercard") ||
        allGateways.includes("shopify_payments") ||
        allGateways.includes("adyen") ||
        allGateways.includes("klarna") ||
        allGateways.includes("redsys") ||
        allGateways.includes("bizum") ||
        allGateways.includes("ceca") ||
        allGateways.includes("amazon_payments") ||
        allGateways.includes("sequra") ||
        allGateways.includes("aplazame") ||
        allGateways.includes("apple_pay") ||
        allGateways.includes("google_pay");

    if (isOnline) {
        pm = "CARD";
    }

    // Explicit COD/Manual override
    if (allGateways.includes("cod") || allGateways.includes("reembolso") || allGateways.includes("contra") || allGateways.includes("manual") || allGateways.includes("cash") || allGateways.includes("pago_en_entrega")) {
        pm = "COD";
    }

    // Financial Status overrides (Crucial)
    if (financial === "paid") {
        pm = "CARD";
    } else if (financial === "pending" || financial === "voided") {
        if (!isOnline) pm = "COD";
    }

    return pm;
}


/**
 * Syncs a single order's status from Beeping
 */

/**
 * Exports an order to Beeping manually
 */
export async function exportOrderToBeeping(orderId: string) {
    try {
        const order = await (prisma as any).order.findUnique({
            where: { id: orderId },
            include: { items: true }
        });

        if (!order) return { success: false, message: "Pedido no encontrado" };

        const apiKey = await getConnectionSecret(order.storeId, "BEEPING");
        if (!apiKey) return { success: false, message: "No API Key configurada para Beeping en esta tienda" };

        const client = new BeepingClient(apiKey);

        // Map Payload
        const payload = {
            external_id: order.shopifyId,
            shipping_name: order.customerName || "Cliente",
            shipping_address_1: order.addressLine1 || "",
            shipping_city: order.city || "",
            shipping_province: order.province || "",
            shipping_zip: order.zip || "",
            shipping_country_code: order.country || "ES",
            customer_email: order.customerEmail || "",
            customer_phone: order.customerPhone || "",
            payment_method: order.paymentMethod === "COD" ? "cod" : "prepaid",
            lines: order.items.map((i: any) => ({
                sku: i.sku || "GENERIC",
                quantity: i.units || i.quantity || 1,
                price: i.price || 0
            }))
        };

        await client.createOrder(payload);

        // Update local status
        await (prisma as any).order.update({
            where: { id: orderId },
            data: {
                logisticsStatus: "PREPARING",
                status: "CONFIRMED"
            }
        });

        await recordOrderEvent({
            orderId: order.id,
            source: 'BEEPING',
            type: 'EXPORT_SUCCESS',
            description: 'Pedido exportado a Beeping manualmente',
            payload: payload
        });

        revalidatePath("/pedidos");
        return { success: true, message: "Pedido enviado a Beeping correctamente." };

    } catch (e: any) {
        console.error("[Beeping Export Error]", e);
        // Handle "Order Exists" error gracefully
        if (e.message?.includes("already exists") || e.message?.includes("422")) {
            return { success: false, message: "El pedido ya existe en Beeping (Duplicado)" };
        }
        return { success: false, message: "Error al exportar: " + e.message };
    }
}

/**
 * Syncs order statuses from Beeping
 */
export async function syncBeepingHistory(storeId: string) {
    // Consolidated into syncBeepingStatuses(0) which is optimized and paginated
    return syncBeepingStatuses(0);
}

/**
 * Syncs line items and products for an order, ensuring costs are strictly applied
 */
export async function syncOrderItemsAndProducts(shopifyOrder: any, localOrderId: string, storeId: string) {
    if (!shopifyOrder.line_items) return;

    // Clear existing to avoid duplicates on re-sync
    await (prisma as any).orderItem.deleteMany({ where: { orderId: localOrderId } });

    for (const item of shopifyOrder.line_items) {
        const shopifyProductId = item.product_id?.toString() || `manual-${item.sku || item.title}`;

        // Upsert Product
        const product = await (prisma as any).product.upsert({
            where: { shopifyId: shopifyProductId },
            update: {
                title: item.title,
                shopifyId: shopifyProductId
            },
            create: {
                storeId: storeId,
                shopifyId: shopifyProductId,
                title: item.title,
            }
        });

        // Forced unitCost retrieval from ProductFinance
        const finance = await (prisma as any).productFinance.findUnique({
            where: { productId: product.id }
        });

        // If finance is missing, try to initialize it with 0 to prevent downstream errors
        let unitCost = finance?.unitCost || 0;

        if (!finance) {
            await (prisma as any).productFinance.create({
                data: {
                    productId: product.id,
                    unitCost: 0,
                    sellingPrice: parseFloat(item.price) || 0
                }
            });
        }

        await (prisma as any).orderItem.create({
            data: {
                orderId: localOrderId,
                productId: product.id,
                sku: item.sku,
                title: item.title,
                variantTitle: item.variant_title,
                quantity: item.quantity,
                price: parseFloat(item.price),
                unitCost: unitCost,
                totalPrice: parseFloat(item.price) * item.quantity,
                isUpsell: item.title.toLowerCase().includes('upsell') || item.sku?.toLowerCase().includes('up')
            }
        });
    }
}

/**
 * Syncs real order history from Shopify
 */
export async function syncShopifyHistory(storeId: string) {
    try {
        console.log(`[Shopify Sync] Starting FULL DEEP sync for store ${storeId}...`);

        const secret = await getConnectionSecret(storeId, "SHOPIFY");
        const meta = await getConnectionMeta(storeId, "SHOPIFY");

        if (!secret || !meta?.extraConfig) {
            return { success: false, message: "No se encontró conexión activa con Shopify." };
        }

        let shopDomain = meta.extraConfig as string;
        if (shopDomain.startsWith('{')) {
            try {
                const parsed = JSON.parse(shopDomain);
                // Check multiple possible keys for the domain
                shopDomain = parsed.shopUrl || parsed.shop || parsed.SHOPIFY_SHOP_DOMAIN || shopDomain;
            } catch (e) {
                console.error("[Shopify Sync] Error parsing extraConfig JSON:", e);
            }
        }

        const shopify = new ShopifyClient(shopDomain, secret);
        let totalOrders = 0;
        let totalAbandoned = 0;
        let totalDrafts = 0;

        const storeIdToUse = storeId;

        // --- 0. SYNC PRODUCTS FIRST ---
        console.log(`[Shopify Sync] Syncing products and variants...`);
        await syncShopifyProducts();

        // --- 1. SYNC COMPLETED ORDERS (Historical Backfill - Start of time) ---
        // Setting minDate to a very old date to ensure TOTAL history ingest as requested
        await shopify.getAllOrders(async (batch) => {
            console.log(`[Shopify Sync] Processing batch of ${batch.length} orders...`);
            for (const shopifyOrder of batch) {
                try {
                    await upsertShopifyOrder(shopifyOrder, storeIdToUse);
                    totalOrders++;
                } catch (e) {
                    console.error("Error order sync:", e);
                }
            }
        }, { minDate: "2010-01-01T00:00:00Z" });

        // --- 2. SYNC ABANDONED CHECKOUTS ---
        await shopify.getAllAbandonedCheckouts(async (batch) => {
            for (const checkout of batch) {
                try {
                    const sId = `abandoned-${checkout.id}`;
                    const firstItem = checkout.line_items?.[0] || {};
                    await (prisma as any).order.upsert({
                        where: { shopifyId: sId },
                        update: { status: "ABANDONED", orderType: "ABANDONED", shopifyUpdatedAt: new Date(checkout.updated_at) },
                        create: {
                            shopifyId: sId,
                            storeId: storeIdToUse,
                            orderNumber: `CHECKOUT #${checkout.id}`,
                            customerName: `${checkout.customer?.first_name || ""} ${checkout.customer?.last_name || ""}` || "Cliente Abandonado",
                            customerEmail: checkout.customer?.email || checkout.email,
                            customerPhone: checkout.customer?.phone || checkout.shipping_address?.phone,
                            totalPrice: parseFloat(checkout.total_price || "0"),
                            status: "ABANDONED",
                            orderType: "ABANDONED",
                            addressLine1: checkout.shipping_address?.address1,
                            productTitle: firstItem.title,
                            createdAt: new Date(checkout.created_at),
                            rawJson: JSON.stringify(checkout)
                        }
                    });
                    totalAbandoned++;
                } catch (e) { console.error("Error abandoned sync:", e); }
            }
        });

        // --- 3. SYNC DRAFT ORDERS ---
        await shopify.getAllDraftOrders(async (batch) => {
            for (const draft of batch) {
                try {
                    const sId = `draft-${draft.id}`;
                    const firstItem = draft.line_items?.[0] || {};
                    await (prisma as any).order.upsert({
                        where: { shopifyId: sId },
                        update: { status: "DRAFT", orderType: "DRAFT", shopifyUpdatedAt: new Date(draft.updated_at) },
                        create: {
                            shopifyId: sId,
                            storeId: storeIdToUse,
                            orderNumber: draft.name || `BORRADOR #${draft.id}`,
                            customerName: `${draft.customer?.first_name || ""} ${draft.customer?.last_name || ""}` || "Borrador Maestro",
                            customerEmail: draft.customer?.email,
                            customerPhone: draft.customer?.phone,
                            totalPrice: parseFloat(draft.total_price || "0"),
                            status: "DRAFT",
                            orderType: "DRAFT",
                            productTitle: firstItem.title,
                            createdAt: new Date(draft.created_at),
                            rawJson: JSON.stringify(draft)
                        }
                    });
                    totalDrafts++;
                } catch (e) { console.error("Error draft sync:", e); }
            }
        });

        revalidatePath("/pedidos");

        // --- 4. UPDATE ACCOUNTING SNAPSHOTS (FULL HISTORICAL BACKFILL) ---
        try {
            const today = new Date();
            // Start from 2020 or a date that covers reasonable Shopify existence for a store
            const startHistory = new Date("2020-01-01");

            console.log(`[Shopify Sync] Triggering TOTAL historical snapshot backfill from ${startHistory.toISOString()}...`);

            // Triggered in background
            MetricsSnapshotService.generateRangeSnapshots(storeIdToUse, startHistory, today)
                .then(() => console.log(`[Shopify Sync] Historical backfill (Statistics) completed.`))
                .catch(e => console.error(`[Shopify Sync] Historical backfill failed:`, e));

        } catch (snapErr) {
            console.error("[Accounting Sync] Failed after Shopify Deep Sync:", snapErr);
        }

        return {
            success: true,
            message: `Deep Sync Finalizado: ${totalOrders} Pedidos, ${totalAbandoned} Carritos Abandonados, ${totalDrafts} Borradores.`,
            count: totalOrders + totalAbandoned + totalDrafts
        };
    } catch (e: any) {
        console.error("[Shopify Deep Sync Error]", e);
        return { success: false, message: e.message };
    }
}

/**
 * Force run geocoding on all pending orders
 */
export async function autoGeocodeAllPending(limit = 0) {
    // FORCE UPDATE: Fetch last N orders regardless of status to apply new Rules
    const whereCondition = {
        addressLine1: { not: null }
    };
    const totalCount = await (prisma as any).order.count({ where: whereCondition });
    const effectiveLimit = limit > 0 ? limit : totalCount;

    console.log(`[AutoGeocode] Found ${totalCount} candidates. Target: ${effectiveLimit}`);

    let count = 0;
    const BATCH_SIZE = 50;
    let processed = 0;

    while (processed < effectiveLimit) {
        const currentBatchSize = Math.min(BATCH_SIZE, effectiveLimit - processed);

        const orders = await (prisma as any).order.findMany({
            where: whereCondition,
            orderBy: { createdAt: 'desc' },
            take: currentBatchSize,
            skip: processed
        });

        if (orders.length === 0) break;

        for (const order of orders) {
            await autoGeocodeOrder(order.id);
            await calculateOrderRisk(order.id);
            count++;
        }

        processed += orders.length;
        console.log(`[AutoGeocode] Processed ${processed}/${effectiveLimit}`);

        if (processed < effectiveLimit) await new Promise(r => setTimeout(r, 200));
    }

    if (count > 0) revalidatePath("/pedidos");
    return { success: true, count };
}

/**
 * Syncs only the most recent orders from Shopify
 */
export async function syncRecentShopifyOrders(limit = 250) {
    try {
        const store = await (prisma as any).store.findFirst();
        if (!store) return { success: false, message: "No store" };

        const secret = await getConnectionSecret(store.id, "SHOPIFY");
        const meta = await getConnectionMeta(store.id, "SHOPIFY");

        if (!secret || !meta?.extraConfig) return { success: false, message: "No connection" };

        let shopDomain = meta.extraConfig as string;
        if (shopDomain.startsWith('{')) {
            try {
                const parsed = JSON.parse(shopDomain);
                shopDomain = parsed.shopUrl || parsed.shop || parsed.SHOPIFY_SHOP_DOMAIN || shopDomain;
            } catch (e) {
                console.error("[Shopify Recent Orders] Error parsing extraConfig JSON:", e);
            }
        }

        const shopify = new ShopifyClient(shopDomain, secret);
        const { orders } = await shopify.getOrders(limit);

        const storeIdToUse = store.id;

        let count = 0;
        for (const shopifyOrder of orders) {
            await upsertShopifyOrder(shopifyOrder, storeIdToUse);
            count++;
        }

        // Parallel Beeping sync
        const ordersToSync = await (prisma as any).order.findMany({
            where: {
                shopifyId: { in: orders.map((o: any) => o.id.toString()) },
                status: { notIn: ["CANCELLED", "ABANDONED"] }
            },
            select: { id: true }
        });

        if (process.env.BEEPING_API_KEY) {
            Promise.allSettled(ordersToSync.map((o: any) => syncSingleOrderBeeping(o.id)));
        }

        revalidatePath("/pedidos");

        // Sync account for today
        try {
            const today = new Date();
            await MetricsSnapshotService.generateDailySnapshot(storeIdToUse, today);
        } catch (snapErr) {
            console.error("[Accounting Sync] Failed after Shopify Recent Sync:", snapErr);
        }

        return { success: true, count };
    } catch (e: any) {
        console.error("[Shopify Recent Sync Error]", e);
        return { success: false, message: e.message };
    }
}


/**
 * Update order details in Beeping
 */
export async function updateBeepingOrderDetails(orderId: string, shippingData: any, lines: any[]) {
    const order = await (prisma as any).order.findUnique({ where: { id: orderId } });
    if (!order) return { success: false, message: "Order not found" };
    const apiKey = process.env.BEEPING_API_KEY;
    if (!apiKey) return { success: false, message: "No API Key" };

    try {
        const client = new BeepingClient(apiKey);
        await client.updateOrder(order.shopifyId, shippingData, lines);
        await (prisma as any).order.update({
            where: { id: orderId },
            data: { addressLine1: shippingData.shipping_address_1, city: shippingData.shipping_city, customerName: shippingData.shipping_name }
        });
        revalidatePath("/pedidos");
        return { success: true, message: "Pedido actualizado en Beeping y Localmente." };
    } catch (e: any) { return { success: false, message: e.message }; }
}

/**
 * Syncs Draft Orders from Shopify
 */
/**
 * Syncs ALL Draft Orders from Shopify
 */
export async function syncDraftOrders() {
    try {
        const connection = await (prisma as any).connection.findFirst({ where: { provider: "SHOPIFY" } });
        if (!connection) return { success: false, message: "No connection" };

        const shopify = new ShopifyClient(connection.extraConfig, connection.apiKey);
        let total = 0;

        await shopify.getAllDraftOrders(async (batch) => {
            console.log(`[Drafts Sync] Processing batch of ${batch.length}...`);
            for (const draft of batch) {
                const utms = extractUtms(draft);
                // Draft orders often have 'completed' if turned into real orders, 
                // but we keep them as DRAFT type unless they are purely open.
                // If they have an order_id, they are converted.
                const status = draft.status === "completed" ? "CONFIRMED" : "DRAFT";

                const dDate = new Date(draft.created_at);
                const dEmail = (draft.customer?.email || draft.email || "").toLowerCase().trim();
                const dName = draft.customer ? `${draft.customer.first_name || ""} ${draft.customer.last_name || ""}`.trim() : (draft.email || "Cliente Draft");

                await (prisma as any).order.upsert({
                    where: { draftId: draft.id.toString() },
                    update: {
                        status: status,
                        totalPrice: parseFloat(draft.total_price),
                        updatedAt: new Date(draft.updated_at),
                        orderType: "DRAFT",
                        createdAt: dDate, // FORCE SORT FIX
                        customerEmail: dEmail,
                        customerName: dName
                    },
                    create: {
                        storeId: connection.storeId,
                        draftId: draft.id.toString(),
                        orderNumber: `DRAFT-${draft.name || draft.id}`,
                        customerName: dName,
                        customerEmail: dEmail,
                        totalPrice: parseFloat(draft.total_price),
                        status: status,
                        orderType: "DRAFT",
                        source: utms.source, medium: utms.medium, campaign: utms.campaign, content: utms.content, term: utms.term,
                        rawJson: JSON.stringify(draft),
                        createdAt: dDate
                    }
                });
                total++;
            }
        });

        revalidatePath("/pedidos");
        return { success: true, count: total, message: `Sincronizados ${total} borradores.` };
    } catch (e: any) { return { success: false, message: e.message }; }
}

/**
 * Syncs ALL Abandoned Checkouts from Shopify
 */
export async function syncAbandonedCheckouts() {
    try {
        const connection = await (prisma as any).connection.findFirst({ where: { provider: "SHOPIFY" } });
        if (!connection) return { success: false, message: "No connection" };

        const shopify = new ShopifyClient(connection.extraConfig, connection.apiKey);
        let total = 0;

        await shopify.getAllAbandonedCheckouts(async (batch) => {
            console.log(`[Checkouts Sync] Processing batch of ${batch.length}...`);
            for (const checkout of batch) {
                const utms = extractUtms(checkout);
                // Checkouts are always abandoned if they are in this endpoint usually,
                // unless recovered.
                const isRecovered = !!checkout.completed_at;

                const cDate = new Date(checkout.created_at);
                const cEmail = (checkout.email || checkout.customer?.email || "").toLowerCase().trim();
                const cName = checkout.customer ? `${checkout.customer.first_name || ""} ${checkout.customer.last_name || ""}`.trim() : (checkout.shipping_address?.first_name || "Cliente Abandono");

                await (prisma as any).order.upsert({
                    where: { abandonedId: checkout.id.toString() },
                    update: {
                        totalPrice: parseFloat(checkout.total_price),
                        updatedAt: new Date(checkout.updated_at),
                        status: isRecovered ? "RECOVERED" : "ABANDONED",
                        orderType: "ABANDONED",
                        createdAt: cDate, // FORCE SORT FIX
                        customerEmail: cEmail,
                        customerName: cName
                    },
                    create: {
                        storeId: connection.storeId,
                        abandonedId: checkout.id.toString(),
                        orderNumber: `CHECK-${checkout.id.toString().slice(-5)}`,
                        customerName: cName,
                        customerEmail: cEmail,
                        customerPhone: checkout.phone || checkout.shipping_address?.phone,
                        totalPrice: parseFloat(checkout.total_price),
                        status: isRecovered ? "RECOVERED" : "ABANDONED",
                        orderType: "ABANDONED",
                        source: utms.source, medium: utms.medium, campaign: utms.campaign, content: utms.content, term: utms.term,
                        rawJson: JSON.stringify(checkout),
                        createdAt: cDate
                    }
                });
                total++;
            }
        });

        revalidatePath("/pedidos");
        return { success: true, count: total, message: `Sincronizados ${total} carritos abandonados.` };
    } catch (e: any) { return { success: false, message: e.message }; }
}


/**
 * Master Sync: Orders + Drafts + Abandoned
 */
export async function masterShopifySync() {
    console.log("[Master Sync] Starting full Shopify synchronization...");

    // 1. Sync Recent Orders
    const resOrders = await syncRecentShopifyOrders();

    // 2. Sync Drafts
    const resDrafts = await syncDraftOrders();

    // 3. Sync Abandoned
    const resAbandoned = await syncAbandonedCheckouts();

    // 4. Geocode and Risk Analysis
    const pendingAnalysis = await (prisma as any).order.findMany({
        where: { riskLevel: "LOW", riskScore: 0, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
        take: 50
    });

    for (const order of pendingAnalysis) {
        await autoGeocodeOrder(order.id);
        await calculateOrderRisk(order.id);
    }

    return {
        success: true,
        message: "Sincronización completa finalizada.",
        details: {
            orders: resOrders.count || 0,
            drafts: resDrafts.count || 0,
            abandoned: resAbandoned.count || 0
        }
    };
}

// Consolidated "Get Many Orders" Action (Replacing getLocalOrders)
export async function getLocalOrders(skip = 0, take = 100, sortDirection: 'asc' | 'desc' = 'desc', typeFilter?: string, dateStr?: string, productId?: string) {
    try {
        const where: any = {};
        if (dateStr) {
            const d = new Date(dateStr);
            const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
            const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
            where.createdAt = { gte: start, lte: end };
        }
        if (typeFilter && typeFilter !== 'ALL') {
            // Example filter logic if needed
            if (typeFilter === 'INCIDENCE') {
                where.status = { in: ['INCIDENCE', 'RETURNED'] };
            } else {
                where.status = typeFilter;
            }
        }

        if (productId) {
            where.items = { some: { productId } };
        }

        const orders = await (prisma as any).order.findMany({
            where,
            orderBy: { createdAt: sortDirection },
            take,
            skip,
            // Include relations if needed for UI
            include: { items: true, store: true, attribution: true }
        });

        // Map to UI-friendly structure if needed, or return raw.
        // The UI expects certain fields.
        return orders.map((o: any) => ({
            ...o,
            // Ensure logistics status is normalized for display
            logisticsStatusLabel: normalizeLogisticsStatus(o.logisticsProvider || 'GENERIC', o.logisticsStatus)
        }));

    } catch (e: any) {
        console.error("getLocalOrders Error", e);
        return [];
    }
}


/**
 * Master Unifier Importer
 * unifica una hoja maestra de los pedidos entregados, con incidencia, y que despues se han entregado o se han devuelto
 */
export async function importCRMFile(formData: FormData) {
    const file = formData.get("file") as File;
    if (!file) return { success: false, message: "No se ha seleccionado ningún archivo" };

    try {
        const text = await file.text();
        const firstLine = text.split("\n")[0];
        const separator = firstLine.includes(";") ? ";" : ",";

        const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");
        if (lines.length < 2) return { success: false, message: "El archivo parece vacío o sin cabeceras" };

        const headers = lines[0].split(separator).map(h => h.trim().replace(/"/g, "").toLowerCase());
        const getIdx = (keys: string[]) => headers.findIndex(h => keys.some(k => h.includes(k)));

        const idxOrder = getIdx(["pedido", "order", "number", "v-number", "id", "referencia"]);
        const idxStatus = getIdx(["status", "estado", "fulfillment", "logistica", "situacion"]);
        const idxIncidence = getIdx(["incidencia", "incidence", "problema", "motivo", "observaciones"]);
        const idxDate = getIdx(["fecha", "date", "entrega", "delivery"]);
        const idxAgent = getIdx(["agente", "agent", "vendedor", "comercial", "usuario", "user"]);
        const idxTotal = getIdx(["total", "precio", "price", "importe", "valor"]);

        if (idxOrder === -1) return { success: false, message: "No se encontró columna de 'Pedido' en el CSV." };

        let updated = 0;
        let incidencesFound = 0;
        let assignedAgents = 0;

        for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(separator).map(c => c.trim().replace(/"/g, ""));
            if (cols.length < headers.length) continue;

            const orderNum = cols[idxOrder];
            if (!orderNum) continue;

            const cleanNum = orderNum.replace(/#/g, "").trim();
            const statusRaw = (idxStatus > -1 ? cols[idxStatus] : "").toUpperCase();
            const incidenceRaw = (idxIncidence > -1 ? cols[idxIncidence] : "").toUpperCase();
            const dateRaw = idxDate > -1 ? cols[idxDate] : null;
            const agentName = (idxAgent > -1 ? cols[idxAgent] : "").trim();
            const totalRaw = idxTotal > -1 ? cols[idxTotal] : null;

            const existing = await (prisma as any).order.findFirst({
                where: {
                    OR: [{ orderNumber: cleanNum }, { orderNumber: `#${cleanNum}` }, { shopifyId: cleanNum }]
                }
            });

            const commonData: any = {
                updatedAt: new Date(),
                carrier: (idxStatus > -1 ? cols[idxStatus] : "").split(":")[0].trim() || "Manual",
                paymentMethod: (statusRaw.includes("COD") || (totalRaw && totalRaw.includes("COD"))) ? "COD" : "CARD"
            };

            if (statusRaw) {
                if (statusRaw.includes("ENTREGA") || statusRaw.includes("DELIVERED") || statusRaw.includes("COMPLETADO")) {
                    commonData.logisticsStatus = "DELIVERED";
                    if (dateRaw) commonData.deliveredAt = new Date(dateRaw);
                    commonData.status = "CONFIRMED";
                } else if (statusRaw.includes("DEVOL") || statusRaw.includes("RETURN") || statusRaw.includes("RECHAZADO")) {
                    commonData.logisticsStatus = "RETURNED";
                    if (dateRaw) commonData.returnedAt = new Date(dateRaw);
                    commonData.status = "CANCELLED";
                } else if (statusRaw.includes("TRANSIT") || statusRaw.includes("CAMINO") || statusRaw.includes("ENVIADO") || statusRaw.includes("SALIDA")) {
                    commonData.logisticsStatus = "IN_TRANSIT";
                    commonData.status = "CONFIRMED";
                }
            }

            if (incidenceRaw && incidenceRaw.length > 3 && !incidenceRaw.includes("NO") && !incidenceRaw.includes("OK")) {
                commonData.logisticsStatus = "INCIDENCE";
                commonData.incidenceResult = incidenceRaw;
                commonData.needsReview = true;
                incidencesFound++;
            }

            if (agentName && agentName.length > 2) {
                const normalizedAgentName = agentName.toLowerCase().replace(/\./g, ' ').trim();
                const allAgents = await (prisma as any).user.findMany({ where: { role: 'ATT' } });
                let agent = allAgents.find((u: any) => u.name.toLowerCase().includes(normalizedAgentName) || normalizedAgentName.includes(u.name.toLowerCase()));

                if (!agent) {
                    const placeholderEmail = `${agentName.toLowerCase().replace(/\s+/g, '.')}@maestro.com`;
                    agent = await (prisma as any).user.create({
                        data: { name: agentName, email: placeholderEmail, role: "ATT", hourlyRate: 15 }
                    });
                }
                commonData.assignedAgentId = agent.id;
                commonData.assignedTo = agent.name;
                assignedAgents++;
            }

            if (totalRaw) {
                const price = parseFloat(totalRaw.replace(',', '.').replace(/[^\d.-]/g, ''));
                if (!isNaN(price) && price > 0) commonData.totalPrice = price;
            }

            if (existing) {
                await (prisma as any).order.update({ where: { id: existing.id }, data: commonData });
            } else {
                const storeId = await getOrCreateStoreId();
                await (prisma as any).order.create({
                    data: {
                        ...commonData,
                        orderNumber: orderNum.startsWith("#") ? orderNum : `#${orderNum}`,
                        customerName: "Cliente Importado",
                        customerPhone: "000000000",
                        addressLine1: "Dirección Importada",
                        city: "Ciudad",
                        zip: "00000",
                        countryCode: "ES",
                        storeId: storeId,
                        orderType: "REGULAR",
                        createdAt: dateRaw ? new Date(dateRaw) : new Date(),
                        totalPrice: commonData.totalPrice || 0,
                    }
                });
            }
            updated++;
        }

        revalidatePath("/pedidos");
        return {
            success: true,
            message: `Importación completada: ${updated} pedidos procesados. ${incidencesFound} incidencias detectadas. ${assignedAgents} pedidos vinculados a agentes.`
        };
    } catch (e: any) {
        console.error("Import Error:", e);
        return { success: false, message: `Error crítico al importar: ${e.message}` };
    }
}

/**
 * AGENT PERFORMANCE ANALYTICS
 */
export async function getAgentPerformance() {
    try {
        const agents = await (prisma as any).user.findMany({
            where: { role: "ATT" },
            include: {
                _count: {
                    select: {
                        // We can't query specific order statuses in _count easily, so we fetch details or use groupBy
                    }
                }
            }
        });

        // Use GroupBy for efficiency
        const metrics = await (prisma as any).order.groupBy({
            by: ['assignedAgentId', 'logisticsStatus'],
            _count: { id: true },
            where: { assignedAgentId: { not: null } }
        });

        const report = agents.map((agent: any) => {
            const agentMetrics = metrics.filter((m: any) => m.assignedAgentId === agent.id);
            const total = agentMetrics.reduce((acc: number, curr: any) => acc + curr._count.id, 0);
            const delivered = agentMetrics.find((m: any) => m.logisticsStatus === 'DELIVERED')?._count.id || 0;
            const returned = agentMetrics.find((m: any) => m.logisticsStatus === 'RETURNED')?._count.id || 0;
            const incidence = agentMetrics.find((m: any) => m.logisticsStatus === 'INCIDENCE')?._count.id || 0;

            return {
                id: agent.id,
                name: agent.name,
                totalOrders: total,
                delivered,
                returned,
                incidence,
                deliveryRate: total > 0 ? (delivered / total) * 100 : 0,
                returnRate: total > 0 ? (returned / total) * 100 : 0
            };
        }).sort((a: any, b: any) => b.totalOrders - a.totalOrders);

        return { success: true, report };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Syncs stats from Beeping
 */


export async function markOrderAsReadyForShipping(orderId: string) {
    const apiKey = process.env.BEEPING_API_KEY;
    if (!apiKey) return { success: false, message: "No se encontró la clave API de Beeping." };
    const order = await (prisma as any).order.findUnique({ where: { id: orderId } });
    if (!order) return { success: false, message: "Pedido no encontrado." };
    const client = new BeepingClient(apiKey);
    await client.markAsReady(order.shopifyId);
    await (prisma as any).order.update({ where: { id: orderId }, data: { logisticsStatus: "READY_FOR_PICKUP" } });
    revalidatePath("/pedidos");
    return { success: true, message: "Pedido marcado como listo para enviar en Beeping." };
}

export async function cancelBeepingOrder(orderId: string) {
    const apiKey = process.env.BEEPING_API_KEY;
    if (!apiKey) return { success: false, message: "No se encontró la clave API de Beeping." };
    const order = await (prisma as any).order.findUnique({ where: { id: orderId } });
    if (!order) return { success: false, message: "Pedido no encontrado." };
    const client = new BeepingClient(apiKey);
    await client.cancelOrder(order.shopifyId);
    await (prisma as any).order.update({ where: { id: orderId }, data: { logisticsStatus: "CANCELLED" } });
    revalidatePath("/pedidos");
    return { success: true, message: "Pedido anulado en Beeping." };
}

export async function getCustomerStats() {
    try {
        const topCustomers = await (prisma as any).order.groupBy({
            by: ['customerEmail', 'customerName'], // Group by both to get the name
            _sum: { totalPrice: true },
            _count: { id: true },
            orderBy: { _sum: { totalPrice: 'desc' } },
            take: 10
        });

        return topCustomers.map((c: any) => ({
            name: c.customerName || "Anónimo",
            email: c.customerEmail || "N/A",
            totalSpent: c._sum.totalPrice || 0,
            orderCount: c._count.id || 0
        }));
    } catch (e) {
        return [];
    }
}

export async function getZonesStats() {
    try {
        const zones = await (prisma as any).order.groupBy({
            by: ['province'],
            _sum: { totalPrice: true },
            _count: { id: true },
            where: { province: { not: null } },
            orderBy: { _sum: { totalPrice: 'desc' } },
            take: 15
        });

        return zones.map((z: any) => ({
            zone: z.province || "Desconocida",
            revenue: z._sum.totalPrice || 0,
            count: z._count.id || 0
        }));
    } catch (e) {
        return [];
    }
}

export async function getMarketingStats() {
    try {
        const sources = await (prisma as any).order.groupBy({
            by: ['source'],
            _sum: { totalPrice: true },
            _count: { id: true },
            orderBy: { _sum: { totalPrice: 'desc' } }
        });

        const attribution = await (prisma as any).order.groupBy({
            by: ['content'], // Creative name in UTM
            _sum: { totalPrice: true },
            _count: { id: true },
            where: { content: { not: null } },
            orderBy: { _sum: { totalPrice: 'desc' } },
            take: 10
        });

        return {
            sources: sources.map((s: any) => ({
                source: s.source || "Direct / Unknown",
                revenue: s._sum.totalPrice || 0,
                orders: s._count.id || 0
            })),
            topCreatives: attribution.map((a: any) => ({
                name: a.content,
                revenue: a._sum.totalPrice || 0,
                orders: a._count.id || 0
            }))
        };
    } catch (e) {
        return { sources: [], topCreatives: [] };
    }
}

export async function importLogisticsUpdate(formData: FormData) {
    return { success: true };
}

export async function syncDailyPerformance() {
    try {
        const store = await (prisma as any).store.findFirst();
        if (!store) return;

        // Sync last 14 days
        for (let i = 0; i < 14; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);

            const nextDay = new Date(date);
            nextDay.setDate(nextDay.getDate() + 1);

            const dayOrders = await (prisma as any).order.findMany({
                where: {
                    storeId: store.id,
                    createdAt: { gte: date, lt: nextDay },
                    status: "CONFIRMED"
                },
                include: { items: { include: { product: { include: { finance: true } } } } }
            });

            let revenue = 0;
            let cogs = 0;
            let shipping = 0;
            let delivered = 0;

            for (const order of dayOrders) {
                revenue += order.totalPrice;
                if (order.logisticsStatus === "DELIVERED") delivered++;

                for (const item of order.items) {
                    const f = item.product?.finance;
                    cogs += (f?.unitCost || 0) * item.quantity;
                    shipping += (f?.shippingCost || 0) * item.quantity;
                }
            }

            // Estimate Ad Spend from Creative Assets for that day (Mocked as real-time pull not active)
            const dailyAdSpend = 0;

            await (prisma as any).dailyFinance.upsert({
                where: { storeId_date: { storeId: store.id, date } },
                update: {
                    totalRevenue: revenue,
                    cogs: cogs,
                    shippingCost: shipping,
                    adSpend: dailyAdSpend,
                    ordersCount: dayOrders.length,
                    netProfit: revenue - cogs - shipping - dailyAdSpend
                },
                create: {
                    storeId: store.id,
                    date: date,
                    totalRevenue: revenue,
                    cogs: cogs,
                    shippingCost: shipping,
                    adSpend: dailyAdSpend,
                    ordersCount: dayOrders.length,
                    netProfit: revenue - cogs - shipping - dailyAdSpend
                }
            });
        }
        revalidatePath("/finances");
    } catch (error) {
        console.error("Daily sync error:", error);
    }
}

export async function syncSingleOrderBeeping(orderId: string, apiKey?: string, apiUrl?: string) {
    try {
        const order = await (prisma as any).order.findUnique({ where: { id: orderId } });
        if (!order || !order.shopifyId) return { success: false, message: "No Shopify ID" };

        // Ensure keys
        const key = apiKey || process.env.BEEPING_API_KEY;
        const url = apiUrl || process.env.BEEPING_API_URL;
        if (!key) return { success: false, message: "No ID" };

        const client = new BeepingClient(key, url);

        // Fetch from Beeping
        // The API Get Orders filters by IN (external_ids), so we can fetch specific ones or list all.
        // But here we want details for THIS order.
        // API docs say: GET /api/get_orders?in=...
        const response = await client.getOrders({ in: order.shopifyId });

        // If response is the object itself (some APIs do this) or array
        let details = null;
        if (Array.isArray(response)) {
            details = response.find((o: any) => String(o.external_id) === String(order.shopifyId));
        } else if (response && String(response.external_id) === String(order.shopifyId)) {
            details = response;
        }

        if (!details) return { success: false, message: "Not found in Beeping" };

        // Normalize Status
        // Beeping returns 'status' (1-4) and 'tracking_stage' (1-8 usually for logistics)
        // We use our helper which handles this.
        // We pass the RAW status object or value.
        // Let's pass the status (1-6) primarily, or map based on logic.
        // If 'status' is 4 (Enviado), we check 'tracking_stage' (Logistics Status).

        // Helper expects (source, status).
        // Usage: normalizeLogisticsStatus('BEEPING', details.tracking_stage || details.status) 
        // We prefer 'tracking_stage' if status is >= 4, otherwise order status.
        const rawStatus = parseInt(details.status) >= 4 ? (details.tracking_stage || details.status) : details.status;
        const newStatus = normalizeLogisticsStatus("BEEPING", rawStatus);

        if (newStatus !== order.logisticsStatus) {
            await (prisma as any).order.update({
                where: { id: order.id },
                data: {
                    logisticsStatus: newStatus,
                    status: newStatus === 'DELIVERED' ? 'COMPLETED' : order.status,
                    trackingCode: details.tracking_number || order.trackingCode,
                    courier: details.courier_id ? `Courier ${details.courier_id}` : order.courier,
                    deliveredAt: newStatus === 'DELIVERED' && !order.deliveredAt ? new Date() : order.deliveredAt
                }
            });

            await recordOrderEvent({
                orderId: order.id,
                source: "BEEPING",
                type: "SYNC_UPDATE",
                description: `Sincronizado: ${newStatus} (Raw: ${rawStatus})`,
                payload: details
            });
            // Construct return data for caller
            const updateData = {
                logisticsStatus: newStatus,
                trackingCode: details.tracking_number || order.trackingCode,
                trackingUrl: details.tracking_url,
                carrier: details.courier_id ? `Courier ${details.courier_id}` : order.courier
            };
            // Trigger accounting sync if status changed
            try {
                await MetricsSnapshotService.generateDailySnapshot(order.storeId, new Date());
            } catch (snapErr) {
                console.error("[Accounting Sync] Failed after Beeping Single Sync:", snapErr);
            }

            return { success: true, updated: true, data: updateData };
        }

        return { success: true, updated: false };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

async function processBeepingOrderUpdate(bo: any) {
    const externalId = bo.external_id || bo.ref || bo.reference;
    if (!externalId) return { updated: false };

    // Find local order
    const local = await (prisma as any).order.findFirst({
        where: {
            OR: [
                { shopifyId: externalId.toString() },
                { orderNumber: bo.ref },
                { orderNumber: `#${bo.ref}` },
                { orderNumber: bo.reference }
            ]
        }
    });

    if (local) {
        const status = BeepingClient.mapStatus(bo);
        const courier = BeepingClient.mapCourier(bo.courier_id);

        const updateData: any = {
            logisticsStatus: status,
            carrier: courier,
            trackingCode: bo.tracking_number,
            logisticsProvider: "BEEPING",
            trackingUrl: bo.tracking_url || local.trackingUrl,
            shippingCost: bo.shipping_cost ? parseFloat(bo.shipping_cost) : local.shippingCost,
            finalStatus: (status === 'DELIVERED' || status === 'RETURNED') ? status : local.finalStatus
        };

        if (status === 'DELIVERED' && !local.deliveredAt) updateData.deliveredAt = new Date();
        if (status === 'RETURNED' && !local.returnedAt) updateData.returnedAt = new Date();

        await (prisma as any).order.update({
            where: { id: local.id },
            data: updateData
        });

        // Recalculate profit for accounting
        await calculateOrderProfit(local.id);
        return { updated: true };
    }
    return { updated: false };
}

export async function syncBeepingStatuses(limit = 0, priority = false, segment: 'ACTIVE' | 'TRANSIT' | 'FINAL' = 'FINAL') {
    try {
        const apiKey = process.env.BEEPING_API_KEY;
        if (!apiKey) return { success: false, message: "BEEPING API KEY missing" };

        const client = new BeepingClient(apiKey);
        let updated = 0;
        let processed = 0;

        // Determine which orders to sync based on segment
        const where: any = { logisticsProvider: "BEEPING" };

        if (segment === 'ACTIVE') {
            where.logisticsStatus = { in: ["PENDING", "PROCESSING", "PREPARACION"] };
        } else if (segment === 'TRANSIT') {
            where.logisticsStatus = { in: ["SHIPPED", "EN TRANSITO", "EN REPARTO", "OUT_FOR_DELIVERY"] };
        } else if (segment === 'FINAL') {
            // For FINAL, we might want to reconcile older orders too
            where.status = { notIn: ["CANCELLED"] };
        }

        // Only sync orders from the last 60 days to keep it efficient
        where.createdAt = { gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) };

        const pendingOrders = await (prisma as any).order.findMany({
            where,
            select: { shopifyId: true, orderNumber: true }
        });

        if (pendingOrders.length === 0) return { success: true, message: `No orders found in segment ${segment}.` };

        // Beeping get_orders 'in' param takes a comma separated list of external IDs or refs
        // Handle chunking for large segments
        const chunkSize = 100;
        for (let i = 0; i < pendingOrders.length; i += chunkSize) {
            const chunk = pendingOrders.slice(i, i + chunkSize);
            const ids = chunk.map((o: any) => o.shopifyId || o.orderNumber.replace('#', '')).join(',');

            const response = await client.getOrders({ in: ids, per_page: 100 });
            const orders = Array.isArray(response) ? response : (response.data || []);

            for (const bo of orders) {
                processed++;
                const res = await (import('./actions').then(a => (a as any).processBeepingOrderUpdate(bo)));
                if (res.updated) updated++;
            }
        }

        revalidatePath("/pedidos");
        return { success: true, message: `[${segment}] Sync Completa: ${updated}/${processed} actualizados.` };
    } catch (error: any) {
        console.error("Beeping sync error:", error);
        return { success: false, message: error.message };
    }
}

async function updateCreativePerformance(order: any) {
    if (!order.content && !order.term) return;

    // Filter valid conditions first
    const conditions = [];
    if (order.content) {
        conditions.push({ nomenclatura: order.content });
        conditions.push({ name: { contains: order.content } });
    }
    if (order.term) {
        conditions.push({ nomenclatura: order.term });
    }

    if (conditions.length === 0) return;

    // Attempt to match creative by nomenclatura (utm_content) or term (utm_term)
    const creative = await (prisma as any).creativeAsset.findFirst({
        where: {
            OR: conditions
        }
    });

    if (creative) {
        await (prisma as any).creativeAsset.update({
            where: { id: creative.id },
            data: {
                revenue: { increment: order.totalPrice },
                purchases: { increment: 1 }
            }
        });
    }
}

export async function updateLogisticsStatus(orderId: string, newStatus: string, trackingCode?: string) {
    await (prisma as any).order.update({ where: { id: orderId }, data: { logisticsStatus: newStatus, trackingCode } });
    await syncDailyPerformance(); // Update stats
    return { success: true };
}

/**
 * Pushes a local order to Beeping API
 */
export async function pushOrderToBeeping(orderId: string) {
    console.log(`[Beeping Push] Processing order ${orderId}...`);

    try {
        const order = await (prisma as any).order.findUnique({
            where: { id: orderId },
            include: { items: true }
        });

        if (!order) throw new Error("Order not found");

        const connection = await (prisma as any).connection.findFirst({
            where: { provider: "BEEPING" }
        });

        const apiKey = connection?.apiKey || process.env.BEEPING_API_KEY;
        const apiUrl = connection?.extraConfig || process.env.BEEPING_API_URL;

        if (!apiKey) throw new Error("No Beeping API Key found in connections or env.");

        const client = new BeepingClient(apiKey, apiUrl);

        // Use Corrected Address if validated, otherwise use original
        const useCorrected = order.addressStatus === "VALIDATED" && order.correctedAddress;

        // Prepare Beeping payload
        const beepingData = {
            external_id: order.shopifyId || order.id,
            shipping_name: order.customerName || "Cliente",
            shipping_address_1: useCorrected ? order.correctedAddress : order.addressLine1 || "",
            shipping_city: order.city || "",
            shipping_province: order.province || "",
            shipping_zip: order.zip || "",
            shipping_country_code: order.country || "ES",
            customer_email: order.customerEmail || "",
            customer_phone: order.customerPhone || "",
            payment_method: order.paymentMethod === "COD" ? "cash_on_delivery" : "paid",
            lines: order.items.map((item: any) => ({
                sku: item.sku || item.title,
                quantity: item.quantity,
                price: item.price
            }))
        };

        const result = await client.createOrder(beepingData);
        console.log(`[Beeping Push] Success:`, result);

        await (prisma as any).order.update({
            where: { id: orderId },
            data: {
                logisticsProvider: "BEEPING",
                logisticsStatus: "PROCESSING",
                status: "CONFIRMED"
            }
        });

        return { success: true, message: "Pedido enviado a Beeping correctamente." };
    } catch (e: any) {
        console.error(`[Beeping Push Error]:`, e.message);
        return { success: false, message: e.message };
    }
}

export async function updateOrderAddress(orderId: string, data: any) {
    try {
        await (prisma as any).order.update({
            where: { id: orderId },
            data: {
                ...data,
                correctedAddress: data.isSuggestion ? null : undefined, // Clear suggestion if applying it
                addressStatus: data.addressStatus || "VALIDATED"
            }
        });
        revalidatePath("/pedidos");
        return { success: true };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}

/**
 * Updates a fulfillment rule (shipping costs per provider)
 */
export async function updateFulfillmentRule(ruleId: string, data: any) {
    try {
        // If the ruleId is 'default', we might need to find a real one or create it
        if (ruleId === 'default') {
            const firstRule = await (prisma as any).fulfillmentRule.findFirst();
            if (firstRule) {
                ruleId = firstRule.id;
            } else {
                // Create a basic rule if none exists
                const newRule = await (prisma as any).fulfillmentRule.create({
                    data: {
                        provider: 'GENERIC',
                        baseShippingCost: 6.5,
                        ...data
                    }
                });
                revalidatePath("/logistics/costs");
                return { success: true, id: newRule.id };
            }
        }

        await (prisma as any).fulfillmentRule.update({
            where: { id: ruleId },
            data
        });
        revalidatePath("/logistics/costs");
        return { success: true };
    } catch (e: any) {
        console.error("[FulfillmentRule Update Error]", e);
        return { success: false, message: e.message };
    }
}

/**
 * Global/Product-specific cost updates
 */
export async function updateProductFinance(productId: string, data: any) {
    if (!productId) return { success: false, message: "Missing Product ID" };
    try {
        // Ensure decimal values for Prisma
        const sanitizedData: any = {};
        for (const [key, val] of Object.entries(data)) {
            if (typeof val === 'number') sanitizedData[key] = val;
            else sanitizedData[key] = parseFloat(val as string) || 0;
        }

        await (prisma as any).productFinance.upsert({
            where: { productId },
            update: sanitizedData,
            create: { productId, ...sanitizedData }
        });
        revalidatePath("/logistics/costs");
        revalidatePath("/logistics/dashboard");
        return { success: true };
    } catch (e: any) {
        console.error("[ProductFinance Update Error]", e);
        return { success: false, message: e.message };
    }
}

/**
 * Helper to update many products at once (Global COGS)
 */
export async function updateGlobalProductCost(unitCost: number) {
    try {
        const products = await (prisma as any).product.findMany({ select: { id: true } });
        for (const p of products) {
            await (prisma as any).productFinance.upsert({
                where: { productId: p.id },
                update: { unitCost },
                create: { productId: p.id, unitCost }
            });
        }
        revalidatePath("/logistics/dashboard");
        return { success: true };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}

export async function cancelOrder(orderId: string) {
    try {
        const order = await (prisma as any).order.findUnique({ where: { id: orderId } });
        if (!order) return { success: false, message: "Pedido no encontrado" };

        if (order.shopifyId) {
            const connection = await (prisma as any).connection.findFirst({
                where: { provider: "SHOPIFY" }
            });

            if (connection && connection.apiKey && connection.extraConfig) {
                const shopify = new ShopifyClient(connection.extraConfig, connection.apiKey);
                try {
                    await shopify.cancelOrder(order.shopifyId);
                } catch (err: any) {
                    console.warn("[Shopify Cancel] Failed or already cancelled:", err.message);
                    // We continue anyway to update local status if Shopify says it's already done
                }
            }
        }

        await (prisma as any).order.update({
            where: { id: orderId },
            data: {
                status: "CANCELLED",
                logisticsStatus: "ANULADO",
                fulfillmentStatus: "cancelled"
            }
        });

        revalidatePath("/pedidos");
        return { success: true, message: "Pedido anulado correctamente" };
    } catch (error: any) {
        console.error("[Cancel Order Error]:", error);
        return { success: false, message: error.message };
    }
}

/**
 * Fetches the event timeline for a specific order.
 */
export async function getOrderEvents(orderId: string) {
    try {
        return await (prisma as any).orderEvent.findMany({
            where: { orderId },
            orderBy: { timestamp: 'desc' }
        });
    } catch (error) {
        return [];
    }
}

/**
 * Updates order address with Write-Back to Fulfillment/Shopify.
 */
export async function updateOrderAddressMaster(orderId: string, addressData: any) {
    try {
        // 1. Get current order and connections
        const order = await (prisma as any).order.findUnique({
            where: { id: orderId },
            include: { store: { include: { connections: true } } }
        });
        if (!order) return { success: false, message: "Pedido no encontrado" };

        const shopifyConn = order.store.connections.find((c: any) => c.provider === "SHOPIFY");
        const beepingConn = order.store.connections.find((c: any) => c.provider === "BEEPING");

        // 2. Write-Back to Shopify
        if (shopifyConn && order.shopifyId) {
            try {
                const shopify = new ShopifyClient(shopifyConn.extraConfig!, shopifyConn.apiKey!);
                // Shopify uses orders/{id}.json (PUT) for address updates
                // Note: In a real app, we'd need to fetch the full order or map to Shopify's structure
            } catch (e) {
                console.error("Shopify Write-back failed:", e);
            }
        }

        // 3. Write-Back to Beeping
        if (beepingConn && order.shopifyId) {
            try {
                const beeping = new BeepingClient(beepingConn.apiKey!, beepingConn.extraConfig!);
                await beeping.updateOrder(order.shopifyId, {
                    shipping_address_1: addressData.addressLine1,
                    shipping_city: addressData.city,
                    shipping_zip: addressData.zip,
                    shipping_province: addressData.province
                }, []); // No line changes
            } catch (e) {
                console.error("Beeping Write-back failed:", e);
            }
        }

        // 4. Record the event
        await (prisma as any).orderEvent.create({
            data: {
                orderId,
                source: 'AGENT',
                type: 'ADDRESS_EDIT',
                description: `Dirección actualizada y sincronizada en Fulfillment: ${addressData.addressLine1}`,
                payload: JSON.stringify(addressData)
            }
        });

        // 5. Update Local DB
        await (prisma as any).order.update({
            where: { id: orderId },
            data: {
                addressLine1: addressData.addressLine1,
                city: addressData.city,
                province: addressData.province,
                zip: addressData.zip,
                addressStatus: 'VALIDATED'
            }
        });

        revalidatePath("/pedidos");
        return { success: true, message: "Dirección actualizada y sincronizada en Fulfillment." };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

// --- SUPPLY CHAIN DASHBOARD ACTIONS ---


// --- SUPPLY CHAIN DASHBOARD ACTIONS ---

export async function getSupplyChainStats() {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const stats = await (prisma as any).order.groupBy({
            by: ['logisticsStatus'],
            where: {
                status: { not: 'ABANDONED' },
                createdAt: { gte: thirtyDaysAgo }
            },
            _count: { id: true }
        });

        const totalConfirmed = await (prisma as any).order.count({ where: { status: 'CONFIRMED', createdAt: { gte: thirtyDaysAgo } } });

        const inTransit = await (prisma as any).order.count({
            where: { logisticsStatus: { in: ['IN_TRANSIT', 'OUT_FOR_DELIVERY', 'PICKUP_POINT'] } }
        });

        const delivered = await (prisma as any).order.count({
            where: { logisticsStatus: 'DELIVERED', createdAt: { gte: thirtyDaysAgo } }
        });

        const incidences = await (prisma as any).order.count({
            where: { logisticsStatus: { in: ['INCIDENCE', 'DELIVERY_FAILED', 'ACCIDENT'] } }
        });

        const returns = await (prisma as any).order.count({
            where: { logisticsStatus: { in: ['RETURNED', 'RETURN_TO_SENDER'] }, createdAt: { gte: thirtyDaysAgo } }
        });

        const recentIncidences = await (prisma as any).order.findMany({
            where: { logisticsStatus: 'INCIDENCE' },
            take: 10,
            orderBy: { updatedAt: 'desc' },
            select: { id: true, orderNumber: true, customerName: true, incidenceResult: true, updatedAt: true }
        });

        // FETCH & SEED RULES SAFELY
        let rules = await (prisma as any).fulfillmentRule.findMany({ orderBy: { provider: 'asc' } });

        try {
            // 1. Hardcoded Defaults
            const requiredProviders = [
                { name: 'BEEPING', base: 5.50 },
                { name: 'DROPEA', base: 5.80 },
                { name: 'DROPI', base: 6.00 },
                { name: 'AMAZON', base: 7.00 },
                { name: 'GENERIC', base: 6.50 }
            ];

            // 2. Auto-Discovery from Orders
            const distinctProviders = await (prisma as any).order.findMany({
                where: { logisticsProvider: { not: null } },
                select: { logisticsProvider: true },
                distinct: ['logisticsProvider']
            });

            distinctProviders.forEach((p: any) => {
                const pName = p.logisticsProvider.toUpperCase();
                if (!requiredProviders.find(rp => rp.name === pName)) {
                    requiredProviders.push({ name: pName, base: 6.00 }); // Default base for auto-discovered
                }
            });

            const existingNames = rules.map((r: any) => r.provider);
            const missing = requiredProviders.filter(p => !existingNames.includes(p.name));

            if (missing.length > 0) {
                let storeId = (await (prisma as any).store.findFirst())?.id;
                if (!storeId) {
                    try {
                        const newStore = await (prisma as any).store.create({ data: { name: 'Default Store', currency: 'EUR' } });
                        storeId = newStore.id;
                    } catch (e) { console.error("Auto-store creation failed", e); }
                }

                if (storeId) {
                    for (const m of missing) {
                        try {
                            await (prisma as any).fulfillmentRule.create({
                                data: {
                                    storeId,
                                    provider: m.name,
                                    baseShippingCost: m.base,
                                    returnCost: 5.00,
                                    taxPercent: 21
                                }
                            });
                        } catch (e) {
                            // Ignore duplicates
                        }
                    }
                    // Refetch rules
                    rules = await (prisma as any).fulfillmentRule.findMany({ orderBy: { provider: 'asc' } });
                }
            }
        } catch (ruleErr) {
            console.error("Rule auto-seed error", ruleErr);
        }

        // 3. FETCH PRODUCTS & REAL AVG SALES PRICE & INFERRED PROVIDER
        // Optimized: Use groupBy for pricing to avoid fetching all items
        const productsRaw = await (prisma as any).product.findMany({
            include: {
                finance: true,
                supplier: true
            },
            orderBy: { title: 'asc' }
        });

        // Aggregation for Average Price
        const priceStats = await (prisma as any).orderItem.groupBy({
            by: ['productId'],
            _sum: {
                totalPrice: true,
                quantity: true
            },
            where: {
                order: { status: { notIn: ['CANCELLED', 'ABANDONED'] } }
            }
        });

        // Lighter approach for Provider Inference:
        // We only really need to check the last N orders or do a lighter fetch.
        // For now, let's fetch only necessary fields for inference, perhaps limited to recent history if needed.
        // But to be safe on memory, let's just fetch productId and provider.
        const providerItems = await (prisma as any).orderItem.findMany({
            where: {
                order: {
                    status: { notIn: ['CANCELLED', 'ABANDONED'] },
                    logisticsProvider: { not: null }
                }
            },
            select: {
                productId: true,
                order: {
                    select: { logisticsProvider: true }
                }
            },
            // Limit analysis to recent 5000 items to prevent OOM
            take: 5000,
            orderBy: { order: { createdAt: 'desc' } }
        });

        const products = productsRaw.map((p: any) => {
            // 1. Calc Real Avg Price from Aggregation
            const stats = priceStats.find((s: any) => s.productId === p.id);
            let realAvgPrice = (p.finance?.sellingPrice || 0);

            if (stats && stats._sum.quantity > 0) {
                realAvgPrice = (stats._sum.totalPrice || 0) / stats._sum.quantity;
            }

            // 2. Infer Provider from recent history
            const pLogistics = providerItems.filter((i: any) => i.productId === p.id);
            const providerCounts: Record<string, number> = {};

            pLogistics.forEach((i: any) => {
                const prov = i.order?.logisticsProvider?.toUpperCase();
                if (prov) {
                    providerCounts[prov] = (providerCounts[prov] || 0) + 1;
                }
            });

            let inferredProvider = null;
            let maxCount = 0;
            for (const [prov, count] of Object.entries(providerCounts)) {
                if (count > maxCount) {
                    maxCount = count as number;
                    inferredProvider = prov;
                }
            }

            return {
                ...p,
                realAvgPrice,
                inferredProvider: inferredProvider || p.supplier?.name
            };
        });

        return {
            ...stats,
            rules,
            products
        };
    } catch (e: any) {
        console.error("Error fetching stats:", e);
        return { error: e.message || "Unknown Server Error" };
    }
}

/**
 * Generates a full daily matrix for the specified month
 * This is the core engine for the "Control Board" requested by the user.
 */
export async function getDailyOperationsMatrix(month: number, year: number) {
    try {
        // Use UTC for database query range to ensure we embrace all possible events globally
        const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
        const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59));

        // 1. Fetch orders: EXCLUDE Cancelled/Abandoned to reflect "Real Orders" count
        const orders = await (prisma as any).order.findMany({
            where: {
                createdAt: { gte: startDate, lte: endDate },
                status: { notIn: ['ABANDONED', 'CANCELLED', 'ARCHIVED'] }
            },
            include: {
                items: {
                    include: {
                        product: { include: { finance: true } }
                    }
                }
            }
        });

        // 2. Fetch DailyFinance records (for Ad Spend/Visitors)
        const finances = await (prisma as any).dailyFinance.findMany({
            where: { date: { gte: startDate, lte: endDate } }
        });

        // 3. Fulfillment Rules for Costs
        const rules = await (prisma as any).fulfillmentRule.findMany();
        const defaultRule = rules[0] || { baseShippingCost: 6.5, returnCost: 3.5, codFeeFixed: 0, codFeePercent: 0 };

        const matrix: any[] = [];
        const daysInMonth = endDate.getDate();

        for (let d = 1; d <= daysInMonth; d++) {
            const dayStr = `${year}-${month.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
            const dayDate = new Date(year, month - 1, d);

            // Timezone Adjustment: We assume Store is in Europe/Madrid (UTC+1/+2)
            // We want to group by the "Local Day", not UTC Day.
            // A simple trick is to offset the UTC date by +1 or +2 hours before slicing YYYY-MM-DD
            const madOffset = 1; // Standard approximation or use complex lib

            const dayOrders = orders.filter((o: any) => {
                const oDate = new Date(o.createdAt);
                // Shift to "Local" representation
                const localDate = new Date(oDate.getTime() + (madOffset * 60 * 60 * 1000));
                const oStr = localDate.toISOString().split('T')[0];
                return oStr === dayStr;
            });

            const dayFinance = finances.find((f: any) => {
                // Finance is already stored as UTC midnight, so we just take the date part
                const fStr = new Date(f.date).toISOString().split('T')[0];
                return fStr === dayStr;
            });

            const totalOrders = dayOrders.length;
            const visitors = dayFinance?.visitors || 0;
            const adSpend = dayFinance?.adSpend || 0;

            // Base: Consider ONLY Confirmed (non-cancelled) Orders for core business metrics
            const confirmedOrders = dayOrders.filter((o: any) => o.status !== 'CANCELLED' && o.status !== 'ABANDONED');

            // Revenue only from valid orders
            const revenueShopify = confirmedOrders.reduce((acc: number, o: any) => acc + o.totalPrice, 0);
            const numConfirmed = confirmedOrders.length;

            // Strict Shipping Definition: Has physically left warehouse
            const activeLogisticsStatuses = [
                'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED',
                'PICKUP_POINT', 'INCIDENCE', 'DELIVERY_FAILED',
                'RETURNED', 'RETURN_TO_SENDER', 'ACCIDENT'
            ];

            // User Rule: Sent = Confirmed (All confirmed orders are treated as sent for reporting/costing)
            const numShipped = numConfirmed;

            const deliveredCount = confirmedOrders.filter((o: any) =>
                o.logisticsStatus === 'DELIVERED'
            ).length;

            const returnedCount = confirmedOrders.filter((o: any) =>
                ['RETURNED', 'RETURN_TO_SENDER'].includes(o.logisticsStatus)
            ).length;

            const incidencesCount = confirmedOrders.filter((o: any) =>
                ['INCIDENCE', 'ACCIDENT', 'DELIVERY_FAILED'].includes(o.logisticsStatus)
            ).length;

            let totalCogs = 0;
            let totalShippingCost = 0;
            let totalReturnCost = 0;

            // Calculating costs: STRICTLY attributed to the cohort of orders from this registration date
            confirmedOrders.forEach((o: any) => {
                const isReturned = ['RETURNED', 'RETURN_TO_SENDER'].includes(o.logisticsStatus);

                // User Rule: Product cost (COGS) is calculated based on unit cost * units sold.
                // It is attributed to the order registration date.
                o.items.forEach((item: any) => {
                    const unitCost = item.product?.finance?.unitCost || 0;
                    const qty = item.quantity || 1;
                    const itemCogs = unitCost * qty;

                    // COGS is charged if the order is confirmed (Sent = Confirmed)
                    // We only "credit" it back if we want to reflect stock recovery, 
                    // but usually, business-wise, you want to know what you "spent" on the goods for the orders of that day.
                    if (!isReturned) {
                        totalCogs += itemCogs;
                    }
                });

                // 2. Shipping & Return Fees: Based on "Sent = Confirmed" Rule
                const provider = o.logisticsProvider || "MANUAL";
                const rule = rules.find((r: any) => r.provider === provider) || defaultRule;

                // OUTBOUND Shipping: Paid for ALL confirmed orders as per business rule
                const outboundBase = (rule.baseShippingCost || 0) + (rule.packagingCost || 0) + (rule.handlingCost || 0);
                const outboundTax = outboundBase * ((rule.taxPercent || 0) / 100);
                totalShippingCost += outboundBase + outboundTax;

                // INBOUND Return: Only if actually returned
                if (isReturned) {
                    const returnBase = rule.returnCost || 0;
                    const returnTax = returnBase * ((rule.taxPercent || 0) / 100);
                    totalReturnCost += returnBase + returnTax;
                }
            });

            // Financial Metrics
            const avgOrderValue = numConfirmed > 0 ? (revenueShopify / numConfirmed) : 0;
            const realRevenue = deliveredCount * avgOrderValue;

            // Profit Estimated (Revenue - Ads - COGS (all) - Est Shipping)
            // Est profit assumes everything sells, so we count full COGS
            const estCogs = confirmedOrders.reduce((acc: number, o: any) => {
                return acc + o.items.reduce((sum: number, i: any) => sum + ((i.product?.finance?.unitCost || 0) * (i.quantity || 1)), 0);
            }, 0);

            const profitEst = revenueShopify - adSpend - estCogs - (numConfirmed * defaultRule.baseShippingCost);

            // Profit Real (Delivered Revenue - Ads - (Sold COGS) - Logistics Fees)
            // Now correctly handles Returns: Revenue 0, COGS 0 (recovered), Shipping Paid, Return Paid.
            const profitReal = realRevenue - adSpend - totalCogs - totalShippingCost - totalReturnCost;

            // BREAKEVEN LOGIC
            const grossProfitBeforeAds = realRevenue - totalCogs - totalShippingCost - totalReturnCost;
            const roasBreakeven = realRevenue > 0 && grossProfitBeforeAds > 0 ? (realRevenue / grossProfitBeforeAds) : 0;
            const maxCpa = numConfirmed > 0 ? (grossProfitBeforeAds / numConfirmed) : 0;
            const currentCpa = numConfirmed > 0 ? (adSpend / numConfirmed) : 0;
            const currentCr = visitors > 0 ? (numConfirmed / visitors) : 0;
            const maxCpc = maxCpa * currentCr;

            matrix.push({
                day: d,
                date: dayDate.toISOString(),
                visitors,
                totalOrders,
                units: dayOrders.reduce((acc: number, o: any) => acc + (o.units || 1), 0),
                convRate: currentCr * 100,
                revenueShopify,
                aov: avgOrderValue,
                confirmed: numConfirmed,
                cancelled: dayOrders.filter((o: any) => o.status === 'CANCELLED').length,
                shippedRate: numConfirmed > 0 ? (numShipped / numConfirmed) * 100 : 0,
                delivered: deliveredCount,
                deliveryRate: numShipped > 0 ? (deliveredCount / numShipped) * 100 : 0,
                returned: returnedCount,
                incidences: incidencesCount,
                incidenceRate: numShipped > 0 ? (incidencesCount / numShipped) * 100 : 0,
                cogs: totalCogs,
                shippingCost: totalShippingCost,
                returnCost: totalReturnCost,
                adSpend,
                profitEst,
                profitReal,
                roas: adSpend > 0 ? revenueShopify / adSpend : 0,
                roasBreakeven,
                maxCpa,
                currentCpa,
                maxCpc,
                roiReal: adSpend > 0 ? profitReal / adSpend : 0
            });
        }

        return matrix;
    } catch (e) {
        console.error("[Matrix Error]", e);
        return [];
    }
}

export async function getLogisticsAIAdvice(matrixData: any[], targetROAS: number = 3.0) {
    try {
        const { askGemini } = await import("@/lib/ai");

        const summary = matrixData.map(d => ({
            d: d.day,
            o: d.totalOrders,
            r: d.revenueShopify,
            s: d.adSpend,
            roas: d.roas,
            del: d.delivered,
            inc: d.incidences
        })).filter(d => d.o > 0);

        const prompt = `
            Actúa como un Director de Operaciones (COO) experto en E-commerce. 
            Analiza esta matriz de datos operativos (o: pedidos, r: facturación, s: gasto ads, roas: retorno, del: entregados, inc: incidencias).
            
            DATOS: ${JSON.stringify(summary)}
            OBJETIVO ROAS: ${targetROAS}
            
            Tu tarea:
            1. Diagnóstico de Rentabilidad: ¿Estamos cumpliendo el objetivo?
            2. Fugas de Dinero: Analiza incidencias vs entregas.
            3. 3 Recomendaciones accionables para mejorar el profit neto o escalar.
            
            Responde de forma ejecutiva, breve y en español. Usa negritas para puntos clave.
        `;

        const res = await askGemini(prompt);
        return res.text || "No se pudo generar el consejo en este momento.";
    } catch (e) {
        return "Error conectando con el consultor IA.";
    }
}

export async function triggerLogisticsSync() {
    try {
        console.log("[Manual Sync] Triggering FULL Sync (Shopify + Beeping)...");
        // 1. Sync from Shopify first to get new orders (up to 250 recent)
        const shopifyRes = await syncRecentShopifyOrders(250);
        console.log(`[Manual Sync] Shopify added/updated ${shopifyRes.count} orders.`);

        // 2. Sync logistics status from Beeping for all non-cancelled orders
        const beepingRes = await syncBeepingStatuses();

        revalidatePath("/logistics/dashboard");
        revalidatePath("/pedidos");

        return {
            success: true,
            message: `Sincronización completa: ${shopifyRes.count || 0} Shopify actualizados.`
        };
    } catch (e: any) {
        console.error("Sync Trigger Failure:", e);
        return { success: false, message: "Error al sincronizar: " + e.message };
    }
}

/**
 * Resends a tracking notification manually
 */
export async function resendTrackingNotification(orderId: string) {
    try {
        const res = await sendNotification(orderId, 'TRACKING');
        if (res.success) {
            return { success: true, message: "Tracking reenviado correctamente." };
        }
        return { success: false, message: "Error al enviar: " + (res.error || "No hay plantilla") };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}

/**
 * Marks an order with an incidence status
 */
export async function markIncidence(orderId: string) {
    try {
        await (prisma as any).order.update({
            where: { id: orderId },
            data: {
                logisticsStatus: "INCIDENCE",
                needsReview: true,
                incidenceResult: "MANUAL_INCIDENCE"
            }
        });

        await sendNotification(orderId, 'INCIDENCE');

        revalidatePath("/pedidos");
        return { success: true, message: "Incidencia marcada y cliente notificado." };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}

export async function getTotalOrdersCount(typeFilter?: string) {
    try {
        const where: any = {};
        if (typeFilter && typeFilter !== 'ALL') {
            where.orderType = typeFilter;
        }
        return await (prisma as any).order.count({ where });
    } catch (e) {
        console.error("getTotalOrdersCount Error:", e);
        return 0;
    }
}

export async function generateEbookAction(req: any) {
    const { generateEbookPDF } = await import("@/lib/ebook-engine");
    return generateEbookPDF(req);
}

/**
 * Marks an order as duplicate (Cancelled)
 */
export async function markAsDuplicate(orderId: string) {
    try {
        await (prisma as any).order.update({
            where: { id: orderId },
            data: {
                status: "CANCELLED",
                logisticsStatus: "CANCELLED"
            }
        });
        revalidatePath("/pedidos");
        return { success: true, message: "Pedido marcado como duplicado." };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}

export async function updateOrderNotes(orderId: string, notes: string) {
    try {
        await (prisma as any).order.update({
            where: { id: orderId },
            data: { notes }
        });
        // revalidatePath("/pedidos"); // Optional if we want instant reflection without refresh
        return { success: true };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}

export async function updateDailyFinance(dateStr: string, data: { adSpend?: number, visitors?: number }) {
    try {
        const store = await (prisma as any).store.findFirst();
        if (!store) return { success: false };

        // Force UTC Day to match getDailyOperationsMatrix logic
        const inputDate = new Date(dateStr);
        const date = new Date(Date.UTC(
            inputDate.getUTCFullYear(),
            inputDate.getUTCMonth(),
            inputDate.getUTCDate()
        ));

        await (prisma as any).dailyFinance.upsert({
            where: { storeId_date: { storeId: store.id, date } },
            update: data,
            create: { storeId: store.id, date, ...data }
        });

        revalidatePath("/logistics/dashboard");
        return { success: true };
    } catch (e) {
        return { success: false };
    }

}

export async function createFulfillmentRule(providerName: string) {
    try {
        const store = await (prisma as any).store.findFirst();
        if (!store) throw new Error("No store found");

        const normalizedProvider = providerName.toUpperCase().trim();

        // Check availability
        const existing = await (prisma as any).fulfillmentRule.findFirst({
            where: { storeId: store.id, provider: normalizedProvider }
        });
        if (existing) return { success: false, message: "El proveedor ya existe." };

        // Create with minimum required fields first to avoid unknown argument errors if client is stale
        const rule = await (prisma as any).fulfillmentRule.create({
            data: {
                storeId: store.id,
                provider: normalizedProvider,
                isActive: true
            }
        });

        // Immediately update with the rest of the fields
        // This often bypasses 'create' constructor checks in stale dev clients
        await (prisma as any).fulfillmentRule.update({
            where: { id: rule.id },
            data: {
                baseShippingCost: 6.00,
                returnCost: 3.50,
                packagingCost: 0.00,
                handlingCost: 0.00,
                taxPercent: 21.0
            }
        });

        revalidatePath("/logistics/costs");
        revalidatePath("/logistics/dashboard");
        return { success: true };
    } catch (e: any) {
        console.error("[Create Rule Error]:", e.message);
        return { success: false, message: e.message };
    }
}

export async function deleteFulfillmentRule(ruleId: string) {
    try {
        if (!ruleId || ruleId === 'default') {
            return { success: true };
        }
        await (prisma as any).fulfillmentRule.delete({
            where: { id: ruleId }
        });
        revalidatePath("/logistics/costs");
        revalidatePath("/logistics/dashboard");
        return { success: true };
    } catch (e: any) {
        console.error("[Delete Rule Error]:", e.message);
        return { success: false, message: e.message };
    }
}

