"use client";

import React, { useState, useRef } from "react";
import { CreativeAgentPanel } from "@/components/creative/CreativeAgentPanel";
import {
    Layout, Upload, Zap, Globe, FileText, Layers, Sparkles, Rocket, Check, Search,
    Brain as BrainIcon, ShoppingCart, Info, ChevronRight, MousePointer2, ShieldCheck,
    Users, Plus, Type, Save, AlertTriangle, Loader2, MessageSquare, Target, Database,
    SearchCode, Edit3, Settings2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
    uploadShopifyTheme,
    generateProLayout,
    replicateCompetitorLanding,
    pushToShopify
} from "@/app/marketing/landing-lab/actions";
import { generateProductCopy } from "@/app/marketing/copy-hub/actions";
import { validateContent } from "@/lib/content-qa";
import { BrandingContent } from "@/components/marketing/BrandingContent";

interface LandingLabProps {
    productId: string;
    productTitle?: string;
    storeId?: string;
}

export function LandingLabModule({ productId, productTitle, storeId = '' }: LandingLabProps) {
    // --- ESTADO: LANDING LAB ---
    const [themeConfig, setThemeConfig] = useState<any>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [selectedLayout, setSelectedLayout] = useState<'ADVERTORIAL' | 'LISTICLE' | 'PRODUCT_PAGE' | 'HYBRID'>('ADVERTORIAL');
    const [generatedStructure, setGeneratedStructure] = useState<any[]>([]);
    const [replicateUrl, setReplicateUrl] = useState("");

    // --- ESTADO: COPY HUB INTEGRADO ---
    const [loadingCopy, setLoadingCopy] = useState(false);
    const [copyContext, setCopyContext] = useState<any>("LANDING_PAGE");
    const [conceptId, setConceptId] = useState("MASTER_C1");
    const [sophisticationLevel, setSophisticationLevel] = useState(3);
    const [mechanism, setMechanism] = useState("");
    const [generatedCopy, setGeneratedCopy] = useState("");
    const [qaResult, setQaResult] = useState<any>(null);

    // --- ESTADO: AGENTE BRAIN (PROMPT & COMPETENCIAS) ---
    const [customPrompt, setCustomPrompt] = useState("");
    const [competitorExamples, setCompetitorExamples] = useState<string[]>([]);
    const [newCompetitor, setNewCompetitor] = useState("");

    // --- HANDLERS: LANDINGS ---
    const handleThemeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsScanning(true);
        const tid = toast.loading("Analizando liquid...");
        try {
            const formData = new FormData();
            formData.append("theme", file);
            const res = await uploadShopifyTheme(formData);
            if (res.success && res.sections) {
                setThemeConfig(res);
                toast.success(`Tema cargado: ${res.sections.length} secciones`, { id: tid });
            } else {
                toast.error(res?.message || "Error al analizar tema", { id: tid });
            }
        } catch (error) {
            toast.error("Error al analizar tema", { id: tid });
        } finally {
            setIsScanning(false);
        }
    };

    const handleGenerateLayout = async () => {
        toast.promise(generateProLayout({
            type: selectedLayout,
            productId,
            useProSections: true
        }), {
            loading: 'Diseñando funnel...',
            success: (res) => {
                setGeneratedStructure(res.structure);
                return "Funnel generado";
            },
            error: 'Error al generar'
        });
    };

    // --- HANDLERS: COPY ---
    const handleGenerateCopy = async () => {
        if (!productId) return toast.error("Selecciona un producto.");
        setLoadingCopy(true);
        try {
            const res = await generateProductCopy({
                productId,
                context: copyContext,
                conceptId,
                storeId: "default",
                sophisticationLevel,
                mechanism,
                customPrompt,
                competitorExamples
            });
            if (res.success) {
                setGeneratedCopy(res.content || "");
                const qa = validateContent(res.content || "", (copyContext === 'AD_VIDEO' || copyContext === 'AD_STATIC') ? 'AD' : 'LANDING');
                setQaResult(qa);
                toast.success("Copy Hub: Inteligencia Desplegada");
            } else {
                toast.error("Error: " + res.error);
            }
        } catch (error) {
            toast.error("Error crítico en el Agente de Copy");
        } finally {
            setLoadingCopy(false);
        }
    };

    const addCompetitor = () => {
        if (newCompetitor && !competitorExamples.includes(newCompetitor)) {
            setCompetitorExamples([...competitorExamples, newCompetitor]);
            setNewCompetitor("");
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 border border-slate-200 bg-white rounded-xl overflow-hidden shadow-sm">
            {/* Sidebar de Control Unificado */}
            <div className="lg:col-span-3 border-r border-slate-100/50 flex flex-col bg-white/40">
                <div className="p-3 border-b border-slate-100/50 bg-slate-50/50">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 flex items-center gap-2">
                        <BrainIcon className="w-3.5 h-3.5 text-rose-500" /> Landing Builder
                    </h3>
                </div>

                <Tabs defaultValue="diseño" className="flex-1 flex flex-col">
                    <div className="px-2 pt-2">
                        <TabsList className="bg-slate-100/50 p-0.5 h-auto grid grid-cols-3 rounded-xl border border-slate-200/50">
                            <TabsTrigger value="diseño" className="text-[7.5px] font-black uppercase tracking-widest data-[state=active]:bg-rose-500 data-[state=active]:text-white h-7 rounded-lg transition-all">DISEÑO</TabsTrigger>
                            <TabsTrigger value="copy" className="text-[7.5px] font-black uppercase tracking-widest data-[state=active]:bg-rose-500 data-[state=active]:text-white h-7 rounded-lg transition-all">COPY</TabsTrigger>
                            <TabsTrigger value="cro" className="text-[7.5px] font-black uppercase tracking-widest data-[state=active]:bg-rose-500 data-[state=active]:text-white h-7 rounded-lg transition-all">CRO</TabsTrigger>
                            <TabsTrigger value="clon" className="text-[7.5px] font-black uppercase tracking-widest data-[state=active]:bg-rose-500 data-[state=active]:text-white h-7 rounded-lg transition-all">CLON</TabsTrigger>
                            <TabsTrigger value="brain" className="text-[7.5px] font-black uppercase tracking-widest data-[state=active]:bg-rose-500 data-[state=active]:text-white h-7 rounded-lg transition-all">CEREBRO</TabsTrigger>
                            <TabsTrigger value="config" className="text-[7.5px] font-black uppercase tracking-widest data-[state=active]:bg-rose-500 data-[state=active]:text-white h-7 rounded-lg transition-all">TEMA</TabsTrigger>
                        </TabsList>
                    </div>

                    <ScrollArea className="flex-1">
                        <div className="p-3">
                            <TabsContent value="config" className="mt-0 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[8px] font-black uppercase text-slate-500 tracking-widest">Sincronización Shopify</label>
                                    <div
                                        className={cn(
                                            "border border-dashed rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer transition-all",
                                            themeConfig ? "border-emerald-500 bg-emerald-50" : "border-slate-300 bg-slate-50 hover:bg-slate-100"
                                        )}
                                        onClick={() => document.getElementById('theme-module-input')?.click()}
                                    >
                                        <input id="theme-module-input" type="file" className="hidden" onChange={handleThemeUpload} accept=".zip" />
                                        <Upload className={cn("w-5 h-5 mb-2", themeConfig ? "text-emerald-500" : "text-slate-400")} />
                                        <span className="text-[8px] font-black uppercase text-slate-500 tracking-wider text-center leading-tight">
                                            {isScanning ? "Procesando..." : themeConfig ? "Tema Activo" : "Cargar .zip"}
                                        </span>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="diseño" className="mt-0 space-y-4">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[8px] font-black uppercase text-slate-500 tracking-widest">Motor de Layout</label>
                                        <div className="grid grid-cols-2 gap-1.5">
                                            <LayoutOption label="Advertorial" active={selectedLayout === 'ADVERTORIAL'} onClick={() => setSelectedLayout('ADVERTORIAL')} icon={FileText} />
                                            <LayoutOption label="Listicle" active={selectedLayout === 'LISTICLE'} onClick={() => setSelectedLayout('LISTICLE')} icon={Layers} />
                                            <LayoutOption label="Producto" active={selectedLayout === 'PRODUCT_PAGE'} onClick={() => setSelectedLayout('PRODUCT_PAGE')} icon={ShoppingCart} />
                                            <LayoutOption label="Híbrido" active={selectedLayout === 'HYBRID'} onClick={() => setSelectedLayout('HYBRID')} icon={Sparkles} />
                                        </div>
                                    </div>

                                    <Button onClick={handleGenerateLayout} className="w-full h-9 bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-widest text-[9px] rounded-xl shadow-sm gap-2">
                                        <Zap className="w-3.5 h-3.5 fill-current" /> Construir Layout
                                    </Button>
                                </div>
                            </TabsContent>

                            <TabsContent value="copy" className="mt-0 space-y-4">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[8px] font-black uppercase text-slate-500 tracking-widest">Configuración del Agente</label>
                                        <div className="space-y-3">
                                            <div className="space-y-1">
                                                <span className="text-[7px] font-black uppercase text-slate-400 tracking-widest ml-1">Contexto</span>
                                                <div className="grid grid-cols-2 gap-1">
                                                    {['LANDING_PAGE', 'ADVERTORIAL', 'AD_VIDEO', 'AD_STATIC'].map(ctx => (
                                                        <button
                                                            key={ctx}
                                                            onClick={() => setCopyContext(ctx)}
                                                            className={cn(
                                                                "p-1.5 rounded-lg border text-[7px] font-black uppercase transition-all",
                                                                copyContext === ctx ? "bg-rose-500 border-rose-600 text-white" : "bg-white/40 border-slate-100 text-slate-400"
                                                            )}
                                                        >
                                                            {ctx.split('_')[0]}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-1">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[7px] font-black uppercase text-slate-400 tracking-widest ml-1">Sofisticación</span>
                                                    <span className="text-[8px] font-black text-rose-500">Nivel {sophisticationLevel}</span>
                                                </div>
                                                <input
                                                    type="range" min="1" max="5" step="1"
                                                    value={sophisticationLevel}
                                                    onChange={(e) => setSophisticationLevel(parseInt(e.target.value))}
                                                    className="w-full h-1 bg-slate-200 rounded-full appearance-none cursor-pointer accent-rose-500"
                                                />
                                            </div>

                                            <div className="space-y-1">
                                                <span className="text-[7px] font-black uppercase text-slate-400 tracking-widest ml-1">Mecanismo</span>
                                                <Input
                                                    value={mechanism}
                                                    onChange={e => setMechanism(e.target.value)}
                                                    placeholder="Big Idea..."
                                                    className="h-7 bg-white/40 border-slate-200 text-[9px] font-bold text-slate-900 rounded-lg"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <Button onClick={handleGenerateCopy} disabled={loadingCopy} className="w-full h-9 bg-slate-900 hover:bg-black text-white font-black uppercase tracking-widest text-[9px] rounded-xl shadow-sm gap-2">
                                        {loadingCopy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 fill-current text-rose-500" />}
                                        Generar Inteligencia
                                    </Button>
                                </div>
                            </TabsContent>

                            <TabsContent value="brain" className="mt-0 space-y-4">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[8px] font-black uppercase text-slate-500 tracking-widest">Brain Override (Prompt)</label>
                                        <Textarea
                                            value={customPrompt}
                                            onChange={e => setCustomPrompt(e.target.value)}
                                            placeholder="Escribe instrucciones específicas para el agente..."
                                            className="h-24 bg-white/40 border-slate-200 text-[9px] font-medium text-slate-900 rounded-lg resize-none"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[8px] font-black uppercase text-slate-500 tracking-widest">Benchmarking (Competencia)</label>
                                        <div className="flex gap-1">
                                            <Input
                                                value={newCompetitor}
                                                onChange={e => setNewCompetitor(e.target.value)}
                                                placeholder="Ejemplo de copy exitoso..."
                                                className="h-7 bg-white/40 border-slate-200 text-[9px] font-medium text-slate-900 rounded-lg flex-1"
                                            />
                                            <Button onClick={addCompetitor} size="icon" className="h-7 w-7 bg-rose-500 hover:bg-rose-600 rounded-lg">
                                                <Plus className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                        <ScrollArea className="h-20 border border-slate-100 bg-slate-50/30 rounded-lg p-2">
                                            {competitorExamples.length === 0 ? (
                                                <p className="text-[7px] font-bold text-slate-300 uppercase tracking-widest text-center mt-6">Sin ejemplos añadidos</p>
                                            ) : (
                                                <div className="space-y-1">
                                                    {competitorExamples.map((ex, i) => (
                                                        <div key={i} className="bg-white/60 p-1.5 rounded-md border border-slate-100 flex items-center justify-between group">
                                                            <span className="text-[7px] font-bold text-slate-600 truncate flex-1">{ex}</span>
                                                            <button onClick={() => setCompetitorExamples(competitorExamples.filter((_, idx) => idx !== i))} className="opacity-0 group-hover:opacity-100 text-rose-500">
                                                                <Check className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </ScrollArea>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="cro" className="mt-0 space-y-4">
                                <div className="space-y-3">
                                    <label className="text-[8px] font-black uppercase text-slate-500 tracking-widest">Optimización de Conversión</label>
                                    <div className="space-y-2">
                                        {[
                                            { label: 'Urgencia Real', icon: Zap },
                                            { label: 'Social Proof Dinámico', icon: Users },
                                            { label: 'Escasez de Inventario', icon: ShoppingCart },
                                            { label: 'Garantía de Confianza', icon: ShieldCheck }
                                        ].map((opt) => (
                                            <div key={opt.label} className="p-2.5 rounded-xl border border-slate-100 bg-white/40 flex items-center justify-between group hover:border-rose-500/30 transition-all cursor-pointer">
                                                <div className="flex items-center gap-2">
                                                    <opt.icon className="w-3.5 h-3.5 text-rose-500" />
                                                    <span className="text-[9px] font-bold text-slate-700 uppercase tracking-tight">{opt.label}</span>
                                                </div>
                                                <div className="w-3 h-3 rounded-full border-2 border-slate-200 group-hover:border-rose-500 transition-colors" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="clon" className="mt-0 space-y-3">
                                <div className="space-y-2">
                                    <label className="text-[8px] font-black uppercase text-slate-500 tracking-widest">URL del Competidor</label>
                                    <Input
                                        value={replicateUrl}
                                        onChange={(e) => setReplicateUrl(e.target.value)}
                                        placeholder="https://..."
                                        className="h-8 bg-white/40 border-slate-200 text-[10px] text-slate-900 focus:ring-rose-500"
                                    />
                                    <Button className="w-full h-8 bg-slate-900 hover:bg-black text-white font-black uppercase tracking-widest text-[8px] rounded-lg">
                                        Iniciar Clonación
                                    </Button>
                                </div>
                            </TabsContent>
                        </div>
                    </ScrollArea>

                    <div className="p-3 border-t border-slate-100/50 bg-slate-50/50">
                        <Button
                            disabled={generatedStructure.length === 0}
                            className="w-full h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-[9px] rounded-xl shadow-sm gap-2"
                            onClick={() => toast.success("Desplegando a Shopify...")}
                        >
                            <Rocket className="w-3.5 h-3.5" /> Publicar en Shopify
                        </Button>
                    </div>
                </Tabs>
            </div>

            {/* Área de Trabajo Landing Builder */}
            <div className="lg:col-span-9 bg-slate-50/50 flex flex-col h-[650px]">
                <Tabs defaultValue="strategy" className="flex-1 flex flex-col">
                    <div className="h-10 flex items-center px-4 justify-between bg-white/40 border-b border-slate-100/50">
                        <TabsList className="bg-transparent h-8 gap-1">
                            <TabsTrigger value="strategy" className="h-7 px-3 rounded-lg text-[8px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm">ESTRATEGIA</TabsTrigger>
                            <TabsTrigger value="funnel" className="h-7 px-3 rounded-lg text-[8px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm">LABORATORIO FUNNEL</TabsTrigger>
                            <TabsTrigger value="intelligence" className="h-7 px-3 rounded-lg text-[8px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm flex gap-2">
                                INTELIGENCIA DE COPY {qaResult && <div className={cn("h-1 w-1 rounded-full mt-0.5", qaResult.passed ? "bg-emerald-500" : "bg-rose-500")} />}
                            </TabsTrigger>
                        </TabsList>
                        <div className="flex items-center gap-3">
                            <span className="text-[7px] text-slate-400 font-mono tracking-[0.3em] uppercase italic">Landing Builder / v.4.0</span>
                            <Badge className="bg-rose-500 text-white border-none px-2 py-0 h-4 text-[6px] font-black uppercase shadow-sm">ALPHA</Badge>
                        </div>
                    </div>

                    <TabsContent value="strategy" className="flex-1 m-0">
                        <ScrollArea className="h-full bg-slate-50/30">
                            <div className="p-4">
                                <BrandingContent />
                            </div>
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="funnel" className="flex-1 m-0">
                        <ScrollArea className="h-full bg-slate-50/30">
                            {generatedStructure.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center p-8 text-slate-300">
                                    <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center mb-4 shadow-sm">
                                        <Sparkles className="w-5 h-5 text-rose-500/50" />
                                    </div>
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-center max-w-[200px] leading-relaxed text-slate-400">
                                        Generador de Landing Pages Activo. Construye el layout para visualizar el funnel.
                                    </p>
                                </div>
                            ) : (
                                <div className="p-4 space-y-3 max-w-[800px] mx-auto">
                                    {generatedStructure.map((block, i) => (
                                        <div key={i} className="group relative p-4 border border-slate-200 rounded-xl bg-white text-center shadow-sm transition-all hover:border-rose-300">
                                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Badge className="bg-slate-50 text-slate-400 text-[6px]">ID: {i}</Badge>
                                            </div>
                                            <Badge className="mb-3 bg-rose-500/10 text-rose-600 border border-rose-500/20 font-black text-[7px] uppercase tracking-widest">{block.type}</Badge>
                                            <h3 className="text-sm font-black text-slate-900 italic uppercase tracking-tight">{block.content || "Sección Estructural"}</h3>
                                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-2">V7 Neural Engine Optimization</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="intelligence" className="flex-1 m-0 flex flex-col">
                        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-hidden">
                            {/* Editor Area */}
                            <div className="md:col-span-8 border-r border-slate-100/50 flex flex-col bg-white/20">
                                <ScrollArea className="flex-1">
                                    <Textarea
                                        value={generatedCopy}
                                        onChange={e => setGeneratedCopy(e.target.value)}
                                        placeholder="Esperando respuesta del Agente..."
                                        className="w-full h-full min-h-[500px] bg-transparent border-none text-slate-700 text-sm font-medium leading-relaxed resize-none focus:ring-0 p-4 font-mono"
                                    />
                                </ScrollArea>
                                <div className="p-3 bg-white/40 border-t border-slate-100/50 flex justify-end gap-2">
                                    <Button variant="ghost" size="sm" className="h-7 text-[8px] font-black uppercase tracking-widest flex gap-2"
                                        onClick={() => {
                                            navigator.clipboard.writeText(generatedCopy);
                                            toast.success("Copiado al portapapeles");
                                        }}
                                    >
                                        <Target className="w-3 h-3" /> Copiar Brain Content
                                    </Button>
                                </div>
                            </div>

                            {/* QA / Results Area */}
                            <div className="md:col-span-4 bg-slate-50/30 p-4">
                                {qaResult ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-3 bg-white/80 rounded-xl border border-slate-100 shadow-sm">
                                            <div>
                                                <h4 className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Puntuación QA</h4>
                                                <div className="flex items-end gap-1 mt-1">
                                                    <span className={cn("text-xl font-black italic leading-none", qaResult.passed ? "text-emerald-500" : "text-rose-500")}>{qaResult.score}%</span>
                                                    <span className="text-[7px] font-bold text-slate-400 uppercase mb-0.5">Validado</span>
                                                </div>
                                            </div>
                                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white", qaResult.passed ? "bg-emerald-500" : "bg-rose-500")}>
                                                {qaResult.passed ? <ShieldCheck className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <h4 className="text-[7px] font-black text-slate-400 uppercase tracking-widest ml-1">Alertas de Inteligencia</h4>
                                            {qaResult.warnings.map((w: string, i: number) => (
                                                <div key={i} className="p-2.5 rounded-lg border border-rose-100 bg-rose-50/30 text-[9px] font-bold text-rose-900 leading-tight">
                                                    • {w}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center opacity-30">
                                        <Database className="w-8 h-8 text-slate-300 mb-2" />
                                        <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest text-center">Nervous System Offline</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Agent IA Panel — Full Width Below */}
            {storeId && (
                <div className="lg:col-span-12 border-t border-slate-100 p-3">
                    <CreativeAgentPanel
                        storeId={storeId}
                        productId={productId}
                        productTitle={productTitle}
                        agentRole="LANDING_AGENT"
                        agentName="Landing Builder IA"
                        onGenerate={(text) => {
                            setGeneratedCopy(text);
                            const qa = validateContent(text, 'LANDING');
                            setQaResult(qa);
                        }}
                        onImport={(data) => setGeneratedCopy(data)}
                    />
                </div>
            )}
        </div >
    );
}

function LayoutOption({ label, active, onClick, icon: Icon }: any) {
    return (
        <div
            onClick={onClick}
            className={cn(
                "p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all",
                active ? "bg-rose-500 border-rose-600 text-white shadow-sm" : "bg-white/40 border-slate-100 text-slate-400 hover:bg-slate-50"
            )}
        >
            <Icon className={cn("w-4 h-4", active ? "text-white" : "text-rose-500/50")} />
            <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
        </div>
    );
}
