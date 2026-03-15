/**
 * FUENTE DE VERDAD ÚNICA — Configuración de tiendas
 * NO modificar sin autorización. Cambiar aquí afecta a todo el sistema.
 *
 * IDs verificados:
 *   store-main              → AleEssence (España)
 *   alecare-mx              → AleCare MX (México)
 *   cmlxrad5405b826d99j9kpgyy → AleCare UK (Reino Unido)
 */
export const STORES_CONFIG: Record<string, { name: string; domain: string; currency: string; supportEmail?: string }> = {
    'store-main': {
        name: 'AleEssence',
        domain: 'f7z7nn-ei.myshopify.com',
        currency: 'EUR',
        supportEmail: 'soporte@aleessence.es'  // ← .es
    },
    'alecare-mx': {
        name: 'AleCare MX',
        domain: 'im8zf5-6c.myshopify.com',
        currency: 'MXN',
        supportEmail: 'soporte@alecare.es'     // ← alecare.es
    },
    'cmlxrad5405b826d99j9kpgyy': {
        name: 'AleCare UK',
        domain: 'v1ethu-he.myshopify.com',
        currency: 'EUR',
        supportEmail: 'support@alecareshop.com' // ← alecareshop.com
    }
} as const;

export const VALID_STORE_IDS = Object.keys(STORES_CONFIG);

export function getStoreDomain(storeId: string): string | null {
    return STORES_CONFIG[storeId]?.domain ?? null;
}

export function getStoreName(storeId: string): string | null {
    return STORES_CONFIG[storeId]?.name ?? null;
}

export function getStoreCurrency(storeId: string): string | null {
    return STORES_CONFIG[storeId]?.currency ?? null;
}

/**
 * WhatsApp Business API — UNA sola cuenta para todas las tiendas
 * El número de teléfono identifica la cuenta, no la tienda
 */
export const WHATSAPP_CONFIG = {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    accessToken:   process.env.WHATSAPP_ACCESS_TOKEN    || '',
    businessId:    process.env.WHATSAPP_BUSINESS_ID     || '',
    phoneNumber:   process.env.WHATSAPP_PHONE_NUMBER    || '',
} as const;
