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
        { id: 2, title: "Market Intel", description: "Minería de Evidencia VOC", status: progress.phase > 2 ? 'COMPLETED' : progress.phase === 2 ? 'RUNNING' : 'PENDING' },
        { id: 3, title: "Psychology", description: "Avatares y Creencias", status: progress.phase > 3 ? 'COMPLETED' : progress.phase === 3 ? 'RUNNING' : 'PENDING' },
        { id: 4, title: "Angles", description: "Ingeniería de Hooks", status: progress.phase > 4 ? 'COMPLETED' : progress.phase === 4 ? 'RUNNING' : 'PENDING' },
        { id: 5, title: "Funnel & Offer", description: "Mapeo de Conversión", status: progress.phase > 5 ? 'COMPLETED' : progress.phase === 5 ? 'RUNNING' : 'PENDING' },
        { id: 6, title: "Playground", description: "Iteración Continua", status: progress.phase === 6 && progress.percent === 100 ? 'COMPLETED' : progress.phase === 6 ? 'RUNNING' : 'PENDING' }
    ];

    useEffect(() => {
        if (progress.phase > 0) setActivePhaseId(progress.phase);
    }, [progress.phase]);

    if (!productId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 text-center animate-in fade-in zoom-in duration-700">
                <div className="relative">
                    <div className="absolute -inset-4 bg-[#fb7185]/20 blur-2xl rounded-full" />
                    <div className="relative w-24 h-24 bg-white/80 backdrop-blur-md rounded-3xl border border-rose-100 flex items-center justify-center shadow-2xl shadow-rose-200/50">
                        <Database className="w-12 h-12 text-[#fb7185]" />
                    </div>
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Esperando <span className="text-[#fb7185] not-italic">Contexto</span></h2>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto font-bold uppercase tracking-widest leading-relaxed">Selecciona un activo en el centro de operaciones para iniciar el escaneo forense.</p>
                </div>
                <Button variant="outline" className="h-10 px-8 rounded-2xl border-rose-100 hover:bg-rose-50 text-rose-500 font-black uppercase text-[10px] tracking-widest transition-all">
                    Ver Inventario
                </Button>
            </div>
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
                            <CloudSync className={cn("w-4 h-4 group-hover:text-[#fb7185] transition-colors", loading && "animate-spin")} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Drive</span>
                        </Button>
                        <Button
                            onClick={() => startResearch()}
                            disabled={loading || progress.percent > 0 && progress.percent < 100}
                            className="h-9 px-8 bg-slate-900 hover:bg-black text-white rounded-lg shadow-lg shadow-slate-200 transition-all flex items-center gap-2 group relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-[#fb7185] opacity-0 group-hover:opacity-10 transition-opacity" />
                            <PlayCircle className="w-4 h-4 text-[#fb7185]" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Start</span>
                        </Button>
                    </div>
                }
            />

            <div className="flex flex-col gap-4 p-4 pb-20 max-w-[1600px] mx-auto w-full">

                {/* Progress Bar */}
                <ResearchProgressBar
                    phases={phases}
                    currentPhase={activePhaseId}
                    totalProgress={progress.percent}
                />

                {/* Main Workspace */}
                <div className="flex flex-col xl:flex-row gap-6">
                    {/* Lateral Navigation (Phases) */}
                    <div className="w-full xl:w-80 flex flex-col gap-2">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-2 italic">Navegación Forense</h3>
                        {phases.map((p) => (
                            <button
                                key={p.id}
                                onClick={() => setActivePhaseId(p.id)}
                                className={cn(
                                    "flex items-center justify-between p-4 rounded-2xl transition-all duration-300 text-left group border text-[11px] font-black uppercase tracking-widest",
                                    activePhaseId === p.id
                                        ? "bg-slate-900 text-white border-slate-900 shadow-xl shadow-slate-200 -translate-x-1"
                                        : "bg-white/40 text-slate-500 border-white/50 hover:bg-white hover:border-slate-200"
                                )}
                            >
                                <span className="flex items-center gap-3">
                                    <span className={cn(
                                        "w-6 h-6 rounded-lg flex items-center justify-center text-[10px]",
                                        activePhaseId === p.id ? "bg-[#fb7185] text-white" : "bg-slate-100 text-slate-400 group-hover:bg-rose-50 group-hover:text-[#fb7185]"
                                    )}>
                                        {p.id}
                                    </span>
                                    {p.title}
                                </span>
                                <ChevronRight className={cn("w-4 h-4 transition-transform", activePhaseId === p.id ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0")} />
                            </button>
                        ))}

                        <div className="mt-6 p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden group min-h-[400px] flex flex-col">
                            <div className="absolute top-0 right-0 p-3 opacity-20">
                                <Terminal className="w-10 h-10 text-[#fb7185]" />
                            </div>
                            <div className="relative z-10 flex flex-col h-full">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-2 h-2 rounded-full bg-[#fb7185] animate-pulse" />
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-[#fb7185]">Consola Forense v4</h4>
                                </div>

                                <ScrollArea className="flex-1 -mx-2 px-2">
                                    <div className="space-y-2 font-mono text-[9px] leading-relaxed">
                                        {logs.length > 0 ? (
                                            logs.map((log, i) => (
                                                <div key={i} className={cn(
                                                    "p-1.5 rounded-lg border-l-2 transition-all",
                                                    log.includes('PHASE') ? "bg-rose-500/10 border-[#fb7185] text-rose-100" :
                                                        log.includes('✅') ? "bg-emerald-500/10 border-emerald-500 text-emerald-100" :
                                                            log.includes('⚠️') ? "bg-amber-500/10 border-amber-500 text-amber-100" :
                                                                log.includes('❌') ? "bg-red-500/10 border-red-500 text-red-100" :
                                                                    "bg-white/5 border-slate-700 text-slate-300"
                                                )}>
                                                    <span className="opacity-50 mr-2">[{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
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

                    {/* Content Area */}
                    <div className="flex-1 min-h-[600px] flex flex-col gap-6">
                        <div className="bg-white/60 backdrop-blur-md rounded-3xl border border-white/20 shadow-2xl overflow-hidden flex flex-col flex-1">
                            <div className="px-8 py-6 border-b border-slate-100 bg-white/40 flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">
                                        Fase {activePhaseId}: <span className="text-[#fb7185] not-italic">{phases[activePhaseId - 1].title}</span>
                                    </h2>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">{phases[activePhaseId - 1].description}</p>
                                </div>
                                <Badge className="bg-slate-100 text-slate-500 border-none font-black px-3 h-6 uppercase text-[9px] tracking-widest">Live Node</Badge>
                            </div>

                            <ScrollArea className="flex-1">
                                <div className="p-8">
                                    <Tabs value={`fase-${activePhaseId}`} className="w-full">
                                        <TabsContent value="fase-1" className="m-0 space-y-8 animate-in fade-in duration-500 slide-in-from-bottom-2">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-4">
                                                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                                                        <Target className="w-4 h-4 text-[#fb7185]" /> Identidad del Producto
                                                    </h3>
                                                    <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm min-h-[150px]">
                                                        {researchData?.product_core?.identity?.definition ? (
                                                            <p className="text-xs text-slate-600 leading-relaxed italic">{researchData.product_core.identity.definition}</p>
                                                        ) : (
                                                            <div className="flex flex-col items-center justify-center py-8 text-center opacity-30">
                                                                <Search className="w-8 h-8 mb-2" />
                                                                <p className="text-[10px] font-black uppercase tracking-widest">Esperando Datos Forenses...</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="space-y-4">
                                                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                                                        <Sparkles className="w-4 h-4 text-[#fb7185]" /> Mecanismo Único
                                                    </h3>
                                                    <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm min-h-[150px]">
                                                        {researchData?.product_core?.solution_mechanism?.unique_method ? (
                                                            <p className="text-xs text-slate-600 leading-relaxed italic">{researchData.product_core.solution_mechanism.unique_method}</p>
                                                        ) : (
                                                            <div className="flex flex-col items-center justify-center py-8 text-center opacity-30">
                                                                <Search className="w-8 h-8 mb-2" />
                                                                <p className="text-[10px] font-black uppercase tracking-widest">Esperando Datos Forenses...</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">ADN Forense Completo</h3>
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
                                                <div className="space-y-6">
                                                    <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-2xl relative overflow-hidden">
                                                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#fb7185]/20 blur-2xl" />
                                                        <h3 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                                                            <LineChart className="w-4 h-4 text-[#fb7185]" /> Market Sophistication
                                                        </h3>
                                                        <div className="space-y-4">
                                                            <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/10">
                                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nivel Schwartz</span>
                                                                <span className="text-lg font-black text-[#fb7185]">L{researchData?.sophistication?.level || 3}</span>
                                                            </div>
                                                            <p className="text-[10px] leading-relaxed text-slate-300 italic">
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
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                                {(researchData?.v3_avatars || []).slice(0, 3).map((a: any, i: number) => (
                                                    <div key={i} className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:border-[#fb7185] transition-all group">
                                                        <div className="flex items-center gap-3 mb-3">
                                                            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-[#fb7185] group-hover:bg-[#fb7185] group-hover:text-white transition-all">
                                                                <Users className="w-4 h-4" />
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
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="p-6 rounded-3xl bg-white border border-rose-100 shadow-xl relative overflow-hidden">
                                                    <div className="absolute top-0 right-0 p-4">
                                                        <LineChart className="w-5 h-5 text-rose-200" />
                                                    </div>
                                                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-6 italic">Economic Strategy</h3>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        {[
                                                            { label: "CPA Limit", val: `€${researchData?.economics?.cpa_limit || 0}`, sub: "70% del Margen" },
                                                            { label: "B-E ROAS", val: `x${researchData?.economics?.break_even_roas || 0}`, sub: "Nivel de Equilibrio" },
                                                            { label: "Unit Cost", val: `€${researchData?.economics?.total_cost || 0}`, sub: "COGS + Envío" },
                                                            { label: "Margen", val: `€${researchData?.economics?.margin_value || 0}`, sub: `${researchData?.economics?.margin_percent || 0}% ROI` }
                                                        ].map((item, i) => (
                                                            <div key={i} className="p-4 rounded-2xl bg-rose-50/30 border border-rose-100/50">
                                                                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-rose-400 mb-1">{item.label}</p>
                                                                <p className="text-lg font-black text-slate-900">{item.val}</p>
                                                                <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">{item.sub}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-xl flex flex-col justify-center text-center">
                                                    <div className="w-12 h-12 bg-rose-50 text-[#fb7185] rounded-2xl flex items-center justify-center mx-auto mb-4">
                                                        <Layout className="w-6 h-6" />
                                                    </div>
                                                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 mb-2">Funnel Structure</h3>
                                                    <p className="text-[10px] text-slate-500 max-w-[200px] mx-auto mb-6 italic font-medium leading-relaxed">
                                                        Mapeo estructural de landing page y secuencias de retargeting optimizadas.
                                                    </p>
                                                    <Button variant="outline" className="h-9 px-6 rounded-xl border-rose-100 text-[#fb7185] hover:bg-rose-50 font-black uppercase text-[9px] tracking-widest transition-all">
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

                                        <TabsContent value="fase-6" className="m-0 space-y-8 animate-in fade-in duration-500">
                                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                                <div className="w-20 h-20 bg-rose-50 rounded-[2rem] flex items-center justify-center mb-6 relative group">
                                                    <div className="absolute inset-0 bg-[#fb7185]/20 blur-xl group-hover:blur-2xl transition-all" />
                                                    <Rocket className="w-10 h-10 text-[#fb7185] relative z-10 animate-bounce" />
                                                </div>
                                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">Ecosistema <span className="text-[#fb7185] not-italic">Desbloqueado</span></h3>
                                                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-2 font-bold uppercase tracking-widest leading-relaxed">
                                                    La investigación ha alcanzado el nivel de madurez necesario para iniciar la fase de ejecución masiva.
                                                </p>

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 w-full max-w-4xl">
                                                    {[
                                                        { icon: MessageSquare, title: "God-Tier Copy", desc: "Claude 3.7 en acción" },
                                                        { icon: Brain, title: "Neural Sync", desc: "Google Drive Master Doc" },
                                                        { icon: Globe, title: "Global Scale", desc: "Multi-idioma listo" }
                                                    ].map((item, i) => (
                                                        <div key={i} className="p-6 rounded-3xl bg-white/40 border border-white hover:border-[#fb7185] transition-all group">
                                                            <item.icon className="w-8 h-8 text-slate-300 group-hover:text-[#fb7185] transition-colors mb-4 mx-auto" />
                                                            <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-900">{item.title}</h4>
                                                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">{item.desc}</p>
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

                {/* Float Command Bar (Optional) */}
                <div className="fixed bottom-8 right-8 z-[100] flex items-center gap-3">
                    <Button
                        onClick={() => clearHistory()}
                        className="w-12 h-12 bg-white/80 backdrop-blur-md text-slate-400 hover:text-rose-500 border border-slate-200 rounded-2xl shadow-2xl transition-all"
                    >
                        <Microscope className="w-5 h-5" />
                    </Button>
                    <Button className="h-12 px-8 bg-[#fb7185] hover:bg-rose-500 text-white rounded-2xl shadow-2xl shadow-rose-200 font-black uppercase tracking-widest text-[10px] flex items-center gap-3 group">
                        <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                        Exportar Inteligencia
                    </Button>
                </div>
            </div>
        </PageShell>
    );
}

export default function ProductResearchPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4">
                <div className="w-16 h-16 border-4 border-rose-100 border-t-[#fb7185] rounded-full animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-[.3em] text-slate-400 animate-pulse">Invocando Inteligencia Forense...</p>
            </div>
        }>
            <ResearchContent />
        </Suspense>
    );
}
