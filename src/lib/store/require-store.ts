/**
 * requireStoreContext — Guard server-side para API Routes y Server Actions.
 *
 * Lee X-Store-Id del request y valida que el store existe.
 * Si falta: devuelve null y se espera que el caller responda 400.
 *
 * Uso en API Route:
 *   const storeId = await requireStoreContext(request);
 *   if (!storeId) return NextResponse.json({ error: "..." }, { status: 400 });
 *
 * Uso en Server Action:
 *   export async function myAction(storeId: string) {
 *       const validId = await validateStoreId(storeId);
 *       if (!validId) throw new Error("Store no válido");
 *   }
 */

import prisma from "@/lib/prisma";

/**
 * Para API Routes: extrae y valida X-Store-Id del request.
 * Registra AuditLog si falta el header.
 */
export async function requireStoreContext(request: Request): Promise<string | null> {
    const storeId = request.headers.get("X-Store-Id");

    if (!storeId) {
        // Registrar intento sin store context
        try {
            await prisma.auditLog.create({
                data: {
                    action: "STORE_HEADER_MISSING",
                    entity: "SYSTEM",
                    entityId: "unknown",
                    storeId: "unknown",
                    actorType: "SYSTEM",
                    newValue: new URL(request.url).pathname,
                },
            });
        } catch (_) {
            // No bloquear si audit falla
        }
        return null;
    }

    // Verificar que el store existe
    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) {
        return null;
    }

    return storeId;
}

/**
 * Para Server Actions: valida que un storeId es real.
 */
export async function validateStoreId(storeId: string): Promise<string | null> {
    if (!storeId) return null;

    const store = await prisma.store.findUnique({ where: { id: storeId } });
    return store ? storeId : null;
}

/**
 * Helper de respuesta estándar para store faltante.
 */
export function storeRequiredResponse() {
    return Response.json(
        { error: "Selecciona una tienda activa para continuar." },
        { status: 400 }
    );
}
