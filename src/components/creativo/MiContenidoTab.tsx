'use client';

import React, { useState, useCallback, useRef } from 'react';
import {
    Upload, Search, Filter, Grid, List as ListIcon,
    Play, ChevronRight, CheckCircle2, Loader2,
    Zap, Clock, Target, Star, MoreVertical,
    FileVideo, Trash2, Download, Copy, Eye,
    Sparkles, Info, X, MessageSquare,
    Lightbulb, ShieldCheck, Tag, RefreshCw, Clapperboard, Heart
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type ClipType = 'HOOK' | 'CUERPO' | 'CTA' | 'BROLL' | 'TESTIMONIAL' | 'UNBOXING' | 'DEMO' | 'RAW';
type ClipPhase = 'FRIO' | 'TEMPLADO' | 'CALIENTE' | 'RETARGETING';

interface Clip {
    id: string;
    nomenclature: string;
    thumbnail: string;
    videoUrl: string;
    type: ClipType;
    phase: ClipPhase;
    duration: string;
    quality: number; // 1-10
    date: string;
    tags: string[];
    transcription?: string;
    analysis?: {
        shotType: string;
        emotion: string;
        lighting: string;
        visualQuality: string;
    };
    notes?: string;
}

export function MiContenidoTab({ storeId, productId, productSku }: {
    storeId: string,
    productId: string,
    productSku: string
}) {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
    const [selectedClipIds, setSelectedClipIds] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<ClipType | 'Todos'>('Todos');
    const [filterPhase, setFilterPhase] = useState<ClipPhase | 'Todos'>('Todos');
    const [filterQuality, setFilterQuality] = useState<'Todos' | '>7' | '5-7' | '<5'>('Todos');
    const [filterDuration, setFilterDuration] = useState<'Todos' | '<5s' | '5-15s' | '15-30s' | '>30s'>('Todos');

    const [clips, setClips] = useState<Clip[]>([
        {
            id: 'c1',
            nomenclature: 'PURE_CLIP01_HOOK_FRIO_8.mp4',
            thumbnail: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=400&h=225&fit=crop',
            videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
            type: 'HOOK',
            phase: 'FRIO',
            duration: '0:05',
            quality: 8.5,
            date: '2024-03-07',
            tags: ['Natural', 'Daylight', 'POV'],
            transcription: "Si estás cansado de que tu piel se vea opaca, tenés que ver esto.",
            analysis: {
                shotType: "Close-up / Macro",
                emotion: "Preocupación → Alivio",
                lighting: "Luz natural lateral",
                visualQuality: "4K HDR"
            },
            notes: "Buen clip para el gancho inicial. Luz perfecta."
        },
        {
            id: 'c2',
            nomenclature: 'PURE_CLIP02_BROLL_CALIENTE_6.mp4',
            thumbnail: 'https://images.unsplash.com/photo-1556228720-195a672e8ff5?w=400&h=225&fit=crop',
            videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
            type: 'BROLL',
            phase: 'CALIENTE',
            duration: '0:12',
            quality: 6.2,
            date: '2024-03-06',
            tags: ['Textura', 'Producto'],
            analysis: {
                shotType: "Cenital",
                emotion: "Neutral",
                lighting: "Luz de estudio directa",
                visualQuality: "1080p Standard"
            }
        }
    ]);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        toast.info(`Procesando ${files.length} clips con IA...`);
    };

    const toggleSelection = (id: string, e?: React.MouseEvent | React.ChangeEvent<HTMLInputElement>) => {
        if (e && 'stopPropagation' in e) e.stopPropagation();
        setSelectedClipIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const filteredClips = clips.filter(c => {
        if (filterType !== 'Todos' && c.type !== filterType) return false;
        if (searchQuery && !c.nomenclature.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    const selectedClip = clips.find(c => c.id === selectedClipId);

    return (
        <div className="flex h-[calc(100vh-140px)] gap-4 animate-in fade-in duration-500 relative">
            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col gap-4 min-w-0">
                {/* TOOLBAR */}
                <div className="bg-white p-4 rounded-xl border border-[var(--border)] shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)] font-bold">Gestión de Activos</span>
                            <h2 className="text-xs font-semibold tracking-tight text-[var(--text-primary)] uppercase leading-none">Mi Contenido Propio</h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex bg-[var(--bg)] rounded-lg p-0.5 border border-[var(--border)]">
                                <button onClick={() => setViewMode('grid')} className={cn("p-1 rounded", viewMode === 'grid' ? "bg-white text-[var(--cre)] shadow-sm" : "text-[var(--text-tertiary)]")}>
                                    <Grid size={14} />
                                </button>
                                <button onClick={() => setViewMode('list')} className={cn("p-1 rounded", viewMode === 'list' ? "bg-white text-[var(--cre)] shadow-sm" : "text-[var(--text-tertiary)]")}>
                                    <ListIcon size={14} />
                                </button>
                            </div>
                            <label className="h-8 px-3 rounded-lg bg-[var(--cre)] text-white text-xs font-medium hover:opacity-90 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm">
                                <Upload size={14} /> SUBIR CLIPS
                                <input type="file" className="hidden" multiple accept="video/*" onChange={handleUpload} />
                            </label>
                        </div>
                    </div>

                    {/* FILTERS */}
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex-1 min-w-[180px] relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" size={14} />
                            <input
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Buscar clips..."
                                className="w-full h-8 pl-8 pr-4 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-xs text-[var(--text-primary)] outline-none focus:border-[var(--cre)] transition-all"
                            />
                        </div>
                        <FilterSelect label="Tipo" value={filterType} options={['Todos', 'HOOK', 'CTA', 'BROLL', 'DEMO']} onChange={setFilterType} />
                        <FilterSelect label="Calidad" value={filterQuality} options={['Todos', '>7', '<5']} onChange={setFilterQuality} />
                    </div>
                </div>

                {/* ASSETS AREA */}
                <div className="flex-1 overflow-hidden bg-white rounded-xl border border-[var(--border)] shadow-sm flex flex-col relative">
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 xl:p-6 pb-20">
                        {viewMode === 'grid' ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 xl:gap-6">
                                {filteredClips.map(clip => (
                                    <ClipCard
                                        key={clip.id}
                                        clip={clip}
                                        selected={selectedClipId === clip.id}
                                        checked={selectedClipIds.includes(clip.id)}
                                        onCheck={(e: React.ChangeEvent<HTMLInputElement>) => toggleSelection(clip.id, e)}
                                        onClick={() => setSelectedClipId(clip.id)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-1.5">
                                <div className="grid grid-cols-12 px-3 py-1.5 border-b border-[var(--border)] text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">
                                    <div className="col-span-1"></div>
                                    <div className="col-span-4">Nombre / Nomenclatura</div>
                                    <div className="col-span-2 text-center">Tipo</div>
                                    <div className="col-span-2 text-center">Fase</div>
                                    <div className="col-span-1 text-center">Calidad</div>
                                    <div className="col-span-1 text-center">Duración</div>
                                    <div className="col-span-1 text-right">Acciones</div>
                                </div>
                                {filteredClips.map(clip => (
                                    <ClipListRow
                                        key={clip.id}
                                        clip={clip}
                                        selected={selectedClipId === clip.id}
                                        checked={selectedClipIds.includes(clip.id)}
                                        onCheck={(e: React.ChangeEvent<HTMLInputElement>) => toggleSelection(clip.id, e)}
                                        onClick={() => setSelectedClipId(clip.id)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* BULK ACTIONS BAR */}
                    {selectedClipIds.length > 0 && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white border border-[var(--border)] rounded-xl px-4 py-3 shadow-lg flex items-center gap-6 animate-in slide-in-from-bottom-5 z-20">
                            <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase">{selectedClipIds.length} clips</span>
                            <div className="flex items-center gap-2">
                                <button className="h-8 px-3 rounded-lg bg-[var(--cre)] text-white text-[10px] font-medium uppercase tracking-wider flex items-center gap-1.5">
                                    <Zap size={12} /> Procesar
                                </button>
                                <button className="h-8 px-3 rounded-lg bg-white border border-[var(--border)] text-[var(--text-secondary)] text-[10px] font-medium uppercase tracking-wider">
                                    Reclasificar
                                </button>
                                <button onClick={() => setSelectedClipIds([])} className="text-[var(--text-tertiary)] hover:text-rose-500 text-[10px] font-bold uppercase transition-colors">Cancelar</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* DETAIL PANEL */}
            <aside className={cn(
                "w-[340px] bg-white rounded-xl border border-[var(--border)] shadow-sm flex flex-col transition-all duration-300 shrink-0 overflow-hidden",
                !selectedClipId && "hidden"
            )}>
                {selectedClip && (
                    <>
                        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg)]/10">
                            <div className="space-y-0.5">
                                <h3 className="text-xs font-semibold text-[var(--text-primary)] uppercase">Detalle del Clip</h3>
                                <p className="text-[10px] font-medium text-[var(--text-tertiary)] truncate w-40">{selectedClip.nomenclature}</p>
                            </div>
                            <button onClick={() => setSelectedClipId(null)} className="p-1 hover:bg-white rounded-md text-[var(--text-tertiary)]">
                                <X size={16} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
                            <div className="aspect-video bg-black rounded-lg overflow-hidden shadow-sm">
                                <video src={selectedClip.videoUrl} className="w-full h-full object-cover" controls />
                            </div>
                            <div className="space-y-4">
                                <div className="p-4 bg-[var(--bg)]/50 rounded-lg border border-[var(--border)] space-y-3">
                                    <h4 className="text-[10px] font-bold text-[var(--text-secondary)] uppercase flex items-center gap-1.5">
                                        <Sparkles size={12} /> Análisis de IA
                                    </h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <DetailItem label="Plano" value={selectedClip.analysis?.shotType} />
                                        <DetailItem label="Calidad" value={selectedClip.analysis?.visualQuality} />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider pl-1">Transcripción</span>
                                    <p className="text-xs text-[var(--text-primary)] bg-[var(--bg)]/30 border border-[var(--border)] p-3 rounded-lg italic">
                                        "{selectedClip.transcription}"
                                    </p>
                                </div>
                                <div className="space-y-1.5">
                                    <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider pl-1">Observaciones</span>
                                    <textarea
                                        className="w-full h-20 bg-white border border-[var(--border)] rounded-lg p-3 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--cre)]"
                                        placeholder="Añade notas..."
                                        defaultValue={selectedClip.notes}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="p-4 border-t border-[var(--border)] bg-[var(--bg)]/10 flex gap-2">
                            <button className="flex-1 h-9 rounded-lg bg-[var(--cre)] text-white text-[10px] font-semibold uppercase tracking-wider">
                                Enviar a Producción
                            </button>
                            <button className="h-9 px-3 rounded-lg bg-white border border-rose-100 text-rose-500 hover:bg-rose-50">
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </>
                )}
            </aside>
        </div>
    );
}

function ClipCard({ clip, selected, checked, onCheck, onClick }: any) {
    const qualityColor = clip.quality >= 7 ? 'text-emerald-600' : 'text-amber-600';

    return (
        <div
            onClick={onClick}
            className={cn(
                "group bg-white border rounded-xl overflow-hidden transition-all shadow-sm",
                selected ? "border-[var(--cre)] ring-1 ring-[var(--cre)]" : "border-[var(--border)] hover:border-[var(--cre)]/40"
            )}
        >
            <div className="aspect-video relative bg-black">
                <img src={clip.thumbnail} className="w-full h-full object-cover opacity-80" alt="thumb" />
                <button
                    onClick={onCheck}
                    className={cn(
                        "absolute top-2 right-2 w-4 h-4 rounded border transition-all flex items-center justify-center",
                        checked ? "bg-[var(--cre)] border-[var(--cre)]" : "bg-black/20 border-white/40 opacity-0 group-hover:opacity-100"
                    )}
                >
                    {checked && <CheckCircle2 size={12} className="text-white" />}
                </button>
                <div className="absolute top-2 left-2 flex flex-col gap-1 pointer-events-none">
                    <span className="px-1.5 py-0.5 rounded bg-black/60 text-white text-[8px] font-bold uppercase">{clip.type}</span>
                    <span className={cn(
                        "px-1.5 py-0.5 rounded text-[8px] font-bold uppercase",
                        clip.phase === 'FRIO' ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-[var(--cre)]"
                    )}>{clip.phase}</span>
                </div>
                <span className="absolute bottom-2 right-2 text-[8px] text-white bg-black/60 px-1 rounded">{clip.duration}</span>
            </div>
            <div className="p-3">
                <div className="flex items-center justify-between gap-2 overflow-hidden">
                    <h4 className="text-[10px] font-semibold text-[var(--text-primary)] truncate uppercase leading-tight">{clip.nomenclature}</h4>
                    <span className={cn("text-[10px] font-bold shrink-0", qualityColor)}>{clip.quality}</span>
                </div>
            </div>
        </div>
    );
}

function ClipListRow({ clip, selected, checked, onCheck, onClick }: any) {
    return (
        <div
            onClick={onClick}
            className={cn(
                "grid grid-cols-12 px-3 py-2 rounded-lg border h-10 items-center transition-all cursor-pointer group",
                selected ? "bg-[var(--cre-bg)] border-[var(--cre)]/30" : "bg-white border-transparent hover:bg-[var(--bg)]"
            )}
        >
            <div className="col-span-1 flex items-center">
                <input
                    type="checkbox" checked={checked} onClick={e => e.stopPropagation()} onChange={onCheck}
                    className="rounded border-[var(--border)] text-[var(--cre)]"
                />
            </div>
            <div className="col-span-4 min-w-0">
                <p className="text-[10px] font-semibold text-[var(--text-primary)] truncate uppercase">{clip.nomenclature}</p>
            </div>
            <div className="col-span-2 text-center">
                <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{clip.type}</span>
            </div>
            <div className="col-span-2 text-center">
                <span className={cn(
                    "text-[9px] font-bold uppercase px-1.5 py-0.5 rounded",
                    clip.phase === 'FRIO' ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-[var(--cre)]"
                )}>{clip.phase}</span>
            </div>
            <div className="col-span-1 text-center text-[10px] font-bold text-emerald-600">{clip.quality}</div>
            <div className="col-span-1 text-center text-[10px] font-mono text-[var(--text-tertiary)]">{clip.duration}</div>
            <div className="col-span-1 text-right flex justify-end opacity-0 group-hover:opacity-100">
                <button className="p-1 hover:text-[var(--cre)]"><Download size={12} /></button>
            </div>
        </div>
    );
}

function FilterSelect({ label, value, options, onChange }: any) {
    return (
        <div className="flex flex-col gap-0.5">
            <span className="text-[8px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest pl-1">{label}</span>
            <select
                value={value} onChange={e => onChange(e.target.value)}
                className="h-8 px-3 pr-8 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-xs font-medium text-[var(--text-primary)] outline-none focus:border-[var(--cre)] appearance-none cursor-pointer"
            >
                {options.map((o: any) => <option key={o} value={o}>{o}</option>)}
            </select>
        </div>
    );
}

function DetailItem({ label, value }: any) {
    return (
        <div>
            <p className="text-[8px] font-bold text-[var(--text-tertiary)] uppercase leading-none mb-0.5">{label}</p>
            <p className="text-[10px] font-semibold text-[var(--text-primary)] uppercase truncate">{value || '---'}</p>
        </div>
    );
}
