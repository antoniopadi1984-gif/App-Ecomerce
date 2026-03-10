'use client';

import React, { useState, useEffect } from 'react';
import {
    Users, Plus, Loader2, Mic, Play, CheckCircle2,
    Trash2, User, Search, Filter, ChevronRight,
    Sparkles, Video, Fingerprint, Waves, Info,
    ArrowRight, Settings2, Globe, Heart, ShieldCheck,
    Image as ImageIcon, MoreVertical, Layout, List, X,
    Camera, UploadCloud, Check, TrendingUp, Target as LucideTarget
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useStore } from '@/context/StoreContext';
import { useProduct } from '@/context/ProductContext';
import { motion, AnimatePresence } from 'framer-motion';

// --- Types ---
type AvatarType = 'ALL' | 'AI_GENERATED' | 'REAL_ANON' | 'VOICE_CLONE';

interface Avatar {
    id: string;
    name: string;
    avatarId: string;
    type: AvatarType;
    creativesCount: number;
    imageUrl?: string;
    voiceId?: string;
    voiceName?: string;
    voiceProvider?: string;
    voiceSettings?: {
        stability: number;
        similarity_boost: number;
        style?: number;
        use_speaker_boost?: boolean;
    };
    status: 'ACTIVE' | 'ARCHIVED' | 'GENERATING';
    language: string;
    speed?: number;
}

export function AvataresIATab({ storeId, productId }: { storeId: string; productId: string }) {
    const [filter, setFilter] = useState<AvatarType>('ALL');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [activeProfileTab, setActiveProfileTab] = useState<'VOZ' | 'RENDIMIENTO' | 'ADN'>('ADN');
    const [activeVoiceTab, setActiveVoiceTab] = useState<'BIBLIOTECA' | 'CLONAR' | 'DISEÑAR'>('BIBLIOTECA');
    const [voiceFilters, setVoiceFilters] = useState({ gender: '', accent: '', age: '' });
    const [cloningFile, setCloningFile] = useState<File | null>(null);
    const [isCloning, setIsCloning] = useState(false);
    const [s2sFile, setS2sFile] = useState<File | null>(null);
    const [isTransforming, setIsTransforming] = useState(false);
    const [baseEmotion, setBaseEmotion] = useState('neutral');
    const [voices, setVoices] = useState<any[]>([]);
    const [loadingVoices, setLoadingVoices] = useState(false);
    const [performanceData, setPerformanceData] = useState<any>(null);
    const [loadingPerformance, setLoadingPerformance] = useState(false);

    const [avatars, setAvatars] = useState<Avatar[]>([
        {
            id: '1',
            name: 'Sofia Pawlin',
            avatarId: 'AV-9921',
            type: 'AI_GENERATED',
            creativesCount: 12,
            imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
            voiceName: 'Sofia Premium (ES)',
            status: 'ACTIVE',
            language: 'ES'
        },
        {
            id: '2',
            name: 'Marcus Croft',
            avatarId: 'AV-8812',
            type: 'REAL_ANON',
            creativesCount: 5,
            imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
            voiceName: 'Marcus Direct (EN)',
            status: 'ACTIVE',
            language: 'EN'
        },
        {
            id: '3',
            name: 'Elena Clone',
            avatarId: 'AV-7721',
            type: 'VOICE_CLONE',
            creativesCount: 24,
            imageUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop',
            voiceName: 'Elena Custom Clone',
            status: 'ACTIVE',
            language: 'ES'
        }
    ]);

    const [showCreateForm, setShowCreateForm] = useState(false);
    const [creationMethod, setCreationMethod] = useState<'IA_SCRATCH' | 'REAL_PHOTOS' | 'IMPORT'>('IA_SCRATCH');
    const [formName, setFormName] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formPsychographic, setFormPsychographic] = useState('');
    const [formVoiceId, setFormVoiceId] = useState('21m00Tcm4TlvDq8ikWAM');
    const [formLanguage, setFormLanguage] = useState('es');
    const [isGenerating, setIsGenerating] = useState(false);
    const [photos, setPhotos] = useState<File[]>([]);
    const [importedImage, setImportedImage] = useState<File | null>(null);
    const [acceptTerms, setAcceptTerms] = useState(false);

    useEffect(() => {
        if (activeVoiceTab === 'BIBLIOTECA' && voices.length === 0) {
            fetchVoices();
        }
    }, [activeVoiceTab, voiceFilters]);

    useEffect(() => {
        if (activeProfileTab === 'RENDIMIENTO' && selectedId) {
            fetchPerformance();
        }
    }, [activeProfileTab, selectedId]);

    const fetchPerformance = async () => {
        if (!selectedId) return;
        setLoadingPerformance(true);
        try {
            const res = await fetch(`/api/avatars/${selectedId}/performance?productId=${productId}`);
            const data = await res.json();
            setPerformanceData(data);
        } catch (e) {
            // Simulated data if API fails to show design
            setPerformanceData({
                summary: { avgCTR: 0.0245, avgCPA: 4.80, avgHookRate: 38.2, isBestAvatar: true, badges: ['Top 1% Conversion'] },
                creatives: [
                    { id: 'c1', nomenclatura: 'PURE-AV01-V1', concepto: 'Dolor', fase: 'FRIO', ctr: 0.032, cpa: 3.5, roas: 4.2, estado: 'ACTIVO' }
                ]
            });
        } finally {
            setLoadingPerformance(false);
        }
    };

    const fetchVoices = async () => {
        setLoadingVoices(true);
        try {
            const query = new URLSearchParams(voiceFilters as any).toString();
            const res = await fetch(`/api/voices?${query}`);
            const data = await res.json();
            setVoices(data.voices || []);
        } catch (e) {
            setVoices([
                { voice_id: 'v1', name: 'Sofia Premium', labels: { accent: 'Spanish', gender: 'female' }, preview_url: '#' },
                { voice_id: 'v2', name: 'Marcus Direct', labels: { accent: 'English', gender: 'male' }, preview_url: '#' }
            ]);
        } finally {
            setLoadingVoices(false);
        }
    };

    const handleUpdateVoice = async (voiceId: string, voiceName: string) => {
        if (!selectedId) return;
        setAvatars(prev => prev.map(a => a.id === selectedId ? { ...a, voiceId, voiceName } : a));
        try {
            await fetch(`/api/avatars/${selectedId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ voiceId, voiceName })
            });
            toast.success(`Voz actualizada`);
        } catch (e) { }
    };

    const handleUpdateSettings = async (key: string, value: any) => {
        if (!selectedId || !selectedAvatar) return;
        const newSettings = { stability: 0.5, similarity_boost: 0.75, ...selectedAvatar.voiceSettings, [key]: value } as Avatar['voiceSettings'];
        setAvatars(prev => prev.map(a => a.id === selectedId ? { ...a, voiceSettings: newSettings } : a));
        try {
            await fetch(`/api/avatars/${selectedId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ voiceSettings: newSettings })
            });
        } catch (e) { }
    };

    const handleCloneVoice = async () => {
        if (!cloningFile || !selectedAvatar) return;
        setIsCloning(true);
        try {
            const formData = new FormData();
            formData.append('file', cloningFile);
            formData.append('name', `Clone - ${selectedAvatar.name}`);
            const res = await fetch('/api/voices/clone', { method: 'POST', body: formData });
            const data = await res.json();
            if (data.success) {
                toast.success('Voz clonada');
                handleUpdateVoice(data.voiceId, `Clone - ${selectedAvatar.name}`);
                setCloningFile(null);
            }
        } catch (e) {
            toast.error('Error al clonar');
        } finally {
            setIsCloning(false);
        }
    };

    const handleSpeechToSpeech = async () => {
        if (!s2sFile || !selectedAvatar?.voiceId) return;
        setIsTransforming(true);
        try {
            const formData = new FormData();
            formData.append('file', s2sFile);
            formData.append('voiceId', selectedAvatar.voiceId);
            const res = await fetch('/api/voices/s2s', { method: 'POST', body: formData });
            const data = await res.json();
            if (data.success) toast.success('Transformación completada');
        } catch (e) {
            toast.error('Error en transformación');
        } finally {
            setIsTransforming(false);
        }
    };

    const handleGenerateVoicePreview = async () => {
        if (!selectedAvatar?.voiceId) return;
        toast.info('Generando preview de voz...');
    };

    const playVoicePreview = (url: string) => {
        if (url !== '#') {
            const audio = new Audio(url);
            audio.play();
        } else {
            toast.info('Preview simulado');
        }
    };

    const handleCreateAvatar = async () => {
        if (!formName) return;
        setIsGenerating(true);
        setTimeout(() => {
            const newAv: Avatar = {
                id: Math.random().toString(36).substring(7),
                name: formName,
                avatarId: `AV-${Math.floor(Math.random() * 9000) + 1000}`,
                type: creationMethod as AvatarType,
                creativesCount: 0,
                status: 'ACTIVE',
                language: formLanguage.toUpperCase(),
                imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop'
            };
            setAvatars(prev => [newAv, ...prev]);
            setShowCreateForm(false);
            setSelectedId(newAv.id);
            setIsGenerating(false);
            toast.success('Avatar creado correctamente');
        }, 1500);
    };

    const filteredAvatars = avatars.filter(a => filter === 'ALL' || a.type === filter);
    const selectedAvatar = avatars.find(a => a.id === selectedId);

    return (
        <div className="flex h-[calc(100vh-220px)] gap-4 animate-in fade-in duration-500 overflow-hidden relative">

            {/* SIDEBAR */}
            <aside className="w-[280px] flex flex-col bg-white border border-[var(--border)] rounded-xl overflow-hidden shrink-0 shadow-sm">
                <div className="p-4 border-b border-[var(--border)] space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Users size={16} className="text-[var(--cre)]" />
                            <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-primary)]">Avatares</h3>
                        </div>
                        <button
                            onClick={() => { setSelectedId(null); setShowCreateForm(true); }}
                            className="w-7 h-7 rounded-lg bg-[var(--cre)] text-white flex items-center justify-center hover:opacity-90 active:scale-95 transition-all shadow-sm"
                        >
                            <Plus size={16} />
                        </button>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" size={12} />
                        <input
                            placeholder="Buscar..."
                            className="w-full h-8 bg-[var(--bg)] border border-[var(--border)] rounded-lg pl-8 pr-3 text-[10px] font-bold uppercase outline-none focus:border-[var(--cre)]/40 transition-all text-[var(--text-primary)]"
                        />
                    </div>

                    <div className="flex gap-1 overflow-x-auto custom-scrollbar pb-1">
                        <FilterChip active={filter === 'ALL'} onClick={() => setFilter('ALL')} label="Todos" />
                        <FilterChip active={filter === 'AI_GENERATED'} onClick={() => setFilter('AI_GENERATED')} label="IA" />
                        <FilterChip active={filter === 'REAL_ANON'} onClick={() => setFilter('REAL_ANON')} label="Real" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-[var(--bg)]/10">
                    {filteredAvatars.map((av) => (
                        <AvatarCard
                            key={av.id}
                            avatar={av}
                            selected={selectedId === av.id && !showCreateForm}
                            onClick={() => { setSelectedId(av.id); setShowCreateForm(false); }}
                        />
                    ))}
                </div>

                <div className="p-3 bg-white border-t border-[var(--border)]">
                    <div className="p-3 rounded-lg bg-[var(--cre-bg)] border border-[var(--cre)]/10">
                        <p className="text-[9px] text-[var(--cre)] font-bold uppercase tracking-widest leading-relaxed">
                            Vinculación automática al producto activo.
                        </p>
                    </div>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 flex flex-col bg-white border border-[var(--border)] rounded-xl overflow-hidden relative shadow-sm">
                <AnimatePresence mode="wait">
                    {showCreateForm ? (
                        <motion.div key="form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col h-full bg-[var(--bg)]/20">
                            <div className="h-14 px-6 border-b border-[var(--border)] flex items-center justify-between bg-white">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-[var(--cre-bg)] text-[var(--cre)] flex items-center justify-center border border-[var(--cre)]/10">
                                        <Plus size={18} />
                                    </div>
                                    <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--text-primary)]">Nuevo Bio-AvatarIA</h2>
                                </div>
                                <button onClick={() => setShowCreateForm(false)} className="h-8 w-8 rounded-lg bg-[var(--bg)] flex items-center justify-center hover:bg-[var(--border)] transition-all">
                                    <X size={16} className="text-[var(--text-tertiary)]" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                                <div className="max-w-2xl mx-auto space-y-8">
                                    {/* Methods */}
                                    <div className="grid grid-cols-3 gap-3">
                                        <MethodCard active={creationMethod === 'IA_SCRATCH'} onClick={() => setCreationMethod('IA_SCRATCH')} icon={Sparkles} label="Generar IA" desc="Texto a Video" />
                                        <MethodCard active={creationMethod === 'REAL_PHOTOS'} onClick={() => setCreationMethod('REAL_PHOTOS')} icon={Camera} label="Modelo Real" desc="Fotos Propias" />
                                        <MethodCard active={creationMethod === 'IMPORT'} onClick={() => setCreationMethod('IMPORT')} icon={UploadCloud} label="Importar" desc="Imagen Lista" />
                                    </div>

                                    {/* Form Fields */}
                                    <div className="bg-white p-6 rounded-xl border border-[var(--border)] shadow-sm space-y-6">
                                        <div className="space-y-2">
                                            <Label>Nombre Identitario</Label>
                                            <Input value={formName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormName(e.target.value)} placeholder="Ej: Sofía Nutricionista" />
                                        </div>

                                        {creationMethod === 'IA_SCRATCH' && (
                                            <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                                <div className="space-y-2">
                                                    <Label>DNA Visual (Prompt)</Label>
                                                    <Textarea value={formDescription} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormDescription(e.target.value)} placeholder="Mujer 30 años, rasgos mediterráneos..." />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label color="orange">Perfil Psicográfico</Label>
                                                    <Textarea variant="accent" value={formPsychographic} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormPsychographic(e.target.value)} placeholder="Tono empático, lenguaje corporal de confianza..." />
                                                </div>
                                            </div>
                                        )}

                                        {creationMethod === 'REAL_PHOTOS' && (
                                            <div className="space-y-4 animate-in fade-in">
                                                <div className="p-8 border-2 border-dashed border-[var(--border)] rounded-xl flex flex-col items-center justify-center gap-3 bg-[var(--bg)]/50 hover:bg-[var(--cre-bg)]/20 cursor-pointer">
                                                    <Camera size={24} className="text-[var(--cre)]" />
                                                    <p className="text-[10px] font-bold uppercase text-[var(--cre)] tracking-widest">{photos.length > 0 ? `${photos.length} Fotos` : 'Subir 5+ Fotos'}</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <input type="checkbox" id="terms" checked={acceptTerms} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAcceptTerms(e.target.checked)} className="rounded border-[var(--border)] text-[var(--cre)]" />
                                                    <label htmlFor="terms" className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase leading-tight cursor-pointer">Confirmo derechos de imagen</label>
                                                </div>
                                            </div>
                                        )}

                                        <button
                                            onClick={handleCreateAvatar}
                                            disabled={isGenerating || !formName}
                                            className="w-full h-11 bg-[var(--cre)] text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-sm"
                                        >
                                            {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                            {isGenerating ? 'Iniciando Render IA...' : 'Generar Bio-Avatar'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ) : selectedAvatar ? (
                        <motion.div key={selectedAvatar.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col h-full">
                            <div className="h-14 px-6 border-b border-[var(--border)] flex items-center justify-between bg-white">
                                <div className="flex items-center gap-4">
                                    <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--text-primary)]">
                                        Avatar <span className="text-[var(--cre)]">/</span> {selectedAvatar.name}
                                    </h2>
                                    <span className="text-[8px] font-bold bg-[var(--bg)] text-[var(--text-tertiary)] px-2 py-0.5 rounded border border-[var(--border)] uppercase">{selectedAvatar.id}</span>
                                </div>
                                <div className="flex h-full gap-4">
                                    <NavButton active={activeProfileTab === 'ADN'} onClick={() => setActiveProfileTab('ADN')} label="ADN Visual" />
                                    <NavButton active={activeProfileTab === 'VOZ'} onClick={() => setActiveProfileTab('VOZ')} label="Ingeniería Voz" />
                                    <NavButton active={activeProfileTab === 'RENDIMIENTO'} onClick={() => setActiveProfileTab('RENDIMIENTO')} label="Métricas" />
                                </div>
                                <div className="flex gap-2">
                                    <button className="h-8 px-3 rounded-lg border border-[var(--border)] text-[var(--text-tertiary)] hover:text-rose-500 transition-all"><Trash2 size={14} /></button>
                                    <button className="h-8 px-4 rounded-lg bg-[var(--cre)] text-white text-[10px] font-bold uppercase flex items-center gap-2 shadow-sm"><Play size={12} fill="white" /> Test</button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                                <AnimatePresence mode="wait">
                                    {activeProfileTab === 'ADN' && (
                                        <motion.div key="adn" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                            <div className="flex gap-6">
                                                <div className="w-40 h-40 rounded-xl overflow-hidden border border-[var(--border)] shadow-sm bg-black shrink-0 relative group">
                                                    <img src={selectedAvatar.imageUrl} className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500" />
                                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                                        <ImageIcon size={20} className="text-white" />
                                                    </div>
                                                </div>
                                                <div className="flex-1 space-y-4">
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <StatMiniCard label="Categoría Bio" value={selectedAvatar.type.replace('_', ' ')} icon={Fingerprint} />
                                                        <StatMiniCard label="Idioma Nativo" value={selectedAvatar.language} icon={Globe} />
                                                    </div>
                                                    <div className="p-4 bg-[var(--bg)]/30 border border-[var(--border)] rounded-xl">
                                                        <p className="text-[8px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest mb-1">Identidad Psicográfica</p>
                                                        <p className="text-[11px] font-medium text-[var(--text-primary)] leading-relaxed italic opacity-80">
                                                            "Optimizado para tonos de autoridad con gesticulación natural. Algoritmo Omni-Human activo para sincronización bio-métrica."
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-6 pt-4 border-t border-[var(--border)]">
                                                <div className="space-y-4">
                                                    <HeaderWithIcon icon={Settings2} label="Capacidad Bio-Métrica" />
                                                    <CapabilityBar label="Lip Sync Accuracy" value={98} />
                                                    <CapabilityBar label="Eye Contact Ratio" value={92} />
                                                </div>
                                                <div className="bg-[var(--cre)] p-6 rounded-xl text-white flex flex-col justify-between shadow-sm">
                                                    <Sparkles size={20} />
                                                    <div>
                                                        <p className="text-xs font-bold uppercase tracking-tight">Conversion Grade A+</p>
                                                        <p className="text-[9px] font-medium opacity-80 uppercase mt-1">Sugerido para: VSL & Testimoniales</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {activeProfileTab === 'VOZ' && (
                                        <motion.div key="voz" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                            <div className="bg-white border border-[var(--border)] rounded-xl overflow-hidden shadow-sm">
                                                <div className="h-11 px-4 bg-[var(--bg)]/50 border-b border-[var(--border)] flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Mic size={14} className="text-[var(--cre)]" />
                                                        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-primary)]">Voice Engineering Lab</span>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        {['BIBLIOTECA', 'CLONAR', 'DISEÑAR'].map(v => (
                                                            <button
                                                                key={v}
                                                                onClick={() => setActiveVoiceTab(v as any)}
                                                                className={cn("px-3 h-7 rounded text-[9px] font-bold uppercase transition-all", activeVoiceTab === v ? "bg-[var(--cre)] text-white shadow-sm" : "hover:bg-white text-[var(--text-tertiary)]")}
                                                            >
                                                                {v}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="p-6">
                                                    {activeVoiceTab === 'BIBLIOTECA' && (
                                                        <div className="grid grid-cols-2 gap-8 animate-in fade-in">
                                                            <div className="space-y-4">
                                                                <div className="flex justify-between items-center px-1">
                                                                    <span className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">Select Engine</span>
                                                                    <div className="flex gap-1">
                                                                        <select className="h-7 text-[9px] font-bold uppercase bg-[var(--bg)] border border-[var(--border)] rounded px-2 outline-none"><option>Género</option></select>
                                                                        <select className="h-7 text-[9px] font-bold uppercase bg-[var(--bg)] border border-[var(--border)] rounded px-2 outline-none"><option>Acento</option></select>
                                                                    </div>
                                                                </div>
                                                                <div className="max-h-[280px] overflow-y-auto space-y-1.5 pr-2 custom-scrollbar">
                                                                    {voices.map(v => (
                                                                        <button
                                                                            key={v.voice_id}
                                                                            onClick={() => handleUpdateVoice(v.voice_id, v.name)}
                                                                            className={cn("w-full flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer", selectedAvatar.voiceId === v.voice_id ? "bg-[var(--cre-bg)] border-[var(--cre)]/20" : "bg-white border-transparent hover:bg-[var(--bg)]")}
                                                                        >
                                                                            <div className="flex items-center gap-3 text-left">
                                                                                <div className={cn("w-6 h-6 rounded bg-white border flex items-center justify-center", selectedAvatar.voiceId === v.voice_id ? "border-[var(--cre)] text-[var(--cre)]" : "border-[var(--border)] text-gray-300")}>
                                                                                    {selectedAvatar.voiceId === v.voice_id ? <Check size={12} /> : <div className="w-1 h-1 rounded-full bg-current" />}
                                                                                </div>
                                                                                <div>
                                                                                    <p className="text-[10px] font-bold text-[var(--text-primary)] uppercase">{v.name}</p>
                                                                                    <p className="text-[8px] font-bold text-[var(--text-tertiary)] uppercase">{v.labels?.accent}</p>
                                                                                </div>
                                                                            </div>
                                                                            <button onClick={(e) => { e.stopPropagation(); playVoicePreview(v.preview_url!); }} className="w-8 h-8 rounded-lg bg-white border border-[var(--border)] flex items-center justify-center text-[var(--cre)] hover:shadow-sm"><Play size={12} fill="currentColor" /></button>
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <div className="space-y-6">
                                                                <VoiceSettingSlider label="Stability" value={selectedAvatar.voiceSettings?.stability ?? 0.5} onChange={(v: number) => handleUpdateSettings('stability', v)} desc="Menos variaciones, más predictible." />
                                                                <VoiceSettingSlider label="Clarity" value={selectedAvatar.voiceSettings?.similarity_boost ?? 0.75} onChange={(v: number) => handleUpdateSettings('similarity_boost', v)} desc="Aumenta similitud con muestra original." />
                                                                <button onClick={handleGenerateVoicePreview} className="w-full h-11 bg-[var(--text-primary)] text-white rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-sm flex items-center justify-center gap-2"><Waves size={14} /> Preview Lab</button>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {activeVoiceTab === 'CLONAR' && (
                                                        <div className="grid grid-cols-2 gap-8 animate-in fade-in">
                                                            <label className="p-10 border-2 border-dashed border-[var(--border)] rounded-xl flex flex-col items-center justify-center gap-3 bg-[var(--bg)]/10 hover:bg-[var(--cre-bg)]/20 cursor-pointer transition-all">
                                                                <div className="w-12 h-12 rounded-xl bg-white border border-[var(--border)] flex items-center justify-center text-[var(--cre)] shadow-sm"><Mic size={24} /></div>
                                                                <p className="text-[10px] font-bold uppercase text-[var(--cre)]">{cloningFile ? cloningFile.name : 'Upload Voice Sample'}</p>
                                                                <p className="text-[8px] text-[var(--text-tertiary)] font-bold uppercase opacity-60">Mín 60s de audio limpio</p>
                                                                <input type="file" className="hidden" accept="audio/*" onChange={e => setCloningFile(e.target.files ? e.target.files[0] : null)} />
                                                            </label>
                                                            <div className="space-y-4">
                                                                <div className="p-5 bg-[var(--bg)]/40 rounded-xl border border-[var(--border)] space-y-3">
                                                                    <div className="flex items-center gap-2 text-[var(--cre)]"><Waves size={14} /><span className="text-[9px] font-bold uppercase">S2S Transformation</span></div>
                                                                    <p className="text-[9px] font-medium text-[var(--text-tertiary)] uppercase leading-relaxed">Transforma tu propia locución manteniendo el alma de tu voz original.</p>
                                                                    <button className="w-full h-9 bg-white border border-[var(--border)] rounded-lg text-[9px] font-bold uppercase tracking-widest hover:border-[var(--cre)]/40">Select Locution</button>
                                                                </div>
                                                                <button onClick={handleCloneVoice} disabled={!cloningFile || isCloning} className="w-full h-11 bg-[var(--cre)] text-white rounded-xl text-[10px] font-bold uppercase shadow-sm flex items-center justify-center gap-2">
                                                                    {isCloning ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} Generar ADN Clon
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {activeVoiceTab === 'DISEÑAR' && <div className="py-20 text-center text-[var(--text-tertiary)] uppercase text-[10px] font-bold italic opacity-40">Diseño Modular de Voz en Construcción...</div>}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {activeProfileTab === 'RENDIMIENTO' && (
                                        <motion.div key="perf" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                            {loadingPerformance ? <Loader2 size={32} className="mx-auto animate-spin text-[var(--cre)] my-20" /> : (
                                                <>
                                                    <div className="grid grid-cols-4 gap-4">
                                                        <StatMetricCard label="Avg CTR" value={`${(performanceData?.summary?.avgCTR * 100).toFixed(2)}%`} color="text-[var(--cre)]" icon={TrendingUp} />
                                                        <StatMetricCard label="Avg CPA" value={`${performanceData?.summary?.avgCPA.toFixed(2)}€`} color="text-rose-500" icon={LucideTarget} />
                                                        <StatMetricCard label="Hook Rate" value={`${performanceData?.summary?.avgHookRate.toFixed(1)}%`} color="text-orange-500" icon={Heart} />
                                                        <div className="p-5 rounded-xl bg-[var(--text-primary)] text-white flex flex-col justify-between shadow-sm">
                                                            <Sparkles size={16} className="text-[var(--cre)]" />
                                                            <div>
                                                                <p className="text-[10px] font-bold uppercase tracking-widest">{performanceData?.summary?.badges[0]}</p>
                                                                <p className="text-[8px] opacity-60 uppercase mt-1">High Performance Mark</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="bg-white border border-[var(--border)] rounded-xl overflow-hidden shadow-sm">
                                                        <div className="h-10 px-5 bg-[var(--bg)]/50 border-b border-[var(--border)] flex items-center justify-between">
                                                            <span className="text-[10px] font-bold uppercase text-[var(--text-primary)]">Historial de Rendimiento</span>
                                                        </div>
                                                        <div className="overflow-x-auto">
                                                            <table className="w-full text-left">
                                                                <thead>
                                                                    <tr className="border-b border-[var(--border)] text-[9px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">
                                                                        <th className="px-6 py-3">Creativo</th>
                                                                        <th className="px-6 py-3">Fase</th>
                                                                        <th className="px-6 py-3">CTR</th>
                                                                        <th className="px-6 py-3">CPA</th>
                                                                        <th className="px-6 py-3">ROAS</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {performanceData?.creatives.map((c: any) => (
                                                                        <tr key={c.id} className="border-b border-[var(--bg)] last:border-0 hover:bg-[var(--bg)]/30 transition-all text-[10px] font-bold">
                                                                            <td className="px-6 py-3 text-[var(--text-primary)] uppercase">{c.nomenclatura}</td>
                                                                            <td className="px-6 py-3 text-gray-400 uppercase">{c.fase}</td>
                                                                            <td className="px-6 py-3 text-[var(--cre)]">{(c.ctr * 100).toFixed(2)}%</td>
                                                                            <td className="px-6 py-3 text-rose-500">{c.cpa.toFixed(2)}€</td>
                                                                            <td className="px-6 py-3 text-[var(--inv)]">{c.roas.toFixed(2)}x</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col items-center justify-center p-20 text-center gap-6">
                            <div className="w-16 h-16 rounded-xl bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center text-[var(--text-tertiary)] opacity-30 shadow-sm"><User size={32} /></div>
                            <div className="space-y-2">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--text-primary)]">Perfilado de Avatares Omniscientes</h3>
                                <p className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-tight max-w-xs">IA Bio-Métrica para potenciar tu identidad de marca en producción UGC masiva.</p>
                            </div>
                            <button onClick={() => setShowCreateForm(true)} className="h-10 px-8 bg-[var(--cre)] text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:opacity-90 shadow-sm flex items-center gap-2 transition-all">
                                <Plus size={16} /> Crear Mi Primer Avatar
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Agent Subfooter */}
                <div className="h-10 px-6 bg-[var(--text-primary)] text-white border-t border-white/5 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2"><ShieldCheck size={12} className="text-emerald-400" /><span className="text-[9px] font-bold uppercase">Identity Verified</span></div>
                        <div className="flex items-center gap-2"><Waves size={12} className="text-blue-400" /><span className="text-[9px] font-bold uppercase">Sync Engine Active</span></div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/5">
                        <Sparkles size={10} className="text-[var(--cre)]" />
                        <span className="text-[8px] font-bold uppercase tracking-widest">Avatar Lab Active</span>
                    </div>
                </div>
            </main>
        </div>
    );
}

// --- Internal Helper Components ---

function FilterChip({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) {
    return (
        <button onClick={onClick} className={cn("px-3 py-1 rounded-full text-[9px] font-bold uppercase transition-all border whitespace-nowrap", active ? "bg-[var(--cre)] text-white border-transparent shadow-sm" : "bg-white text-[var(--text-tertiary)] border-[var(--border)] hover:border-[var(--cre)]/30")}>
            {label}
        </button>
    );
}

function AvatarCard({ avatar, selected, onClick }: any) {
    return (
        <button onClick={onClick} className={cn("w-full h-14 flex items-center gap-3 px-3 rounded-xl border transition-all text-left group", selected ? "bg-white border-[var(--cre)] shadow-sm" : "bg-transparent border-transparent hover:bg-white/50 border border-transparent")}>
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0 border border-[var(--border)]"><img src={avatar.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" /></div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between"><p className="text-[11px] font-bold uppercase text-[var(--text-primary)] truncate">{avatar.name}</p><span className="text-[8px] font-bold text-[var(--cre)] bg-[var(--cre-bg)]/20 px-1 rounded">{avatar.creativesCount}</span></div>
                <p className="text-[8px] font-bold uppercase text-[var(--text-tertiary)] mt-0.5">{avatar.avatarId} • {avatar.type.replace('_', ' ')}</p>
            </div>
            <ChevronRight size={12} className={cn("text-[var(--text-tertiary)]", selected && "text-[var(--cre)] translate-x-1")} />
        </button>
    );
}

function NavButton({ active, onClick, label }: any) {
    return (
        <button onClick={onClick} className={cn("px-4 relative h-full text-[10px] font-bold uppercase tracking-widest transition-all", active ? "text-[var(--cre)]" : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]")}>
            {label}
            {active && <motion.div layoutId="nav-line" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--cre)]" />}
        </button>
    );
}

function MethodCard({ active, onClick, icon: Icon, label, desc }: any) {
    return (
        <button onClick={onClick} className={cn("p-4 rounded-xl border transition-all text-left flex flex-col gap-3 group", active ? "bg-white border-[var(--cre)] shadow-sm" : "bg-white border-[var(--border)] hover:border-[var(--cre)]/20 grayscale opacity-60 hover:grayscale-0 hover:opacity-100")}>
            <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center transition-all", active ? "bg-[var(--cre)] text-white" : "bg-[var(--bg)] text-[var(--text-tertiary)]")}>
                <Icon size={18} />
            </div>
            <div>
                <p className="text-[11px] font-bold uppercase text-[var(--text-primary)]">{label}</p>
                <p className="text-[8px] font-bold uppercase text-[var(--text-tertiary)] mt-0.5 leading-none opacity-60">{desc}</p>
            </div>
        </button>
    );
}

function StatMiniCard({ label, value, icon: Icon }: any) {
    return (
        <div className="flex-1 p-3.5 bg-white border border-[var(--border)] rounded-xl space-y-2 group shadow-sm">
            <div className="flex items-center justify-between text-[var(--text-tertiary)]"><span className="text-[8px] font-bold uppercase tracking-widest">{label}</span><Icon size={12} /></div>
            <p className="text-lg font-bold uppercase text-[var(--text-primary)]">{value}</p>
        </div>
    );
}

function StatMetricCard({ label, value, color, icon: Icon }: any) {
    return (
        <div className="p-5 bg-white border border-[var(--border)] rounded-xl shadow-sm space-y-2">
            <div className="flex items-center justify-between opacity-40"><span className="text-[9px] font-bold uppercase text-[var(--text-tertiary)]">{label}</span><Icon size={14} /></div>
            <p className={cn("text-xl font-bold tracking-tight", color)}>{value}</p>
        </div>
    );
}

function VoiceSettingSlider({ label, value, onChange, desc }: any) {
    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center"><span className="text-[9px] font-bold uppercase text-[var(--text-tertiary)]">{label}</span><span className="text-[10px] font-bold text-[var(--cre)]">{(value * 100).toFixed(0)}%</span></div>
            <input type="range" min="0" max="1" step="0.01" value={value} onChange={e => onChange(parseFloat(e.target.value))} className="w-full h-1 bg-[var(--bg)] rounded-full appearance-none accent-[var(--cre)] cursor-pointer" />
            <p className="text-[8px] font-medium text-[var(--text-tertiary)] uppercase leading-tight italic opacity-60">{desc}</p>
        </div>
    );
}

function CapabilityBar({ label, value }: any) {
    return (
        <div className="space-y-1.5">
            <div className="flex justify-between items-center"><span className="text-[9px] font-bold uppercase text-[var(--text-tertiary)]">{label}</span><span className="text-[9px] font-bold text-[var(--cre)]">{value}%</span></div>
            <div className="h-1 bg-[var(--bg)] rounded-full border border-[var(--border)] overflow-hidden">
                <div className="h-full bg-[var(--cre)]" style={{ width: `${value}%` }} />
            </div>
        </div>
    );
}

function HeaderWithIcon({ icon: Icon, label }: any) {
    return (
        <div className="flex items-center gap-2 pb-2 border-b border-[var(--border)]"><Icon size={12} className="text-[var(--cre)]" /><span className="text-[9px] font-bold uppercase text-[var(--text-primary)] tracking-widest">{label}</span></div>
    );
}

function Label({ children, color }: any) {
    return <label className={cn("text-[9px] font-bold uppercase tracking-widest pl-1", color === 'orange' ? "text-[var(--cre)]" : "text-[var(--text-tertiary)]")}>{children}</label>;
}

function Input({ ...props }: any) {
    return <input {...props} className="w-full h-10 bg-[var(--bg)] border border-[var(--border)] rounded-lg px-4 text-xs font-bold uppercase outline-none focus:border-[var(--cre)]/40 transition-all text-[var(--text-primary)]" />;
}

function Textarea({ variant, ...props }: any) {
    return (
        <textarea
            {...props}
            className={cn(
                "w-full h-24 border rounded-lg p-4 text-xs font-bold uppercase outline-none transition-all resize-none text-[var(--text-primary)]",
                variant === 'accent' ? "bg-[var(--cre-bg)]/20 border-[var(--cre)]/10" : "bg-[var(--bg)] border-[var(--border)] focus:border-[var(--cre)]/40"
            )}
        />
    );
}
