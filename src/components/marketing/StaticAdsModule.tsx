"use client";

import React, { useState, useEffect } from "react";
import { CreativeAgentPanel } from "@/components/creative/CreativeAgentPanel";
import {
    Image as ImageIcon, Sparkles, Wand2, RefreshCw,
    Layout, Smartphone, Monitor, Square, Copy as CopyIcon,
    Zap, Brain as BrainIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { generateStaticConcepts, getProducts } from "@/app/marketing/static-ads/actions";
import { STATIC_ADS_PROTOCOL } from "@/lib/static-ads-protocol";
import { CREATIVE_CONCEPTS } from "@/lib/creative/spencer-knowledge";

interface StaticAdsModuleProps {
    productId: string;
    productTitle?: string;
    storeId?: string;
}

export function StaticAdsModule({ productId, productTitle, storeId = '' }: StaticAdsModuleProps) {
    const [targetAudience, setTargetAudience] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [concepts, setConcepts] = useState<any[]>([]);
    const [productImageBase64, setProductImageBase64] = useState<string | null>(null);

    const handleGenerateConcepts = async () => {
        if (!productTitle || !targetAudience) {
            toast.error("Por favor ingresa la audiencia.");
            return;
        }
        setIsGenerating(true);
        const res = await generateStaticConcepts(productTitle, targetAudience, productImageBase64 || undefined);
        setIsGenerating(false);

        if (res.success && res.concepts) {
            setConcepts(res.concepts);
            toast.success("Conceptos generados con éxito.");
        } else {
            toast.error("Error al generar conceptos: " + res.error);
        }
    };

    const copyToClipboard = (text: string, platform: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`Copiado al portapapeles (${platform})`);
    };

    return (
        <div className="flex flex-col gap-4 animate-in fade-in duration-700 pt-2">
            <div className="grid grid-cols-12 gap-3">
                {/* 1. MANDO DE CONFIGURACIÓN */}
                <div className="col-span-12 lg:col-span-4 xl:col-span-3 space-y-3 flex flex-col min-h-full">
                    <Card className="bg-white border-slate-200 rounded-xl p-4 space-y-5 shadow-sm">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1 flex items-center gap-2">
                                    <BrainIcon className="w-3 h-3 text-rose-500" />
                                    Audiencia Objetivo
                                </label>
                                <Input
                                    placeholder="Ej: Emprendedores digitales con poco tiempo..."
                                    value={targetAudience}
                                    onChange={(e) => setTargetAudience(e.target.value)}
                                    className="h-10 bg-white/60 border-slate-100 rounded-2xl px-4 font-bold text-slate-700 text-[11px] focus:ring-rose-500 shadow-sm placeholder:text-slate-300"
                                />
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Estilos Visuales Nano</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {['Premium', 'Direct Response', 'Editorial', 'Orgánico'].map((style) => (
                                        <Button key={style} variant="outline" className="h-8 rounded-lg border-slate-200 bg-white text-[9px] font-black uppercase tracking-widest hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 transition-all shadow-sm focus:ring-rose-500">
                                            {style}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <Button
                                onClick={handleGenerateConcepts}
                                disabled={isGenerating}
                                className="w-full h-10 bg-slate-900 hover:bg-black text-rose-500 font-black uppercase tracking-[0.2em] text-[10px] rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 group"
                            >
                                {isGenerating ? (
                                    <RefreshCw className="h-4 w-4 animate-spin shrink-0" />
                                ) : (
                                    <Wand2 className="h-4 w-4 shrink-0 group-hover:rotate-12 transition-transform" />
                                )}
                                <span>Diseñar Conceptos</span>
                            </Button>
                        </div>
                    </Card>

                    {/* C1-C7 Concept Filter */}
                    <Card className="bg-white border-slate-200 rounded-xl p-3 shadow-sm">
                        <label className="text-[8px] font-black uppercase text-slate-400 tracking-[0.2em]">
                            Concepto C1-C7
                        </label>
                        <div className="flex flex-wrap gap-1 mt-2">
                            {CREATIVE_CONCEPTS.map(c => (
                                <button
                                    key={c.id}
                                    className="px-2 py-1 rounded-lg text-[9px] font-bold bg-white border border-slate-200 text-slate-600 hover:border-purple-300 hover:bg-purple-50 transition-all"
                                >
                                    {c.code}
                                </button>
                            ))}
                        </div>
                    </Card>

                    {/* Agent IA (Replaces AiCollaborationPanel) */}
                    {storeId && (
                        <CreativeAgentPanel
                            storeId={storeId}
                            productId={productId}
                            productTitle={productTitle}
                            agentRole="STATIC_AGENT"
                            agentName="Ads Estáticos IA"
                            onImport={(data) => {
                                try {
                                    const parsed = JSON.parse(data);
                                    if (Array.isArray(parsed)) setConcepts(parsed);
                                    else if (parsed.concepts) setConcepts(parsed.concepts);
                                } catch {
                                    // Not JSON, ignore
                                }
                            }}
                        />
                    )}
                </div>

                {/* 2. TABLERO DE RESULTADOS */}
                <div className="col-span-12 lg:col-span-8 xl:col-span-9">
                    {!concepts.length && !isGenerating ? (
                        <div className="h-full min-h-[400px] border border-dashed border-slate-200 rounded-xl bg-slate-50/50 flex flex-col items-center justify-center text-center p-8 group transition-all hover:bg-white hover:border-slate-300">
                            <div className="relative mb-5">
                                <div className="absolute inset-0 bg-rose-500/10 blur-[40px] rounded-full animate-pulse" />
                                <ImageIcon className="h-12 w-12 text-slate-300 relative z-10 group-hover:text-rose-300 transition-colors" />
                            </div>
                            <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.3em] mb-2">Nano Intelligence Visual Hub</h3>
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest max-w-[260px] leading-relaxed">
                                Define la audiencia y deja que nuestro motor estratégico genere conceptos de alta conversión.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-6 duration-1000">
                            {concepts.map((concept, idx) => (
                                <Card key={idx} className="bg-white border-slate-200 rounded-xl overflow-hidden group hover:border-rose-300 hover:shadow-xl hover:shadow-rose-500/5 transition-all shadow-sm flex flex-col p-0">
                                    {/* Ad Canvas Section */}
                                    <div className="aspect-[4/5] bg-slate-100/50 relative overflow-hidden flex flex-col">
                                        <div className="absolute top-3 inset-x-3 flex justify-between items-start z-10">
                                            <Badge className="bg-rose-500 text-white font-black uppercase text-[8px] tracking-widest rounded-lg px-2 py-0.5 shadow-md border-none">
                                                ID: {idx + 1}
                                            </Badge>
                                            <Badge className="bg-white/90 text-slate-800 border border-slate-200 font-black uppercase text-[8px] tracking-widest rounded-lg px-2 py-0.5 shadow-sm">
                                                {concept.angle || "ÁNGULO ESTRATÉGICO"}
                                            </Badge>
                                        </div>

                                        <div className="flex-1 flex items-center justify-center opacity-5">
                                            <Sparkles className="h-24 w-24 text-slate-900" />
                                        </div>

                                        <div className="p-4 bg-gradient-to-t from-white via-white/90 to-transparent">
                                            <h4 className="text-[13px] font-black text-slate-900 uppercase italic tracking-tighter leading-tight group-hover:text-rose-600 transition-colors">
                                                {concept.headline}
                                            </h4>
                                        </div>
                                    </div>

                                    {/* Copy & Strategy Section */}
                                    <CardContent className="p-4 space-y-4 border-t border-slate-100 flex-1 flex flex-col">
                                        <div className="space-y-4">
                                            <div className="space-y-1">
                                                <p className="text-[8px] font-black uppercase text-rose-500 tracking-[0.2em] font-mono flex items-center gap-1.5">
                                                    <Zap className="w-2.5 h-2.5 fill-rose-500" /> Gancho Visual
                                                </p>
                                                <p className="text-[10px] font-bold text-slate-700 leading-snug bg-rose-50/50 p-2 rounded-lg border border-rose-100">
                                                    {concept.hook}
                                                </p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[8px] font-black uppercase text-slate-400 tracking-[0.2em] font-mono flex items-center gap-1.5">
                                                    <CopyIcon className="w-2.5 h-2.5" /> Micro Copy
                                                </p>
                                                <p className="text-[10px] text-slate-700 font-bold italic uppercase tracking-tight leading-snug">
                                                    "{concept.copy}"
                                                </p>
                                            </div>
                                        </div>

                                        <div className="pt-3 border-t border-slate-100 space-y-3 mt-auto">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-5 h-5 rounded-full bg-slate-900 flex items-center justify-center">
                                                        <BrainIcon className="h-2.5 w-2.5 text-rose-500" />
                                                    </div>
                                                    <p className="text-[8px] font-black uppercase text-slate-800 tracking-widest">Image Prompt</p>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 text-[7px] font-black uppercase tracking-widest hover:bg-rose-50 text-rose-600 rounded-lg px-2"
                                                    onClick={() => copyToClipboard(concept.prompt, "Midjourney Prompt")}
                                                >
                                                    <CopyIcon className="h-2.5 w-2.5 mr-1" /> Copiar
                                                </Button>
                                            </div>
                                            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 font-mono text-[8.5px] text-slate-500 leading-relaxed break-words line-clamp-3 italic opacity-60 group-hover:opacity-100 transition-opacity">
                                                {concept.prompt}
                                            </div>
                                            <Button className="w-full h-9 bg-slate-900 text-white font-black uppercase text-[9px] tracking-widest rounded-lg hover:bg-black transition-all flex items-center justify-center gap-2 shadow-md">
                                                <Sparkles className="h-3 w-3 text-rose-500" /> Generar Imagen Pro
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
