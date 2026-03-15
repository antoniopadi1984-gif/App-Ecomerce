import prisma from "./prisma";
import { sendNotification } from "./notifications";

/**
 * Logistics Status Normalizer
 * Map external statuses from different providers to our internal high-level status.
 */
export function normalizeLogisticsStatus(source: string, externalStatus: string | number): string {
    const status = String(externalStatus).toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "").trim();

    // Mapping Spanish labels (from Beeping) to internal English codes
    const SPANISH_MAP: Record<string, string> = {
        'SIN ESTADO LOGISTICO': 'PENDING',
        'EN TRANSITO': 'SHIPPED',
        'EN REPARTO': 'OUT_FOR_DELIVERY',
        'PUNTO DE RECOGIDA': 'INCIDENCE',
        'ENTREGADO': 'DELIVERED',
        'DEVUELTO AL REMITENTE': 'RETURNED',
        'CANCELADO': 'CANCELLED',
        'SINIESTRO': 'INCIDENCE',
        'PENDIENTE': 'PENDING',
        'PENDIENTE DE STOCK': 'PENDING',
        'EN PREPARACION': 'PROCESSING',
        'ENVIADO': 'SHIPPED',
        'DEVUELTO': 'RETURNED',
        'POR CONFIRMAR': 'PENDING'
    };

    if (SPANISH_MAP[status]) return SPANISH_MAP[status];

    // internal states: PENDING, PROCESSING, SHIPPED, OUT_FOR_DELIVERY, DELIVERED, RETURNED, INCIDENCE

    if (source === 'BEEPING') {
        const num = parseInt(status);
        if (!isNaN(num)) {
            // Priority 1: Shipment Status (order_shipment_status_id)
            const shipmentMap: Record<number, string> = {
                1: 'PENDING',
                2: 'SHIPPED',
                3: 'OUT_FOR_DELIVERY',
                4: 'INCIDENCE',
                5: 'DELIVERED',
                6: 'RETURNED',
                7: 'CANCELLED',
                8: 'INCIDENCE'
            };

            // Priority 2: Order Status (status)
            const orderMap: Record<number, string> = {
                1: 'PENDING',
                2: 'PENDING',
                3: 'PROCESSING',
                4: 'SHIPPED',
                5: 'RETURNED',
                6: 'PENDING',
                0: 'CANCELLED'
            };

            return shipmentMap[num] || orderMap[num] || 'PENDING';
        }
    }

    // Generic fallback
    if (status.includes('REPARTO')) return 'OUT_FOR_DELIVERY';
    if (status.includes('ENTREGADO')) return 'DELIVERED';
    if (status.includes('DEVUELTO')) return 'RETURNED';
    if (status.includes('INCIDENCIA') || status.includes('SINIESTRO')) return 'INCIDENCE';
    if (status.includes('ENVIADO')) return 'SHIPPED';
    if (status.includes('TRANSITO')) return 'SHIPPED';

    return 'PENDING';
}

/**
 * Event Logger (Event Sourcing)
 * Records a new event and updates the order status with idempotency.
 */
export async function recordOrderEvent(params: {
    orderId: string,
    source: 'SHOPIFY' | 'BEEPING' | 'DROPPI' | 'WHATSAPP' | 'AGENT' | 'ZADARMA' | '17TRACK',
    type: string,
    externalEventId?: string,
    description: string,
    payload?: any
}) {
    const { orderId, source, type, externalEventId, description, payload } = params;

    try {
        // 1. Log the event (Idempotency check happens via unique constraint)
        await (prisma as any).orderEvent.create({
            data: {
                orderId,
                source,
                type,
                externalEventId,
                description,
                payload: payload ? JSON.stringify(payload) : null
            }
        });

        // 2. If it's a logistics update, normalize and update Order
        if (type === 'LOGISTICS_UPDATE' || type === 'STATUS_CHANGE') {
            const internalStatus = normalizeLogisticsStatus(source, payload?.status || payload);
            await (prisma as any).order.update({
                where: { id: orderId },
                data: {
                    status: internalStatus,
                    logisticsStatus: String(payload?.status || payload),
                    updatedAt: new Date()
                }
            });

            // 3. Automated Communication Triggers
            if (internalStatus === 'PENDING' && type === 'STATUS_CHANGE') await sendNotification(orderId, 'CONFIRMATION');
            if (internalStatus === 'SHIPPED') await sendNotification(orderId, 'TRACKING');
            if (internalStatus === 'OUT_FOR_DELIVERY') await sendNotification(orderId, 'OUT_FOR_DELIVERY');
            if (internalStatus === 'DELIVERED') await sendNotification(orderId, 'DELIVERED');
            if (internalStatus === 'INCIDENCE') await sendNotification(orderId, 'INCIDENCE');

            // 4. Recalculate Profitability (Hardening fix 6.4)
            await calculateOrderProfit(orderId);
        }

        return { success: true };
    } catch (error: any) {
        // If it's a P2002 (Unique constraint failed), it means the event was already processed.
        if (error.code === 'P2002') {
            return { success: true, alreadyProcessed: true };
        }
        throw error;
    }
}

/**
 * Profitability Engine
 * Calculates estimated and real profit based on fulfillment rules.
 */
export async function calculateOrderProfit(orderId: string) {
    const order = await (prisma as any).order.findUnique({
        where: { id: orderId },
        include: { store: { include: { fulfillmentRules: true } }, items: true }
    });

    if (!order) return;

    // 1. Get Base Revenue (Clean of taxes and discounts)
    // totalPrice already includes taxes and shipping paid by customer in Shopify
    const revenue = order.totalPrice - (order.totalTax || 0);

    // 2. Find applicable rule for estimated costs
    const provider = order.logisticsProvider || 'BEEPING';
    const rule = (order.store as any).fulfillmentRules.find((r: any) => r.provider === provider) || {
        baseShippingCost: 6.5,
        returnCost: 3.5,
        codFeeFixed: 0,
        codFeePercent: 0,
        packagingCost: 0.5
    };

    // 3. Costs (Rule-based fallbacks)
    const baseShipping = order.shippingCost > 0 ? order.shippingCost : rule.baseShippingCost;
    const baseCodFee = order.paymentMethod === 'COD' ? (rule.codFeeFixed + (order.totalPrice * rule.codFeePercent / 100)) : 0;
    const basePackaging = rule.packagingCost || 0.5;

    // 4. COGS (Cost of Goods Sold) and Product-Level Fulfillment Costs
    let totalCogs = 0;
    let totalProductShipping = 0;
    let totalProductReturn = 0;
    let totalProductPackaging = 0;
    let totalProductCodFee = 0;
    let totalProductInsurance = 0;

    if (order.items && order.items.length > 0) {
        for (const item of order.items) {
            // Get Finance info for each product
            const pf = await (prisma as any).productFinance.findUnique({
                where: { productId: item.productId }
            });

            const qty = item.quantity || item.units || 1;
            totalCogs += (item.unitCost || pf?.unitCost || 0) * qty;

            // Additive product-level logistics costs
            totalProductShipping += (pf?.shippingCost || 0) * qty;
            totalProductReturn += (pf?.returnCost || 0) * qty;
            totalProductPackaging += (pf?.packagingCost || 0) * qty;
            totalProductCodFee += (pf?.codFee || 0) * qty;
            totalProductInsurance += (pf?.insuranceFee || 0) * qty;
        }
    }

    // 5. Aggregate Costs
    // Use rule-based fallback only if product-level costs are zero
    const finalShipping = totalProductShipping > 0 ? totalProductShipping : baseShipping;
    const finalPackaging = totalProductPackaging > 0 ? totalProductPackaging : basePackaging;
    const finalInsurance = totalProductInsurance;

    // COD fee priority: Product-level > Rule-based
    let finalCodFee = totalProductCodFee;
    if (finalCodFee === 0 && order.paymentMethod === 'COD') {
        finalCodFee = baseCodFee;
    }

    const estimatedProfit = revenue - (finalShipping + finalCodFee + totalCogs + finalPackaging + finalInsurance);
    const fulfillmentCost = finalShipping + finalCodFee + finalPackaging + finalInsurance;

    // Real Profit depends on final status
    let netProfit = null;
    const status = order.logisticsStatus || order.status;

    if (status === 'DELIVERED') {
        netProfit = revenue - (fulfillmentCost + totalCogs);
    } else if (status === 'RETURNED' || status === 'RETURN_TO_SENDER' || status === 'INCIDENCE') {
        // Return cost priority: Product-level > Rule-based
        const returnCost = totalProductReturn > 0 ? totalProductReturn : rule.returnCost;
        netProfit = -(fulfillmentCost + returnCost + totalCogs);
    } else if (status === 'CANCELLED') {
        netProfit = 0;
    }

    const netMargin = netProfit !== null ? (netProfit / (revenue || 1)) : null;

    await (prisma as any).order.update({
        where: { id: orderId },
        data: {
            estimatedProfit,
            realProfit: netProfit, // Keep for legacy
            fulfillmentCost,
            netProfit,
            netMargin
        }
    });

    console.log(`[Profit] Order ${order.orderNumber}: Rev ${revenue}, Cost ${fulfillmentCost}, COGS ${totalCogs} => Net Profit ${netProfit ?? estimatedProfit}`);
}

/**
 * Fetches all previous activity for a specific customer
 */
export async function getCustomerHistory(email?: string, phone?: string) {
    if (!email && !phone) return [];
    try {
        return await (prisma as any).order.findMany({
            where: {
                OR: [
                    email ? { customerEmail: email } : {},
                    phone ? { customerPhone: phone } : {}
                ].filter(o => Object.keys(o).length > 0)
            },
            orderBy: { createdAt: 'desc' },
            select: { id: true, orderNumber: true, status: true, logisticsStatus: true, totalPrice: true, createdAt: true, incidenceResult: true }
        });
    } catch (error) { return []; }
}

/**
 * Advanced Risk Assessment (Semaforo de Riesgo)
 */
export async function calculateOrderRisk(orderId: string) {
    const order = await (prisma as any).order.findUnique({
        where: { id: orderId },
        include: { items: true }
    });

    if (!order) return;

    let score = 0;
    const reasons: string[] = [];

    // 1. High Value / Units Risk
    const totalUnits = order.items?.reduce((acc: number, item: any) => acc + (item.units || item.quantity || 1), 0) || order.units || 1;
    if (totalUnits > 4) {
        score += 20;
        reasons.push("Alta cantidad de unidades");
    }

    // 2. No Phone or Invalid Phone
    const cleanPhone = (order.customerPhone || "").replace(/\D/g, "");
    if (cleanPhone.length < 9) {
        score += 30;
        reasons.push("Teléfono corto");
    }

    // 3. Address Validation Status (Synced with Geocoding system)
    if (order.addressStatus === "FAILED" || order.addressStatus === "INVALID") {
        score += 35;
        reasons.push("Dirección no encontrada");
    } else if (order.addressStatus === "NEEDS_REVIEW") {
        score += 10;
        reasons.push("Dirección imprecisa");
    }

    // 4. Customer History (Repeat offender)
    const history = await getCustomerHistory(order.customerEmail, order.customerPhone);
    const problematic = history.filter((h: any) => {
        if (h.id === orderId) return false;

        const isCancelled = h.status === 'CANCELLED';
        const isLogisticsIssue = ['RETURNED', 'RETURN_TO_SENDER', 'DELIVERY_FAILED', 'INCIDENCE', 'ACCIDENT'].includes(h.logisticsStatus);
        const hasBadNotes = (h.incidenceResult || "").toUpperCase().match(/(INCIDENCIA|DEVUELTO|CANCELADO|FRAUDE)/);

        return isCancelled || isLogisticsIssue || hasBadNotes;
    });

    if (problematic.length > 0) {
        // If they have multiple issues, it's CRITICAL
        if (problematic.length >= 2) {
            score += 85; // Almost guaranteed HIGH RISK
            reasons.push(`CLIENTE CRÍTICO: ${problematic.length} fallos previos`);
        } else {
            score += 45; // Significant penalty
            reasons.push(`Historial con ${problematic.length} incidencia/cancelación`);
        }
    }

    // 5. DUPLICATE DETECTION (Strict check)
    const twentyFourHoursAgo = new Date(new Date(order.createdAt).getTime() - 24 * 60 * 60 * 1000);
    const possibleDuplicate = await (prisma as any).order.findFirst({
        where: {
            id: { not: orderId },
            addressLine1: order.addressLine1,
            customerName: order.customerName,
            createdAt: { gte: twentyFourHoursAgo },
            status: { notIn: ['CANCELLED', 'RETURNED'] }
        }
    });

    if (possibleDuplicate) {
        score += 90;
        reasons.push(`POSIBLE DUPLICADO (${possibleDuplicate.orderNumber})`);
    }

    // Determine Level
    let level = "LOW";
    if (score >= 80) level = "HIGH";
    else if (score >= 45) level = "MEDIUM";

    await (prisma as any).order.update({
        where: { id: orderId },
        data: {
            riskScore: score,
            riskLevel: level,
            incidenceResult: reasons.length > 0 ? reasons.join(" | ") : (order.incidenceResult || null)
        }
    });

    console.log(`[Risk] Order ${order.orderNumber}: Score ${score} (${level}) - Reasons: ${reasons.join(", ") || "None"}`);

    return { score, level, reasons };
}

/**
 * Returns a direct tracking link based on carrier and tracking code.
 * Specialized for common Spanish carriers.
 */
export function getCarrierTrackingUrl(carrier: string, code: string): string {
    if (!carrier || !code) return "#";

    const c = carrier.toUpperCase();
    const cleanCode = code.trim();

    // Normalization logic for common carriers
    if (c.includes("GLS")) {
        return `https://www.gls-spain.es/es/ayuda/seguimiento-envio/?pedido=${cleanCode}`;
    }
    if (c.includes("CORREOS EXPRESS") || c.includes("CEX")) {
        return `https://www.correosexpress.com/web/correosexpress/consultanos?p_p_id=seguimiento_envio_WAR_seguimiento_envioportlet&p_p_lifecycle=0&p_p_state=normal&p_p_mode=view&_seguimiento_envio_WAR_seguimiento_envioportlet_numExpedicion=${cleanCode}`;
    }
    if (c.includes("CORREOS") && !c.includes("EXPRESS")) {
        return `https://www.correos.es/es/es/herramientas/localizador/detalles?numero=${cleanCode}`;
    }
    if (c.includes("SEUR")) {
        return `https://www.seur.com/livetracking/pages/seguimiento-online-busqueda.do?idReferencia=${cleanCode}`;
    }
    if (c.includes("MRW")) {
        return `https://www.mrw.es/seguimiento_envios/MRW_resultado_consulta.asp?envioseguimiento=${cleanCode}`;
    }
    if (c.includes("ZELERIS")) {
        return `https://www.zeleris.com/seguimiento_envio.aspx?id=${cleanCode}`;
    }
    if (c.includes("TIPS") || c.includes("TIPSA")) {
        return `https://www.tip-sa.com/seguimiento-envios?n_guia=${cleanCode}`;
    }

    // Default: return code or a generic search if no URL matches
    return `https://www.google.com/search?q=tracking+${carrier}+${cleanCode}`;
}
