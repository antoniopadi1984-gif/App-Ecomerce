import React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from "@/lib/styles/tokens";

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
        <div className={cn(
            "bg-transparent border-b border-border sticky top-0 z-20 min-h-[48px] flex items-center justify-center",
            SHADOWS.sm,
            className
        )}>
            <div className="flex items-center justify-between w-full max-w-[1700px] mx-auto px-4 py-2 gap-2">
                <div className="flex items-center gap-3">
                    {Icon && (
                        <div className={cn(
                            "p-1.5 bg-primary text-white shadow-sm",
                            RADIUS.sm
                        )}>
                            <Icon className="w-4 h-4" />
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <h1 className={cn("text-[22px]", TYPOGRAPHY.weights.black, TYPOGRAPHY.tracking.tight, "uppercase italic text-foreground leading-none")}>
                            {title}
                        </h1>
                        {badges && <div className="flex items-center gap-1">{badges}</div>}
                        {subtitle && (
                            <div className="flex items-center gap-2 border-l border-slate-200 pl-2">
                                <p className={cn("text-[10px]", "text-muted-foreground font-bold uppercase tracking-widest leading-none")}>
                                    {subtitle}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {actions && (
                    <div className="flex items-center gap-1.5">
                        {actions}
                    </div>
                )}
            </div>
        </div>
    );
}
