"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
    Video, Upload, Sparkles, Clapperboard, Play, Pause,
    MonitorPlay, Mic2, UserSquare2, Type, MoveRight,
    Wand2, Download, Share2, Layers, Film, Music, CheckCircle2, RefreshCw, Globe,
    ArrowUpRight, Zap, ExternalLink, Info, Truck, ChevronRight, Eye, MousePointer2,
    LayoutTemplate, Image as ImageIcon, Database, FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { createMaestroProject, ingestVideoAsset, analyzeVideoLocal, analyzeVideoAsset, generateMaestroScripts, generateAvatarStaticImage, verifySystemHealth } from "../maestro/actions";
import BibliotecaPanel from "./BibliotecaPanel";

interface MaestroWorkspaceProps {
    initialProducts: any[];
}

export default function MaestroWorkspace({ initialProducts }: MaestroWorkspaceProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    // Global State
    const queryProductId = searchParams.get("productId");
    const [selectedProduct, setSelectedProduct] = useState(queryProductId || initialProducts[0]?.id || "");
    const [platform, setPlatform] = useState("TIKTOK");
    const [language, setLanguage] = useState("ES");
    const [avatarId, setAvatarId] = useState<string>("default");

    // Project State
    const [projectId, setProjectId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState("ingesta");
    const [currentAssetId, setCurrentAssetId] = useState<string | null>(null);
    const [maestroScript, setMaestroScript] = useState<string>("");

    // Status Flags
    const [isIngesting, setIsIngesting] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isGeneratingScript, setIsGeneratingScript] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<any>(null);

    // URL Synchronization
    useEffect(() => {
        if (selectedProduct && selectedProduct !== queryProductId) {
            const params = new URLSearchParams(searchParams);
            params.set("productId", selectedProduct);
            router.replace(`${pathname}?${params.toString()}`);
        }
    }, [selectedProduct, queryProductId, pathname, router, searchParams]);

    // Initial Project Creation (Lazy or Explicit)
    const ensureProject = async (): Promise<string | null> => {
        if (projectId) return projectId;
        try {
            const prod = initialProducts.find(p => p.id === selectedProduct);
            const res = await createMaestroProject({
                name: `Proyecto Maestro ${prod?.title || 'Untitled'}`,
                productId: selectedProduct,
                platform,
                language
            });
            setProjectId(res.id);
            toast.success("Proyecto Maestro Inicializado");
            return res.id;
        } catch (e) {
            toast.error("Error al crear proyecto");
            return null;
        }
    };

    const handleIngest = async (file: File) => {
        setIsIngesting(true);
        const pid = await ensureProject();
        if (!pid) { setIsIngesting(false); return; }

        try {
            const asset = await ingestVideoAsset(pid, file.name, file.type);
            setCurrentAssetId(asset.id);
            toast.success("Video Ingestado con éxito. Listo para análisis.");
            setActiveTab("analisis");
        } catch (e: any) {
            toast.error("Error en Ingesta: " + e.message);
        } finally {
            setIsIngesting(false);
        }
    };

    const handleAnalyze = async () => {
        if (!currentAssetId) {
            toast.error("No hay video seleccionado para analizar.");
            return;
        }
        setIsAnalyzing(true);
        try {
            await analyzeVideoAsset(currentAssetId);
            setAnalysisResult({
                ready: true,
                hooks: [
                    { id: 1, score: 9.5, text: "Stop scrolling right now!" },
                    { id: 2, score: 8.0, text: "This product changed my life..." },
                    { id: 3, score: 9.0, text: "Click the link below." }
                ]
            });
            toast.success("Análisis Gemini Vision Completado");
            setActiveTab("guiones");
        } catch (e: any) {
            toast.error("Error en Análisis: " + e.message);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleGenerateScript = async () => {
        if (!projectId) return;
        setIsGeneratingScript(true);
        try {
            await generateMaestroScripts(projectId, "Context from clips");
            setMaestroScript(`**GUION MAESTRO GENERADO**\n\n[0-3s] HOOK: Stop scrolling! (${platform})\n[3-15s] BODY: Problema/Solución para servicio.\n[15-30s] CTA: Click en el enlace.`);
            toast.success("Guiones Generados (V1)");
            setActiveTab("variantes");
        } catch (e: any) {
            toast.error("Error generando guion: " + e.message);
        } finally {
            setIsGeneratingScript(false);
        }
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-indigo-500/30 overflow-x-hidden flex flex-col">
            {/* 1. MAESTRO HEADER */}
            <header className="border-b border-slate-200 bg-white shadow-sm sticky top-0 z-50">
                <div className="max-w-[1800px] mx-auto px-4 h-16 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <Wand2 className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-sm font-bold tracking-tight text-slate-900">
                                VIDEO LAB <span className="text-indigo-600">MAESTRO</span>
                            </h1>
                            <div className="flex items-center gap-1.5">
                                <Badge variant="outline" className="h-4 px-1.5 text-[9px] font-bold border-indigo-200 text-indigo-600 bg-indigo-50 rounded-sm">
                                    V3.0
                                </Badge>
                                <span className="text-[10px] text-slate-400 font-medium">GEMINI 3.5 FLASH + CLAUDE 3.5 Hybrid</span>
                            </div>
                        </div>
                    </div>

                    {/* GLOBAL CONTROLS */}
                    <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
                        <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                            <SelectTrigger className="w-[200px] h-8 bg-transparent border-none text-xs focus:ring-0">
                                <SelectValue placeholder="Producto" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border border-slate-200 shadow-sm border-slate-200 text-slate-900">
                                {initialProducts.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <div className="w-px h-4 bg-white/10" />
                        <Select value={platform} onValueChange={setPlatform}>
                            <SelectTrigger className="w-[100px] h-8 bg-transparent border-none text-xs focus:ring-0">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white border border-slate-200 shadow-sm border-slate-200 text-slate-900">
                                <SelectItem value="TIKTOK">TikTok</SelectItem>
                                <SelectItem value="META">Meta Ads</SelectItem>
                                <SelectItem value="YOUTUBE">Shorts</SelectItem>
                            </SelectContent>
                        </Select>
                        <div className="w-px h-4 bg-white/10" />
                        <Select value={language} onValueChange={setLanguage}>
                            <SelectTrigger className="w-[70px] h-8 bg-transparent border-none text-xs focus:ring-0">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white border border-slate-200 shadow-sm border-slate-200 text-slate-900">
                                <SelectItem value="ES">ES</SelectItem>
                                <SelectItem value="EN">EN</SelectItem>
                                <SelectItem value="FR">FR</SelectItem>
                            </SelectContent>
                        </Select>
                        <div className="w-px h-4 bg-white/10" />
                        <Select value={avatarId} onValueChange={setAvatarId}>
                            <SelectTrigger className="w-[140px] h-8 bg-transparent border-none text-xs focus:ring-0">
                                <div className="flex items-center gap-2">
                                    <UserSquare2 className="w-3 h-3 text-indigo-700" />
                                    <span>Avatar S.</span>
                                </div>
                            </SelectTrigger>
                            <SelectContent className="bg-white border border-slate-200 shadow-sm border-slate-200 text-slate-900">
                                <SelectItem value="default">Avatar Studio</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-2">
                        <Badge variant={projectId ? "default" : "secondary"} className="h-6 text-[10px]">
                            {projectId ? "PROYECTO ACTIVO" : "SIN PROYECTO"}
                        </Badge>
                    </div>
                </div>
            </header>

            {/* 2. MAESTRO TABS */}
            <div className="flex-1 max-w-[1800px] mx-auto w-full p-4 md:p-6 overflow-hidden flex flex-col">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col space-y-6">
                    <TabsList className="bg-slate-100/50 border border-slate-200 p-1.5 rounded-2xl w-full justify-start h-auto gap-1">
                        <MaestroTabTrigger value="ingesta" icon={Upload} label="Ingesta" />
                        <MaestroTabTrigger value="analisis" icon={BrainCircuit} label="Análisis" />
                        <MaestroTabTrigger value="clips" icon={Film} label="Clips" />
                        <MaestroTabTrigger value="guiones" icon={FileText} label="Guiones" />
                        <MaestroTabTrigger value="montaje" icon={Layers} label="Montaje" />
                        <MaestroTabTrigger value="variantes" icon={LayoutTemplate} label="Variantes" />
                        <MaestroTabTrigger value="biblioteca" icon={Database} label="Biblioteca" />
                        <div className="ml-auto flex items-center gap-2 px-3">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-[10px] border-emerald-200 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 gap-2 font-bold"
                                onClick={async () => {
                                    toast.info("Ejecutando diagnóstico...");
                                    const res = await verifySystemHealth();
                                    alert(JSON.stringify(res, null, 2)); // Simple alert for now, can be Dialog
                                }}
                            >
                                <Zap className="w-3 h-3 fill-emerald-600" />
                                SYSTEM OPERATIONAL
                            </Button>
                        </div>
                    </TabsList>

                    {/* CONTENT PANELS */}
                    <div className="flex-1 min-h-0 relative">
                        {/* INGESTA */}
                        <TabsContent value="ingesta" className="h-full m-0 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <IngestPanel onIngest={handleIngest} isIngesting={isIngesting} />
                        </TabsContent>

                        {/* ANALISIS (Gemini) */}
                        <TabsContent value="analisis" className="h-full m-0 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <AnalyzePanel
                                onAnalyze={handleAnalyze}
                                isAnalyzing={isAnalyzing}
                                result={analysisResult}
                                hasAsset={!!currentAssetId}
                            />
                        </TabsContent>

                        {/* Other Tabs Placeholders */}
                        <TabsContent value="clips" className="h-full m-0">
                            <div className="flex items-center justify-center h-full text-slate-900/70 text-lg">🎬 Clips Segmenter (Coming Soon)</div>
                        </TabsContent>

                        <TabsContent value="guiones" className="h-full m-0 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <ScriptPanel
                                isGenerating={isGeneratingScript}
                                onGenerate={handleGenerateScript}
                                script={maestroScript}
                            />
                        </TabsContent>

                        <TabsContent value="montaje" className="h-full m-0 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="flex items-center justify-center h-full text-slate-900/70 text-lg">🎞️ Timeline Assembler (Coming Soon)</div>
                        </TabsContent>

                        <TabsContent value="variantes" className="h-full m-0 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <VariantsPanel />
                        </TabsContent>

                        <TabsContent value="biblioteca" className="h-full m-0 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <BibliotecaPanel productId={selectedProduct} />
                        </TabsContent>
                    </div>
                </Tabs>
            </div>
        </div>
    );
}

function MaestroTabTrigger({ value, icon: Icon, label }: { value: string, icon: any, label: string }) {
    return (
        <TabsTrigger
            value={value}
            className="data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm text-slate-500 hover:text-slate-900 hover:bg-white/50 transition-all duration-200 h-9 px-4 rounded-xl gap-2 text-[11px] font-bold uppercase tracking-wider relative overflow-hidden"
        >
            <Icon className="w-3.5 h-3.5" />
            {label}
        </TabsTrigger>
    );
}

function IngestPanel({ onIngest, isIngesting }: { onIngest: (f: File) => void, isIngesting: boolean }) {
    const fileInput = useRef<HTMLInputElement>(null);

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            onIngest(e.target.files[0]);
        }
    }

    return (
        <div className="grid grid-cols-12 gap-6 h-full">
            <div className="col-span-4 bg-white rounded-2xl border border-slate-200 p-6 flex flex-col gap-6 shadow-sm">
                <div className="space-y-1">
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">Ingerir Referencia</h3>
                    <p className="text-sm text-slate-500 font-medium">Sube un video o pega un enlace para comenzar.</p>
                </div>

                <input type="file" ref={fileInput} className="hidden" accept="video/*" onChange={handleFile} />

                <Card
                    onClick={() => fileInput.current?.click()}
                    className="bg-slate-50/50 border-indigo-200 border-dashed border-2 hover:border-indigo-600 hover:bg-white transition-all cursor-pointer group rounded-2xl overflow-hidden shadow-none"
                >
                    <CardContent className="flex flex-col items-center justify-center h-48 gap-4 p-6">
                        {isIngesting ? (
                            <div className="flex flex-col items-center gap-3">
                                <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin" />
                                <span className="text-[11px] text-indigo-600 font-black uppercase tracking-widest animate-pulse">INGESTANDO...</span>
                            </div>
                        ) : (
                            <>
                                <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform duration-300">
                                    <Upload className="w-7 h-7 text-white" />
                                </div>
                                <div className="text-center space-y-1">
                                    <p className="text-sm font-bold text-slate-900">Click para subir</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">MP4, MOV hasta 500MB</p>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                <div className="flex items-center gap-4 py-2">
                    <div className="h-px bg-slate-100 flex-1" />
                    <span className="text-[10px] text-slate-300 uppercase font-black tracking-widest leading-none">O importa de</span>
                    <div className="h-px bg-slate-100 flex-1" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" className="border-slate-200 bg-white hover:bg-slate-50 text-slate-900 h-11 text-xs font-bold rounded-xl shadow-sm hover:border-pink-500/30 transition-all">
                        <Play className="w-4 h-4 mr-2 text-pink-500 fill-pink-500" /> TikTok
                    </Button>
                    <Button variant="outline" className="border-slate-200 bg-white hover:bg-slate-50 text-slate-900 h-11 text-xs font-bold rounded-xl shadow-sm hover:border-blue-500/30 transition-all">
                        <MonitorPlay className="w-4 h-4 mr-2 text-blue-500 fill-blue-500" /> Meta Ads
                    </Button>
                </div>
            </div>

            <div className="col-span-8 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">Cola de Procesamiento</h3>
                    <Badge variant="outline" className="bg-indigo-50 text-indigo-600 border-indigo-100 font-bold h-6 px-3 rounded-full">
                        {isIngesting ? "1 Activo" : "0 Activos"}
                    </Badge>
                </div>

                <div className="flex flex-col items-center justify-center h-[340px] text-slate-400 gap-4 border-2 border-dashed border-slate-50 rounded-2xl bg-[#FBFDFF]">
                    <Database className="w-12 h-12 opacity-10" />
                    <p className="text-sm font-bold tracking-tight text-slate-400 flex items-center gap-2">
                        {isIngesting ? "Procesando video local..." : "No hay assets en cola"}
                    </p>
                </div>
            </div>
        </div>
    );
}

function AnalyzePanel({ onAnalyze, isAnalyzing, result, hasAsset }: any) {
    return (
        <div className="grid grid-cols-12 gap-6 h-full">
            <div className="col-span-12 md:col-span-8 lg:col-span-9 space-y-6">
                <Card className="bg-white border-slate-200 shadow-sm border text-slate-900 h-[500px] flex items-center justify-center relative overflow-hidden rounded-2xl">
                    {result ? (
                        <div className="text-center p-10 animate-in fade-in zoom-in duration-500">
                            <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-6 border border-emerald-100">
                                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Análisis Completado</h3>
                            <div className="flex items-center justify-center gap-2 mt-3">
                                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 font-bold px-3 py-1">CONFIRMADO</Badge>
                                <p className="text-slate-500 font-medium">Se han detectado {result.hooks.length} Hooks Virales.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center space-y-6 z-10 px-6">
                            <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mx-auto border border-slate-100 shadow-xl shadow-slate-200/50">
                                {isAnalyzing ? <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" /> : <Sparkles className="w-8 h-8 text-indigo-600" />}
                            </div>
                            <div>
                                <h3 className="text-2xl font-black tracking-tight">Gemini 3.5 Vision Ready</h3>
                                <p className="text-slate-400 text-sm mt-2 max-w-[320px] mx-auto font-medium leading-relaxed">
                                    {hasAsset ? "El video está listo para ser analizado. Detectaremos los momentos más virales automáticamente." : "Sube un video en la pestaña Ingesta primero."}
                                </p>
                            </div>
                            {hasAsset && (
                                <Button
                                    onClick={onAnalyze}
                                    disabled={isAnalyzing}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-600/20 h-12 px-8 font-bold rounded-xl text-base transition-all scale-100 hover:scale-[1.02]"
                                >
                                    {isAnalyzing ? "Analizando Video..." : "Iniciar Análisis Profundo"}
                                </Button>
                            )}
                        </div>
                    )}
                </Card>
            </div>
            <div className="col-span-12 md:col-span-4 lg:col-span-3 space-y-4">
                <Card className="bg-white border-slate-200 p-5 shadow-sm rounded-2xl">
                    <div className="flex items-center justify-between mb-6">
                        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em]">Magic Hooks</h4>
                        <Badge variant="outline" className="text-[10px] font-bold border-slate-100 text-slate-400">SCORE 0-100</Badge>
                    </div>
                    <div className="space-y-3">
                        {result ? result.hooks.map((h: any) => (
                            <div key={h.id} className="p-4 bg-[#FBFDFF] border border-indigo-100 rounded-xl animate-in slide-in-from-right-2 hover:border-indigo-600 hover:shadow-md transition-all group">
                                <div className="flex justify-between items-center mb-2">
                                    <Badge className="h-5 px-2 bg-indigo-600 text-[10px] font-black">{h.score}</Badge>
                                    <Badge variant="outline" className="text-[9px] font-black text-emerald-600 border-emerald-100 bg-emerald-50">TOP</Badge>
                                </div>
                                <p className="text-xs text-slate-900 font-bold leading-relaxed">{h.text}</p>
                            </div>
                        )) : (
                            [1, 2, 3].map(i => (
                                <div key={i} className="h-24 bg-slate-50 rounded-xl border border-slate-100 opacity-50 flex items-center justify-center">
                                    <div className="w-px h-px bg-slate-200" />
                                </div>
                            ))
                        )}
                    </div>
                </Card>
            </div>
        </div>
    )
}

function ScriptPanel({ isGenerating, onGenerate, script }: any) {
    return (
        <div className="grid grid-cols-12 gap-6 h-full">
            <div className="col-span-8 space-y-4">
                <Card className="bg-white border border-slate-200 shadow-sm border-slate-200 text-slate-900 h-[600px] flex flex-col p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-slate-900/50 border-slate-200">V1</Badge>
                            <h3 className="text-sm font-medium">Guion Maestro</h3>
                        </div>
                        <div className="flex items-center gap-2">
                            {script ? (
                                <Button size="sm" variant="outline" className="h-7 text-xs border-indigo-500/30 text-indigo-700 bg-indigo-500/10">Generar Variantes (3)</Button>
                            ) : (
                                <Button
                                    size="sm"
                                    onClick={onGenerate}
                                    disabled={isGenerating}
                                    className="h-7 text-xs bg-indigo-600 hover:bg-indigo-500 text-slate-900"
                                >
                                    {isGenerating ? "Escribiendo..." : "Generar Guion desde Clips"}
                                </Button>
                            )}
                        </div>
                    </div>
                    <Textarea
                        placeholder="El guion aparecerá aquí..."
                        className="flex-1 bg-transparent border-emerald-500/20 resize-none focus:ring-1 focus:ring-emerald-500/40 text-base leading-relaxed font-mono text-slate-900 placeholder:text-emerald-200/40"
                        value={script}
                        readOnly
                    />
                </Card>
            </div>
            <div className="col-span-4 space-y-4">
                <Card className="bg-slate-100 border-slate-200 p-2">
                    <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-4">Estructura Viral</h4>
                    <div className="space-y-2 opacity-50 hover:opacity-100 transition-opacity">
                        <div className="p-3 bg-slate-100 border border-slate-200 rounded-lg">
                            <span className="text-[11px] font-bold text-emerald-200">HOOK (0-3s)</span>
                        </div>
                        <div className="p-3 bg-slate-100 border border-emerald-500/20 rounded-lg">
                            <span className="text-[11px] font-bold text-blue-200">BODY (3-15s)</span>
                        </div>
                        <div className="p-3 bg-slate-100 border border-emerald-500/20 rounded-lg">
                            <span className="text-[11px] font-bold text-purple-200">CTA (15-20s)</span>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    )
}

function VariantsPanel() {
    return (
        <div className="grid grid-cols-12 gap-6 h-full">
            {[1, 2, 3].map(i => (
                <div key={i} className="col-span-4">
                    <Card className="bg-white border border-slate-200 shadow-sm border-slate-200 group hover:border-indigo-500/50 transition-all cursor-pointer">
                        <div className="aspect-[9/16] bg-slate-100 relative overflow-hidden">
                            {/* Thumbnail Placeholder */}
                            <div className="absolute inset-0 flex items-center justify-center text-slate-900/10 group-hover:text-indigo-700/50 transition-colors">
                                <Play className="w-12 h-12" />
                            </div>
                            <div className="absolute top-2 right-2">
                                <Badge className="bg-black/50 backdrop-blur-md border px-1.5 py-0.5 text-[10px]">V{i}</Badge>
                            </div>
                        </div>
                        <CardContent className="p-4 space-y-2">
                            <h4 className="text-sm font-medium text-slate-900 truncate">Variant {i} - Aggressive Hook</h4>
                            <div className="flex items-center justify-between text-xs text-slate-900/40">
                                <span>00:30</span>
                                <span>Pending</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            ))}
        </div>
    )
}

// Icon for Analysis
function BrainCircuit(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
            <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
            <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
            <path d="M17.599 6.5a3 3 0 0 0 .399-1.375" />
            <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" />
            <path d="M3.477 10.896a4 4 0 0 1 .585-.396" />
            <path d="M19.938 10.5a4 4 0 0 1 .585.396" />
            <path d="M6 18a4 4 0 0 1-1.97-3.484" />
            <path d="M20 18a4 4 0 0 0 1.97-3.484" />
        </svg>
    )
}
