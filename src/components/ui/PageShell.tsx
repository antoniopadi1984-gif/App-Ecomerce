import React from "react";
import { cn } from "@/lib/utils";

interface PageShellProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    loading?: boolean;
    loadingMessage?: string;
}

export function PageShell({ children, className, loading, loadingMessage = "CARGANDO DATOS...", ...props }: PageShellProps) {
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 w-full h-full bg-slate-50/30">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{loadingMessage}</p>
            </div>
        );
    }

    return (
        <div
            className={cn(
                "flex flex-col min-h-[calc(100vh-80px)] bg-slate-50/30 overflow-hidden w-full",
                className
            )}
            {...props}
        >
            {/* The outer shell standardizes scrolling and maximum width constraints if needed */}
            <main className="flex-1 overflow-auto w-full pb-20">
                <div className="max-w-[1600px] mx-auto w-full">
                    {children}
                </div>
            </main>
        </div>
    );
}
