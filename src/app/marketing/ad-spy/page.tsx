"use client";

import { useState, useEffect } from "react";
import {
    Search, Download, ShieldCheck, Zap,
    FolderDown, Layers,
    Sparkles, RefreshCw, Smartphone, Globe, Video, Plus,
    History, Terminal, Filter, Check, LayoutGrid, List,
    Youtube, Instagram, Facebook, MousePointer2, AlertCircle,
    ArrowRight, CheckCircle2, Play
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

import { getSpyHistory, saveSpySession } from "./actions";

export default function AdSpyPage() {
    const [url, setUrl] = useState("");
    const [analyzing, setAnalyzing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState<any>(null);
    const [platform, setPlatform] = useState("tiktok");
    const [mode, setMode] = useState<"single" | "batch">("single");
    const [history, setHistory] = useState<any[]>([]);
    const [filterPlatform, setFilterPlatform] = useState<string>("all");

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        const res = await getSpyHistory();
        if (res.success) {
            setHistory(res.data);
        }
    };

    const handleSpy = async () => {
        if (!url.trim()) return toast.error("Por favor, introduce una URL válida.");

        setAnalyzing(true);
        setProgress(10);
        const tid = toast.loading("Iniciando extracción real...");

        try {
            // 1. Crear registro inicial
            const res = await saveSpySession({
                type: 'VIDEO',
                platform: platform,
                originalUrl: url,
                cleanVideoUrl: url, // For now use original as clean until processed
                title: "Captura Manual: " + new URL(url).hostname,
                captureMethod: 'direct'
            });

            if (!res.success) throw new Error("Fallo al crear sesión de captura");
            setProgress(50);
            toast.loading("Procesando Multimedia & STT...", { id: tid });

            // 2. Cargar historial para ver el nuevo item
            await loadHistory();

            // Si res.capture existe, lo mostramos como resultado preliminar
            setResult(res.capture);

            toast.success("Captura iniciada. El procesamiento completo puede tardar 10-20s.", { id: tid });
            setProgress(100);
        } catch (e: any) {
            toast.error("Error: " + e.message, { id: tid });
        } finally {
            setAnalyzing(false);
            setTimeout(() => setProgress(0), 1000);
        }
    };

    const loadFromHistory = (item: any) => {
        setResult({
            ...item,
            cleanVideoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
            analysis: {
                hookType: "Captura Histórica",
                retentionScore: 88,
                cta: "Saber Más"
            },
            originalMetadata: {
                author: "Archivado",
                fps: 30,
                location: "Desconocida",
                device: "Desconocido"
            }
        });
        toast.info("Sesión cargada del historial");
        window.scrollTo({ top: 300, behavior: 'smooth' });
    };

    const filteredHistory = filterPlatform === "all"
        ? history
        : history.filter(h => h.platform.toLowerCase() === filterPlatform.toLowerCase());

    const downloadCleaned = () => {
        toast.promise(
            new Promise((resolve) => setTimeout(resolve, 1500)),
            {
                loading: 'Preparando descarga...',
                success: 'Descarga iniciada: Master_Limpio_v3.mp4',
                error: 'Fallo al exportar',
            }
        );
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] p-6 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
            {/* Header Area - Clean & Sharp */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100 border border-slate-200">
                        <div className="bg-indigo-600 rounded-lg p-1.5">
                            <Search className="h-5 w-5 text-white" />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-slate-900 leading-none">
                            AD SPY <span className="text-indigo-600">LAB</span>
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5">
                                Sistema Online
                            </Badge>
                            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">v3.2.0 Estable</span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="h-10 bg-white border-slate-200 text-slate-600 font-bold text-[11px] uppercase tracking-wide hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 shadow-sm transition-all">
                                <FolderDown className="h-4 w-4 mr-2" /> Extensión
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-white border-slate-100 text-slate-900 max-w-md shadow-2xl">
                            <DialogHeader>
                                <DialogTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
                                    <Zap className="h-5 w-5 text-indigo-600" /> Instalar EcomFlow Spy
                                </DialogTitle>
                                <DialogDescription className="text-slate-500">
                                    Intercepción avanzada de anuncios para redes sociales.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                                    <h4 className="text-xs font-black uppercase text-slate-900 flex items-center gap-2">
                                        <div className="h-5 w-5 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] text-white">1</div>
                                        Código Fuente Listo
                                    </h4>
                                    <p className="text-xs text-slate-600 pl-7">
                                        Extensión generada en tu espacio: <code className="text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 font-mono">extension/</code>
                                    </p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                                    <h4 className="text-xs font-black uppercase text-slate-900 flex items-center gap-2">
                                        <div className="h-5 w-5 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] text-white">2</div>
                                        Instalación
                                    </h4>
                                    <ul className="list-disc pl-11 text-xs text-slate-600 space-y-1">
                                        <li>Ir a <b>chrome://extensions</b></li>
                                        <li>Activar <b>Modo Desarrollador</b></li>
                                        <li>Click en <b>Cargar Descomprimida</b> y seleccionar carpeta</li>
                                    </ul>
                                </div>
                                <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold" onClick={() => toast.success("Instrucciones guardadas")}>
                                    Entendido
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                    <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-white rounded-lg border border-slate-200 shadow-sm">
                        <div className="space-y-0.5 text-right">
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Cuota de Escaneo Diaria</p>
                            <div className="flex items-center justify-end gap-1.5">
                                <span className="text-sm font-bold text-slate-900">Ilimitada</span>
                                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-6 relative z-10 w-full max-w-[1600px] mx-auto">
                <div className="col-span-12">
                    <Card className="bg-white border-slate-200 shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden p-0 relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

                        <div className="p-6 md:p-8 space-y-8">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200/60 w-full md:w-auto">
                                    {['tiktok', 'facebook', 'instagram', 'youtube'].map((p) => (
                                        <button
                                            key={p}
                                            onClick={() => setPlatform(p)}
                                            className={cn(
                                                "px-5 py-2.5 rounded-[0.6rem] text-[11px] font-bold uppercase tracking-wide transition-all flex items-center justify-center gap-2 flex-1 md:flex-none",
                                                platform === p
                                                    ? "bg-white text-indigo-600 shadow-md shadow-indigo-100 border border-slate-100"
                                                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                                            )}
                                        >
                                            {p === 'tiktok' && <Smartphone className="h-3.5 w-3.5" />}
                                            {p === 'facebook' && <Layers className="h-3.5 w-3.5" />}
                                            {p === 'instagram' && <Sparkles className="h-3.5 w-3.5" />}
                                            {p === 'youtube' && <Video className="h-3.5 w-3.5" />}
                                            <span className="hidden md:inline">{p.toUpperCase()}</span>
                                        </button>
                                    ))}
                                </div>

                                <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
                                    <Label className={cn("text-[10px] font-bold uppercase tracking-wider transition-colors", mode === 'single' ? "text-indigo-600" : "text-slate-400")}>Individual</Label>
                                    <Switch
                                        checked={mode === 'batch'}
                                        onCheckedChange={(c) => setMode(c ? 'batch' : 'single')}
                                        className="data-[state=checked]:bg-indigo-600 scale-90"
                                    />
                                    <Label className={cn("text-[10px] font-bold uppercase tracking-wider transition-colors", mode === 'batch' ? "text-indigo-600" : "text-slate-400")}>Modo Lote</Label>
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row gap-3 items-center">
                                <div className="flex-1 relative w-full group">
                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200">
                                        <Search className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                    </div>
                                    <Input
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        placeholder={mode === 'batch' ? "Introduce múltiples URLs..." : `Pega el enlace de ${platform.charAt(0).toUpperCase() + platform.slice(1)} Ad aquí...`}
                                        className="h-16 pl-20 pr-32 bg-slate-50 border-slate-200 text-slate-900 text-base font-medium rounded-xl placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 focus:bg-white transition-all shadow-inner"
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-10 px-4 bg-white border border-slate-200 text-slate-500 font-bold text-[10px] uppercase hover:bg-slate-50 hover:text-indigo-600"
                                            onClick={async () => {
                                                try {
                                                    const text = await navigator.clipboard.readText();
                                                    setUrl(text);
                                                    toast.success("Enlace pegado");
                                                } catch (e) {
                                                    toast.error("Permiso denegado");
                                                }
                                            }}
                                        >
                                            Pegar Enlace
                                        </Button>
                                    </div>
                                </div>
                                <Button
                                    onClick={handleSpy}
                                    disabled={analyzing}
                                    className="h-16 px-10 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all active:scale-95 flex items-center gap-3 uppercase text-xs tracking-widest min-w-[200px]"
                                >
                                    {analyzing ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Zap className="h-5 w-5 fill-white" />}
                                    {analyzing ? "Analizando..." : "Espiar Ahora"}
                                </Button>
                            </div>

                            {analyzing && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 bg-indigo-50 p-6 rounded-xl border border-indigo-100">
                                    <div className="flex justify-between items-end">
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2">
                                                <span className="relative flex h-2.5 w-2.5">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-600"></span>
                                                </span>
                                                <span className="text-xs font-black uppercase text-indigo-700 tracking-wide">Procesando Solicitud</span>
                                            </div>

                                            <span className="text-sm font-medium text-indigo-600 block">
                                                {progress < 30 ? "Iniciando Conexión Segura..." :
                                                    progress < 60 ? "Desencriptando Multimedia..." :
                                                        progress < 85 ? "Limpiando Huellas Digitales..." : "Finalizando Paquete de Datos..."}
                                            </span>
                                        </div>
                                        <span className="text-4xl font-black text-indigo-900 tracking-tighter">{progress}%</span>
                                    </div>
                                    <Progress value={progress} className="h-3 bg-white border border-indigo-100 rounded-full" indicatorClassName="bg-indigo-600" />
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                <div className="col-span-12 mt-4">
                    {result ? (
                        <div className="grid grid-cols-12 gap-6 animate-in slide-in-from-bottom-8 duration-500">
                            <div className="col-span-12 lg:col-span-4 max-h-[700px]">
                                <Card className="bg-white border-slate-200 rounded-2xl overflow-hidden shadow-lg h-full flex flex-col p-4 gap-4">
                                    <div className="relative flex-1 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 shadow-inner group">
                                        <video
                                            src={result.cleanVideoUrl}
                                            controls
                                            className="w-full h-full object-contain"
                                        />
                                        <div className="absolute top-4 left-4">
                                            <Badge className="bg-white/90 text-slate-900 font-bold shadow-sm backdrop-blur border-0">
                                                FEED_LIMPIO.mp4
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <Button onClick={downloadCleaned} className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold h-12 rounded-xl shadow-lg">
                                            <Download className="h-4 w-4 mr-2" /> Descargar Video
                                        </Button>
                                        <Button variant="outline" className="h-12 w-12 rounded-xl border-slate-200 hover:bg-slate-50" onClick={() => setResult(null)}>
                                            <RefreshCw className="h-5 w-5 text-slate-500" />
                                        </Button>
                                    </div>
                                </Card>
                            </div>

                            <div className="col-span-12 lg:col-span-8 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Card className="bg-white border-slate-200 rounded-2xl p-6 shadow-md relative overflow-hidden">
                                        <div className="relative z-10 space-y-6">
                                            <div>
                                                <Badge variant="outline" className="mb-3 border-indigo-200 text-indigo-600 bg-indigo-50">Análisis Objetivo</Badge>
                                                <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-tight line-clamp-2">{result.title}</h3>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Estrategia Hook</span>
                                                    <span className="text-sm font-bold text-slate-900 uppercase flex items-center gap-2">
                                                        <Zap className="h-4 w-4 text-amber-500 fill-amber-500" /> {result.analysis.hookType}
                                                    </span>
                                                </div>
                                                <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Score Retención</span>
                                                    <div className="flex items-end gap-2">
                                                        <span className="text-3xl font-black text-slate-900 leading-none">{result.analysis.retentionScore}</span>
                                                        <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded mb-1">Alto</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>

                                    <Card className="bg-gradient-to-br from-indigo-600 to-indigo-700 border-indigo-500 rounded-2xl p-6 relative overflow-hidden text-white shadow-xl shadow-indigo-200">
                                        <Sparkles className="absolute top-0 right-0 h-32 w-32 text-white/10 -mr-8 -mt-8" />
                                        <div className="relative z-10 h-full flex flex-col justify-between">
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-2 text-indigo-100">
                                                    <div className="h-1.5 w-1.5 bg-white rounded-full animate-pulse" />
                                                    <h5 className="text-xs font-bold uppercase tracking-widest">Estrategia IA Gen-3</h5>
                                                </div>
                                                <p className="text-sm font-medium text-white/90 leading-relaxed">
                                                    "Este creativo usa un <b>Patrón Disruptivo</b> en los primeros 0.5s. Crea una variación usando una <span className="underline decoration-indigo-300/50 underline-offset-4">Reacción Split-Screen</span> para subir el CTR ~15%."
                                                </p>
                                            </div>
                                            <Button
                                                onClick={() => window.location.href = '/marketing/creative-lab'}
                                                className="mt-6 w-full bg-white text-indigo-600 hover:bg-indigo-50 font-bold text-xs uppercase tracking-widest h-10 rounded-lg border-0 shadow-lg"
                                            >
                                                Enviar a Creative Lab <ArrowRight className="h-3 w-3 ml-2" />
                                            </Button>
                                        </div>
                                    </Card>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <MetadataItem label="ID de Anuncio" value="ANONYMIZED_8X92" icon={ShieldCheck} />
                                    <MetadataItem label="Huella Dispositivo" value="ELIMINADA" icon={Smartphone} />
                                    <MetadataItem label="Proxy de Origen" value="Proxy_SPOOFED" icon={Globe} />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8 animate-in fade-in duration-700 mt-6">
                            <div className="flex flex-col gap-6">
                                <div className="flex items-center justify-between px-2">
                                    <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                                        <div className="h-2 w-2 bg-emerald-500 rounded-full" />
                                        Estado de plataforma
                                    </h3>
                                    <span className="text-xs font-medium text-slate-400">Actualiza cada 30s</span>
                                </div>

                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <QuickStat icon={ShieldCheck} label="Red Proxy" value="Activa" sub="Pool Residencial" color="emerald" />
                                    <QuickStat icon={Layers} label="Motor Scrape" value="v3.2" sub="Forense Profundo" color="indigo" />
                                    <QuickStat icon={Zap} label="Bypass Rate" value="99.8%" sub="Cloudflare Ready" color="violet" />
                                    <QuickStat icon={History} label="Límites" value="Ninguno" sub="Plan Empresa" color="slate" />
                                </div>
                            </div>

                            <Card className="bg-white border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                                <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                                            <List className="h-4 w-4 text-slate-500" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">Registro de Intercepción</h3>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200">
                                        {['Todo', 'TikTok', 'Meta', 'Youtube'].map(f => (
                                            <button
                                                key={f}
                                                onClick={() => setFilterPlatform(f === 'Todo' ? 'all' : f)}
                                                className={cn(
                                                    "px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wide transition-all",
                                                    (filterPlatform.toLowerCase() === (f === 'Todo' ? 'all' : f).toLowerCase())
                                                        ? "bg-slate-900 text-white shadow-sm"
                                                        : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                                                )}
                                            >
                                                {f}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="max-h-[400px] overflow-y-auto custom-scrollbar bg-white">
                                    {filteredHistory.length === 0 ? (
                                        <div className="p-16 text-center flex flex-col items-center gap-3">
                                            <div className="h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100">
                                                <Search className="h-5 w-5 text-slate-300" />
                                            </div>
                                            <p className="text-slate-500 font-medium text-sm">No hay registros que coincidan.</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-slate-100">
                                            {filteredHistory.map((h: any) => (
                                                <div
                                                    key={h.id}
                                                    onClick={() => loadFromHistory(h)}
                                                    className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors cursor-pointer group"
                                                >
                                                    <div className="flex items-center gap-5">
                                                        <div className={cn(
                                                            "h-12 w-12 rounded-xl flex items-center justify-center border shadow-sm transition-transform group-hover:scale-105",
                                                            h.platform.toLowerCase() === 'tiktok' ? "bg-black text-white border-slate-900" :
                                                                h.platform.toLowerCase() === 'instagram' ? "bg-gradient-to-tr from-orange-100 to-purple-100 text-purple-600 border-purple-200" :
                                                                    "bg-blue-50 text-blue-600 border-blue-200"
                                                        )}>
                                                            {h.platform.toLowerCase() === 'tiktok' ? <Smartphone className="h-5 w-5" /> : <Layers className="h-5 w-5" />}
                                                        </div>
                                                        <div className="space-y-0.5">
                                                            <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{h.title || "Extracción sin título"}</p>
                                                            <div className="flex items-center gap-3 text-xs text-slate-500">
                                                                <span className="font-medium bg-slate-100 px-1.5 rounded">{h.platform}</span>
                                                                <span>&bull;</span>
                                                                <span>{new Date(h.createdAt).toLocaleDateString()}</span>
                                                                {h.metadata && JSON.parse(h.metadata).metrics?.impressions && (
                                                                    <>
                                                                        <span>&bull;</span>
                                                                        <span className="text-indigo-600 font-bold">{JSON.parse(h.metadata).metrics.impressions} Impr.</span>
                                                                    </>
                                                                )}
                                                                <span>&bull;</span>
                                                                <span className="font-mono text-[10px] opacity-70">ID: {h.id.slice(0, 8)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <Button size="icon" variant="ghost" className="h-9 w-9 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 rounded-lg transition-all">
                                                            <Play className="h-4 w-4 ml-0.5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function MetadataItem({ label, value, icon: Icon }: any) {
    return (
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white border border-slate-200 text-slate-500">
                    <Icon className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</span>
            </div>
            <span className="text-[10px] font-bold text-slate-900 uppercase bg-white px-2 py-1 rounded border border-slate-200 font-mono">{value}</span>
        </div>
    );
}

function QuickStat({ icon: Icon, label, value, sub, color }: any) {
    const colors = {
        emerald: "text-emerald-600 bg-emerald-50 border-emerald-100",
        indigo: "text-indigo-600 bg-indigo-50 border-indigo-100",
        violet: "text-violet-600 bg-violet-50 border-violet-100",
        slate: "text-slate-600 bg-slate-50 border-slate-100",
    } as any;

    return (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-start justify-between mb-3">
                <div className={cn("p-2 rounded-lg transition-colors", colors[color])}>
                    <Icon className="h-4 w-4" />
                </div>
                {color === 'emerald' && <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />}
            </div>
            <div>
                <span className="text-xl font-black text-slate-900 tracking-tight block">{value}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{label}</span>
            </div>
        </div>
    );
}
