'use client';
import React, { useState, useRef, useCallback } from 'react';
import {
    UploadCloud, FileVideo, Loader2, CheckCircle2, AlertCircle,
    Play, Mic, Languages, Scissors, Music, Layers, Copy,
    ChevronDown, ChevronRight, Clock, Tag
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { TranslationToggle, LangBadge } from '@/components/ui/translation-toggle';

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
    PENDING: 'En cola…', INGESTED: 'Analizando metadatos…',
    TRANSCRIBED: 'Transcribiendo…', ANALYZED: 'Analizando contenido…',
    SPLIT: 'Separando clips…', ORGANIZED: 'Organizando en Drive…',
    DONE: 'Completado', ERROR: 'Error',
};
const FUNNEL_COLORS: Record<string, string> = {
    TOF: '#8B5CF6', MOF: '#F59E0B', BOF: '#10B981',
    'RT-CART': '#EF4444', 'RT-VIEW': '#EF4444', 'RT-BUYER': '#EF4444',
};

function ProgressBar({ progress, status }: { progress: number; status: string }) {
    const color = status === 'ERROR' ? '#EF4444' : status === 'DONE' ? '#10B981' : '#8B5CF6';
    return (
        <div className="w-full h-1 bg-[var(--surface2)] rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${progress}%`, backgroundColor: color }} />
        </div>
    );
}

function ActionBtn({ icon: Icon, label, onClick, loading, done }: {
    icon: any; label: string; onClick: () => void; loading?: boolean; done?: boolean;
}) {
    return (
        <button onClick={onClick} disabled={loading}
            className={cn(
                'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wide transition-all border',
                done ? 'bg-[var(--s-ok)]/10 border-[var(--s-ok)]/20 text-[var(--s-ok)]' :
                    'bg-[var(--surface)] border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--inv)]/40 hover:text-[var(--inv)] hover:bg-[var(--inv)]/5',
                loading && 'opacity-60 cursor-not-allowed'
            )}>
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Icon className="w-3 h-3" />}
            {label}
        </button>
    );
}

export function VideoLabTab({ storeId, productId, marketLang }: {
    storeId: string; productId: string; marketLang?: string;
}) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [dragActive, setDragActive] = useState(false);
    const [cards, setCards] = useState<VideoCard[]>([]);
    const [actionLoading, setActionLoading] = useState<Record<string, string>>({});

    const updateCard = useCallback((id: string, updates: Partial<VideoCard>) => {
        setCards(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    }, []);

    const pollJob = useCallback(async (cardId: string, jobId: string) => {
        const poll = async () => {
            try {
                const res = await fetch(`/api/video-lab/process?jobId=${jobId}`);
                const job = await res.json();
                updateCard(cardId, {
                    status: job.status, progress: job.progress,
                    hook: job.hook, funnelStage: job.funnelStage,
                    type: job.type, nomenclature: job.nomenclature,
                });
                if (!['DONE', 'ERROR'].includes(job.status)) {
                    setTimeout(poll, 3000);
                }
            } catch { setTimeout(poll, 5000); }
        };
        poll();
    }, [updateCard]);

    const uploadFiles = useCallback(async (files: FileList) => {
        if (!productId || productId === 'GLOBAL') {
            toast.error('Selecciona un producto primero');
            return;
        }
        Array.from(files).forEach(async (file) => {
            const cardId = `card_${Date.now()}_${Math.random()}`;
            const newCard: VideoCard = {
                id: cardId, fileName: file.name,
                status: 'PENDING', progress: 5, expanded: false,
            };
            setCards(prev => [newCard, ...prev]);

            try {
                const fd = new FormData();
                fd.append('file', file);
                fd.append('productId', productId);

                const res = await fetch('/api/video-lab/process', {
                    method: 'POST',
                    headers: { 'X-Store-Id': storeId },
                    body: fd,
                });
                const data = await res.json();
                if (data.ok) {
                    updateCard(cardId, { jobId: data.jobId, assetId: data.assetId, status: 'INGESTED', progress: 15 });
                    pollJob(cardId, data.jobId);
                } else throw new Error(data.error);
            } catch (e: any) {
                updateCard(cardId, { status: 'ERROR', progress: 0 });
                toast.error(`Error subiendo ${file.name}: ${e.message}`);
            }
        });
    }, [productId, storeId, updateCard, pollJob]);

    const handleAction = async (cardId: string, action: string, assetId?: string) => {
        const key = `${cardId}_${action}`;
        setActionLoading(prev => ({ ...prev, [key]: action }));
        try {
            const endpoints: Record<string, string> = {
                transcribe: '/api/video-lab/transcribe',
                translate: '/api/video-lab/translate-audio',
                subtitles: '/api/video-lab/subtitles',
                voice: '/api/video-lab/change-voice',
                variants: '/api/video-lab/generate-variants',
                clips: '/api/video-lab/split-clips',
                music: '/api/video-lab/add-music',
                lipsync: '/api/video-lab/lip-sync',
            };
            const ep = endpoints[action];
            if (!ep || !assetId) return;
            const res = await fetch(ep, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Store-Id': storeId },
                body: JSON.stringify({ assetId, productId }),
            });
            const data = await res.json();
            if (data.ok || data.success) toast.success(`${action} completado`);
            else toast.error(data.error ?? 'Error');
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setActionLoading(prev => { const n = { ...prev }; delete n[key]; return n; });
        }
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(false);
        if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
    };

    const needsProduct = !productId || productId === 'GLOBAL';

    return (
        <div className="flex flex-col gap-4">
            {/* Drop Zone */}
            <div
                onDragEnter={e => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDragOver={e => e.preventDefault()}
                onDrop={onDrop}
                className={cn(
                    'border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer',
                    dragActive ? 'border-[var(--cre)] bg-[var(--cre)]/8 scale-[1.01]' :
                        'border-[var(--border-high)] hover:border-[var(--cre)]/50 hover:bg-[var(--cre)]/3',
                    needsProduct && 'opacity-50 pointer-events-none'
                )}
                onClick={() => !needsProduct && fileInputRef.current?.click()}
            >
                <input ref={fileInputRef} type="file" multiple accept="video/*" className="hidden"
                    onChange={e => e.target.files && uploadFiles(e.target.files)} />
                <UploadCloud className="w-10 h-10 mx-auto mb-3 text-[var(--cre)] opacity-70" />
                <h3 className="text-[13px] font-black text-[var(--text)] mb-1">
                    {needsProduct ? 'Selecciona un producto antes de subir' : 'Subida Masiva al Video Lab'}
                </h3>
                <p className="text-[10px] text-[var(--text-muted)] max-w-md mx-auto">
                    Arrastra vídeos o carpetas. Pipeline automático: metadata strip → Whisper → Gemini análisis → nomenclatura Spencer → organización Drive
                </p>
                {!needsProduct && (
                    <button className="mt-4 px-5 py-2 bg-[var(--cre)] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all">
                        Seleccionar archivos
                    </button>
                )}
            </div>

            {/* Video Cards */}
            {cards.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-[11px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                            Pipeline — {cards.filter(c => c.status === 'DONE').length}/{cards.length} completados
                        </h3>
                        {cards.some(c => !['DONE', 'ERROR'].includes(c.status)) && (
                            <div className="flex items-center gap-1.5 text-[9px] text-[var(--inv)] font-bold">
                                <Loader2 className="w-3 h-3 animate-spin" /> Procesando…
                            </div>
                        )}
                    </div>

                    {cards.map(card => (
                        <div key={card.id}
                            className={cn(
                                'bg-[var(--surface)] border rounded-xl overflow-hidden transition-all',
                                card.status === 'DONE' ? 'border-[var(--s-ok)]/20' :
                                    card.status === 'ERROR' ? 'border-[var(--s-ko)]/20' : 'border-[var(--border)]'
                            )}>
                            {/* Card Header */}
                            <div className="flex items-center gap-3 p-3 cursor-pointer"
                                onClick={() => updateCard(card.id, { expanded: !card.expanded })}>
                                {/* Status Icon */}
                                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                                    card.status === 'DONE' ? 'bg-[var(--s-ok)]/15 text-[var(--s-ok)]' :
                                        card.status === 'ERROR' ? 'bg-[var(--s-ko)]/15 text-[var(--s-ko)]' :
                                            'bg-[var(--inv)]/10 text-[var(--inv)]')}>
                                    {card.status === 'DONE' ? <CheckCircle2 className="w-4 h-4" /> :
                                        card.status === 'ERROR' ? <AlertCircle className="w-4 h-4" /> :
                                            <Loader2 className="w-4 h-4 animate-spin" />}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className="text-[11px] font-black text-[var(--text)] truncate font-mono">
                                        {card.nomenclature ?? card.fileName}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[9px] text-[var(--text-muted)]">
                                            {STATUS_LABELS[card.status] ?? card.status}
                                        </span>
                                        {card.funnelStage && (
                                            <span className="px-1.5 py-0.5 rounded text-[8px] font-black"
                                                style={{ backgroundColor: `${FUNNEL_COLORS[card.funnelStage]}20`, color: FUNNEL_COLORS[card.funnelStage] }}>
                                                {card.funnelStage}
                                            </span>
                                        )}
                                        {card.type && (
                                            <span className="text-[8px] font-bold text-[var(--text-dim)] bg-[var(--surface2)] px-1.5 py-0.5 rounded">
                                                {card.type}
                                            </span>
                                        )}
                                    </div>
                                    {card.status !== 'DONE' && card.status !== 'ERROR' && (
                                        <ProgressBar progress={card.progress} status={card.status} />
                                    )}
                                </div>

                                {card.status === 'DONE' && (
                                    <div className="shrink-0 text-[var(--text-dim)]">
                                        {card.expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                    </div>
                                )}
                            </div>

                            {/* Expanded: hook + actions */}
                            {card.expanded && card.status === 'DONE' && (
                                <div className="px-4 pb-4 border-t border-[var(--border)] pt-3 space-y-3">
                                    {card.hook && (
                                        <div className="relative">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">
                                                Hook detectado {marketLang && marketLang !== 'ES' && <LangBadge marketLang={marketLang} />}
                                            </p>
                                            {marketLang && marketLang !== 'ES' ? (
                                                <TranslationToggle text={card.hook} marketLang={marketLang} context="ad hook">
                                                    {(t) => <p className="text-[11px] text-[var(--text)] italic">"{t}"</p>}
                                                </TranslationToggle>
                                            ) : (
                                                <p className="text-[11px] text-[var(--text)] italic">"{card.hook}"</p>
                                            )}
                                        </div>
                                    )}

                                    {/* Acciones automáticas completadas */}
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">✅ Automático al subir</p>
                                        <div className="flex flex-wrap gap-1">
                                            {['Metadata eliminada', 'Nomenclatura Spencer', 'Análisis Gemini', 'Organizado Drive'].map(t => (
                                                <span key={t} className="text-[8px] px-2 py-0.5 bg-[var(--s-ok)]/10 text-[var(--s-ok)] rounded-full font-bold">✓ {t}</span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Acciones disponibles */}
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Acciones disponibles</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            <ActionBtn icon={Mic} label="Transcribir"
                                                onClick={() => handleAction(card.id, 'transcribe', card.assetId)}
                                                loading={actionLoading[`${card.id}_transcribe`] !== undefined} />
                                            <ActionBtn icon={Languages} label="Traducir"
                                                onClick={() => handleAction(card.id, 'translate', card.assetId)}
                                                loading={actionLoading[`${card.id}_translate`] !== undefined} />
                                            <ActionBtn icon={Scissors} label="Separar clips"
                                                onClick={() => handleAction(card.id, 'clips', card.assetId)}
                                                loading={actionLoading[`${card.id}_clips`] !== undefined} />
                                            <ActionBtn icon={FileVideo} label="Subtítulos"
                                                onClick={() => handleAction(card.id, 'subtitles', card.assetId)}
                                                loading={actionLoading[`${card.id}_subtitles`] !== undefined} />
                                            <ActionBtn icon={Mic} label="Cambiar voz"
                                                onClick={() => handleAction(card.id, 'voice', card.assetId)}
                                                loading={actionLoading[`${card.id}_voice`] !== undefined} />
                                            <ActionBtn icon={Music} label="Añadir música"
                                                onClick={() => handleAction(card.id, 'music', card.assetId)}
                                                loading={actionLoading[`${card.id}_music`] !== undefined} />
                                            <ActionBtn icon={Layers} label="Lip Sync"
                                                onClick={() => handleAction(card.id, 'lipsync', card.assetId)}
                                                loading={actionLoading[`${card.id}_lipsync`] !== undefined} />
                                            <ActionBtn icon={Copy} label="Generar variantes ×5"
                                                onClick={() => handleAction(card.id, 'variants', card.assetId)}
                                                loading={actionLoading[`${card.id}_variants`] !== undefined} />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {cards.length === 0 && (
                <div className="text-center py-12 text-[10px] text-[var(--text-dim)]">
                    <FileVideo className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    No hay vídeos en el pipeline. Arrastra archivos arriba.
                </div>
            )}
        </div>
    );
}
