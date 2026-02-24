import React from "react";
import { cn } from "@/lib/utils";

export function SectionCard({ className, children, density = "normal", ...props }: React.HTMLAttributes<HTMLDivElement> & { density?: "tight" | "normal" }) {
    return (
        <div
            className={cn(
                "bg-white border border-slate-200 shadow-sm rounded-lg overflow-hidden",
                density === "tight" ? "p-0" : "p-0",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}

export function SectionCardHeader({ className, title, icon: Icon, actions, density = "normal" }: { className?: string; title: string; icon?: any; actions?: React.ReactNode; density?: "tight" | "normal" }) {
    return (
        <div className={cn(
            "border-b border-slate-100 flex items-center justify-between bg-slate-50/50",
            density === "tight" ? "px-1.5 py-0.5" : "px-2 py-1",
            className
        )}>
            <div className="flex items-center gap-1.5">
                {Icon && <Icon className="w-3 h-3 text-slate-400" />}
                <h3 className="text-[12px] font-black uppercase tracking-widest text-slate-800 leading-none">{title}</h3>
            </div>
            {actions && <div className="flex items-center gap-1">{actions}</div>}
        </div>
    );
}

export function SectionCardContent({ className, children, density = "normal" }: React.HTMLAttributes<HTMLDivElement> & { density?: "tight" | "normal" }) {
    return (
        <div className={cn(
            density === "tight" ? "p-1.5" : "p-2",
            className
        )}>
            {children}
        </div>
    );
}

interface KpiCardProps {
    label: string;
    value: React.ReactNode;
    sub?: string;
    status?: "OK" | "WARNING" | "CRITICAL";
    icon?: any;
    className?: string;
    size?: "sm" | "md";
}

export function KpiCard({ label, value, sub, status, icon: Icon, className, size = "sm" }: KpiCardProps) {
    const isSm = size === "sm";

    return (
        <SectionCard className={cn(
            "flex flex-col justify-between hover:border-slate-300 transition-all",
            isSm ? "p-1.5 min-h-[44px]" : "p-2 min-h-[52px]",
            className
        )}>
            <div className={cn("flex flex-col relative h-full", isSm ? "gap-0" : "gap-0.5")}>
                <div className="flex items-start justify-between mb-0.5">
                    <div className="flex items-center gap-1">
                        {Icon && <Icon className="w-3 h-3 text-slate-400" />}
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 leading-none">{label}</span>
                    </div>
                </div>

                <div className={isSm ? "mt-0" : "mt-auto"}>
                    <div className={cn("font-black text-slate-900 tracking-tighter italic leading-none", isSm ? "text-[18px]" : "text-[22px]")}>{value}</div>
                    {sub && <div className="text-[10px] font-bold text-slate-600 tracking-tight mt-0">{sub}</div>}
                </div>

                {status && (
                    <div className="absolute top-0 right-0">
                        {status === 'CRITICAL' && <div className="w-1 h-1 bg-rose-500 rounded-full animate-pulse shadow-[0_0_4px_rgba(244,63,94,0.6)]" />}
                        {status === 'WARNING' && <div className="w-1 h-1 bg-amber-500 rounded-full" />}
                        {status === 'OK' && <div className="w-1 h-1 bg-emerald-500 rounded-full" />}
                    </div>
                )}
            </div>
        </SectionCard>
    );
}
