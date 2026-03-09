'use client';

import React, { useState, useEffect } from 'react';
import {
    Play, MoreHorizontal, Copy, Trash2, Download,
    CheckCircle2, ChevronLeft, ChevronRight, X,
    ExternalLink, Instagram, Facebook, Monitor,
    TrendingUp, Activity, BarChart3, Zap, Smartphone,
    Pause, Maximize2, Volume2, Globe, Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Creative {
    id: string;
    nomenclature: string;
    thumbnail: string;
    videoUrl: string;
    status: 'SIN_PUBLICAR' | 'PROGRAMADO' | 'ACTIVO' | 'PAUSADO';
    platform: 'Meta' | 'TikTok';
    metrics: {
        spend: number | null;
        roas: number | null;
        ctr: number | null;
        cpa: number | null;
        hookRate: number | null;
        watch25: number | null;
        watch50: number | null;
        watch100: number | null;
    };
    date: string;
}

export function TablaCreativa({ conceptId, storeId, productId, productSku }: {
    conceptId: string | null,
    storeId: string,
    productId: string,
    productSku: string
}) {
    const [creatives, setCreatives] = useState<Creative[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedVideoIndex, setSelectedVideoIndex] = useState<number | null>(null);

    useEffect(() => {
        if (productId) fetchCreatives();
    }, [productId, conceptId]);

    const fetchCreatives = async () => {
        setIsLoading(true);
        try {
            await new Promise(r => setTimeout(r, 800));
            const mockCreatives: Creative[] = [
                {
                    id: 'c1',
                    nomenclature: `${productSku}-C01-F-V1`,
                    thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200&h=200&fit=crop',
                    videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
                    status: 'ACTIVO',
                    platform: 'Meta',
                    metrics: { spend: 1250, roas: 3.2, ctr: 1.8, cpa: 12.5, hookRate: 42.5, watch25: 18, watch50: 8, watch100: 2 },
                    date: '2024-03-01'
                }
            ];
            setCreatives(mockCreatives);
        } catch (e) {
            toast.error("Error al cargar");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-4 animate-in fade-in duration-500">
            {/* HEADER ACTIONS */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 px-1">
                    <div className="w-8 h-8 rounded-lg bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center text-[var(--text-tertiary)]"><Monitor size={16} /></div>
                    <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-primary)]">Inventario de Creativos</h3>
                </div>
                <div className="flex items-center gap-2">
                    <button className="h-8 px-3 rounded-lg border border-[var(--border)] bg-white text-[10px] font-bold uppercase text-[var(--text-tertiary)] hover:bg-[var(--bg)] transition-all flex items-center gap-1.5"><BarChart3 size={12} /> REPORTE</button>
                    <button className="h-8 px-4 rounded-lg bg-[var(--cre)] text-white text-[10px] font-bold uppercase flex items-center gap-1.5 hover:opacity-90 shadow-sm"><Instagram size={12} /> SYNC META</button>
                </div>
            </div>

            {/* TABLE */}
            <div className="bg-white rounded-xl border border-[var(--border)] shadow-sm overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left min-w-[1000px]">
                        <thead>
                            <tr className="border-b border-[var(--border)] bg-[var(--bg)]/10">
                                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)]">Preview</th>
                                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)]">Nomenclatura</th>
                                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)]">Estado</th>
                                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)]">Gasto</th>
                                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)]">ROAS</th>
                                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)]">CTR</th>
                                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)]">Hook%</th>
                                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)] text-right pr-6">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                            {creatives.map((c, idx) => (
                                <tr key={c.id} className="group hover:bg-[var(--bg)]/30 transition-all h-14">
                                    <td className="px-4">
                                        <div className="relative w-16 h-10 rounded-lg border border-[var(--border)] overflow-hidden bg-black flex items-center justify-center">
                                            <img src={c.thumbnail} className="w-full h-full object-cover opacity-60" />
                                            <button onClick={() => setSelectedVideoIndex(idx)} className="absolute inset-0 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all"><Play size={12} fill="currentColor" /></button>
                                        </div>
                                    </td>
                                    <td className="px-4"><span className="text-[11px] font-mono font-bold text-[var(--text-primary)] uppercase">{c.nomenclature}</span></td>
                                    <td className="px-4"><StatusBadge status={c.status} /></td>
                                    <td className="px-4"><MetricCell value={c.metrics.spend} prefix="$" /></td>
                                    <td className="px-4"><MetricCell value={c.metrics.roas} suffix="x" color="emerald-600" /></td>
                                    <td className="px-4"><MetricCell value={c.metrics.ctr} suffix="%" /></td>
                                    <td className="px-4"><MetricCell value={c.metrics.hookRate} suffix="%" color="[var(--cre)]" /></td>
                                    <td className="px-4 text-right pr-6"><button className="p-1 hover:text-[var(--cre)] text-[var(--text-tertiary)]"><MoreHorizontal size={14} /></button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL */}
            {selectedVideoIndex !== null && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-white/40 backdrop-blur-md" onClick={() => setSelectedVideoIndex(null)} />
                    <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-md overflow-hidden flex border border-[var(--border)] flex-col md:flex-row h-full max-h-[600px] animate-in zoom-in-95">
                        <div className="flex-[3] bg-[var(--text-primary)] relative flex items-center justify-center h-full">
                            <video src={creatives[selectedVideoIndex].videoUrl} className="w-full h-full object-contain" controls autoPlay />
                            <button onClick={() => setSelectedVideoIndex(null)} className="absolute top-4 left-4 w-8 h-8 rounded-lg bg-white/20 text-white flex items-center justify-center hover:bg-white/40 border border-white/10 transition-all"><X size={16} /></button>
                        </div>
                        <div className="flex-[2] p-6 flex flex-col h-full bg-white divide-y divide-[var(--border)]">
                            <div className="pb-6 space-y-2">
                                <div className="flex items-center gap-2">
                                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[8px] font-bold uppercase rounded border border-blue-200">Meta Ads</span>
                                    <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase">{creatives[selectedVideoIndex].date}</span>
                                </div>
                                <h4 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-tight">{creatives[selectedVideoIndex].nomenclature}</h4>
                            </div>

                            <div className="py-6 grid grid-cols-2 gap-3">
                                <MetricInModal label="ROAS" value={`${creatives[selectedVideoIndex].metrics.roas}x`} color="text-emerald-600" />
                                <MetricInModal label="Hook Rate" value={`${creatives[selectedVideoIndex].metrics.hookRate}%`} color="text-[var(--cre)]" />
                                <MetricInModal label="Inversión" value={`$${creatives[selectedVideoIndex].metrics.spend}`} />
                                <MetricInModal label="CTR" value={`${creatives[selectedVideoIndex].metrics.ctr}%`} />
                            </div>

                            <div className="pt-6 mt-auto grid grid-cols-2 gap-2">
                                <button className="h-9 rounded-lg bg-[var(--cre)] text-white text-[10px] font-bold uppercase tracking-wider shadow-sm flex items-center justify-center gap-2"><CheckCircle2 size={14} /> Aprobar</button>
                                <button className="h-9 rounded-lg border border-[var(--border)] text-[var(--text-primary)] text-[10px] font-bold uppercase flex items-center justify-center gap-2"><Copy size={14} /> Duplicar</button>
                                <button className="h-9 rounded-lg border border-[var(--border)] text-[var(--text-primary)] text-[10px] font-bold uppercase flex items-center justify-center gap-2"><Download size={14} /> Descargar</button>
                                <button className="h-9 rounded-lg border border-rose-100 text-rose-500 text-[10px] font-bold uppercase flex items-center justify-center gap-2 hover:bg-rose-50"><Trash2 size={14} /> Eliminar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatusBadge({ status }: { status: Creative['status'] }) {
    const styles = {
        ACTIVO: "bg-emerald-100 text-emerald-700 border-emerald-200",
        PAUSADO: "bg-amber-100 text-amber-700 border-amber-200",
        PROGRAMADO: "bg-blue-100 text-blue-700 border-blue-200",
        SIN_PUBLICAR: "bg-gray-100 text-gray-700 border-gray-200"
    }[status];
    return <span className={cn("px-2 py-0.5 rounded text-[8px] font-bold uppercase border", styles)}>{status.replace('_', ' ')}</span>;
}

function MetricCell({ value, prefix = '', suffix = '', color = '[var(--text-primary)]' }: any) {
    return <span className={cn("text-[11px] font-mono font-bold", `text-${color}`)}>{value ? `${prefix}${value}${suffix}` : '—'}</span>;
}

function MetricInModal({ label, value, color = 'text-[var(--text-primary)]' }: any) {
    return (
        <div className="p-3 bg-[var(--bg)]/30 rounded-lg border border-[var(--border)] flex flex-col gap-0.5">
            <span className="text-[8px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">{label}</span>
            <span className={cn("text-sm font-bold uppercase", color)}>{value}</span>
        </div>
    );
}
