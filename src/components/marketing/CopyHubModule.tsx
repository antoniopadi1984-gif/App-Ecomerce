"use client";

import React, { useState, useEffect } from "react";
import {
    Zap,
    Plus,
    Layout,
    FileText,
    Type,
    Sparkles,
    ShieldCheck,
    Save,
    Copy,
    CheckCircle2,
    AlertTriangle,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { generateProductCopy } from "@/app/marketing/copy-hub/actions";
import { validateContent } from "@/lib/content-qa";

interface CopyHubProps {
    productId: string;
    productTitle?: string;
}

export function CopyHubModule({ productId, productTitle }: CopyHubProps) {
    const [loading, setLoading] = useState(false);
    const [context, setContext] = useState<any>("LANDING_PAGE");
    const [conceptId, setConceptId] = useState("MASTER_C1");
    const [sophisticationLevel, setSophisticationLevel] = useState(3);
    const [mechanism, setMechanism] = useState("");
    const [generatedCopy, setGeneratedCopy] = useState("");
    const [qaResult, setQaResult] = useState<any>(null);

    const handleGenerate = async () => {
        if (!productId) return toast.error("Selecciona un producto.");
        setLoading(true);
        try {
            const res = await generateProductCopy({
                productId,
                context,
                conceptId,
                storeId: "default",
                sophisticationLevel,
                mechanism
            });
            if (res.success) {
                setGeneratedCopy(res.content || "");
                const qa = validateContent(res.content || "", (context === 'AD_VIDEO' || context === 'AD_STATIC') ? 'AD' : 'LANDING');
                setQaResult(qa);
                toast.success("Copy generado con éxito.");
            } else {
                toast.error("Error: " + res.error);
            }
        } catch (error) {
            toast.error("Error crítico en la generación");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-12 gap-4 pt-4">
            {/* Panel de Configuración */}
            <div className="col-span-12 lg:col-span-4 space-y-4">
                <Card className="bg-white/40 backdrop-blur-md border-slate-100/50 rounded-2xl shadow-sm p-3 space-y-4">
                    <div className="space-y-0.5 border-b border-slate-100/50 pb-2">
                        <h2 className="text-xs font-black uppercase italic text-slate-900 flex items-center gap-2">
                            <Plus className="h-3.5 w-3.5 text-rose-500" /> Motor de Copy
                        </h2>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[8px]">Producto: {productTitle || "Estándar"}</p>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">ID del Concepto</label>
                            <Input
                                value={conceptId}
                                onChange={e => setConceptId(e.target.value)}
                                placeholder="Ej: NAD_C1"
                                className="h-8 bg-white/60 border-slate-100 rounded-xl px-4 font-bold text-slate-700 text-[11px] focus:ring-rose-500"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1 flex justify-between">
                                Sofisticación
                                <span className="text-rose-600">Nivel {sophisticationLevel}</span>
                            </label>
                            <input
                                type="range" min="1" max="5" step="1"
                                value={sophisticationLevel}
                                onChange={(e) => setSophisticationLevel(parseInt(e.target.value))}
                                className="w-full h-1 bg-slate-200 rounded-full appearance-none cursor-pointer accent-rose-500"
                            />
                            <p className="text-[8px] text-slate-400 font-bold italic">
                                {sophisticationLevel === 1 && "Nuevo mercado. Promesa directa."}
                                {sophisticationLevel === 2 && "Competencia. Promesa ampliada."}
                                {sophisticationLevel === 3 && "Saturado. Foco en MECANISMO."}
                                {sophisticationLevel === 4 && "Escéptico. Mecanismo refinado."}
                                {sophisticationLevel === 5 && "Agotado. Foco en Identidad."}
                            </p>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Mecanismo Único</label>
                            <Input
                                value={mechanism}
                                onChange={e => setMechanism(e.target.value)}
                                placeholder="La Idea Principal (Big Idea)..."
                                className="h-8 bg-white/60 border-slate-100 rounded-xl px-4 font-bold text-slate-700 text-[11px] focus:bg-white focus:ring-rose-500"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Formato de Salida</label>
                            <div className="grid grid-cols-2 gap-1.5">
                                {[
                                    { id: 'LANDING_PAGE', label: 'Landing', icon: Layout },
                                    { id: 'AD_VIDEO', label: 'Video ad', icon: FileText },
                                    { id: 'ADVERTORIAL', label: 'Advertorial', icon: Type },
                                    { id: 'STATIC_AD', label: 'Static ad', icon: Sparkles },
                                ].map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => setContext(item.id)}
                                        className={cn(
                                            "flex items-center gap-2 p-2 rounded-xl border transition-all text-[9px] font-black uppercase tracking-tight text-left",
                                            context === item.id
                                                ? "bg-rose-500 border-rose-500 text-white shadow-md shadow-rose-200"
                                                : "bg-white/40 border-slate-100 text-slate-400 hover:bg-slate-50"
                                        )}
                                    >
                                        <item.icon className="h-3 w-3 shrink-0" />
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <Button
                            onClick={handleGenerate}
                            disabled={loading}
                            className="w-full h-10 rounded-xl bg-slate-900 hover:bg-black text-white font-black uppercase tracking-widest text-[10px] shadow-lg transition-all"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Generar Copy Maestro"}
                        </Button>
                    </div>
                </Card>

                <Card className={cn(
                    "rounded-2xl p-3 border transition-all backdrop-blur-sm",
                    (context === 'LANDING_PAGE' || context === 'ADVERTORIAL')
                        ? "bg-rose-500/5 border-rose-500/10 text-rose-900"
                        : "bg-emerald-500/5 border-emerald-500/10 text-emerald-900"
                )}>
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "h-9 w-9 rounded-xl flex items-center justify-center shadow-sm",
                            (context === 'LANDING_PAGE' || context === 'ADVERTORIAL') ? "bg-rose-500 text-white" : "bg-emerald-500 text-white"
                        )}>
                            {(context === 'LANDING_PAGE' || context === 'ADVERTORIAL') ? <Zap className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                        </div>
                        <div>
                            <h3 className="font-black uppercase italic text-xs">
                                {(context === 'LANDING_PAGE' || context === 'ADVERTORIAL') ? "Modo Agresivo" : "Modo Seguro (Ads)"}
                            </h3>
                            <p className="text-[9px] font-bold opacity-70 uppercase tracking-widest mt-0.5">
                                {(context === 'LANDING_PAGE' || context === 'ADVERTORIAL') ? "Máxima Conversión" : "Cumplimiento Activo"}
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Panel del Editor */}
            <div className="col-span-12 lg:col-span-8">
                <Card className="bg-white/40 backdrop-blur-md border-slate-100/50 rounded-2xl shadow-sm min-h-[500px] flex flex-col overflow-hidden">
                    <Tabs defaultValue="editor" className="flex-1 flex flex-col">
                        <TabsList className="bg-slate-50/50 p-1.5 h-12 border-b border-slate-100/50 w-full justify-start gap-1.5">
                            <TabsTrigger value="editor" className="rounded-lg font-black uppercase text-[9px] px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm">Editor</TabsTrigger>
                            <TabsTrigger value="qa" className="rounded-lg font-black uppercase text-[9px] px-4 flex gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                Calidad (QA) {qaResult && <div className={cn("h-1.5 w-1.5 rounded-full", qaResult.passed ? "bg-emerald-500" : "bg-rose-500")} />}
                            </TabsTrigger>
                            <div className="ml-auto pr-3 flex items-center gap-2">
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-rose-500" onClick={() => {
                                    navigator.clipboard.writeText(generatedCopy);
                                    toast.success("Copiado al portapapeles");
                                }}>
                                    <Copy className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </TabsList>
                        <TabsContent value="editor" className="flex-1 p-0">
                            <Textarea
                                value={generatedCopy}
                                onChange={e => setGeneratedCopy(e.target.value)}
                                placeholder="El copy aparecerá aquí después de la generación..."
                                className="w-full h-full min-h-[500px] bg-transparent border-none text-slate-700 text-base font-medium leading-relaxed resize-none focus:ring-0 p-6 font-mono"
                            />
                        </TabsContent>
                        <TabsContent value="qa" className="flex-1 p-6">
                            {qaResult ? (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between p-4 bg-white/60 rounded-xl border border-slate-100">
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "h-12 w-12 rounded-full flex items-center justify-center text-white text-lg font-black",
                                                qaResult.passed ? "bg-emerald-500" : "bg-rose-500"
                                            )}>
                                                {qaResult.score}%
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-black uppercase italic text-slate-900">Puntuación Total</h3>
                                                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">ContentGuard v1</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        {qaResult.warnings.map((w: string, i: number) => (
                                            <div key={i} className="flex items-center gap-2 p-3 bg-rose-50/50 border border-rose-100 rounded-xl text-[11px] font-bold text-rose-900">
                                                <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
                                                {w}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-[300px] text-slate-300">
                                    <ShieldCheck className="h-10 w-10 opacity-20 mb-2" />
                                    <p className="font-black uppercase tracking-[0.2em] text-[9px]">Sin datos de Calidad</p>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </Card>
            </div>
        </div>
    );
}
