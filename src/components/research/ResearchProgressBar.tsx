"use client";

import React from 'react';
import { CheckCircle2, Circle, PlayCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Phase {
    id: number;
    title: string;
    description: string;
    status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
}

interface ResearchProgressBarProps {
    phases: Phase[];
    currentPhase: number;
    totalProgress: number;
}

export function ResearchProgressBar({ phases, currentPhase, totalProgress }: ResearchProgressBarProps) {
    return (
        <div className="w-full bg-white/40 px-4 py-3 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-rose-400/5 rounded-full blur-3xl -mr-32 -mt-32" />

            <div className="relative z-10">
                <div className="flex justify-between items-end mb-3">
                    <div>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-tighter italic leading-none">
                            Pipeline <span className="text-[var(--primary)] not-italic">God-Tier</span>
                        </h3>
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.1em] mt-0.5">6 Fases Forenses de Alta Precisión</p>
                    </div>
                    <div className="text-right flex items-baseline gap-2">
                        <span className="text-xl font-black text-slate-900 italic leading-none">{totalProgress}%</span>
                        <p className="text-[8px] text-[var(--primary)] font-black uppercase tracking-widest leading-none">Sincronización Neural</p>
                    </div>
                </div>

                {/* Progress Bar Container */}
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mb-4 border border-slate-200/50 relative">
                    <div
                        className="h-full bg-gradient-to-r from-rose-400 to-[var(--primary)] rounded-full transition-all duration-1000 ease-out relative shadow-[0_0_10px_rgba(251,113,133,0.3)]"
                        style={{ width: `${totalProgress}%` }}
                    >
                        <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[progress-stripe_1s_linear_infinite]" />
                    </div>
                </div>

                {/* Phases Grid */}
                <div className="grid grid-cols-6 gap-2">
                    {phases.map((phase) => (
                        <div
                            key={phase.id}
                            className={cn(
                                "flex flex-col gap-1.5 p-2 rounded-lg transition-all duration-500 border",
                                currentPhase === phase.id
                                    ? "bg-rose-50/50 border-rose-200 shadow-sm scale-102"
                                    : phase.status === 'COMPLETED'
                                        ? "bg-slate-50/50 border-slate-100"
                                        : "bg-transparent border-transparent opacity-50"
                            )}
                        >
                            <div className="flex items-center justify-between">
                                <span className={cn(
                                    "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border",
                                    currentPhase === phase.id
                                        ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                                        : "bg-slate-200 text-slate-500 border-slate-300"
                                )}>
                                    Fase {phase.id}
                                </span>
                                {phase.status === 'COMPLETED' ? (
                                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                ) : phase.status === 'RUNNING' ? (
                                    <Loader2 className="w-3 h-3 text-[var(--primary)] animate-spin" />
                                ) : (
                                    <Circle className="w-3 h-3 text-slate-300" />
                                )}
                            </div>
                            <h4 className="text-[9px] font-black text-slate-900 uppercase tracking-tight leading-none mt-0.5">
                                {phase.title}
                            </h4>
                            <div className="w-full bg-slate-200 h-0.5 rounded-full overflow-hidden mt-1 mt-auto">
                                <div
                                    className={cn(
                                        "h-full transition-all duration-1000",
                                        phase.status === 'COMPLETED' ? "bg-emerald-500 w-full" :
                                            phase.status === 'RUNNING' ? "bg-[var(--primary)] w-1/2" : "w-0"
                                    )}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <style jsx global>{`
                @keyframes progress-stripe {
                    0% { background-position: 0 0; }
                    100% { background-position: 20px 0; }
                }
            `}</style>
        </div>
    );
}
