'use client';

import React, { useState, useEffect } from 'react';
import {
    Upload, Link as LinkIcon, Sparkles,
    Trash2, Play, Loader2, Zap,
    Monitor, Target, BrainCircuit, Globe,
    ChevronRight, Activity, FileText, Share2,
    Gauge, Archive, BookOpen, Fingerprint, MousePointer2,
    Layers, Puzzle, MicOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const EXTENSION_ID = 'macdkmffemnkhgbejnjfmbpdmfboleoj';

interface Scene {
    thumbnail: string;
    start: string;
    end: string;
    text: string;
    type: 'hook' | 'problema' | 'mecanismo' | 'prueba' | 'CTA';
    emotion: string;
}

interface CompetitorVideo {
    id: string;
    thumbnail: string;
    videoUrl: string;
    title: string;
    source: string;
    date: string;
    duration: string;
    hookScore: number;
    hookType: string;
    status: 'ANALIZANDO' | 'LISTO' | 'ERROR';
    tags: string[];
    analysis?: {
        executive: {
            hookText: string;
            hookType: string;
            angle: string;
            framework: string;
            consciousness: string;
            mechanism: string;
            hookDuration: string;
            cutPace: string;
            scoreJustification: string;
        };
        scenes: Scene[];
        audio: {
            type: string;
            bpm: number;
            emotion: string;
            keywords: string[];
        };
        psychology: {
            biases: string[];
            aggressiveness: number;
            urgency: string;
            socialProof: string;
        };
    };
    voiceoverScript?: string;
    tomasCount: number;
    vocalsUrl?: string;
    musicUrl?: string;
    voiceoverRemoved: boolean;
}

interface CompetitorLibrary {
    id: string;
    advertiserName: string | null;
    advertiserUrl: string;
    platform: string;
    adCount: number;
    status: string;
    updatedAt: string;
}

interface LandingClone {
    id: string;
    originalUrl: string;
    clonedUrl: string | null;
    status: string;
    screenshotUrl: string | null;
    assetCount: number;
    createdAt: string;
}

interface BatchAnalysis {
    showBatch: boolean;
    totalAnalysed: number;
    avgHookDuration: string;
    avgCutPace: string;
    topHookTypes: string[];
    dominantFramework: string;
    recommendation: string;
}

export function CompetenciaTab({ storeId, productId, productSku }: {
    storeId: string,
    productId: string,
    productSku: string
}) {
    const [activeTab, setActiveTab] = useState<'ads' | 'libraries' | 'landings' | 'batch'>('ads');

    const [videos, setVideos] = useState<CompetitorVideo[]>([]);
    const [libraries, setLibraries] = useState<CompetitorLibrary[]>([]);
    const [landings, setLandings] = useState<LandingClone[]>([]);
    const [batchData, setBatchData] = useState<BatchAnalysis | null>(null);

    const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
    const [importUrl, setImportUrl] = useState('');
    const [advertiserUrl, setAdvertiserUrl] = useState('');
    const [isImporting, setIsImporting] = useState(false);
    const [loading, setLoading] = useState(false);
    const [extensionInstalled, setExtensionInstalled] = useState(true);
    const [showVOModal, setShowVOModal] = useState(false);
    const [isProcessingVO, setIsProcessingVO] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<{file: string, status: string}[]>([]);
    const [competitorName, setCompetitorName] = useState('');

    const selectedVideo = videos.find(v => v.id === selectedVideoId);

    // Detección de extensión
    useEffect(() => {
        const checkExtension = () => {
            const chrome = (window as any).chrome;
            if (chrome?.runtime?.sendMessage) {
                if (!EXTENSION_ID || EXTENSION_ID.length !== 32) { setExtensionInstalled(false); return; }
                chrome.runtime.sendMessage(EXTENSION_ID, { type: 'PING' }, (response: any) => {
                    if (chrome.runtime.lastError || !response) {
                        setExtensionInstalled(false);
                    } else {
                        setExtensionInstalled(true);
                    }
                });
            } else {
                setExtensionInstalled(false);
            }
        };

        checkExtension();
        const interval = setInterval(checkExtension, 5000);
        return () => clearInterval(interval);
    }, []);

    // Sincronización de producto activo
    useEffect(() => {
        if (productId && productId !== 'GLOBAL') {
            syncActiveProduct();
        }
    }, [productId]);

    const syncActiveProduct = async () => {
        try {
            // 1. Notificar a la API
            const res = await fetch('/api/extension/set-active-product', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId, storeId })
            });
            const data = await res.json();

            // 2. Notificar a la extensión si está instalada
            const chrome = (window as any).chrome;
            if (extensionInstalled && chrome?.runtime?.sendMessage) {
                if (!EXTENSION_ID || EXTENSION_ID.length !== 32) { setExtensionInstalled(false); return; }
                chrome.runtime.sendMessage(EXTENSION_ID, {
                    type: 'SET_ACTIVE_PRODUCT',
                    productId,
                    storeId,
                    productTitle: data.productTitle
                });
            }
        } catch (e) {
            console.error('Error syncing active product', e);
        }
    };

    useEffect(() => {
        if (productId && productId !== 'GLOBAL') {
            loadAllData();
        }
    }, [productId]);

    const loadAllData = async () => {
        setLoading(true);
        await Promise.all([
            fetchVideos(),
            fetchLibraries(),
            fetchLandings(),
            fetchBatchAnalysis()
        ]);
        setLoading(false);
    };

    const fetchVideos = async () => {
        try {
            const res = await fetch(`/api/centro-creativo/competencia?productId=${productId}`);
            const data = await res.json();
            if (data.videos) {
                // Sanitizar referencias a Spencer
                const sanitizedVideos = data.videos.map((v: any) => {
                    const videoStr = JSON.stringify(v);
                    const cleanStr = videoStr.replace(/Spencer Pawlin/g, 'Ecomboom Agent').replace(/Spencer/g, 'IA');
                    return JSON.parse(cleanStr);
                });
                setVideos(sanitizedVideos);
                if (sanitizedVideos.length > 0 && !selectedVideoId) {
                    setSelectedVideoId(sanitizedVideos[0].id);
                }
            }
        } catch (e) {
            console.error('Error fetching videos', e);
        }
    };

    const fetchLibraries = async () => {
        try {
            const res = await fetch(`/api/centro-creativo/competencia/libraries?productId=${productId}`);
            const data = await res.json();
            if (data.libraries) setLibraries(data.libraries);
        } catch (e) {
            console.error('Error fetching libraries', e);
        }
    };

    const fetchLandings = async () => {
        try {
            const res = await fetch(`/api/centro-creativo/competencia/landings?productId=${productId}`);
            const data = await res.json();
            if (data.landings) setLandings(data.landings);
        } catch (e) {
            console.error('Error fetching landings', e);
        }
    };

    const fetchBatchAnalysis = async () => {
        try {
            const res = await fetch(`/api/centro-creativo/competencia/batch-analysis?productId=${productId}`);
            const data = await res.json();
            if (data.success) {
                // Sanitizar referencias a Spencer
                const dataStr = JSON.stringify(data.data);
                const cleanStr = dataStr.replace(/Spencer Pawlin/g, 'Ecomboom Agent').replace(/Spencer/g, 'IA');
                setBatchData(JSON.parse(cleanStr));
            }
            else setBatchData(null);
        } catch (e) {
            console.error('Error fetching batch analysis', e);
        }
    };

    const handleUrlImport = async () => {
        if (!importUrl.trim()) return;
        setIsImporting(true);
        const toastId = toast.loading("Analizando vídeo...");
        try {
            const res = await fetch('/api/centro-creativo/competencia', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: importUrl, productId, storeId })
            });
            if (!res.ok) throw new Error();
            toast.success("Vídeo importado. Análisis en proceso.", { id: toastId });
            setImportUrl('');
            setTimeout(fetchVideos, 1500); // Dar un margen para el registro inicial
        } catch (e) {
            toast.error("Error al importar vídeo", { id: toastId });
        } finally {
            setIsImporting(false);
        }
    };

    const handleAdvertiserSpy = async () => {
        if (!advertiserUrl.trim()) return;
        setIsImporting(true);
        const toastId = toast.loading("Registrando espiado de biblioteca...");
        try {
            const res = await fetch('/api/extension/library-spy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ advertiserUrl, productId, storeId })
            });
            if (!res.ok) throw new Error();
            toast.success("Espiado solicitado. Ver progreso en pestaña Bibliotecas.", { id: toastId });
            setAdvertiserUrl('');
            fetchLibraries();
        } catch (e) {
            toast.error("Error al registrar espiado. ¿Tienes la extensión?", { id: toastId });
        } finally {
            setIsImporting(false);
        }
    };

    const handlePrepareVO = async () => {
        if (!selectedVideoId) return;
        setIsProcessingVO(true);
        const toastId = toast.loading("Preparando voz en off (Scribe v2 + Tomas)...");
        try {
            const res = await fetch('/api/agents/video/voiceover/prepare', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ videoId: selectedVideoId })
            });
            if (!res.ok) throw new Error();
            toast.success("Preparación iniciada. Recarga en unos segundos para ver el script.", { id: toastId });
            setTimeout(fetchVideos, 5000);
        } catch (e) {
            toast.error("Error al preparar voz en off", { id: toastId });
        } finally {
            setIsProcessingVO(false);
        }
    };

    const handleRemoveVO = async () => {
        if (!selectedVideoId) return;
        setIsProcessingVO(true);
        const toastId = toast.loading("Eliminando voz en off (Demucs)...");
        try {
            const res = await fetch('/api/agents/video/voiceover/remove', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ videoId: selectedVideoId })
            });
            if (!res.ok) throw new Error();
            toast.success("Voz en off eliminada con éxito.", { id: toastId });
            setShowVOModal(false);
            fetchVideos();
        } catch (e) {
            toast.error("Error al eliminar voz en off", { id: toastId });
        } finally {
            setIsProcessingVO(false);
        }
    };

    const handleMassiveUpload = async (files: FileList) => {
        if (!productId || !storeId || !files.length) return;
        setUploading(true);
        
        const formData = new FormData();
        formData.append('productId', productId);
        formData.append('competitorName', competitorName || 'COMPETIDOR');
        
        const fileList = Array.from(files);
        setUploadProgress(fileList.map(f => ({ file: f.name, status: 'en cola' })));
        
        for (const file of fileList) {
            formData.append('videos', file);
        }

        try {
            const res = await fetch('/api/spy/bulk-ingest', {
                method: 'POST',
                headers: { 'X-Store-Id': storeId },
                body: formData
            });
            const data = await res.json();
            if (data.ok) {
                toast.success(`${data.totalQueued} vídeos en procesamiento — la IA está analizando`);
                setUploadProgress(data.jobs.map((j: any) => ({ file: j.fileName, status: 'procesando...' })));
            }
        } catch (e) {
            toast.error('Error al subir vídeos');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex gap-4 h-[calc(100vh-140px)] animate-in fade-in duration-500">
            {/* COLUMN LEFT */}
            <aside className="w-[300px] flex flex-col gap-4 shrink-0">
                <div className="bg-white p-4 rounded-xl border border-[var(--border)] shadow-sm space-y-4">
                    <div className="space-y-1">
                        <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)] font-bold">Inteligencia Competitiva</span>
                        <h2 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-tight">Análisis de Mercado</h2>
                    </div>

                    <div className="space-y-3">
                        {/* URL INDIVIDUAL */}
                        <div className="relative">
                            <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
                            <input
                                value={importUrl}
                                onChange={e => setImportUrl(e.target.value)}
                                placeholder="Pega URL (TikTok, YT, Meta...)"
                                className="w-full h-8 pl-9 pr-8 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[11px] text-[var(--text-primary)] outline-none focus:border-[var(--cre)] transition-all font-medium"
                            />
                            {importUrl && (
                                <button onClick={handleUrlImport} className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md bg-[var(--cre)] text-white flex items-center justify-center hover:opacity-90">
                                    <ChevronRight size={14} />
                                </button>
                            )}
                        </div>

                        {/* URL ANUNCIANTE / LOTE */}
                        <div className="relative pt-4 border-t border-[var(--border)]">
                            <div className="flex items-center gap-2 mb-2">
                                <Target size={12} className="text-[var(--cre)]" />
                                <span className="text-[10px] font-bold text-[var(--text-primary)] uppercase tracking-wider">Espiar Anunciante</span>
                            </div>
                            <div className="flex gap-2">
                                <input
                                    value={advertiserUrl}
                                    onChange={e => setAdvertiserUrl(e.target.value)}
                                    placeholder="URL de Biblioteca / Perfil..."
                                    className="flex-1 h-8 px-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[11px] text-[var(--text-primary)] outline-none focus:border-[var(--cre)] transition-all font-medium"
                                />
                                <button
                                    onClick={handleAdvertiserSpy}
                                    className="h-8 px-3 bg-[var(--cre)] text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all flex items-center gap-1.5 whitespace-nowrap"
                                >
                                    <Zap size={10} fill="currentColor" />
                                    Espiar
                                </button>
                            </div>
                        </div>

                        {/* Área de upload masivo */}
                        <div className="border-2 border-dashed border-[var(--border)] rounded-xl p-4 text-center bg-[var(--bg)]/30">
                            <input type="text" 
                                placeholder="Nombre del competidor (ej: BRAND_X)"
                                value={competitorName}
                                onChange={e => setCompetitorName(e.target.value)}
                                className="w-full mb-3 px-3 py-1.5 rounded-lg bg-white border border-[var(--border)] text-[10px] uppercase font-bold text-[var(--text-primary)] outline-none focus:border-[var(--cre)]"
                            />
                            <label className="cursor-pointer block group">
                                <input type="file" accept="video/*" multiple className="hidden"
                                    onChange={e => e.target.files && handleMassiveUpload(e.target.files)}
                                    disabled={uploading}
                                />
                                <div className="flex flex-col items-center gap-1">
                                    <Upload className={`w-5 h-5 ${uploading ? 'animate-bounce text-[var(--cre)]' : 'text-[var(--text-tertiary)] group-hover:text-[var(--cre)]'}`} />
                                    <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">
                                        {uploading ? 'Procesando...' : 'Subida Masiva'}
                                    </span>
                                    <span className="text-[8px] text-[var(--text-tertiary)] uppercase tracking-tight">
                                        La IA analiza y organiza automáticamente
                                    </span>
                                </div>
                            </label>
                            
                            {/* Progress list */}
                            {uploadProgress.length > 0 && (
                                <div className="mt-3 space-y-1 text-left max-h-[100px] overflow-y-auto custom-scrollbar pr-1">
                                    {uploadProgress.map((item, i) => (
                                        <div key={i} className="flex items-center gap-2 text-[8px] font-bold uppercase">
                                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                                item.status === 'procesando...' ? 'bg-yellow-400 animate-pulse' :
                                                item.status.includes('INGESTING') ? 'bg-blue-400 animate-pulse' : 
                                                'bg-[var(--border)]'
                                            }`} />
                                            <span className="text-[var(--text-tertiary)] truncate flex-1">{item.file}</span>
                                            <span className="text-[var(--text-tertiary)]">{item.status}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* COLLECTION SELECTOR */}
                <div className="flex-1 bg-white rounded-xl border border-[var(--border)] shadow-sm overflow-hidden flex flex-col">
                    <div className="p-3 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg)]/10">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)]">Colección ({videos.length})</span>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1.5">
                        {loading && (
                            <div className="flex-1 flex items-center justify-center p-8">
                                <Loader2 size={16} className="text-[var(--cre)] animate-spin" />
                            </div>
                        )}
                        {videos.length === 0 && !loading && (
                            <div className="flex-1 flex items-center justify-center p-4">
                                <p className="text-[10px] text-[var(--text-tertiary)] text-center uppercase tracking-widest">
                                    Sin vídeos.<br />Importa o sube el primero.
                                </p>
                            </div>
                        )}
                        {videos.map(video => (
                            <button
                                key={video.id}
                                onClick={() => { setSelectedVideoId(video.id); setActiveTab('ads'); }}
                                className={cn(
                                    "w-full rounded-lg transition-all text-left border p-2 flex items-center gap-3 group",
                                    selectedVideoId === video.id ? "bg-[var(--cre-bg)] border-[var(--cre)]/30" : "bg-transparent border-transparent hover:bg-[var(--bg)]"
                                )}
                            >
                                <div className="relative h-10 w-16 bg-black rounded-lg overflow-hidden shrink-0">
                                    <img src={video.thumbnail} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                                    <div className="absolute inset-0 flex items-center justify-center"><Play size={10} fill="white" className="text-white ml-0.5" /></div>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h4 className="text-[10px] font-semibold text-[var(--text-primary)] truncate uppercase leading-tight">{video.title}</h4>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[8px] font-bold text-[var(--text-tertiary)] uppercase">{video.duration}</span>
                                        <span className={cn("text-[8px] font-bold px-1 py-0.5 rounded", (video.hookScore || 0) >= 8 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700")}>
                                            Score: {video.hookScore || 0}
                                        </span>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </aside>

            {/* COLUMN RIGHT */}
            <main className="flex-1 overflow-hidden flex flex-col bg-white rounded-xl border border-[var(--border)] shadow-sm">
                {/* Extension Banner */}
                {!extensionInstalled && (
                    <div className="bg-[var(--cre-bg)] border-b border-[var(--cre)]/20 px-6 py-2 flex items-center justify-between animate-in slide-in-from-top duration-300">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-[var(--cre)] shadow-sm">
                                <Puzzle size={16} />
                            </div>
                            <p className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-tight">
                                Instala la extensión Chrome para capturar anuncios con 1 clic
                            </p>
                        </div>
                        <a
                            href="https://chrome.google.com/webstore/detail/ecomboom"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-[var(--cre)] text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-[var(--cre)]/20"
                        >
                            Instalar Extensión
                        </a>
                    </div>
                )}

                {/* Navigation Tabs */}
                <div className="h-12 px-6 border-b border-[var(--border)] bg-gray-50/50 flex items-center justify-between shrink-0">
                    <div className="flex gap-6 h-full">
                        <button
                            onClick={() => setActiveTab('ads')}
                            className={cn("h-full px-2 text-[11px] font-bold uppercase tracking-wider transition-all border-b-2 relative", activeTab === 'ads' ? "border-[var(--cre)] text-[var(--cre)]" : "border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]")}
                        >
                            Anuncios Capturados
                        </button>
                        <button
                            onClick={() => setActiveTab('libraries')}
                            className={cn("h-full px-2 text-[11px] font-bold uppercase tracking-wider transition-all border-b-2", activeTab === 'libraries' ? "border-[var(--cre)] text-[var(--cre)]" : "border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]")}
                        >
                            Bibliotecas Espiadas
                            {libraries.length > 0 && (
                                <span className="ml-2 px-1.5 py-0.5 bg-[var(--cre)] text-white text-[8px] rounded-full">{libraries.length}</span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('landings')}
                            className={cn("h-full px-2 text-[11px] font-bold uppercase tracking-wider transition-all border-b-2", activeTab === 'landings' ? "border-[var(--cre)] text-[var(--cre)]" : "border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]")}
                        >
                            Landings Capturadas
                        </button>
                        {batchData && batchData.showBatch && (
                            <button
                                onClick={() => setActiveTab('batch')}
                                className={cn("h-full px-2 text-[11px] font-bold uppercase tracking-wider transition-all border-b-2", activeTab === 'batch' ? "border-emerald-500 text-emerald-600" : "border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]")}
                            >
                                <span className="flex items-center gap-2">
                                    <Activity size={12} />
                                    Análisis en Lote
                                </span>
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {extensionInstalled ? (
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-500/10 uppercase tracking-widest flex items-center gap-1.5">
                                <Zap size={10} fill="currentColor" />
                                Extension Activa
                            </span>
                        ) : (
                            <span className="text-[10px] font-bold text-[var(--cre)] bg-[var(--cre-bg)] px-2 py-1 rounded border border-[var(--cre)]/10 uppercase tracking-widest">Extension Requerida</span>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col relative">
                    {loading && (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-50 flex items-center justify-center">
                            <div className="flex flex-col items-center gap-3">
                                <Loader2 size={32} className="text-[var(--cre)] animate-spin" />
                                <span className="text-[10px] font-black text-[var(--cre)] uppercase tracking-widest">Cargando Inteligencia...</span>
                            </div>
                        </div>
                    )}

                    {/* Ads Tab */}
                    {activeTab === 'ads' && (
                        <>
                            {selectedVideo ? (
                                selectedVideo.analysis ? (
                                    <div className="flex-1 flex flex-col overflow-hidden">
                                        <div className="h-10 px-4 border-b border-[var(--border)] bg-[var(--bg)]/10 flex items-center justify-between shrink-0">
                                            <div className="flex items-center gap-2">
                                                <button className="h-7 px-3 rounded-lg bg-[var(--cre)] text-white text-[10px] font-medium uppercase tracking-wider hover:opacity-90 flex items-center gap-1.5"><Zap size={12} /> Replicar Estructura</button>
                                                <button className="h-7 px-3 rounded-lg bg-white border border-[var(--border)] text-[var(--text-secondary)] text-[10px] font-medium uppercase tracking-wider hover:bg-[var(--bg)]">Usar Hook</button>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button className="p-1.5 text-[var(--text-tertiary)] hover:text-rose-500 transition-colors"><Trash2 size={14} /></button>
                                                <button className="p-1.5 text-[var(--text-tertiary)] hover:text-[var(--cre)] transition-colors"><Share2 size={14} /></button>
                                            </div>
                                        </div>

                                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                                            <div className="grid grid-cols-12 gap-8">
                                                <div className="col-span-12 xl:col-span-5 space-y-4">
                                                    <div className="aspect-[9/16] bg-black rounded-xl overflow-hidden shadow-md relative group max-w-[300px] mx-auto xl:mx-0">
                                                        <video src={selectedVideo.videoUrl} className="w-full h-full object-cover" controls />
                                                    </div>
                                                    <div className="flex justify-around items-center py-3 bg-[var(--bg)]/50 rounded-xl border border-[var(--border)] max-w-[300px] mx-auto xl:mx-0">
                                                        <div className="flex flex-col items-center">
                                                            <span className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase">Cuts/Min</span>
                                                            <span className="text-base font-semibold text-[var(--text-primary)]">{selectedVideo.analysis.executive.cutPace}</span>
                                                        </div>
                                                        <div className="w-[1px] h-6 bg-[var(--border)]" />
                                                        <div className="flex flex-col items-center">
                                                            <span className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase">Hook Duration</span>
                                                            <span className="text-base font-semibold text-[var(--text-primary)]">{selectedVideo.analysis.executive.hookDuration}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="col-span-12 xl:col-span-7 space-y-6">
                                                    <div className="bg-white border border-[var(--border)] rounded-xl p-5 space-y-5">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-lg bg-[var(--bg)] text-[var(--cre)] flex items-center justify-center border border-[var(--border)]"><BrainCircuit size={16} /></div>
                                                            <div>
                                                                <h3 className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">Resumen Ejecutivo</h3>
                                                                <p className="text-xs font-semibold text-[var(--text-primary)] uppercase">Análisis de Vídeo</p>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-4">
                                                            <div className="p-4 bg-[var(--bg)]/30 border border-[var(--border)] rounded-lg">
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <h4 className="text-[9px] font-bold text-[var(--text-secondary)] uppercase">Hook Transcrito</h4>
                                                                    <span className="px-1.5 py-0.5 rounded bg-[var(--cre-bg)] text-[var(--cre)] text-[8px] font-bold uppercase border border-[var(--cre)]/10">{selectedVideo.analysis.executive.hookType}</span>
                                                                </div>
                                                                <p className="text-sm font-semibold text-[var(--text-primary)] italic leading-relaxed">"{selectedVideo.analysis.executive.hookText}"</p>
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-3">
                                                                <InfoItem icon={Target} label="Ángulo" value={selectedVideo.analysis.executive.angle} />
                                                                <InfoItem icon={FileText} label="Framework" value={selectedVideo.analysis.executive.framework} />
                                                                <InfoItem icon={Gauge} label="Consciencia" value={selectedVideo.analysis.executive.consciousness} />
                                                                <InfoItem icon={Zap} label="Mecanismo" value={selectedVideo.analysis.executive.mechanism} />
                                                            </div>

                                                            <div className="p-4 bg-[var(--cre-bg)] border border-[var(--cre)]/20 rounded-lg">
                                                                <div className="flex items-center gap-2 mb-1.5">
                                                                    <Sparkles size={14} className="text-[var(--cre)]" />
                                                                    <span className="text-[9px] font-bold text-[var(--cre)] uppercase tracking-wide">Hook Score AI: {selectedVideo?.hookScore}/10</span>
                                                                </div>
                                                                <p className="text-[11px] text-[var(--text-primary)] font-medium leading-relaxed opacity-80">{selectedVideo?.analysis?.executive.scoreJustification}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex items-center justify-center p-12">
                                        <div className="text-center space-y-2">
                                            <Loader2 size={24} className="text-[var(--cre)] animate-spin mx-auto" />
                                            <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-widest">
                                                Analizando vídeo...
                                            </p>
                                        </div>
                                    </div>
                                )
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4 opacity-30">
                                    <Monitor size={48} strokeWidth={1} className="text-[var(--text-tertiary)]" />
                                    <div className="space-y-1">
                                        <h2 className="text-xs font-semibold uppercase tracking-tight text-[var(--text-primary)]">Selector de Inteligencia</h2>
                                        <p className="text-[10px] font-medium text-[var(--text-tertiary)] max-w-[200px] uppercase leading-tight">
                                            Selecciona un vídeo para desplegar el análisis completo.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* Libraries Tab */}
                    {activeTab === 'libraries' && (
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {libraries.length === 0 ? (
                                    <div className="col-span-full py-20 text-center">
                                        <Archive size={40} className="mx-auto text-gray-200 mb-4" />
                                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No hay bibliotecas espiadas</p>
                                        <p className="text-[10px] text-gray-400 mt-2 uppercase">Usa el botón de la izquierda para espiar un anunciante</p>
                                    </div>
                                ) : (
                                    libraries.map(lib => (
                                        <div key={lib.id} className="ds-card p-5 group hover:border-[var(--cre)]/30 transition-all cursor-pointer bg-white border border-[var(--border)] rounded-xl shadow-sm">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded bg-[var(--bg)] flex items-center justify-center text-[var(--cre)]">
                                                        <Globe size={16} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase truncate pr-2">{lib.advertiserName || "Anunciante"}</h3>
                                                        <p className="text-[8px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">{lib.platform}</p>
                                                    </div>
                                                </div>
                                                <span className={cn("text-[8px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0",
                                                    lib.status === 'COMPLETED' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                                                )}>
                                                    {lib.status}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 my-4">
                                                <div className="bg-[var(--bg)] p-3 rounded-lg border border-[var(--border)]">
                                                    <p className="text-[8px] font-bold text-[var(--text-tertiary)] uppercase mb-1">Anuncios</p>
                                                    <p className="text-sm font-bold text-[var(--text-primary)]">{lib.adCount}</p>
                                                </div>
                                                <div className="bg-[var(--bg)] p-3 rounded-lg border border-[var(--border)]">
                                                    <p className="text-[8px] font-bold text-[var(--text-tertiary)] uppercase mb-1">Clips</p>
                                                    <p className="text-sm font-bold text-[var(--text-primary)]">--</p>
                                                </div>
                                            </div>
                                            <button className="w-full py-2 bg-white border border-[var(--border)] rounded-lg text-[9px] font-bold uppercase tracking-widest text-[var(--text-secondary)] group-hover:bg-[var(--cre-bg)] group-hover:text-[var(--cre)] group-hover:border-[var(--cre)]/20 transition-all">Ver Detalle Biblioteca</button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* Landings Tab */}
                    {activeTab === 'landings' && (
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {landings.length === 0 ? (
                                    <div className="col-span-full py-20 text-center">
                                        <BookOpen size={40} className="mx-auto text-gray-200 mb-4" />
                                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No hay landings capturadas</p>
                                        <p className="text-[10px] text-gray-400 mt-2 uppercase">Usa la extensión para capturar landings competidoras</p>
                                    </div>
                                ) : (
                                    landings.map(landing => (
                                        <div key={landing.id} className="ds-card overflow-hidden group hover:border-[var(--cre)]/30 transition-all cursor-pointer bg-white border border-[var(--border)] rounded-xl shadow-sm">
                                            <div className="aspect-[16/9] bg-gray-100 relative">
                                                {landing.screenshotUrl ? (
                                                    <img src={landing.screenshotUrl} className="w-full h-full object-cover" alt="Landing" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                        <Monitor size={24} />
                                                    </div>
                                                )}
                                                <div className="absolute top-3 left-3 flex gap-2">
                                                    <span className="px-2 py-0.5 bg-black/60 text-white text-[8px] font-bold rounded uppercase backdrop-blur-sm">
                                                        {landing.originalUrl ? new URL(landing.originalUrl).hostname : 'Landing'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="p-4 space-y-4">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[8px] font-bold text-[var(--text-tertiary)] uppercase">CAPTURADA: {new Date(landing.createdAt).toLocaleDateString()}</span>
                                                    <span className="text-[9px] font-bold text-[var(--cre)] bg-[var(--cre-bg)] px-2 py-0.5 rounded">{landing.assetCount} ASSETS</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button className="flex-1 py-2 bg-[var(--text-primary)] text-white text-[9px] font-bold uppercase tracking-widest rounded-lg hover:opacity-90 transition-all">Generar Mejora AI</button>
                                                    <button className="px-3 py-2 bg-white border border-[var(--border)] rounded-lg text-[var(--text-secondary)] hover:bg-gray-50 transition-all">
                                                        <ChevronRight size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* Batch Tab */}
                    {activeTab === 'batch' && batchData && (
                        <div className="flex-1 overflow-y-auto p-8 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            {/* Summary Header */}
                            <div className="flex justify-between items-end border-b border-[var(--border)] pb-8">
                                <div>
                                    <div className="flex items-center gap-2 text-emerald-600 mb-2">
                                        <Activity size={18} />
                                        <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Data Mining Competitivo</span>
                                    </div>
                                    <h2 className="text-2xl font-bold text-[var(--text-primary)] uppercase tracking-tight">Análisis Predictivo en Lote</h2>
                                    <p className="text-xs text-[var(--text-tertiary)] mt-1 uppercase tracking-widest font-bold">Patrones detectados sobre {batchData.totalAnalysed} anuncios procesados</p>
                                </div>

                                <div className="flex gap-10">
                                    <div className="text-right">
                                        <p className="text-[10px] text-[var(--text-tertiary)] uppercase font-bold mb-1">Duración Media</p>
                                        <p className="text-2xl font-black text-[var(--text-primary)] leading-none">{batchData.avgHookDuration}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-[var(--text-tertiary)] uppercase font-bold mb-1">Ritmo de Cortes</p>
                                        <p className="text-2xl font-black text-[var(--text-primary)] leading-none">{batchData.avgCutPace}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Top Patterns Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Hooks Dominantes */}
                                <div className="ds-card p-6 bg-white border border-[var(--border)] rounded-xl relative overflow-hidden group shadow-sm">
                                    <div className="absolute top-0 right-0 p-6 opacity-5 rotate-12 group-hover:rotate-0 transition-transform">
                                        <Fingerprint size={80} />
                                    </div>
                                    <div className="relative z-10">
                                        <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <MousePointer2 size={12} className="text-[var(--cre)]" /> Hooks con Mayor Ganancia de Scroll
                                        </p>
                                        <div className="space-y-3">
                                            {batchData.topHookTypes.map((type, i) => (
                                                <div key={type} className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <span className="w-4 h-4 rounded-full bg-[var(--cre)] text-white text-[10px] flex items-center justify-center font-bold">#{i + 1}</span>
                                                        <span className="text-sm font-bold text-[var(--text-primary)] uppercase">{type}</span>
                                                    </div>
                                                    <div className="h-1.5 w-24 bg-gray-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-[var(--cre)]" style={{ width: i === 0 ? '100%' : i === 1 ? '60%' : '30%' }} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Framework Ganador */}
                                <div className="ds-card p-6 bg-white border border-[var(--border)] rounded-xl relative overflow-hidden group shadow-sm">
                                    <div className="absolute top-0 right-0 p-6 opacity-5 rotate-12 group-hover:rotate-0 transition-transform">
                                        <Layers size={80} />
                                    </div>
                                    <div className="relative z-10">
                                        <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <Zap size={12} className="text-amber-500" /> Framework de Conversión Estructural
                                        </p>
                                        <div className="bg-[var(--bg)] p-4 rounded-lg border border-dashed border-[var(--border)]">
                                            <p className="text-lg font-black text-[var(--text-primary)] uppercase tracking-tight mb-2">{batchData.dominantFramework}</p>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="px-2 py-1 bg-white rounded text-[9px] font-bold border border-[var(--border)]">GANCHO</span>
                                                <ChevronRight size={10} className="text-gray-400" />
                                                <span className="px-2 py-1 bg-[var(--cre-bg)] text-[var(--cre)] rounded text-[9px] font-bold border border-[var(--cre)]/10">MECANISMO</span>
                                                <ChevronRight size={10} className="text-gray-400" />
                                                <span className="px-2 py-1 bg-white rounded text-[9px] font-bold border border-[var(--border)]">DEMO</span>
                                                <ChevronRight size={10} className="text-gray-400" />
                                                <span className="px-2 py-1 bg-white rounded text-[9px] font-bold border border-[var(--border)]">OFERTA</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* IA Recommendation */}
                            <div className="p-8 rounded-2xl bg-emerald-50 border border-emerald-100 shadow-sm relative overflow-hidden">
                                <div className="absolute -right-10 -top-10 text-emerald-100 opacity-50">
                                    <Sparkles size={200} />
                                </div>
                                <div className="relative z-10 flex gap-6">
                                    <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-200">
                                        <BrainCircuit size={28} />
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">IA Strategic Recommendation</span>
                                            <h3 className="text-xl font-bold text-emerald-900 mt-1 italic leading-relaxed pr-20">"{batchData.recommendation}"</h3>
                                        </div>
                                        <div className="flex gap-3">
                                            <button className="px-6 py-2 bg-emerald-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg hover:opacity-90 transition-all">Aplicar Estrategia a Briefs</button>
                                            <button className="px-6 py-2 bg-white text-emerald-900 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-all">Añadir a Memoria del Agente</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                {/* Voice-Over Removal Modal */}
                {showVOModal && selectedVideo && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-[var(--border)] animate-in zoom-in-95 duration-300">
                            <div className="p-6 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center">
                                        <MicOff size={20} />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-black text-gray-900 uppercase">Confirmar Eliminación de Voz</h2>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Proceso Irreversible</p>
                                    </div>
                                </div>

                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
                                    <p className="text-[10px] font-black text-gray-400 uppercase">Script Guardado:</p>
                                    <p className="text-xs text-gray-700 font-medium italic leading-relaxed line-clamp-4">
                                        "{selectedVideo.voiceoverScript ? JSON.parse(selectedVideo.voiceoverScript).words.map((w: any) => w.text).join(' ') : 'Sin script'}"
                                    </p>
                                </div>

                                <div className="space-y-4 pt-2">
                                    <p className="text-[11px] text-gray-600 font-medium text-center">
                                        ¿Confirmar eliminación de voz en off del audio?<br />
                                        <span className="font-bold text-gray-900 shrink-0">El vídeo mantendrá música y efectos de fondo.</span>
                                    </p>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setShowVOModal(false)}
                                            className="flex-1 h-10 bg-gray-100 text-gray-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={handleRemoveVO}
                                            disabled={isProcessingVO}
                                            className="flex-1 h-10 bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all flex items-center justify-center gap-2"
                                        >
                                            {isProcessingVO && <Loader2 size={12} className="animate-spin" />}
                                            Eliminar Audio
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

function InfoItem({ icon: Icon, label, value }: { icon: any, label: string, value?: string }) {
    return (
        <div className="p-3 bg-white border border-[var(--border)] rounded-lg flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-[var(--bg)] flex items-center justify-center text-[var(--cre)]/60"><Icon size={12} /></div>
            <div className="min-w-0">
                <p className="text-[8px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider leading-none mb-0.5">{label}</p>
                <p className="text-[10px] font-bold text-[var(--text-primary)] uppercase truncate">{value || "---"}</p>
            </div>
        </div>
    );
}
