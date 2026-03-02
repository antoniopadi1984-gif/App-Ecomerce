export type GestorType = "bot" | "empleado" | "sistema" | null;

export interface OrderAssignment {
    orderId: string;
    gestorType: GestorType;
    gestorId: string | null;    // userId si es empleado, agentId si es bot
    gestorNombre: string;           // "Bot COD", "María García", "Sistema"
    assignedAt: Date;
    action: string;           // "confirmado", "modificado", "cancelado", etc.
    notes: string | null;
}
