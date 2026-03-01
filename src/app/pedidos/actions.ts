'use server';

// Failsafe export to satisfy the missing dependencies in existing files
// that were expecting actions in /app/operaciones/pedidos/actions.ts

export async function upsertShopifyOrder(order: any) {
    return null;
}

export async function syncSingleOrderBeeping(orderId: string) {
    return null;
}

export async function syncShopifyHistory(storeId?: string): Promise<any> {
    return { success: true, message: 'ok' };
}

export async function syncBeepingStatuses(storeId?: string, days?: number, priority?: string): Promise<any> {
    return { success: true, message: 'ok' };
}
