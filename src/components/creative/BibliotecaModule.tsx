"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    Search, Filter, Clapperboard, Play, MoreVertical,
    BarChart3, TrendingUp, Sparkles, CheckCircle2,
    AlertCircle, Info, Download, Trash2, Edit3,
    Tag, Eye, Zap, Image as ImageIcon, Briefcase,
    ChevronDown, LayoutGrid, List, RefreshCw, Loader2,
    Check, X, Save
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
    getLibraryAssets,
    getLibraryFilterOptions,
    getAssetPerformance,
    bulkUpdateConcept,
    bulkUpdateStatus,
    bulkUpdateFunnelStage,
    renameAsset
} from "@/app/centro-creativo/biblioteca-actions";
import { CREATIVE_CONCEPTS, AUDIENCE_TYPES, AWARENESS_LEVELS } from "@/lib/creative/spencer-knowledge";
import { CreativeAgentPanel } from "@/components/creative/CreativeAgentPanel";

interface BibliotecaModuleProps {
    storeId: string;
    productId: string;
    productTitle?: string;
}

export function BibliotecaModule({ storeId, productId, productTitle }: BibliotecaModuleProps) {
    const [assets, setAssets] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
    const [search, setSearch] = useState("");

    // Filters
    const [conceptFilter, setConceptFilter] = useState<number | undefined>();
    const [audienceFilter, setAudienceFilter] = useState<string | undefined>();
    const [statusFilter, setStatusFilter] = useState<string | undefined>();
    const [typeFilter, setTypeFilter] = useState<'VIDEO' | 'IMAGE' | 'STATIC' | 'ALL'>('ALL');

    // Stats
    const [stats, setStats] = useState({
        total: 0,
        winners: 0,
        pending: 0,
        active: 0
    });

    const loadAssets = useCallback(async () => {
        setLoading(true);
        try {
            const result = await getLibraryAssets({
                storeId,
                productId,
                search,
                concept: conceptFilter,
                audienceType: audienceFilter,
                status: statusFilter,
                type: typeFilter,
                limit: 50
            });
            setAssets(result.assets);
            setTotal(result.total);

            // Calculate basic stats for display
            setStats({
                total: result.total,
                winners: result.assets.filter((a: any) => a.status === 'WINNER').length,
                pending: result.assets.filter((a: any) => a.status === 'PAUSADO').length,
                active: result.assets.filter((a: any) => a.status === 'ACTIVO').length
            });
        } catch (e) {
            console.error("Failed to load library assets:", e);
        }
        setLoading(false);
    }, [storeId, productId, search, conceptFilter, audienceFilter, statusFilter, typeFilter]);

    useEffect(() => {
        loadAssets();
    }, [loadAssets]);

    const toggleAssetSelection = (id: string) => {
        setSelectedAssets(prev =>
            prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
        );
    };

    const handleBulkStatus = async (status: string) => {
        if (selectedAssets.length === 0) return;
        const res = await bulkUpdateStatus(selectedAssets, status);
        if (res.success) {
            setSelectedAssets([]);
            loadAssets();
        }
    };

    return (
        <div className="grid grid-cols-12 gap-4 animate-in fade-in duration-500">
            {/* Sidebar Filters — C1-C7 Focused */}
            <div className="col-span-12 lg:col-span-3 space-y-4">
                <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden bg-white">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                            <Filter className="w-3 h-3" /> Filtros Creativos
                        </h3>
                    </div>
                    <ScrollArea className="h-[calc(100vh-320px)]">
                        <div className="p-4 space-y-6">
                            {/* Filter: Type */}
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest ml-1">Tipo de Activo</label>
                                <div className="grid grid-cols-2 gap-1.5">
                                    {[
                                        { id: 'ALL', label: 'Todos', icon: LayoutGrid },
                                        { id: 'VIDEO', label: 'Videos', icon: Play },
                                        { id: 'IMAGE', label: 'Imágenes', icon: ImageIcon },
                                        { id: 'STATIC', label: 'Contenido', icon: List }
                                    ].map((t: any) => (
                                        <button
                                            key={t.id}
                                            onClick={() => setTypeFilter(t.id)}
                                            className={cn(
                                                "flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-bold transition-all border",
                                                typeFilter === t.id
                                                    ? "bg-slate-900 text-white border-slate-900"
                                                    : "bg-white text-slate-600 border-slate-100 hover:border-slate-300"
                                            )}
                                        >
                                            <t.icon className="w-3 h-3" />
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Filter: C1-C7 Concept */}
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest ml-1">Concepto C1-C7</label>
                                <div className="space-y-1.5">
                                    {CREATIVE_CONCEPTS.map(c => (
                                        <button
                                            key={c.id}
                                            onClick={() => setConceptFilter(conceptFilter === c.id ? undefined : c.id)}
                                            className={cn(
                                                "w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all border",
                                                conceptFilter === c.id
                                                    ? "bg-purple-600 text-white border-purple-600"
                                                    : "bg-white text-slate-600 border-slate-100 hover:border-purple-300"
                                            )}
                                        >
                                            <span>{c.code} {c.name}</span>
                                            {conceptFilter === c.id && <Check className="w-3 h-3" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Filter: Audience */}
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest ml-1">Audiencia / Awareness</label>
                                <div className="space-y-1.5">
                                    {AUDIENCE_TYPES.map(a => (
                                        <button
                                            key={a.id}
                                            onClick={() => setAudienceFilter(audienceFilter === a.id ? undefined : a.id)}
                                            className={cn(
                                                "w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all border",
                                                audienceFilter === a.id
                                                    ? "bg-blue-600 text-white border-blue-600"
                                                    : "bg-white text-slate-600 border-slate-100 hover:border-blue-300"
                                            )}
                                        >
                                            <span>{a.label}</span>
                                            {audienceFilter === a.id && <Check className="w-3 h-3" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </ScrollArea>
                </Card>

                {/* Library IA Agent */}
                <CreativeAgentPanel
                    storeId={storeId}
                    productId={productId}
                    productTitle={productTitle}
                    agentRole="LIBRARY_AGENT"
                    agentName="Curador de Biblioteca IA"
                    initialPrompt="Analiza los nombres y conceptos de mis creativos para sugerir nuevas variantes o detectar redundancias."
                />
            </div>

            {/* Main Content */}
            <div className="col-span-12 lg:col-span-9 space-y-4">
                {/* Search & Actions Bar */}
                <Card className="rounded-2xl border-slate-200 shadow-sm bg-white p-2">
                    <div className="flex flex-col md:flex-row items-center gap-3">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-rose-500 transition-colors" />
                            <Input
                                placeholder="Buscar por nombre o nomenclatura Spencer..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 h-10 bg-slate-50/50 border-none rounded-xl text-xs font-medium focus:ring-0 placeholder:text-slate-400"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex p-1 bg-slate-100 rounded-xl h-10">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={cn("px-3 rounded-lg transition-all", viewMode === 'grid' ? "bg-white shadow-sm text-slate-900" : "text-slate-400")}
                                >
                                    <LayoutGrid className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={cn("px-3 rounded-lg transition-all", viewMode === 'list' ? "bg-white shadow-sm text-slate-900" : "text-slate-400")}
                                >
                                    <List className="w-4 h-4" />
                                </button>
                            </div>

                            <Button
                                onClick={loadAssets}
                                variant="outline"
                                size="icon"
                                className="h-10 w-10 rounded-xl border-slate-200 hover:bg-slate-50"
                            >
                                <RefreshCw className={cn("w-4 h-4 text-slate-500", loading && "animate-spin")} />
                            </Button>
                        </div>
                    </div>

                    {/* Bulk Actions (Visible when selection exists) */}
                    {selectedAssets.length > 0 && (
                        <div className="mt-2 py-2 px-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-between animate-in slide-in-from-top-2 duration-300">
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-black text-rose-700 uppercase tracking-widest">{selectedAssets.length} Seleccionados</span>
                                <div className="h-4 w-px bg-rose-200" />
                                <div className="flex gap-1.5">
                                    <Button onClick={() => handleBulkStatus('WINNER')} size="sm" className="h-7 text-[9px] font-black uppercase bg-white text-emerald-600 border border-emerald-200 hover:bg-emerald-50 rounded-lg">
                                        <Sparkles className="w-3 h-3 mr-1" /> Marcar Winner
                                    </Button>
                                    <Button onClick={() => handleBulkStatus('KILL')} size="sm" className="h-7 text-[9px] font-black uppercase bg-white text-red-600 border border-red-200 hover:bg-red-50 rounded-lg">
                                        <Trash2 className="w-3 h-3 mr-1" /> Marcar Kill
                                    </Button>
                                    <Button onClick={() => setSelectedAssets([])} variant="ghost" className="h-7 text-[9px] font-black uppercase text-rose-600">
                                        Cancelar
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </Card>

                {/* Assets Grid/List */}
                {loading && assets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 space-y-4">
                        <Loader2 className="w-10 h-10 text-rose-500 animate-spin" />
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Accediendo a la Biblioteca...</p>
                    </div>
                ) : assets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                        <Clapperboard className="w-12 h-12 text-slate-200 mb-4" />
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Cero Activos Encontrados</h3>
                        <p className="text-xs text-slate-400 max-w-[200px] mt-1 leading-relaxed">No hay archivos que coincidan con estos filtros en el Centro Creativo.</p>
                        <Button variant="outline" className="mt-4 h-8 text-[10px] font-black uppercase tracking-widest rounded-lg" onClick={() => {
                            setConceptFilter(undefined);
                            setAudienceFilter(undefined);
                            setSearch("");
                        }}>
                            Limpiar Filtros
                        </Button>
                    </div>
                ) : (
                    <div className={cn(
                        "grid gap-4 overflow-hidden p-1",
                        viewMode === 'grid' ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"
                    )}>
                        {assets.map((asset) => (
                            <AssetLibraryCard
                                key={asset.id}
                                asset={asset}
                                viewMode={viewMode}
                                isSelected={selectedAssets.includes(asset.id)}
                                onToggle={() => toggleAssetSelection(asset.id)}
                            />
                        ))}
                    </div>
                )}

                {/* Pagination Placeholder */}
                <div className="flex items-center justify-between py-4 px-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mostrando {assets.length} de {total} activos</p>
                    {total > assets.length && (
                        <Button variant="ghost" className="text-[10px] font-black uppercase tracking-widest text-rose-600 hover:bg-white bg-white/50 border border-slate-100 px-6 rounded-xl h-10">
                            Cargar Más <ChevronDown className="w-4 h-4 ml-1" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

function AssetLibraryCard({ asset, viewMode, isSelected, onToggle }: { asset: any, viewMode: 'grid' | 'list', isSelected: boolean, onToggle: () => void }) {
    const concept = CREATIVE_CONCEPTS.find(c => c.id === asset.concept);

    // Status colors
    const statusColors: any = {
        'WINNER': 'bg-emerald-500 text-white',
        'KILL': 'bg-red-500 text-white',
        'ACTIVO': 'bg-blue-500 text-white',
        'PAUSADO': 'bg-amber-500 text-white'
    };

    if (viewMode === 'list') {
        return (
            <div
                className={cn(
                    "group bg-white rounded-xl border p-2 flex items-center gap-4 transition-all hover:border-rose-300",
                    isSelected ? "border-rose-500 bg-rose-50/20" : "border-slate-100 shadow-xs"
                )}
            >
                <div
                    onClick={onToggle}
                    className={cn(
                        "w-5 h-5 rounded-lg border-2 flex items-center justify-center flex-shrink-0 cursor-pointer transition-all",
                        isSelected ? "bg-rose-600 border-rose-600 text-white" : "bg-white border-slate-200"
                    )}
                >
                    {isSelected && <Check className="w-3 h-3" />}
                </div>

                <div className="w-12 h-12 rounded-lg bg-slate-900 overflow-hidden flex-shrink-0 relative">
                    {asset.drivePath ? (
                        <video src={asset.drivePath} className="w-full h-full object-cover opacity-60" muted />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            {asset.type === 'VIDEO' ? <Play className="w-4 h-4 text-slate-600 fill-current" /> : <ImageIcon className="w-4 h-4 text-slate-600" />}
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[9px] font-black text-slate-900 truncate uppercase italic tracking-tight">{asset.name}</span>
                        <Badge className={cn("text-[7px] font-black uppercase px-1.5 py-0 border-none", statusColors[asset.status] || 'bg-slate-200 text-slate-600')}>
                            {asset.status}
                        </Badge>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-[8px] font-bold text-slate-400 font-mono tracking-wider">{asset.nomenclatura}</span>
                        <div className="flex items-center gap-1.5">
                            {concept && <span className="text-[8px] font-black text-purple-600 uppercase tracking-widest">{concept.code} {concept.name}</span>}
                            <span className="text-slate-200">|</span>
                            <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest">{asset.audienceType || 'COLD'}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6 pr-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                            <div className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5">CTR</div>
                            <div className="text-[10px] font-black text-slate-900">{asset.ctr?.toFixed(2) || '0.00'}%</div>
                        </div>
                        <div className="text-center">
                            <div className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5">ROAS</div>
                            <div className="text-[10px] font-black text-slate-900">{asset.roas?.toFixed(1) || '0.0'}</div>
                        </div>
                    </div>
                    <button className="text-slate-300 hover:text-slate-900"><MoreVertical className="w-4 h-4" /></button>
                </div>
            </div>
        );
    }

    return (
        <Card
            className={cn(
                "group rounded-2xl overflow-hidden border transition-all duration-300 hover:-translate-y-1 hover:shadow-sm hover:shadow-sm cursor-pointer bg-white relative",
                isSelected ? "border-rose-500 ring-2 ring-rose-500/10" : "border-slate-100"
            )}
        >
            <div className="relative aspect-[4/5] bg-slate-950 overflow-hidden">
                {/* Checkbox overlay */}
                <div
                    onClick={(e) => { e.stopPropagation(); onToggle(); }}
                    className={cn(
                        "absolute top-3 left-3 z-30 w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all",
                        isSelected
                            ? "bg-rose-600 border-rose-600 text-white"
                            : "bg-black/20 border-white/40 opacity-0 group-hover:opacity-100"
                    )}
                >
                    {isSelected && <Check className="w-3 h-3" />}
                </div>

                {/* Concept / Status Badges */}
                <div className="absolute top-3 right-3 z-30 flex flex-col items-end gap-1.5">
                    <Badge className={cn("text-[8px] font-black uppercase tracking-widest border-none px-2 py-0.5 shadow-sm", statusColors[asset.status] || 'bg-slate-200')}>
                        {asset.status}
                    </Badge>
                    {concept && (
                        <Badge className="bg-white/90 text-purple-700 border border-purple-100 font-black uppercase text-[8px] tracking-widest rounded-lg px-2 py-0.5 shadow-sm">
                            {concept.code} {concept.name}
                        </Badge>
                    )}
                </div>

                {/* Video/Image Preview */}
                {asset.drivePath ? (
                    <video
                        src={asset.drivePath}
                        className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity duration-500"
                        muted
                        onMouseOver={e => e.currentTarget.play()}
                        onMouseOut={e => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-900 to-slate-800">
                        <Clapperboard className="w-8 h-8 text-slate-700" />
                        <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Vista Previa v4</span>
                    </div>
                )}

                {/* Bottom Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                <div className="absolute inset-x-3 bottom-12 z-20">
                    <button className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all active:scale-90 mx-auto mb-2">
                        <Play className="w-3 h-3 fill-current ml-0.5" />
                    </button>
                    <div className="space-y-0.5">
                        <p className="text-[8px] font-black text-white/50 uppercase tracking-[0.2em] font-mono">{asset.nomenclatura}</p>
                        <h4 className="text-[11px] font-black text-white uppercase italic tracking-tighter truncate leading-tight group-hover:text-amber-400 transition-colors">{asset.name}</h4>
                    </div>
                </div>

                {/* Footer Stats Over Preview */}
                <div className="absolute inset-x-0 bottom-0 z-30 h-10 bg-white/10 border-t border-white/10 flex items-center justify-around px-2">
                    <div className="text-center">
                        <p className="text-[7px] font-black text-white/60 uppercase tracking-widest">CTR</p>
                        <p className="text-[10px] font-black text-emerald-400">{asset.ctr?.toFixed(2) || '0.00'}%</p>
                    </div>
                    <div className="h-6 w-px bg-white/10" />
                    <div className="text-center">
                        <p className="text-[7px] font-black text-white/60 uppercase tracking-widest">Hook</p>
                        <p className="text-[10px] font-black text-rose-400">{asset.hookRate?.toFixed(1) || '0.0'}%</p>
                    </div>
                    <div className="h-6 w-px bg-white/10" />
                    <div className="text-center">
                        <p className="text-[7px] font-black text-white/60 uppercase tracking-widest">ROAS</p>
                        <p className="text-[10px] font-black text-white">{asset.roas?.toFixed(1) || '0.0'}</p>
                    </div>
                </div>
            </div>

            {/* Hidden expandable info on hover? No, keep it clean. */}
        </Card>
    );
}
