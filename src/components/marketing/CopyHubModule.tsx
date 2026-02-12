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
                storeId: "default"
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
        <div className="grid grid-cols-12 gap-6 pt-4">
            {/* Configuration Panel */}
            <div className="col-span-12 lg:col-span-4 space-y-4">
                <Card className="bg-white border-slate-200 rounded-2xl shadow-sm p-6 space-y-6">
                    <div className="space-y-0.5">
                        <h2 className="text-sm font-black uppercase italic text-slate-800 flex items-center gap-2">
                            <Plus className="h-4 w-4 text-yellow-600" /> Crear Nuevo Copy
                        </h2>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[8px]">Producto: {productTitle || "Cargando..."}</p>
                    </div>

                    <div className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Concept ID</label>
                            <Input
                                value={conceptId}
                                onChange={e => setConceptId(e.target.value)}
                                placeholder="Ej: NAD_C1"
                                className="h-10 bg-slate-50 border-slate-200 rounded-xl px-4 font-bold text-slate-700 text-xs"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Formato</label>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { id: 'LANDING_PAGE', label: 'Landing', icon: Layout },
                                    { id: 'AD_VIDEO', label: 'Video', icon: FileText },
                                    { id: 'ADVERTORIAL', label: 'Advertorial', icon: Type },
                                    { id: 'AD_STATIC', label: 'Static', icon: Sparkles },
                                ].map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => setContext(item.id)}
                                        className={cn(
                                            "flex items-center gap-2 p-3 rounded-xl border transition-all text-[9px] font-black uppercase tracking-tight text-left",
                                            context === item.id
                                                ? "bg-yellow-600 border-yellow-700 text-white shadow-lg shadow-yellow-900/10"
                                                : "bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100"
                                        )}
                                    >
                                        <item.icon className="h-3.5 w-3.5 shrink-0" />
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <Button
                            onClick={handleGenerate}
                            disabled={loading}
                            className="w-full h-12 rounded-xl bg-slate-900 hover:bg-black text-white font-black uppercase tracking-widest text-[10px] shadow-lg transition-all"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Generar Copy Maestro"}
                        </Button>
                    </div>
                </Card>

                <Card className={cn(
                    "rounded-2xl p-4 border transition-colors",
                    (context === 'LANDING_PAGE' || context === 'ADVERTORIAL')
                        ? "bg-red-50 border-red-100 text-red-900"
                        : "bg-blue-50 border-blue-100 text-blue-900"
                )}>
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "h-10 w-10 rounded-xl flex items-center justify-center shadow-sm",
                            (context === 'LANDING_PAGE' || context === 'ADVERTORIAL') ? "bg-red-600 text-white" : "bg-blue-600 text-white"
                        )}>
                            {(context === 'LANDING_PAGE' || context === 'ADVERTORIAL') ? <Zap className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                        </div>
                        <div>
                            <h3 className="font-black uppercase italic text-xs">
                                {(context === 'LANDING_PAGE' || context === 'ADVERTORIAL') ? "Modo Agresivo" : "Modo Seguro Ads"}
                            </h3>
                            <p className="text-[9px] font-bold opacity-70 uppercase tracking-widest mt-0.5">
                                {(context === 'LANDING_PAGE' || context === 'ADVERTORIAL') ? "Conversión Máxima" : "Compliance Activo"}
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Editor Panel */}
            <div className="col-span-12 lg:col-span-8">
                <Card className="bg-white border-slate-200 rounded-2xl shadow-sm min-h-[500px] flex flex-col overflow-hidden">
                    <Tabs defaultValue="editor" className="flex-1 flex flex-col">
                        <TabsList className="bg-slate-50/50 p-1.5 h-12 border-b border-slate-100 w-full justify-start gap-1.5">
                            <TabsTrigger value="editor" className="rounded-lg font-black uppercase text-[9px] px-4">Editor</TabsTrigger>
                            <TabsTrigger value="qa" className="rounded-lg font-black uppercase text-[9px] px-4 flex gap-2">
                                QA {qaResult && <div className={cn("h-1.5 w-1.5 rounded-full", qaResult.passed ? "bg-green-500" : "bg-red-500")} />}
                            </TabsTrigger>
                            <div className="ml-auto pr-3 flex items-center gap-2">
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400" onClick={() => {
                                    navigator.clipboard.writeText(generatedCopy);
                                    toast.success("Copiado");
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
                                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "h-12 w-12 rounded-full flex items-center justify-center text-white text-lg font-black",
                                                qaResult.passed ? "bg-green-500" : "bg-red-500"
                                            )}>
                                                {qaResult.score}%
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-black uppercase italic text-slate-900">Puntuación</h3>
                                                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">ContentGuard v1</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        {qaResult.warnings.map((w: string, i: number) => (
                                            <div key={i} className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-100 rounded-xl text-[11px] font-bold text-orange-900">
                                                <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />
                                                {w}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-[300px] text-slate-300">
                                    <ShieldCheck className="h-10 w-10 opacity-20 mb-2" />
                                    <p className="font-black uppercase tracking-[0.2em] text-[9px]">Sin datos de QA</p>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </Card>
            </div>
        </div>
    );
}
