"use client";

import React from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

import { t, ES } from "@/lib/constants/translations";

interface ModuleCardProps {
    icon: React.ReactNode;
    title: string;
    status: string;
    content?: string;
    evidenceCount?: number;
    badges?: string[];
    onClick?: () => void;
}

export function ModuleCard({
    icon,
    title,
    status,
    content,
    evidenceCount = 0,
    badges,
    onClick
}: ModuleCardProps) {
    const isReady = status === 'CONFIRMADO';

    return (
        <div
            className="group relative bg-white/60 rounded-xl border border-slate-200/50 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 hover:border-indigo-400/30 hover:bg-white hover:-translate-y-0.5 transition-transform transition-shadow transition-colors duration-300 cursor-pointer p-2.5 flex flex-col justify-between min-h-[105px] overflow-hidden"
        >
            {/* Ambient Background Detail */}
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-indigo-500/5 to-transparent rounded-full -mr-8 -mt-8 pointer-events-none group-hover:bg-indigo-500/10 transition-colors duration-700" />

            <div className="space-y-2 relative z-10">
                <div className="flex justify-between items-center">
                    <div className={cn(
                        "w-6 h-6 rounded-lg flex items-center justify-center transition-transform transition-shadow transition-colors duration-300 shadow-sm shrink-0",
                        isReady ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white"
                    )}>
                        <div className="[&>svg]:w-3 [&>svg]:h-3">{icon}</div>
                    </div>

                    <div className={cn(
                        "px-1.5 py-0.5 rounded-md text-[6px] font-black uppercase tracking-[0.1em] border flex items-center gap-1 shrink-0 transition-transform transition-shadow transition-colors duration-300",
                        isReady
                            ? "bg-emerald-50/50 text-emerald-600 border-emerald-100/30"
                            : "bg-slate-50/50 text-slate-400 border-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-100/30"
                    )}>
                        <div className={cn("w-1 h-1 rounded-full", isReady ? "bg-emerald-500 animate-pulse" : "bg-slate-300 group-hover:bg-indigo-500")} />
                        {isReady ? 'READY' : (ES[status as keyof typeof ES] || status)}
                    </div>
                </div>

                <div className="space-y-0.5">
                    <h3 className="text-[9px] font-black text-slate-800 leading-[1.3] line-clamp-2 uppercase tracking-wide group-hover:text-indigo-950 transition-colors">
                        {title}
                    </h3>
                    <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        <span className="text-[6px] font-black text-slate-400 uppercase tracking-tighter">System Phase:</span>
                        <span className="text-[6px] font-black text-indigo-500 uppercase tracking-tighter">0{Math.floor(Math.random() * 5) + 1}</span>
                    </div>
                </div>
            </div>

            <div className="mt-2 pt-2 border-t border-slate-100/80 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-1">
                    {evidenceCount > 0 ? (
                        <div className="flex items-center gap-1 bg-indigo-50/50 text-indigo-500 px-1 py-0.5 rounded-md border border-indigo-100/20">
                            <span className="text-[6px] font-black uppercase tracking-tighter">{evidenceCount} DATA POINTS</span>
                        </div>
                    ) : (
                        <span className="text-[6px] font-black text-slate-300 uppercase tracking-tighter italic">No artifacts yet</span>
                    )}
                </div>
                <div className="w-4 h-4 rounded-md bg-slate-50/50 flex items-center justify-center group-hover:bg-indigo-600 transition-transform transition-colors duration-300 transform group-hover:translate-x-0.5 group-hover:rotate-[-5deg] border border-transparent group-hover:border-indigo-400/50">
                    <ArrowRight className="w-2.5 h-2.5 text-slate-300 group-hover:text-white transition-colors" />
                </div>
            </div>
        </div>
    );
}
