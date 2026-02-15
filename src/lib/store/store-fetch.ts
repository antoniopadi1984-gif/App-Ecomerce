/**
 * storeFetch — Wrapper que inyecta X-Store-Id automáticamente.
 *
 * Uso:
 *   import { storeFetch } from '@/lib/store/store-fetch';
 *   const data = await storeFetch('/api/products', storeId);
 */

export function storeFetch(
    url: string,
    storeId: string | null,
    options?: RequestInit
): Promise<Response> {
    if (!storeId) {
        return Promise.reject(new Error("No hay tienda activa. Selecciona una tienda primero."));
    }

    return fetch(url, {
        ...options,
        headers: {
            ...options?.headers,
            "X-Store-Id": storeId,
        },
    });
}

/**
 * Versión con JSON parse incluido.
 */
export async function storeFetchJson<T = any>(
    url: string,
    storeId: string | null,
    options?: RequestInit
): Promise<T> {
    const res = await storeFetch(url, storeId, options);
    if (!res.ok) {
        const text = await res.text().catch(() => "Error desconocido");
        throw new Error(`Error ${res.status}: ${text}`);
    }
    return res.json();
}
