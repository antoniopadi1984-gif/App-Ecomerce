import { headers } from "next/headers";

/**
 * requireStoreId — Lee x-store-id de los headers de la request.
 * Si falta o es inválido, puede lanzar un error que la UI maneje.
 */
export function requireStoreId(req: Request): string {
    const storeId = req.headers.get("x-store-id");

    if (!storeId || storeId === 'default-store') {
        throw new Error("UNAUTHORIZED_STORE_CONTEXT");
    }

    return storeId;
}

/**
 * requireStoreIdNext — Versión para Route Handlers o Server Components usando next/headers.
 */
export async function requireStoreIdNext(): Promise<string> {
    const heads = await headers();
    const storeId = heads.get("x-store-id");

    if (!storeId || storeId === 'default-store') {
        throw new Error("UNAUTHORIZED_STORE_CONTEXT");
    }

    return storeId;
}
