"use client";

import React from "react";
import {
    Zap,
    Download,
    RefreshCw,
    Activity,
    ShieldCheck,
    Cpu,
    Sparkles,
    MoreVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import { t } from "@/lib/constants/translations";

interface ResearchHeaderProps {
    status: string;
    isSystemHealthOk: boolean;
    onStartResearch: () => void;
    onExportMasterDoc: () => void;
    onClearHistory: () => void;
    isResearching: boolean;
    activeVersionId?: string | null;
}

export function ResearchHeader({
    status,
    isSystemHealthOk,
    onStartResearch,
    onExportMasterDoc,
    onClearHistory,
    isResearching,
    activeVersionId
}: ResearchHeaderProps) {
    return (
        <div className="flex items-center justify-between gap-4 px-4 py-2.5 bg-white/70 rounded-xl border border-slate-200/60 shadow-sm relative overflow-hidden glass-header">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center shadow-sm shrink-0">
                        <Cpu className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-[11px] font-black text-slate-900 uppercase tracking-widest leading-none">{t('research_lab')}</h1>
                        <div className="flex items-center gap-1.5 mt-1">
                            <div className={cn("w-1 h-1 rounded-full", isSystemHealthOk ? "bg-emerald-500" : "bg-rose-500 animate-pulse")} />
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.15em] leading-none">
                                {isSystemHealthOk ? t('live') : t('offline')} • v4.0
                            </span>
                        </div>
                    </div>
                </div>

                <div className="h-6 w-px bg-slate-200/50 hidden md:block" />

                <div className="hidden lg:flex items-center gap-2">
                    <Badge variant="outline" className="h-5 text-[8px] font-black uppercase tracking-tighter bg-slate-50 border-slate-200 text-slate-500 rounded-md">
                        {status}
                    </Badge>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <Button
                    variant="ghost"
                    className="h-8 px-3 gap-2 text-[9px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all rounded-lg border border-transparent hover:border-slate-200"
                    onClick={onExportMasterDoc}
                >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{t('export_master')}</span>
                </Button>

                <Button
                    className="h-8 px-4 gap-2 bg-rose-600 hover:bg-rose-700 text-white border-0 shadow-sm transition-all duration-300 rounded-lg"
                    onClick={onStartResearch}
                    disabled={isResearching}
                >
                    {isResearching ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                        <Zap className="w-3.5 h-3.5 fill-white/20" />
                    )}
                    <span className="text-[10px] font-black uppercase tracking-widest">
                        {isResearching ? t('processing') : t('init_pulse')}
                    </span>
                </Button>

                <div className="h-6 w-px bg-slate-200/50 mx-1" />

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-900">
                            <MoreVertical className="w-4 h-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44 bg-white/95 border-slate-200 rounded-xl shadow-sm p-1">
                        <DropdownMenuItem className="gap-2 focus:bg-rose-50 focus:text-rose-600 cursor-pointer rounded-lg py-2 text-[9px] font-black uppercase tracking-widest">
                            <Activity className="w-3.5 h-3.5" />
                            <span>{t('history_logs')}</span>
                        </DropdownMenuItem>
                        <div className="h-px bg-slate-100 my-1" />
                        <DropdownMenuItem
                            className="gap-2 focus:bg-rose-50 focus:text-rose-600 text-slate-400 cursor-pointer rounded-lg py-2 text-[9px] font-black uppercase tracking-widest"
                            onClick={onClearHistory}
                        >
                            <RefreshCw className="w-3.5 h-3.5 opacity-50" />
                            <span>{t('flush_brain')}</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}
