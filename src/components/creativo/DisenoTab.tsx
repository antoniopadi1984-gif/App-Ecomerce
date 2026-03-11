'use client';

import React, { useState, useEffect } from 'react';
import {
    Layout, Search, Plus, Globe, Monitor, Smartphone,
    CheckCircle2, AlertCircle, Wand2, ArrowRight,
    Loader2, ExternalLink, Eye, BarChart3,
    ArrowUpRight, Info, Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProduct } from '@/context/ProductContext';
import { toast } from 'sonner';

interface LandingAsset {
    type: 'image' | 'video' | 'gif';
    url: string;
    name: string;
}

interface LandingAnalysis {
    id: string;
    name: string;
    url: string;
    screenshot?: string;
    assets: LandingAsset[];
    assetCount: number;
    structure: string[];
    productCount: number;
    productsFound: string[];
    scores?: {
        hook: number;
        mechanism: number;
        offer: number;
    };
    criticalPoints?: string[];
    recommendations?: string[];
    createdAt: string;
}

export function DisenoTab({ storeId, productId }: { storeId: string, productId: string }) {
    const { product } = useProduct();
    const [activeTab, setActiveTab] = useState<'visual' | 'analysis' | 'assets'>('visual');
    const [landings, setLandings] = useState<LandingAnalysis[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [newUrl, setNewUrl] = useState('');
    const [loading, setLoading] = useState(true);

    const activeLanding = landings.find(l => l.id === selectedId) || landings[0];

    useEffect(() => {
        fetchLandings();
    }, [productId]);

    const fetchLandings = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/centro-creativo/diseno/landings?productId=${productId}`);
            const data = await res.json();
            if (data.success) {
                setLandings(data.landings);
                if (data.landings.length > 0 && !selectedId) {
                    setSelectedId(data.landings[0].id);
                }
            }
        } catch (e) {
            console.error('Error fetching landings', e);
        } finally {
            setLoading(false);
        }
    };

    const handleAnalyze = async () => {
        if (!newUrl.trim()) return;
        setIsAnalyzing(true);
        const tid = toast.loading("Analizando landing con IA...");

        try {
            const res = await fetch('/api/centro-creativo/diseno/analizar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: newUrl, storeId, productId })
            });
            const data = await res.json();

            if (data.success) {
                toast.success("Análisis completado", { id: tid });
                setNewUrl('');
                fetchLandings();
            } else {
                toast.error(data.error || "Error al analizar", { id: tid });
            }
        } catch (e) {
            toast.error("Error de conexión", { id: tid });
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="flex h-[calc(100vh-140px)] gap-4 animate-in fade-in duration-500">
            {/* SIDEBAR: Lista de Landings */}
            <aside className="w-[320px] flex flex-col bg-white border border-[var(--border)] rounded-xl overflow-hidden shrink-0 shadow-sm">
                <div className="p-4 border-b border-[var(--border)] bg-slate-50/50">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--cre)]" />
                        <span className="text-[10px] font-bold text-[var(--cre)] uppercase tracking-widest px-2 py-0.5 bg-[var(--cre)]/10 rounded">Landings Activas</span>
                    </div>

                    <div className="space-y-2">
                        <div className="relative group">
                            <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] group-focus-within:text-[var(--cre)] transition-colors" />
                            <input
                                type="text"
                                value={newUrl}
                                onChange={(e) => setNewUrl(e.target.value)}
                                placeholder="URL de la competencia..."
                                className="w-full pl-9 pr-3 h-9 bg-white border border-[var(--border)] rounded-lg text-xs font-semibold focus:border-[var(--cre)]/50 focus:ring-2 focus:ring-[var(--cre)]/10 outline-none transition-all"
                            />
                        </div>
                        <button
                            onClick={handleAnalyze}
                            disabled={isAnalyzing || !newUrl}
                            className="w-full h-9 rounded-lg bg-[var(--cre)] text-white text-[11px] font-bold uppercase flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none shadow-sm shadow-[var(--cre)]/20"
                        >
                            {isAnalyzing ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                            Analizar con IA
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar bg-slate-50/30">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 size={24} className="text-[var(--cre)]/20 animate-spin" />
                        </div>
                    ) : landings.length === 0 ? (
                        <div className="py-20 text-center px-4">
                            <Layout size={32} className="mx-auto text-[var(--text-tertiary)] opacity-20 mb-3" />
                            <p className="text-[10px] text-[var(--text-tertiary)] uppercase font-bold tracking-widest leading-relaxed">
                                No hay landings analizadas.<br />Pega una URL arriba para empezar.
                            </p>
                        </div>
                    ) : (
                        landings.map((l) => (
                            <div
                                key={l.id}
                                onClick={() => setSelectedId(l.id)}
                                className={cn(
                                    "p-3 rounded-xl border transition-all cursor-pointer group relative",
                                    selectedId === l.id
                                        ? "bg-white border-[var(--cre)] shadow-md ring-1 ring-[var(--cre)]/10"
                                        : "bg-white border-transparent hover:border-[var(--border)] hover:bg-white hover:shadow-sm"
                                )}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                                        {l.screenshot ? (
                                            <img src={l.screenshot} className="w-full h-full object-cover" alt="" />
                                        ) : (
                                            <Globe size={16} className="text-slate-400" />
                                        )}
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[9px] font-mono text-slate-400">{new Date(l.createdAt).toLocaleDateString()}</span>
                                        {l.scores && (
                                            <div className="flex items-center gap-1 mt-1">
                                                <div className="w-1.5 h-1.5 rounded-full bg-[var(--cre)]" />
                                                <span className="text-[10px] font-black text-[var(--cre)]">{l.scores.hook}% Hook</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <h3 className="text-[12px] font-bold text-[var(--text-primary)] truncate group-hover:text-[var(--cre)] transition-colors pr-4">
                                    {l.name || new URL(l.url).hostname}
                                </h3>
                                <div className="flex items-center gap-1.5 mt-1 text-[9px] text-[var(--text-tertiary)] font-bold truncate">
                                    <ExternalLink size={10} />
                                    {l.url}
                                </div>
                                {selectedId === l.id && (
                                    <ArrowRight size={14} className="absolute right-3 bottom-3 text-[var(--cre)]" />
                                )}
                            </div>
                        ))
                    )}
                </div>
            </aside>

            {/* MAIN AREA: Visualizador & Análisis */}
            <main className="flex-1 flex flex-col bg-white border border-[var(--border)] rounded-xl overflow-hidden shadow-sm relative">
                {!activeLanding ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                        <div className="w-16 h-16 rounded-2xl bg-[var(--cre-bg)] flex items-center justify-center mb-6">
                            <Layout className="w-8 h-8 text-[var(--cre)] opacity-40" />
                        </div>
                        <h2 className="text-[18px] font-bold text-[var(--text-primary)]">Diseño & Conversión</h2>
                        <p className="text-[12px] text-[var(--text-tertiary)] mt-2 max-w-[320px]">
                            Selecciona una landing de la lista o introduce una nueva URL para recibir un análisis de IA Pro sobre su potencial de conversión.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="h-10 border-b border-[var(--border)] bg-white px-6 flex items-center justify-between shrink-0">
                            <div className="flex gap-6 h-full">
                                <button
                                    onClick={() => setActiveTab('visual')}
                                    className={cn(
                                        "h-full text-[11px] font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-2",
                                        activeTab === 'visual' ? "border-[var(--cre)] text-[var(--cre)]" : "border-transparent text-slate-400 hover:text-slate-600"
                                    )}
                                >
                                    <Eye size={14} />
                                    Visual
                                </button>
                                <button
                                    onClick={() => setActiveTab('analysis')}
                                    className={cn(
                                        "h-full text-[11px] font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-2",
                                        activeTab === 'analysis' ? "border-[var(--cre)] text-[var(--cre)]" : "border-transparent text-slate-400 hover:text-slate-600"
                                    )}
                                >
                                    <BarChart3 size={14} />
                                    Análisis IA
                                </button>
                                <button
                                    onClick={() => setActiveTab('assets')}
                                    className={cn(
                                        "h-full text-[11px] font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-2",
                                        activeTab === 'assets' ? "border-[var(--cre)] text-[var(--cre)]" : "border-transparent text-slate-400 hover:text-slate-600"
                                    )}
                                >
                                    <Sparkles size={14} />
                                    Recursos Extraídos
                                    {activeLanding.assetCount > 0 && (
                                        <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-[var(--cre)] text-white text-[8px] leading-none">{activeLanding.assetCount}</span>
                                    )}
                                </button>
                            </div>

                            <div className="flex items-center gap-4">
                                <a
                                    href={activeLanding.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 hover:text-[var(--cre)] transition-all"
                                >
                                    Visitar URL <ExternalLink size={12} />
                                </a>
                            </div>
                        </div>

                        <div className="flex-1 overflow-hidden bg-slate-100/50">
                            {activeTab === 'visual' ? (
                                <div className="w-full h-full flex flex-col p-6">
                                    <div className="flex-1 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden relative group">
                                        <div className="h-7 bg-slate-50 border-b border-slate-200 flex items-center px-3 gap-1.5">
                                            <div className="w-2.5 h-2.5 rounded-full bg-red-400/50" />
                                            <div className="w-2.5 h-2.5 rounded-full bg-amber-400/50" />
                                            <div className="w-2.5 h-2.5 rounded-full bg-green-400/50" />
                                            <div className="ml-4 flex-1 h-4 bg-white rounded border border-slate-200 flex items-center px-2">
                                                <span className="text-[9px] text-slate-400 font-mono truncate">{activeLanding.url}</span>
                                            </div>
                                        </div>
                                        <div className="absolute inset-0 top-7 flex flex-col items-center justify-center p-8 text-center text-slate-400 -z-10">
                                            <AlertCircle size={24} className="mb-2 opacity-50" />
                                            <p className="text-[11px] font-bold">Si la página rechaza la conexión, usa el botón "Visitar URL" o revisa la pestaña "Recursos Extraídos".</p>
                                        </div>
                                        <iframe
                                            src={activeLanding.url}
                                            className="w-full h-full border-none bg-transparent"
                                            title="Landing Preview"
                                        />
                                        <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform bg-gradient-to-t from-black/60 to-transparent">
                                            <div className="flex justify-center gap-2">
                                                <button className="px-3 py-1 bg-white rounded-full text-[10px] font-bold flex items-center gap-1 shadow-md hover:scale-105 transition-all">
                                                    <Smartphone size={12} /> Mobile View
                                                </button>
                                                <button className="px-3 py-1 bg-white rounded-full text-[10px] font-bold flex items-center gap-1 shadow-md hover:scale-105 transition-all">
                                                    <Monitor size={12} /> Desktop View
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : activeTab === 'analysis' ? (
                                <div className="p-6 h-full overflow-y-auto custom-scrollbar">
                                    <div className="grid grid-cols-12 gap-6">
                                        {/* SCORING CARDS */}
                                        <div className="col-span-12 lg:col-span-4 grid grid-cols-1 gap-4">
                                            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
                                                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform" />
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className="p-2 bg-orange-500/10 rounded-lg text-orange-600">
                                                        <Search size={18} />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Atención (Hook)</h4>
                                                        <div className="flex items-baseline gap-1">
                                                            <span className="text-[28px] font-black text-slate-800 leading-none">{activeLanding.scores?.hook || 0}</span>
                                                            <span className="text-[14px] font-bold text-slate-400">/100</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-orange-500 rounded-full" style={{ width: `${activeLanding.scores?.hook || 0}%` }} />
                                                </div>
                                                <p className="text-[9px] text-slate-400 mt-2 font-medium">Capacidad de capturar atención en el primer impacto y el Hero Section.</p>
                                            </div>

                                            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
                                                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform" />
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-600">
                                                        <Wand2 size={18} />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mecanismo Único</h4>
                                                        <div className="flex items-baseline gap-1">
                                                            <span className="text-[28px] font-black text-slate-800 leading-none">{activeLanding.scores?.mechanism || 0}</span>
                                                            <span className="text-[14px] font-bold text-slate-400">/100</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${activeLanding.scores?.mechanism || 0}%` }} />
                                                </div>
                                                <p className="text-[9px] text-slate-400 mt-2 font-medium">Claridad en explicar "por qué esto funciona" frente a la competencia.</p>
                                            </div>

                                            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-5 rounded-2xl shadow-xl relative overflow-hidden group">
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--cre)]/10 rounded-full -mr-16 -mt-16 animate-pulse" />
                                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Oferta & Productos</h4>
                                                <div className="flex items-baseline gap-2 mb-2">
                                                    <span className="text-[36px] font-black text-[var(--cre)] leading-none">{activeLanding.scores?.offer || 0}</span>
                                                    <span className="text-[14px] font-bold text-slate-400">/100</span>
                                                </div>
                                                <div className="mt-2 bg-slate-800/50 rounded-lg p-2 border border-slate-700">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Catálogo</span>
                                                        <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500 text-[9px] font-black">{activeLanding.productCount} extraídos</span>
                                                    </div>
                                                    <p className="text-[9px] text-slate-300 truncate">
                                                        {activeLanding.productsFound?.join(', ') || 'Sin clasificar'}
                                                    </p>
                                                </div>
                                                <p className="text-[9px] text-slate-500 mt-3 font-medium uppercase tracking-tight">Evaluación de urgencia, valor percibido e irresistibilidad.</p>
                                            </div>
                                        </div>

                                        {/* DETAILED ANALYSIS TABLE/LISTS */}
                                        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
                                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                                    <div className="flex items-center gap-2">
                                                        <AlertCircle size={14} className="text-amber-500" />
                                                        <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Puntos Críticos (Fricción)</h4>
                                                    </div>
                                                    <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-[9px] font-black uppercase">Urgente</span>
                                                </div>
                                                <div className="p-4 space-y-3">
                                                    {activeLanding.criticalPoints?.map((pt, i) => (
                                                        <div key={i} className="flex gap-3 items-start p-3 bg-red-50/30 rounded-xl border border-red-100/50">
                                                            <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                                                                <span className="text-[10px] font-black text-red-600">!</span>
                                                            </div>
                                                            <p className="text-[11px] text-slate-700 leading-relaxed">{pt}</p>
                                                        </div>
                                                    )) || <p className="text-[10px] text-slate-400 p-4 text-center">No se detectaron puntos críticos.</p>}
                                                </div>
                                            </div>

                                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-green-50/20">
                                                    <div className="flex items-center gap-2">
                                                        <Sparkles size={14} className="text-green-500" />
                                                        <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Recomendaciones IA Pro</h4>
                                                    </div>
                                                    <Wand2 size={12} className="text-green-500 animate-pulse" />
                                                </div>
                                                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {activeLanding.recommendations?.map((rec, i) => (
                                                        <div key={i} className="flex gap-3 items-start p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-green-200 transition-colors">
                                                            <CheckCircle2 size={14} className="text-green-500 shrink-0 mt-0.5" />
                                                            <p className="text-[11px] text-slate-700 leading-relaxed font-medium">{rec}</p>
                                                        </div>
                                                    )) || <p className="text-[10px] text-slate-400 p-4 text-center">No hay recomendaciones disponibles.</p>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : activeTab === 'assets' ? (
                                <div className="p-6 h-full overflow-y-auto custom-scrollbar">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        <div className="col-span-full">
                                            <h3 className="text-[14px] font-black text-slate-800 uppercase tracking-widest mb-1 flex items-center gap-2">
                                                <Sparkles size={16} className="text-[var(--cre)]" />
                                                Multimedia Extraída
                                            </h3>
                                            <p className="text-[11px] text-slate-500 font-medium">Imágenes, GIFs y vídeos extraídos directamente del DOM de la competencia.</p>
                                        </div>
                                        
                                        {activeLanding.assets && activeLanding.assets.length > 0 ? activeLanding.assets.map((asset, i) => (
                                            <div key={i} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col group hover:border-[var(--cre)] transition-colors">
                                                <div className="h-40 bg-slate-100 relative flex items-center justify-center overflow-hidden">
                                                    {asset.type === 'video' ? (
                                                        <div className="absolute inset-0 flex items-center justify-center group-hover:bg-black/10 transition-colors z-10 w-full h-full bg-slate-200">
                                                             <span className="text-[10px] font-black bg-black text-white px-2 py-1 rounded">VIDEO</span>
                                                        </div>
                                                    ) : (
                                                        <img src={asset.url} alt={asset.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                                                    )}
                                                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-white/90 shadow text-slate-700">
                                                        {asset.type}
                                                    </span>
                                                </div>
                                                <div className="p-3 border-t border-slate-100 flex flex-col justify-between flex-1">
                                                    <p className="text-[10px] font-bold text-slate-700 truncate mb-2" title={asset.name || asset.url.split('/').pop()}>{asset.name || asset.url.split('/').pop() || 'Asset sin nombre'}</p>
                                                    <a href={asset.url} target="_blank" rel="noopener noreferrer" className="w-full py-1.5 bg-slate-50 border border-slate-200 rounded text-[9px] font-black text-slate-500 uppercase flex justify-center items-center gap-1 hover:bg-slate-100 hover:text-[var(--cre)] hover:border-[var(--cre)]/30 transition-all">
                                                        <ExternalLink size={10} /> Enlace directo
                                                    </a>
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="col-span-full py-20 text-center">
                                                <p className="text-[12px] text-slate-400 font-bold uppercase tracking-widest">No se detectaron recursos extraíbles explícitos.</p>
                                            </div>
                                        )}
                                        
                                        {activeLanding.structure && activeLanding.structure.length > 0 && (
                                            <div className="col-span-full mt-6">
                                                <h3 className="text-[14px] font-black text-slate-800 uppercase tracking-widest mb-4 border-t border-slate-200 pt-6">Estructura Copywriting y Layout Extraído</h3>
                                                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden text-[11px] text-slate-600 font-medium">
                                                    {activeLanding.structure.map((str, idx) => (
                                                        <div key={idx} className="p-4 border-b border-slate-100 flex gap-4 hover:bg-slate-50 last:border-0">
                                                            <div className="font-black text-[var(--cre)] opacity-50 shrink-0">0{idx + 1}</div>
                                                            <div>{str}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
