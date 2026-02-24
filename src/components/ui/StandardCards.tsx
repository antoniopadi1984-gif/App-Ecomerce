import React from "react";
import { cn } from "@/lib/utils";

export function SectionCard({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                "bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}

export function SectionCardHeader({ className, title, icon: Icon, actions }: { className?: string; title: string; icon?: any; actions?: React.ReactNode }) {
    return (
        <div className={cn("p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50", className)}>
            <div className="flex items-center gap-2">
                {Icon && <Icon className="w-4 h-4 text-slate-400" />}
                <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-700">{title}</h3>
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
    );
}

export function SectionCardContent({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn("p-4", className)}>
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
}

export function KpiCard({ label, value, sub, status, icon: Icon, className }: KpiCardProps) {
    return (
        <SectionCard className={cn("flex flex-col justify-between hover:border-slate-300 transition-all p-4", className)}>
            <div className="flex flex-col gap-2 relative h-full">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                        {Icon && <Icon className="w-4 h-4 text-slate-400" />}
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</span>
                    </div>
                </div>

                <div className="mt-auto">
                    <div className="text-2xl font-black text-slate-900 tracking-tighter italic leading-none">{value}</div>
                    {sub && <div className="text-[10px] font-bold text-slate-400 tracking-tight mt-1">{sub}</div>}
                </div>

                {status && (
                    <div className="absolute top-0 right-0">
                        {status === 'CRITICAL' && <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]" />}
                        {status === 'WARNING' && <div className="w-2 h-2 bg-amber-500 rounded-full" />}
                        {status === 'OK' && <div className="w-2 h-2 bg-emerald-500 rounded-full" />}
                    </div>
                )}
            </div>
        </SectionCard>
    );
}
