import { OrderState } from './orderStates';

// Tipos genéricos temporales hasta que se definan las interfaces completas
export type ShopifyOrder = any;
export type AnyOrder = any;

// BEEPING → EcomBoom
export const BEEPING_STATUS_MAP: Record<string, OrderState> = {
    "1": "nuevo",           // Pendiente
    "2": "en_preparacion",  // Pendiente de stock
    "3": "en_preparacion",  // En preparación
    "4": "enviado",         // Enviado
    "5": "devolucion",      // Devuelto
    "6": "nuevo",           // Por confirmar
    "0": "cancelado",       // Cancelado
}

export const BEEPING_SHIPMENT_MAP: Record<string, OrderState> = {
    "1": "confirmado",      // Sin estado logístico = confirmado listo
    "2": "enviado",         // En Tránsito
    "3": "enviado",         // En Reparto
    "4": "enviado",         // Punto de recogida
    "5": "entregado",       // Entregado
    "6": "devolucion",      // Devuelto al Remitente
    "7": "cancelado",       // Cancelado
    "8": "fallido",         // Siniestro
}

// SHOPIFY → EcomBoom
export const SHOPIFY_FULFILLMENT_MAP: Record<string, OrderState> = {
    "unfulfilled": "confirmado",
    "partial": "en_preparacion",
    "fulfilled": "enviado",
    "restocked": "devolucion",
    "pending": "nuevo",
}

export const SHOPIFY_FINANCIAL_MAP: Record<string, OrderState> = {
    "pending": "nuevo",
    "authorized": "confirmado",
    "paid": "confirmado",
    "refunded": "devolucion",
    "voided": "cancelado",
}

// Shopify sin fulfillment propio — detectar estado automáticamente
// Si payment_status = paid y fulfillment = null → "confirmado"
// Si payment_status = paid y fulfillment = fulfilled → "enviado"
// Si tiene tracking_number → "enviado"
// Si no tiene fulfillment provider → buscar tracking_number para determinar estado

export function mapShopifyOrder(order: ShopifyOrder): OrderState {
    // Si tiene tracking → enviado o entregado según fecha
    if (order.fulfillments?.length > 0) {
        const fulfillment = order.fulfillments[0];
        if (fulfillment.shipment_status === "delivered") return "entregado";
        if (fulfillment.shipment_status === "failure") return "fallido";
        if (fulfillment.status === "success") return "enviado";
    }
    if (order.fulfillment_status === "fulfilled") return "enviado";
    if (order.fulfillment_status === "unfulfilled" && order.financial_status === "paid") return "confirmado";
    if (order.financial_status === "refunded") return "devolucion";
    if (order.financial_status === "voided") return "cancelado";
    if (order.cancelled_at) return "cancelado";

    return "nuevo";
}

// DROPEA → EcomBoom (añadir cuando se tenga documentación)
export const DROPEA_STATUS_MAP: Record<string, OrderState> = {}

// DROPI webhook → EcomBoom (añadir cuando lleguen webhooks)
export const DROPI_STATUS_MAP: Record<string, OrderState> = {}

// Función universal — detecta la fuente y mapea automáticamente
export function mapToEcomBoomState(order: AnyOrder, source: "shopify" | "beeping" | "dropea" | "dropi"): OrderState {
    switch (source) {
        case "beeping":
            // Priorizar estado logístico sobre estado de pedido
            if (order.tracking_stage && BEEPING_SHIPMENT_MAP[order.tracking_stage]) {
                return BEEPING_SHIPMENT_MAP[order.tracking_stage];
            }
            return BEEPING_STATUS_MAP[order.status] ?? "nuevo";
        case "shopify":
            return mapShopifyOrder(order);
        default:
            return "nuevo";
    }
}
