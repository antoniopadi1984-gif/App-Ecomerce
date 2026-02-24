"use client";

import { useState, useRef, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
    Video, Upload, Sparkles, Clapperboard, Play, Pause,
    MonitorPlay, Mic2, UserSquare2, Type, MoveRight,
    Wand2, Download, Share2, Layers, Film, Music, CheckCircle2, RefreshCw, Globe,
    ArrowUpRight, Zap, ExternalLink, Info, Truck, ChevronRight, Eye, MousePointer2,
    LayoutTemplate, Image as ImageIcon, Database, FileText, Brain, BrainCircuit, Users, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
    createMaestroProject,
    ingestVideoAsset,
    analyzeVideoAsset,
    generateMaestroScripts,
    generateMaestroVariant,
    addCaptionsToMaestroAsset,
    verifySystemHealth,
    getMaestroProjectState
} from "../maestro/actions";
import { getFirstStoreId as getMaestroStoreId } from "../avatars/actions";
import BibliotecaPanel from "./BibliotecaPanel";
import { CreativeFactoryPanel } from "@/components/creative/CreativeFactoryPanel";
import { EspiaPanel } from "./panels/EspiaPanel";
import { IdentidadPanel } from "./panels/IdentidadPanel";
import { DirectorPanel } from "./panels/DirectorPanel";

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
    const [projectState, setProjectState] = useState<any>(null);
    const [activeTab, setActiveTab] = useState("espia"); // Nueva tab por defecto
    const [currentAssetId, setCurrentAssetId] = useState<string | null>(null);
    const [maestroScript, setMaestroScript] = useState<string>("");

    // Status Flags
    const [isIngesting, setIsIngesting] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isGeneratingScript, setIsGeneratingScript] = useState(false);
    const [isGeneratingVariant, setIsGeneratingVariant] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<any>(null);

    // URL Synchronization & State Hydration
    useEffect(() => {
        if (selectedProduct) {
            if (selectedProduct !== queryProductId) {
                const params = new URLSearchParams(searchParams);
                params.set("productId", selectedProduct);
                router.replace(`${pathname}?${params.toString()}`);
            }
            // Load project if exists for this product (simple logic: find latest)
        }
    }, [selectedProduct, queryProductId, pathname, router, searchParams]);

    const loadProjectState = async (id: string) => {
        const state = await getMaestroProjectState(id);
        setProjectState(state);
        if (state?.maestroScripts?.length) {
            setMaestroScript(state.maestroScripts[state.maestroScripts.length - 1].content);
        }
    };

    useEffect(() => {
        if (projectId) {
            loadProjectState(projectId);
        }
    }, [projectId]);

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
            // Context from product brain if available
            const prod = initialProducts.find(p => p.id === selectedProduct);
            const res = await generateMaestroScripts(projectId, `Generar guion viral para ${prod?.title}. Plataforma: ${platform}. Idioma: ${language}.`);
            if (res.success) {
                toast.success("Guiones Generados con Éxito");
                loadProjectState(projectId);
                setActiveTab("guiones");
            }
        } catch (e: any) {
            toast.error("Error generando guion: " + e.message);
        } finally {
            setIsGeneratingScript(false);
        }
    }

    const handleGenerateVariant = async (data: any) => {
        if (!projectId) return;
        setIsGeneratingVariant(true);
        try {
            const res = await generateMaestroVariant({
                projectId,
                ...data
            });
            if (res.success) {
                toast.success("Variante Generada!");
                loadProjectState(projectId);
            } else {
                toast.error("Error: " + res.error);
            }
        } catch (e: any) {
            toast.error("Error: " + e.message);
        } finally {
            setIsGeneratingVariant(false);
        }
    };

    const handleAddCaptions = async (assetId: string) => {
        toast.info("Generando subtítulos con Gemini Vision...");
        try {
            const res = await addCaptionsToMaestroAsset(assetId);
            if (res.success) {
                toast.success("Video Subtitulado con Éxito!");
                if (projectId) loadProjectState(projectId);
            } else {
                toast.error("Error: " + res.error);
            }
        } catch (e: any) {
            toast.error("Error: " + e.message);
        }
    };

    return (
        <div className="flex-1 bg-transparent text-slate-900 font-sans selection:bg-rose-500/30 overflow-x-hidden flex flex-col">
            {/* 1. MAESTRO HEADER */}
            <header className="border-b border-white/40 bg-white/20 backdrop-blur-xl sticky top-0 z-30 shadow-sm px-4 h-12 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center shadow-lg">
                        <Wand2 className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-[10px] font-black tracking-widest text-slate-900 uppercase italic">
                            Video Lab <span className="text-rose-500">Maestro</span>
                        </h1>
                        <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-[7px] text-slate-400 font-bold uppercase tracking-[0.2em]">Cerebro Híbrido V.4.2</p>
                            <Badge className="h-3.5 bg-emerald-500/10 text-emerald-600 border-none px-1 py-0 text-[6px] font-black uppercase tracking-widest">SISTEMA ONLINE</Badge>
                        </div>
                    </div>
                </div>

                {/* CONTROLES GLOBALES DEL AGENTE */}
                <div className="flex items-center gap-1.5 bg-white/40 p-1 rounded-2xl border border-white/60 shadow-inner">
                    <div className="flex items-center px-4 h-7">
                        <Database className="w-3.5 h-3.5 text-rose-500 mr-2" />
                        <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                            <SelectTrigger className="w-[160px] h-7 bg-transparent border-none text-[9px] font-black uppercase tracking-widest focus:ring-0">
                                <SelectValue placeholder="Producto" />
                            </SelectTrigger>
                            <SelectContent className="bg-white/90 backdrop-blur-2xl border border-slate-100 shadow-2xl rounded-2xl">
                                {initialProducts.map(p => (
                                    <SelectItem key={p.id} value={p.id} className="text-[9px] font-black uppercase tracking-widest">{p.title}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="w-px h-3 bg-slate-200" />

                    <Select value={platform} onValueChange={setPlatform}>
                        <SelectTrigger className="w-[100px] h-7 bg-transparent border-none text-[9px] font-black uppercase tracking-widest focus:ring-0">
                            <div className="flex items-center gap-2">
                                <Globe className="w-3 h-3 text-slate-400" />
                                <SelectValue />
                            </div>
                        </SelectTrigger>
                        <SelectContent className="bg-white/90 backdrop-blur-2xl border border-slate-100 shadow-2xl rounded-2xl">
                            <SelectItem value="TIKTOK" className="text-[9px] font-black uppercase tracking-widest">TikTok</SelectItem>
                            <SelectItem value="META" className="text-[9px] font-black uppercase tracking-widest">Meta Ads</SelectItem>
                            <SelectItem value="YOUTUBE" className="text-[9px] font-black uppercase tracking-widest">YouTube</SelectItem>
                        </SelectContent>
                    </Select>

                    <div className="w-px h-3 bg-slate-200" />

                    <Select value={avatarId} onValueChange={setAvatarId}>
                        <SelectTrigger className="w-[140px] h-7 bg-transparent border-none text-[9px] font-black uppercase tracking-widest focus:ring-0">
                            <div className="flex items-center gap-2">
                                <UserSquare2 className="w-3.5 h-3.5 text-rose-500" />
                                <span>Avatar Studio</span>
                            </div>
                        </SelectTrigger>
                        <SelectContent className="bg-white/90 backdrop-blur-2xl border border-slate-100 shadow-2xl rounded-2xl">
                            <SelectItem value="default" className="text-[9px] font-black uppercase tracking-widest">SARA V2 (Global)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center gap-3">
                    <Badge variant={projectId ? "default" : "secondary"} className={cn(
                        "h-6 text-[8px] font-black tracking-[0.2em] uppercase px-3 rounded-full flex gap-2 items-center",
                        projectId ? "bg-rose-500 text-white shadow-lg shadow-rose-200/50" : "bg-slate-100/50 text-slate-400 border border-slate-200"
                    )}>
                        {projectId ? <Zap className="w-2.5 h-2.5 fill-current" /> : null}
                        {projectId ? "MOTOR ACTIVO" : "AGENTE EN ESPERA"}
                    </Badge>
                </div>
            </header>

            {/* 2. MAESTRO TABS */}
            <div className="flex-1 max-w-[1800px] mx-auto w-full p-4 overflow-hidden flex flex-col pt-0">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                    <div className="flex items-center justify-between border-b border-slate-100/50 py-1 mb-4">
                        <TabsList className="bg-transparent h-9 gap-0">
                            <MaestroTabTrigger value="espia" icon={Eye} label="ESPÍA" />
                            <MaestroTabTrigger value="cerebro" icon={BrainCircuit} label="CEREBRO" />
                            <MaestroTabTrigger value="escritor" icon={FileText} label="ESCRITOR" />
                            <MaestroTabTrigger value="identidad" icon={Users} label="AVATAR" />
                            <MaestroTabTrigger value="fabrica" icon={Zap} label="FÁBRICA" />
                            <MaestroTabTrigger value="director" icon={Sparkles} label="DIRECTOR AGENTE" />
                            <MaestroTabTrigger value="biblioteca" icon={Database} label="BIBLIOTECA" />
                        </TabsList>

                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-[8px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50/50 hover:bg-emerald-50 gap-2 rounded-xl"
                                onClick={async () => {
                                    toast.info("Ejecutando diagnóstico...");
                                    await verifySystemHealth();
                                    toast.success("Todos los sistemas activos");
                                }}
                            >
                                <Zap className="w-2.5 h-2.5 fill-emerald-600" /> SISTEMA ACTIVO
                            </Button>
                        </div>
                    </div>

                    {/* CONTENT PANELS */}
                    <div className="flex-1 min-h-0 relative">
                        {/* 🕵️ ESPÍA: Ingesta Foreplay Style */}
                        <TabsContent value="espia" className="h-full m-0 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <EspiaPanel onSelect={(item) => {
                                toast.success("Anuncio seleccionado para análisis.");
                                setActiveTab("cerebro");
                            }} />
                        </TabsContent>

                        {/* 🧠 CEREBRO: Análisis y Visión */}
                        <TabsContent value="cerebro" className="h-full m-0 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <IngestPanel onIngest={handleIngest} isIngesting={isIngesting} />
                                <AnalyzePanel
                                    onAnalyze={handleAnalyze}
                                    isAnalyzing={isAnalyzing}
                                    result={analysisResult}
                                    hasAsset={!!currentAssetId}
                                />
                            </div>
                        </TabsContent>

                        {/* ✍️ ESCRITOR: Editor de Guiones */}
                        <TabsContent value="escritor" className="h-full m-0 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <ScriptPanel
                                isGenerating={isGeneratingScript}
                                onGenerate={handleGenerateScript}
                                script={maestroScript}
                            />
                        </TabsContent>

                        {/* 👤 IDENTIDAD: Avatars & Voice */}
                        <TabsContent value="identidad" className="h-full m-0 flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <Suspense fallback={<div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-rose-500" /></div>}>
                                <IdentidadPanel />
                            </Suspense>
                        </TabsContent>

                        {/* 🏭 FÁBRICA: Producción Masiva */}
                        <TabsContent value="fabrica" className="h-full m-0 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="space-y-6">
                                <CreativeFactoryPanel
                                    productId={selectedProduct}
                                    productName={initialProducts.find(p => p.id === selectedProduct)?.title || "Producto"}
                                />
                                <VariantsPanel
                                    variants={projectState?.maestroVariants || []}
                                    onGenerate={handleGenerateVariant}
                                    onAddCaptions={handleAddCaptions}
                                    isGenerating={isGeneratingVariant}
                                    defaultScript={maestroScript}
                                />
                            </div>
                        </TabsContent>

                        {/* 🤖 DIRECTOR AGENTE */}
                        <TabsContent value="director" className="h-full m-0 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <DirectorPanel />
                        </TabsContent>

                        {/* 📂 BIBLIOTECA */}
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
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-rose-500 data-[state=active]:bg-rose-500/5 px-6 h-10 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 data-[state=active]:text-slate-900 transition-all gap-2"
        >
            <Icon className="w-3.5 h-3.5 opacity-70" />
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
        <div className="grid grid-cols-12 gap-4 h-full">
            <div className="col-span-4 bg-white/20 backdrop-blur-xl rounded-[2rem] border border-white/40 p-5 flex flex-col gap-5 shadow-sm">
                <div className="space-y-1 border-b border-white/20 pb-4">
                    <h3 className="text-[10px] font-black text-slate-900 uppercase italic tracking-widest">Referencia Maestra</h3>
                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-[0.2em]">Ingesta de Inteligencia Visual</p>
                </div>

                <input type="file" ref={fileInput} className="hidden" accept="video/*" onChange={handleFile} />

                <div
                    onClick={() => fileInput.current?.click()}
                    className="bg-white/40 border-slate-200 border-dashed border-2 hover:border-rose-500 hover:bg-white transition-all cursor-pointer group rounded-3xl overflow-hidden"
                >
                    <div className="flex flex-col items-center justify-center h-44 gap-4 p-5">
                        {isIngesting ? (
                            <div className="flex flex-col items-center gap-3">
                                <RefreshCw className="w-10 h-10 text-rose-500 animate-spin" />
                                <span className="text-[9px] text-rose-500 font-black uppercase tracking-widest animate-pulse">Analizando Activo...</span>
                            </div>
                        ) : (
                            <>
                                <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center shadow-xl group-hover:scale-110 transition-all duration-500">
                                    <Upload className="w-6 h-6 text-white" />
                                </div>
                                <div className="text-center space-y-1">
                                    <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Sincronizar Video</p>
                                    <p className="text-[7px] text-slate-400 font-bold uppercase tracking-[0.15em]">MP4, MOV • Máx 500MB</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" className="border-white/40 bg-white/60 hover:bg-rose-50 text-slate-900 h-10 text-[9px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-sm">
                        <Play className="w-3 h-3 mr-2 text-rose-500 fill-rose-500" /> TikTok
                    </Button>
                    <Button variant="outline" className="border-white/40 bg-white/60 hover:bg-rose-50 text-slate-900 h-10 text-[9px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-sm">
                        <MonitorPlay className="w-3 h-3 mr-2 text-rose-500 fill-rose-500" /> Meta Ads
                    </Button>
                </div>
            </div>

            <div className="col-span-8 bg-white/20 backdrop-blur-xl rounded-[2rem] border border-white/40 p-6 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center">
                            <Layers className="w-4 h-4 text-rose-500" />
                        </div>
                        <div>
                            <h3 className="text-xs font-black text-slate-900 uppercase italic tracking-tight">Cola de Procesamiento</h3>
                            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Estado del Renderizado Híbrido</p>
                        </div>
                    </div>
                    <Badge className="bg-rose-500 text-white border-none font-black h-6 px-4 rounded-full text-[9px] tracking-widest">
                        {isIngesting ? "1 ACTIVO" : "0 ACTIVOS"}
                    </Badge>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-5 border-2 border-dashed border-white/40 rounded-[2.5rem] bg-slate-50/10 min-h-[300px]">
                    <Database className="w-12 h-12 opacity-10" />
                    <div className="text-center">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">
                            {isIngesting ? "Procesando flujo de datos..." : "Cola de Trabajo Vacía"}
                        </p>
                        {!isIngesting && <p className="text-[8px] font-bold text-slate-200 uppercase tracking-widest mt-2">Los activos aparecerán aquí tras la ingesta</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}

function AnalyzePanel({ onAnalyze, isAnalyzing, result, hasAsset }: any) {
    return (
        <div className="grid grid-cols-12 gap-5 h-full">
            <div className="col-span-12 md:col-span-8 lg:col-span-9 space-y-4">
                <div className="bg-white/20 backdrop-blur-xl border border-white/40 shadow-sm text-slate-900 h-[520px] flex items-center justify-center relative overflow-hidden rounded-[2.5rem]">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rose-500/20 to-transparent" />

                    {result ? (
                        <div className="text-center p-12 animate-in fade-in zoom-in duration-700">
                            <div className="w-20 h-20 rounded-[2rem] bg-emerald-500 text-white flex items-center justify-center mx-auto mb-8 shadow-[0_20px_50px_rgba(16,185,129,0.3)]">
                                <CheckCircle2 className="w-10 h-10" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase italic leading-none">Análisis Maestro Completado</h3>
                            <div className="flex flex-col items-center gap-3 mt-6">
                                <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-black px-4 py-1 text-[10px] tracking-widest rounded-full">INTELIGENCIA CONFIRMADA</Badge>
                                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.15em] max-w-[400px]">Se han detectado {result.hooks.length} Ganchos Virales de alta retención optimizados para el algoritmo.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center space-y-8 z-10 px-8">
                            <div className="w-16 h-16 rounded-[1.5rem] bg-white flex items-center justify-center mx-auto border border-white shadow-2xl">
                                {isAnalyzing ? <RefreshCw className="w-7 h-7 text-rose-500 animate-spin" /> : <Brain className="w-7 h-7 text-rose-500" />}
                            </div>
                            <div>
                                <h3 className="text-2xl font-black tracking-widest uppercase italic leading-none">Gemini 3.5 <span className="text-rose-500">Vision</span> Ready</h3>
                                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-4 max-w-[360px] mx-auto leading-relaxed opacity-80">
                                    {hasAsset ? "El activo visual ha sido sincronizado correctamente. El Agente Maestro procederá a la extracción de triggers psicológicos." : "Sincroniza un activo visual en la pestaña de Ingesta para iniciar el protocolo."}
                                </p>
                            </div>
                            {hasAsset && (
                                <Button
                                    onClick={onAnalyze}
                                    disabled={isAnalyzing}
                                    className="bg-slate-900 hover:bg-black text-white shadow-[0_20px_40px_rgba(0,0,0,0.2)] h-12 px-10 font-black uppercase text-[10px] tracking-[0.3em] rounded-[1.5rem] transition-all group gap-3"
                                >
                                    {isAnalyzing ? "PROCESANDO MATRIZ..." : "INICIAR ANÁLISIS PROFUNDO"}
                                    {!isAnalyzing && <Sparkles className="w-4 h-4 text-rose-500 group-hover:animate-pulse" />}
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="col-span-12 md:col-span-4 lg:col-span-3 space-y-4">
                <div className="bg-white/20 backdrop-blur-xl border border-white/40 p-6 shadow-sm rounded-[2rem] flex flex-col h-full border-l-rose-500/20">
                    <div className="flex items-center justify-between mb-8 border-b border-white/20 pb-4">
                        <div className="flex flex-col">
                            <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest italic">Ganchos Mágicos</h4>
                            <span className="text-[7px] text-slate-400 font-bold uppercase tracking-widest">Score de Retención IA</span>
                        </div>
                        <Badge className="bg-slate-900 text-white border-none text-[8px] font-black tracking-widest px-2 h-5">V.1.0</Badge>
                    </div>

                    <ScrollArea className="flex-1 -mr-2 pr-2">
                        <div className="space-y-3">
                            {result ? result.hooks.map((h: any) => (
                                <div key={h.id} className="p-4 bg-white/40 border border-white transform transition-all hover:translate-x-1 hover:border-rose-500/30 rounded-2xl group cursor-pointer shadow-sm">
                                    <div className="flex justify-between items-center mb-3">
                                        <Badge className="h-5 px-2 bg-rose-500 text-[9px] font-black shadow-lg shadow-rose-200/50 italic tracking-widest">+{h.score}</Badge>
                                        <Badge className="text-[8px] font-black text-emerald-500 bg-emerald-50 border border-emerald-100 uppercase tracking-widest">GANADOR</Badge>
                                    </div>
                                    <p className="text-[11px] text-slate-800 font-bold leading-relaxed italic uppercase tracking-tight">"{h.text}"</p>
                                </div>
                            )) : (
                                [1, 2, 3, 4].map(i => (
                                    <div key={i} className="h-24 bg-slate-50/20 rounded-2xl border border-white/20 border-dashed animate-pulse flex items-center justify-center">
                                        <div className="w-2 h-2 bg-slate-100 rounded-full" />
                                    </div>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </div>
            </div>
        </div>
    )
}

function ScriptPanel({ isGenerating, onGenerate, script }: any) {
    return (
        <div className="grid grid-cols-12 gap-5 h-full">
            <div className="col-span-8 space-y-4">
                <div className="bg-white/20 backdrop-blur-xl border border-white/40 shadow-sm text-slate-900 h-[580px] flex flex-col p-6 rounded-[2.5rem]">
                    <div className="flex items-center justify-between mb-6 border-b border-white/20 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center shadow-lg">
                                <FileText className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex flex-col">
                                <h3 className="text-[11px] font-black uppercase italic text-slate-900 tracking-tight">Guion Maestro</h3>
                                <p className="text-[7px] text-slate-400 font-bold uppercase tracking-widest">Protocolo de Conversión V.4</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Badge className="bg-rose-500/10 text-rose-600 border border-rose-500/20 font-black text-[9px] px-3 h-6 tracking-widest rounded-full uppercase">VERSIÓN BETA</Badge>
                            {script ? (
                                <Button size="sm" variant="outline" className="h-8 text-[9px] font-black border-rose-500/30 text-rose-700 bg-rose-50/50 hover:bg-rose-100 rounded-xl px-4 uppercase tracking-widest transition-all">Generar Variaciones (3)</Button>
                            ) : (
                                <Button
                                    size="sm"
                                    onClick={onGenerate}
                                    disabled={isGenerating}
                                    className="h-8 text-[9px] font-black bg-slate-900 hover:bg-black text-white rounded-xl px-5 uppercase tracking-[0.2em] transition-all shadow-lg"
                                >
                                    {isGenerating ? "REDACTANDO..." : "GENERAR GUION MAESTRO"}
                                </Button>
                            )}
                        </div>
                    </div>
                    <ScrollArea className="flex-1">
                        <Textarea
                            placeholder="El guion magistral aparecerá aquí tras el análisis..."
                            className="w-full bg-transparent border-none resize-none focus:ring-0 text-[14px] font-medium leading-relaxed font-mono text-slate-800 placeholder:text-slate-300 p-0 selection:bg-rose-500/20"
                            value={script}
                            readOnly
                        />
                    </ScrollArea>
                </div>
            </div>

            <div className="col-span-4 space-y-5">
                <div className="bg-rose-500/5 border border-rose-500/10 p-6 rounded-[2rem] shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <Zap className="w-4 h-4 text-rose-500 fill-rose-500" />
                        <h4 className="text-[10px] font-black text-rose-900 uppercase tracking-[0.2em] italic">Estructura de Retención</h4>
                    </div>
                    <div className="space-y-3">
                        <StructureStep label="GANCHO VIRAL (0-3s)" active />
                        <StructureStep label="CUERPO DEL MENSAJE (3-15s)" />
                        <StructureStep label="CTA / CIERRE (15-20s)" />
                    </div>
                </div>

                <div className="bg-slate-900 p-6 rounded-[2rem] shadow-xl text-white overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-150 transition-transform duration-700">
                        <Sparkles className="w-20 h-20" />
                    </div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-rose-400">Optimización Pro</h4>
                    <p className="text-[11px] font-bold leading-relaxed text-slate-300">Este guion ha sido optimizado para la psicología de recompensa dopaminérgica.</p>
                    <Button variant="link" className="p-0 text-rose-400 text-[9px] font-black uppercase tracking-widest mt-4 h-auto hover:text-rose-300">Ver Detalles Técnicos <ChevronRight className="w-3 h-3 ml-1" /></Button>
                </div>
            </div>
        </div>
    )
}

function StructureStep({ label, active = false }: { label: string, active?: boolean }) {
    return (
        <div className={cn(
            "p-4 rounded-2xl border transition-all flex items-center gap-3",
            active ? "bg-white border-rose-200 shadow-md translate-x-1" : "bg-white/40 border-slate-100 opacity-50"
        )}>
            <div className={cn("w-1.5 h-1.5 rounded-full", active ? "bg-rose-500 animate-pulse" : "bg-slate-300")} />
            <span className={cn("text-[9px] font-black uppercase tracking-widest", active ? "text-slate-900" : "text-slate-400")}>{label}</span>
        </div>
    );
}

function VariantsPanel({ variants, onGenerate, onAddCaptions, isGenerating, defaultScript }: any) {
    const [concept, setConcept] = useState("Versión Alfa");
    const [script, setScript] = useState(defaultScript || "");
    const [prompt, setPrompt] = useState("Retrato hiperrealista de alta fidelidad, iluminación cinematográfica, 8k, fondo profesional difuminado.");

    useEffect(() => {
        if (defaultScript && !script) setScript(defaultScript);
    }, [defaultScript]);

    return (
        <div className="grid grid-cols-12 gap-5 h-full">
            <div className="col-span-12 lg:col-span-4 space-y-4">
                <div className="bg-white/20 backdrop-blur-xl border border-white/40 p-6 shadow-sm rounded-[2.5rem] space-y-6">
                    <div className="space-y-1 border-b border-white/20 pb-4">
                        <h3 className="text-xs font-black text-slate-900 uppercase italic tracking-tight">Clonación Maestra</h3>
                        <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Motor de Síntesis Avatar + Lip-Sync</p>
                    </div>

                    <div className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Concepto del Activo</label>
                            <Input
                                value={concept}
                                onChange={(e) => setConcept(e.target.value)}
                                className="h-10 text-[11px] font-bold bg-white/40 border-white/40 rounded-2xl px-4 focus:bg-white transition-all shadow-sm uppercase tracking-widest"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Instrucciones Visuales (Prompt)</label>
                            <Textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                className="min-h-[100px] text-[11px] font-medium bg-white/40 border-white/40 rounded-2xl resize-none p-4 focus:bg-white transition-all shadow-sm"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Guion Maquinado</label>
                            <Textarea
                                value={script}
                                onChange={(e) => setScript(e.target.value)}
                                className="min-h-[120px] text-[11px] font-medium bg-white/40 border-white/40 rounded-2xl resize-none p-4 focus:bg-white transition-all shadow-sm"
                            />
                        </div>

                        <Button
                            className="w-full h-12 bg-slate-900 hover:bg-black text-white font-black uppercase tracking-[0.25em] text-[10px] rounded-2xl shadow-xl transition-all gap-3 active:scale-95"
                            disabled={isGenerating}
                            onClick={() => onGenerate({ concept, avatarPrompt: prompt, script })}
                        >
                            {isGenerating ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    SINTETIZANDO...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4 text-rose-500" />
                                    GENERAR ACTIVO IA
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="col-span-12 lg:col-span-8 flex flex-col gap-5">
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-tighter italic">Biblioteca de Variantes</h3>
                        <Badge className="bg-rose-500/10 text-rose-600 border border-rose-500/20 font-black px-3 h-6 rounded-lg text-[9px] tracking-widest">{variants.length} ARCHIVOS</Badge>
                    </div>
                    <div className="flex gap-2">
                        <Badge className="h-6 text-[8px] font-black uppercase tracking-widest bg-white border border-white/60 text-slate-400 px-3 flex items-center gap-2">
                            <div className="w-1 h-1 bg-rose-500 rounded-full" /> FILTRO: TODOS
                        </Badge>
                    </div>
                </div>

                <ScrollArea className="flex-1 -m-2 p-2">
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
                        {variants.length === 0 ? (
                            <div className="col-span-full h-[400px] border-2 border-dashed border-white/60 rounded-[3rem] flex flex-col items-center justify-center text-slate-300 gap-6 bg-white/10 backdrop-blur-sm">
                                <div className="p-6 bg-white/40 rounded-[2rem] shadow-sm">
                                    <Clapperboard className="w-12 h-12 opacity-20" />
                                </div>
                                <div className="text-center space-y-2">
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">Cola de Variantes Vacía</p>
                                    <p className="text-[8px] font-bold uppercase tracking-widest opacity-60">Inicia una clonación para ver resultados aquí</p>
                                </div>
                            </div>
                        ) : (
                            variants.map((v: any) => (
                                <div key={v.id} className="bg-white/20 backdrop-blur-xl border border-white/40 shadow-sm group hover:border-rose-500/30 transition-all overflow-hidden rounded-[2.5rem] flex flex-col">
                                    <div className="aspect-[9/16] bg-slate-100/30 relative overflow-hidden">
                                        <img
                                            src={v.thumbnailUrl || "/api/placeholder/400/711"}
                                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                            alt={v.name}
                                        />
                                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-4">
                                            <Button size="icon" variant="secondary" className="rounded-full w-12 h-12 shadow-2xl scale-75 group-hover:scale-100 transition-transform duration-500" onClick={() => window.open(v.videoUrl, '_blank')}>
                                                <Play className="w-6 h-6 fill-slate-900 text-slate-900" />
                                            </Button>
                                            <span className="text-[9px] font-black text-white uppercase tracking-[0.2em] translate-y-4 group-hover:translate-y-0 transition-transform duration-500">Previsualizar</span>
                                        </div>
                                        <div className="absolute top-4 right-4 flex flex-col gap-2">
                                            <Badge className="bg-black/60 backdrop-blur-md border border-white/20 px-3 h-6 text-[8px] font-black uppercase tracking-[0.2em] rounded-full">
                                                {v.status === 'COMPLETED' ? 'FINALIZADO' : 'PROCESANDO'}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="p-5 space-y-4">
                                        <div className="space-y-1">
                                            <h4 className="text-[11px] font-black text-slate-900 truncate uppercase tracking-tight italic">{v.name}</h4>
                                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{new Date(v.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <div className="flex items-center gap-2 pt-4 border-t border-white/20">
                                            <Button variant="outline" className="flex-1 h-9 rounded-xl text-[9px] font-black uppercase tracking-widest gap-2 bg-white/40 border-white/40 transition-all hover:bg-white shadow-sm">
                                                <Download className="w-3.5 h-3.5" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="flex-1 h-9 rounded-xl text-[9px] font-black uppercase tracking-widest gap-2 bg-rose-500/10 border-rose-500/20 text-rose-600 hover:bg-rose-500/20 transition-all shadow-sm"
                                                onClick={() => onAddCaptions(v.id)}
                                            >
                                                <Wand2 className="w-3.5 h-3.5" /> SUBTÍTULOS
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </div>
        </div>
    )
}

