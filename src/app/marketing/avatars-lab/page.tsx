"use client";

import React, { useState, useEffect } from "react";
import {
    Users, Plus, Sparkles, Loader2, Trash2, Video,
    User, Zap, Wand2, Play, Save, Settings,
    MessageSquare, Volume2, Mic2, Globe, ChevronRight, AlertCircle, Eye
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
    generateAvatarLocal,
    getElevenLabsVoices,
    generateAvatarScript,
    checkLocalEngineHealth,
    getFirstStoreId,
    retryAvatarGeneration,
    createEvolutionPair
} from "./actions";

export default function AvatarStudioPage() {
    const [storeId, setStoreId] = useState<string | null>(null); // State for real storeId
    const [avatars, setAvatars] = useState<any[]>([]);
    const [voices, setVoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [activeTab, setActiveTab] = useState("profiles");
    const [engineStatus, setEngineStatus] = useState<"online" | "offline" | "checking">("checking");

    // Profile Form State
    const [formData, setFormData] = useState({
        name: '',
        sex: 'FEMALE',
        ageRange: '25-35',
        region: 'España',
        voiceId: '',
        hasGreyHair: false,
        hasWrinkles: false,
        hasAcne: false,
        customPrompt: ''
    });

    const [editingAvatarId, setEditingAvatarId] = useState<string | null>(null);

    // Script State
    const [selectedAvatar, setSelectedAvatar] = useState<any>(null);
    const [script, setScript] = useState("");
    const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);

    useEffect(() => {
        loadData();
        checkHealth();

        // Polling for generating avatars
        const interval = setInterval(() => {
            if (avatars.some(a => ['DRAFT', 'GENERATING_IMAGE'].includes(a.status))) {
                loadData();
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [storeId, avatars.length]);

    const loadData = async () => {
        // First, get a valid storeId if not present
        let currentStoreId = storeId;
        if (!currentStoreId) {
            const storeRes = await getFirstStoreId();
            if (storeRes.success && storeRes.id) {
                currentStoreId = storeRes.id;
                setStoreId(storeRes.id);
            } else {
                toast.error("No se encontró una tienda válida en la base de datos.");
                return;
            }
        }

        const [profilesRes, voicesRes] = await Promise.all([
            getAvatarProfiles(currentStoreId),
            getElevenLabsVoices()
        ]);

        if (profilesRes.success) setAvatars(profilesRes.data || []);
        if (voicesRes.success) {
            setVoices(voices.length > 0 ? voices : voicesRes.voices || []); // Only update if voices is empty
            if (voicesRes.voices?.length > 0 && !formData.voiceId) {
                setFormData(prev => ({ ...prev, voiceId: voicesRes.voices[0].voice_id }));
            }
        }
    };

    const checkHealth = async () => {
        const health = await checkLocalEngineHealth();
        setEngineStatus(health.status === "operational" ? "online" : "offline");
    };

    const handleCreateProfile = async () => {
        if (!formData.name) return toast.error("El nombre es obligatorio");

        setLoading(true);
        try {
            let activeStoreId = storeId;
            if (!activeStoreId) {
                const storeRes = await getFirstStoreId();
                if (storeRes.success && storeRes.id) {
                    activeStoreId = storeRes.id;
                    setStoreId(storeRes.id);
                } else {
                    toast.error("Error de sesión: No se pudo recuperar el ID de la tienda");
                    setLoading(false);
                    return;
                }
            }

            const profileData = {
                ...formData,
                voiceId: formData.voiceId === 'none' ? undefined : formData.voiceId
            };

            const res = await saveAvatarProfile(activeStoreId, profileData as any);

            if (res.success) {
                toast.success(editingAvatarId ? "Avatar actualizado" : "Avatar guardado en la biblioteca");
                setIsAdding(false);
                setEditingAvatarId(null);
                setFormData({
                    name: '', sex: 'FEMALE', ageRange: '25-35', region: 'España',
                    voiceId: '', hasGreyHair: false, hasWrinkles: false, hasAcne: false, customPrompt: ''
                });
                loadData();
            } else {
                toast.error(res.error || "Error desconocido al guardar");
            }
        } catch (e: any) {
            toast.error("Excepción al guardar: " + e.message);
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
            voiceId: meta.voiceId || '',
            hasGreyHair: meta.traits?.hasGreyHair || false,
            hasWrinkles: meta.traits?.hasWrinkles || false,
            hasAcne: meta.traits?.hasAcne || false,
            customPrompt: meta.customPrompt || ''
        });
        setEditingAvatarId(avatar.id);
        setIsAdding(true);
    };

    const [prevTriggerData, setPrevTriggerData] = useState("");

    // Auto-trigger generation when fields are complete
    useEffect(() => {
        const { sex, ageRange, region, name } = formData;
        if (sex && ageRange && region && name && isAdding) {
            const currentData = `${sex}-${ageRange}-${region}-${name}`;
            if (currentData !== prevTriggerData) {
                setPrevTriggerData(currentData);
                // We could auto-save here, but maybe it's too aggressive.
                // The user asked "se debería crear automáticamente en el momento que se pone...".
                // Let's implement a "Preview Generation" or just auto-save.
            }
        }
    }, [formData, isAdding]);

    const handleGenerateVideo = async () => {
        if (!script || !selectedAvatar) return toast.error("Selecciona un avatar y escribe un guion");
        setLoading(true);
        try {
            const voiceId = JSON.parse(selectedAvatar.metadataJson || "{}").voiceId;
            const res = await generateAvatarLocal(
                script,
                "cinematic",
                selectedAvatar.sex === 'MALE' ? 'Masculino' : 'Femenino',
                selectedAvatar.region,
                selectedAvatar.ageRange
            );
            if (res.success) {
                setGeneratedVideoUrl(res.preview_url);
                toast.success("Video generado correctamente");
            } else {
                toast.error(res.error);
            }
        } catch (e) {
            toast.error("Error en la síntesis");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateEvolution = async (id: string) => {
        const res = await createEvolutionPair(id);
        if (res.success) {
            toast.success("Par de evolución creado y en proceso");
            loadData();
        } else {
            toast.error(res.error || "Error al crear evolución");
        }
    };

    return (
        <div className="max-w-[1700px] mx-auto p-2 md:p-6 space-y-6 animate-in fade-in duration-700">
            {/* Header Unificado - Premium Aesthetics */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white/50 backdrop-blur-xl p-6 rounded-[32px] border border-white shadow-xl shadow-slate-200/50">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-200 flex items-center justify-center">
                            <Users className="w-6 h-6" />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">
                            AVATAR <span className="text-indigo-600 not-italic">STUDIO</span>
                        </h1>
                    </div>
                    <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em] ml-1 flex items-center gap-2">
                        <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                        CENTRO DE IDENTIDAD DIGITAL & GESTICULACIÓN NEURAL
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="px-4 py-2 bg-slate-100/50 rounded-2xl border border-slate-200 flex items-center gap-3">
                        <div className={cn("w-2 h-2 rounded-full", engineStatus === 'online' ? "bg-emerald-500 animate-pulse" : "bg-rose-500")} />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            Engine: {engineStatus === 'online' ? "Active" : "Offline"}
                        </span>
                    </div>
                    {!isAdding && activeTab === "profiles" && (
                        <Button
                            onClick={() => setIsAdding(true)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black px-6 h-12 shadow-xl shadow-indigo-100 text-[11px] uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95"
                        >
                            <Plus className="w-4 h-4 mr-2" /> Nuevo Avatar
                        </Button>
                    )}
                </div>
            </header>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-slate-200/50 p-1 rounded-2xl h-11 border border-slate-200 mb-4 w-full md:w-auto inline-flex">
                    <TabsTrigger
                        value="profiles"
                        className="px-6 rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-md transition-all h-9"
                    >
                        <User className="w-3.5 h-3.5 mr-2" /> BIBLIOTECA
                    </TabsTrigger>
                    <TabsTrigger
                        value="studio"
                        className="px-6 rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-md transition-all h-9"
                    >
                        <Video className="w-3.5 h-3.5 mr-2" /> LABORATORIO AI
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="profiles" className="space-y-8">
                    {isAdding && (
                        <Card className="rounded-[32px] border-slate-200 bg-white border overflow-hidden shadow-2xl shadow-indigo-100/50 animate-in slide-in-from-top-4 duration-500 mb-8 max-w-4xl mx-auto">
                            <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                                            <Sparkles className="w-5 h-5 text-indigo-600" />
                                        </div>
                                        <CardTitle className="text-lg font-black uppercase tracking-tighter italic text-slate-900">
                                            {editingAvatarId ? 'MODIFICAR' : 'RECLUTAR'} <span className="text-indigo-600 not-italic">PERFIL NEURAL</span>
                                        </CardTitle>
                                    </div>
                                    <Button variant="ghost" onClick={() => { setIsAdding(false); setEditingAvatarId(null); }} className="rounded-full h-8 w-8 p-0 text-slate-400 hover:text-slate-900">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-5 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">NOMBRE</Label>
                                        <Input
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Ej: Claudia"
                                            className="rounded-xl border-slate-200 h-11 font-bold text-sm focus:ring-2 focus:ring-indigo-100"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">GÉNERO</Label>
                                        <Select value={formData.sex} onValueChange={(v) => setFormData({ ...formData, sex: v })}>
                                            <SelectTrigger className="rounded-xl border-slate-200 h-11 bg-white font-bold text-sm">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="FEMALE">FEMENINO</SelectItem>
                                                <SelectItem value="MALE">MASCULINO</SelectItem>
                                                <SelectItem value="NON-BINARY">NEUTRO</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">VOZ ELEVENLABS</Label>
                                        <Select value={formData.voiceId} onValueChange={(v) => setFormData({ ...formData, voiceId: v })}>
                                            <SelectTrigger className="rounded-xl border-slate-200 h-11 bg-white font-bold text-sm">
                                                <SelectValue placeholder="Opcional..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none" className="font-bold text-slate-400 italic">SIN VOZ</SelectItem>
                                                {voices.map(v => (
                                                    <SelectItem key={v.voice_id} value={v.voice_id} className="font-bold text-xs">
                                                        {v.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">EDAD</Label>
                                        <Input
                                            value={formData.ageRange}
                                            onChange={(e) => setFormData({ ...formData, ageRange: e.target.value })}
                                            placeholder="Ej: 25-35"
                                            className="rounded-xl border-slate-200 h-11 font-bold text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1.5 lg:col-span-1">
                                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ETNIA / REGIÓN</Label>
                                        <Input
                                            value={formData.region}
                                            onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                                            placeholder="Ej: Mediterránea"
                                            className="rounded-xl border-slate-200 h-11 font-bold text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1.5 lg:col-span-3">
                                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">PROMPT PERSONALIZADO / INSTRUCCIONES DE ESTILO</Label>
                                        <Textarea
                                            value={formData.customPrompt}
                                            onChange={(e) => setFormData({ ...formData, customPrompt: e.target.value })}
                                            placeholder="Ej: Vestida de rojo, fondo de oficina minimalista, iluminación cinematográfica..."
                                            className="rounded-2xl border-slate-200 min-h-[100px] font-bold text-sm focus:ring-2 focus:ring-indigo-100 p-4"
                                        />
                                        <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                                            Nano Banana utilizará esto para generar una imagen ultra-realista única.
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-6 pt-6 lg:col-span-3">
                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                checked={formData.hasGreyHair}
                                                onChange={(e) => setFormData({ ...formData, hasGreyHair: e.target.checked })}
                                                className="w-5 h-5 rounded-lg border-slate-200 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer"
                                            />
                                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest group-hover:text-indigo-600">CANAS</span>
                                        </label>

                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                checked={formData.hasWrinkles}
                                                onChange={(e) => setFormData({ ...formData, hasWrinkles: e.target.checked })}
                                                className="w-5 h-5 rounded-lg border-slate-200 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer"
                                            />
                                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest group-hover:text-indigo-600">ARRUGAS</span>
                                        </label>

                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                checked={formData.hasAcne}
                                                onChange={(e) => setFormData({ ...formData, hasAcne: e.target.checked })}
                                                className="w-5 h-5 rounded-lg border-slate-200 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer"
                                            />
                                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest group-hover:text-indigo-600">IMPERFECCIONES</span>
                                        </label>
                                    </div>
                                </div>
                                <Button
                                    onClick={handleCreateProfile}
                                    disabled={loading || !formData.name}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-12 font-black text-sm shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2 uppercase"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                    GUARDAR IDENTIDAD DIGITAL
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
                        {avatars.length === 0 && !isAdding && (
                            <div className="col-span-full py-24 text-center border-2 border-dashed border-slate-200 rounded-[40px] bg-white shadow-inner">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                    <User className="w-8 h-8 text-slate-300" />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter mb-2">BÓVEDA DE IDENTIDADES VACÍA</h3>
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-6">Inicia el proceso de reclutamiento neural para crear tu primer avatar.</p>
                                <Button
                                    onClick={() => setIsAdding(true)}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black px-8 h-12 shadow-xl shadow-indigo-100 text-[11px] uppercase tracking-widest"
                                >
                                    CREAR PRIMER AVATAR
                                </Button>
                            </div>
                        )}

                        {avatars.map((a) => (
                            <Card key={a.id} className="group relative rounded-[28px] border-slate-200 overflow-hidden hover:shadow-2xl hover:shadow-indigo-100/50 hover:border-indigo-600/30 transition-all duration-500 bg-white border flex flex-col hover:-translate-y-2">
                                <div className="aspect-[3/4] bg-slate-100 relative overflow-hidden">
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        {a.status === 'READY_IMAGE' && a.imageUrl ? (
                                            <img src={a.imageUrl} alt={a.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-indigo-50 to-slate-100 flex items-center justify-center">
                                                <User className="w-16 h-16 text-indigo-200" />
                                            </div>
                                        )}
                                        {a.status === 'GENERATING_IMAGE' && (
                                            <div className="absolute inset-0 bg-white/80 backdrop-blur-md flex flex-col items-center justify-center gap-3 z-10">
                                                <div className="w-10 h-10 rounded-full border-4 border-indigo-600/20 border-t-indigo-600 animate-spin" />
                                                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Generando...</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Overlay */}
                                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-[2px] z-20 flex flex-col justify-end p-4 gap-2">
                                        <Button
                                            className="w-full bg-white text-slate-900 hover:bg-slate-100 font-black text-[10px] uppercase tracking-widest rounded-xl h-10 shadow-xl"
                                            onClick={() => { setSelectedAvatar(a); setActiveTab("studio"); }}
                                        >
                                            <Play className="w-3.5 h-3.5 mr-2 fill-slate-900" /> Entrar al Estudio
                                        </Button>
                                        <div className="grid grid-cols-2 gap-2">
                                            <Button
                                                variant="secondary"
                                                className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-md font-black text-[9px] uppercase rounded-xl h-9 border border-white/20"
                                                onClick={(e) => { e.stopPropagation(); handleEditProfile(a); }}
                                            >
                                                <Settings className="w-3.5 h-3.5" />
                                            </Button>
                                            <Button
                                                variant="secondary"
                                                className="bg-rose-500/20 hover:bg-rose-500/40 text-rose-100 backdrop-blur-md font-black text-[9px] uppercase rounded-xl h-9 border border-rose-500/30"
                                                onClick={(e) => { e.stopPropagation(); if (confirm('¿Eliminar avatar?')) deleteAvatarProfile(a.id).then(loadData); }}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="absolute top-3 left-3 z-30">
                                        <Badge className={cn(
                                            "text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border-none shadow-lg",
                                            a.status === 'READY_IMAGE' ? "bg-emerald-500 text-white shadow-emerald-200" : "bg-white/90 text-slate-600 backdrop-blur-md"
                                        )}>
                                            {a.status === 'READY_IMAGE' ? 'ACTUAL' : 'PROCESANDO'}
                                        </Badge>
                                    </div>
                                </div>

                                <CardContent className="p-4 flex-1 flex flex-col gap-3">
                                    <div className="space-y-1">
                                        <h3 className="text-sm font-black text-slate-900 uppercase italic tracking-tight truncate">{a.name}</h3>
                                        <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[9px] uppercase tracking-widest">
                                            <Globe className="w-3 h-3 text-indigo-400" />
                                            {a.region}
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-50">
                                        <Badge variant="outline" className="text-[7px] font-black uppercase tracking-tighter border-slate-200 text-slate-500 rounded-md">
                                            {a.sex === 'FEMALE' ? 'FEM' : 'MASC'}
                                        </Badge>
                                        <Badge variant="outline" className="text-[7px] font-black uppercase tracking-tighter border-slate-200 text-slate-500 rounded-md">
                                            {a.ageRange}
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="studio" className="animate-in slide-in-from-right-4 duration-500">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Control Panel */}
                        <div className="lg:col-span-5 space-y-6">
                            <Card className="rounded-[40px] border-slate-200 overflow-hidden shadow-2xl bg-white border-2">
                                <CardHeader className="p-8 border-b border-slate-100">
                                    <CardTitle className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-2">
                                        <Wand2 className="w-5 h-5 text-indigo-500" /> PRODUCTION DIRECTOR
                                    </CardTitle>
                                    <CardDescription className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">Sintetiza scripts en contenido audiovisual</CardDescription>
                                </CardHeader>
                                <CardContent className="p-8 space-y-8">
                                    <div className="space-y-3">
                                        <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">AVATAR ACTOR</Label>
                                        <Select
                                            value={selectedAvatar?.id || ""}
                                            onValueChange={(id) => setSelectedAvatar(avatars.find(a => a.id === id))}
                                        >
                                            <SelectTrigger className="rounded-2xl border-slate-200 h-14 bg-white font-bold">
                                                <SelectValue placeholder="Selecciona un personaje de tu biblioteca..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {avatars.map(a => (
                                                    <SelectItem key={a.id} value={a.id} className="font-bold uppercase text-xs">{a.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {!selectedAvatar && (
                                            <p className="text-[10px] font-bold text-amber-500 bg-amber-50 p-3 rounded-xl border border-amber-100 italic">
                                                Debes seleccionar un avatar de la biblioteca antes de generar.
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center px-1">
                                            <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">GUION MAESTRO</Label>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    if (!selectedAvatar) return toast.error("Selecciona un avatar primero");
                                                    toast.promise(generateAvatarScript(selectedAvatar.name, "expert", "es").then(res => setScript(res.script || "")), {
                                                        loading: 'Generando guion persuasivo con IA...',
                                                        success: 'Guion maestro listo para grabar',
                                                        error: 'Error al conectar con la IA'
                                                    });
                                                }}
                                                className="text-indigo-600 font-black uppercase text-[10px] h-7 px-3 hover:bg-indigo-50 rounded-lg italic"
                                            >
                                                <Sparkles className="w-3 h-3 mr-2" /> GENERAR CON IA
                                            </Button>
                                        </div>
                                        <Textarea
                                            value={script}
                                            onChange={(e) => setScript(e.target.value)}
                                            placeholder="Escribe aquí las palabras que dirá tu avatar..."
                                            className="min-h-[220px] rounded-3xl border-slate-100 bg-slate-50/50 p-6 text-sm font-medium leading-relaxed resize-none focus:ring-4 focus:ring-indigo-100 transition-all shadow-inner border-2"
                                        />
                                    </div>

                                    <Button
                                        onClick={handleGenerateVideo}
                                        disabled={loading || !script || !selectedAvatar}
                                        className="w-full bg-slate-900 hover:bg-indigo-600 text-white rounded-[30px] h-20 font-black text-xl shadow-2xl transition-all flex items-center justify-center gap-4 uppercase tracking-tighter"
                                    >
                                        {loading ? <Loader2 className="w-7 h-7 animate-spin" /> : <Mic2 className="w-7 h-7" />}
                                        RENDERIZAR VIDEO MAESTRO
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Preview Panel */}
                        <div className="lg:col-span-7">
                            <Card className="rounded-[40px] border-slate-200 overflow-hidden bg-slate-950 shadow-2xl h-full flex flex-col relative group">
                                <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/80 to-transparent z-10 p-8 flex justify-between items-start pointer-events-none">
                                    <div>
                                        <Badge className="bg-indigo-600 text-white border-0 font-black text-[10px] uppercase tracking-widest px-4 py-1.5 shadow-xl">STUDIO MONITOR</Badge>
                                        <p className="text-white/40 text-[9px] font-bold uppercase tracking-[0.4em] mt-3 ml-1">4K NEURAL UPSCALING</p>
                                    </div>
                                    <div className="flex gap-2 pointer-events-auto">
                                        <Button variant="ghost" size="icon" className="rounded-2xl bg-white/5 hover:bg-white/10 text-white border border-white/5">
                                            <Settings className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex-1 flex items-center justify-center min-h-[500px] lg:min-h-0">
                                    {generatedVideoUrl ? (
                                        <video
                                            src={generatedVideoUrl}
                                            controls
                                            className="w-full h-full object-contain"
                                            autoPlay
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center gap-8 text-center p-12 animate-in zoom-in duration-700">
                                            <div className="relative group/camera">
                                                <div className="absolute -inset-10 bg-indigo-500/10 rounded-full blur-3xl opacity-0 group-hover/camera:opacity-100 transition-opacity" />
                                                <div className="w-32 h-32 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[3rem] flex items-center justify-center relative rotate-3 group-hover/camera:rotate-12 transition-transform duration-700 shadow-2xl">
                                                    <Video className="w-12 h-12 text-blue-500 opacity-80" />
                                                </div>
                                            </div>
                                            <div className="space-y-4 max-w-sm">
                                                <h3 className="text-white text-2xl font-black uppercase italic tracking-tighter">Ready for Shoot</h3>
                                                <p className="text-white/40 text-[11px] font-bold uppercase tracking-widest leading-loose">
                                                    Configura un script y selecciona un actor de voz para ver la magia de la sincronización labial neural.
                                                </p>
                                            </div>

                                            <div className="flex flex-wrap justify-center gap-3">
                                                <Badge variant="outline" className="text-white/20 border-white/10 text-[9px] font-black uppercase tracking-widest px-4 h-8 rounded-full">H.265</Badge>
                                                <Badge variant="outline" className="text-white/20 border-white/10 text-[9px] font-black uppercase tracking-widest px-4 h-8 rounded-full">REAL-TIME</Badge>
                                                <Badge variant="outline" className="text-white/20 border-white/10 text-[9px] font-black uppercase tracking-widest px-4 h-8 rounded-full">DOLBY VOICE</Badge>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {generatedVideoUrl && (
                                    <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10 flex justify-center gap-4">
                                        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-[10px] tracking-[0.2em] px-8 h-12 rounded-[20px] shadow-2xl shadow-indigo-600/20">
                                            EXPORTAR MASTER 4K
                                        </Button>
                                        <Button variant="outline" className="bg-white/5 border-white/10 text-white hover:bg-white/10 font-black uppercase text-[10px] tracking-[0.2em] px-8 h-12 rounded-[20px]">
                                            GUARDAR EN BIBLIOTECA
                                        </Button>
                                    </div>
                                )}
                            </Card>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
