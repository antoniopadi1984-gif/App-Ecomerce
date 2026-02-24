import React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface ModuleHeaderProps {
    title: string;
    subtitle?: string;
    icon?: LucideIcon;
    actions?: React.ReactNode;
    badges?: React.ReactNode;
    className?: string;
}

export function ModuleHeader({ title, subtitle, icon: Icon, actions, badges, className }: ModuleHeaderProps) {
    return (
        <div className={cn("flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 px-6 bg-white border-b border-slate-100 shadow-sm relative z-20", className)}>
            <div className="flex items-center gap-4">
                {Icon && (
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100/50">
                        <Icon className="w-5 h-5" />
                    </div>
                )}
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase italic">{title}</h1>
                        {badges && <div className="flex items-center gap-2">{badges}</div>}
                    </div>
                    {subtitle && (
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                            {subtitle}
                        </p>
                    )}
                </div>
            </div>

            {actions && (
                <div className="flex items-center gap-2">
                    {actions}
                </div>
            )}
        </div>
    );
}
