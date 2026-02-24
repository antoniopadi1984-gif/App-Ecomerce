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
        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
            <div className="p-3">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <Sparkles className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Laboratorio de Iteración</h3>
                            <p className="text-[10px] text-slate-500 font-medium">Genera variaciones instantáneas desde Datos Forenses</p>
                        </div>
                    </div>
                    <Badge variant="outline" className="bg-slate-900 text-white border-slate-800 px-3 py-1 text-xs">
                        MODELO IA: CLAUDE 3.7 SONNET
                    </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Avatar Generator */}
                    <div className="group bg-white p-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-300">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 group-hover:text-slate-900 group-hover:bg-slate-100 transition-colors">
                                <Users className="w-3.5 h-3.5" />
                            </div>
                            <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Avatares</h4>
                        </div>
                        <div className="space-y-3">
                            <select
                                className="w-full text-[10px] font-black uppercase h-9 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg outline-none px-2 text-slate-700 transition-colors"
                                value={avatarParams.awarenessLevel}
                                onChange={(e) => setAvatarParams({ ...avatarParams, awarenessLevel: e.target.value })}
                            >
                                <option value="Most Aware">🔥 Muy Consciente</option>
                                <option value="Product Aware">🛒 Consc. Producto</option>
                                <option value="Solution Aware">💡 Consc. Solución</option>
                                <option value="Problem Aware">🤕 Consc. Problema</option>
                                <option value="Unaware">🥶 Inconsciente</option>
                            </select>
                            <Button
                                onClick={handleRegenerateAvatars}
                                disabled={isLoading}
                                className="w-full h-8 text-[9px] font-black uppercase tracking-widest bg-slate-900 hover:bg-black text-white rounded-lg transition-colors shadow-sm"
                            >
                                Regenerar
                            </Button>
                        </div>
                    </div>

                    {/* Angle Explorer */}
                    <div className="group bg-white p-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-300">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 group-hover:text-slate-900 group-hover:bg-slate-100 transition-colors">
                                <Target className="w-3.5 h-3.5" />
                            </div>
                            <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Ángulos</h4>
                        </div>
                        <div className="space-y-3">
                            <select
                                className="w-full text-[10px] font-black uppercase h-9 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg outline-none px-2 text-slate-700 transition-colors"
                                value={angleVariationType}
                                onChange={(e) => setAngleVariationType(e.target.value)}
                            >
                                <option value="ALL">🧬 Mix Híbrido</option>
                                <option value="DIRECT">👊 Respuesta Directa</option>
                                <option value="STORY">📖 Storytelling</option>
                                <option value="CONTRARIAN">⚡ Contrariano</option>
                            </select>
                            <Button
                                onClick={handleGenerateAngles}
                                disabled={isLoading}
                                className="w-full h-8 text-[9px] font-black uppercase tracking-widest bg-slate-900 hover:bg-black text-white rounded-lg transition-colors shadow-sm"
                            >
                                Explorar
                            </Button>
                        </div>
                    </div>

                    {/* Copy Architect */}
                    <div className="group bg-white p-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-300">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 group-hover:text-slate-900 group-hover:bg-slate-100 transition-colors">
                                <FileText className="w-3.5 h-3.5" />
                            </div>
                            <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Textos V3</h4>
                        </div>
                        <div className="space-y-3">
                            <select
                                className="w-full text-[10px] font-black uppercase h-9 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg outline-none px-2 text-slate-700 transition-colors"
                                value={copyType}
                                onChange={(e) => setCopyType(e.target.value as any)}
                            >
                                <option value="HEADLINE">📰 Titulares</option>
                                <option value="VSL_OPENING">🎬 Aperturas VSL</option>
                                <option value="CTA">🎯 Llamadas a la Acción</option>
                                <option value="BULLETS">🔫 Viñetas</option>
                            </select>
                            <Button
                                onClick={handleGenerateCopy}
                                disabled={isLoading}
                                className="w-full h-8 text-[9px] font-black uppercase tracking-widest bg-slate-900 hover:bg-black text-white rounded-lg transition-colors shadow-sm"
                            >
                                Generar
                            </Button>
                        </div>
                    </div>

                    {/* God-Tier Copy (V4) */}
                    <div className="group bg-slate-950 p-3 rounded-xl border border-slate-800 hover:border-slate-700 hover:shadow-2xl transition-all duration-500 relative overflow-hidden flex flex-col justify-between">
                        <div className="absolute -top-10 -right-10 w-24 h-24 bg-[var(--primary)]/10 rounded-full blur-2xl group-hover:bg-[var(--primary)]/15 transition-all" />

                        <div className="relative z-10">
                            <h3 className="text-xs font-black uppercase tracking-widest text-white mb-2 flex items-center gap-2">
                                <Zap className="w-4 h-4 text-[var(--primary)] fill-current" /> GOD-TIER V4
                            </h3>
                            <p className="text-[9px] font-medium text-white italic opacity-90 mb-3">Secuencia Triple: Briefing + Destilación + Generación</p>
                        </div>

                        <Button
                            onClick={handleGenerateGodTier}
                            disabled={isLoading}
                            className="w-full relative z-10 h-8 text-[9px] font-black uppercase tracking-widest bg-[var(--primary)] hover:bg-rose-500 text-white rounded-lg shadow-sm hover:shadow-[0_0_15px_rgba(244,63,94,0.3)] transition-all border border-[var(--primary)]/50"
                        >
                            Lanzar Secuencia
                        </Button>
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
