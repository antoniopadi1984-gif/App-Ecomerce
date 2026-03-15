import { prisma } from '@/lib/prisma';
import { JobHandler } from "../worker";

/**
 * syncOrdersToDb — Upsert shopify orders into BD
 */
export async function syncOrdersToDb(storeId: string, orders: any[]) {
    let syncedCount = 0;

    for (const order of orders) {
        try {
            const shopifyId = order.id;
            const orderNumber = order.name;

            const logisticsStatus = order.displayFulfillmentStatus;

            // Map fulfillment status to internal logistics status
            const status = mapShopifyStatusToInternal(order.displayFulfillmentStatus, order.displayFinancialStatus);

            const orderData: any = {
                storeId,
                orderNumber,
                shopifyId,
                logisticsProvider: "SHOPIFY",
                fulfillmentStatus: order.displayFulfillmentStatus,
                financialStatus: order.displayFinancialStatus,
                totalPrice: parseFloat(order.totalPriceSet.shopMoney.amount),
                customerName: order.customer ? `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim() : null,
                customerEmail: order.customer?.email,
                customerPhone: order.customer?.phone || order.shippingAddress?.phone,
                addressLine1: order.shippingAddress?.address1,
                addressLine2: order.shippingAddress?.address2,
                city: order.shippingAddress?.city,
                province: order.shippingAddress?.province,
                zip: order.shippingAddress?.zip,
                country: order.shippingAddress?.country || "ES",
                trackingCode: order.fulfillments?.[0]?.trackingInfo?.[0]?.number,
                trackingUrl: order.fulfillments?.[0]?.trackingInfo?.[0]?.url,
                carrier: order.fulfillments?.[0]?.trackingInfo?.[0]?.company,
                status,
                rawJson: JSON.stringify(order),
                updatedAt: new Date(),
                shopifyUpdatedAt: order.updatedAt ? new Date(order.updatedAt) : new Date()
            };

            const upsertedOrder = await (prisma as any).order.upsert({
                where: { shopifyId },
                update: orderData,
                create: orderData
            });

            // Sync Line Items
            if (order.lineItems?.nodes) {
                for (const item of order.lineItems.nodes) {
                    const variantId = item.variant?.id;
                    const sku = item.variant?.sku;

                    // Try to find matching product in our DB
                    const product = await (prisma as any).product.findFirst({
                        where: {
                            OR: [
                                { shopifyId: item.productId }, // if available
                                { variants: { contains: variantId } }, // hypothetical
                                { sku: sku }
                            ]
                        }
                    });

                    await (prisma as any).orderItem.upsert({
                        where: {
                            orderId_variantId: {
                                orderId: upsertedOrder.id,
                                variantId: variantId || 'N/A'
                            }
                        },
                        update: {
                            title: item.title,
                            quantity: item.quantity,
                            price: parseFloat(item.variant?.price?.amount || 0),
                            productId: product?.id
                        },
                        create: {
                            orderId: upsertedOrder.id,
                            productId: product?.id,
                            variantId: variantId || 'N/A',
                            sku: sku,
                            title: item.title,
                            quantity: item.quantity,
                            price: parseFloat(item.variant?.price?.amount || 0)
                        }
                    });
                }
            }

            syncedCount++;
        } catch (e) {
            console.error(`🛑 [Shopify Sync] Error syncing order ${order.name}:`, e);
        }
    }

    return syncedCount;
}

/**
 * syncProductsToDb — Upsert shopify products into BD
 */
export async function syncProductsToDb(storeId: string, products: any[]) {
    let syncedCount = 0;

    for (const prod of products) {
        try {
            console.log(`[Shopify Sync] Processing product: ${prod.title} (ID: ${prod.id})`);
            
            // Flexibilidad para nodos de variants (GraphQL vs REST)
            const variantNodes = prod.variants?.nodes || (Array.isArray(prod.variants) ? prod.variants : []);
            const mainVariant = variantNodes[0];

            // Normalizar shopifyId — quitar prefijo GID si existe
            const rawId = prod.id || '';
            const normalizedShopifyId = rawId.includes('gid://') 
                ? rawId.split('/').pop() 
                : rawId;

            const productData: any = {
                storeId,
                shopifyId: normalizedShopifyId,
                title: prod.title,
                handle: prod.handle,
                status: prod.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
                price: parseFloat(mainVariant?.price?.amount || mainVariant?.price || 0),
                sku: mainVariant?.sku,
                imageUrl: prod.images?.nodes?.[0]?.url || (Array.isArray(prod.images) ? prod.images[0]?.url : null),
                productType: prod.productType,
                vendor: prod.vendor,
                tags: Array.isArray(prod.tags) ? prod.tags.join(',') : prod.tags,
                updatedAt: new Date()
            };

            // Buscar por shopifyId + storeId para evitar duplicados entre tiendas
            const existing = await (prisma as any).product.findFirst({
                where: { shopifyId: normalizedShopifyId, storeId }
            });

            if (existing) {
                await (prisma as any).product.update({
                    where: { id: existing.id },
                    data: productData
                });
            } else {
                await (prisma as any).product.create({ data: productData });
            }

            console.log(`[Shopify Sync] ✅ Product synced: ${prod.title}`);
            syncedCount++;
        } catch (e: any) {
            console.error(`🛑 [Shopify Sync] Error syncing product ${prod.title}:`, e.message);
        }
    }

    return syncedCount;
}

function mapShopifyStatusToInternal(fulfillmentStatus: string, financialStatus: string): string {
    if (fulfillmentStatus === 'FULFILLED') return 'DELIVERED';
    if (fulfillmentStatus === 'IN_PROGRESS') return 'IN_TRANSIT';
    if (fulfillmentStatus === 'RESTOCKED') return 'RETURNED';

    if (financialStatus === 'REFUNDED' || financialStatus === 'VOIDED') return 'CANCELLED';

    return 'PENDING';
}

const shopifySyncHandler: JobHandler = {
    handle: async (payload, onProgress, jobId) => {
        const storeId = payload.storeId || 'store-main';
        await onProgress(10);
        console.log(`🚀 [Worker] Starting Shopify Sync for ${storeId} (Not fully implemented here, rely on webhook)`);
        await onProgress(100);
        return { success: true, message: 'Shopify sync scheduled/completed' };
    }
};

export default shopifySyncHandler;
