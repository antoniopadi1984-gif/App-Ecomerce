"use client";

import { useState, useRef, useEffect } from "react";
import {
    Video, Upload, Sparkles, Clapperboard, Play, Pause,
    MonitorPlay, Mic2, UserSquare2, Type, MoveRight,
    Wand2, Download, Share2, Layers, Film, Music, CheckCircle2, RefreshCw, Globe,
    ArrowUpRight, Zap, ExternalLink, Info, Truck, ChevronRight, Eye, MousePointer2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { generateScriptFromConcept, createVideoTask, stripMetadataLocal, analyzeVideoLocal } from "./actions";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface VideoLabClientProps {
    initialProducts: any[];
}

export default function VideoLabClient({ initialProducts }: VideoLabClientProps) {
    const [step, setStep] = useState(1); // 1: Ingest, 2: Script, 3: Avatar, 4: Render
    const [loading, setLoading] = useState(false);

    // V2 Features
    const [duration, setDuration] = useState("30s");
    const [tone, setTone] = useState("UGC Energético");
    const [platform, setPlatform] = useState("TikTok");

    // Data
    const [concept, setConcept] = useState("");
    const [productName, setProductName] = useState(initialProducts[0]?.title || "");
    const [script, setScript] = useState("");
    const [selectedAvatar, setSelectedAvatar] = useState<number | null>(null);
    const [renderProgress, setRenderProgress] = useState(0);

    // AI Analysis State
    const [isAnalyzingVideo, setIsAnalyzingVideo] = useState(false);
    const [analysisProgress, setAnalysisProgress] = useState(0);
    const [analysisResult, setAnalysisResult] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    // Modals
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [importSource, setImportSource] = useState<"TikTok" | "Meta" | null>(null);
    const [importUrl, setImportUrl] = useState("");
    const [importing, setImporting] = useState(false);

    // DB Products State
    const [dbProducts] = useState<any[]>(initialProducts);
    const [selectedProductId, setSelectedProductId] = useState<string>(initialProducts[0]?.id || "");
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
    const [avatarUploadProgress, setAvatarUploadProgress] = useState(0);
    const [avatarGender, setAvatarGender] = useState("Femenino");
    const [avatarAge, setAvatarAge] = useState("25");

    // Ref for file input
    const fileInputRef = useRef<HTMLInputElement>(null);
    const avatarInputRef = useRef<HTMLInputElement>(null);

    const handleAvatarUpload = async (file: File) => {
        setIsAvatarModalOpen(true);
        setAvatarUploadProgress(0);

        toast.info(`Iniciando entrenamiento maestro: Avatar ${avatarGender} (${avatarAge} años)`);

        let p = 0;
        const interval = setInterval(() => {
            p += 5;
            setAvatarUploadProgress(p);
            if (p >= 100) {
                clearInterval(interval);
                toast.success(`¡Avatar ${avatarGender} de ${avatarAge} años entrenado con éxito!`);
                setIsAvatarModalOpen(false);
            }
        }, 100);
    };

    // Step 1: Ingestion Handlers
    const handleImport = async () => {
        if (!importUrl) {
            toast.error("Pega un enlace válido.");
            return;
        }
        setImporting(true);
        // Simulate importing logic
        await new Promise(r => setTimeout(r, 2000));
        setConcept(`[IMPORTADO DE ${importSource} LIBRARY: ${importUrl}] Analizando estructura viral...`);
        setImporting(false);
        setImportModalOpen(false);
        setImportUrl("");
        toast.success(`Video importado de ${importSource} con éxito.`);
    };

    const [videoPreview, setVideoPreview] = useState<string | null>(null);

    const handleFileUpload = async (file: File) => {
        if (!file.type.startsWith('video/')) {
            toast.error("Por favor, sube un archivo de video.");
            return;
        }

        // Create preview
        const url = URL.createObjectURL(file);
        setVideoPreview(url);

        setIsAnalyzingVideo(true);
        setAnalysisProgress(10);

        const formData = new FormData();
        formData.append("video_file", file);

        try {
            const res = await analyzeVideoLocal(formData);
            if (res.success && res.analysis) {
                const a = res.analysis;
                setConcept(`[ESTRUCTURA VIRAL] Hook: ${a.hook_score}/10. Pacing: ${a.pacing}. Suggestion: ${a.suggestion}`);
                setAnalysisResult(`${a.suggestion}`);
                toast.success("Análisis Maestro completado.");
            } else {
                throw new Error(res.error || "Error Desconocido");
            }
        } catch (e: any) {
            console.error(e);
            toast.error("Error al analizar: " + e.message);
        } finally {
            setIsAnalyzingVideo(false);
            setAnalysisProgress(100);
        }
    };

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const onDragLeave = () => {
        setIsDragging(false);
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFileUpload(file);
    };

    const handleGenerateScript = async () => {
        if (!concept || !productName) {
            toast.error("Por favor completa el concepto y el producto.");
            return;
        }
        setLoading(true);
        const res = await generateScriptFromConcept(`${concept} [Duración: ${duration}] [Tono: ${tone}] [Plataforma: ${platform}]`, productName);
        setLoading(false);

        if (res.success && res.script) {
            setScript(res.script);
            setStep(2);
            toast.success("¡Guión Maestro generado!");
        } else {
            toast.error("Error al generar guión");
        }
    };

    const handleRender = async () => {
        if (selectedAvatar === null) {
            toast.error("Selecciona un avatar.");
            return;
        }

        setStep(4);
        setRenderProgress(0);

        const taskRes = await createVideoTask(selectedProductId, script, selectedAvatar.toString());

        if (!taskRes.success) {
            toast.error("Error al iniciar render: " + taskRes.error);
            setStep(3);
            return;
        }

        let p = 0;
        const interval = setInterval(() => {
            p += Math.random() * 5;
            if (p >= 100) {
                p = 100;
                clearInterval(interval);
                toast.success("¡Video renderizado con éxito!");
            }
            setRenderProgress(Math.min(100, Math.floor(p)));
        }, 400);
    };

    return (
        <div className="min-h-screen bg-[#05060f] text-white p-3 md:p-6 font-sans selection:bg-indigo-500/30 overflow-x-hidden">
            {/* Ambient Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-600/10 blur-[120px] rounded-full" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
            </div>

            {/* Header */}
            <header className="relative flex flex-col md:flex-row items-center justify-between mb-6 z-20 gap-4">
                <div className="flex flex-col items-center md:items-start text-center md:text-left">
                    <div className="flex items-center gap-3 group">
                        <div className="h-10 w-10 bg-gradient-to-br from-indigo-500 to-indigo-800 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.3)] border border-indigo-400/50 group-hover:scale-105 transition-transform duration-500">
                            <Clapperboard className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter flex items-center gap-2">
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-100 to-indigo-300">
                                    Video Lab
                                </span>
                                <span className="text-indigo-400">Maestro</span>
                            </h1>
                            <div className="flex items-center gap-2 mt-0.5">
                                <Badge className="bg-amber-400 text-black border-none px-1.5 py-0 font-black text-[8px] tracking-widest uppercase rounded-sm">
                                    God Mode v2.0
                                </Badge>
                                <p className="text-indigo-200/60 font-bold uppercase tracking-[0.2em] text-[8px]">
                                    Engineered for Viral Dominance
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-2xl p-1.5 rounded-lg border border-white/20 shadow-2xl">
                    {[1, 2, 3, 4].map(s => (
                        <div key={s} className="flex flex-col items-center gap-1">
                            <div className={cn(
                                "h-1 w-12 rounded-full transition-all duration-700",
                                step >= s ? "bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.5)]" : "bg-white/10"
                            )} />
                            <span className={cn(
                                "text-[7px] font-black uppercase tracking-widest",
                                step >= s ? "text-indigo-300" : "text-white/30"
                            )}>Fase {s}</span>
                        </div>
                    ))}
                </div>
            </header>

            <div className="grid grid-cols-12 gap-4 relative z-20">
                <div className="col-span-12">
                    {step === 1 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-5 duration-700">
                            <Card className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-lg overflow-hidden group shadow-2xl transition-all hover:border-indigo-400/30">
                                <CardContent className="p-5 space-y-5">
                                    <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 bg-indigo-500/30 rounded-lg flex items-center justify-center border border-indigo-400/50">
                                                    <Wand2 className="h-4 w-4 text-indigo-300" />
                                                </div>
                                                <h2 className="text-lg md:text-xl font-black uppercase italic text-white tracking-tight">
                                                    Configuración Creativa
                                                </h2>
                                            </div>
                                            <p className="text-indigo-200/40 font-bold uppercase tracking-widest text-[8px] ml-1">Ingeniería inversa por IA para dominar el feed.</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                onClick={() => { setImportSource("TikTok"); setImportModalOpen(true); }}
                                                className="bg-white/10 border-white/20 hover:bg-white/20 text-white text-[8px] font-black uppercase tracking-widest rounded-lg h-8 px-3"
                                            >
                                                <Share2 className="h-3.5 w-3.5 mr-1.5 text-indigo-300" /> TikTok Library
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() => { setImportSource("Meta"); setImportModalOpen(true); }}
                                                className="bg-white/10 border-white/20 hover:bg-white/20 text-white text-[8px] font-black uppercase tracking-widest rounded-lg h-8 px-3"
                                            >
                                                <Eye className="h-3.5 w-3.5 mr-1.5 text-indigo-300" /> Meta Library
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black uppercase text-indigo-300 tracking-[0.2em] ml-2">Seleccionar Producto</label>
                                            <div className="relative group">
                                                <select
                                                    value={selectedProductId}
                                                    onChange={(e) => {
                                                        const p = dbProducts.find(x => x.id === e.target.value);
                                                        setSelectedProductId(e.target.value);
                                                        if (p) setProductName(p.title);
                                                    }}
                                                    className="w-full h-10 bg-white/5 border border-white/20 rounded-lg focus:ring-1 focus:ring-indigo-400/20 transition-all font-black text-white px-4 outline-none appearance-none hover:bg-white/10 cursor-pointer text-xs"
                                                >
                                                    <option value="" disabled className="bg-[#0a0b14]">Inventario</option>
                                                    {dbProducts.map(p => (
                                                        <option key={p.id} value={p.id} className="bg-[#0a0b14] text-white">{p.title}</option>
                                                    ))}
                                                </select>
                                                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-300 pointer-events-none rotate-90" />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black uppercase text-indigo-300 tracking-[0.2em] ml-2">Público Objetivo</label>
                                            <Input
                                                placeholder="Ej: Emprendedores apasionados..."
                                                className="h-10 bg-white/5 border border-white/20 rounded-lg focus:ring-1 focus:ring-indigo-400/20 text-white px-4 text-xs placeholder:text-white/20 font-bold"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black uppercase text-indigo-300 tracking-[0.2em] ml-2">Plataforma</label>
                                            <div className="grid grid-cols-2 gap-1.5 bg-black/40 p-1 rounded-lg border border-white/20 h-9">
                                                {["TikTok", "Instagram"].map((p) => (
                                                    <button
                                                        key={p}
                                                        onClick={() => setPlatform(p)}
                                                        className={cn(
                                                            "rounded-md font-black uppercase text-[9px] tracking-widest transition-all duration-300 flex items-center justify-center gap-1.5",
                                                            platform === p ? "bg-indigo-500 text-white shadow-lg" : "text-white/40 hover:text-white"
                                                        )}
                                                    >
                                                        {p === "TikTok" ? <Music className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                                        {p}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black uppercase text-indigo-300 tracking-[0.2em] ml-2">Duración Maestro</label>
                                            <div className="grid grid-cols-4 gap-1.5 bg-black/40 p-1 rounded-lg border border-white/20 h-9">
                                                {["15s", "30s", "50s", "Adaptar"].map((d) => (
                                                    <button
                                                        key={d}
                                                        onClick={() => setDuration(d === "Adaptar" ? "IA Optimized" : d)}
                                                        className={cn(
                                                            "rounded-md font-black uppercase text-[9px] tracking-widest transition-all duration-300",
                                                            duration === (d === "Adaptar" ? "IA Optimized" : d) ? "bg-amber-500 text-black shadow-lg" : "text-white/40 hover:text-white"
                                                        )}
                                                    >
                                                        {d}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center ml-2">
                                            <label className="text-[9px] font-black uppercase text-amber-400 tracking-[0.2em]">Referencia Creativa</label>
                                            <Badge className="bg-indigo-400/20 text-indigo-300 border-none text-[7px] font-black uppercase tracking-tighter">Gemini 3.5 Flash</Badge>
                                        </div>

                                        <Tabs defaultValue="upload" className="w-full">
                                            <TabsList className="bg-black/60 p-1 rounded-lg h-9 border border-white/20 grid grid-cols-2 mb-3 shadow-inner">
                                                <TabsTrigger value="upload" className="rounded-md font-black text-[9px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-black transition-all">
                                                    <Upload className="h-3.5 w-3.5 mr-1.5" /> Subir Video
                                                </TabsTrigger>
                                                <TabsTrigger value="link" className="rounded-md font-black text-[9px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-black transition-all">
                                                    <Type className="h-3.5 w-3.5 mr-1.5" /> Idea / Texto
                                                </TabsTrigger>
                                            </TabsList>


                                            <TabsContent value="upload" className="mt-0 outline-none">
                                                <div
                                                    onDragOver={onDragOver}
                                                    onDragLeave={onDragLeave}
                                                    onDrop={onDrop}
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className={cn(
                                                        "h-[120px] border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-all duration-500 relative cursor-pointer group",
                                                        isDragging ? "border-indigo-400 bg-indigo-500/10 scale-[1.01]" : "border-white/20 bg-white/5 hover:border-indigo-400/50 hover:bg-white/10",
                                                        isAnalyzingVideo && "pointer-events-none"
                                                    )}
                                                >
                                                    <input
                                                        type="file"
                                                        ref={fileInputRef}
                                                        accept="video/*"
                                                        className="hidden"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) handleFileUpload(file);
                                                        }}
                                                    />
                                                    {isAnalyzingVideo ? (
                                                        <div className="flex flex-col items-center gap-4 z-10 w-full px-12 text-center">
                                                            <div className="relative">
                                                                <RefreshCw className="h-10 w-10 text-amber-400 animate-spin" />
                                                            </div>
                                                            <p className="text-[10px] font-black uppercase text-white tracking-[0.3em]">IA Analizando Estructura...</p>
                                                            <Progress value={analysisProgress} className="h-1.5 w-full bg-white/10" />
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className={cn(
                                                                "p-4 rounded-lg bg-indigo-500/10 border border-indigo-400/20 mb-3 transition-all duration-500",
                                                                isDragging ? "scale-110 bg-indigo-500/20" : "group-hover:scale-105"
                                                            )}>
                                                                <Upload className="h-6 w-6 text-indigo-300" />
                                                            </div>
                                                            <p className="text-xs font-black text-white uppercase tracking-widest text-center px-8">
                                                                {isDragging ? "Suelta para Analizar" : "Arrastra tu video referencia aquí"}
                                                            </p>
                                                            <p className="text-[8px] font-bold text-white/30 uppercase mt-1 tracking-widest">o haz clic para buscar</p>
                                                        </>
                                                    )}
                                                </div>
                                            </TabsContent>

                                            <TabsContent value="link" className="mt-0 outline-none">
                                                <Textarea
                                                    value={concept} onChange={e => setConcept(e.target.value)}
                                                    placeholder="Pega un enlace de TikTok o describe tu idea creativa..."
                                                    className="min-h-[120px] rounded-lg bg-white/5 border border-white/20 text-white p-4 font-bold text-sm placeholder:text-white/20 focus:ring-1 focus:ring-indigo-400/30"
                                                />
                                            </TabsContent>
                                        </Tabs>
                                    </div>

                                    {analysisResult && (
                                        <div className="bg-indigo-400/10 border border-indigo-400/30 p-4 rounded-lg flex gap-4 shadow-xl animate-in fade-in slide-in-from-left-4 duration-500">
                                            <Zap className="h-5 w-5 text-amber-400 shrink-0" />
                                            <div className="space-y-0.5">
                                                <h4 className="text-[9px] font-black uppercase text-indigo-300">IA Insights Master</h4>
                                                <p className="text-[11px] text-white/90 font-medium leading-tight">{analysisResult}</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex justify-center pt-2">
                                        <Button
                                            onClick={handleGenerateScript}
                                            disabled={loading || !concept}
                                            className="h-10 px-6 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white font-black uppercase tracking-widest text-[9px] shadow-xl shadow-indigo-500/20 active:scale-95 transition-all disabled:opacity-50"
                                        >
                                            {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                                            {loading ? "Generando..." : "Generar Guion Maestro"}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="animate-in fade-in zoom-in duration-500">
                            <Card className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-lg p-6 space-y-6 shadow-2xl">
                                <h2 className="text-xl font-black uppercase italic text-white tracking-widest">Fase 2: Guion Perfecto</h2>
                                <Textarea
                                    value={script} onChange={e => setScript(e.target.value)}
                                    className="min-h-[300px] bg-black/60 border border-white/20 text-sm font-mono text-white p-6 rounded-lg focus:ring-1 focus:ring-indigo-400/30 leading-relaxed"
                                />
                                <div className="flex justify-end gap-3">
                                    <Button onClick={() => setStep(3)} className="h-10 px-6 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white font-black uppercase tracking-widest text-[10px] shadow-xl">Aprobar e Ir a Avatar</Button>
                                </div>
                            </Card>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="animate-in fade-in slide-in-from-right-10 duration-500">
                            <Card className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-lg p-6 space-y-6 shadow-2xl">
                                <h2 className="text-xl font-black uppercase italic text-white tracking-widest">Casting Digital</h2>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                                        <div
                                            key={i}
                                            onClick={() => setSelectedAvatar(i)}
                                            className={cn(
                                                "aspect-[9/16] rounded-lg bg-white/5 border-2 relative cursor-pointer overflow-hidden transition-all duration-300",
                                                selectedAvatar === i ? "border-indigo-400 scale-[1.02] shadow-2xl shadow-indigo-500/20" : "border-white/10 hover:border-white/30"
                                            )}
                                        >
                                            <div className="absolute inset-0 flex items-center justify-center font-black text-2xl text-white/5">
                                                AVATAR {i}
                                            </div>
                                            {selectedAvatar === i && (
                                                <div className="absolute top-3 right-3 bg-indigo-500 text-white p-1 rounded-full shadow-xl">
                                                    <CheckCircle2 className="h-4 w-4" />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-center">
                                    <Button onClick={handleRender} className="h-12 px-12 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl">
                                        Renderizar Maestro
                                    </Button>
                                </div>
                            </Card>
                        </div>
                    )}

                    {step === 4 && (
                        <Card className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-lg p-10 flex flex-col items-center justify-center text-center space-y-8 min-h-[400px] shadow-2xl">
                            {renderProgress < 100 ? (
                                <>
                                    <div className="relative h-48 w-48 flex items-center justify-center">
                                        <div className="absolute inset-0 rounded-full border-4 border-white/10" />
                                        <div className="absolute inset-0 rounded-full border-4 border-indigo-400 border-t-transparent animate-spin" />
                                        <span className="text-4xl font-black text-white">{renderProgress}%</span>
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Sincronizando IA...</h3>
                                        <p className="text-indigo-200/40 font-bold uppercase tracking-widest text-[8px]">Modelando gesticulación y voz neural</p>
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-8 animate-in zoom-in duration-500">
                                    <div className="h-24 w-24 bg-emerald-500/20 rounded-full flex items-center justify-center border-2 border-emerald-500/50 shadow-2xl shadow-emerald-500/20 mx-auto">
                                        <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                                    </div>
                                    <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">¡Master Ready!</h3>
                                    <div className="flex flex-col md:flex-row gap-3">
                                        <Button className="h-12 px-10 rounded-lg bg-white text-black font-black uppercase tracking-widest hover:bg-indigo-50 transition-colors shadow-2xl text-[10px]">
                                            <Download className="h-4 w-4 mr-2" /> Descargar 4K
                                        </Button>
                                        <Button onClick={() => setStep(1)} variant="outline" className="h-12 px-6 rounded-lg border-white/20 text-white font-black uppercase tracking-widest hover:bg-white/5 text-[10px]">
                                            <RefreshCw className="h-4 w-4 mr-2" /> Crear Otro
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </Card>
                    )}
                </div>

                {/* 
                   Space reserved for future modules or insights.
                   Previously Avatar Studio was here, now moved to /marketing/avatars-lab
                */}
            </div>

            <Dialog open={importModalOpen} onOpenChange={setImportModalOpen}>
                <DialogContent className="bg-[#0a0b14] border-white/10 text-white p-6 rounded-lg backdrop-blur-3xl max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-3">
                            <Download className="h-5 w-5 text-indigo-400" />
                            Importar de {importSource}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-3">
                        <label className="text-[9px] font-black text-indigo-300 uppercase tracking-widest ml-1">Enlace de la Biblioteca</label>
                        <Input
                            value={importUrl} onChange={e => setImportUrl(e.target.value)}
                            placeholder="Pega el enlace aquí..."
                            className="h-10 bg-white/5 border-white/10 px-4 text-xs font-bold rounded-lg placeholder:text-white/20"
                        />
                    </div>
                    <Button onClick={handleImport} className="w-full h-10 bg-indigo-500 hover:bg-indigo-400 text-white font-black uppercase tracking-widest text-[10px] shadow-2xl rounded-lg">Activar Proceso Maestro</Button>
                </DialogContent>
            </Dialog>

            <Dialog open={isAvatarModalOpen} onOpenChange={setIsAvatarModalOpen}>
                <DialogContent className="bg-[#0a0b14] border-indigo-500/30 text-white p-6 rounded-lg backdrop-blur-3xl sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-3">
                            <Sparkles className="h-5 w-5 text-indigo-400" />
                            Clonación Neural
                        </DialogTitle>
                        <DialogDescription className="text-indigo-200/50 uppercase font-black tracking-widest text-[8px] pt-1">
                            Entrena tu avatar realista con ingeniería avanzada.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-6 space-y-6">
                        <div className="space-y-4 text-center">
                            <div className="h-16 w-16 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto border border-indigo-400/50 mb-2">
                                <MonitorPlay className="h-8 w-8 text-indigo-400" />
                            </div>
                            <h3 className="text-sm font-bold uppercase tracking-tight">Procesando Video Maestro</h3>
                            <div className="space-y-1.5 pt-2">
                                <Progress value={avatarUploadProgress} className="h-1.5 bg-white/5" />
                                <p className="text-[8px] font-black uppercase tracking-widest text-indigo-300">{avatarUploadProgress}% - Sincronizando capas neuronales</p>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button className="w-full h-10 bg-white/5 border border-white/10 text-white/40 uppercase text-[9px] font-black tracking-widest rounded-lg cursor-wait" disabled>
                            Esperando Finalización...
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <input
                type="file"
                ref={avatarInputRef}
                accept="video/*"
                className="hidden"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleAvatarUpload(file);
                }}
            />
        </div >
    );
}
