// lib/orderStates.ts

export const ORDER_STATES = {
    nuevo: { label: "Nuevo", color: "#3b82f6", bg: "rgba(59,130,246,0.1)", icon: "⬤" },
    en_gestion: { label: "En Gestión", color: "#eab308", bg: "rgba(234,179,8,0.1)", icon: "⬤" },
    confirmado: { label: "Confirmado", color: "#22c55e", bg: "rgba(34,197,94,0.1)", icon: "⬤" },
    en_preparacion: { label: "En Preparación", color: "#7c3aed", bg: "rgba(124,58,237,0.1)", icon: "⬤" },
    enviado: { label: "Enviado", color: "#06b6d4", bg: "rgba(6,182,212,0.1)", icon: "⬤" },
    entregado: { label: "Entregado", color: "#15803d", bg: "rgba(21,128,61,0.1)", icon: "⬤" },
    fallido: { label: "Fallido", color: "#ef4444", bg: "rgba(239,68,68,0.1)", icon: "⬤" },
    reintento: { label: "Reintento", color: "#f97316", bg: "rgba(249,115,22,0.1)", icon: "⬤" },
    devolucion: { label: "Devolución", color: "#ec4899", bg: "rgba(236,72,153,0.1)", icon: "⬤" },
    cancelado: { label: "Cancelado", color: "#334155", bg: "rgba(51,65,85,0.1)", icon: "⬤" },
} as const;

export type OrderState = keyof typeof ORDER_STATES;
