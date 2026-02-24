"use client"

import * as React from "react"
import { AlertTriangle, Info, AlertOctagon, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

export type AlertScope = "ORDERS" | "PRODUCTS" | "FINANCES" | "MARKETING"
export type AlertType = "DANGER" | "WARNING" | "INFO" | "SUCCESS"

interface TableAlertProps {
    type: AlertType
    label?: string
    description?: string
    className?: string
    compact?: boolean
}

const alertConfig = {
    DANGER: {
        icon: AlertOctagon,
        label: "Riesgo",
    },
    WARNING: {
        icon: AlertTriangle,
        label: "Alerta",
    },
    INFO: {
        icon: Info,
        label: "Info",
    },
    SUCCESS: {
        icon: CheckCircle2,
        label: "OK",
    }
}

export function TableAlert({
    type,
    label,
    description,
    className,
    compact
}: TableAlertProps) {
    const config = alertConfig[type]
    const Icon = config.icon

    if (compact) {
        return (
            <TooltipProvider delayDuration={0}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className={cn("inline-flex items-center justify-center p-1 rounded-md bg-slate-50 border border-slate-200 text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-help", className)}>
                            <Icon className="size-3" />
                        </div>
                    </TooltipTrigger>
                    {description && (
                        <TooltipContent side="top" className="max-w-[200px] text-[10px] font-bold uppercase tracking-widest bg-slate-900 text-white border-none p-2 rounded-lg shadow-sm">
                            <div className="flex flex-col gap-1">
                                <span className="flex items-center gap-1.5 text-rose-400">
                                    <Icon className="size-3" />
                                    {label || config.label}
                                </span>
                                <p className="text-slate-200 capitalize tracking-normal font-medium">{description}</p>
                            </div>
                        </TooltipContent>
                    )}
                </Tooltip>
            </TooltipProvider>
        )
    }

    return (
        <TooltipProvider delayDuration={100}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div
                        className={cn(
                            "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-tight transition-colors cursor-help",
                            "bg-surface-2 border-border text-muted-text",
                            "group-hover:border-muted-text/30",
                            className
                        )}
                    >
                        <Icon className="size-3 shrink-0" />
                        <span>{label || config.label}</span>
                    </div>
                </TooltipTrigger>
                {description && (
                    <TooltipContent side="top" className="max-w-[200px] text-[11px] font-medium leading-tight">
                        <p>{description}</p>
                    </TooltipContent>
                )}
            </Tooltip>
        </TooltipProvider>
    )
}

export function AlertIconOnly({
    type,
    description,
    className
}: Omit<TableAlertProps, "label">) {
    const config = alertConfig[type]
    const Icon = config.icon

    return (
        <TooltipProvider delayDuration={100}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className={cn("p-1 text-muted-text hover:text-text transition-colors cursor-help", className)}>
                        <Icon className="size-4" />
                    </div>
                </TooltipTrigger>
                {description && (
                    <TooltipContent side="top" className="text-[11px] font-medium leading-tight">
                        <p>{description}</p>
                    </TooltipContent>
                )}
            </Tooltip>
        </TooltipProvider>
    )
}
