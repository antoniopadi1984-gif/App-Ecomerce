"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
    Users, Plus, Sparkles, Loader2, Trash2, Video,
    User, Zap, Wand2, Play, Save, Settings, CheckCircle2,
    MessageSquare, Volume2, Mic2, Globe, ChevronRight, AlertCircle, Eye, Download,
    Fingerprint, ShieldCheck, Database, Beaker, FileVideo, History, Radio, RefreshCw, ExternalLink
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PageShell } from "@/components/ui/PageShell";
import { ModuleHeader } from "@/components/ui/ModuleHeader";
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from "@/lib/styles/tokens";
import {
    saveAvatarProfile,
    getAvatarProfiles,
    deleteAvatarProfile,
    getElevenLabsVoices,
    generateAvatarScript,
    checkLocalEngineHealth,
    getFirstStoreId,
    retryAvatarGeneration,
    createEvolutionPair,
    cleanupLegacyAvatars,
    createAvatarFromResearchAction,
    getProductDriveFolder,
    generateAvatarMotion,
    generateScientificSimulation,
    getAvatarAssets
} from "./actions";
import { CreativeFactoryPanel } from "@/components/creative/CreativeFactoryPanel";

export default function AvatarStudioPage({ isEmbedded = false }: { isEmbedded?: boolean }) {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-50/50 flex flex-col items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-rose-500" /></div>}>
            <AvatarStudioContent isEmbedded={isEmbedded} />
        </Suspense>
    );
}

function AvatarStudioContent({ isEmbedded }: { isEmbedded: boolean }) {
    const [storeId, setStoreId] = useState<string | null>(null);
    const [avatars, setAvatars] = useState<any[]>([]);
    const [voices, setVoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [activeTab, setActiveTab] = useState("profiles");
    const [qualityTier, setQualityTier] = useState<'balanced' | 'premium'>('premium');
    const [engineStatus, setEngineStatus] = useState<"online" | "offline" | "checking">("checking");
    const [isSimulating, setIsSimulating] = useState<string | null>(null);
    const [avatarAssets, setAvatarAssets] = useState<{ creatives: any[], assets: any[] }>({ creatives: [], assets: [] });
    const searchParams = useSearchParams();

    // Profile Form State
    const [formData, setFormData] = useState({
        name: '',
        sex: 'FEMALE',
        ageRange: '35-45',
        region: 'España',
        voiceId: '',
        hasGreyHair: false,
        hasWrinkles: false,
        hasAcne: false,
        hasHairLoss: false,
        skinTone: 'CLARO',
        customPrompt: '',
        voiceStability: 0.5,
        voiceSimilarity: 0.75,
        voiceStyle: 0,
        voiceSpeakerBoost: true,
        voiceLanguage: 'es'
    });

    const [editingAvatarId, setEditingAvatarId] = useState<string | null>(null);

    // Script State
    const [selectedAvatar, setSelectedAvatar] = useState<any>(null);
    const [script, setScript] = useState("");
    const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);

    const [driveFolder, setDriveFolder] = useState<any>(null);

    useEffect(() => {
        loadData();
        checkHealth();
        loadDriveInfo();

        const interval = setInterval(() => {
            const hasGenerating = avatars.some(a => ['DRAFT', 'GENERATING_IMAGE'].includes(a.status));
            if (hasGenerating) {
                loadData();
            }
        }, 8000);

        return () => clearInterval(interval);
    }, [storeId, avatars]);

    const loadData = async () => {
        let currentStoreId = storeId;
        if (!currentStoreId) {
            const storeRes = await getFirstStoreId();
            if (storeRes.success && storeRes.id) {
                currentStoreId = storeRes.id;
                setStoreId(storeRes.id);
            } else return;
        }

        const [profilesRes, voicesRes] = await Promise.all([
            getAvatarProfiles(currentStoreId),
            getElevenLabsVoices()
        ]);

        if (profilesRes.success) setAvatars(profilesRes.data || []);
        if (voicesRes.success) setVoices(voicesRes.voices || []);
    };

    const checkHealth = async () => {
        const res = await checkLocalEngineHealth();
        setEngineStatus(res.status === "running" ? "online" : "offline");
    };

    const loadDriveInfo = async () => {
        const pid = searchParams.get("productId");
        if (pid) {
            const [driveRes, assetsRes] = await Promise.all([
                getProductDriveFolder(pid),
                getAvatarAssets(pid)
            ]);
            if (driveRes.success) setDriveFolder(driveRes.data);
            if (assetsRes.success) setAvatarAssets({ creatives: assetsRes.creatives || [], assets: assetsRes.assets || [] });
        } else {
            setDriveFolder(null);
        }
    };

    const handleCreateProfile = async () => {
        if (!formData.name || !storeId) {
            toast.error("Datos incompletos");
            return;
        }

        setLoading(true);
        try {
            const pid = searchParams.get("productId");
            const res = await saveAvatarProfile(storeId, {
                ...formData,
                id: editingAvatarId || undefined,
                productId: pid || undefined,
                tier: qualityTier
            } as any);

            if (res.success) {
                toast.success(qualityTier === 'premium' ? "Misión Iniciada" : "Avatar guardado");
                setIsAdding(false);
                setEditingAvatarId(null);
                setFormData({
                    name: '',
                    sex: 'FEMALE',
                    ageRange: '35-45',
                    region: 'España',
                    voiceId: '',
                    hasGreyHair: false,
                    hasWrinkles: false,
                    hasAcne: false,
                    hasHairLoss: false,
                    skinTone: 'CLARO',
                    customPrompt: '',
                    voiceStability: 0.5,
                    voiceSimilarity: 0.75,
                    voiceStyle: 0,
                    voiceSpeakerBoost: true,
                    voiceLanguage: 'es'
                });
                loadData();
            } else {
                toast.error(res.error);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleEditProfile = (avatar: any) => {
        const meta = JSON.parse(avatar.metadataJson || "{}");
        setFormData({
            name: avatar.name,
            sex: avatar.sex,
            ageRange: avatar.ageRange,
            region: avatar.region,
            voiceId: meta.voiceId || "",
            hasGreyHair: meta.traits?.hasGreyHair || false,
            hasWrinkles: meta.traits?.hasWrinkles || false,
            hasAcne: meta.traits?.hasAcne || false,
            hasHairLoss: meta.traits?.hasHairLoss || false,
            skinTone: meta.traits?.skinTone || 'CLARO',
            customPrompt: meta.customPrompt || '',
            voiceStability: meta.voiceSettings?.stability ?? 0.5,
            voiceSimilarity: meta.voiceSettings?.similarity ?? 0.75,
            voiceStyle: meta.voiceSettings?.style ?? 0,
            voiceSpeakerBoost: meta.voiceSettings?.use_speaker_boost ?? true,
            voiceLanguage: meta.voiceSettings?.language || 'es'
        });
        setEditingAvatarId(avatar.id);
        setIsAdding(true);
    };

    const handleDeleteProfile = async (id: string) => {
        if (!confirm("¿Deseas eliminar permanentemente este avatar?")) return;
        const res = await deleteAvatarProfile(id);
        if (res.success) {
            toast.success("Avatar eliminado");
            loadData();
        }
    };

    const handleGenerateVideo = async () => {
        if (!selectedAvatar || !script) return;
        setLoading(true);
        toast.info("Lanzando motor de Lipsync de alta fidelidad...");

        try {
            const res = await generateAvatarMotion(selectedAvatar.id, "", script);
            if (res.success && res.videoUrl) {
                setGeneratedVideoUrl(res.videoUrl);
                toast.success("Producción UGC completada");
                loadData();
            } else {
                toast.error(res.error || "Error en la síntesis");
            }
        } catch (e: any) {
            toast.error("Error crítico: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRunSimulation = async (mode: string) => {
        if (!selectedAvatar) {
            toast.error("Selecciona un avatar primero");
            return;
        }
        setIsSimulating(mode);
        toast.info(`Iniciando simulación ${mode}...`);

        try {
            const res = await generateScientificSimulation(selectedAvatar.id, mode);
            if (res.success) {
                toast.success("Simulación encolada. Revisa la sección de Activos en unos segundos.");
            } else {
                toast.error(res.error);
            }
        } catch (e: any) {
            toast.error("Error: " + e.message);
        } finally {
            setIsSimulating(null);
        }
    };

    const handleGenerateScript = async () => {
        if (!selectedAvatar) return;
        setLoading(true);
        const res = await generateAvatarScript(selectedAvatar.id, "Realista");
        setLoading(false);
        if (res.success && res.script) {
            setScript(res.script);
            toast.success("Guion generado");
        }
    };

    const handleCleanup = async () => {
        if (!confirm("¿Eliminar todos los avatares de prueba?")) return;
        setLoading(true);
        const res = await cleanupLegacyAvatars();
        if (res.success) {
            toast.success(`Limpieza completada: ${res.deletedCount} eliminados`);
            loadData();
        }
        setLoading(false);
    };

    const handleCreateFromResearch = async () => {
        if (!storeId) return;
        setLoading(true);
        const urlParams = new URLSearchParams(window.location.search);
        const pid = urlParams.get("productId") || "";

        const res = await createAvatarFromResearchAction(pid, storeId);
        setLoading(false);
        if (res.success) {
            toast.success("Avatar generado desde Research");
            loadData();
        } else {
            toast.error(res.error);
        }
    };

    const content = (
        <div className="flex flex-col h-full bg-slate-50">
            {!isEmbedded && (
                <ModuleHeader
                    title="Avatar Studio"
                    subtitle="PROTOCOLO DE ALTA FIDELIDAD"
                    icon={Users}
                    actions={
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2 bg-slate-50 px-3 h-8 rounded-lg border border-slate-200">
                                <div className={cn("w-1.5 h-1.5 rounded-full", engineStatus === "online" ? "bg-emerald-500 animate-pulse" : "bg-rose-500")} />
                                <span className="text-[8px] font-black uppercase tracking-tight text-slate-500">{engineStatus === "online" ? "ENGINE: ONLINE" : "ENGINE: OFFLINE"}</span>
                            </div>
                            <Button onClick={handleCleanup} variant="ghost" className="h-8 px-2 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-500">
                                <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button onClick={handleCreateFromResearch} variant="outline" className="h-8 border-rose-100 text-rose-500 hover:bg-rose-50 rounded-lg font-black px-3 text-[9px] uppercase tracking-widest gap-2">
                                <Database className="w-3.5 h-3.5" /> RESEARCH
                            </Button>
                            <Button onClick={() => setIsAdding(true)} className="bg-slate-900 text-white rounded-lg font-black px-4 h-8 shadow-sm hover:scale-[1.02] transition-all text-[9px] uppercase tracking-widest gap-2">
                                <Plus className="w-3.5 h-3.5 text-rose-500" /> RECLUTAR
                            </Button>
                        </div>
                    }
                />
            )}

            <main className={cn("flex-1", isEmbedded ? "p-0 space-y-4" : "p-4 space-y-6")}>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                    <TabsList className="bg-slate-100 p-1 rounded-xl border border-slate-200 w-fit flex gap-1">
                        <TabsTrigger value="profiles" className="rounded-lg px-4 py-1.5 text-[9px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm gap-2">
                            <Users className="w-3 h-3" /> BIBLIOTECA
                        </TabsTrigger>
                        <TabsTrigger value="creative_factory" className="rounded-lg px-4 py-1.5 text-[9px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm gap-2">
                            <Zap className="w-3 h-3 text-rose-500" /> FÁBRICA UGC
                        </TabsTrigger>
                        <TabsTrigger value="studio" className="rounded-lg px-4 py-1.5 text-[9px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm gap-2">
                            <Radio className="w-3 h-3 text-emerald-500" /> ESTUDIO EN VIVO
                        </TabsTrigger>
                        <TabsTrigger value="science" className="rounded-lg px-4 py-1.5 text-[9px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm gap-2">
                            <Beaker className="w-3 h-3 text-indigo-500" /> CIENCIA
                        </TabsTrigger>
                        <TabsTrigger value="assets" className="rounded-lg px-4 py-1.5 text-[9px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm gap-2">
                            <History className="w-3 h-3" /> HISTORIAL
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="profiles" className="outline-none">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-8 gap-3">
                            {avatars.map((a) => (
                                <div key={a.id} className="group relative rounded-xl border border-slate-200 overflow-hidden hover:border-rose-300 transition-all duration-300 bg-white flex flex-col shadow-sm">
                                    <div className="aspect-square bg-slate-50 relative overflow-hidden">
                                        {a.imageUrl ? <img src={a.imageUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" /> : <User className="w-6 h-6 text-slate-300 absolute inset-0 m-auto" />}

                                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-center items-center p-3 gap-2">
                                            <Button size="sm" className="w-full rounded-md text-[8px] font-black bg-white text-slate-900 h-6" onClick={() => handleEditProfile(a)}>EDITAR</Button>
                                            <Button size="sm" className="w-full rounded-md text-[8px] font-black bg-rose-500 text-white gap-1 h-6" onClick={() => createEvolutionPair(a.id).then(loadData)}>
                                                <Zap className="w-2 h-2 fill-white" /> EVOLUCIÓN
                                            </Button>
                                        </div>

                                        <Badge className={cn(
                                            "absolute top-1.5 left-1.5 text-[6px] font-black uppercase tracking-tight px-1.5 h-4 border-none",
                                            a.status === 'GENERATING_IMAGE' ? "bg-amber-400 text-slate-900 animate-pulse" : "bg-emerald-500 text-white"
                                        )}>
                                            {a.status === 'GENERATING_IMAGE' ? 'SYNC' : (a.evolutionStage || 'READY')}
                                        </Badge>
                                    </div>
                                    <div className="p-2">
                                        <h3 className="text-[9px] font-black text-slate-900 uppercase truncate leading-tight">{a.name}</h3>
                                        <p className="text-[7px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{a.region} • {a.ageRange}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="creative_factory" className="outline-none mt-4">
                        <CreativeFactoryPanel
                            productId={searchParams.get("productId") || ""}
                            productName="Producto"
                            onBatchCreated={() => setActiveTab("assets")}
                        />
                    </TabsContent>

                    <TabsContent value="studio" className="outline-none mt-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                            <div className="lg:col-span-4 space-y-3">
                                <Card className="rounded-3xl border-slate-200 overflow-hidden shadow-xl glass-card border-dashed">
                                    <CardHeader className="p-5 border-b border-slate-100/50 bg-slate-50/30">
                                        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Radio className="w-4 h-4 text-emerald-500 animate-pulse" /> SÍNTESIS UGC
                                            </div>
                                            <Badge variant="outline" className="text-[7px] border-emerald-100 text-emerald-600 bg-emerald-50/30">V.4.2</Badge>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-5 space-y-6">
                                        <div className="space-y-2">
                                            <Label className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                                                <User className="w-3 h-3" /> SUJETO DE PRUEBA
                                            </Label>
                                            <Select value={selectedAvatar?.id || ""} onValueChange={(id) => setSelectedAvatar(avatars.find(a => a.id === id))}>
                                                <SelectTrigger className="rounded-2xl h-11 bg-slate-50 border-slate-100 text-[11px] font-black uppercase tracking-widest shadow-inner px-4">
                                                    <SelectValue placeholder="SELECCIONAR..." />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-2xl border-slate-200 shadow-2xl">
                                                    {avatars.map(a => <SelectItem key={a.id} value={a.id} className="text-[10px] font-bold uppercase tracking-widest py-3">{a.name} ({a.region})</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between px-1">
                                                <Label className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                    <MessageSquare className="w-3 h-3" /> GUION DE VENTA
                                                </Label>
                                                <Button
                                                    variant="ghost"
                                                    className="h-5 px-2 text-[7px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 rounded-full"
                                                    onClick={handleGenerateScript}
                                                >
                                                    AUTO-GEN
                                                </Button>
                                            </div>
                                            <Textarea
                                                value={script}
                                                onChange={(e) => setScript(e.target.value)}
                                                className="min-h-[160px] rounded-2xl bg-slate-50/50 border-slate-100 p-4 text-[11px] font-medium leading-relaxed focus:bg-white transition-all shadow-inner"
                                                placeholder="Escribe el guion aquí..."
                                            />
                                        </div>

                                        <Button
                                            onClick={handleGenerateVideo}
                                            disabled={loading || !script || !selectedAvatar}
                                            className="w-full bg-slate-900 hover:bg-black h-12 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] text-white shadow-xl shadow-slate-900/10 active:scale-[0.98] transition-all gap-3"
                                        >
                                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />}
                                            LANZAR PRODUCCIÓN
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="lg:col-span-8">
                                <div className="bg-slate-900 aspect-video rounded-[2.5rem] border border-slate-800 shadow-2xl flex items-center justify-center overflow-hidden h-full min-h-[450px] relative">
                                    {generatedVideoUrl ? (
                                        <video src={generatedVideoUrl} controls className="w-full h-full object-contain" autoPlay />
                                    ) : (
                                        <div className="flex flex-col items-center gap-4 group">
                                            <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-500">
                                                <Video className="w-8 h-8 text-slate-600 group-hover:text-rose-500 transition-colors" />
                                            </div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600 animate-pulse">SALA DE PROYECCIÓN • STANDBY</p>
                                        </div>
                                    )}
                                    <div className="absolute top-4 right-4 flex gap-2">
                                        <Badge className="bg-black/40 border border-white/10 text-[7px] font-black uppercase tracking-widest text-emerald-400 py-1 px-3 rounded-full">LIVE PREVIEW</Badge>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="science" className="outline-none mt-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                            {[
                                { id: 'COLLAGEN', label: 'Producción de Colágeno', desc: 'Simulación médica de regeneración dérmica', icon: Sparkles, color: 'rose' },
                                { id: 'HAIR_GROWTH', label: 'Estimulación Capilar', desc: 'Timelapse de crecimiento folicular 8k', icon: Zap, color: 'amber' },
                                { id: 'WRINKLE_REDUCTION', label: 'Efecto Rejuvenecimiento', desc: 'Dermatología láser y alisado de finas líneas', icon: ShieldCheck, color: 'emerald' },
                                { id: 'BLOODSTREAM', label: 'Flujo Sanguíneo', desc: 'Viaje macroscópico por el sistema arterial', icon: Radio, color: 'indigo' },
                                { id: 'PRODUCT_USAGE', label: 'Interacción de Producto', desc: 'Efecto de aura y absorción celular', icon: Wand2, color: 'purple' }
                            ].map((sim) => (
                                <Card key={sim.id} className="rounded-3xl border-slate-100 hover:border-rose-300 transition-all cursor-pointer group shadow-sm bg-white hover:shadow-xl hover:-translate-y-1">
                                    <CardContent className="p-6 space-y-4">
                                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-all", `bg-${sim.color}-500/10 group-hover:bg-${sim.color}-500 group-hover:scale-110`)}>
                                            <sim.icon className={cn("w-6 h-6", `text-${sim.color}-500 group-hover:text-white`)} />
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="text-xs font-black uppercase tracking-tight text-slate-900">{sim.label}</h3>
                                            <p className="text-[9px] text-slate-400 font-bold leading-relaxed">{sim.desc}</p>
                                        </div>
                                        <Button
                                            onClick={() => handleRunSimulation(sim.id)}
                                            disabled={!!isSimulating || !selectedAvatar}
                                            className="w-full h-9 rounded-xl border border-slate-100 bg-slate-50 group-hover:bg-slate-900 group-hover:text-white text-[9px] font-black uppercase tracking-widest transition-all shadow-sm"
                                        >
                                            {isSimulating === sim.id ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Play className="w-3 h-3 mr-2" />}
                                            LANZAR SIMULACIÓN
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="assets" className="outline-none mt-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <Card className="rounded-[2.5rem] border-slate-100 glass-panel shadow-xl overflow-hidden min-h-[500px]">
                            <CardHeader className="p-8 border-b border-slate-100/50 flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-sm font-black uppercase tracking-tight italic">Biblioteca de Activos Generados</CardTitle>
                                    <CardDescription className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 mt-1">Historial completo de síntesis y simulaciones</CardDescription>
                                </div>
                                <Button variant="outline" className="h-8 rounded-xl text-[9px] font-black uppercase tracking-widest gap-2" onClick={loadDriveInfo}>
                                    <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} /> ACTUALIZAR
                                </Button>
                            </CardHeader>
                            <CardContent className="p-8">
                                {avatarAssets.creatives.length === 0 && avatarAssets.assets.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center opacity-40 min-h-[300px]">
                                        <div className="p-6 bg-slate-100 rounded-[2rem] border border-slate-200 mb-4">
                                            <Database className="w-12 h-12 text-slate-300" />
                                        </div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Sin activos recientes para este producto</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                                        {avatarAssets.creatives.map((c: any) => (
                                            <div key={c.id} className="group relative aspect-[9/16] bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-lg transition-all hover:scale-[1.02] hover:shadow-rose-500/10 hover:border-rose-500/30">
                                                {c.videoUrl && <video src={c.videoUrl} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />}
                                                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent">
                                                    <Badge className="bg-rose-500 text-white text-[6px] font-black mb-1">VIDEO UGC</Badge>
                                                    <p className="text-[8px] font-black text-white truncate uppercase tracking-tighter">{c.concept || 'Video Generado'}</p>
                                                </div>
                                                <Button size="icon" variant="ghost" className="absolute top-2 right-2 h-7 w-7 rounded-lg bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => window.open(c.videoUrl, '_blank')}>
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        ))}
                                        {avatarAssets.assets.map((a: any) => (
                                            <div key={a.id} className="group relative aspect-square bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden shadow-sm transition-all hover:border-indigo-300">
                                                <div className="w-full h-full flex items-center justify-center bg-slate-50">
                                                    <Beaker className="w-8 h-8 text-indigo-500/20" />
                                                </div>
                                                <div className="absolute inset-x-0 bottom-0 p-3 bg-white/90 border-t border-slate-100">
                                                    <Badge variant="outline" className="border-indigo-100 text-indigo-600 text-[6px] font-black mb-1 bg-indigo-50/30 uppercase">{a.mime || 'SIMULACIÓN'}</Badge>
                                                    <p className="text-[8px] font-black text-slate-900 truncate uppercase tracking-tighter">ID: {a.pathLocal.substring(0, 8)}</p>
                                                    <p className="text-[6px] text-slate-400 font-bold uppercase mt-0.5">{a.avatarProfile?.name}</p>
                                                </div>
                                                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <Button size="sm" variant="secondary" className="text-[8px] font-black rounded-lg h-7 px-3">VER STATUS</Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </main>

            {isAdding && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40">
                    <Card className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl shadow-xl border border-slate-200 bg-white p-5 space-y-5">
                        <header className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-3">
                                <Fingerprint className="h-5 w-5 text-rose-500" />
                                <h2 className="text-sm font-black uppercase tracking-tight">Bio-Métrica</h2>
                            </div>
                            <div className="flex bg-slate-100 p-1 rounded-lg">
                                <button onClick={() => setQualityTier('balanced')} className={cn("px-4 py-1.5 rounded-md text-[8px] font-black uppercase tracking-tight transition-all", qualityTier === 'balanced' ? "bg-white shadow-sm text-slate-900" : "text-slate-400")}>BALANCED</button>
                                <button onClick={() => setQualityTier('premium')} className={cn("px-4 py-1.5 rounded-md text-[8px] font-black uppercase tracking-tight transition-all", qualityTier === 'premium' ? "bg-slate-900 text-white shadow-sm" : "text-slate-400")}>PREMIUM</button>
                            </div>
                        </header>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <Label className="text-[9px] font-black uppercase text-slate-400">Nombre</Label>
                                    <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="rounded-lg border-slate-200 h-9 text-[11px] font-bold" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-[9px] font-black uppercase text-slate-400">Género</Label>
                                        <Select value={formData.sex} onValueChange={(v) => setFormData({ ...formData, sex: v })}>
                                            <SelectTrigger className="rounded-lg h-9 text-[11px] font-bold"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="FEMALE">FEM</SelectItem>
                                                <SelectItem value="MALE">MALE</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[9px] font-black uppercase text-slate-400">Edad</Label>
                                        <Select value={formData.ageRange} onValueChange={(v) => setFormData({ ...formData, ageRange: v })}>
                                            <SelectTrigger className="rounded-lg h-9 text-[11px] font-bold"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {['18-25', '25-35', '35-45', '45-55', '55+'].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[9px] font-black uppercase text-slate-400">Región</Label>
                                    <Input value={formData.region} onChange={(e) => setFormData({ ...formData, region: e.target.value })} className="rounded-lg border-slate-200 h-9 text-[11px] font-bold" />
                                </div>
                            </div>

                            <div className="bg-slate-50/50 p-4 rounded-2xl space-y-4">
                                <div className="space-y-1">
                                    <Label className="text-[9px] font-black uppercase text-slate-400">Voz Maestro</Label>
                                    <Select value={formData.voiceId} onValueChange={(v) => setFormData({ ...formData, voiceId: v })}>
                                        <SelectTrigger className="rounded-lg h-9 bg-white text-[10px] uppercase font-bold"><SelectValue placeholder="..." /></SelectTrigger>
                                        <SelectContent>
                                            {voices.map(v => <SelectItem key={v.voice_id} value={v.voice_id}>{v.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[9px] font-black uppercase text-slate-400">Prompt IA</Label>
                                    <Textarea value={formData.customPrompt} onChange={(e) => setFormData({ ...formData, customPrompt: e.target.value })} className="h-20 rounded-xl text-[10px] bg-white" />
                                </div>
                            </div>
                        </div>

                        <footer className="flex gap-3 pt-4">
                            <Button onClick={() => { setIsAdding(false); setEditingAvatarId(null); }} variant="outline" className="flex-1 h-10 rounded-xl font-black uppercase text-[10px] tracking-widest text-slate-400">Cancelar</Button>
                            <Button onClick={handleCreateProfile} disabled={loading} className="flex-[2] bg-slate-900 text-white h-10 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg">
                                {loading ? '...' : (editingAvatarId ? 'ACTUALIZAR' : 'GUARDAR')}
                            </Button>
                        </footer>
                    </Card>
                </div>
            )}
        </div>
    );

    return isEmbedded ? content : <PageShell>{content}</PageShell>;
}
