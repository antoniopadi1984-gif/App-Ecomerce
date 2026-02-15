"use client";

import React, { useState } from "react";
import {
    Sparkles,
    Users,
    Target,
    FileText,
    Zap,
    XCircle,
    CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface CreativeIterationLabProps {
    productId: string;
    onRegenerateAvatars: (params: any) => Promise<any>;
    onGenerateAngleVariations: (params: any) => Promise<any>;
    onGenerateCopyVariations: (params: any) => Promise<any>;
    onGenerateGodTierCopy: (avatarIdx: number, angleIdx: number) => Promise<any>;
    isLoading: boolean;
}

export function CreativeIterationLab({
    productId,
    onRegenerateAvatars,
    onGenerateAngleVariations,
    onGenerateCopyVariations,
    onGenerateGodTierCopy,
    isLoading
}: CreativeIterationLabProps) {
    const [avatarParams, setAvatarParams] = useState({
        awarenessLevel: 'Most Aware',
        sophisticationLevel: 3,
        focusPain: '',
        targetDemo: ''
    });
    const [copyType, setCopyType] = useState<'HEADLINE' | 'VSL_OPENING' | 'CTA' | 'BULLETS'>('HEADLINE');
    const [angleVariationType, setAngleVariationType] = useState('ALL');
    const [iterationResults, setIterationResults] = useState<any>(null);

    const handleRegenerateAvatars = async () => {
        try {
            const result = await onRegenerateAvatars(avatarParams);
            if (result.success) {
                toast.success(`${result.count} avatares regenerados`);
                setIterationResults({ type: 'avatars', data: result });
            }
        } catch (e) { toast.error("Error al regenerar avatares"); }
    };

    const handleGenerateAngles = async () => {
        try {
            const result = await onGenerateAngleVariations({ variationType: angleVariationType });
            if (result.success) {
                toast.success("Variaciones de ángulos generadas");
                setIterationResults({ type: 'angles', data: result });
            }
        } catch (e) { toast.error("Error al generar ángulos"); }
    };

    const handleGenerateCopy = async () => {
        try {
            const result = await onGenerateCopyVariations({ copyType });
            if (result.success) {
                toast.success("Copy generado exitosamente");
                setIterationResults({ type: 'copy', data: result });
            }
        } catch (e) { toast.error("Error al generar copy"); }
    };

    const handleGenerateGodTier = async () => {
        try {
            const result = await onGenerateGodTierCopy(0, 0); // Default to first available for demo
            if (result.success) {
                toast.success("Secuencia God-Tier completada");
                setIterationResults({ type: 'god_tier', data: result });
            }
        } catch (e) { toast.error("Error en secuencia God-Tier"); }
    };

    return (
        <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl shadow-slate-200/50">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
            <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <Sparkles className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Creative Iteration Lab</h3>
                            <p className="text-sm text-slate-500 font-medium">Generate instant variations based on Forensic Data</p>
                        </div>
                    </div>
                    <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200 px-3 py-1 text-xs">
                        AI MODEL: CLAUDE 3.7 SONNET
                    </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Avatar Generator */}
                    <div className="group bg-slate-50 hover:bg-white p-4 rounded-lg border border-slate-100 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                <Users className="w-4 h-4" />
                            </div>
                            <h4 className="text-[11px] font-black text-slate-700 uppercase tracking-widest">Avatars</h4>
                        </div>
                        <div className="space-y-3">
                            <select
                                className="w-full text-[10px] font-black uppercase h-9 border-slate-200 bg-white rounded-xl outline-none px-2"
                                value={avatarParams.awarenessLevel}
                                onChange={(e) => setAvatarParams({ ...avatarParams, awarenessLevel: e.target.value })}
                            >
                                <option value="Most Aware">🔥 Most Aware</option>
                                <option value="Product Aware">🛒 Product Aware</option>
                                <option value="Solution Aware">💡 Solution Aware</option>
                                <option value="Problem Aware">🤕 Problem Aware</option>
                                <option value="Unaware">🥶 Unaware</option>
                            </select>
                            <Button
                                onClick={handleRegenerateAvatars}
                                disabled={isLoading}
                                className="w-full h-9 text-[9px] font-black uppercase tracking-widest bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-500/10"
                            >
                                Regenerar
                            </Button>
                        </div>
                    </div>

                    {/* Angle Explorer */}
                    <div className="group bg-slate-50 hover:bg-white p-4 rounded-lg border border-slate-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                <Target className="w-4 h-4" />
                            </div>
                            <h4 className="text-[11px] font-black text-slate-700 uppercase tracking-widest">Ángulos</h4>
                        </div>
                        <div className="space-y-3">
                            <select
                                className="w-full text-[10px] font-black uppercase h-9 border-slate-200 bg-white rounded-xl outline-none px-2"
                                value={angleVariationType}
                                onChange={(e) => setAngleVariationType(e.target.value)}
                            >
                                <option value="ALL">🧬 Hybrid Mix</option>
                                <option value="DIRECT">👊 Direct Response</option>
                                <option value="STORY">📖 Storytelling</option>
                                <option value="CONTRARIAN">⚡ Contrarian</option>
                            </select>
                            <Button
                                onClick={handleGenerateAngles}
                                disabled={isLoading}
                                className="w-full h-9 text-[9px] font-black uppercase tracking-widest bg-blue-500 hover:bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/10"
                            >
                                Explorar
                            </Button>
                        </div>
                    </div>

                    {/* Copy Architect */}
                    <div className="group bg-slate-50 hover:bg-white p-4 rounded-lg border border-slate-100 hover:border-rose-200 hover:shadow-xl hover:shadow-rose-500/5 transition-all duration-300">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                                <FileText className="w-4 h-4" />
                            </div>
                            <h4 className="text-[11px] font-black text-slate-700 uppercase tracking-widest">Copy V3</h4>
                        </div>
                        <div className="space-y-3">
                            <select
                                className="w-full text-[10px] font-black uppercase h-9 border-slate-200 bg-white rounded-xl outline-none px-2"
                                value={copyType}
                                onChange={(e) => setCopyType(e.target.value as any)}
                            >
                                <option value="HEADLINE">📰 Headlines</option>
                                <option value="VSL_OPENING">🎬 VSL Openers</option>
                                <option value="CTA">🎯 CTAs</option>
                                <option value="BULLETS">🔫 Bullets</option>
                            </select>
                            <Button
                                onClick={handleGenerateCopy}
                                disabled={isLoading}
                                className="w-full h-9 text-[9px] font-black uppercase tracking-widest bg-rose-500 hover:bg-rose-600 text-white rounded-xl shadow-lg shadow-rose-500/10"
                            >
                                Generar
                            </Button>
                        </div>
                    </div>

                    {/* God-Tier Copy (V4) */}
                    <div className="group bg-slate-900 p-4 rounded-lg border border-slate-800 hover:border-yellow-500/50 hover:shadow-2xl hover:shadow-yellow-500/10 transition-all duration-500 relative overflow-hidden">
                        <div className="absolute -top-4 -right-4 w-12 h-12 bg-yellow-500/10 rounded-full blur-xl group-hover:bg-yellow-500/20 transition-all" />
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                                <Zap className="w-4 h-4 fill-current" />
                            </div>
                            <h4 className="text-[11px] font-black text-yellow-500 uppercase tracking-widest">God-Tier V4</h4>
                        </div>
                        <div className="space-y-3">
                            <p className="text-[10px] font-medium text-slate-400 italic">Secuencia Triple: Briefing + Destilación + Generación Claude 3.7</p>
                            <Button
                                onClick={handleGenerateGodTier}
                                disabled={isLoading}
                                className="w-full h-9 text-[9px] font-black uppercase tracking-widest bg-yellow-500 hover:bg-yellow-600 text-slate-900 rounded-xl shadow-lg shadow-yellow-500/20"
                            >
                                Lanzar Secuencia
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Results Area */}
                {iterationResults && (
                    <div className="mt-4 pt-4 border-t border-slate-100 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
                                <Zap className="w-4 h-4 text-yellow-500 fill-current" />
                                Live Output: {iterationResults.type}
                            </h3>
                            <Button variant="ghost" size="sm" onClick={() => setIterationResults(null)} className="h-8 w-8 p-0 rounded-full hover:bg-slate-100">
                                <XCircle className="w-5 h-5 text-slate-400" />
                            </Button>
                        </div>
                        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 max-h-[400px] overflow-y-auto custom-scrollbar font-mono text-[11px] leading-relaxed text-blue-300 shadow-inner">
                            <pre className="whitespace-pre-wrap">{JSON.stringify(iterationResults.data, null, 2)}</pre>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
