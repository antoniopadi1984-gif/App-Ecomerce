'use client';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
    UploadCloud, FileVideo, Loader2, CheckCircle2, AlertCircle,
    Play, Mic, Languages, Scissors, Music, Layers, Copy,
    ChevronRight, Clock, Tag, Plus, Video, HardDrive, Sparkles,
    Link, Download, Package, ExternalLink, RefreshCw, X, Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface VideoCard {
    id: string;
    assetId?: string;
    jobId?: string;
    fileName: string;
    status: 'PENDING' | 'INGESTED' | 'TRANSCRIBED' | 'ANALYZED' | 'SPLIT' | 'ORGANIZED' | 'DONE' | 'ERROR';
    progress: number;
    hook?: string;
    funnelStage?: string;
    type?: string;
    nomenclature?: string;
    transcription?: string;
    expanded: boolean;
}

const STATUS_LABELS: Record<string, string> = {
    'PENDING': 'Preparando...',
    'INGESTED': 'Transcribiendo audio...',
    'TRANSCRIBED': 'IA Analizando anuncio...',
    'ANALYZED': 'Dividiendo escenas...',
    'SPLIT': 'Subiendo a Drive...',
    'ORGANIZED': 'Sincronizando...',
    'DONE': 'Proceso completado',
    'ERROR': 'Hubo un error'
};

export function VideoLabTab({ storeId, productId, marketLang }: {
    storeId: string; productId: string; marketLang?: string;
}) {
    const [view, setView] = useState<'WORKSPACE' | 'META' | 'DRIVE' | 'UPLOAD'>('WORKSPACE');
    const [videoType, setVideoType] = useState<'propio' | 'competencia'>('propio');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // BIBLIOTECA META - Real data
    const [metaCreatives, setMetaCreatives] = useState<any[]>([]);
    const [loadingMeta, setLoadingMeta] = useState(false);
    const [metaUrl, setMetaUrl] = useState('');
    const [importingUrl, setImportingUrl] = useState(false);

    // DRIVE - Real data
    const [driveFolders, setDriveFolders] = useState<any[]>([]);
    const [loadingDrive, setLoadingDrive] = useState(false);

    // UPLOAD - Progress tracking
    const [uploadingVideo, setUploadingVideo] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    // AI GENERATION
    const [generatingVariants, setGeneratingVariants] = useState(false);
    const [analyzingHook, setAnalyzingHook] = useState(false);
    const [hookAnalysis, setHookAnalysis] = useState<string | null>(null);
    const [generatedVariants, setGeneratedVariants] = useState<any[]>([]);

    // WORKSPACE load (my own videos from library)
    const [ownCreatives, setOwnCreatives] = useState<any[]>([]);
    const [loadingWorkspace, setLoadingWorkspace] = useState(false);

    // Fetch own creatives (WORKSPACE view)
    const fetchOwnCreatives = useCallback(async () => {
        setLoadingWorkspace(true);
        try {
            const q = productId && productId !== 'GLOBAL' ? `productId=${productId}` : '';
            const res = await fetch(`/api/creative/library?${q}&type=VIDEO`);
            const data = await res.json();
            if (data.success) setOwnCreatives(data.creatives || []);
        } catch (e) {
            console.error('[VideoLab] Error fetching workspace:', e);
        } finally {
            setLoadingWorkspace(false);
        }
    }, [productId]);

    // Fetch Meta (Biblioteca Meta)
    const fetchMetaLibrary = useCallback(async () => {
        setLoadingMeta(true);
        try {
            const q = productId && productId !== 'GLOBAL' ? `productId=${productId}` : '';
            const res = await fetch(`/api/competitor/ads?${q}`, {
                headers: { 'X-Store-Id': storeId }
            });
            const data = await res.json();
            if (data.ads) {
                // Map CompetitorAd to fit the UI
                const mapped = data.ads.map((ad: any) => ({
                    id: ad.id,
                    concept: ad.title || 'Anuncio Competencia',
                    thumbnailUrl: null, // Si Meta nos da imagen
                    videoUrl: ad.url,
                    stage: ad.analysisJson ? JSON.parse(ad.analysisJson).awareness : 'COLD',
                    status: ad.status || 'ACTIVE',
                    createdAt: ad.createdAt,
                    ctr: null,
                    revenue: 0,
                    spend: 0
                }));
                setMetaCreatives(mapped);
            }
        } catch (e) {
            console.error('[VideoLab] Error fetching meta library:', e);
        } finally {
            setLoadingMeta(false);
        }
    }, [productId, storeId]);

    // Fetch Drive folders
    const fetchDriveFolders = useCallback(async () => {
        setLoadingDrive(true);
        try {
            const productParam = productId && productId !== 'GLOBAL' ? `?productId=${productId}` : '';
            const res = await fetch(`/api/drive/files${productParam}`);
            const data = await res.json();
            if (data.success || data.files) {
                setDriveFolders(data.files || data.folders || []);
            }
        } catch (e) {
            console.error('[VideoLab] Drive fetch error:', e);
        } finally {
            setLoadingDrive(false);
        }
    }, [productId]);

    useEffect(() => {
        if (view === 'WORKSPACE') fetchOwnCreatives();
        if (view === 'META') fetchMetaLibrary();
        if (view === 'DRIVE') fetchDriveFolders();
    }, [view, productId]);

    // ── IMPORT META ADS LIBRARY URL ────────────────────────────────────────
    const handleImportUrl = async () => {
        if (!metaUrl.trim()) {
            toast.error('Pega un enlace de la Meta Ads Library o del anuncio');
            return;
        }
        if (!metaUrl.includes('facebook') && !metaUrl.includes('meta') && !metaUrl.includes('instagram')) {
            toast.error('El enlace debe ser de Meta Ads Library o Facebook');
            return;
        }
        setImportingUrl(true);
        try {
            const res = await fetch('/api/competitor/ads', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Store-Id': storeId
                },
                body: JSON.stringify({
                    url: metaUrl.trim(),
                    productId: productId !== 'GLOBAL' ? productId : undefined,
                    cloneMode: true
                })
            });
            const data = await res.json();
            if (data.ok) {
                toast.success('Anuncio importado. La IA está analizando la estructura...');
                setMetaUrl('');
                // Refresh library after a delay (analysis takes time)
                setTimeout(fetchMetaLibrary, 3000);
            } else {
                throw new Error(data.error || 'Error al importar');
            }
        } catch (e: any) {
            toast.error(e.message || 'Error al importar el anuncio');
        } finally {
            setImportingUrl(false);
        }
    };

    // ── UPLOAD VIDEO ────────────────────────────────────────────────────────
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 500 * 1024 * 1024) {
            toast.error('El archivo es demasiado grande. Máximo 500MB.');
            return;
        }

        setUploadingVideo(true);
        setUploadProgress(0);
        
        // Vamos a usar un Toast ID para actualizarlo dinámicamente
        const toastId = toast.loading('Subiendo vídeo para procesamiento...');

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('productId', productId.toString());
            // Opcional: añadir hint de concept/funnel stage si los tienes en la UI
            
            const res = await fetch('/api/video-lab/process', {
                method: 'POST',
                headers: {
                    'X-Store-Id': storeId
                },
                body: formData
            });

            if (!res.ok) {
                throw new Error('Error al iniciar procesamiento de video');
            }

            const data = await res.json();
            
            if (data.jobId) {
                toast.loading('Analizando el anuncio con la IA...', { id: toastId });
                
                // Empezar a hacer polling del jobId
                const pollInterval = setInterval(async () => {
                    const statusRes = await fetch(`/api/video-lab/process?jobId=${data.jobId}`);
                    if (!statusRes.ok) return;
                    
                    const jobStatus = await statusRes.json();
                    
                    if (jobStatus) {
                        setUploadProgress(jobStatus.progress || 0);
                        
                        // Si el frontend tiene un texto de step lo mostramos
                        if (jobStatus.status) {
                            toast.loading(`Procesando: ${STATUS_LABELS[jobStatus.status] || jobStatus.status}`, { id: toastId });
                        }
                        
                        if (jobStatus.status === 'DONE') {
                            clearInterval(pollInterval);
                            toast.success(`Pipeline finalizado. ${jobStatus.fileName} analizado y dividido.`, { id: toastId });
                            
                            setTimeout(() => {
                                setUploadingVideo(false);
                                setUploadProgress(0);
                                setView('WORKSPACE');
                                fetchOwnCreatives();
                            }, 1500);
                        } else if (jobStatus.status === 'ERROR') {
                            clearInterval(pollInterval);
                            toast.error(jobStatus.error || 'Error en el procesamiento IA.', { id: toastId });
                            setUploadingVideo(false);
                            setUploadProgress(0);
                        }
                    }
                }, 3000); // Polling cada 3 segundos
            }

        } catch (e: any) {
            console.error(e);
            setUploadingVideo(false);
            setUploadProgress(0);
            toast.error(e.message || 'Error al conectar con el servidor', { id: toastId });
        }

        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // ── GENERAR VARIANTES ───────────────────────────────────────────────────
    const handleGenerateVariants = async () => {
        if (productId === 'GLOBAL') {
            toast.error('Selecciona un producto específico en el TopBar primero');
            return;
        }
        setGeneratingVariants(true);
        setGeneratedVariants([]);
        try {
            const res = await fetch('/api/creative/generate-videos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId,
                    maxVideos: 5
                })
            });
            const data = await res.json();
            if (data.success) {
                setGeneratedVariants(data.videos || []);
                toast.success(`${data.videos?.length || 0} variantes generadas correctamente`);
                // Refresh workspace
                fetchOwnCreatives();
            } else {
                throw new Error(data.error || 'Error al generar variantes');
            }
        } catch (e: any) {
            toast.error(e.message || 'Error al generar variantes');
        } finally {
            setGeneratingVariants(false);
        }
    };

    // ── ANALIZAR GANCHO ─────────────────────────────────────────────────────
    const handleAnalyzeHook = async () => {
        if (ownCreatives.length === 0) {
            toast.info('Sube un video primero para analizar su gancho');
            return;
        }
        const lastVideo = ownCreatives[0];
        setAnalyzingHook(true);
        setHookAnalysis(null);
        try {
            const res = await fetch(`/api/agents/creativo-chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [{
                        role: 'user',
                        content: `Analiza el gancho de este video: ${lastVideo.concept || lastVideo.videoUrl}. Dame: 1) Por qué funciona o no, 2) el hook rate estimado, 3) cómo mejorarlo en 3 puntos concretos.`
                    }],
                    storeId,
                    context: { module: 'Centro Creativo', productId, path: '/centro-creativo/video-lab' }
                })
            });
            const data = await res.json();
            if (data.success) {
                setHookAnalysis(data.response);
            } else {
                throw new Error(data.error || 'Error de análisis');
            }
        } catch (e: any) {
            toast.error(e.message || 'Error al analizar el gancho');
        } finally {
            setAnalyzingHook(false);
        }
    };

    const STANDARD_FOLDERS = ['01_HOOKS', '02_CRUDE_CONTENT', '03_EDITS', '04_RESOURCES'];

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] animate-in fade-in duration-500">
            {/* TOP ACTIONS BAR */}
            <div className="flex items-center justify-between p-4 bg-white border-b border-[var(--border)] rounded-t-xl">
                <div className="flex gap-2">
                    <button
                        onClick={() => setView('UPLOAD')}
                        className={cn("h-10 px-5 rounded-lg font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all shadow-sm",
                            view === 'UPLOAD' ? "bg-[var(--cre)] text-white" : "bg-white text-[var(--text-tertiary)] border border-[var(--border)]")}
                    >
                        <UploadCloud size={16} />
                        Subir Videos
                    </button>
                    <button
                        onClick={() => setView('META')}
                        className={cn("h-10 px-5 rounded-lg font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all shadow-sm",
                            view === 'META' ? "bg-[var(--cre)] text-white" : "bg-white text-[var(--text-tertiary)] border border-[var(--border)]")}
                    >
                        <Layers size={16} />
                        Biblioteca Meta
                    </button>
                    <button
                        onClick={() => setView('DRIVE')}
                        className={cn("h-10 px-5 rounded-lg font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all shadow-sm",
                            view === 'DRIVE' ? "bg-[var(--cre)] text-white" : "bg-white text-[var(--text-tertiary)] border border-[var(--border)]")}
                    >
                        <FileVideo size={16} />
                        Biblioteca Drive
                    </button>
                    <button
                        onClick={() => setView('WORKSPACE')}
                        className="h-10 px-5 rounded-lg bg-[var(--text-primary)] text-white font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-sm"
                    >
                        <Plus size={16} />
                        Nuevo
                    </button>
                </div>

                <div className="flex items-center gap-2 text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-tight">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Agente Video Lab Activo
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* LEFT PANEL */}
                <aside className="w-64 border-r border-[var(--border)] bg-white p-4 flex flex-col gap-6 overflow-y-auto">
                    <div>
                        <h4 className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase tracking-[0.2em] mb-4">Mis Creaciones</h4>
                        <div className="space-y-1">
                            {loadingWorkspace ? (
                                <div className="flex items-center justify-center py-4">
                                    <Loader2 size={16} className="animate-spin text-[var(--text-tertiary)]" />
                                </div>
                            ) : ownCreatives.length === 0 ? (
                                <p className="text-[9px] text-[var(--text-tertiary)] italic text-center py-4">No hay videos creados aún</p>
                            ) : (
                                ownCreatives.slice(0, 5).map(c => (
                                    <div key={c.id} className="p-3 rounded-xl bg-[var(--bg)]/10 border border-[var(--border)] hover:border-[var(--cre)]/40 transition-all cursor-pointer group">
                                        <div className="text-[11px] font-bold text-[var(--text-primary)] uppercase truncate">{c.concept}</div>
                                        <div className="flex items-center justify-between mt-1">
                                            <span className={cn("text-[8px] uppercase font-bold", c.status === 'GENERATED' ? 'text-emerald-500' : 'text-[var(--text-tertiary)]')}>{c.status}</span>
                                            <ChevronRight size={12} className="text-[var(--text-tertiary)] group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="mt-auto p-4 rounded-xl bg-[var(--cre-bg)]/20 border border-[var(--cre)]/10">
                        <div className="flex items-center gap-2 text-[var(--cre)] mb-2">
                            <Mic size={14} />
                            <span className="text-[9px] font-bold uppercase tracking-wider">Agente IA</span>
                        </div>

                        {hookAnalysis ? (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[8px] font-bold text-emerald-600 uppercase">Análisis completado</span>
                                    <button onClick={() => setHookAnalysis(null)} className="text-slate-400 hover:text-slate-700">
                                        <X size={10} />
                                    </button>
                                </div>
                                <p className="text-[10px] text-[var(--text-primary)] leading-relaxed max-h-32 overflow-y-auto">{hookAnalysis}</p>
                            </div>
                        ) : (
                            <p className="text-[11px] text-[var(--text-primary)] font-medium leading-relaxed opacity-70 italic mb-4">
                                "¿Quieres que analice el gancho de tu último video o prefieres que genere 5 variantes optimizadas?"
                            </p>
                        )}

                        <div className="flex flex-col gap-2 mt-3">
                            <button
                                onClick={handleGenerateVariants}
                                disabled={generatingVariants}
                                className="w-full py-2 px-3 rounded-lg bg-[var(--cre)] text-white text-[9px] font-black uppercase tracking-widest hover:bg-[var(--cre)]/90 transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-60"
                            >
                                {generatingVariants ? (
                                    <><Loader2 size={12} className="animate-spin" /> Generando...</>
                                ) : (
                                    <><Zap size={12} /> Generar 5 Variantes</>
                                )}
                            </button>
                            <button
                                onClick={handleAnalyzeHook}
                                disabled={analyzingHook}
                                className="w-full py-2 px-3 rounded-lg bg-white border border-[var(--cre)]/30 text-[var(--cre)] text-[9px] font-black uppercase tracking-widest hover:bg-[var(--cre-bg)]/10 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                            >
                                {analyzingHook ? (
                                    <><Loader2 size={12} className="animate-spin" /> Analizando...</>
                                ) : (
                                    'Analizar Gancho'
                                )}
                            </button>
                        </div>
                    </div>
                </aside>

                {/* MAIN WORKSPACE */}
                <main className="flex-1 bg-white p-6 overflow-y-auto relative">
                    <div className="max-w-5xl mx-auto h-full">

                        {/* ── WORKSPACE VIEW ─────────────────────────────── */}
                        {view === 'WORKSPACE' && (
                            <div className="space-y-6">
                                {/* Generated variants result */}
                                {generatedVariants.length > 0 && (
                                    <div className="animate-in slide-in-from-top-2 duration-500">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-primary)] flex items-center gap-2">
                                                <Sparkles size={16} className="text-[var(--cre)]" />
                                                {generatedVariants.length} Variantes Generadas
                                            </h3>
                                            <button onClick={() => setGeneratedVariants([])} className="text-slate-400 hover:text-slate-700 text-[9px] font-bold uppercase">
                                                Limpiar
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                            {generatedVariants.map((v, i) => (
                                                <div key={i} className="bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden">
                                                    <div className="aspect-[9/16] bg-slate-900 flex items-center justify-center relative">
                                                        <Play size={20} className="text-white opacity-30" />
                                                        <div className="absolute top-2 left-2 text-[8px] font-black bg-[var(--cre)] text-white px-1.5 py-0.5 rounded uppercase">
                                                            V{i + 1}
                                                        </div>
                                                    </div>
                                                    <div className="p-2">
                                                        <div className="text-[9px] font-bold text-slate-700 truncate">{v.concept || `Variante ${i + 1}`}</div>
                                                        {v.videoUrl && (
                                                            <a href={v.videoUrl} target="_blank" rel="noopener noreferrer"
                                                                className="mt-1 flex items-center gap-1 text-[8px] font-bold text-[var(--cre)] hover:underline">
                                                                <ExternalLink size={8} /> Ver video
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Own library list OR empty state */}
                                {loadingWorkspace ? (
                                    <div className="flex flex-col items-center justify-center h-64 gap-4">
                                        <Loader2 className="w-10 h-10 text-[var(--cre)] animate-spin opacity-40" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cargando biblioteca...</p>
                                    </div>
                                ) : ownCreatives.length === 0 && generatedVariants.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-center py-20 gap-4">
                                        <div className="w-16 h-16 rounded-xl bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center text-[var(--text-tertiary)] opacity-30 shadow-sm">
                                            <Video size={32} strokeWidth={1} />
                                        </div>
                                        <div className="space-y-2">
                                            <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-widest">Área de Trabajo - Video Lab</h2>
                                            <p className="text-[10px] text-[var(--text-tertiary)] uppercase font-medium max-w-sm mx-auto leading-relaxed">
                                                Selecciona un video de tus bibliotecas o sube uno nuevo para comenzar la edición optimizada.
                                            </p>
                                        </div>
                                        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl">
                                            <button onClick={() => setView('UPLOAD')} className="p-6 rounded-xl border border-[var(--border)] border-dashed bg-white hover:bg-[var(--cre-bg)]/10 transition-all group flex flex-col items-center gap-3">
                                                <UploadCloud size={24} className="text-[var(--text-tertiary)] group-hover:text-[var(--cre)]" />
                                                <span className="text-[10px] font-bold uppercase text-[var(--text-tertiary)]">Subir Archivo</span>
                                            </button>
                                            <button onClick={() => setView('DRIVE')} className="p-6 rounded-xl border border-[var(--border)] border-dashed bg-white hover:bg-[var(--cre-bg)]/10 transition-all group flex flex-col items-center gap-3">
                                                <HardDrive size={24} className="text-[var(--text-tertiary)] group-hover:text-[var(--cre)]" />
                                                <span className="text-[10px] font-bold uppercase text-[var(--text-tertiary)]">Desde Drive</span>
                                            </button>
                                            <button onClick={handleGenerateVariants} disabled={generatingVariants} className="p-6 rounded-xl border border-[var(--cre)]/40 border-dashed bg-[var(--cre-bg)]/5 hover:bg-[var(--cre-bg)]/20 transition-all group flex flex-col items-center gap-3 disabled:opacity-50">
                                                {generatingVariants ? <Loader2 size={24} className="text-[var(--cre)] animate-spin" /> : <Sparkles size={24} className="text-[var(--cre)] animate-pulse" />}
                                                <span className="text-[10px] font-bold uppercase text-[var(--cre)]">{generatingVariants ? 'Generando...' : 'Auto-Generar IA'}</span>
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {ownCreatives.map(creative => (
                                            <div key={creative.id} className="bg-white border border-slate-100 rounded-2xl group overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
                                                <div className="aspect-[9/16] bg-slate-900 relative">
                                                    {creative.thumbnailUrl ? (
                                                        <img src={creative.thumbnailUrl} alt={creative.concept} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <Play size={32} className="text-white opacity-20" />
                                                        </div>
                                                    )}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                                        {creative.videoUrl && (
                                                            <a href={creative.videoUrl} target="_blank" rel="noopener noreferrer"
                                                                className="w-full py-1.5 bg-white text-slate-900 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1">
                                                                <Play size={10} fill="currentColor" /> Ver Video
                                                            </a>
                                                        )}
                                                    </div>
                                                    <div className="absolute top-2 right-2">
                                                        <span className="px-1.5 py-0.5 bg-emerald-500 text-white text-[8px] font-black rounded uppercase">
                                                            {creative.status === 'GENERATED' ? 'Listo' : creative.status}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="p-3">
                                                    <div className="text-[10px] font-bold text-slate-900 uppercase truncate">{creative.concept}</div>
                                                    <div className="text-[8px] text-slate-400 uppercase font-bold mt-1 flex items-center gap-1">
                                                        <Clock size={9} />{new Date(creative.createdAt).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── UPLOAD VIEW ────────────────────────────────── */}
                        {view === 'UPLOAD' && (
                            <div className="animate-in slide-in-from-bottom-2 duration-500 max-w-2xl mx-auto space-y-8">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-primary)]">Subir Nuevo Video</h3>
                                    <div className="flex bg-[var(--bg)] p-1 rounded-lg border border-[var(--border)]">
                                        <button
                                            onClick={() => setVideoType('propio')}
                                            className={cn("px-4 py-1.5 rounded-md text-[9px] font-bold uppercase transition-all", videoType === 'propio' ? "bg-white text-[var(--cre)] shadow-sm" : "text-[var(--text-tertiary)]")}
                                        >
                                            Propio
                                        </button>
                                        <button
                                            onClick={() => setVideoType('competencia')}
                                            className={cn("px-4 py-1.5 rounded-md text-[9px] font-bold uppercase transition-all", videoType === 'competencia' ? "bg-white text-[var(--cre)] shadow-sm" : "text-[var(--text-tertiary)]")}
                                        >
                                            Competencia
                                        </button>
                                    </div>
                                </div>

                                {uploadingVideo ? (
                                    <div className="p-16 border-2 border-dashed border-[var(--cre)]/40 rounded-xl text-center bg-[var(--cre-bg)]/5 space-y-4">
                                        <Loader2 size={40} className="mx-auto text-[var(--cre)] animate-spin" />
                                        <p className="text-[11px] font-bold uppercase text-[var(--text-primary)]">Subiendo video...</p>
                                        <div className="w-full bg-slate-100 rounded-full h-2">
                                            <div className="h-2 bg-[var(--cre)] rounded-full transition-all duration-500"
                                                style={{ width: `${uploadProgress}%` }} />
                                        </div>
                                        <p className="text-[9px] text-[var(--text-tertiary)] uppercase">{uploadProgress}%</p>
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="p-20 border-2 border-dashed border-[var(--border)] rounded-xl text-center relative group bg-[var(--bg)]/10 hover:bg-[var(--cre-bg)]/20 transition-all cursor-pointer"
                                    >
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="video/*"
                                            className="hidden"
                                            onChange={handleFileChange}
                                        />
                                        <UploadCloud size={40} className="mx-auto text-[var(--cre)] opacity-40 mb-4 group-hover:scale-110 transition-transform" />
                                        <p className="text-[11px] font-bold uppercase text-[var(--text-primary)]">Arrastra tu video {videoType} aquí</p>
                                        <p className="text-[9px] font-bold uppercase text-[var(--text-tertiary)] mt-2 italic opacity-60">Soporta MP4, MOV, WEBM (Max 500MB)</p>
                                    </div>
                                )}

                                {!uploadingVideo && (
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full h-11 bg-[var(--cre)] text-white rounded-lg font-bold uppercase text-[10px] tracking-widest shadow-sm hover:bg-[var(--cre)]/90 transition-all flex items-center justify-center gap-2"
                                    >
                                        <UploadCloud size={16} />Seleccionar Archivo Local
                                    </button>
                                )}
                            </div>
                        )}

                        {/* ── META LIBRARY VIEW ──────────────────────────── */}
                        {view === 'META' && (
                            <div className="animate-in slide-in-from-bottom-2 duration-500 h-full space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-primary)] flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center text-[var(--cre)] shadow-sm">
                                            <Layers size={14} />
                                        </div>
                                        Biblioteca Meta Ads
                                    </h3>
                                    <button onClick={fetchMetaLibrary} className="p-2 rounded-lg border border-[var(--border)] hover:bg-slate-50 text-slate-400 hover:text-slate-700 transition-all">
                                        <RefreshCw size={14} className={loadingMeta ? 'animate-spin' : ''} />
                                    </button>
                                </div>

                                {/* Import URL input */}
                                <div className="flex gap-2 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                    <div className="flex-1 flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5">
                                        <Link size={14} className="text-slate-400 shrink-0" />
                                        <input
                                            type="url"
                                            value={metaUrl}
                                            onChange={e => setMetaUrl(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleImportUrl()}
                                            placeholder="https://www.facebook.com/ads/library/?id=..."
                                            className="flex-1 text-[11px] font-medium bg-transparent outline-none text-slate-800 placeholder:text-slate-400"
                                        />
                                        {metaUrl && (
                                            <button onClick={() => setMetaUrl('')} className="text-slate-400 hover:text-slate-700">
                                                <X size={12} />
                                            </button>
                                        )}
                                    </div>
                                    <button
                                        onClick={handleImportUrl}
                                        disabled={importingUrl || !metaUrl.trim()}
                                        className="px-6 py-2.5 bg-[var(--text-primary)] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-slate-700 transition-all flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {importingUrl ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                                        {importingUrl ? 'Importando...' : 'Importar'}
                                    </button>
                                </div>

                                {/* Creatives grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
                                    {loadingMeta ? (
                                        <div className="col-span-full flex flex-col items-center justify-center py-20 gap-4">
                                            <Loader2 className="w-10 h-10 text-[var(--cre)] animate-spin opacity-40" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sincronizando Biblioteca...</p>
                                        </div>
                                    ) : metaCreatives.length === 0 ? (
                                        <div className="col-span-full flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-200">
                                            <Video className="w-12 h-12 text-slate-200 mb-4" />
                                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">No hay anuncios importados aún</p>
                                            <p className="text-[9px] text-slate-400 mt-1 uppercase">Pega el enlace de un anuncio de la Meta Ads Library arriba</p>
                                        </div>
                                    ) : (
                                        metaCreatives.map((creative) => (
                                            <div key={creative.id} className="bg-white border border-slate-100 rounded-2xl group overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
                                                <div className="aspect-[9/16] bg-slate-900 relative">
                                                    {creative.thumbnailUrl ? (
                                                        <img src={creative.thumbnailUrl} alt={creative.concept} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <Play size={32} className="text-white opacity-20" />
                                                        </div>
                                                    )}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                                                        <button
                                                            onClick={() => creative.videoUrl && window.open(creative.videoUrl, '_blank')}
                                                            className="w-full py-2 bg-white text-slate-900 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                                                        >
                                                            <Play size={12} fill="currentColor" /> Ver Video
                                                        </button>
                                                    </div>
                                                    <div className="absolute top-3 left-3 flex gap-1">
                                                        <span className={cn(
                                                            "px-2 py-0.5 text-[8px] font-black rounded uppercase shadow-sm text-white",
                                                            creative.stage === 'COLD' ? "bg-blue-500" : creative.stage === 'WARM' ? "bg-orange-500" : "bg-rose-500"
                                                        )}>
                                                            {creative.stage || 'TEST'}
                                                        </span>
                                                    </div>
                                                    <div className="absolute top-3 right-3">
                                                        <span className="px-2 py-0.5 bg-emerald-500 text-white text-[8px] font-black rounded uppercase shadow-sm">
                                                            {creative.status === 'GENERATED' ? 'Listo' : creative.status}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="p-4 space-y-3">
                                                    <div>
                                                        <div className="text-[11px] font-bold text-slate-900 uppercase truncate mb-1">
                                                            {creative.concept}
                                                        </div>
                                                        <div className="text-[8px] text-slate-400 uppercase font-black tracking-widest flex items-center gap-2">
                                                            <Clock size={10} /> {new Date(creative.createdAt).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                    {creative.ctr !== null && (
                                                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-50">
                                                            <div className="bg-slate-50 p-2 rounded-lg">
                                                                <div className="text-[8px] font-black text-slate-400 uppercase mb-0.5">CTR</div>
                                                                <div className="text-xs font-black text-emerald-600">{creative.ctr?.toFixed(2)}%</div>
                                                            </div>
                                                            <div className="bg-slate-50 p-2 rounded-lg">
                                                                <div className="text-[8px] font-black text-slate-400 uppercase mb-0.5">ROAS</div>
                                                                <div className="text-xs font-black text-slate-900">{(creative.revenue / (creative.spend || 1)).toFixed(1)}x</div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ── DRIVE VIEW ─────────────────────────────────── */}
                        {view === 'DRIVE' && (
                            <div className="animate-in slide-in-from-bottom-2 duration-500 space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-primary)] flex items-center gap-3">
                                        <HardDrive size={18} className="text-[var(--cre)]" />
                                        Drive de Producto
                                    </h3>
                                    <button onClick={fetchDriveFolders} className="p-2 rounded-lg border border-[var(--border)] hover:bg-slate-50 text-slate-400 hover:text-slate-700 transition-all">
                                        <RefreshCw size={14} className={loadingDrive ? 'animate-spin' : ''} />
                                    </button>
                                </div>

                                {loadingDrive ? (
                                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                                        <Loader2 className="w-10 h-10 text-[var(--cre)] animate-spin opacity-40" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Conectando con Drive...</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {(driveFolders.length > 0 ? driveFolders : STANDARD_FOLDERS.map(f => ({ name: f, id: f }))).map((folder: any) => (
                                            <div key={folder.id || folder.name}
                                                className="p-4 bg-white border border-[var(--border)] rounded-xl flex items-center gap-3 hover:border-amber-300 hover:bg-amber-50/30 transition-all cursor-pointer shadow-sm group"
                                                onClick={() => folder.webViewLink && window.open(folder.webViewLink, '_blank')}
                                            >
                                                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 font-black text-sm group-hover:scale-110 transition-transform">
                                                    📁
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <span className="text-[10px] font-bold uppercase text-[var(--text-primary)] truncate block">{folder.name}</span>
                                                    {folder.fileCount !== undefined && (
                                                        <span className="text-[8px] text-slate-400 font-bold">{folder.fileCount} archivos</span>
                                                    )}
                                                </div>
                                                {folder.webViewLink && <ExternalLink size={12} className="text-slate-300 group-hover:text-amber-400 shrink-0" />}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
