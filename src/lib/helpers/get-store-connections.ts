// src/lib/helpers/get-store-connections.ts
// Fuente única de verdad para obtener clientes por tienda

import prisma from '@/lib/prisma';
import { BeepingClient } from '@/lib/beeping';
import { TrackSeventeenClient } from '@/lib/17track';
import { ShopifyClient } from '@/lib/shopify';

export async function getAllStores() {
    return prisma.store.findMany({
        include: { connections: true }
    });
}

export function getBeepingClient(store: any): BeepingClient | null {
    const conn = store.connections?.find((c: any) => c.provider === 'BEEPING' && c.isActive);
    if (!conn?.apiKey) return null;
    return new BeepingClient(conn.apiKey, conn.extraConfig || undefined);
}

export function get17trackClient(store: any): TrackSeventeenClient | null {
    const conn = store.connections?.find((c: any) => c.provider === '17TRACK' && c.isActive);
    const apiKey = conn?.apiKey || process.env.TRACK17_API_KEY;
    if (!apiKey) return null;
    return new TrackSeventeenClient(apiKey);
}

export function getShopifyClient(store: any): ShopifyClient | null {
    const conn = store.connections?.find((c: any) => c.provider === 'SHOPIFY' && c.isActive);
    if (!conn?.apiKey || !conn?.extraConfig) return null;
    return new ShopifyClient(conn.extraConfig, conn.apiKey);
}
