'use client';

import React, { useState, useMemo } from 'react';
import {
    FolderOpen, FileVideo, FileText, Image as ImageIcon, File, ChevronRight,
    ChevronLeft, ChevronDown, RefreshCw, UploadCloud, Search, Filter,
    Play, ExternalLink, Grid, List as ListIcon, Tag, Zap,
    Trophy, Sparkles, TrendingUp, AlertTriangle, MoreHorizontal,
    Layers, Clock, BarChart3, Info, X, Download, Share2, Trash2,
    CheckCircle2, Copy, Check, DownloadCloud, Eye, Target
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useProduct } from '@/context/ProductContext';

// --- MAIN COMPONENT ---

export function BibliotecaTab({ storeId, productId }: { storeId: string; productId: string }) {
    const [assets, setAssets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingInbox, setProcessingInbox] = useState(false);

    const fetchAssets = async () => {
        if (!productId || productId === 'GLOBAL') return;
        setLoading(true);
        try {
            const res = await fetch(`/api/centro-creativo/biblioteca?productId=${productId}&storeId=${storeId}`);
            const data = await res.json();
            if (data.artifacts) {
                setAssets(data.artifacts);
            }
        } catch (e) {
            toast.error('Error cargando biblioteca');
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchAssets();
    }, [productId, storeId]);

    const handleProcessInbox = async () => {
        setProcessingInbox(true);
        try {
            const res = await fetch('/api/centro-creativo/inbox/process', {
                method: 'POST',
                body: JSON.stringify({ productId, storeId }),
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await res.json();
            if (data.success) {
                toast.success(`Procesados ${data.processed.length} archivos`);
                fetchAssets();
            } else {
                toast.error(data.error || 'Error procesando Inbox');
            }
        } catch (e) {
            toast.error('Error de red al procesar Inbox');
        } finally {
            setProcessingInbox(false);
        }
    };

    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [search, setSearch] = useState('');
    const [previewAssetIndex, setPreviewAssetIndex] = useState<number | null>(null);
    const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
    const [showIntelligence, setShowIntelligence] = useState(true);

    const [filters, setFilters] = useState({
        phase: 'Todos',
        format: 'Todos',
        status: 'Todos',
        framework: 'Todos',
        hookType: 'Todos',
        minScore: 0
    });

    const filtered = useMemo(() => {
        return assets.filter(a => {
            if (search && !a.nomenclatura?.toLowerCase().includes(search.toLowerCase())) return false;
            if (filters.phase !== 'Todos' && a.funnelStage !== filters.phase) return false;
            if (filters.format !== 'Todos' && a.format !== filters.format) return false;
            if (filters.status !== 'Todos' && a.metaStatus !== filters.status) return false;
            if (filters.framework !== 'Todos' && a.framework !== filters.framework) return false;
            if (filters.hookType !== 'Todos' && a.hookType !== filters.hookType) return false;
            if (a.score < filters.minScore) return false;
            return true;
        });
    }, [assets, search, filters]);

    const hasRealData = assets.some(a => a.meta_ad_id);

    const toggleSelection = (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setSelectedAssetIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    if (!productId || productId === 'GLOBAL') {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-xl border border-dashed border-[var(--border)]">
                <FolderOpen className="w-10 h-10 text-[var(--border)] mb-3" />
                <p className="text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">Selecciona un producto</p>
                <p className="text-[10px] text-[var(--text-tertiary)] opacity-60 mt-1 uppercase tracking-widest font-medium">Biblioteca de Creativos Finales</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500 pb-20">

            {/* PANEL DE INTELIGENCIA (Light Version) */}
            {hasRealData && showIntelligence && (
                <div className="bg-white rounded-xl p-5 border border-[var(--border)] shadow-sm relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-[var(--cre-bg)] text-[var(--cre)] flex items-center justify-center border border-[var(--cre)]/10">
                                <TrendingUp size={16} />
                            </div>
                            <div>
                                <h3 className="text-[var(--text-primary)] text-xs font-bold uppercase tracking-widest">Intelligence Panel</h3>
                                <p className="text-[var(--text-tertiary)] text-[9px] font-medium uppercase tracking-tight">Análisis de rendimiento real</p>
                            </div>
                        </div>
                        <button onClick={() => setShowIntelligence(false)} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-all">
                            <X size={14} />
                        </button>
                    </div>

                    <div className="grid grid-cols-5 gap-4">
                        <InsightCard label="Top ROAS Week" value="3.8x" icon={Trophy} sub="PURE-MECH01-V1" />
                        <InsightCard label="Best HK CTR" value="3.2%" icon={Zap} sub="Miedo" />
                        <InsightCard label="Best CPA" value="€3.45" icon={Target} sub="Fase: FRIO" />
                        <InsightCard label="Framework" value="64%" icon={Layers} sub="Hormozi (W50%)" />
                        <InsightCard label="Fatigue Risk" value="2" icon={AlertTriangle} sub="Próximos 7 días" danger />
                    </div>
                </div>
            )}

            {/* HEADER & FILTERS */}
            <div className="bg-white p-5 rounded-xl border border-[var(--border)] shadow-sm space-y-5 shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 px-1">
                        <div className="w-7 h-7 rounded bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center text-[var(--text-tertiary)]">
                            <Grid size={14} />
                        </div>
                        <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--text-primary)]">Biblioteca Central</h2>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleProcessInbox}
                            disabled={processingInbox}
                            className="h-8 px-4 rounded-lg bg-[var(--cre)] text-white text-[10px] font-bold uppercase tracking-wider hover:opacity-90 transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
                        >
                            <RefreshCw size={12} className={cn(processingInbox && "animate-spin")} />
                            {processingInbox ? 'Procesando...' : 'Procesar Inbox'}
                        </button>
                        <div className="flex bg-[var(--bg)] rounded-lg p-0.5 border border-[var(--border)]">
                            <button onClick={() => setViewMode('grid')} className={cn("p-1.5 rounded transition-all", viewMode === 'grid' ? "bg-white text-[var(--cre)] shadow-sm" : "text-[var(--text-tertiary)]")}>
                                <Grid size={14} />
                            </button>
                            <button onClick={() => setViewMode('list')} className={cn("p-1.5 rounded transition-all", viewMode === 'list' ? "bg-white text-[var(--cre)] shadow-sm" : "text-[var(--text-tertiary)]")}>
                                <ListIcon size={14} />
                            </button>
                        </div>
                        <div className="h-8 px-3 bg-[var(--bg)] rounded-lg border border-[var(--border)] flex items-center gap-2">
                            <Search size={12} className="text-[var(--text-tertiary)]" />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Buscar ID..."
                                className="bg-transparent border-none text-[10px] font-bold text-[var(--text-primary)] outline-none w-32 uppercase"
                            />
                        </div>
                        <button
                            onClick={() => setSelectedAssetIds(assets.map(a => a.id))}
                            className="h-8 px-4 rounded-lg bg-[var(--text-primary)] text-white text-[10px] font-bold uppercase tracking-wider hover:opacity-90 transition-all shadow-sm"
                        >
                            Select All
                        </button>
                    </div>
                </div>

                <div className="flex items-end gap-5 pt-4 border-t border-[var(--border)]">
                    <FilterSelect label="Fase" value={filters.phase} options={['Todos', 'COLD', 'WARM', 'HOT', 'RETARGETING']} onChange={(v: string) => setFilters({ ...filters, phase: v })} />
                    <FilterSelect label="Formato" value={filters.format} options={['Todos', '9:16', '4:5', '1:1']} onChange={(v: string) => setFilters({ ...filters, format: v })} />
                    <FilterSelect label="Estado Meta" value={filters.status} options={['Todos', 'NOT_PUBLISHED', 'ACTIVE', 'PAUSED', 'FATIGUED']} onChange={(v: string) => setFilters({ ...filters, status: v })} />
                    <FilterSelect label="Framework" value={filters.framework} options={['Todos', 'PAS', 'AIDA', 'Hormozi', 'DTC']} onChange={(v: string) => setFilters({ ...filters, framework: v })} />

                    <div className="ml-auto w-32">
                        <p className="text-[8px] font-bold text-[var(--text-tertiary)] uppercase mb-1">Min Score ({filters.minScore})</p>
                        <input
                            type="range" min="0" max="100" value={filters.minScore}
                            onChange={e => setFilters({ ...filters, minScore: parseInt(e.target.value) })}
                            className="w-full h-1 bg-[var(--bg)] rounded-lg accent-[var(--cre)]"
                        />
                    </div>
                </div>
            </div>

            {/* ASSETS AREA */}
            <div className="bg-white rounded-xl border border-[var(--border)] shadow-sm flex flex-col relative overflow-hidden">
                <div className="p-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <RefreshCw className="w-8 h-8 text-[var(--cre)] animate-spin" />
                            <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">Sincronizando con Drive...</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <FileVideo className="w-10 h-10 text-[var(--border)] mb-3" />
                            <p className="text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">No hay archivos procesadores</p>
                            <p className="text-[10px] text-[var(--text-tertiary)] opacity-60 mt-1 uppercase tracking-widest font-medium">Usa "Procesar Inbox" para organizar tus capturas</p>
                        </div>
                    ) : viewMode === 'grid' ? (
                        <div className="grid grid-cols-5 gap-4">
                            {filtered.map((asset) => (
                                <AssetGridCard
                                    key={asset.id}
                                    asset={asset}
                                    selected={selectedAssetIds.includes(asset.id)}
                                    onSelect={(e: any) => toggleSelection(asset.id, e)}
                                    onPlay={() => setPreviewAssetIndex(assets.indexOf(asset))}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {filtered.map(asset => (
                                <AssetListRow
                                    key={asset.id}
                                    asset={asset}
                                    selected={selectedAssetIds.includes(asset.id)}
                                    onSelect={(e: any) => toggleSelection(asset.id, e)}
                                    onPlay={() => setPreviewAssetIndex(assets.indexOf(asset))}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* BULK ACTIONS (Simplified) */}
                {selectedAssetIds.length > 0 && (
                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[var(--text-primary)] rounded-xl px-6 py-3 shadow-md flex items-center gap-6 z-50 animate-in slide-in-from-bottom-4">
                        <div className="text-white font-bold text-[10px] uppercase tracking-widest border-r border-white/10 pr-6">
                            <span className="text-[var(--cre)]">{selectedAssetIds.length}</span> Seleccionados
                        </div>
                        <div className="flex gap-2">
                            <button className="h-7 px-3 rounded-lg bg-[var(--cre)] text-white text-[9px] font-bold uppercase flex items-center gap-1.5 hover:opacity-90 transition-all shadow-sm">
                                <Share2 size={12} /> Send Meta
                            </button>
                            <button className="h-7 px-3 rounded-lg bg-white/10 text-white text-[9px] font-bold uppercase flex items-center gap-1.5 hover:bg-white/20 transition-all">
                                <Download size={12} /> ZIP
                            </button>
                            <button className="h-7 px-3 rounded-lg bg-[var(--s-ko)] text-white text-[9px] font-bold uppercase flex items-center gap-1.5 hover:opacity-90 transition-all shadow-sm">
                                <Trash2 size={12} /> Borrar
                            </button>
                        </div>
                        <button onClick={() => setSelectedAssetIds([])} className="text-white/60 hover:text-white transition-all text-[9px] font-bold uppercase underline">Limpiar</button>
                    </div>
                )}
            </div>

            {/* MODAL */}
            {previewAssetIndex !== null && (
                <AssetModal
                    asset={assets[previewAssetIndex]}
                    onClose={() => setPreviewAssetIndex(null)}
                />
            )}
        </div>
    );
}

function InsightCard({ label, value, icon: Icon, sub, danger }: any) {
    return (
        <div className="p-3 bg-[var(--bg)]/30 border border-[var(--border)] rounded-xl group hover:border-[var(--cre)]/20 transition-all">
            <div className="flex items-center gap-1.5 mb-2">
                <Icon size={12} className={danger ? "text-rose-500" : "text-[var(--cre)]"} />
                <span className="text-[8px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">{label}</span>
            </div>
            <div className="space-y-0.5">
                <p className={cn("text-lg font-bold uppercase", danger ? "text-rose-500" : "text-[var(--text-primary)]")}>{value}</p>
                <p className="text-[9px] font-medium text-[var(--text-tertiary)] uppercase tracking-tight truncate">{sub}</p>
            </div>
        </div>
    );
}

function FilterSelect({ label, value, options, onChange }: any) {
    return (
        <div className="flex flex-col gap-1">
            <span className="text-[8px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest pl-1">{label}</span>
            <select
                value={value} onChange={e => onChange(e.target.value)}
                className="h-8 px-2 bg-white border border-[var(--border)] rounded-lg text-[10px] font-bold uppercase outline-none focus:border-[var(--cre)]/40 appearance-none cursor-pointer"
            >
                {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
            </select>
        </div>
    );
}

function AssetGridCard({ asset, selected, onSelect, onPlay }: any) {
    return (
        <div className={cn(
            "group bg-white rounded-xl border overflow-hidden transition-all flex flex-col relative",
            selected ? "border-[var(--cre)] shadow-md" : "border-[var(--border)] hover:border-[var(--cre)]/30"
        )}>
            <div className="aspect-[9/16] bg-black relative cursor-pointer overflow-hidden" onClick={onPlay}>
                <img src={asset.thumbnailUrl} className="w-full h-full object-cover opacity-70 group-hover:scale-105 transition-all duration-500" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all bg-black/20">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20"><Play size={20} fill="white" /></div>
                </div>
                <button onClick={onSelect} className={cn("absolute top-3 right-3 w-5 h-5 rounded border border-white/40 flex items-center justify-center transition-all", selected ? "bg-[var(--cre)] border-transparent" : "bg-black/20")}>
                    {selected && <Check size={14} className="text-white" />}
                </button>
                <div className="absolute top-3 left-3 flex flex-col gap-1">
                    <span className="px-2 py-0.5 bg-white text-[var(--text-primary)] text-[8px] font-bold rounded shadow-sm border border-[var(--border)] uppercase">{asset.funnelStage}</span>
                    {asset.metaStatus && <span className="px-2 py-0.5 bg-[var(--cre)] text-white text-[8px] font-bold rounded shadow-sm uppercase">{asset.metaStatus}</span>}
                </div>
                <div className="absolute bottom-3 left-3">
                    <div className="bg-white/90 px-2 py-1 rounded border border-white/20 shadow-sm">
                        <span className="text-[10px] font-bold text-[var(--text-primary)]">{asset.score}%</span>
                    </div>
                </div>
            </div>
            <div className="p-2.5 space-y-1.5">
                <h4 className="text-[10px] font-bold text-[var(--text-primary)] uppercase truncate">{asset.nomenclatura}</h4>
                <div className="flex items-center justify-between text-[8px] font-bold uppercase text-[var(--text-tertiary)]">
                    <span>{asset.framework}</span>
                    <span className="text-[var(--cre)]">{asset.hookType}</span>
                </div>
            </div>
        </div>
    );
}

function AssetListRow({ asset, selected, onSelect, onPlay }: any) {
    return (
        <div className={cn(
            "flex items-center gap-4 px-4 py-2 bg-white border rounded-lg transition-all group",
            selected ? "border-[var(--cre)] shadow-sm bg-[var(--cre-bg)]/20" : "border-transparent hover:bg-[var(--bg)]"
        )}>
            <button onClick={onSelect} className={cn("w-4 h-4 rounded border flex items-center justify-center transition-all", selected ? "bg-[var(--cre)] border-transparent" : "border-[var(--border)]")}>
                {selected && <Check size={10} className="text-white" />}
            </button>
            <button onClick={onPlay} className="w-8 h-8 rounded-lg bg-[var(--text-primary)] flex items-center justify-center text-white"><Play size={14} fill="white" /></button>
            <div className="flex-1 truncate">
                <p className="text-[10px] font-bold text-[var(--text-primary)] uppercase truncate">{asset.nomenclatura}</p>
                <p className="text-[8px] font-medium text-[var(--text-tertiary)] uppercase">{asset.id}</p>
            </div>
            <div className="w-16 text-center text-[9px] font-bold text-gray-400 uppercase">{asset.funnelStage}</div>
            <div className="w-16 text-center text-[10px] font-bold text-[var(--inv)]">{(asset.revenue / asset.spend).toFixed(1)}x ROAS</div>
            <div className="w-12 text-center text-[10px] font-bold text-[var(--text-primary)]">{asset.score}%</div>
            <button className="p-1 hover:text-[var(--cre)] text-[var(--text-tertiary)] opacity-0 group-hover:opacity-100 transition-all"><MoreHorizontal size={14} /></button>
        </div>
    );
}

function AssetModal({ asset, onClose }: any) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
            <div className="relative w-full max-w-5xl bg-white rounded-xl shadow-lg overflow-hidden flex border border-white/20 animate-in zoom-in-95 h-full max-h-[600px]">
                <div className="flex-[3] bg-black relative flex items-center justify-center h-full">
                    <video src={asset.videoUrl} className="w-full h-full object-contain" controls autoPlay />
                    <button onClick={onClose} className="absolute top-4 left-4 w-8 h-8 rounded-lg bg-black/40 text-white flex items-center justify-center hover:bg-black/60"><X size={16} /></button>
                </div>
                <div className="flex-[2] p-8 flex flex-col h-full bg-white divide-y divide-[var(--border)]">
                    <div className="pb-6 space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 bg-[var(--s-ok)]/10 text-[var(--s-ok)] text-[8px] font-bold uppercase rounded border border-[var(--s-ok)]/10">{asset.funnelStage}</span>
                            <span className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase tracking-wide">{asset.date}</span>
                        </div>
                        <h4 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-tight leading-normal">{asset.nomenclatura}</h4>
                    </div>

                    <div className="py-6 grid grid-cols-2 gap-4">
                        <div className="p-3 bg-[var(--bg)]/40 rounded-lg border border-[var(--border)]">
                            <p className="text-[8px] font-bold text-[var(--text-tertiary)] uppercase mb-1">ROAS REAL</p>
                            <p className="text-lg font-bold text-[var(--inv)]">{(asset.revenue / asset.spend).toFixed(1)}x</p>
                        </div>
                        <div className="p-3 bg-[var(--bg)]/40 rounded-lg border border-[var(--border)]">
                            <p className="text-[8px] font-bold text-[var(--text-tertiary)] uppercase mb-1">CTR</p>
                            <p className="text-lg font-bold text-[var(--text-primary)]">{asset.ctr}%</p>
                        </div>
                        <div className="p-3 bg-[var(--bg)]/40 rounded-lg border border-[var(--border)]">
                            <p className="text-[8px] font-bold text-[var(--text-tertiary)] uppercase mb-1">SCORE IA</p>
                            <p className="text-lg font-bold text-[var(--cre)]">{asset.score}%</p>
                        </div>
                        <div className="p-3 bg-[var(--bg)]/40 rounded-lg border border-[var(--border)]">
                            <p className="text-[8px] font-bold text-[var(--text-tertiary)] uppercase mb-1">HOOK RATE</p>
                            <p className="text-lg font-bold text-[var(--text-primary)]">{asset.metrics?.hookRate}%</p>
                        </div>
                    </div>

                    <div className="pt-6 mt-auto space-y-4">
                        <div className="grid grid-cols-2 gap-2">
                            <button className="h-9 rounded-lg bg-[var(--cre)] text-white text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm"><Sparkles size={14} /> VARIACIÓN</button>
                            <button className="h-9 rounded-lg border border-[var(--border)] text-[var(--text-primary)] text-[10px] font-bold uppercase flex items-center justify-center gap-2"><Copy size={14} /> CLONAR</button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <button className="h-8 rounded-lg border border-[var(--border)] text-[var(--text-tertiary)] hover:text-[var(--s-ok)] hover:bg-[var(--s-ok)]/5 hover:border-[var(--s-ok)]/20 transition-all flex flex-col items-center justify-center gap-0.5 shadow-sm"><Check size={12} /><span className="text-[7px] font-bold uppercase">Aprobar</span></button>
                            <button className="h-8 rounded-lg border border-[var(--border)] text-[var(--text-tertiary)] hover:text-[var(--cre)] hover:bg-[var(--cre-bg)]/30 hover:border-[var(--cre)]/20 transition-all flex flex-col items-center justify-center gap-0.5 shadow-sm"><Download size={12} /><span className="text-[7px] font-bold uppercase">Bajada</span></button>
                            <button className="h-8 rounded-lg border border-[var(--border)] text-[var(--text-tertiary)] hover:text-[var(--s-ko)] hover:bg-[var(--s-ko)]/5 hover:border-[var(--s-ko)]/20 transition-all flex flex-col items-center justify-center gap-0.5 shadow-sm"><Trash2 size={12} /><span className="text-[7px] font-bold uppercase">Borrar</span></button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
