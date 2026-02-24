/**
 * connection-registry.ts
 * Single Source of Truth for integration availability in the UI.
 * Used to avoid showing fake/empty dashboards when a service isn't linked.
 */

export type ServiceName = 'SHOPIFY' | 'META_ADS' | 'BEEPING' | 'REPLICATE' | 'CLAUDE' | 'GEMINI' | 'VERTEX' | 'ELEVENLABS' | 'CLARITY_PROPERTY';

export interface ConnectionState {
    service: ServiceName;
    isConnected: boolean;
    lastSync?: Date;
    error?: string;
}

/**
 * Checks if a specific service is connected for a given store.
 * In a real scenario, this would check Prisma/DB. For now, it delegates to an API.
 */
export async function checkConnection(service: ServiceName, storeId?: string | null, userId?: string | null): Promise<boolean> {
    if (!storeId && !userId) return false;

    try {
        const queryParams = new URLSearchParams({ service });
        if (storeId) queryParams.append('storeId', storeId);
        if (userId) queryParams.append('userId', userId);

        const res = await fetch(`/api/connections/status?${queryParams.toString()}`, {
            // cache: 'no-store' if we want totally fresh, or we can use next.js revalidation
            next: { revalidate: 60 }
        });
        if (!res.ok) return false;

        const data = await res.json();
        return data.isConnected === true;
    } catch (e) {
        console.error(`Error checking connection for ${service}:`, e);
        return false;
    }
}

/**
 * Hook logic (Client Side) can be built on top of this or use SWR/React Query.
 */
