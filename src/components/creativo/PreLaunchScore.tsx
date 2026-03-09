'use client';

import React, { useState, useEffect } from 'react';
import {
    AlertCircle, CheckCircle2,
    ArrowRight, Loader2, Sparkles,
    TrendingUp, ShieldCheck,
    Zap, AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PreLaunchScoreProps {
    score: number;
    improvements: string[];
    analysis?: {
        similarity_risk: number;
        historical_match: number;
        retention_prediction: string;
        technical_check: string;
    };
    onImprove?: () => void;
    isLoading?: boolean;
}

export function PreLaunchScore({ score, improvements, analysis, onImprove, isLoading }: PreLaunchScoreProps) {
    const size = 100;
    const strokeWidth = 8;
    const center = size / 2;
    const radius = center - strokeWidth;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    const getScoreColor = () => {
        if (score >= 80) return 'text-emerald-500';
        if (score >= 50) return 'text-[var(--cre)]';
        return 'text-rose-500';
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-8 space-y-3 animate-pulse">
                <Loader2 className="animate-spin text-[var(--cre)]" size={32} />
                <p className="text-[10px] font-bold uppercase text-[var(--text-tertiary)] tracking-widest">Calculando...</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-5 rounded-xl border border-[var(--border)] shadow-sm space-y-6 animate-in zoom-in-95">
            <div className="flex items-center gap-6">
                <div className="relative flex items-center justify-center shrink-0">
                    <svg width={size} height={size} className="transform -rotate-90">
                        <circle cx={center} cy={center} r={radius} stroke="var(--border)" strokeWidth={strokeWidth} fill="transparent" />
                        <circle
                            cx={center} cy={center} r={radius}
                            stroke="currentColor" strokeWidth={strokeWidth}
                            strokeDasharray={circumference} strokeDashoffset={offset}
                            strokeLinecap="round" fill="transparent"
                            className={cn("transition-all duration-1000 ease-out", getScoreColor())}
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-xl font-bold tracking-tighter text-[var(--text-primary)]">{score}</span>
                        <span className="text-[8px] font-bold uppercase text-[var(--text-tertiary)] -mt-1">Puntos</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between gap-4">
                        <h4 className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-primary)]">Pre-Launch IA</h4>
                        {score >= 80 && (
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[8px] font-bold rounded uppercase flex items-center gap-1 border border-emerald-100 animate-bounce">
                                <ShieldCheck size={10} /> LISTO
                            </span>
                        )}
                    </div>
                    <p className="text-[10px] text-[var(--text-secondary)] font-medium leading-relaxed italic">
                        Potencial de escalabilidad del {score}% basado en datos históricos de Meta.
                    </p>
                </div>
            </div>

            {score < 100 && (
                <div className="space-y-3 pt-3 border-t border-[var(--border)]">
                    <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-[var(--text-tertiary)]">
                        <Zap size={12} className="text-[var(--cre)]" /> MEJORAS SUGERIDAS
                    </div>
                    <div className="space-y-1.5">
                        {improvements.slice(0, 3).map((imp, i) => (
                            <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[var(--bg)] border border-[var(--border)]">
                                <div className="w-4 h-4 rounded bg-white text-[var(--cre)] flex items-center justify-center shrink-0 border border-[var(--border)]"><AlertTriangle size={10} /></div>
                                <span className="text-[10px] font-medium text-[var(--text-secondary)] leading-tight">{imp}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {score < 50 && onImprove && (
                <button
                    onClick={onImprove}
                    className="w-full h-9 bg-white border border-[var(--cre)] text-[var(--cre)] text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-[var(--cre-bg)] transition-all flex items-center justify-center gap-2"
                >
                    <Sparkles size={14} /> Optimizar Creativo
                </button>
            )}
        </div>
    );
}
