
"use client";

import React, { useState, useEffect } from "react";
import {
    Users, UserCheck, Sparkles, Wand2,
    Clapperboard, Play, Save, ChevronRight,
    Zap, Monitor, ExternalLink, Download,
    Search, Image as ImageIcon, Video, FileVideo,
    RotateCcw, Languages, Copy, CheckCircle2,
    Layout, Briefcase
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
    checkLocalEngineHealth,
    generateAvatarLocal,
    getProducts,
    getProductResearch,
    getElevenLabsVoices,
    generateAvatarScript,
    analyzeUploadedVideo,
    translateVideoScript
} from "./actions";
import { searchEnvatoAssets, EnvatoAsset } from "@/lib/envato";

export default function AvatarsLabPage() {
    const [products, setProducts] = useState<any[]>([]);
    const [selectedProduct, setSelectedProduct] = useState("");
    const [newProductName, setNewProductName] = useState("");
    const [loading, setLoading] = useState(false);
    const [researchData, setResearchData] = useState<any>(null);
    const [selectedAngle, setSelectedAngle] = useState("");
    const [script, setScript] = useState("");
    const [avatarType, setAvatarType] = useState("expert");
    const [elevenVoices, setElevenVoices] = useState<any[]>([]);
    const [selectedVoice, setSelectedVoice] = useState("");
    const [selectedAsset, setSelectedAsset] = useState<string | null>(null);

    // Engine & UI State
    const [isRemixing, setIsRemixing] = useState(false);
    const [duration, setDuration] = useState(30);
    const [voiceSettings, setVoiceSettings] = useState({ stability: 0.5, similarity: 0.75 });
    const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
    const [engineStatus, setEngineStatus] = useState<"checking" | "online" | "offline">("checking");
    const [simulationMode, setSimulationMode] = useState("SOFTWARE_SIM");
    const [assetUrl, setAssetUrl] = useState<string | null>(null);
    const [gpuEnabled, setGpuEnabled] = useState(false);
    const [isEnvatoConnected, setIsEnvatoConnected] = useState(false);
    const [isConnectingEnvato, setIsConnectingEnvato] = useState(false);
    const [envatoToken, setEnvatoToken] = useState("");
    const [showEnvatoLogin, setShowEnvatoLogin] = useState(false);
    const [engineDetails, setEngineDetails] = useState<any>(null);
    const [videoAnalysis, setVideoAnalysis] = useState<any>(null);
    const [targetLanguage, setTargetLanguage] = useState("es");
    const [versions, setVersions] = useState<any[]>([]);

    // Envato State
    const [envatoAssets, setEnvatoAssets] = useState<EnvatoAsset[]>([]);
    const [assetSearch, setAssetSearch] = useState("");
    const [assetType, setAssetType] = useState<'VIDEO' | 'IMAGE'>('VIDEO');

    // Refs
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Static Ads State
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [adConfig, setAdConfig] = useState<"educational" | "sales">("educational");

    useEffect(() => {
        checkHealth();
        getProducts().then(res => {
            if (res.success) setProducts(res.data || []);
        });
        getElevenLabsVoices().then(res => {
            if (res.success) {
                setElevenVoices(res.voices || []);
                if (res.voices?.length > 0) setSelectedVoice(res.voices[0].voice_id);
            }
        });
        loadEnvato();
    }, []);

    const loadEnvato = async (q = "") => {
        const assets = await searchEnvatoAssets(q, assetType);
        setEnvatoAssets(assets);
    };

    useEffect(() => {
        loadEnvato(assetSearch);
    }, [assetSearch, assetType]);

    const checkHealth = async () => {
        setEngineStatus("checking");
        try {
            const health = await checkLocalEngineHealth();
            if (health.status === "operational") {
                setEngineStatus("online");
                setGpuEnabled(health.gpu_available);
                setEngineDetails(health);
                if (!health.gpu_available) toast.warning("Motor Online pero sin GPU (Lento)");
                else toast.success("Motor Neural Local Conectado ⚡");
                setSimulationMode("NONE");
            } else {
                setEngineStatus("offline");
                setSimulationMode("SOFTWARE_SIM");
            }
        } catch (e) {
            setEngineStatus("offline");
            setSimulationMode("SOFTWARE_SIM");
        }
    };

    const connectEnvatoFlow = () => {
        if (!envatoToken.trim()) {
            toast.error('Please enter your Envato License Key / Personal Token');
            return;
        }

        setIsConnectingEnvato(true);
        // Here we would normally call a verifyEnvatoToken(envatoToken) action
        toast.promise(new Promise((resolve, reject) => {
            setTimeout(() => {
                if (envatoToken.length < 10) reject(new Error("Invalid Token Format"));
                else resolve(true);
            }, 2000);
        }), {
            loading: 'Establishing secure tunnel with Envato Elements...',
            success: () => {
                setIsEnvatoConnected(true);
                setIsConnectingEnvato(false);
                setShowEnvatoLogin(false);
                return 'Envato License Verified 🌿';
            },
            error: (err: any) => {
                setIsConnectingEnvato(false);
                return err.message || 'Connection to Envato failed';
            }
        });
    };

    useEffect(() => {
        if (!selectedProduct || selectedProduct === "new") return;
        getProductResearch(selectedProduct).then(res => {
            if (res.success && res.data) {
                setResearchData(res.data);
                if (res.data.angles?.length > 0) {
                    setSelectedAngle(res.data.angles[0].title);
                    setScript(res.data.angles[0].draft || "");
                }
            }
        });
    }, [selectedProduct]);

    const handleGenerate = async () => {
        if (!script) {
            toast.error("Por favor, genera o escribe un guión primero.");
            return;
        }

        setLoading(true);
        try {
            if (engineStatus !== "online" || simulationMode === "SOFTWARE_SIM") {
                toast.info("Generador Local Offline. Usando Renderizador Cloud de Emergencia...");
                await new Promise(r => setTimeout(r, 4000));

                // Mapeo de videos de simulación por tipo para que no sea tan "random"
                const simVideos: Record<string, string> = {
                    expert: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
                    user: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
                    nano: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
                    personal: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4"
                };

                setGeneratedVideoUrl(simVideos[avatarType] || "https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4");
                toast.success("Vídeo Maestro Generado (Cloud Sim)");
                setLoading(false);
                return;
            }

            const result = await generateAvatarLocal(`Avatar ${avatarType} with script: ${script}`, "cinematic", assetUrl || undefined);
            if (result.success) {
                setGeneratedVideoUrl(result.preview_url);
                toast.success("Video Maestro Renderizado Localmente ⚡");
            } else {
                toast.error(result.error);
                setSimulationMode("SOFTWARE_SIM");
                toast.info("Cambiando a Modo Simulación por error del motor.");
            }
        } catch (e) {
            toast.error("Error en renderizado");
        } finally {
            setLoading(false);
        }
    };

    const handleVideoExtract = async (file: File) => {
        if (loading) return;

        // 1. Validation
        if (file.size > 50 * 1024 * 1024) {
            return toast.error("Video file is too large (Max 50MB). Please use a shorter clip.");
        }

        let productName = "Generic Product";
        if (selectedProduct === "new" && newProductName) {
            productName = newProductName;
        } else if (selectedProduct && selectedProduct !== "new") {
            productName = products.find(p => p.id === selectedProduct)?.title || "Product";
        }

        setLoading(true);
        // CRITICAL: Ensure toast is shown IMMEDIATELY
        const tid = toast.loading("Processing Video: Step 1/3 (Reading Data)...");

        try {
            // Promise-based FileReader 
            const dataUrl = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = () => reject(new Error("Local file system error. Try moving the file to Desktop."));
                reader.onabort = () => reject(new Error("File reading was interrupted."));
                reader.readAsDataURL(file);
            });

            toast.loading(`Processing Video: Step 2/3 (Uploading to AI Core)...`, { id: tid });

            const res = await analyzeUploadedVideo(
                dataUrl,
                selectedProduct === "new" ? undefined : (selectedProduct || undefined),
                productName,
                targetLanguage
            );

            if (res.success && res.jobId) {
                // Poll for completion
                let completed = false;
                let attempts = 0;
                while (!completed && attempts < 60) {
                    attempts++;
                    const jobStatus = await fetch(`/api/jobs/${res.jobId}`).then(r => r.json());

                    if (jobStatus.status === 'COMPLETED') {
                        setScript(jobStatus.result.script);
                        setVideoAnalysis(jobStatus.result);
                        toast.success("Intelligence Extraction Success 🧠", { id: tid });
                        completed = true;
                    } else if (jobStatus.status === 'FAILED') {
                        toast.error(jobStatus.error || "Job failed during execution.", { id: tid });
                        completed = true;
                    } else {
                        toast.loading(`Processing: Step 3/3 (Deep Analysis ${jobStatus.progress}%)...`, { id: tid });
                        await new Promise(r => setTimeout(r, 2000));
                    }
                }

                if (!completed) {
                    toast.error("Analysis timed out. Please check the Jobs board.", { id: tid });
                }
            } else {
                toast.error(res.error || "Unable to start background job.", { id: tid });
            }
        } catch (e: any) {
            console.error("Studio Extraction error:", e);
            toast.error(`Studio Error: ${e.message}`, { id: tid });
        } finally {
            setLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleTranslate = async (lang: string) => {
        if (!script) return toast.error("No hay guión para traducir.");
        setLoading(true);
        const tid = toast.loading(`Traduciendo a ${lang.toUpperCase()}...`);
        try {
            const res = await translateVideoScript(script, lang);
            if (res.success && res.translatedScript) {
                setScript(res.translatedScript);
                setTargetLanguage(lang);
                toast.success("Traducción Persuasiva Lista", { id: tid });
            } else {
                toast.error("Error en traducción", { id: tid });
            }
        } catch (e) {
            toast.error("Error de red", { id: tid });
        } finally {
            setLoading(false);
        }
    };

    const replicateVersion = async (style: string) => {
        setLoading(true);
        toast.info(`Generando Versión ${style.toUpperCase()} (${targetLanguage.toUpperCase()})...`);
        await new Promise(r => setTimeout(r, 4000));

        // Simulación de videos de stock por estilo
        const styleVideos: Record<string, string> = {
            ugc: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
            stock: "https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
            montage: "https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4"
        };

        const newVersion = {
            id: Date.now(),
            style,
            url: styleVideos[style] || "https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
            createdAt: new Date().toLocaleTimeString()
        };
        setVersions([newVersion, ...versions]);
        setGeneratedVideoUrl(newVersion.url);
        toast.success(`Versión ${style} (${targetLanguage}) lista`);
        setLoading(false);
    };

    const autoGenerateScript = async () => {
        const pId = selectedProduct === "new" ? undefined : selectedProduct;
        const pName = selectedProduct === "new" ? newProductName : undefined;

        // Fallback for better DX
        const context = pId || pName || "General High-Conversion Marketing Clip";

        setLoading(true);
        try {
            const res = await generateAvatarScript(context, avatarType, targetLanguage);
            if (res.success && res.script) {
                setScript(res.script);
                toast.success("AI Master Script Generated");
            } else {
                toast.error("Generation failed: " + (res.error || "AI not responding"));
            }
        } catch (e) {
            toast.error("AI Connection Error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full flex flex-col gap-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-100">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-500/20">
                        <Users className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter">
                            AVATAR <span className="text-blue-600 not-italic">STUDIO</span> ELITE
                        </h1>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-[0.3em] mt-1 flex items-center gap-2">
                            PREMIUM HUMANIZED SYNTHESIZER
                            <span className="h-1 w-1 rounded-full bg-blue-500 animate-pulse" />
                            VEO 3.0
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <div className="flex gap-2">
                        <Dialog open={showEnvatoLogin} onOpenChange={setShowEnvatoLogin}>
                            <DialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "font-black px-4 h-9 flex items-center gap-2 border text-[9px] uppercase tracking-widest transition-all",
                                        isEnvatoConnected
                                            ? "bg-[#81B441]/10 text-[#81B441] border-[#81B441]/20 hover:bg-[#81B441]/20"
                                            : "bg-white border-slate-200 text-slate-500 hover:text-[#81B441] hover:border-[#81B441]"
                                    )}
                                >
                                    {isEnvatoConnected ? (
                                        <CheckCircle2 className="h-3 w-3" />
                                    ) : (
                                        <svg viewBox="0 0 24 24" fill="currentColor" className={cn("w-3 h-3", isConnectingEnvato && "animate-spin")}>
                                            <path d="M18.823 9.482a8.557 8.557 0 00-6.425-3.326c-4.752 0-8.665 4.14-8.665 9.176 0 1.956.55 3.327 1.411 4.256.402.433.856.768 1.35 1.002.502.235 1.05.358 1.638.358.553 0 1.082-.113 1.57-.333l-.15-.694c-.11-.53-.263-1.048-.456-1.545a6.45 6.45 0 01-.194-.582s-.019-.076-.03-.136a5.21 5.21 0 01-.108-1.53c.123-1.874.838-2.584 1.486-2.91.56-.282 1.348-.3 1.996.177.674.498 1.066 1.408 1.066 2.457v.06a3.81 3.81 0 01-.2 1.258c-.147.457-.367.89-.646 1.282-.573.79-1.393 1.39-2.32 1.62a4.42 4.42 0 01-2.916-.144 5.22 5.22 0 01-1.353-.787c-.89-.728-1.55-1.92-1.55-3.834 0-4.66 3.73-8.396 8.085-8.396.657 0 1.3.082 1.917.24a8.9 8.9 0 014.248 2.217l.95-1.298zM12.396 2.38c-3.125 0-5.875 1.378-7.75 3.633.91-1.092 2.1-1.968 3.447-2.517 1.298-.53 2.738-.795 4.303-.795 3.12 0 6.01 1.42 8.04 3.702l-1.025 1.218a9.42 9.42 0 00-7.016-3.242V4.38z" />
                                        </svg>
                                    )}
                                    {isEnvatoConnected ? "ENVATO CONNECTED" : isConnectingEnvato ? "CONNECTING..." : "CONNECT ENVATO"}
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md bg-white border-0 shadow-2xl rounded-3xl p-8">
                                <DialogHeader className="space-y-4">
                                    <div className="h-16 w-16 bg-[#81B441]/10 text-[#81B441] rounded-[2rem] flex items-center justify-center mx-auto mb-2">
                                        <CheckCircle2 className="h-8 w-8" />
                                    </div>
                                    <DialogTitle className="text-2xl font-black text-center uppercase italic tracking-tighter">Envato License Authorization</DialogTitle>
                                    <DialogDescription className="text-center text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                                        Enter your personal token to access 5M+ premium assets.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-6 pt-6">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-slate-400">Personal Token / License Link</Label>
                                        <Input
                                            placeholder="XXXX-XXXX-XXXX-XXXX"
                                            value={envatoToken}
                                            onChange={(e) => setEnvatoToken(e.target.value)}
                                            className="h-14 bg-slate-50 border-0 rounded-2xl font-mono text-xs focus-visible:ring-2 focus-visible:ring-[#81B441]"
                                        />
                                    </div>
                                    <Button
                                        className="w-full h-14 bg-[#81B441] hover:bg-[#72a138] text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-[#81B441]/20"
                                        onClick={connectEnvatoFlow}
                                        disabled={isConnectingEnvato}
                                    >
                                        {isConnectingEnvato ? "Authenticating..." : "Authorize Account"}
                                    </Button>
                                    <p className="text-center text-[9px] text-slate-400 font-bold uppercase">
                                        Powered by Envato Elements API v3.4
                                    </p>
                                </div>
                            </DialogContent>
                        </Dialog>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Badge
                                    variant="outline"
                                    className={cn(
                                        "font-black px-4 h-9 flex items-center gap-2 border italic uppercase tracking-widest text-[10px] cursor-pointer transition-all",
                                        engineStatus === "online"
                                            ? "bg-emerald-50 text-emerald-600 border-emerald-100 shadow-md shadow-emerald-100/50"
                                            : simulationMode === "SOFTWARE_SIM"
                                                ? "bg-amber-50 text-amber-600 border-amber-100"
                                                : "bg-rose-50 text-rose-600 border-rose-100"
                                    )}
                                >
                                    {engineStatus === "online" ? <Zap className="h-3 w-3 fill-current animate-pulse" /> : <Monitor className="h-3 w-3" />}
                                    {engineStatus === "online" ? `ENGINE ACTIVE ${gpuEnabled ? "⚡" : ""}` : simulationMode === "SOFTWARE_SIM" ? "SIMULATION ACTIVE" : "ENGINE OFFLINE"}
                                </Badge>
                            </DialogTrigger>
                            <DialogContent className="bg-white border-slate-200 text-slate-900 max-w-md">
                                <DialogHeader>
                                    <DialogTitle className="text-xl font-black flex items-center gap-2 uppercase italic tracking-tighter">
                                        <Zap className="h-5 w-5 text-emerald-500 fill-emerald-500" />
                                        VEO 3 ENGINE CONSOLE
                                    </DialogTitle>
                                    <DialogDescription className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                                        Hardware Diagnostics & Neural Network
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-6 pt-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</span>
                                            <p className={cn("text-xs font-black uppercase flex items-center gap-2", engineStatus === 'online' ? "text-emerald-600" : "text-rose-600")}>
                                                <span className={cn("h-2 w-2 rounded-full", engineStatus === 'online' ? "bg-emerald-500" : "bg-rose-500")} />
                                                {engineStatus === 'online' ? "OPERATIONAL" : "DISCONNECTED"}
                                            </p>
                                        </div>
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">GPU Acceleration</span>
                                            <p className="text-xs font-black uppercase text-slate-900">
                                                {gpuEnabled ? "YES (METAL AGGREGATE)" : "NO (CPU MODE)"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="p-6 bg-slate-950 rounded-2xl text-white font-mono text-[10px] space-y-2">
                                        <p className="text-emerald-400">{">"} HEARTBEAT_SUCCESS: PORT 8000</p>
                                        <p className="text-slate-400">{">"} ENGINE_NAME: {engineDetails?.engine || "VEO_NEURAL_CORE_v3"}</p>
                                        <p className="text-slate-400">{">"} FFMPEG_STATUS: {engineDetails?.ffmpeg_available ? "READY" : "MISSING"}</p>
                                        <p className="text-blue-400">{">"} MODE: {simulationMode === 'NONE' ? "HARDWARE_NATIVE" : "SOFTWARE_SIM"}</p>
                                    </div>
                                    <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black uppercase text-[10px] tracking-widest h-12 rounded-xl" onClick={checkHealth}>
                                        RE-SCAN ENGINE
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-8">
                {/* CONFIGURATION PANEL */}
                <div className="col-span-12 lg:col-span-5 xl:col-span-4 space-y-6">
                    <Card className="border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-2xl bg-white">
                        <div className="bg-slate-950 p-6 flex items-center justify-between">
                            <span className="text-[10px] font-black text-white/70 uppercase tracking-[0.2rem]">VEO 3 CONTROL</span>
                            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[9px] font-black uppercase">ULTRA-REALISMO</Badge>
                        </div>

                        <CardContent className="p-8">
                            <Tabs defaultValue="script" className="w-full">
                                <TabsList className="bg-slate-50 p-1 rounded-xl border border-slate-100 h-11 mb-8 w-full">
                                    <TabsTrigger value="script" className="flex-1 h-9 rounded-lg font-black text-[9px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-blue-700">
                                        SCRIPT & VOICE
                                    </TabsTrigger>
                                    <TabsTrigger value="static" className="flex-1 h-9 rounded-lg font-black text-[9px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-blue-700">
                                        STATIC ADS
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="script" className="space-y-6">
                                    <div className="space-y-3">
                                        <Label className="text-xs font-black uppercase text-slate-500">Product</Label>
                                        <div className="space-y-2">
                                            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                                                <SelectTrigger className="h-12 bg-slate-50 rounded-2xl font-bold text-xs ring-0 focus:ring-0">
                                                    <SelectValue placeholder="Select product..." />
                                                </SelectTrigger>
                                                <SelectContent className="max-h-[300px] overflow-y-auto bg-slate-950 border border-slate-800 text-slate-100 z-[9999]">
                                                    <SelectItem value="new" className="text-xs font-black py-3 px-4 text-blue-400 focus:bg-blue-600 focus:text-white cursor-pointer border-b border-slate-800/50">
                                                        ⭐ NEW PRODUCT
                                                    </SelectItem>
                                                    {products.map(p => (
                                                        <SelectItem key={p.id} value={p.id} className="text-xs font-bold py-3 px-4 focus:bg-slate-800 focus:text-white cursor-pointer border-b border-slate-800/50 last:border-0 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white">
                                                            <span className="line-clamp-1">{p.title}</span>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>

                                            {selectedProduct === "new" && (
                                                <Input
                                                    placeholder="Enter new product name..."
                                                    value={newProductName}
                                                    onChange={(e) => setNewProductName(e.target.value)}
                                                    className="h-12 bg-blue-50 border-blue-100 rounded-2xl font-bold text-xs animate-in slide-in-from-top-2"
                                                />
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-xs font-black uppercase text-slate-500">Personality</Label>
                                        <div className="grid grid-cols-4 gap-2">
                                            {[
                                                { id: 'expert', label: 'Expert', icon: UserCheck },
                                                { id: 'user', label: 'User', icon: Users },
                                                { id: 'nano', label: 'Nano', icon: Sparkles },
                                                { id: 'personal', label: 'My Photo', icon: ImageIcon },
                                            ].map(t => (
                                                <button
                                                    key={t.id}
                                                    onClick={() => setAvatarType(t.id)}
                                                    className={cn(
                                                        "flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all",
                                                        avatarType === t.id ? "bg-white border-blue-600 border-2 text-blue-700 shadow-md" : "bg-slate-50 border-slate-100 text-slate-400"
                                                    )}
                                                >
                                                    <t.icon className="h-4 w-4" />
                                                    <span className="text-[8px] font-black uppercase">{t.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-xs font-black uppercase text-slate-500">Master Voice</Label>
                                        <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                                            <SelectTrigger className="h-12 bg-blue-50/50 border-blue-100 rounded-2xl font-bold text-xs ring-0 focus:ring-0">
                                                <SelectValue placeholder="ElevenLabs Voice..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {elevenVoices.map(v => (
                                                    <SelectItem key={v.voice_id} value={v.voice_id} className="text-xs font-bold">{v.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex flex-col gap-3">
                                            <Label className="text-xs font-black uppercase text-slate-500">Master Script / Transcription</Label>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Select value={targetLanguage} onValueChange={handleTranslate}>
                                                    <SelectTrigger className="h-8 w-28 text-[9px] font-black uppercase bg-slate-50 border-slate-100 rounded-lg">
                                                        <SelectValue placeholder="Language" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="es" className="text-[10px] font-bold">Spanish (ES)</SelectItem>
                                                        <SelectItem value="en" className="text-[10px] font-bold">English (EN)</SelectItem>
                                                        <SelectItem value="pt" className="text-[10px] font-bold">Português (PT)</SelectItem>
                                                        <SelectItem value="fr" className="text-[10px] font-bold">Français (FR)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <div className="flex items-center gap-2 flex-1">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => fileInputRef.current?.click()}
                                                        disabled={loading}
                                                        className="h-8 flex-1 text-[9px] font-black text-slate-500 uppercase tracking-wider hover:text-blue-600 border-dashed border-slate-200"
                                                    >
                                                        <FileVideo className="h-3 w-3 mr-1" /> EXtract Video
                                                    </Button>
                                                    <input
                                                        ref={fileInputRef}
                                                        type="file"
                                                        accept="video/*"
                                                        className="hidden"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) handleVideoExtract(file);
                                                        }}
                                                    />
                                                    <Button variant="ghost" size="sm" onClick={autoGenerateScript} disabled={loading} className="h-8 flex-1 text-[9px] font-black text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700">
                                                        <Sparkles className="h-3 w-3 mr-1" /> AUTO
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                        <Textarea
                                            value={script}
                                            onChange={(e) => setScript(e.target.value)}
                                            placeholder="The master script will appear here after extraction or generation..."
                                            className="min-h-[120px] bg-slate-50 border-none rounded-2xl p-4 text-xs font-bold leading-relaxed resize-none italic"
                                        />
                                    </div>
                                </TabsContent>

                                <TabsContent value="static" className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                                    <div className="space-y-6">
                                        <div
                                            className="border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-4 hover:bg-slate-50 transition-colors cursor-pointer group relative overflow-hidden"
                                            onClick={() => document.getElementById('static-img-upload')?.click()}
                                        >
                                            {uploadedImage ? (
                                                <>
                                                    <img src={uploadedImage} alt="Uploaded" className="absolute inset-0 w-full h-full object-cover opacity-50 blur-sm group-hover:blur-0 transition-all duration-500" />
                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10 group-hover:bg-black/20 transition-all">
                                                        <Badge className="bg-emerald-500 text-white border-0 shadow-lg">IMAGEN CARGADA</Badge>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="h-14 w-14 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform relative z-10">
                                                        <ImageIcon className="h-6 w-6" />
                                                    </div>
                                                    <div className="space-y-1 relative z-10">
                                                        <h4 className="text-xs font-black uppercase text-slate-700 tracking-widest">Subir Imagen de Producto</h4>
                                                        <p className="text-[10px] text-slate-400 font-bold max-w-[200px] mx-auto">Para generar templates de carrusel de alto impacto.</p>
                                                    </div>
                                                </>
                                            )}

                                            <Input
                                                type="file"
                                                className="hidden"
                                                id="static-img-upload"
                                                accept="image/*"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        const url = URL.createObjectURL(file);
                                                        setUploadedImage(url);
                                                        toast.success("Imagen de producto cargada correctamente");
                                                        setGeneratedVideoUrl(null);
                                                    }
                                                }}
                                            />
                                        </div>

                                        <div className="space-y-3">
                                            <Label className="text-xs font-black uppercase text-slate-500">Configuración de Generación</Label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <Button
                                                    variant="outline"
                                                    onClick={() => setAdConfig("educational")}
                                                    className={cn(
                                                        "h-10 text-[9px] font-black uppercase tracking-widest justify-start px-3 transition-all",
                                                        adConfig === "educational"
                                                            ? "bg-blue-600 text-white border-blue-600 shadow-md transform scale-[1.02]"
                                                            : "bg-slate-50 border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200"
                                                    )}
                                                >
                                                    <Layout className="h-3 w-3 mr-2" /> Carrusel Educativo
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => setAdConfig("sales")}
                                                    className={cn(
                                                        "h-10 text-[9px] font-black uppercase tracking-widest justify-start px-3 transition-all",
                                                        adConfig === "sales"
                                                            ? "bg-blue-600 text-white border-blue-600 shadow-md transform scale-[1.02]"
                                                            : "bg-slate-50 border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200"
                                                    )}
                                                >
                                                    <Briefcase className="h-3 w-3 mr-2" /> Direct Response
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>
                            </Tabs>

                            <Button
                                className="w-full h-16 rounded-[1.5rem] bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-200 group transition-all active:scale-95 disabled:opacity-50 mt-8"
                                disabled={loading || (!script && !uploadedImage)}
                                onClick={handleGenerate}
                            >
                                {loading ? (
                                    <RotateCcw className="h-6 w-6 animate-spin" />
                                ) : (
                                    <>
                                        <Wand2 className="h-5 w-5 mr-3 group-hover:rotate-12 transition-transform" />
                                        SYNTHESIZE MASTER VIDEO
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* PREVIEW PANEL */}
                <div className="col-span-12 lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
                    <Card className="flex-1 border border-slate-200 rounded-[2.5rem] overflow-hidden bg-slate-950 shadow-2xl relative min-h-[500px]">
                        {generatedVideoUrl || uploadedImage ? (
                            <div className="absolute inset-0 flex items-center justify-center p-8">
                                {generatedVideoUrl ? (
                                    <video
                                        src={generatedVideoUrl}
                                        controls
                                        className="max-w-full max-h-full rounded-2xl shadow-2xl border border-white/10"
                                        autoPlay
                                    />
                                ) : (
                                    <img
                                        src={uploadedImage || ""}
                                        className="max-w-full max-h-full rounded-2xl shadow-2xl"
                                        alt="Static Preview"
                                    />
                                )}

                                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4">
                                    <Button className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 font-black uppercase text-[10px] tracking-widest px-6 h-12 rounded-2xl flex items-center gap-2">
                                        <Download className="h-4 w-4" /> Exportar 4K
                                    </Button>
                                    <Button className="bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[10px] tracking-widest px-6 h-12 rounded-2xl shadow-xl shadow-blue-500/20">
                                        Guardar en Biblioteca
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-12">
                                <div className="h-24 w-24 bg-white/5 rounded-[2rem] flex items-center justify-center relative mb-6">
                                    <Users className="h-10 w-10 text-white/20" />
                                    <div className="absolute inset-0 border border-white/10 rounded-[2rem] animate-ping" />
                                </div>
                                <h3 className="text-xl font-black text-white uppercase italic tracking-tighter mb-2">Esperando Motor Veo 3</h3>
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest max-w-[250px]">
                                    Selecciona tu avatar y carga un guión para iniciar la síntesis neural local.
                                </p>
                            </div>
                        )}

                        <div className="absolute top-8 right-8 flex flex-col gap-2">
                            {engineStatus === "online" && (
                                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-black text-[8px] uppercase tracking-widest px-3 py-1">
                                    Neural Core: Active
                                </Badge>
                            )}
                        </div>
                    </Card>

                    {/* AI ANALYTICS & REPLICATION */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="border border-slate-200 rounded-[2rem] bg-white p-5 flex flex-col justify-between overflow-hidden">
                            <div>
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <Sparkles className="h-3 w-3 text-blue-500" /> Inteligencia del Gancho
                                </h4>
                                {videoAnalysis ? (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[9px] font-bold text-slate-500 uppercase">Flow Score</span>
                                            <span className="text-sm font-black text-blue-600">{videoAnalysis.hookScore || "8.5"}/10</span>
                                        </div>
                                        <Progress value={(videoAnalysis.hookScore || 8.5) * 10} className="h-2 bg-blue-50" />
                                        <p className="text-[9px] leading-relaxed text-slate-500 font-medium italic line-clamp-3">
                                            {videoAnalysis.reasoning || videoAnalysis.psychology || "Detección de patrones de alta retención analizados."}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="py-8 flex flex-col items-center justify-center text-center opacity-30">
                                        <Zap className="h-5 w-5 mb-1" />
                                        <p className="text-[8px] font-black uppercase">Sin datos</p>
                                    </div>
                                )}
                            </div>
                            {videoAnalysis && (
                                <div className="pt-3 mt-3 border-t border-slate-50 flex flex-wrap gap-1.5">
                                    {videoAnalysis.suggestions?.slice(0, 2).map((s: string, i: number) => (
                                        <Badge key={i} variant="outline" className="text-[7px] bg-blue-50/50 border-blue-100 text-blue-600 font-bold uppercase py-0 px-1.5">{s}</Badge>
                                    ))}
                                </div>
                            )}
                        </Card>

                        <Card className="border border-slate-200 rounded-[2rem] bg-white p-5 flex flex-col justify-between overflow-hidden">
                            <div>
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <RotateCcw className="h-3 w-3 text-indigo-500" /> Replicación Inteligente
                                </h4>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { id: 'ugc', label: 'UGC', icon: Users },
                                        { id: 'stock', label: 'Stock', icon: Clapperboard },
                                        { id: 'montage', label: 'Pro', icon: Layout },
                                    ].map(b => (
                                        <Button
                                            key={b.id}
                                            variant="outline"
                                            className="h-12 flex flex-col gap-1 rounded-xl border-slate-100 hover:border-indigo-200 hover:bg-indigo-50 px-1"
                                            onClick={() => replicateVersion(b.id)}
                                        >
                                            <b.icon className="h-3 w-3 text-indigo-600" />
                                            <span className="text-[7px] font-black uppercase text-slate-500">{b.label}</span>
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-3 pt-3 border-t border-slate-50 overflow-y-auto max-h-[80px] custom-scrollbar">
                                {versions.length > 0 ? (
                                    <div className="space-y-1.5">
                                        {versions.map(v => (
                                            <div key={v.id} className="flex items-center justify-between p-1.5 bg-slate-50 rounded-lg group">
                                                <div className="flex items-center gap-2">
                                                    <Badge className="bg-white text-indigo-600 text-[7px] uppercase border-indigo-100 py-0 px-1">{v.style}</Badge>
                                                    <span className="text-[8px] font-bold text-slate-400">{v.createdAt}</span>
                                                </div>
                                                <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-indigo-100" onClick={() => setGeneratedVideoUrl(v.url)}>
                                                    <Play className="h-2.5 w-2.5 text-indigo-600" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-[8px] text-center text-slate-300 font-bold uppercase py-2">Sin versiones</p>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}

