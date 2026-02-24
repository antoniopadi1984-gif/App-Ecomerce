"use client";

import React, { useState, useEffect } from "react";
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
import { AiCollaborationPanel } from "@/components/marketing/ai-collaboration-panel";
import { STATIC_ADS_PROTOCOL } from "@/lib/static-ads-protocol";

interface StaticAdsModuleProps {
    productId: string;
    productTitle?: string;
}

export function StaticAdsModule({ productId, productTitle }: StaticAdsModuleProps) {
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
            <div className="grid grid-cols-12 gap-5">
                {/* 1. MANDO DE CONFIGURACIÓN */}
                <div className="col-span-12 lg:col-span-4 xl:col-span-3 space-y-4">
                    <Card className="bg-white/40 backdrop-blur-md border-slate-100/50 rounded-[2rem] p-5 space-y-6 shadow-sm">
                        <div className="space-y-5">
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
                                        <Button key={style} variant="outline" className="h-9 rounded-2xl border-slate-100 bg-white/40 text-[9px] font-black uppercase tracking-widest hover:border-rose-300 hover:bg-white hover:text-rose-500 transition-all shadow-sm">
                                            {style}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <Button
                                onClick={handleGenerateConcepts}
                                disabled={isGenerating}
                                className="w-full h-11 bg-slate-900 hover:bg-black text-rose-500 font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95 group"
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

                    <AiCollaborationPanel
                        productId={productId || "temp"}
                        productName={productTitle || "Nuevo Producto"}
                        context={{
                            customPrompt: STATIC_ADS_PROTOCOL.AD_CONCEPT(productTitle || "", targetAudience)
                        }}
                        onImport={async (data) => {
                            if (Array.isArray(data)) setConcepts(data);
                            else if (data.concepts) setConcepts(data.concepts);
                        }}
                        onGenerateNext={(type) => {
                            toast.success(`Protocolo ${type} activado.`);
                        }}
                    />
                </div>

                {/* 2. TABLERO DE RESULTADOS */}
                <div className="col-span-12 lg:col-span-8 xl:col-span-9">
                    {!concepts.length && !isGenerating ? (
                        <div className="h-[500px] border-2 border-dashed border-slate-100 rounded-[3rem] bg-white/20 backdrop-blur-sm flex flex-col items-center justify-center text-center p-12 group transition-all hover:bg-white/30 hover:border-rose-100">
                            <div className="relative mb-6">
                                <div className="absolute inset-0 bg-rose-500/10 blur-3xl rounded-full scale-150 animate-pulse" />
                                <ImageIcon className="h-16 w-16 text-slate-200 relative z-10 group-hover:text-rose-200 transition-colors" />
                            </div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.3em] mb-2">Nano Intelligence Visual Hub</h3>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest max-w-[300px] leading-relaxed">
                                Define la audiencia y deja que nuestro motor de diseño estratégico genere conceptos de alta conversión.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-6 duration-1000">
                            {concepts.map((concept, idx) => (
                                <Card key={idx} className="bg-white/40 backdrop-blur-md border-slate-100/50 rounded-[2.5rem] overflow-hidden group hover:border-rose-300 hover:shadow-2xl hover:shadow-rose-500/5 transition-all duration-700 shadow-sm flex flex-col">
                                    {/* Ad Canvas Section */}
                                    <div className="aspect-[4/5] bg-slate-50/30 relative overflow-hidden flex flex-col">
                                        <div className="absolute top-4 inset-x-4 flex justify-between items-start z-10">
                                            <Badge className="bg-rose-500 text-white font-black uppercase text-[9px] tracking-widest rounded-xl px-3 py-1 shadow-lg shadow-rose-500/20 border-none">
                                                ID: {idx + 1}
                                            </Badge>
                                            <Badge className="bg-white/90 backdrop-blur-md text-slate-900 border border-slate-100 font-black uppercase text-[8px] tracking-widest rounded-xl px-3 py-1 shadow-sm">
                                                {concept.angle || "ÁNGULO ESTRATÉGICO"}
                                            </Badge>
                                        </div>

                                        <div className="flex-1 flex items-center justify-center p-16 opacity-5">
                                            <Sparkles className="h-40 w-40 text-slate-900" />
                                        </div>

                                        <div className="p-6 bg-gradient-to-t from-white via-white/90 to-transparent">
                                            <h4 className="text-lg font-black text-slate-900 uppercase italic tracking-tighter leading-[1.1] group-hover:text-rose-600 transition-colors">
                                                {concept.headline}
                                            </h4>
                                        </div>
                                    </div>

                                    {/* Copy & Strategy Section */}
                                    <CardContent className="p-6 space-y-5 border-t border-white/50 flex-1 flex flex-col">
                                        <div className="space-y-4">
                                            <div className="space-y-1.5">
                                                <p className="text-[9px] font-black uppercase text-rose-500 tracking-[0.2em] font-mono flex items-center gap-2">
                                                    <Zap className="w-3 h-3 fill-rose-500" /> Gancho Visual
                                                </p>
                                                <p className="text-xs font-bold text-slate-600 leading-relaxed bg-rose-50/30 p-2.5 rounded-2xl border border-rose-100/30">
                                                    {concept.hook}
                                                </p>
                                            </div>
                                            <div className="space-y-1.5">
                                                <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] font-mono flex items-center gap-2">
                                                    <CopyIcon className="w-3 h-3" /> Micro Copy
                                                </p>
                                                <p className="text-xs text-slate-700 font-black italic uppercase tracking-tight leading-relaxed">
                                                    "{concept.copy}"
                                                </p>
                                            </div>
                                        </div>

                                        <div className="pt-5 border-t border-slate-100/50 space-y-4 mt-auto">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-slate-900 flex items-center justify-center">
                                                        <BrainIcon className="h-3 w-3 text-rose-500" />
                                                    </div>
                                                    <p className="text-[9px] font-black uppercase text-slate-900 tracking-widest">Image Prompt</p>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 text-[8px] font-black uppercase tracking-widest hover:bg-rose-50 text-rose-600 rounded-xl px-3 transition-all border border-transparent hover:border-rose-100"
                                                    onClick={() => copyToClipboard(concept.prompt, "Midjourney Prompt")}
                                                >
                                                    <CopyIcon className="h-3 w-3 mr-2" /> Copiar
                                                </Button>
                                            </div>
                                            <div className="p-4 rounded-[1.5rem] bg-slate-50/50 border border-slate-100 font-mono text-[9px] text-slate-500 leading-relaxed break-words line-clamp-3 italic opacity-60 group-hover:opacity-100 transition-opacity">
                                                {concept.prompt}
                                            </div>
                                            <Button className="w-full h-11 bg-slate-900 text-white font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl hover:bg-black transition-all flex items-center justify-center gap-3 mt-1 shadow-lg active:scale-95">
                                                <Sparkles className="h-4 w-4 text-rose-500" /> Generar Imagen Pro
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
