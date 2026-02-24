import React from "react";
import { cn } from "@/lib/utils";
import { COLORS, SPACING, TYPOGRAPHY } from "@/lib/styles/tokens";

interface PageShellProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    loading?: boolean;
    loadingMessage?: string;
}

export function PageShell({ children, className, loading, loadingMessage = "CARGANDO DATOS...", ...props }: PageShellProps) {
    if (loading) {
        return (
            <div className={cn("flex flex-col items-center justify-center min-h-[60vh] gap-3 w-full h-full bg-slate-50/30")}>
                <div className="w-8 h-8 border-3 border-slate-200 border-t-rose-500 rounded-full animate-spin" />
                <p className={cn(TYPOGRAPHY.sizes.compact, TYPOGRAPHY.weights.black, TYPOGRAPHY.tracking.widest, "text-slate-400 uppercase")}>
                    {loadingMessage}
                </p>
            </div>
        );
    }

    return (
        <div
            className={cn(
                "flex flex-col min-h-[calc(100vh-var(--header-height))] bg-slate-50/30 w-full",
                className
            )}
            {...props}
        >
            <main className="flex-1 w-full">
                <div className="mx-auto w-full max-w-[1900px] px-3 md:px-6 2xl:px-8 py-[var(--page-py)]">
                    {children}
                </div>
            </main>
        </div>
    );
}
