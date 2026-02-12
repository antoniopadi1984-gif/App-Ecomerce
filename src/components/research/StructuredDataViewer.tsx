"use client";

import React from "react";
import {
    CheckCircle2,
    ShieldCheck,
    AlertCircle,
    UserSquare,
    Zap,
    Sparkles,
    Cpu,
    TrendingDown,
    Megaphone,
    Search,
    BrainCircuit,
    DollarSign,
    Database,
    Target,
    ScanFace
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StructuredDataViewerProps {
    data: any;
    handleGenerateAngles: (avatarId: string) => Promise<any>;
    handleGenerateV3Copy: (avatarId: string, type: any, angleId?: string, framework?: string) => Promise<any>;
    handleGenerateGodTierCopy: (avatarIdx: number, angleIdx: number) => Promise<any>;
    setSelectedResearch: any;
}

export function StructuredDataViewer({
    data,
    handleGenerateAngles,
    handleGenerateV3Copy,
    handleGenerateGodTierCopy,
    setSelectedResearch
}: StructuredDataViewerProps) {
    if (!data) return null;

    // specialized PRODUCT DNA viewer
    if (data.mecanismo_real || data.core_identity) {
        return (
            <div className="space-y-4 animate-in fade-in duration-500">
                <div className="bg-slate-900/95 backdrop-blur-xl p-5 rounded-xl border border-white/10 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
                    <h4 className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.3em] mb-4 flex items-center gap-2 relative z-10 italic">
                        <Database className="w-3.5 h-3.5" /> Core Product DNA <span className="text-white/20 ml-2">v4.2</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                        <div className="space-y-1.5 p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                            <span className="text-[8px] font-black text-indigo-300/60 uppercase tracking-widest">Mecanismo Único</span>
                            <p className="text-[13px] font-bold text-white leading-tight italic">{data.mecanismo_real || 'N/A'}</p>
                        </div>
                        <div className="space-y-1.5 p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                            <span className="text-[8px] font-black text-indigo-300/60 uppercase tracking-widest">Identidad de Marca</span>
                            <p className="text-[13px] font-bold text-white leading-tight italic">{data.core_identity || 'N/A'}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Card className="p-4 bg-white/60 backdrop-blur-md border-slate-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
                        <span className="text-[8px] font-black text-slate-400 uppercase block mb-2 tracking-widest">Problema Raíz</span>
                        <p className="text-[11px] font-bold text-slate-800 leading-snug">{data.root_problem || 'N/A'}</p>
                    </Card>
                    <Card className="p-4 bg-white/60 backdrop-blur-md border-slate-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
                        <span className="text-[8px] font-black text-slate-400 uppercase block mb-2 tracking-widest">Diferenciación</span>
                        <p className="text-[11px] font-bold text-slate-800 leading-snug">{data.diferenciacion || 'N/A'}</p>
                    </Card>
                    <Card className="p-4 bg-white/60 backdrop-blur-md border-slate-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
                        <span className="text-[8px] font-black text-slate-400 uppercase block mb-2 tracking-widest">Oportunidad</span>
                        <p className="text-[11px] font-bold text-slate-800 leading-snug">{data.opportunity || 'N/A'}</p>
                    </Card>
                </div>
            </div>
        );
    }

    // specialized MASS DESIRES viewer
    if (data.primary_emotional_hook || data.desires) {
        return (
            <div className="space-y-5 animate-in fade-in duration-500">
                <div className="bg-indigo-600 p-5 rounded-xl text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-24 -mt-24 group-hover:bg-white/20 transition-all duration-700" />
                    <h4 className="text-[9px] font-black uppercase text-indigo-100 tracking-[0.3em] mb-2 flex items-center gap-2 relative z-10 italic">
                        <Zap className="w-3.5 h-3.5 fill-current" /> Máximo Gancho Emocional
                    </h4>
                    <p className="text-base font-black italic relative z-10 leading-tight">"{data.primary_emotional_hook || 'N/A'}"</p>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                        <BrainCircuit className="w-3.5 h-3.5 text-slate-400" />
                        <h4 className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Anatomía del Deseo</h4>
                        <div className="h-px bg-slate-100 flex-1 ml-2" />
                    </div>
                    <div className="grid gap-2">
                        {(data.desires || []).map((d: any, idx: number) => (
                            <div key={idx} className="p-3.5 rounded-xl bg-white/80 backdrop-blur-sm border border-slate-100 shadow-xs hover:border-indigo-200 transition-all group/item">
                                <div className="flex items-start gap-4">
                                    <div className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center text-[10px] font-black shrink-0 shadow-lg group-hover/item:bg-indigo-600 transition-colors italic">
                                        {idx + 1}
                                    </div>
                                    <div className="flex-1 space-y-1.5">
                                        <div className="flex items-center gap-2">
                                            <Badge className="bg-indigo-50 text-indigo-600 border-indigo-100 text-[6px] font-black uppercase px-2">{d.stage || 'N/A'}</Badge>
                                            <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">Intensidad: {d.intensity || 'MÁXIMA'}</span>
                                        </div>
                                        <p className="text-[12px] font-black text-slate-800 leading-tight">
                                            {d.surface_desire} <span className="text-slate-300 mx-1">→</span> <span className="text-indigo-600 italic uppercase">{d.core_desire}</span>
                                        </p>
                                        <p className="text-[10px] font-medium text-slate-500 leading-relaxed italic border-l-2 border-indigo-100 pl-3 py-0.5">
                                            {d.pain_point}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // specialized MARKETING ANGLES viewer
    if (data.angle_tree) {
        return (
            <div className="space-y-5 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.angle_tree.map((angle: any, idx: number) => (
                        <Card key={idx} className="relative overflow-hidden p-5 bg-white border-slate-100 shadow-sm hover:border-indigo-400 group transition-all duration-500 hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 rounded-xl">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 rounded-full -mr-10 -mt-10 group-hover:bg-indigo-500/10 transition-colors" />
                            <div className="absolute top-4 right-4 opacity-5 group-hover:opacity-40 transition-opacity">
                                <Target className="w-8 h-8 text-indigo-600" />
                            </div>

                            <div className="space-y-3 relative z-10 mb-12">
                                <div>
                                    <Badge className="bg-slate-900/5 text-slate-500 border-none text-[6px] font-black uppercase tracking-widest mb-1.5 px-1.5 py-0.5 group-hover:bg-indigo-600 group-hover:text-white transition-colors">{angle.category || 'MARKETING ANGLE'}</Badge>
                                    <h4 className="text-[13px] font-black text-slate-900 leading-tight uppercase italic group-hover:text-indigo-950">{angle.concept}</h4>
                                </div>

                                <div className="space-y-2 bg-slate-50/50 p-2.5 rounded-lg border border-slate-100 group-hover:bg-white transition-colors">
                                    <div className="flex items-start gap-2">
                                        <div className="w-1 h-1 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                                        <span className="text-[9px] font-bold text-slate-600 leading-tight">Hook: <span className="text-indigo-600 italic">"{angle.hook_preview}"</span></span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <div className="w-1 h-1 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                                        <span className="text-[9px] font-bold text-slate-600 leading-tight">Mecanismo: <span className="text-emerald-600">{angle.mechanism_usage}</span></span>
                                    </div>
                                </div>
                                <p className="text-[10px] font-medium text-slate-400 leading-relaxed italic group-hover:text-slate-600 transition-colors">
                                    {angle.psychology_rationale}
                                </p>
                            </div>

                            <div className="absolute bottom-4 left-4 right-4">
                                <Button
                                    onClick={() => handleGenerateGodTierCopy(0, idx)}
                                    className="w-full h-8 bg-slate-900 hover:bg-indigo-600 text-white text-[8px] font-black uppercase tracking-widest rounded-lg transition-all shadow-md group-hover:shadow-indigo-500/10 italic"
                                >
                                    GOD-TIER COPY
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    // specialized VOC / LANGUAGE BANK viewer
    if (data.language_bank || data.vocabulary_clusters) {
        const clusters = data.vocabulary_clusters || data.language_bank?.[0]?.vocabulary_clusters || {};
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.entries(clusters).map(([key, phrases]: [string, any], idx: number) => (
                        <Card key={idx} className="p-5 border-slate-100 shadow-sm">
                            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 flex items-center gap-2">
                                <ScanFace className="w-3.5 h-3.5" /> {key.replace(/_/g, ' ')}
                            </h4>
                            <div className="space-y-2">
                                {Array.isArray(phrases) && phrases.map((phrase: string, pIdx: number) => (
                                    <div key={pIdx} className="bg-slate-50 p-3 rounded-lg border border-slate-100/50">
                                        <p className="text-xs font-medium text-slate-700 italic">"{phrase}"</p>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    // specialized truth layer viewer (V4 Enhanced)
    if (data.claims && data.evidence) {
        return (
            <div className="space-y-4">
                <div className="space-y-4">
                    <h4 className="text-[11px] font-black uppercase text-slate-900 tracking-widest border-b border-slate-100 pb-1 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                        CORE CLAIMS (TRUTH AUDIT)
                    </h4>
                    <div className="grid gap-3">
                        {data.claims.map((claim: any, idx: number) => (
                            <div key={idx} className={`p-4 rounded-xl border ${claim.status === 'CONFIRMED' ? 'bg-emerald-50/50 border-emerald-100' : 'bg-slate-50 border-slate-200'} transition-all`}>
                                <div className="flex justify-between items-start mb-2">
                                    <h5 className="text-[13px] font-bold text-slate-800 leading-tight pr-10">{claim.claim}</h5>
                                    <Badge className={`text-[8px] font-black uppercase ${claim.status === 'CONFIRMED' ? 'bg-emerald-500 text-white' : 'bg-slate-400 text-white'}`}>
                                        {claim.status}
                                    </Badge>
                                </div>
                                <div className="flex gap-1.5 flex-wrap mb-3">
                                    <span className="text-[9px] font-black text-slate-400 uppercase bg-white border border-slate-100 px-1.5 rounded-sm">
                                        ID: {claim.claim_id?.substring(0, 8) || 'v2_sys'}
                                    </span>
                                    <span className={`text-[9px] font-black uppercase px-2 rounded-full ${claim.category === 'PAIN' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'}`}>
                                        {claim.category}
                                    </span>
                                </div>

                                {claim.evidence_ids?.length > 0 && (
                                    <div className="mt-3 space-y-2 pt-3 border-t border-slate-200/50">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Supporting Evidence:</p>
                                        {claim.evidence_ids.map((eid: string) => {
                                            const ev = data.evidence.find((e: any) => e.evidence_id === eid);
                                            return ev ? (
                                                <div key={eid} className="bg-white p-2.5 rounded-lg border border-slate-100 shadow-sm">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <Badge variant="outline" className="text-[7px] h-3.5 px-1 bg-blue-50 border-blue-100 text-blue-600">{ev.source_type}</Badge>
                                                        <span className="text-[8px] font-mono text-slate-400">Confidence: {((ev.confidence ?? 0) * 100).toFixed(0)}%</span>
                                                    </div>
                                                    <p className="text-[11px] font-medium text-slate-600 italic leading-relaxed">"{ev.quote}"</p>
                                                </div>
                                            ) : null;
                                        })}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // specialized avatar matrix viewer
    if (data.avatars || data.winner || Array.isArray(data)) {
        const avatars = Array.isArray(data) ? data : (data.avatars || []);
        return (
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {avatars.map((avatar: any, i: number) => (
                        <Card key={i} className="p-5 bg-white rounded-xl border border-slate-200 hover:border-blue-300 transition-all shadow-sm group">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h4 className="text-base font-black text-slate-800 uppercase tracking-tight leading-tight">{avatar.name}</h4>
                                    <Badge variant="secondary" className="text-[8px] bg-slate-100 text-slate-500 mt-1 uppercase font-black">{avatar.awareness_level || 'Nivel Desconocido'}</Badge>
                                </div>
                                <Button size="icon" variant="ghost" className="h-6 w-6 text-blue-400 hover:text-blue-600" onClick={() => handleGenerateAngles(avatar.id)}>
                                    <Zap className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                            <p className="text-xs font-bold text-slate-700 leading-snug mb-4">
                                {avatar.psychographic_profile || avatar.core_desire || avatar.desire}
                            </p>
                            <Button size="sm" variant="outline" className="w-full text-[9px] font-black uppercase border-blue-200 text-blue-600 hover:bg-blue-50" onClick={() => handleGenerateAngles(avatar.id)}>
                                Generar Ángulos
                            </Button>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <pre className="text-[10px] text-slate-600 font-mono whitespace-pre-wrap">
                    {JSON.stringify(data, null, 2)}
                </pre>
            </div>
        </div>
    );
}
