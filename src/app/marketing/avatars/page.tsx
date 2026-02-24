"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
    Users, Plus, Sparkles, Loader2, Trash2, Video,
    User, Zap, Wand2, Play, Save, Settings, CheckCircle2,
    MessageSquare, Volume2, Mic2, Globe, ChevronRight, AlertCircle, Eye, Download,
    Fingerprint, ShieldCheck, Database
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
    getProductDriveFolder
} from "./actions";

export default function AvatarStudioPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-50/50 flex flex-col items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-rose-500" /></div>}>
            <AvatarStudioContent />
        </Suspense>
    );
}

function AvatarStudioContent() {
    const [storeId, setStoreId] = useState<string | null>(null);
    const [avatars, setAvatars] = useState<any[]>([]);
    const [voices, setVoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [activeTab, setActiveTab] = useState("profiles");
    const [qualityTier, setQualityTier] = useState<'balanced' | 'premium'>('premium');
    const [engineStatus, setEngineStatus] = useState<"online" | "offline" | "checking">("checking");
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

        // Polling interval for generating avatars
        const interval = setInterval(() => {
            const hasGenerating = avatars.some(a => ['DRAFT', 'GENERATING_IMAGE'].includes(a.status));
            if (hasGenerating) {
                console.log("🔄 [Studio] Polling for updates...");
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
            const res = await getProductDriveFolder(pid);
            if (res.success) setDriveFolder(res.data);
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
                toast.success(qualityTier === 'premium' ? "Misión de Identidad de Máximo Nivel Iniciada" : "Avatar guardado correctamente");
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
        toast.info("Iniciando síntesis de video... Esto tardará unos minutos.");
        // Simulated local trigger
        setTimeout(() => {
            setLoading(false);
            setGeneratedVideoUrl("https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4");
            toast.success("Video Generado con Éxito");
        }, 3000);
    };

    const handleGenerateScript = async () => {
        if (!selectedAvatar) return;
        setLoading(true);
        const res = await generateAvatarScript(selectedAvatar.id, "Realista");
        setLoading(false);
        if (res.success && res.script) {
            setScript(res.script);
            toast.success("Guion generado por Gemini Vision");
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
        // Getting productId from URL if possible
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

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 md:p-12 font-sans selection:bg-rose-500/30">
            {/* Header Area */}
            <div className="max-w-7xl mx-auto space-y-12">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-200">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 bg-slate-900 rounded-2xl flex items-center justify-center shadow-2xl">
                                <Users className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-black uppercase tracking-tight text-slate-900 leading-none">Avatar <span className="text-rose-500">Studio</span></h1>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-2">
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> PROTOCOLO DE ALTA FIDELIDAD ACTIVO
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-white px-4 h-12 rounded-2xl border border-slate-200 shadow-sm mr-2">
                            <div className={cn("w-2 h-2 rounded-full", engineStatus === "online" ? "bg-emerald-500 animate-pulse" : "bg-rose-500")} />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{engineStatus === "online" ? "LOCAL ENGINE: ONLINE" : "LOCAL ENGINE: OFFLINE"}</span>
                        </div>
                        {driveFolder?.driveFolderId && (
                            <Button
                                onClick={() => window.open(`https://drive.google.com/drive/folders/${driveFolder.driveFolderId}`, '_blank')}
                                variant="outline"
                                className="h-12 border-emerald-500/30 text-emerald-600 hover:bg-emerald-50 rounded-2xl font-black px-6 text-[10px] uppercase tracking-widest gap-2"
                            >
                                <Globe className="w-4 h-4" /> DRIVE PRODUCTO
                            </Button>
                        )}
                        <Button onClick={handleCleanup} variant="ghost" className="h-12 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-500">
                            <Trash2 className="w-4 h-4 mr-2" /> LIMPIAR HISTORIAL
                        </Button>
                        <Button onClick={handleCreateFromResearch} variant="outline" className="h-12 border-rose-500/30 text-rose-500 hover:bg-rose-50 rounded-2xl font-black px-6 text-[10px] uppercase tracking-widest gap-2">
                            <Database className="w-4 h-4" /> IMPORTAR RESEARCH
                        </Button>
                        <Button onClick={() => setIsAdding(true)} className="bg-slate-900 text-white rounded-2xl font-black px-8 h-12 shadow-xl hover:scale-105 transition-all text-xs uppercase tracking-widest gap-3">
                            <Plus className="w-4 h-4 text-rose-500" /> RECLUTAR AVATAR
                        </Button>
                    </div>
                </header>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
                    <TabsList className="bg-slate-900/5 p-1 rounded-2xl border border-slate-200 w-fit">
                        <TabsTrigger value="profiles" className="rounded-xl px-8 py-2 text-xs font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm">BIBLIOTECA</TabsTrigger>
                        <TabsTrigger value="studio" className="rounded-xl px-8 py-2 text-xs font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm">SUPER VIDEO LAB</TabsTrigger>
                    </TabsList>

                    <TabsContent value="profiles" className="outline-none">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-10 gap-4">
                            {avatars.map((a) => (
                                <div key={a.id} className="group relative rounded-3xl border border-white/60 overflow-hidden hover:shadow-xl transition-all duration-500 bg-white/40 backdrop-blur-md flex flex-col ring-1 ring-black/[0.03]">
                                    <div className="aspect-square bg-slate-50 relative overflow-hidden">
                                        {a.imageUrl ? <img src={a.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" /> : <User className="w-8 h-8 text-slate-200 absolute inset-0 m-auto" />}

                                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2 gap-1.5 backdrop-blur-[2px]">
                                            <Button size="sm" className="w-full rounded-lg text-[8px] font-black bg-white text-slate-900 h-7" onClick={() => handleEditProfile(a)}>CONFIGURAR</Button>
                                            <Button size="sm" className="w-full rounded-lg text-[8px] font-black bg-rose-600 text-white gap-1.5 h-7 shadow-lg shadow-rose-600/20" onClick={() => createEvolutionPair(a.id).then(loadData)}>
                                                <Zap className="w-2.5 h-2.5 fill-white" /> EVOLUCIÓN
                                            </Button>
                                        </div>

                                        <Badge className={cn(
                                            "absolute top-2 left-2 text-[6px] font-black uppercase tracking-widest px-1.5 h-4.5 border-none",
                                            a.status === 'GENERATING_IMAGE' ? "bg-amber-400 text-slate-900 animate-pulse" : "bg-emerald-500 text-white"
                                        )}>
                                            {a.status === 'GENERATING_IMAGE' ? 'SINTETIZANDO' : (a.evolutionStage ? a.evolutionStage : 'LISTO')}
                                        </Badge>
                                    </div>
                                    <div className="p-3 bg-white/20">
                                        <div className="flex items-center justify-between mb-1">
                                            <h3 className="text-[9px] font-black text-slate-900 uppercase italic truncate tracking-tight">{a.name}</h3>
                                            {(() => {
                                                const meta = JSON.parse(a.metadataJson || "{}");
                                                const pId = meta.replicatePredictionId || meta.predictionId;
                                                if (pId) return <Badge variant="outline" className="text-[5px] h-3 px-1 border-slate-200 text-slate-400 bg-slate-50 font-black uppercase tracking-tighter">REPLICATE</Badge>;
                                                return null;
                                            })()}
                                        </div>
                                        <div className="flex items-center justify-between mt-0.5">
                                            <p className="text-[6px] text-slate-400 font-bold uppercase tracking-widest">{a.region} • {a.ageRange}</p>
                                            {(() => {
                                                const meta = JSON.parse(a.metadataJson || "{}");
                                                const pId = meta.replicatePredictionId || meta.predictionId;
                                                if (pId) return <span className="text-[5px] text-rose-500 font-black tracking-tighter">ID: {pId.substring(0, 8)}...</span>;
                                                return null;
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="studio" className="outline-none">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            <div className="lg:col-span-4 space-y-6">
                                <Card className="rounded-[2.5rem] border-white/50 overflow-hidden shadow-sm bg-white/20 backdrop-blur-xl">
                                    <CardHeader className="bg-white/40 border-b border-white/20">
                                        <CardTitle className="text-sm font-black uppercase italic tracking-widest flex items-center gap-3">
                                            <Wand2 className="w-5 h-5 text-rose-500" /> SÍNTESIS AGENTICA
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-8 space-y-6">
                                        <FormGroup label="AVATAR SELECCIONADO">
                                            <Select value={selectedAvatar?.id || ""} onValueChange={(id) => setSelectedAvatar(avatars.find(a => a.id === id))}>
                                                <SelectTrigger className="rounded-xl h-12 bg-white/40 font-bold"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                                                <SelectContent>
                                                    {avatars.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </FormGroup>

                                        <FormGroup label="GUION DEL ANUNCIO">
                                            <Textarea
                                                value={script}
                                                onChange={(e) => setScript(e.target.value)}
                                                className="min-h-[200px] rounded-2xl bg-white/40 p-4 text-xs font-medium"
                                                placeholder="Escribe el guion persuasivo..."
                                            />
                                        </FormGroup>

                                        <Button onClick={handleGenerateVideo} disabled={loading || !script || !selectedAvatar} className="w-full bg-slate-900 h-16 rounded-2xl font-black uppercase text-xs tracking-widest text-white shadow-xl">
                                            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Play className="w-6 h-6 text-rose-500 fill-rose-500" />}
                                            <div className="flex flex-col items-start ml-4">
                                                <span>GENERAR VIDEO</span>
                                                <span className="text-[8px] text-white/40 font-bold tracking-[0.3em]">NEURAL ENGINE LOCAL</span>
                                            </div>
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="lg:col-span-8">
                                <div className="bg-slate-950 aspect-video rounded-[3rem] border border-white/10 shadow-2xl flex items-center justify-center overflow-hidden group relative">
                                    {generatedVideoUrl ? (
                                        <video src={generatedVideoUrl} controls className="w-full h-full object-contain" autoPlay />
                                    ) : (
                                        <div className="flex flex-col items-center gap-6 opacity-30">
                                            <div className="w-20 h-20 bg-white/5 rounded-[2.5rem] flex items-center justify-center border border-white/10">
                                                <Video className="w-10 h-10 text-rose-500" />
                                            </div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/60 text-center">Esperando Generación<br />Master 4K Output Ready</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Modal de Reclutamiento / Edición */}
            {isAdding && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-300">
                    <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[3rem] shadow-2xl border-white/40 bg-white/90 backdrop-blur-2xl p-8 space-y-8 scrollbar-hide">
                        <header className="flex items-center justify-between border-b border-slate-100 pb-6">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg">
                                    <Fingerprint className="h-5 w-5 text-rose-500" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black uppercase tracking-tight text-slate-900">Configuración Bio-Métrica</h2>
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">Personalización de Identidad Híbrida</p>
                                </div>
                            </div>
                            <div className="flex bg-slate-100 p-1.5 rounded-[1.5rem] border border-slate-200">
                                <button
                                    onClick={() => setQualityTier('balanced')}
                                    className={cn("px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all", qualityTier === 'balanced' ? "bg-white shadow-sm text-slate-900" : "text-slate-400")}
                                >ESTÁNDAR</button>
                                <button
                                    onClick={() => setQualityTier('premium')}
                                    className={cn("px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all", qualityTier === 'premium' ? "bg-slate-900 text-white shadow-lg" : "text-slate-400")}
                                >MÁXIMO NIVEL (FLUX PRO)</button>
                            </div>
                        </header>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                            <div className="space-y-6">
                                <FormGroup label="Identidad / Nombre">
                                    <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Ej: Alejandra García" className="rounded-xl border-slate-200 h-10 font-bold" />
                                </FormGroup>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormGroup label="Género Base">
                                        <Select value={formData.sex} onValueChange={(v) => setFormData({ ...formData, sex: v })}>
                                            <SelectTrigger className="rounded-xl border-slate-200 h-10 font-bold"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="FEMALE" className="font-bold">FEMENINO</SelectItem>
                                                <SelectItem value="MALE" className="font-bold">MASCULINO</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FormGroup>
                                    <FormGroup label="Rango de Edad">
                                        <Select value={formData.ageRange} onValueChange={(v) => setFormData({ ...formData, ageRange: v })}>
                                            <SelectTrigger className="rounded-xl border-slate-200 h-10 font-bold"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {['18-25', '25-35', '35-45', '45-55', '55-65', '65+'].map(r => (
                                                    <SelectItem key={r} value={r} className="font-bold">{r} AÑOS</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </FormGroup>
                                </div>

                                <FormGroup label="Región / Acento">
                                    <Input value={formData.region} onChange={(e) => setFormData({ ...formData, region: e.target.value })} placeholder="Ej: España, Madrid" className="rounded-xl border-slate-200 h-10 font-bold" />
                                </FormGroup>

                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Rasgos Visuales Avanzados</Label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <TraitToggle label="Canas" active={formData.hasGreyHair} onClick={() => setFormData({ ...formData, hasGreyHair: !formData.hasGreyHair })} />
                                        <TraitToggle label="Arrugas" active={formData.hasWrinkles} onClick={() => setFormData({ ...formData, hasWrinkles: !formData.hasWrinkles })} />
                                        <TraitToggle label="Acné" active={formData.hasAcne} onClick={() => setFormData({ ...formData, hasAcne: !formData.hasAcne })} />
                                        <TraitToggle label="Calvicie" active={formData.hasHairLoss} onClick={() => setFormData({ ...formData, hasHairLoss: !formData.hasHairLoss })} />
                                    </div>
                                    <FormGroup label="Tono de Piel">
                                        <Select value={formData.skinTone} onValueChange={(v) => setFormData({ ...formData, skinTone: v })}>
                                            <SelectTrigger className="rounded-xl border-slate-200 h-10 font-bold"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {['CLARO', 'MEDIO', 'OSCURO', 'BRONCEADO'].map(t => (
                                                    <SelectItem key={t} value={t} className="font-bold uppercase tracking-widest">{t}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </FormGroup>
                                </div>
                            </div>

                            <div className="space-y-8 bg-slate-50/50 p-6 rounded-[2.5rem] border border-slate-100">
                                <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                                    <Volume2 className="h-4 w-4 text-rose-500" />
                                    <h3 className="text-xs font-black uppercase tracking-tight">Síntesis Vocal (ElevenLabs)</h3>
                                </div>

                                <FormGroup label="ID de Voz Maestra">
                                    <Select value={formData.voiceId} onValueChange={(v) => setFormData({ ...formData, voiceId: v })}>
                                        <SelectTrigger className="rounded-xl border-slate-200 h-10 font-bold bg-white text-xs uppercase"><SelectValue placeholder="Seleccionar Voz..." /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none" className="font-bold italic">NINGUNA (SOLO IMAGEN)</SelectItem>
                                            {voices.map(v => (
                                                <SelectItem key={v.voice_id} value={v.voice_id} className="font-bold flex items-center justify-between">
                                                    {v.name.toUpperCase()} <span className="ml-4 text-[8px] text-slate-400">({v.category})</span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </FormGroup>

                                <div className="space-y-6">
                                    <VoiceSlider
                                        label="Estabilidad (Stability)"
                                        value={formData.voiceStability}
                                        onChange={(v) => setFormData({ ...formData, voiceStability: v })}
                                        description="Menor = Más emotivo/impredecible. Mayor = Más monótono."
                                    />
                                    <VoiceSlider
                                        label="Fidelidad (Similarity Boost)"
                                        value={formData.voiceSimilarity}
                                        onChange={(v) => setFormData({ ...formData, voiceSimilarity: v })}
                                        description="Fuerza del parecido con la muestra original."
                                    />
                                    <VoiceSlider
                                        label="Exageración de Estilo (Style Exaggeration)"
                                        value={formData.voiceStyle}
                                        onChange={(v) => setFormData({ ...formData, voiceStyle: v })}
                                        description="Aumenta la dramatización del estilo vocal."
                                    />
                                </div>

                                <div className="pt-4 border-t border-slate-200">
                                    <FormGroup label="Instrucciones Adicionales (Prompt IA)">
                                        <Textarea
                                            value={formData.customPrompt}
                                            onChange={(e) => setFormData({ ...formData, customPrompt: e.target.value })}
                                            placeholder="Detalla vestimenta, fondo o iluminación específica..."
                                            className="h-24 rounded-2xl resize-none text-xs bg-white"
                                        />
                                    </FormGroup>
                                </div>
                            </div>
                        </div>

                        <footer className="flex gap-4 pt-4">
                            <Button onClick={() => { setIsAdding(false); setEditingAvatarId(null); }} variant="outline" className="flex-1 h-12 rounded-2xl font-black uppercase text-[10px] tracking-widest text-slate-400">Cancelar</Button>
                            <Button onClick={handleCreateProfile} disabled={loading} className="flex-[2] bg-slate-900 hover:bg-black text-white h-12 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl gap-3">
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 text-rose-500" />}
                                {editingAvatarId ? "ACTUALIZAR IDENTIDAD" : (qualityTier === 'premium' ? "INICIAR SÍNTESIS AGÉNTICA" : "GUARDAR IDENTIDAD")}
                            </Button>
                        </footer>
                    </Card>
                </div>
            )}
        </div>
    );
}

function FormGroup({ label, children }: { label: string, children: React.ReactNode }) {
    return (
        <div className="space-y-2 w-full">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{label}</Label>
            {children}
        </div>
    );
}

function TraitToggle({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex items-center justify-between px-4 h-11 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all",
                active
                    ? "bg-slate-900 border-slate-900 text-white shadow-lg scale-105"
                    : "bg-white border-slate-200 text-slate-400 hover:border-slate-300"
            )}
        >
            {label}
            {active && <CheckCircle2 className="w-4 h-4 text-rose-500 ml-2" />}
        </button>
    );
}

function VoiceSlider({ label, value, onChange, description }: { label: string, value: number, onChange: (v: number) => void, description: string }) {
    return (
        <div className="space-y-3">
            <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{label}</label>
                <span className="text-[11px] font-black text-rose-500">{Math.round(value * 100)}%</span>
            </div>
            <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
            />
            <p className="text-[8px] font-medium text-slate-400 uppercase tracking-tighter leading-none">{description}</p>
        </div>
    );
}
