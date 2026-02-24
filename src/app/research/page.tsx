"use client";

import React, { useState, Suspense, useEffect } from "react";
import { useProduct } from "@/context/ProductContext";
import { useResearch } from "@/hooks/useResearch";
import { useSearchParams } from "next/navigation";
import {
    Microscope,
    Target,
    Users,
    Sparkles,
    Layout,
    PlayCircle,
    FileText,
    Globe,
    AlertCircle,
    Loader2,
    Search,
    Brain,
    Rocket,
    CloudSync,
    Database,
    LineChart,
    ChevronRight,
    MessageSquare,
    Terminal
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PageShell } from "@/components/ui/PageShell";
import { ModuleHeader } from "@/components/ui/ModuleHeader";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ResearchProgressBar, Phase } from "@/components/research/ResearchProgressBar";
import { StructuredDataViewer } from "@/components/research/StructuredDataViewer";
import { IntelligenceSources } from "@/components/research/IntelligenceSources";
import { CreativeIterationLab } from "@/components/research/CreativeIterationLab";
import { AddProductDialog } from "@/components/products/AddProductDialog";

function ResearchContent() {
    const { productId, product } = useProduct();
    const {
        researchData,
        loading,
        progress,
        logs,
        isSystemHealthOk,
        startResearch,
        syncDrive,
        addAmazon,
        addCompetitor,
        deleteCompetitor,
        exportMasterDoc,
        clearHistory,
        generateAngles,
        generateGodTierCopy,
        regenerateAvatars,
        generateAngleVariations,
        generateCopyVariations
    } = useResearch(productId || "");

    const searchParams = useSearchParams();
    const tabParam = searchParams?.get("tab");
    const [activePhaseId, setActivePhaseId] = useState(1);

    // UI state for inputs
    const [amazonUrl, setAmazonUrl] = useState("");
    const [compUrl, setCompUrl] = useState("");

    const phases: Phase[] = [
        { id: 1, title: "ADN Producto", description: "Identidad y Mecanismo Único", status: progress.phase > 1 ? 'COMPLETED' : progress.phase === 1 ? 'RUNNING' : 'PENDING' },
        { id: 2, title: "Inteligencia de Mercado", description: "Minería de Evidencia VOC", status: progress.phase > 2 ? 'COMPLETED' : progress.phase === 2 ? 'RUNNING' : 'PENDING' },
        { id: 3, title: "Psicología", description: "Avatares y Creencias", status: progress.phase > 3 ? 'COMPLETED' : progress.phase === 3 ? 'RUNNING' : 'PENDING' },
        { id: 4, title: "Ángulos", description: "Ingeniería de Hooks", status: progress.phase > 4 ? 'COMPLETED' : progress.phase === 4 ? 'RUNNING' : 'PENDING' },
        { id: 5, title: "Funnel y Oferta", description: "Mapeo de Conversión", status: progress.phase > 5 ? 'COMPLETED' : progress.phase === 5 ? 'RUNNING' : 'PENDING' },
        { id: 6, title: "Laboratorio", description: "Iteración Continua", status: progress.phase === 6 && progress.percent === 100 ? 'COMPLETED' : progress.phase === 6 ? 'RUNNING' : 'PENDING' }
    ];

    useEffect(() => {
        if (progress.phase > 0) setActivePhaseId(progress.phase);
    }, [progress.phase]);

    if (!productId) {
        return (
            <PageShell>
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center animate-in fade-in zoom-in duration-700">
                    <div className="relative">
                        <div className="absolute -inset-4 bg-slate-100/50 blur-2xl rounded-full" />
                        <div className="relative w-16 h-16 bg-white rounded-2xl border border-slate-100 flex items-center justify-center shadow-sm">
                            <Database className="w-8 h-8 text-slate-300" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-sm font-black text-slate-900 uppercase italic">Esperando Contexto</h2>
                        <p className="text-[9px] text-slate-400 max-w-sm mx-auto font-bold uppercase tracking-widest leading-relaxed">Selecciona un producto en la barra superior.</p>
                    </div>
                </div>
            </PageShell>
        );
    }

    return (
        <PageShell>
            <ModuleHeader
                title="Research Lab"
                subtitle="Factoría X • Strategic Intelligence Hub"
                icon={Brain}
                actions={
                    <div className="flex flex-wrap items-center gap-3">
                        <AddProductDialog />
                        <Button
                            onClick={() => syncDrive()}
                            disabled={loading}
                            className="h-9 px-5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg shadow-sm transition-all flex items-center gap-2 group"
                        >
                            <CloudSync className={cn("w-4 h-4 group-hover:text-[var(--primary)] transition-colors", loading && "animate-spin")} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Drive</span>
                        </Button>
                        <Button
                            onClick={() => startResearch()}
                            disabled={loading || progress.percent > 0 && progress.percent < 100}
                            className="h-9 px-8 bg-slate-900 hover:bg-black text-white rounded-lg shadow-lg shadow-slate-200 transition-all flex items-center gap-2 group relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-[var(--primary)] opacity-0 group-hover:opacity-10 transition-opacity" />
                            <PlayCircle className="w-4 h-4 text-[var(--primary)]" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Start</span>
                        </Button>
                        <div className="flex items-center gap-2 border-l border-slate-200 pl-3 ml-1">
                            <Button
                                onClick={() => clearHistory()}
                                variant="ghost"
                                className="h-9 w-9 p-0 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                title="Limpiar Historial"
                            >
                                <Microscope className="w-4 h-4" />
                            </Button>
                            <Button className="h-9 px-4 bg-[var(--primary)] hover:bg-rose-500 text-white rounded-lg shadow-sm shadow-rose-200 font-black uppercase tracking-widest text-[9px] flex items-center gap-2 transition-all">
                                <Sparkles className="w-3.5 h-3.5" />
                                Exportar
                            </Button>
                        </div>
                    </div>
                }
            />

            <div className="flex flex-col gap-3 py-4 pb-20 max-w-[1700px] mx-auto w-full">

                {/* Progress Bar */}
                <div className="bg-white border border-slate-200 rounded-lg p-2 shadow-sm">
                    <ResearchProgressBar
                        phases={phases}
                        currentPhase={activePhaseId}
                        totalProgress={progress.percent}
                    // Note: Assuming ResearchProgressBar needs to be squashed internally 
                    // or its container here provides the compression
                    />
                </div>

                {/* Main Workspace */}
                <div className="flex flex-col xl:flex-row gap-1 items-start">
                    {/* Lateral Navigation (Phases) */}
                    <div className="w-full xl:w-64 flex flex-col gap-1">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5 ml-1 italic">Navegación Forense</h3>
                        {phases.map((p) => (
                            <button
                                key={p.id}
                                onClick={() => setActivePhaseId(p.id)}
                                className={cn(
                                    "flex items-center justify-between px-2.5 py-1.5 rounded transition-all duration-300 text-left group border text-[9px] font-black uppercase tracking-widest leading-none h-7",
                                    activePhaseId === p.id
                                        ? "bg-slate-900 text-white border-slate-900 shadow-md -translate-x-0.5"
                                        : "bg-white/40 text-slate-500 border-white/50 hover:bg-white hover:border-slate-200"
                                )}
                            >
                                <span className="flex items-center gap-2">
                                    <span className={cn(
                                        "w-5 h-5 rounded flex items-center justify-center text-[9px]",
                                        activePhaseId === p.id ? "bg-[var(--primary)] text-white" : "bg-slate-100 text-slate-400 group-hover:bg-rose-50 group-hover:text-[var(--primary)]"
                                    )}>
                                        {p.id}
                                    </span>
                                    {p.title}
                                </span>
                                <ChevronRight className={cn("w-3 h-3 transition-transform", activePhaseId === p.id ? "translate-x-0 opacity-100" : "-translate-x-1 opacity-0")} />
                            </button>
                        ))}

                        <div className="mt-1 p-2 rounded-lg bg-slate-50 border border-slate-200 shadow-sm relative overflow-hidden group min-h-[140px] flex flex-col">
                            <div className="absolute top-0 right-0 p-3 opacity-10">
                                <Terminal className="w-10 h-10 text-slate-400" />
                            </div>
                            <div className="relative z-10 flex flex-col h-full">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-2 h-2 rounded-full bg-slate-400 animate-pulse" />
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-600">Consola Forense v4</h4>
                                </div>

                                <ScrollArea className="flex-1 -mx-2 px-2">
                                    <div className="space-y-1.5 font-mono text-[9px] leading-relaxed">
                                        {logs.length > 0 ? (
                                            logs.map((log, i) => (
                                                <div key={i} className={cn(
                                                    "p-1.5 rounded border-l-2 transition-all",
                                                    log.includes('PHASE') ? "bg-rose-50/50 border-[var(--primary)] text-slate-700 font-bold" :
                                                        log.includes('✅') ? "bg-emerald-50/50 border-emerald-500 text-slate-600" :
                                                            log.includes('⚠️') ? "bg-amber-50/50 border-amber-500 text-slate-600" :
                                                                log.includes('❌') ? "bg-red-50/50 border-red-500 text-slate-600" :
                                                                    "bg-white/40 border-slate-300 text-slate-500"
                                                )}>
                                                    <span className="opacity-40 mr-1.5 text-slate-400">[{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                                                    {log}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-20 text-slate-600 opacity-50">
                                                <Database className="w-8 h-8 mb-2" />
                                                <p className="uppercase tracking-widest font-black">Esperando Secuencia...</p>
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col gap-1.5">
                        <div className="bg-white/60 rounded-lg border border-white/20 shadow-xl overflow-hidden flex flex-col flex-1">
                            <div className="px-2.5 py-1.5 border-b border-slate-100 bg-white/40 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <h2 className="text-[16px] font-black text-slate-900 uppercase tracking-tighter italic leading-none">
                                        Fase {activePhaseId}: <span className="text-[var(--primary)] not-italic">{phases[activePhaseId - 1].title}</span>
                                    </h2>
                                    <p className="text-[9px] text-slate-600 font-bold uppercase tracking-[0.1em] mt-0.5 border-l border-slate-200 pl-4">{phases[activePhaseId - 1].description}</p>
                                </div>
                                <Badge className="bg-slate-100 text-slate-500 border-none font-black px-2 h-5 uppercase text-[8px] tracking-widest">Live Node</Badge>
                            </div>

                            <ScrollArea className="flex-1">
                                <div className="p-2.5">
                                    <Tabs value={`fase-${activePhaseId}`} className="w-full">
                                        <TabsContent value="fase-1" className="m-0 space-y-1.5 animate-in fade-in duration-300 slide-in-from-bottom-1">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                                                <div className="space-y-1">
                                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-1">
                                                        <Target className="w-2.5 h-2.5 text-[var(--primary)]" /> Identidad del Producto
                                                    </h3>
                                                    <div className="p-2 rounded bg-white border border-slate-100 shadow-sm">
                                                        {researchData?.product_core?.identity?.definition ? (
                                                            <p className="text-[11px] text-slate-600 leading-tight italic">{researchData.product_core.identity.definition}</p>
                                                        ) : (
                                                            <div className="flex flex-col items-center justify-center py-4 text-center opacity-30">
                                                                <Search className="w-6 h-6 mb-1" />
                                                                <p className="text-[9px] font-black uppercase tracking-widest">Esperando Datos Forenses...</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-1">
                                                        <Sparkles className="w-2.5 h-2.5 text-[var(--primary)]" /> Mecanismo Único
                                                    </h3>
                                                    <div className="p-2 rounded bg-white border border-slate-100 shadow-sm">
                                                        {researchData?.product_core?.solution_mechanism?.unique_method ? (
                                                            <p className="text-[11px] text-slate-600 leading-tight italic">{researchData.product_core.solution_mechanism.unique_method}</p>
                                                        ) : (
                                                            <div className="flex flex-col items-center justify-center py-4 text-center opacity-30">
                                                                <Search className="w-6 h-6 mb-1" />
                                                                <p className="text-[9px] font-black uppercase tracking-widest">Esperando Datos Forenses...</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-900">ADN Forense Completo</h3>
                                                <StructuredDataViewer
                                                    data={researchData?.product_core}
                                                    handleGenerateAngles={async (avatarId) => { await generateAngles(avatarId); }}
                                                    handleGenerateGodTierCopy={async (avatarIdx, angleIdx) => { await generateGodTierCopy(avatarIdx, angleIdx); }}
                                                    handleGenerateV3Copy={async () => { }}
                                                    setSelectedResearch={() => { }}
                                                />
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="fase-2" className="m-0 space-y-8 animate-in fade-in duration-500">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <IntelligenceSources
                                                    amazonUrl={amazonUrl}
                                                    setAmazonUrl={setAmazonUrl}
                                                    onAddAmazon={async () => {
                                                        await addAmazon(amazonUrl);
                                                        setAmazonUrl("");
                                                    }}
                                                    competitorLinks={researchData?.competitorLinks || []}
                                                    newCompetitorUrl={compUrl}
                                                    setNewCompetitorUrl={setCompUrl}
                                                    onAddCompetitor={async () => {
                                                        await addCompetitor(compUrl);
                                                        setCompUrl("");
                                                    }}
                                                    onDeleteCompetitor={deleteCompetitor}
                                                    onSyncDrive={syncDrive}
                                                    isSyncing={loading}
                                                />
                                                <div className="space-y-4">
                                                    <div className="p-4 rounded-xl bg-slate-900 text-white shadow-xl relative overflow-hidden">
                                                        <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--primary)]/20 blur-2xl" />
                                                        <h3 className="text-xs font-black uppercase tracking-widest mb-3 flex items-center gap-2">
                                                            <LineChart className="w-4 h-4 text-[var(--primary)]" /> Market Sophistication
                                                        </h3>
                                                        <div className="space-y-3">
                                                            <div className="flex justify-between items-center bg-white/5 p-2.5 rounded-lg border border-white/10">
                                                                <span className="text-[10px] font-black uppercase tracking-widest text-white">Nivel Schwartz</span>
                                                                <span className="text-base font-black text-[var(--primary)]">L{researchData?.sophistication?.level || 3}</span>
                                                            </div>
                                                            <p className="text-[10px] leading-relaxed text-white opacity-90 italic">
                                                                {researchData?.sophistication?.justification || "Analizando saturación del mercado..."}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Evidencia Minada (VOC + Truth)</h3>
                                                <StructuredDataViewer
                                                    data={researchData?.v3_desires}
                                                    handleGenerateAngles={async (avatarId) => { await generateAngles(avatarId); }}
                                                    handleGenerateGodTierCopy={async (avatarIdx, angleIdx) => { await generateGodTierCopy(avatarIdx, angleIdx); }}
                                                    handleGenerateV3Copy={async () => { }}
                                                    setSelectedResearch={() => { }}
                                                />
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="fase-3" className="m-0 space-y-8 animate-in fade-in duration-500">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                                                {(researchData?.v3_avatars || []).slice(0, 3).map((a: any, i: number) => (
                                                    <div key={i} className="p-3 rounded-xl bg-white border border-slate-100 shadow-sm hover:border-[var(--primary)] transition-all group">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center text-[var(--primary)] group-hover:bg-[var(--primary)] group-hover:text-white transition-all">
                                                                <Users className="w-3.5 h-3.5" />
                                                            </div>
                                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900 truncate">{a.name}</h4>
                                                        </div>
                                                        <p className="text-[9px] text-slate-500 italic line-clamp-2">{a.core_pain}</p>
                                                    </div>
                                                ))}
                                            </div>
                                            <StructuredDataViewer
                                                data={researchData?.v3_avatars}
                                                handleGenerateAngles={async (avatarId) => { await generateAngles(avatarId); }}
                                                handleGenerateGodTierCopy={async (avatarIdx, angleIdx) => { await generateGodTierCopy(avatarIdx, angleIdx); }}
                                                handleGenerateV3Copy={async () => { }}
                                                setSelectedResearch={() => { }}
                                            />
                                        </TabsContent>

                                        <TabsContent value="fase-4" className="m-0 space-y-8 animate-in fade-in duration-500">
                                            <CreativeIterationLab
                                                productId={productId}
                                                onRegenerateAvatars={regenerateAvatars}
                                                onGenerateAngleVariations={generateAngleVariations}
                                                onGenerateCopyVariations={generateCopyVariations}
                                                onGenerateGodTierCopy={generateGodTierCopy}
                                                isLoading={loading}
                                            />
                                        </TabsContent>

                                        <TabsContent value="fase-5" className="m-0 space-y-8 animate-in fade-in duration-500">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
                                                    <div className="absolute top-0 right-0 p-3">
                                                        <LineChart className="w-4 h-4 text-slate-300" />
                                                    </div>
                                                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 mb-4 italic">Economic Strategy</h3>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        {[
                                                            { label: "CPA Limit", val: `€${researchData?.economics?.cpa_limit || 0}`, sub: "70% del Margen" },
                                                            { label: "B-E ROAS", val: `x${researchData?.economics?.break_even_roas || 0}`, sub: "Nivel de Equilibrio" },
                                                            { label: "Unit Cost", val: `€${researchData?.economics?.total_cost || 0}`, sub: "COGS + Envío" },
                                                            { label: "Margen", val: `€${researchData?.economics?.margin_value || 0}`, sub: `${researchData?.economics?.margin_percent || 0}% ROI` }
                                                        ].map((item, i) => (
                                                            <div key={i} className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                                                                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-[var(--primary)] mb-0.5">{item.label}</p>
                                                                <p className="text-sm font-black text-slate-900">{item.val}</p>
                                                                <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{item.sub}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col justify-center text-center">
                                                    <div className="w-10 h-10 bg-slate-50 border border-slate-100 text-[var(--primary)] rounded-lg flex items-center justify-center mx-auto mb-3 shadow-sm">
                                                        <Layout className="w-4 h-4" />
                                                    </div>
                                                    <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-900 mb-2">Funnel Structure</h3>
                                                    <p className="text-[9px] text-slate-500 max-w-[200px] mx-auto mb-4 italic font-medium leading-relaxed">
                                                        Mapeo estructural de landing page y secuencias de retargeting optimizadas.
                                                    </p>
                                                    <Button variant="outline" className="h-8 px-5 rounded-lg border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-[var(--primary)] font-black uppercase text-[9px] tracking-widest transition-all">
                                                        Configurar Funnel
                                                    </Button>
                                                </div>
                                            </div>
                                            <StructuredDataViewer
                                                data={researchData?.offer_strategy}
                                                handleGenerateAngles={async (avatarId) => { await generateAngles(avatarId); }}
                                                handleGenerateGodTierCopy={async (avatarIdx, angleIdx) => { await generateGodTierCopy(avatarIdx, angleIdx); }}
                                                handleGenerateV3Copy={async () => { }}
                                                setSelectedResearch={() => { }}
                                            />
                                        </TabsContent>

                                        <TabsContent value="fase-6" className="m-0 space-y-6 animate-in fade-in duration-500">
                                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                                <div className="w-16 h-16 bg-rose-50 rounded-[1.5rem] flex items-center justify-center mb-4 relative group">
                                                    <div className="absolute inset-0 bg-[var(--primary)]/20 blur-xl group-hover:blur-2xl transition-all" />
                                                    <Rocket className="w-8 h-8 text-[var(--primary)] relative z-10 animate-bounce" />
                                                </div>
                                                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter italic">Ecosistema <span className="text-[var(--primary)] not-italic">Desbloqueado</span></h3>
                                                <p className="text-[10px] text-slate-500 max-w-sm mx-auto mt-2 font-bold uppercase tracking-widest leading-relaxed">
                                                    La investigación ha alcanzado el nivel de madurez necesario para iniciar la fase de ejecución masiva.
                                                </p>

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 w-full max-w-4xl">
                                                    {[
                                                        { icon: MessageSquare, title: "God-Tier Copy", desc: "Claude 3.7 en acción" },
                                                        { icon: Brain, title: "Neural Sync", desc: "Google Drive Master Doc" },
                                                        { icon: Globe, title: "Global Scale", desc: "Multi-idioma listo" }
                                                    ].map((item, i) => (
                                                        <div key={i} className="p-4 rounded-xl bg-white/40 border border-white hover:border-[var(--primary)] transition-all group">
                                                            <item.icon className="w-6 h-6 text-slate-300 group-hover:text-[var(--primary)] transition-colors mb-3 mx-auto" />
                                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900">{item.title}</h4>
                                                            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">{item.desc}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </TabsContent>
                                    </Tabs>
                                </div>
                            </ScrollArea>
                        </div>
                    </div>
                </div>
            </div>
        </PageShell>
    );
}

export default function ProductResearchPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4">
                <div className="w-16 h-16 border-4 border-rose-100 border-t-[var(--primary)] rounded-full animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-[.3em] text-slate-400 animate-pulse">Invocando Inteligencia Forense...</p>
            </div>
        }>
            <ResearchContent />
        </Suspense>
    );
}
