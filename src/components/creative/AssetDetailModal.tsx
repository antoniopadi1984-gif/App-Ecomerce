"use client";

import React, { useState } from "react";
import {
    XCircle,
    BarChart3,
    Zap,
    Clapperboard,
    Play,
    ExternalLink,
    Info,
    ShieldCheck,
    AlertCircle,
    TrendingUp,
    Scissors,
    Download,
    Eye
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface AssetDetailModalProps {
    asset: any;
    onClose: () => void;
    onAudit: (id: string) => void;
    onClip: (id: string) => void;
    isLoading: boolean;
}

export function AssetDetailModal({ asset, onClose, onAudit, onClip, isLoading }: AssetDetailModalProps) {
    const [activeTab, setActiveTab] = useState<'audit' | 'stats' | 'clips'>('audit');

    if (!asset) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden border border-white shadow-indigo-900/10">
                {/* Modal Header */}
                <div className="px-10 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-100">
                            <Clapperboard className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">{asset.name}</h3>
                                <Badge className="bg-indigo-50 text-indigo-700 border-indigo-100 text-[9px] font-black uppercase tracking-widest">{asset.nomenclatura}</Badge>
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 flex items-center gap-2">
                                <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                                Vista Forense • Creative DNA Analysis
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-12 h-12 flex items-center justify-center rounded-2xl hover:bg-white hover:shadow-lg transition-all text-slate-400 hover:text-slate-900 active:scale-95"
                    >
                        <XCircle className="w-7 h-7" />
                    </button>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Left Side: Video Preview */}
                    <div className="w-[45%] bg-slate-900 flex flex-col p-6">
                        <div className="relative flex-1 rounded-[2rem] overflow-hidden shadow-2xl shadow-black/50 bg-black group">
                            {asset.driveUrl ? (
                                <video
                                    src={asset.driveUrl}
                                    controls
                                    className="w-full h-full object-contain"
                                />
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-slate-700">
                                    <Clapperboard className="w-16 h-16" />
                                    <span className="text-xs font-black uppercase tracking-widest">No preview available</span>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-6">
                            <button className="h-12 flex items-center justify-center gap-2 rounded-2xl bg-white/10 text-white font-bold text-xs hover:bg-white/20 transition-all active:scale-95">
                                <Download className="w-4 h-4 text-indigo-400" />
                                Descargar
                            </button>
                            <button className="h-12 flex items-center justify-center gap-2 rounded-2xl bg-white/10 text-white font-bold text-xs hover:bg-white/20 transition-all active:scale-95">
                                <ExternalLink className="w-4 h-4 text-indigo-400" />
                                Abrir Drive
                            </button>
                        </div>
                    </div>

                    {/* Right Side: Data & Actions */}
                    <div className="flex-1 flex flex-col pb-8">
                        {/* Tabs */}
                        <div className="px-10 py-6 flex items-center gap-6">
                            <TabButton active={activeTab === 'audit'} onClick={() => setActiveTab('audit')} icon={ShieldCheck} label="Auditoría AI" />
                            <TabButton active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} icon={BarChart3} label="Métricas" />
                            <TabButton active={activeTab === 'clips'} onClick={() => setActiveTab('clips')} icon={Scissors} label="Auto-Clips" />
                        </div>

                        <ScrollArea className="flex-1 px-10">
                            {activeTab === 'audit' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                    {!asset.auditResults ? (
                                        <div className="py-12 flex flex-col items-center justify-center text-center">
                                            <div className="w-16 h-16 bg-slate-50 rounded-[1.5rem] flex items-center justify-center mb-6">
                                                <Zap className="w-8 h-8 text-slate-300" />
                                            </div>
                                            <h4 className="text-slate-900 font-bold mb-2">Sin auditoría forense</h4>
                                            <p className="text-slate-500 text-sm max-w-sm mb-6">Analiza el ADN de este creativo para extraer ángulos, hooks y nivel de consciencia detectado por Gemini 2.0.</p>
                                            <button
                                                onClick={() => onAudit(asset.id)}
                                                disabled={isLoading}
                                                className="h-12 px-8 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.15em] shadow-lg shadow-slate-200 transition-all active:scale-95 flex items-center gap-3"
                                            >
                                                <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                                                Correr Auditoria AI
                                            </button>
                                        </div>
                                    ) : (
                                        <AuditResults data={asset.auditResults} />
                                    )}
                                </div>
                            )}

                            {activeTab === 'stats' && (
                                <div className="grid grid-cols-2 gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <MetricBox label="CTR" value={`${(asset.ctr || 0).toFixed(2)}%`} trend="+12%" icon={TrendingUp} />
                                    <MetricBox label="Hook Rate" value={`${(asset.hookRate || 0).toFixed(1)}%`} trend="+5%" icon={Eye} />
                                    <MetricBox label="Inversión" value={`$${(asset.spend || 0).toLocaleString()}`} icon={DollarSign} />
                                    <MetricBox label="Revenue" value={`$${(asset.revenue || 0).toLocaleString()}`} icon={Zap} />
                                </div>
                            )}

                            {activeTab === 'clips' && (
                                <div className="py-12 flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="w-16 h-16 bg-slate-50 rounded-[1.5rem] flex items-center justify-center mb-6">
                                        <Scissors className="w-8 h-8 text-slate-300" />
                                    </div>
                                    <h4 className="text-slate-900 font-bold mb-2">Magic Clipper Agent</h4>
                                    <p className="text-slate-500 text-sm max-w-sm mb-6">Extrae automáticamente hooks alternativos y variaciones de cierre (CTA) usando AI video detection.</p>
                                    <button
                                        onClick={() => onClip(asset.id)}
                                        disabled={isLoading}
                                        className="h-12 px-8 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.15em] shadow-lg shadow-slate-200 transition-all active:scale-95 flex items-center gap-3"
                                    >
                                        <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                                        Split AI Clips
                                    </button>
                                </div>
                            )}
                        </ScrollArea>
                    </div>
                </div>
            </div>
        </div>
    );
}

function TabButton({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex items-center gap-2.5 pb-2 transition-all relative",
                active ? "text-slate-900" : "text-slate-400 hover:text-slate-600"
            )}
        >
            <Icon className={cn("w-4 h-4 transition-colors", active ? "text-indigo-600" : "text-slate-300")} />
            <span className="text-xs font-black uppercase tracking-widest">{label}</span>
            {active && (
                <div className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-indigo-600 rounded-full animate-in zoom-in" />
            )}
        </button>
    );
}

function MetricBox({ label, value, trend, icon: Icon }: { label: string, value: string, trend?: string, icon: any }) {
    return (
        <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100/80">
            <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4 text-slate-400" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
            </div>
            <div className="flex items-end gap-3">
                <span className="text-2xl font-black text-slate-900 tracking-tight">{value}</span>
                {trend && <span className="text-[10px] font-black text-emerald-500 mb-1">{trend}</span>}
            </div>
        </div>
    );
}

function AuditResults({ data }: { data: any }) {
    return (
        <div className="space-y-6">
            <div className="bg-indigo-50/50 p-6 rounded-[2rem] border border-indigo-100">
                <h5 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Marketing Alignment
                </h5>
                <p className="text-sm font-bold text-slate-900 leading-relaxed">{data.alignmentReasoning || "El mensaje es coherente con un avatar de nivel O3 (Problem Aware), enfocándose en el beneficio inmediato..."}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Hook Type</span>
                    <p className="text-xs font-bold text-slate-900 mt-1">{data.hookType || "Pattern Interrupt / Curiosity"}</p>
                </div>
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sophistication</span>
                    <p className="text-xs font-bold text-slate-900 mt-1">{data.marketSophistication || "Nivel 3 - Mecanismo Único"}</p>
                </div>
            </div>

            <div className="space-y-3">
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Mejoras Sugeridas</h5>
                {data.suggestions?.map((s: string, i: number) => (
                    <div key={i} className="flex gap-3 items-start p-4 rounded-2xl border border-dashed border-slate-200">
                        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <span className="text-xs font-medium text-slate-600 leading-relaxed">{s}</span>
                    </div>
                )) || (
                        <p className="text-xs text-slate-400 italic px-1 text-center py-4">Procesa la auditoría para ver sugerencias optimizadas por Gemini 2.0</p>
                    )}
            </div>
        </div>
    );
}

import { DollarSign } from "lucide-react";
