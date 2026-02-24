/**
 * COMPAT LAYER - RE-EXPORTS FROM CANONICAL @/lib/server/connections
 * All new code should import from @/lib/server/connections directly.
 */

import {
    getStoreConnections as getStoreConnectionsCanonical,
    hasActiveConnection as hasActiveConnectionCanonical,
    getConnectionSecret,
    getConnectionMeta
} from "@/lib/server/connections";

export interface ConnectionCredentials {
    provider: string;
    apiKey: string | null;
    apiSecret: string | null;
    accessToken: string | null;
    webhookSecret: string | null;
    webhookUrl: string | null;
    extraConfig: Record<string, any> | null;
    connectionId: string;
}

/**
 * Legacy wrapper for getActiveConnection.
 * Converts canonical secret into legacy structure for compatibility.
 */
export async function getActiveConnection(
    storeId: string,
    provider: string
): Promise<ConnectionCredentials | null> {
    const meta = await getConnectionMeta(storeId, provider);
    if (!meta) return null;

    const secret = await getConnectionSecret(storeId, provider);

    return {
        provider: meta.provider,
        apiKey: secret, // En el legacy se devolvía apiKey como el secreto principal
        apiSecret: null,
        accessToken: null,
        webhookSecret: null,
        webhookUrl: null,
        extraConfig: meta.extraConfig ? JSON.parse(meta.extraConfig as string) : null,
        connectionId: meta.id,
    };
}

export const getStoreConnections = getStoreConnectionsCanonical;
export const hasActiveConnection = hasActiveConnectionCanonical;
