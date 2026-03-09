'use client';
import React, { useState, useRef, useCallback } from 'react';
import {
    UploadCloud, FileVideo, Loader2, CheckCircle2, AlertCircle,
    Play, Mic, Languages, Scissors, Music, Layers, Copy,
    ChevronDown, ChevronRight, Clock, Tag, Plus, Video, HardDrive
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

export function VideoLabTab({ storeId, productId, marketLang }: {
    storeId: string; productId: string; marketLang?: string;
}) {
    const [view, setView] = useState<'WORKSPACE' | 'META' | 'DRIVE' | 'UPLOAD'>('WORKSPACE');
    const [videoType, setVideoType] = useState<'propio' | 'competencia'>('propio');
    const [activeProjects, setActiveProjects] = useState<any[]>([
        { id: '1', name: 'Venta Flash Mar24', status: 'editando' },
        { id: '2', name: 'Analisis Competencia X', status: 'analizado' },
    ]);

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
                        <h4 className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase tracking-[0.2em] mb-4">Proyectos Activos</h4>
                        <div className="space-y-1">
                            {activeProjects.map(p => (
                                <div key={p.id} className="p-3 rounded-xl bg-[var(--bg)]/10 border border-[var(--border)] hover:border-[var(--cre)]/40 transition-all cursor-pointer group">
                                    <div className="text-[11px] font-bold text-[var(--text-primary)] uppercase truncate">{p.name}</div>
                                    <div className="flex items-center justify-between mt-1">
                                        <span className="text-[8px] uppercase font-bold text-[var(--text-tertiary)]">{p.status}</span>
                                        <ChevronRight size={12} className="text-[var(--text-tertiary)] group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-auto p-4 rounded-xl bg-[var(--cre-bg)]/20 border border-[var(--cre)]/10">
                        <div className="flex items-center gap-2 text-[var(--cre)] mb-2">
                            <Mic size={14} />
                            <span className="text-[9px] font-bold uppercase tracking-wider">Agente IA</span>
                        </div>
                        <p className="text-[11px] text-[var(--text-primary)] font-medium leading-relaxed opacity-70 italic">
                            "¿Quieres que analice el gancho de tu último video o prefieres que genere 5 variantes optimizadas?"
                        </p>
                    </div>
                </aside>

                {/* MAIN WORKSPACE */}
                <main className="flex-1 bg-white p-6 overflow-y-auto relative">
                    <div className="max-w-5xl mx-auto h-full">
                        {view === 'WORKSPACE' && (
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
                                <div className="mt-4 grid grid-cols-2 gap-4 w-full max-w-md">
                                    <button onClick={() => setView('UPLOAD')} className="p-6 rounded-xl border border-[var(--border)] border-dashed bg-white hover:bg-[var(--cre-bg)]/10 transition-all group flex flex-col items-center gap-3">
                                        <UploadCloud size={24} className="text-[var(--text-tertiary)] group-hover:text-[var(--cre)]" />
                                        <span className="text-[10px] font-bold uppercase text-[var(--text-tertiary)]">Subir Archivo</span>
                                    </button>
                                    <button onClick={() => setView('DRIVE')} className="p-6 rounded-xl border border-[var(--border)] border-dashed bg-white hover:bg-[var(--cre-bg)]/10 transition-all group flex flex-col items-center gap-3">
                                        <HardDrive size={24} className="text-[var(--text-tertiary)] group-hover:text-[var(--cre)]" />
                                        <span className="text-[10px] font-bold uppercase text-[var(--text-tertiary)]">Desde Drive</span>
                                    </button>
                                </div>
                            </div>
                        )}

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
                                <div className="p-20 border-2 border-dashed border-[var(--border)] rounded-xl text-center relative group bg-[var(--bg)]/10 hover:bg-[var(--cre-bg)]/20 transition-all cursor-pointer">
                                    <input type="file" accept="video/*" className="absolute inset-0 opacity-0 cursor-pointer" />
                                    <UploadCloud size={40} className="mx-auto text-[var(--cre)] opacity-40 mb-4 group-hover:scale-110 transition-transform" />
                                    <p className="text-[11px] font-bold uppercase text-[var(--text-primary)]">Arrastra tu video {videoType} aquí</p>
                                    <p className="text-[9px] font-bold uppercase text-[var(--text-tertiary)] mt-2 italic opacity-60">Soporta MP4, MOV, WEBM (Max 500MB)</p>
                                </div>
                                <button className="w-full h-11 bg-[var(--cre)] text-white rounded-lg font-bold uppercase text-[10px] tracking-widest shadow-sm">Seleccionar Archivo Local</button>
                            </div>
                        )}

                        {view === 'META' && (
                            <div className="animate-in slide-in-from-bottom-2 duration-500 h-full">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-primary)] flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center text-[var(--cre)] shadow-sm">
                                            <Layers size={14} />
                                        </div>
                                        Biblioteca Meta Ads
                                    </h3>
                                    <div className="flex gap-2">
                                        <input type="text" placeholder="Buscar en Meta Ad Library..." className="h-9 px-4 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[10px] font-bold uppercase w-64 outline-none focus:border-[var(--cre)]/40" />
                                        <button className="h-9 px-4 bg-[var(--text-primary)] text-white rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-sm">Importar</button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4 pb-12">
                                    {[1, 2, 3, 4, 5, 6].map(i => (
                                        <div key={i} className="bg-white border border-[var(--border)] rounded-xl group overflow-hidden shadow-sm">
                                            <div className="aspect-[9/16] bg-[var(--text-primary)] relative">
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <Play size={24} className="text-white opacity-40 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                                <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-emerald-500 text-white text-[8px] font-bold rounded uppercase shadow-sm">Activo</div>
                                            </div>
                                            <div className="p-3">
                                                <div className="text-[10px] font-bold uppercase text-[var(--text-primary)] truncate">Meta Ad #00{i}</div>
                                                <div className="text-[8px] text-[var(--text-tertiary)] uppercase font-bold mt-1 opacity-60">Gasto Est: $1.2k - $5k</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {view === 'DRIVE' && (
                            <div className="animate-in slide-in-from-bottom-2 duration-500 h-full">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-primary)] mb-8 flex items-center gap-3">
                                    <HardDrive size={18} className="text-[var(--cre)]" />
                                    Drive de Producto
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {['01_HOOKS', '02_CRUDE_CONTENT', '03_EDITS', '04_RESOURCES'].map(folder => (
                                        <div key={folder} className="p-4 bg-white border border-[var(--border)] rounded-xl flex items-center gap-3 hover:border-[var(--cre)]/40 transition-all cursor-pointer shadow-sm group">
                                            <div className="w-8 h-8 rounded-lg bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center text-amber-500 font-bold text-[10px] group-hover:bg-amber-50 group-hover:border-amber-200">
                                                D
                                            </div>
                                            <span className="text-[10px] font-bold uppercase text-[var(--text-primary)] truncate">{folder}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
