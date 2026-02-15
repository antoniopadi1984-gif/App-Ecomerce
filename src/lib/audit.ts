import prisma from "@/lib/prisma";

export interface AuditEntry {
    storeId: string;
    userId?: string;
    action: string;
    entity: string;
    entityId: string;
    oldValue?: string | object | null;
    newValue?: string | object | null;
    actorType?: "HUMAN" | "IA" | "SYSTEM";
}

/**
 * Registra un evento en el AuditLog centralizado.
 * Convierte automáticamente objetos a JSON string.
 */
export async function logAudit(entry: AuditEntry): Promise<void> {
    try {
        await prisma.auditLog.create({
            data: {
                storeId: entry.storeId,
                userId: entry.userId || null,
                action: entry.action,
                entity: entry.entity,
                entityId: entry.entityId,
                oldValue: entry.oldValue
                    ? typeof entry.oldValue === "string"
                        ? entry.oldValue
                        : JSON.stringify(entry.oldValue)
                    : null,
                newValue: entry.newValue
                    ? typeof entry.newValue === "string"
                        ? entry.newValue
                        : JSON.stringify(entry.newValue)
                    : null,
                actorType: entry.actorType || "HUMAN",
            },
        });
    } catch (error) {
        // Audit should never crash the caller
        console.error("[AuditLog] Error logging:", error);
    }
}

/**
 * Registra un evento con contexto simplificado (para server actions).
 */
export async function logAuditSimple(
    storeId: string,
    action: string,
    entity: string,
    entityId: string,
    details?: object
): Promise<void> {
    return logAudit({
        storeId,
        action,
        entity,
        entityId,
        newValue: details || null,
        actorType: "HUMAN",
    });
}
