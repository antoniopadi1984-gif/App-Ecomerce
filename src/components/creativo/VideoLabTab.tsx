'use client';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
    Layout, 
    Upload, 
    Layers, 
    Sparkles, 
    Play, 
    Trash2, 
    Plus, 
    Search, 
    Filter, 
    MoreVertical, 
    ChevronRight, 
    Clock, 
    Loader2, 
    RefreshCcw, 
    Globe, 
    Languages,
    User,
    CheckCircle2,
    XCircle,
    Download,
    Eye,
    Target,
    UploadCloud,
    FileVideo,
    Mic,
    X,
    Zap,
    ExternalLink,
    Video,
    HardDrive,
    RefreshCw,
    Link,
    AlertCircle,
    Tag,
    Package,
    Music,
    Scissors,
    Copy, Wand2} from 'lucide-react';
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

    // Estado drag & drop
    const [isDragging, setIsDragging]   = useState(false);
    const [bulkQueue, setBulkQueue]     = useState<Array<{
        fileName: string;
        status: 'pending' | 'processing' | 'done' | 'error';
        name?: string;     // MICR-C1-V1
        concept?: string;  // C1
        conceptName?: string;
        traffic?: string;
        awareness?: string;
        drivePath?: string;
        error?: string;
        assetId?: string; // para polling de estado
    }>>([]);
    const [bulkProcessing, setBulkProcessing] = useState(false);
    const dropZoneRef = useRef<HTMLDivElement>(null);

    // AI GENERATION
    const [generatingVariants, setGeneratingVariants] = useState(false);
    const [analyzingHook, setAnalyzingHook] = useState(false);
    const [hookAnalysis, setHookAnalysis] = useState<string | null>(null);
    const [generatedVariants, setGeneratedVariants] = useState<any[]>([]);

    // VIDEO STUDIO
    const [studioFormat, setStudioFormat] = useState<'9:16' | '16:9' | '1:1'>('9:16');
    const [studioModel, setStudioModel] = useState<'fast' | 'balanced' | 'premium'>('balanced');
    const [studioMode, setStudioMode] = useState<'ugc' | 'vsl' | 'broll' | 'lipsync' | 'auto'>('auto');
    const [studioAvatar, setStudioAvatar] = useState<'woman_40s' | 'woman_55s' | 'man_35s' | 'woman_25s' | 'auto'>('auto');
    const [studioCount, setStudioCount] = useState(3);
    const [generationQueue, setGenerationQueue] = useState<Array<{id:string;concept:string;status:'pending'|'generating'|'done'|'error';videoUrl?:string}>>([]);
    const [generatingStudio, setGeneratingStudio] = useState(false);
    const [researchAvatars, setResearchAvatars] = useState<any[]>([]);
    const [researchAngles, setResearchAngles] = useState<any[]>([]);
    const [selectedAvatarIds, setSelectedAvatarIds] = useState<Set<string>>(new Set());
    const [selectedAngleIds, setSelectedAngleIds] = useState<Set<string>>(new Set());
    const [loadingResearchData, setLoadingResearchData] = useState(false);
    // Modal traducción
    const [showTranslateModal, setShowTranslateModal] = useState(false);
    const [translateTargetIds, setTranslateTargetIds] = useState<string[]>([]);
    const [translateLang, setTranslateLang] = useState('es');
    const [translateVoiceId, setTranslateVoiceId] = useState('EXAVITQu4vr4xnSDxMaL');
    const [translateSpeed, setTranslateSpeed] = useState(1.0);
    const [translateStability, setTranslateStability] = useState(0.5);
    const [translateStyle, setTranslateStyle] = useState(0.3);
    const [translating, setTranslating] = useState(false);
    const [translateMode, setTranslateMode] = useState<'tts'|'dubbing'>('tts');
    const [customScript, setCustomScript] = useState('');
    const [showScriptEditor, setShowScriptEditor] = useState(false);

    // WORKSPACE load (my own videos from library)
    const [ownCreatives, setOwnCreatives] = useState<any[]>([]);
    const [loadingWorkspace, setLoadingWorkspace] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [viewingAnalysis, setViewingAnalysis] = useState<any | null>(null);

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleBulkSubtitles = async () => {
        if (selectedIds.size === 0) return;
        toast.promise(Promise.all(Array.from(selectedIds).map(id => 
            fetch(`/api/creative/add-captions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assetId: id, storeId })
            })
        )), {
            loading: `Generando subtítulos para ${selectedIds.size} videos...`,
            success: 'Subtítulos generados con éxito',
            error: 'Error al generar algunos subtítulos'
        });
        setSelectedIds(new Set());
    };

    const handleBulkTranslate = () => {
        if (selectedIds.size === 0) return;
        setTranslateTargetIds(Array.from(selectedIds));
        setShowTranslateModal(true);
    };

    const executeTranslation = async () => {
        if (translateTargetIds.length === 0) return;
        setTranslating(true);
        setShowTranslateModal(false);
        toast.loading(`Traduciendo ${translateTargetIds.length} vídeo(s) a ${translateLang}...`, { id: 'translate' });
        try {
            const results = await Promise.all(translateTargetIds.map(assetId =>
                fetch('/api/video-lab/translate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ assetId, storeId, targetLang: translateLang, voiceId: translateVoiceId, speed: translateSpeed, stability: translateStability, style: translateStyle, burnSubtitles: true, lipSync: false, mode: translateMode })
                }).then(r => r.json())
            ));
            const ok = results.filter(r => r.success).length;
            const fail = results.length - ok;
            toast.success(`✅ ${ok} traducido(s)${fail > 0 ? ` — ${fail} fallaron` : ''}`, { id: 'translate' });
            fetchOwnCreatives();
        } catch (e: any) {
            toast.error(`Error: ${e.message}`, { id: 'translate' });
        } finally {
            setTranslating(false);
            setSelectedIds(new Set());
        }
    };

    const handleSubtitles = async (assetId: string) => {
        toast.promise(
            fetch(`/api/creative/add-captions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assetId, storeId })
            }).then(r => r.json()),
            {
                loading: 'Generando subtítulos...',
                success: 'Subtítulos quemados con éxito. Revisa el historial.',
                error: 'Error al procesar subtítulos'
            }
        );
    };

    const handleTranslate = (assetId: string) => {
        setTranslateTargetIds([assetId]);
        setShowTranslateModal(true);
    };

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
                    thumbnailUrl: ad.thumbnailUrl,
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

    // Cargar avatares y ángulos del research cuando hay productId
    useEffect(() => {
        if (!productId || productId === 'GLOBAL') { setResearchAvatars([]); setResearchAngles([]); return; }
        setLoadingResearchData(true);
        fetch(`/api/research/creative-data?productId=${productId}`)
            .then(r => r.json())
            .then(d => { setResearchAvatars(d.avatars || []); setResearchAngles(d.angles || []); })
            .catch(() => {})
            .finally(() => setLoadingResearchData(false));
    }, [productId]);

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
                const count = Array.isArray(data.ad) ? data.ad.length : 1;
                toast.success(count > 1 
                    ? `Importando ${count} anuncios de la biblioteca...`
                    : 'Anuncio importado. La IA está analizando la estructura...');
                setMetaUrl('');
                setTimeout(fetchMetaLibrary, count > 1 ? 5000 : 3000);
            } else {
                throw new Error(data.error || 'Error al importar');
            }
        } catch (e: any) {
            toast.error(e.message || 'Error al importar el anuncio');
        } finally {
            setImportingUrl(false);
        }
    };

    const handleDeleteCreative = async (id: string) => {
        if (!confirm('¿Seguro que quieres borrar este creativo?')) return;
        try {
            const res = await fetch(`/api/creative/library?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('Creativo eliminado');
                fetchOwnCreatives();
                fetchMetaLibrary();
            }
        } catch (e) {
            toast.error('Error al eliminar');
        }
    };

    // ── UPLOAD VIDEO ────────────────────────────────────────────────────────
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => setIsDragging(false);

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files);
        await processBulk(files);
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        await processBulk(files);
    };

    const processBulk = async (files: File[]) => {
        if (!productId || !storeId || files.length === 0) {
            toast.error('Selecciona un producto primero');
            return;
        }

        const valid = files.filter(f =>
            f.type.startsWith('video/') || f.type.startsWith('image/')
        );

        if (valid.length === 0) {
            toast.error('Solo se admiten vídeos e imágenes');
            return;
        }

        // Inicializar queue visual
        setBulkQueue(valid.map(f => ({ fileName: f.name, status: 'pending' })));
        setBulkProcessing(true);

        // Marcar como procesando
        setBulkQueue(q => q.map(item => ({ ...item, status: 'processing' })));

        try {
            const formData = new FormData();
            formData.append('productId', productId);
            valid.forEach(f => formData.append('files', f));

            const res = await fetch('/api/creative/bulk-upload', {
                method: 'POST',
                headers: { 'X-Store-Id': storeId },
                body: formData
            });

            const data = await res.json();

            if (data.ok) {
                // Actualizar cola con estado inicial (processing)
                setBulkQueue(data.jobs.map((j: any) => ({
                    fileName: j.fileName,
                    status: 'processing',
                    assetId: j.assetId
                })));

                // Polling cada 5 segundos para actualizar estado
                const poll = setInterval(async () => {
                    setBulkQueue(currentQueue => {
                        const stillProcessing = currentQueue.filter(q => q.status === 'processing');
                        if (stillProcessing.length === 0) {
                            clearInterval(poll);
                            setBulkProcessing(false);
                            fetchOwnCreatives();
                        }
                        return currentQueue;
                    });

                    // Consultar estado de cada item en procesamiento
                    setBulkQueue(currentQueue => {
                        const stillProcessing = currentQueue.filter(q => q.status === 'processing');
                        stillProcessing.forEach(async (item) => {
                            if (!item.assetId) return;
                            const statusRes = await fetch(
                                `/api/creative/asset-status?assetId=${item.assetId}`
                            ).then(r => r.json()).catch(() => null);

                            if (statusRes?.status === 'DONE' || statusRes?.status === 'ERROR') {
                                setBulkQueue(q => q.map(qi => qi.assetId === item.assetId ? {
                                    ...qi,
                                    status: statusRes.status === 'DONE' ? 'done' : 'error',
                                    name:        statusRes.name,
                                    concept:     statusRes.concept,
                                    conceptName: statusRes.conceptName,
                                    traffic:     statusRes.traffic,
                                    awareness:   statusRes.awareness,
                                    drivePath:   statusRes.drivePath,
                                    error:        statusRes.error
                                } : qi));
                            }
                        });
                        return currentQueue;
                    });
                }, 5000);

                toast.success(`${data.queued} archivos en procesamiento`);
            }
        } catch (err: any) {
            toast.error('Error en el procesamiento masivo');
            setBulkQueue(q => q.map(i => ({ ...i, status: 'error', error: err.message })));
        } finally {
            // NO poner setBulkProcessing(false) aquí — lo hace el polling cuando termina
        }
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

    const handleStudioGenerate = async () => {
        if (productId === 'GLOBAL') { toast.error('Selecciona un producto específico'); return; }
        setGeneratingStudio(true);
        setGenerationQueue([]);
        try {
            const res = await fetch('/api/creative/generate-videos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId, maxVideos: studioCount, format: studioFormat, model: studioModel, mode: studioMode, avatarStyle: studioAvatar, customScript: customScript.trim() || undefined, selectedAvatarIds: selectedAvatarIds.size > 0 ? [...selectedAvatarIds] : undefined, selectedAngleIds: selectedAngleIds.size > 0 ? [...selectedAngleIds] : undefined })
            });
            const data = await res.json();
            if (data.success) {
                setGeneratedVariants(data.videos || []);
                setGenerationQueue((data.videos || []).map((v: any, i: number) => ({ id: v.id || String(i), concept: v.concept || `Variante ${i + 1}`, status: v.videoUrl ? 'done' : 'generating', videoUrl: v.videoUrl })));
                toast.success(`${data.videos?.length || 0} videos generados`);
                fetchOwnCreatives();
            } else { throw new Error(data.error || 'Error'); }
        } catch (e: any) { toast.error(e.message || 'Error al generar'); }
        finally { setGeneratingStudio(false); }
    };

    const STANDARD_FOLDERS = ['01_HOOKS', '02_CRUDE_CONTENT', '03_EDITS', '04_RESOURCES'];

    if (!storeId || !productId || productId === 'GLOBAL') {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center py-20 gap-4">
                <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300">
                    <Sparkles size={32} />
                </div>
                <h2 className="text-sm font-bold text-slate-900 uppercase">Selecciona Producto</h2>
                <p className="text-[10px] text-slate-400 uppercase max-w-xs mx-auto">
                    Usa el selector superior para activar el Video Lab en un producto específico.
                </p>
            </div>
        );
    }

    return (
        <>
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

                    {/* ── VIDEO STUDIO PANEL ─────────────────────── */}
                    <div className="mt-auto flex flex-col gap-2">

                        {/* MODO */}
                        <div className="p-3 rounded-xl bg-[var(--cre-bg)]/20 border border-[var(--cre)]/10 space-y-2">
                            <div className="flex items-center gap-1.5 text-[var(--cre)] mb-1">
                                <Wand2 size={12} />
                                <span className="text-[9px] font-black uppercase tracking-widest">Modo</span>
                            </div>
                            <div className="grid grid-cols-3 gap-1">
                                {([['auto','Auto IA'],['ugc','UGC'],['vsl','VSL'],['broll','B-Roll'],['lipsync','Lipsync']] as const).map(([val, label]) => (
                                    <button key={val} onClick={() => setStudioMode(val as any)}
                                        className={`py-1 px-1.5 rounded-md text-[8px] font-black uppercase tracking-tight transition-all ${studioMode === val ? 'bg-[var(--cre)] text-white shadow-sm' : 'bg-white border border-[var(--border)] text-[var(--text-tertiary)] hover:border-[var(--cre)]/40'}`}>
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* FORMATO + MODELO */}
                        <div className="p-3 rounded-xl bg-white border border-[var(--border)] space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <div className="text-[8px] font-black uppercase text-[var(--text-tertiary)] mb-1">Formato</div>
                                    <div className="flex gap-1">
                                        {(['9:16','16:9','1:1'] as const).map(f => (
                                            <button key={f} onClick={() => setStudioFormat(f)}
                                                className={`flex-1 py-1 rounded-md text-[8px] font-bold transition-all ${studioFormat === f ? 'bg-[var(--cre)] text-white' : 'bg-slate-50 border border-[var(--border)] text-slate-500 hover:border-[var(--cre)]/30'}`}>
                                                {f}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[8px] font-black uppercase text-[var(--text-tertiary)] mb-1">Cantidad</div>
                                    <div className="flex gap-1">
                                        {[1,3,5].map(n => (
                                            <button key={n} onClick={() => setStudioCount(n)}
                                                className={`flex-1 py-1 rounded-md text-[8px] font-bold transition-all ${studioCount === n ? 'bg-[var(--cre)] text-white' : 'bg-slate-50 border border-[var(--border)] text-slate-500 hover:border-[var(--cre)]/30'}`}>
                                                {n}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* MODELO */}
                            <div>
                                <div className="text-[8px] font-black uppercase text-[var(--text-tertiary)] mb-1">Modelo IA</div>
                                <div className="grid grid-cols-3 gap-1">
                                    {([['fast','Rápido','Kling v2'],['balanced','Estándar','Kling v3'],['premium','Premium','Veo 3']] as const).map(([val, label, sub]) => (
                                        <button key={val} onClick={() => setStudioModel(val as any)}
                                            className={`py-1.5 px-1 rounded-md text-center transition-all border ${studioModel === val ? 'bg-[var(--cre)] text-white border-[var(--cre)]' : 'bg-white border-[var(--border)] hover:border-[var(--cre)]/40'}`}>
                                            <div className={`text-[8px] font-black uppercase ${studioModel === val ? 'text-white' : 'text-slate-700'}`}>{label}</div>
                                            <div className={`text-[7px] ${studioModel === val ? 'text-white/70' : 'text-slate-400'}`}>{sub}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* AVATARES DEL RESEARCH */}
                            {researchAvatars.length > 0 && (
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="text-[8px] font-black uppercase text-[var(--text-tertiary)]">Avatares del Research</div>
                                        <button onClick={() => setSelectedAvatarIds(new Set())} className="text-[7px] text-slate-400 hover:text-slate-600">Reset</button>
                                    </div>
                                    <div className="flex flex-col gap-1 max-h-28 overflow-y-auto">
                                        {researchAvatars.map(av => (
                                            <button key={av.id} onClick={() => setSelectedAvatarIds(prev => { const next = new Set(prev); next.has(av.id) ? next.delete(av.id) : next.add(av.id); return next; })}
                                                className={`w-full text-left px-2 py-1.5 rounded-lg border transition-all ${selectedAvatarIds.has(av.id) ? 'bg-[var(--cre)] border-[var(--cre)] text-white' : 'bg-white border-[var(--border)] hover:border-[var(--cre)]/40'}`}>
                                                <div className={`text-[8px] font-black uppercase ${selectedAvatarIds.has(av.id) ? 'text-white' : 'text-slate-700'}`}>{av.name}</div>
                                                <div className={`text-[7px] ${selectedAvatarIds.has(av.id) ? 'text-white/70' : 'text-slate-400'}`}>{av.gender} · {av.age} años · {av.occupation}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ÁNGULOS DEL RESEARCH */}
                            {researchAngles.length > 0 && (
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="text-[8px] font-black uppercase text-[var(--text-tertiary)]">Ángulos del Research</div>
                                        <button onClick={() => setSelectedAngleIds(new Set())} className="text-[7px] text-slate-400 hover:text-slate-600">Reset</button>
                                    </div>
                                    <div className="flex flex-col gap-1 max-h-28 overflow-y-auto">
                                        {researchAngles.map(ang => (
                                            <button key={ang.id} onClick={() => setSelectedAngleIds(prev => { const next = new Set(prev); next.has(ang.id) ? next.delete(ang.id) : next.add(ang.id); return next; })}
                                                className={`w-full text-left px-2 py-1.5 rounded-lg border transition-all ${selectedAngleIds.has(ang.id) ? 'bg-[var(--cre)] border-[var(--cre)] text-white' : 'bg-white border-[var(--border)] hover:border-[var(--cre)]/40'}`}>
                                                <div className={`text-[8px] font-black uppercase truncate ${selectedAngleIds.has(ang.id) ? 'text-white' : 'text-slate-700'}`}>{ang.concept}</div>
                                                <div className={`text-[7px] truncate ${selectedAngleIds.has(ang.id) ? 'text-white/70' : 'text-slate-400'}`}>{ang.hook || ang.angle}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {loadingResearchData && (
                                <div className="flex items-center gap-2 py-1">
                                    <Loader2 size={10} className="animate-spin text-[var(--cre)]" />
                                    <span className="text-[8px] text-slate-400">Cargando research...</span>
                                </div>
                            )}

                            {/* AVATAR GENÉRICO (fallback) */}
                            {researchAvatars.length === 0 && !loadingResearchData && (
                            <div>
                                <div className="text-[8px] font-black uppercase text-[var(--text-tertiary)] mb-1">Avatar</div>
                                <div className="grid grid-cols-3 gap-1">
                                    {([['auto','Auto'],['woman_40s','Mujer 40'],['woman_55s','Mujer 55'],['man_35s','Hombre 35'],['woman_25s','Mujer 25']] as const).map(([val, label]) => (
                                        <button key={val} onClick={() => setStudioAvatar(val as any)}
                                            className={`py-1 rounded-md text-[7px] font-bold uppercase transition-all ${studioAvatar === val ? 'bg-[var(--cre)] text-white' : 'bg-slate-50 border border-[var(--border)] text-slate-500 hover:border-[var(--cre)]/30'}`}>
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            )}
                        </div>

                        {/* QUEUE STATUS */}
                        {generationQueue.length > 0 && (
                            <div className="p-2 rounded-xl bg-slate-50 border border-[var(--border)] space-y-1 max-h-28 overflow-y-auto">
                                {generationQueue.map(job => (
                                    <div key={job.id} className="flex items-center gap-2">
                                        <div className="flex-shrink-0">
                                            {job.status === 'done' && <CheckCircle2 size={10} className="text-emerald-500" />}
                                            {job.status === 'generating' && <Loader2 size={10} className="text-[var(--cre)] animate-spin" />}
                                            {job.status === 'pending' && <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />}
                                            {job.status === 'error' && <AlertCircle size={10} className="text-red-400" />}
                                        </div>
                                        <span className="text-[8px] text-slate-600 truncate flex-1">{job.concept}</span>
                                        {job.videoUrl && (
                                            <a href={job.videoUrl} target="_blank" rel="noopener noreferrer"
                                                className="text-[7px] font-bold text-[var(--cre)] hover:underline flex-shrink-0">Ver</a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* HOOK ANALYSIS */}
                        {hookAnalysis && (
                            <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-100">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[8px] font-bold text-emerald-600 uppercase">Análisis de Gancho</span>
                                    <button onClick={() => setHookAnalysis(null)} className="text-slate-400 hover:text-slate-700">
                                        <X size={10} />
                                    </button>
                                </div>
                                <p className="text-[10px] text-slate-700 leading-relaxed max-h-24 overflow-y-auto">{hookAnalysis}</p>
                            </div>
                        )}

                        {/* EDITOR SCRIPT CUSTOM */}
                        <div className="rounded-xl border border-[var(--border)] overflow-hidden">
                            <button
                                onClick={() => setShowScriptEditor(s => !s)}
                                className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-slate-100 transition-all"
                            >
                                <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest">Script personalizado</span>
                                <span className="text-[8px] text-slate-400">{showScriptEditor ? '▲' : '▼'}</span>
                            </button>
                            {showScriptEditor && (
                                <div className="p-2 bg-white">
                                    <textarea
                                        value={customScript}
                                        onChange={e => setCustomScript(e.target.value)}
                                        placeholder="Escribe el script aquí para sobrescribir el generado por IA. Deja vacío para usar Claude automáticamente."
                                        className="w-full text-[9px] text-slate-700 bg-slate-50 border border-[var(--border)] rounded-lg p-2 resize-none outline-none focus:border-[var(--cre)]/50 leading-relaxed"
                                        rows={5}
                                    />
                                    <div className="flex items-center justify-between mt-1">
                                        <span className="text-[7px] text-slate-400">{customScript.length} chars</span>
                                        {customScript && (
                                            <button onClick={() => setCustomScript('')} className="text-[7px] text-red-400 hover:text-red-600 font-bold">Limpiar</button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* BOTONES ACCIÓN */}
                        <div className="flex flex-col gap-1.5">
                            <button onClick={handleStudioGenerate} disabled={generatingStudio || generatingVariants}
                                className="w-full py-2.5 px-3 rounded-xl bg-[var(--cre)] text-white text-[9px] font-black uppercase tracking-widest hover:bg-[var(--cre)]/90 transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-60">
                                {generatingStudio ? <><Loader2 size={12} className="animate-spin" /> Generando {studioCount} video{studioCount > 1 ? 's' : ''}...</> : <><Zap size={12} /> Generar {studioCount} {studioMode === 'auto' ? 'Video' : studioMode.toUpperCase()}{studioCount > 1 ? 's' : ''}</>}
                            </button>
                            <button onClick={handleAnalyzeHook} disabled={analyzingHook}
                                className="w-full py-2 px-3 rounded-xl bg-white border border-[var(--cre)]/30 text-[var(--cre)] text-[9px] font-black uppercase tracking-widest hover:bg-[var(--cre-bg)]/10 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                                {analyzingHook ? <><Loader2 size={12} className="animate-spin" /> Analizando...</> : 'Analizar Gancho'}
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
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-2">
                                        {ownCreatives.map(creative => (
                                            <div key={creative.id} className="bg-white border border-slate-100 rounded-2xl group overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 relative">
                                                <div className="aspect-[9/16] bg-slate-900 relative">
                                                    {(creative.driveFileId || creative.thumbnailUrl) ? (
                                                        <img 
                                                            src={creative.driveFileId ? `/api/drive/thumbnail?fileId=${creative.driveFileId}` : creative.thumbnailUrl} 
                                                            alt={creative.concept} 
                                                            className="w-full h-full object-cover" 
                                                            onError={(e) => {
                                                                // Fallback to placeholder if proxy/img fails
                                                                e.currentTarget.parentElement!.innerHTML = '<div class="w-full h-full flex flex-col items-center justify-center p-4 text-center opacity-30"><div class="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-2">🎞️</div><div class="text-[7px] text-white uppercase font-bold tracking-tighter">Miniatura en proceso</div></div>';
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                                                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-2">
                                                                <Play size={16} className="text-white opacity-40 ml-0.5" />
                                                            </div>
                                                            <div className="text-[7px] text-white/30 uppercase font-bold tracking-tighter">Sin Miniatura</div>
                                                        </div>
                                                    )}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2 gap-1.5 translate-y-2 group-hover:translate-y-0 duration-300">
                                                        <div className="flex flex-col gap-1">
                                                            {(creative.driveUrl || creative.videoUrl) && (
                                                                <a href={creative.driveUrl || creative.videoUrl} target="_blank" rel="noopener noreferrer"
                                                                    className="w-full py-1.5 bg-white text-slate-900 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1 hover:bg-slate-100 transition-colors">
                                                                    <Play size={10} fill="currentColor" /> Ver Video
                                                                </a>
                                                            )}
                                                            <div className="grid grid-cols-2 gap-1">
                                                                <button 
                                                                    onClick={(e) => { e.stopPropagation(); handleSubtitles(creative.id); }}
                                                                    className="py-1.5 bg-white/10 text-white border border-white/20 rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center justify-center gap-1 hover:bg-white/20 transition-all"
                                                                >
                                                                    <Languages size={10} /> Subs
                                                                </button>
                                                                <button 
                                                                    onClick={(e) => { e.stopPropagation(); handleTranslate(creative.id); }}
                                                                    className="py-1.5 bg-white/10 text-white border border-white/20 rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center justify-center gap-1 hover:bg-white/20 transition-all"
                                                                >
                                                                    <Globe size={10} /> Trans
                                                                </button>
                                                            </div>
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); setViewingAnalysis(creative); }}
                                                                className="w-full py-1.5 bg-white/10 text-white border border-white/20 rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center justify-center gap-1 hover:bg-white/20 transition-all font-mono"
                                                            >
                                                                <Eye size={10} /> Data
                                                            </button>
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); handleDeleteCreative(creative.id); }}
                                                                className="w-full py-1.5 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white border border-rose-500/20 rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center justify-center gap-1 transition-all"
                                                            >
                                                                <Trash2 size={10} /> Borrar
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="absolute top-2 right-2 flex gap-1">
                                                        <span className="px-1.5 py-0.5 bg-emerald-500 text-white text-[7px] font-black rounded uppercase shadow-sm">
                                                            REAL
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="p-2 space-y-1">
                                                    <div className="flex items-center justify-between gap-1">
                                                        <div className="text-[9px] font-bold text-slate-900 uppercase truncate flex-1" title={creative.concept}>{creative.concept}</div>
                                                        {creative.stage && (
                                                            <span className={cn(
                                                                "px-1 py-0.5 rounded text-[6px] font-black uppercase",
                                                                creative.stage === 'TOFU' ? "bg-blue-100 text-blue-600" :
                                                                creative.stage === 'MOFU' ? "bg-amber-100 text-amber-600" :
                                                                "bg-rose-100 text-rose-600"
                                                            )}>
                                                                {creative.stage}
                                                            </span>
                                                        )}
                                                    </div>
                                                    
                                                    {creative.angle && (
                                                        <div className="text-[7px] text-slate-500 font-medium uppercase tracking-tighter flex items-center gap-1 bg-slate-50 px-1 py-0.5 rounded w-fit">
                                                            <Target size={7} /> {creative.angle}
                                                        </div>
                                                    )}

                                                    {creative.tagsJson && (
                                                        <div className="pt-1 mt-1 border-t border-slate-50 flex items-center justify-between">
                                                            <div className="flex items-center gap-1">
                                                                <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                                                <span className="text-[7px] font-bold text-slate-400 uppercase">Analizado</span>
                                                            </div>
                                                            {(() => {
                                                                try {
                                                                    const tags = JSON.parse(creative.tagsJson);
                                                                    return tags.hookScore && (
                                                                        <div className="text-[7px] font-black text-emerald-600 px-1 bg-emerald-50 rounded">
                                                                            HOOK: {tags.hookScore}/10
                                                                        </div>
                                                                    );
                                                                } catch { return null; }
                                                            })()}
                                                        </div>
                                                    )}

                                                    <div className="text-[7px] text-slate-400 uppercase font-bold mt-1 flex items-center gap-1">
                                                        <Clock size={8} />{new Date(creative.createdAt).toLocaleDateString()}
                                                    </div>
                                                </div>
                                                <div className="absolute top-2 left-2 z-10">
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); toggleSelect(creative.id); }}
                                                        className={cn(
                                                            "w-4 h-4 rounded-full border transition-all flex items-center justify-center shadow-sm",
                                                            selectedIds.has(creative.id) 
                                                                ? "bg-[var(--cre)] border-[var(--cre)] text-white" 
                                                                : "bg-white/50 border-white/80 text-transparent hover:bg-white"
                                                        )}
                                                    >
                                                        <CheckCircle2 size={10} strokeWidth={3} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Bulk Action Bar */}
                        {selectedIds.size > 0 && (
                            <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 duration-300">
                                <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-6">
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Seleccionados</span>
                                        <span className="text-sm font-black text-white">{selectedIds.size} Creativos</span>
                                    </div>
                                    <div className="h-8 w-px bg-white/10" />
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={handleBulkSubtitles}
                                            className="px-4 py-2 bg-[var(--cre)] text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:brightness-110 transition-all hover:scale-105"
                                        >
                                            <Languages size={14} /> Subtítulos (Bulk)
                                        </button>
                                        <button 
                                            onClick={handleBulkTranslate}
                                            className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:brightness-110 transition-all hover:scale-105"
                                        >
                                            <Globe size={14} /> Traducir (Bulk)
                                        </button>
                                        <button 
                                            onClick={() => setSelectedIds(new Set())}
                                            className="px-4 py-2 bg-rose-500/10 text-rose-500 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-500/20 transition-all"
                                        >
                                            <X size={14} /> Cancelar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── UPLOAD VIEW ────────────────────────────────── */}
                        {view === 'UPLOAD' && (
                            <div className="animate-in slide-in-from-bottom-2 duration-500 max-w-2xl mx-auto space-y-6">
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

                                {/* ── ZONA DRAG & DROP ── */}
                                <div
                                    ref={dropZoneRef}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    style={{
                                        border: `2px dashed ${isDragging ? 'var(--cre)' : 'var(--border)'}`,
                                        borderRadius: '16px',
                                        padding: '40px 20px',
                                        textAlign: 'center',
                                        background: isDragging ? 'var(--cre-bg)' : 'var(--bg)',
                                        transition: 'all 0.2s',
                                        cursor: 'pointer',
                                    }}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        multiple
                                        accept="video/*,image/*"
                                        style={{ display: 'none' }}
                                        onChange={handleFileSelect}
                                    />
                                    <UploadCloud size={32} color={isDragging ? 'var(--cre)' : '#94a3b8'} style={{ margin: '0 auto 12px' }} />
                                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>
                                        {isDragging ? 'Suelta aquí' : 'Arrastra tu carpeta o archivos'}
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                                        Vídeos e imágenes — la IA clasifica, limpia y organiza todo automáticamente
                                    </div>
                                </div>

                                {/* ── COLA DE PROCESAMIENTO ── */}
                                {bulkQueue.length > 0 && (
                                    <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <div style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8',
                                            textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>
                                            {bulkProcessing ? 'Procesando...' : `${bulkQueue.filter(q => q.status === 'done').length}/${bulkQueue.length} completados`}
                                        </div>
                                        {bulkQueue.map((item, i) => (
                                            <div key={i} style={{
                                                display: 'flex', alignItems: 'center', gap: '10px',
                                                padding: '10px 12px', borderRadius: '10px',
                                                background: item.status === 'done'  ? '#f0fdf4' :
                                                            item.status === 'error' ? '#fef2f2' :
                                                            item.status === 'processing' ? '#eff6ff' : 'var(--bg)',
                                                border: `1px solid ${
                                                    item.status === 'done'  ? '#bbf7d0' :
                                                    item.status === 'error' ? '#fecaca' :
                                                    item.status === 'processing' ? '#bfdbfe' : 'var(--border)'
                                                }`
                                            }}>
                                                {/* Icono estado */}
                                                <div style={{ flexShrink: 0 }}>
                                                    {item.status === 'done'       && <CheckCircle2 size={16} color="#16a34a" />}
                                                    {item.status === 'error'      && <AlertCircle  size={16} color="#ef4444" />}
                                                    {item.status === 'processing' && <Loader2      size={16} color="#3b82f6" className="animate-spin" />}
                                                    {item.status === 'pending'    && <Clock        size={16} color="#94a3b8" />}
                                                </div>

                                                {/* Info */}
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text)',
                                                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {item.name || item.fileName}
                                                    </div>
                                                    {item.status === 'done' && (
                                                        <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px',
                                                            display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                            {item.concept && (
                                                                <span style={{ background: '#eef2ff', color: '#6366f1',
                                                                    padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                                                                    {item.concept} — {item.conceptName}
                                                                </span>
                                                            )}
                                                            {item.traffic && (
                                                                <span style={{ background: '#f0fdf4', color: '#16a34a',
                                                                    padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                                                                    {item.traffic}
                                                                </span>
                                                            )}
                                                            {item.awareness && (
                                                                <span style={{ background: '#fffbeb', color: '#d97706',
                                                                    padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                                                                    {item.awareness}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                    {item.status === 'error' && (
                                                        <div style={{ fontSize: '10px', color: '#ef4444', marginTop: '2px' }}>
                                                            {item.error}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Link Drive si está listo */}
                                                {item.status === 'done' && item.drivePath && (
                                                    <a
                                                        href={`https://drive.google.com/drive/search?q=${encodeURIComponent(item.name || '')}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        style={{ flexShrink: 0 }}
                                                        onClick={e => e.stopPropagation()}
                                                    >
                                                        <ExternalLink size={13} color="#6366f1" />
                                                    </a>
                                                )}
                                            </div>
                                        ))}

                                        {/* Resumen final */}
                                        {!bulkProcessing && bulkQueue.length > 0 && (
                                            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                                <button
                                                    onClick={() => setBulkQueue([])}
                                                    style={{ fontSize: '11px', fontWeight: 700, color: '#64748b',
                                                        background: 'none', border: '1px solid var(--border)',
                                                        borderRadius: '8px', padding: '6px 12px', cursor: 'pointer' }}
                                                >
                                                    Limpiar lista
                                                </button>
                                                <button
                                                    onClick={() => setView('WORKSPACE')}
                                                    style={{ fontSize: '11px', fontWeight: 700, color: 'white',
                                                        background: 'var(--cre)', border: 'none',
                                                        borderRadius: '8px', padding: '6px 12px', cursor: 'pointer' }}
                                                >
                                                    Ver en biblioteca
                                                </button>
                                            </div>
                                        )}
                                    </div>
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
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-2 pb-12">
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
                                                            <Play size={24} className="text-white opacity-20" />
                                                        </div>
                                                    )}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2 gap-2">
                                                        <button
                                                            onClick={() => creative.videoUrl && window.open(creative.videoUrl, '_blank')}
                                                            className="w-full py-1.5 bg-white text-slate-900 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1 hover:bg-slate-100"
                                                        >
                                                            <Play size={10} fill="currentColor" /> Ver Video
                                                        </button>
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); handleDeleteCreative(creative.id); }}
                                                            className="w-full py-1.5 bg-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center justify-center gap-1 transition-all"
                                                        >
                                                            <Trash2 size={10} /> Borrar
                                                        </button>
                                                    </div>
                                                    <div className="absolute top-2 left-2 flex gap-1">
                                                        <span className={cn(
                                                            "px-1.5 py-0.5 text-[7px] font-black rounded uppercase shadow-sm text-white",
                                                            creative.stage === 'COLD' || creative.stage === '1' ? "bg-blue-500" : 
                                                            creative.stage === 'WARM' || creative.stage === '2' || creative.stage === '3' ? "bg-orange-500" : 
                                                            "bg-rose-500"
                                                        )}>
                                                            {creative.stage === '1' ? 'COLD' : creative.stage === '2' ? 'WARM' : creative.stage === '3' ? 'HOT' : (creative.stage || 'TEST')}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="p-2 space-y-2">
                                                    <div>
                                                        <div className="text-[9px] font-bold text-slate-900 uppercase truncate mb-0.5">
                                                            {creative.concept}
                                                        </div>
                                                        <div className="text-[7px] text-slate-400 uppercase font-black tracking-widest flex items-center gap-1">
                                                            <Clock size={8} /> {new Date(creative.createdAt).toLocaleDateString()}
                                                        </div>
                                                    </div>
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

                {/* Bulk Action Bar */}
                {selectedIds.size > 0 && (
                    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 duration-300">
                        <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-6">
                            <div className="flex flex-col">
                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Seleccionados</span>
                                <span className="text-sm font-black text-white">{selectedIds.size} Creativos</span>
                            </div>
                            <div className="h-8 w-px bg-white/10" />
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={handleBulkSubtitles}
                                    className="px-4 py-2 bg-[var(--cre)] text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:brightness-110 transition-all hover:scale-105"
                                >
                                    <Languages size={14} /> Subtítulos (Bulk)
                                </button>
                                <button className="px-4 py-2 bg-white/5 text-white/50 border border-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 cursor-not-allowed">
                                    <Globe size={14} /> Traducir (Bulk)
                                </button>
                                <button 
                                    onClick={() => setSelectedIds(new Set())}
                                    className="px-4 py-2 bg-rose-500/10 text-rose-500 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-500/20 transition-all"
                                >
                                    <X size={14} /> Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Analysis Modal */}
                {viewingAnalysis && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setViewingAnalysis(null)} />
                        <div className="bg-white rounded-3xl w-full max-w-xl max-h-[85vh] overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-200 flex flex-col">
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                                <div>
                                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Deep Analysis</h2>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{viewingAnalysis.concept}</p>
                                </div>
                                <button onClick={() => setViewingAnalysis(null)} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors">
                                    <X size={16} />
                                </button>
                            </div>
                            <div className="p-6 overflow-y-auto space-y-6">
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="p-3 bg-blue-50 rounded-2xl">
                                        <div className="text-[7px] font-black text-blue-400 uppercase tracking-widest mb-1">Stage</div>
                                        <div className="text-[10px] font-black text-blue-700">{viewingAnalysis.stage || 'TOFU'}</div>
                                    </div>
                                    <div className="p-3 bg-rose-50 rounded-2xl">
                                        <div className="text-[7px] font-black text-rose-400 uppercase tracking-widest mb-1">Angle</div>
                                        <div className="text-[10px] font-black text-rose-700 leading-tight">{viewingAnalysis.angle || 'GENERAL'}</div>
                                    </div>
                                    <div className="p-3 bg-emerald-50 rounded-2xl">
                                        <div className="text-[7px] font-black text-emerald-400 uppercase tracking-widest mb-1">SKU</div>
                                        <div className="text-[10px] font-black text-emerald-700 truncate">{productId}</div>
                                    </div>
                                </div>

                                {viewingAnalysis.tagsJson && (() => {
                                    try {
                                        const tags = JSON.parse(viewingAnalysis.tagsJson);
                                        return (
                                            <div className="space-y-6">
                                                <div className="space-y-2">
                                                    <h4 className="text-[9px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                                       <Sparkles size={12} className="text-amber-500" /> Hook Analysis
                                                    </h4>
                                                    <div className="p-4 bg-amber-50 rounded-2xl text-[11px] text-amber-900 italic font-medium leading-relaxed border border-amber-100">
                                                        "{viewingAnalysis.hook}"
                                                    </div>
                                                </div>
                                                {tags.avatar && (
                                                    <div className="space-y-2">
                                                        <h4 className="text-[9px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                                           <User size={12} className="text-blue-500" /> Target Avatar
                                                        </h4>
                                                        <div className="p-4 bg-slate-50 rounded-2xl text-[10px] text-slate-600 leading-relaxed">
                                                            {tags.avatar}
                                                        </div>
                                                    </div>
                                                )}
                                                {tags.suggestions && (
                                                    <div className="space-y-2">
                                                        <h4 className="text-[9px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                                           <Zap size={12} className="text-emerald-500" /> Optimization
                                                        </h4>
                                                        <div className="p-4 bg-emerald-50 rounded-2xl text-[10px] text-emerald-700 whitespace-pre-wrap leading-relaxed">
                                                            {tags.suggestions}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    } catch { return null; }
                                })()}
                            </div>
                            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
                                <button 
                                    onClick={() => window.open(viewingAnalysis.driveUrl || viewingAnalysis.videoUrl, '_blank')}
                                    className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                                >
                                    <Play size={14} fill="currentColor" /> Ver Video Original
                                </button>
                                {viewingAnalysis.driveFileId && (
                                    <button 
                                        onClick={() => window.open(`https://drive.google.com/file/d/${viewingAnalysis.driveFileId}/view`, '_blank')}
                                        className="w-12 h-12 bg-white border border-slate-200 text-slate-400 rounded-xl flex items-center justify-center hover:text-slate-900 transition-all shadow-sm"
                                    >
                                        <HardDrive size={18} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* ── MODAL TRADUCCIÓN ─────────────────────────────────────── */}
        {showTranslateModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-5">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-primary)]">🌐 Traducir Vídeo</h3>
                        <button onClick={() => setShowTranslateModal(false)} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">✕</button>
                    </div>

                    {/* Idioma destino */}
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-tertiary)]">Idioma destino</label>
                        <select value={translateLang} onChange={e => setTranslateLang(e.target.value)}
                            className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)]">
                            {[['es','🇪🇸 Español'],['en','🇬🇧 English'],['fr','🇫🇷 Français'],['de','🇩🇪 Deutsch'],['it','🇮🇹 Italiano'],['pt','🇧🇷 Português'],['ar','🇸🇦 Árabe'],['zh','🇨🇳 Chino'],['ja','🇯🇵 Japonés'],['ko','🇰🇷 Coreano'],['ru','🇷🇺 Ruso'],['pl','🇵🇱 Polaco'],['hi','🇮🇳 Hindi'],['nl','🇳🇱 Neerlandés'],['sv','🇸🇪 Sueco'],['tr','🇹🇷 Turco']].map(([code, label]) => (
                                <option key={code} value={code}>{label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Selector de voz */}
                    <div className="space-y-1.5">
                        {/* Modo */}
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-tertiary)]">Modo de traducción</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => setTranslateMode('tts')}
                                className={`py-2 rounded-xl text-[9px] font-black uppercase transition-all ${translateMode==='tts' ? 'bg-[var(--cre)] text-white' : 'border border-[var(--border)] text-[var(--text-tertiary)]'}`}>
                                🎙️ Voz elegida
                            </button>
                            <button onClick={() => setTranslateMode('dubbing')}
                                className={`py-2 rounded-xl text-[9px] font-black uppercase transition-all ${translateMode==='dubbing' ? 'bg-[var(--cre)] text-white' : 'border border-[var(--border)] text-[var(--text-tertiary)]'}`}>
                                🤖 Dubbing IA
                            </button>
                        </div>
                        <p className="text-[8px] text-[var(--text-tertiary)]">
                            {translateMode==='tts' ? 'Transcribe → Traduce → genera audio con la voz que elijas' : 'ElevenLabs clona la voz original y dobla el vídeo'}
                        </p>
                    </div>

                    <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-tertiary)]">Voz ElevenLabs</label>
                        <select value={translateVoiceId} onChange={e => setTranslateVoiceId(e.target.value)}
                            className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)]">
                            <optgroup label="🇪🇸 Español Peninsular">
                                <option value="ojUrU2nc4bppCZKFp9U8">Javier — Comercial y Dinámico</option>
                                <option value="yiWEefwu5z3DQCM79clN">Laura López — Social Media</option>
                                <option value="GwtqU7RCQKrjzJ0dGhqT">José Borda — Expresivo</option>
                                <option value="PwxTzhTOyJ9IXBhXZdc8">Jose A. del Rio — Publicidad</option>
                                <option value="h3l1RP4XfcWsPwoRp9G6">Sheila España — Social Media</option>
                                <option value="D7dkYvH17OKLgp4SLulf">Martin Osborne — Publicidad</option>
                                <option value="KHCvMklQZZo0O30ERnVn">Sara Martin 1 — Educativa</option>
                                <option value="Ir1QNHvhaJXbAGhT50w3">Sara Martin 2 — Narrativa</option>
                                <option value="gD1IexrzCvsXPHUuT0s3">Sara Martin 3 — Conversacional</option>
                                <option value="XcWPJPVzbTFL09D9rQkl">Marco — Conversacional</option>
                                <option value="NhUo7cJi70nyU8yfCimA">Theo — Social Media y Ads</option>
                                <option value="75toWT7xwWkf5F7xSBgK">OMG Voice — Narrativa</option>
                                <option value="bXNyE7Z9cvPDl9TXt4Wg">Toñi Moreno — Andaluza</option>
                                <option value="C8Qbw8pAs2Q6xnmJACLv">Ani Egea</option>
                            </optgroup>
                            <optgroup label="🇦🇷 Español Argentino">
                                <option value="gBTPbHzRd0ZmV75Z5Zk4">Carlos Pro — Narrativa</option>
                            </optgroup>
                            <optgroup label="🇬🇧 English">
                                <option value="EXAVITQu4vr4xnSDxMaL">Sarah — Confident Female</option>
                                <option value="CwhRBWXzGAHq8TQ4Fs17">Roger — Casual Male</option>
                                <option value="JBFqnCBsd6RMkjVDRZzb">George — British Male</option>
                                <option value="TX3LPaxmHKxFdv7VOQHJ">Liam — Social Media</option>
                                <option value="pqHfZKP75CvOlQylNhV4">Bill — Advertisement</option>
                                <option value="nPczCjzI2devNBz1zQrb">Brian — Deep Social Media</option>
                                <option value="cgSgspJ2msm6clMCkdW9">Jessica — Playful Female</option>
                            </optgroup>
                        </select>
                    </div>

                    {/* Velocidad */}
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-tertiary)]">
                            Velocidad: <span className="text-[var(--cre)]">{translateSpeed.toFixed(1)}x</span>
                        </label>
                        <input type="range" min="0.7" max="1.3" step="0.05" value={translateSpeed}
                            onChange={e => setTranslateSpeed(parseFloat(e.target.value))}
                            className="w-full accent-[var(--cre)]" />
                        <div className="flex justify-between text-[8px] text-[var(--text-tertiary)]">
                            <span>Lento 0.7x</span><span>Normal 1.0x</span><span>Rápido 1.3x</span>
                        </div>
                    </div>

                    {/* Estabilidad */}
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-tertiary)]">
                            Estabilidad: <span className="text-[var(--cre)]">{Math.round(translateStability * 100)}%</span>
                        </label>
                        <input type="range" min="0" max="1" step="0.05" value={translateStability}
                            onChange={e => setTranslateStability(parseFloat(e.target.value))}
                            className="w-full accent-[var(--cre)]" />
                        <div className="flex justify-between text-[8px] text-[var(--text-tertiary)]">
                            <span>Variable</span><span>Equilibrado</span><span>Estable</span>
                        </div>
                    </div>

                    {/* Estilo */}
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-tertiary)]">
                            Expresividad: <span className="text-[var(--cre)]">{Math.round(translateStyle * 100)}%</span>
                        </label>
                        <input type="range" min="0" max="1" step="0.05" value={translateStyle}
                            onChange={e => setTranslateStyle(parseFloat(e.target.value))}
                            className="w-full accent-[var(--cre)]" />
                        <div className="flex justify-between text-[8px] text-[var(--text-tertiary)]">
                            <span>Neutro</span><span>Natural</span><span>Expresivo</span>
                        </div>
                    </div>

                    <div className="text-[9px] text-[var(--text-tertiary)] bg-[var(--bg)] rounded-xl p-3">
                        {translateTargetIds.length} vídeo(s) seleccionado(s) · Subtítulos quemados automáticamente
                    </div>

                    <div className="flex gap-3">
                        <button onClick={() => setShowTranslateModal(false)}
                            className="flex-1 py-2.5 border border-[var(--border)] rounded-xl text-xs font-black uppercase text-[var(--text-tertiary)] hover:border-[var(--text-tertiary)] transition-all">
                            Cancelar
                        </button>
                        <button onClick={executeTranslation} disabled={translating}
                            className="flex-1 py-2.5 bg-[var(--cre)] text-white rounded-xl text-xs font-black uppercase hover:brightness-110 transition-all disabled:opacity-50">
                            {translating ? 'Traduciendo...' : '🌐 Traducir'}
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
}
