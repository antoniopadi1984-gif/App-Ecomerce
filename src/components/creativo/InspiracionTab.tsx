'use client';

import React, { useState, useEffect } from 'react';
import {
    Search, Plus, Sparkles, Filter, Download, Copy, Trash2,
    Zap, RefreshCw, Layers, Smile, Target, Briefcase,
    Video, Image as ImageIcon, ExternalLink, X, Info, Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function InspiracionTab({ storeId, productId, externalSearch }: { storeId: string, productId: string, externalSearch?: string }) {
    const [assets, setAssets] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [importUrl, setImportUrl] = useState('');
    const [selectedAsset, setSelectedAsset] = useState<any>(null);

    // Filters
    const [filterSector, setFilterSector] = useState('Todos');
    const [filterHook, setFilterHook] = useState('Todos');
    const [filterEmotion, setFilterEmotion] = useState('Todos');

    useEffect(() => {
        if (!productId || productId === 'GLOBAL') return;
        fetchAssets();
    }, [productId, storeId]);

    const fetchAssets = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/inspiration?productId=${productId}`, { headers: { 'X-Store-Id': storeId } });
            const data = await res.json();
            setAssets(data.assets ?? []);
        } catch (e) {
            toast.error("Error al cargar inspiración");
        } finally {
            setLoading(false);
        }
    };

    const handleImportUrl = async () => {
        if (!importUrl) return;
        setLoading(true);
        toast.info("Importando referencia y analizando hook...");

        try {
            const res = await fetch('/api/inspiration', {
                method: 'POST',
                headers: { 'X-Store-Id': storeId, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: importUrl,
                    productId,
                    type: importUrl.includes('tiktok') || importUrl.includes('youtube') || importUrl.includes('instagram') ? 'VIDEO' : 'IMAGE'
                })
            });
            const data = await res.json();
            if (data.ok) {
                toast.success("Inspiración guardada y etiquetada por AI");
                setImportUrl('');
                fetchAssets();
            }
        } catch (e) {
            toast.error("Error al importar");
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = () => {
        toast.info("Simulando subida de archivo...");
    };

    const filteredAssets = assets.filter(a => {
        if (filterSector !== 'Todos' && a.sector !== filterSector) return false;
        if (filterHook !== 'Todos' && a.hookType !== filterHook) return false;
        if (filterEmotion !== 'Todos' && a.emotion !== filterEmotion) return false;
        if (externalSearch && !a.label?.toLowerCase().includes(externalSearch.toLowerCase())) return false;
        return true;
    });

    const sectors = ['Todos', ...Array.from(new Set(assets.map(a => a.sector).filter(Boolean)))];
    const hooks = ['Todos', ...Array.from(new Set(assets.map(a => a.hookType).filter(Boolean)))];
    const emotions = ['Todos', ...Array.from(new Set(assets.map(a => a.emotion).filter(Boolean)))];

    return (
        <div className="space-y-6">
            {/* Import Area */}
            <div className="p-4 border border-[var(--border)] bg-white rounded-xl shadow-sm">
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--text-primary)]">Inspiration Swipe File</h2>
                            <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest mt-0.5">Referencias creativas externas para modelar estructuras</p>
                        </div>
                        <button
                            onClick={handleUpload}
                            className="h-8 px-3 border border-dashed border-[var(--border)] text-[var(--text-tertiary)] rounded-lg text-[10px] font-bold uppercase tracking-widest hover:border-[var(--cre)] hover:text-[var(--cre)] transition-all flex items-center gap-2"
                        >
                            <Plus size={14} /> Subir Asset
                        </button>
                    </div>

                    <div className="flex gap-2">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
                            <input
                                value={importUrl}
                                onChange={(e) => setImportUrl(e.target.value)}
                                placeholder="URL de TikTok, Instagram, Youtube..."
                                className="w-full h-10 pl-10 pr-4 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-xs font-semibold focus:border-[var(--cre)]/30 outline-none transition-all placeholder:text-[var(--text-tertiary)]"
                            />
                        </div>
                        <button
                            onClick={handleImportUrl}
                            disabled={loading || !importUrl}
                            className="px-4 h-10 bg-[var(--cre)] text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2 shadow-sm shadow-[var(--cre)]/10"
                        >
                            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            Añadir
                        </button>
                    </div>
                </div>
            </div>

            {/* Filters Toolbar */}
            <div className="flex items-center gap-4 py-2 overflow-x-auto no-scrollbar">
                <FilterIcon label="Sector" icon={Briefcase} value={filterSector} onChange={setFilterSector} options={sectors} />
                <FilterIcon label="Tipo de Hook" icon={Target} value={filterHook} onChange={setFilterHook} options={hooks} />
                <FilterIcon label="Emoción" icon={Smile} value={filterEmotion} onChange={setFilterEmotion} options={emotions} />
            </div>

            {/* Assets Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-8">
                {filteredAssets.map(asset => (
                    <InspirationCard key={asset.id} asset={asset} onClick={() => setSelectedAsset(asset)} />
                ))}
                {filteredAssets.length === 0 && (
                    <div className="col-span-full py-16 flex flex-col items-center justify-center text-center bg-[var(--bg)] rounded-xl border border-dashed border-[var(--border)]">
                        <Layers className="w-10 h-10 text-[var(--text-tertiary)] mb-3 opacity-30" />
                        <h3 className="text-[11px] font-bold text-[var(--text-tertiary)]">Sin inspiración guardada</h3>
                        <p className="text-[10px] text-[var(--text-tertiary)] mt-1 uppercase tracking-widest font-bold">Empieza a añadir referencias para alimentar tu Swipe File</p>
                    </div>
                )}
            </div>

            {/* Analysis Panel Overlay */}
            {selectedAsset && (
                <AnalysisPanel asset={selectedAsset} onClose={() => setSelectedAsset(null)} />
            )}
        </div>
    );
}

function FilterIcon({ label, icon: Icon, value, onChange, options }: any) {
    return (
        <div className="flex items-center gap-3 bg-white border border-[var(--border)] p-2 pr-4 rounded-lg shrink-0 shadow-sm hover:border-[var(--cre)]/30 transition-all cursor-pointer group">
            <div className="w-8 h-8 rounded-lg bg-[var(--bg)] flex items-center justify-center text-[var(--text-tertiary)] group-hover:text-[var(--cre)] transition-all">
                <Icon size={14} />
            </div>
            <div className="flex flex-col">
                <span className="text-[8px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest leading-none mb-1">{label}</span>
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="text-[10px] font-bold text-[var(--text-primary)] bg-transparent outline-none cursor-pointer"
                >
                    {options.map((opt: any) => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
            </div>
        </div>
    );
}

function InspirationCard({ asset, onClick }: { asset: any, onClick: () => void }) {
    return (
        <div
            onClick={onClick}
            className="bg-white border border-[var(--border)] p-0 overflow-hidden hover:border-[var(--cre)]/50 transition-all cursor-pointer group flex flex-col rounded-xl shadow-sm"
        >
            <div className="aspect-[3/4] bg-[var(--bg)] relative overflow-hidden">
                {asset.thumbnailUrl ? (
                    <img src={asset.thumbnailUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Ref" />
                ) : (
                    <div className="h-full flex items-center justify-center text-[var(--text-tertiary)] bg-black/5">
                        {asset.type === 'VIDEO' ? <Video size={24} className="opacity-20" /> : <ImageIcon size={24} className="opacity-20" />}
                    </div>
                )}

                {/* Platform Badge */}
                <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-md text-white text-[7px] font-bold uppercase tracking-widest">
                    {asset.sourcePlatform}
                </div>

                {/* Tags Layer */}
                <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-1">
                    {asset.hookType && (
                        <span className="px-1.5 py-0.5 rounded bg-[var(--cre)] text-white text-[7px] font-bold uppercase tracking-widest shadow-lg shadow-[var(--cre)]/20">
                            {asset.hookType}
                        </span>
                    )}
                </div>
            </div>

            <div className="p-3 space-y-1.5">
                <p className="text-[10px] font-bold text-[var(--text-primary)] uppercase truncate">
                    {asset.label}
                </p>
                <div className="flex items-center justify-between">
                    <span className="text-[8px] font-bold text-[var(--text-tertiary)] uppercase">{asset.sector || 'Multi-sector'}</span>
                    <div className="flex items-center gap-1 text-[var(--text-tertiary)]">
                        <Smile size={10} className={cn(asset.emotion && "text-[var(--cre)]")} />
                        <span className="text-[8px] font-bold">{asset.emotion || 'N/A'}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function AnalysisPanel({ asset, onClose }: { asset: any, onClose: () => void }) {
    const analysis = asset.analysisJson ? JSON.parse(asset.analysisJson) : null;

    return (
        <div className="fixed inset-y-0 right-0 w-[420px] bg-white border-l border-[var(--border)] shadow-md z-[60] animate-in slide-in-from-right duration-300 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)] bg-[var(--bg)]">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[var(--cre)] flex items-center justify-center text-white">
                        <Sparkles size={16} />
                    </div>
                    <div>
                        <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--text-primary)]">Inspiración AI</h2>
                        <p className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">{asset.sourcePlatform} • {asset.type}</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-[var(--bg)] rounded-full transition-colors font-bold text-[var(--text-tertiary)]">✕</button>
            </div>

            <div className="flex-1 overflow-auto p-6 space-y-8">
                {/* Visual Preview */}
                <div className="aspect-[9/16] bg-black rounded-xl overflow-hidden shadow-md border border-[var(--border)] relative group">
                    {/* Simulated Player */}
                    <div className="absolute inset-0 flex items-center justify-center group-hover:bg-black/10 transition-colors">
                        <Zap size={40} className="text-white opacity-20 group-hover:opacity-40 transition-opacity" />
                    </div>
                </div>

                {/* Semantic Analysis */}
                <div className="space-y-4">
                    <div className="p-4 bg-[var(--cre-bg)] rounded-xl border border-[var(--cre)]/10 space-y-2">
                        <div className="flex items-center gap-2 text-[var(--cre)]">
                            <Info size={14} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Análisis Estratégico</span>
                        </div>
                        <p className="text-[11px] text-[var(--text-primary)] font-medium leading-relaxed italic">
                            "{asset.semanticDesc || "Analizando el contenido visual para generar descripción..."}"
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <AnalysisMetric label="Sector" value={asset.sector} icon={Briefcase} />
                        <AnalysisMetric label="Tipo de Hook" value={asset.hookType} icon={Target} />
                        <AnalysisMetric label="Emoción" value={asset.emotion} icon={Smile} />
                        <AnalysisMetric label="Red" value={asset.sourcePlatform} icon={Globe} />
                    </div>
                </div>

                {/* Dynamic Insights from AnalysisJson */}
                {analysis && (
                    <div className="p-4 bg-[var(--text-primary)] text-white border-none rounded-xl space-y-3 shadow-lg">
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--cre)] flex items-center gap-2">
                            <Zap size={14} /> ¿Cómo modelarlo?
                        </h3>
                        <p className="text-[11px] font-medium leading-relaxed text-white/80">
                            Estructura de <b>{asset.hookType}</b> con emoción <b>{asset.emotion}</b>. Ideal para replicar adaptando el contexto visual.
                        </p>
                        <div className="h-px bg-white/10" />
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <p className="text-[8px] font-bold text-white/40 uppercase mb-0.5">Timing</p>
                                <p className="text-[10px] font-bold">12-15s</p>
                            </div>
                            <div className="flex-1">
                                <p className="text-[8px] font-bold text-white/40 uppercase mb-0.5">Dificultad</p>
                                <p className="text-[10px] font-bold">Media</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-[var(--border)] bg-[var(--bg)] grid grid-cols-2 gap-3">
                <button className="h-10 bg-white border border-[var(--border)] text-[var(--text-primary)] rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-[var(--bg)] transition-all flex items-center justify-center gap-2">
                    <ExternalLink size={14} /> Original
                </button>
                <button className="h-10 bg-[var(--text-primary)] text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-sm">
                    <Download size={14} /> Guardar
                </button>
            </div>
        </div>
    );
}

function AnalysisMetric({ label, value, icon: Icon }: any) {
    return (
        <div className="p-3 bg-white border border-[var(--border)] rounded-xl flex flex-col gap-2 shadow-sm hover:border-[var(--cre)]/20 transition-all">
            <div className="w-7 h-7 rounded-lg bg-[var(--bg)] flex items-center justify-center text-[var(--text-tertiary)]">
                <Icon size={12} />
            </div>
            <div>
                <p className="text-[8px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest mb-0.5">{label}</p>
                <p className="text-[10px] font-bold text-[var(--text-primary)] uppercase truncate">{value || '---'}</p>
            </div>
        </div>
    );
}
