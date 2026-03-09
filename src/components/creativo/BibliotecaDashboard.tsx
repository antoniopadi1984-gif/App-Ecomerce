'use client';

import React, { useState, useEffect } from 'react';
import {
    Search, Filter, Calendar, BarChart3, List, Grid,
    ArrowUpDown, FolderOpen, Target, Sparkles, Eye,
    Clapperboard, MoreHorizontal, Download, Share2,
    Trash2, ExternalLink, RefreshCw, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BibliotecaTab } from './BibliotecaTab';
import { CompetenciaTab } from './CompetenciaTab';
import { InspiracionTab } from './InspiracionTab';
import { toast } from 'sonner';

interface SearchResult {
    id: string;
    category: string;
    label: string;
    semanticDescription?: string;
    thumbnailUrl?: string;
    type?: string;
    url?: string;
}

interface BibliotecaDashboardProps {
    storeId: string;
    productId: string;
}

const TABS = [
    { id: 'mis_creativos', label: 'Mis Creativos', icon: Clapperboard },
    { id: 'competencia', label: 'Competencia', icon: Eye },
    { id: 'inspiracion', label: 'Inspiración', icon: Sparkles },
];

export function BibliotecaDashboard({ storeId, productId }: BibliotecaDashboardProps) {
    const [activeTab, setActiveTab] = useState('mis_creativos');
    const [viewStyle, setViewStyle] = useState<'grid' | 'list'>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isShowingResults, setIsShowingResults] = useState(false);

    const handleSearch = async () => {
        if (searchQuery.length < 3) {
            setIsShowingResults(false);
            return;
        }
        setIsSearching(true);
        try {
            const res = await fetch('/api/library/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: searchQuery, productId, storeId })
            });
            const data = await res.json();
            if (data.results) {
                setSearchResults(data.results);
                setIsShowingResults(true);
            }
        } catch (e) {
            console.error("Search error:", e);
        } finally {
            setIsSearching(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery) handleSearch();
            else setIsShowingResults(false);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Filters State
    const [filters, setFilters] = useState({
        type: 'all',
        phase: 'all',
        concept: 'all',
        avatar: 'all',
        date: 'all',
        performance: 'all'
    });

    const [sortBy, setSortBy] = useState('date');

    return (
        <div className="flex flex-col gap-6 h-full min-h-screen pb-12">
            {/* TOOLBAR SUPERIOR (GLOBAL) */}
            <div className="bg-white p-4 flex flex-col gap-4 border border-[var(--border)] rounded-xl shadow-sm sticky top-0 z-40">
                <div className="flex items-center gap-3">
                    {/* Búsqueda Semántica */}
                    <div className="relative flex-1 group">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] group-focus-within:text-[var(--cre)] transition-colors" />
                        <input
                            type="text"
                            placeholder="Búsqueda semántica (ej: 'testimonios con gancho emocional')..."
                            className="w-full h-10 pl-11 pr-4 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-xs font-semibold focus:outline-none focus:border-[var(--cre)]/30 transition-all placeholder:text-[var(--text-tertiary)]"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                            <span className="text-[8px] font-bold uppercase tracking-widest text-[var(--text-tertiary)] bg-white px-2 py-0.5 rounded border border-[var(--border)] shadow-sm">AI Semantic</span>
                        </div>
                    </div>

                    {/* View Toggle */}
                    <div className="flex items-center p-1 bg-[var(--bg)] rounded-lg border border-[var(--border)]">
                        <button
                            onClick={() => setViewStyle('grid')}
                            className={cn(
                                "p-1.5 rounded-md transition-all",
                                viewStyle === 'grid' ? "bg-white text-[var(--cre)] shadow-sm" : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                            )}
                        >
                            <Grid size={16} />
                        </button>
                        <button
                            onClick={() => setViewStyle('list')}
                            className={cn(
                                "p-1.5 rounded-md transition-all",
                                viewStyle === 'list' ? "bg-white text-[var(--cre)] shadow-sm" : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                            )}
                        >
                            <List size={16} />
                        </button>
                    </div>

                    {/* Filter Toggle */}
                    <button
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        className={cn(
                            "h-10 px-4 rounded-lg font-bold uppercase text-[10px] tracking-widest flex items-center gap-2 transition-all",
                            isFilterOpen ? "bg-[var(--text-primary)] text-white shadow-sm" : "bg-white border border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--cre)]/30"
                        )}
                    >
                        <Filter size={14} />
                        Filtros
                    </button>
                </div>

                {/* Second Row: Sorting + Tabs */}
                <div className="flex items-center justify-between border-b border-[var(--border)] bg-white px-4 -mx-4 -mb-4">
                    <div className="flex gap-0">
                        {TABS.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                data-active={activeTab === tab.id}
                                className={cn(
                                    "px-4 py-3 text-[10px] font-bold uppercase tracking-widest transition-all border-b-2 border-transparent text-[var(--text-tertiary)]",
                                    "data-[active=true]:border-[var(--cre)] data-[active=true]:text-[var(--cre)] hover:text-[var(--text-primary)]"
                                )}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 text-[var(--text-tertiary)]">
                            <ArrowUpDown size={12} className="text-[var(--text-tertiary)]" />
                            <span className="text-[9px] font-bold uppercase tracking-widest">Ordenar:</span>
                        </div>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="bg-transparent text-[10px] font-bold uppercase tracking-widest text-[var(--text-primary)] outline-none cursor-pointer"
                        >
                            <option value="date">Novedades</option>
                            <option value="ctr">CTR</option>
                            <option value="roas">ROAS</option>
                            <option value="score">Score</option>
                        </select>
                    </div>
                </div>

                {/* Quick Filters Row (Visible when isFilterOpen) */}
                {isFilterOpen && (
                    <div className="flex items-center gap-4 pt-2 animate-in slide-in-from-top-2 duration-300">
                        <div className="grid grid-cols-6 gap-3 w-full">
                            <FilterSelect label="Tipo" icon={Target} options={['Video', 'Estático', 'UGC', 'Ad Copy']} />
                            <FilterSelect label="Fase" icon={Target} options={['TOF (Frío)', 'MOF (Templado)', 'BOF (Caliente)', 'Retargeting']} />
                            <FilterSelect label="Concepto" icon={Target} options={['Dolor Agudo', 'Mecanismo Único', 'Storytelling', 'Unboxing']} />
                            <FilterSelect label="Avatar" icon={Target} options={['Todos', 'Laura', 'Carlos', 'Sofía']} />
                            <FilterSelect label="Fecha" icon={Calendar} options={['Hoy', 'Semana Actual', 'Mes Actual', 'Custom']} />
                            <FilterSelect label="Rendimiento" icon={BarChart3} options={['Top Performing (>2% CTR)', 'Scaling', 'Low Performance', 'Testing']} />
                        </div>
                    </div>
                )}
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 overflow-auto mt-4 px-1">
                {isShowingResults ? (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-12">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--cre)] flex items-center gap-2">
                                    <Sparkles size={14} /> Resultados AI Semánticos
                                </h3>
                                <p className="text-[9px] text-[var(--text-tertiary)] font-bold uppercase tracking-widest mt-0.5 ml-5">
                                    Filtrado por contenido visual y emocional
                                </p>
                            </div>
                            <button
                                onClick={() => { setSearchQuery(''); setIsShowingResults(false); }}
                                className="h-8 px-4 border border-[var(--border)] rounded-lg text-[10px] font-bold text-[var(--text-tertiary)] hover:text-[var(--text-primary)] uppercase transition-all"
                            >
                                Cerrar
                            </button>
                        </div>

                        {isSearching ? (
                            <div className="flex flex-col items-center justify-center p-20 bg-white border border-[var(--border)] rounded-xl shadow-sm">
                                <RefreshCw size={24} className="animate-spin text-[var(--cre)]/50 mb-4" />
                                <p className="text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">IA analizando biblioteca...</p>
                            </div>
                        ) : searchResults.length === 0 ? (
                            <div className="p-16 bg-[var(--bg)] border-dashed border border-[var(--border)] rounded-xl text-center flex flex-col items-center">
                                <Search size={24} className="text-[var(--text-tertiary)] mb-4 opacity-50" />
                                <p className="text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest leading-relaxed max-w-[300px]">
                                    No se encontraron activos para "{searchQuery}"
                                </p>
                                <button
                                    onClick={() => { setSearchQuery(''); setIsShowingResults(false); }}
                                    className="mt-6 text-[10px] font-bold text-[var(--cre)] uppercase underline underline-offset-4"
                                >
                                    Intentar otra búsqueda
                                </button>
                            </div>
                        ) : (
                            <div className={cn(
                                "grid gap-4",
                                viewStyle === 'grid' ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"
                            )}>
                                {searchResults.map(result => (
                                    <div key={result.id} className="p-4 bg-white border border-[var(--border)] rounded-xl shadow-sm hover:border-[var(--cre)]/40 transition-all cursor-pointer group flex flex-col h-full">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-9 h-9 rounded-lg bg-[var(--bg)] flex items-center justify-center text-[var(--text-tertiary)] transition-colors group-hover:bg-[var(--cre-bg)] group-hover:text-[var(--cre)]">
                                                {result.category === 'CREATIVE' ? <Clapperboard size={16} /> :
                                                    result.category === 'LANDING' ? <ExternalLink size={16} /> : <Target size={16} />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold uppercase truncate text-[var(--text-primary)]">{result.label}</p>
                                                <p className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">{result.category}</p>
                                            </div>
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                <ChevronRight size={14} className="text-[var(--cre)]" />
                                            </div>
                                        </div>

                                        <div className="flex-1">
                                            <div className="p-3 bg-[var(--bg)] rounded-lg border border-[var(--border)] mb-3">
                                                <p className="text-[10px] text-[var(--text-primary)] font-medium leading-relaxed italic line-clamp-3">
                                                    "{result.semanticDescription || 'Sin descripción semántica disponible.'}"
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-3 border-t border-[var(--border)] mt-auto">
                                            <span className="text-[8px] font-bold uppercase tracking-widest text-[var(--cre)]/70 flex items-center gap-1">
                                                <Sparkles size={10} /> Alta Relevancia
                                            </span>
                                            <button className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-tertiary)] hover:text-[var(--cre)] transition-colors">
                                                Detalles
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        {activeTab === 'mis_creativos' && (
                            <div className="animate-in fade-in duration-700">
                                <BibliotecaTab
                                    storeId={storeId}
                                    productId={productId}
                                />
                            </div>
                        )}

                        {activeTab === 'competencia' && (
                            <div className="animate-in fade-in duration-700">
                                <CompetenciaTab
                                    storeId={storeId}
                                    productId={productId}
                                    productSku={""} // Se asume vacío si no se recibe en props
                                />
                            </div>
                        )}

                        {activeTab === 'inspiracion' && (
                            <div className="animate-in fade-in duration-700">
                                <InspiracionTab
                                    storeId={storeId}
                                    productId={productId}
                                    externalSearch={searchQuery}
                                />
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

function FilterSelect({ label, icon: Icon, options }: { label: string, icon: any, options: string[] }) {
    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 px-1">
                <Icon size={12} className="text-[var(--text-tertiary)]" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-tertiary)]">{label}</span>
            </div>
            <select className="h-9 px-3 bg-white border border-[var(--border)] rounded-lg text-[10px] font-bold text-[var(--text-primary)] focus:border-[var(--cre)]/30 outline-none transition-all appearance-none cursor-pointer">
                <option value="all">Todas</option>
                {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
        </div>
    );
}
