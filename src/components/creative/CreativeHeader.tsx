"use client";

import React from "react";
import {
    Sparkles,
    Upload,
    Video,
    Clapperboard,
    TrendingUp,
    DollarSign,
    Zap,
    Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CreativeHeaderProps {
    stats: {
        totalSpend: number;
        totalRevenue: number;
        avgCtr: number;
        count: number;
    };
    onGenerate: () => void;
    onUpload: () => void;
    isGenerating: boolean;
}

export function CreativeHeader({ stats, onGenerate, onUpload, isGenerating }: CreativeHeaderProps) {
    return (
        <div className="flex flex-col gap-6">
            {/* Main Header Action Area - GLASS PRO */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/60 backdrop-blur-xl px-6 py-5 rounded-2xl border border-white/60 shadow-xl shadow-indigo-500/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -z-10 animate-pulse" />
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200 animate-in zoom-in duration-500">
                        <Clapperboard className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Creative Factory</h1>
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase tracking-widest rounded-full border border-indigo-100">V4 Pro</span>
                        </div>
                        <p className="text-slate-500 text-xs font-medium flex items-center gap-2 mt-0.5">
                            <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                            Generación batch & Auditoría forense de anuncios
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        onClick={onUpload}
                        variant="outline"
                        className="h-10 px-4 rounded-xl border-slate-200 hover:bg-slate-50 font-bold text-slate-600 transition-all active:scale-95 text-xs"
                    >
                        <Upload className="w-3.5 h-3.5 mr-2" />
                        Subir Asset
                    </Button>
                    <Button
                        onClick={onGenerate}
                        disabled={isGenerating}
                        className="h-10 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black shadow-lg shadow-slate-200 transition-all active:scale-95 disabled:opacity-70 group text-xs"
                    >
                        {isGenerating ? (
                            <Zap className="w-3.5 h-3.5 mr-2 animate-pulse text-amber-400" />
                        ) : (
                            <Sparkles className="w-3.5 h-3.5 mr-2 group-hover:rotate-12 transition-transform" />
                        )}
                        {isGenerating ? "Generando..." : "Generar Videos"}
                    </Button>
                </div>
            </div>

            {/* Micro Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="ACTIVOS"
                    value={stats.count.toString()}
                    sub="Archivos en Lab"
                    icon={Video}
                    color="indigo"
                />
                <StatCard
                    label="CTR MEDIO"
                    value={`${stats.avgCtr.toFixed(2)}%`}
                    sub="Global Av."
                    icon={TrendingUp}
                    color="emerald"
                />
                <StatCard
                    label="SPEND"
                    value={`$${stats.totalSpend.toLocaleString()}`}
                    sub="Invertido"
                    icon={DollarSign}
                    color="blue"
                />
                <StatCard
                    label="REVENUE"
                    value={`$${stats.totalRevenue.toLocaleString()}`}
                    sub="Generado"
                    icon={Zap}
                    color="amber"
                />
            </div>
        </div>
    );
}

function StatCard({ label, value, sub, icon: Icon, color }: { label: string, value: string, sub: string, icon: any, color: string }) {
    const colors: Record<string, string> = {
        indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
        emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
        blue: "bg-blue-50 text-blue-600 border-blue-100",
        amber: "bg-amber-50 text-amber-600 border-amber-100"
    };

    return (
        <div className="bg-white/60 backdrop-blur-md p-4 rounded-xl border border-white/60 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 group overflow-hidden relative hover:-translate-y-1">
            <div className="absolute -right-1 -top-1 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
                <Icon className="w-16 h-16 rotate-12" />
            </div>

            <div className="flex items-center gap-2.5 mb-2">
                <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center border", colors[color])}>
                    <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
            </div>

            <div className="flex flex-col">
                <span className="text-xl font-black text-slate-900 tracking-tight">{value}</span>
                <span className="text-[10px] text-slate-400 font-medium">{sub}</span>
            </div>
        </div>
    );
}
