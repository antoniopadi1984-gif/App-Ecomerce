
import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeStatusProps extends React.HTMLAttributes<HTMLDivElement> {
    status: string;
    dot?: boolean;
}

const statusConfig: Record<string, { label: string, color: string, bg: string }> = {
    // Logística
    "PENDING": { label: "Validando", color: "text-amber-800", bg: "bg-amber-100 border-amber-200" },
    "CONFIRMED": { label: "Confirmado", color: "text-emerald-800", bg: "bg-emerald-100 border-emerald-200" },
    "PROCESSING": { label: "Preparando", color: "text-blue-800", bg: "bg-blue-100 border-blue-200" },
    "READY_FOR_PICKUP": { label: "Listo Envío", color: "text-cyan-800", bg: "bg-cyan-100 border-cyan-200" },
    "SHIPPED": { label: "Enviado", color: "text-rose-800", bg: "bg-rose-100 border-rose-200" },
    "IN_TRANSIT": { label: "En Tránsito", color: "text-rose-800", bg: "bg-rose-100 border-rose-200" },
    "OUT_FOR_DELIVERY": { label: "En Reparto", color: "text-purple-800", bg: "bg-purple-100 border-purple-200" },
    "DELIVERED": { label: "Entregado", color: "text-green-800", bg: "bg-green-100 border-green-200" },
    "PICKUP_POINT": { label: "Punto Recogida", color: "text-blue-800", bg: "bg-blue-100 border-blue-200" },
    "RETURNED": { label: "Devuelto", color: "text-rose-800", bg: "bg-rose-100 border-rose-200" },
    "RETURN_TO_SENDER": { label: "Retorno", color: "text-orange-800", bg: "bg-orange-100 border-orange-200" },
    "INCIDENCE": { label: "Incidencia", color: "text-red-800", bg: "bg-red-100 border-red-200" },
    "CANCELLED": { label: "Anulado", color: "text-slate-600", bg: "bg-slate-200 border-slate-300" },
    "NO_STATUS": { label: "Sincronizando...", color: "text-sky-600", bg: "bg-sky-50 border-sky-100" },

    // Financiero / Pago
    "PAID": { label: "Pagado", color: "text-emerald-800", bg: "bg-emerald-100 border-emerald-200" },
    "COD": { label: "COD", color: "text-orange-800", bg: "bg-orange-100 border-orange-200" },
    "REFUNDED": { label: "Reembolsado", color: "text-slate-700", bg: "bg-slate-100 border-slate-200" },
};

export function BadgeStatus({ status, dot, className, ...props }: BadgeStatusProps) {
    const config = statusConfig[status] || { label: status, color: "text-slate-600", bg: "bg-slate-100" };

    return (
        <div
            className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm",
                config.bg,
                config.color,
                className
            )}
            {...props}
        >
            {dot && <div className={cn("h-1.5 w-1.5 rounded-full", config.color.replace('text', 'bg'))} />}
            {config.label}
        </div>
    )
}
