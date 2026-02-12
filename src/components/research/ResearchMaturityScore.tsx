"use client";

import React from "react";
import { BrainCircuit, RefreshCw, BarChart3, Database, Workflow, Layers, Zap, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PremiumCard } from "@/components/ui/premium-card";
import { t } from "@/lib/constants/translations";
import { cn } from "@/lib/utils";
import { ds } from "@/lib/styles/design-system";

interface MaturityScoreData {
    overall: number;
    research: number;
    avatar: number;
    landing: number;
    creatives: number;
    postVenta: number;
}

interface ResearchMaturityScoreProps {
    maturity: MaturityScoreData | null;
    loading: boolean;
    onSync: () => void;
    nodesCount: number;
}

export function ResearchMaturityScore({ maturity, loading, onSync, nodesCount }: ResearchMaturityScoreProps) {
    if (!maturity) return null;

    const maturityItems = [
        { label: t('score_research'), val: maturity.research, icon: Database },
        { label: t('score_avatar'), val: maturity.avatar, icon: Workflow },
        { label: t('score_landing'), val: maturity.landing, icon: Layers },
        { label: t('score_creatives'), val: maturity.creatives, icon: Zap },
        { label: t('score_postventa'), val: maturity.postVenta, icon: ShieldCheck }
    ];

    const getStatusColor = (val: number) => {
        if (val >= 0.8) return "bg-emerald-500 shadow-emerald-500/50";
        if (val >= 0.4) return "bg-amber-500 shadow-amber-500/50";
        return "bg-rose-500 shadow-rose-500/50";
    };

    return (
        <section className="space-y-3">
            {/* Main Header Card */}
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-xl flex flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                        <BrainCircuit className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-sm font-black text-white uppercase tracking-tighter italic flex items-center gap-2">
                            {t('memory_graph')} <span className="text-[7px] bg-blue-600 px-1 py-0 rounded text-white tracking-[0.2em]">{t('beta_engine')}</span>
                        </h2>
                        <p className="text-slate-500 font-bold text-[9px] uppercase tracking-wider">Project Knowledge Core</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                    <div className="flex flex-col items-center">
                        <div className={cn("w-2 h-2 rounded-full shadow-lg animate-pulse", getStatusColor(maturity.overall))}></div>
                        <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">{t('signal')}</span>
                    </div>
                    <div className="h-6 w-px bg-white/10"></div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-lg font-black text-white">{(maturity.overall * 100).toFixed(0)}%</span>
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{t('maturity_score')}</span>
                            <Button
                                onClick={onSync}
                                disabled={loading}
                                variant="ghost"
                                className="text-blue-400 hover:bg-white/5 h-6 w-6 p-0 rounded-lg transition-all"
                            >
                                <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
                {/* Radar Scores */}
                <PremiumCard className="lg:col-span-2">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <BarChart3 className="w-3.5 h-3.5 text-indigo-500" />
                            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Atributos de Madurez</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                            {maturityItems.map((item, i) => (
                                <div key={i} className="space-y-1">
                                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-tight">
                                        <div className="flex items-center gap-1.5 text-slate-500">
                                            <item.icon className="w-3 h-3" /> {item.label}
                                        </div>
                                        <span className={cn(item.val >= 0.8 ? 'text-emerald-500' : 'text-slate-400')}>
                                            {(item.val * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                    <Progress value={item.val * 100} className="h-1 rounded-full bg-slate-100" />
                                </div>
                            ))}
                        </div>
                    </div>
                </PremiumCard>

                {/* Learning Loop Info */}
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-4 bg-indigo-50/30 rounded-xl border border-indigo-100/50 flex flex-col justify-center">
                        <h4 className="text-[9px] font-black text-indigo-700 uppercase mb-2 flex items-center gap-1.5 tracking-widest">
                            <RefreshCw className="w-3.5 h-3.5" /> {t('learning_loop')}
                        </h4>
                        <p className="text-xl font-black text-slate-900 tracking-tighter leading-none mb-1">
                            {nodesCount} <span className="text-[10px] text-slate-400 uppercase tracking-widest">{t('nodes_captured')}</span>
                        </p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase leading-tight tracking-tight">Análisis predictivo basado en datos</p>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-2">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Sync Ready</span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 leading-snug">Cada relación fortalece la predicción de conversiones en el mercado real.</p>
                    </div>
                </div>
            </div>
        </section>
    );
}
