'use client';

import React from 'react';
import {
    X, Clapperboard, Target, Zap, Clock, TrendingUp,
    Layers, ExternalLink, Download, Copy, Trash2,
    Share2, History, Info, Sparkles, Layout,
    BarChart3, AlertTriangle, Play, UploadCloud
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MetaUploadModal } from './MetaUploadModal';

interface AssetDetailPanelProps {
    asset: any;
    onClose: () => void;
}

export function AssetDetailPanel({ asset, onClose }: AssetDetailPanelProps) {
    const [showMetaModal, setShowMetaModal] = React.useState(false);
    if (!asset) return null;

    const tags = asset.tagsJson ? JSON.parse(asset.tagsJson) : {};
    const roas = asset.spend > 0 ? (asset.revenue / asset.spend).toFixed(2) : '0.00';

    return (
        <div className="fixed inset-y-0 right-0 w-[380px] bg-white border-l border-[var(--border)] shadow-lg z-50 animate-in slide-in-from-right duration-300 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)] bg-white">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[var(--cre-bg)] text-[var(--cre)] flex items-center justify-center border border-[var(--cre)]/10">
                        <Clapperboard size={16} />
                    </div>
                    <div className="max-w-[240px]">
                        <h2 className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-primary)] truncate">
                            {asset.nomenclatura || asset.name}
                        </h2>
                        <p className="text-[9px] font-medium text-[var(--text-tertiary)] uppercase mt-0.5">
                            {asset.type} • {asset.id.substring(0, 8)}
                        </p>
                    </div>
                </div>
                <button onClick={onClose} className="p-1.5 hover:bg-[var(--bg)] rounded-lg transition-colors border border-transparent hover:border-[var(--border)]">
                    <X size={16} className="text-[var(--text-tertiary)]" />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4 space-y-6 custom-scrollbar">
                {/* Preview */}
                <div className="aspect-[9/16] w-full bg-black rounded-xl relative overflow-hidden group border border-[var(--border)]">
                    {asset.thumbnailUrl ? (
                        <img src={asset.thumbnailUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="Preview" />
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-white/20 gap-2">
                            <Clapperboard size={32} />
                            <p className="text-[8px] font-bold uppercase">No Preview</p>
                        </div>
                    )}
                    <button className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
                            <Play size={18} fill="white" />
                        </div>
                    </button>

                    {/* Badge Overlay */}
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                        <span className={cn(
                            "px-2 py-0.5 rounded text-[8px] font-bold uppercase border shadow-sm",
                            asset.metaStatus === 'ACTIVO' ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-white/80 text-[var(--text-primary)] border-white/20 backdrop-blur-sm"
                        )}>
                            {asset.metaStatus || 'DRAFT'}
                        </span>
                    </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-3">
                    <MetricMiniCard label="CTR Promedio" value={`${asset.ctr?.toFixed(2) || '0.00'}%`} color="text-[var(--cre)]" bg="bg-[var(--cre-bg)]/20" />
                    <MetricMiniCard label="ROAS" value={`${roas}x`} color="text-emerald-700" bg="bg-emerald-50" />
                </div>

                {/* Intelligence Tags */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-[var(--border)]">
                        <Sparkles size={12} className="text-[var(--cre)]" />
                        <h3 className="text-[9px] font-bold text-[var(--text-primary)] uppercase tracking-wider">AI Semantics</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        <TagMini label="Hook" value={tags.tipo_hook || asset.hookType} />
                        <TagMini label="Ángulo" value={tags.angulo} />
                        <TagMini label="Fase" value={asset.funnelStage || tags.fase_embudo} />
                    </div>
                </div>

                {/* Tracking / Info */}
                <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg)]/30 space-y-4">
                    <h3 className="text-[9px] font-bold text-[var(--text-primary)] uppercase tracking-widest flex items-center gap-2">
                        <Info size={12} className="text-[var(--text-tertiary)]" /> Trazabilidad
                    </h3>
                    <div className="space-y-4 relative pl-3 border-l-2 border-[var(--border)]">
                        <TraceMini label="Origen" text={asset.sourceUrl ? "Meta Library" : "Original IA"} />
                        <TraceMini label="Concepto" text={asset.conceptCode || "MECH_01"} />
                        <TraceMini label="Framework" text={asset.framework || "DTC Default"} />
                    </div>
                </div>

                {/* Versions */}
                <div className="space-y-3">
                    <h3 className="text-[9px] font-bold text-[var(--text-primary)] uppercase tracking-widest flex items-center gap-2">
                        <History size={12} className="text-[var(--text-tertiary)]" /> Versiones
                    </h3>
                    <div className="space-y-1.5">
                        {[1, 2].map(v => (
                            <div key={v} className={cn(
                                "flex items-center justify-between p-2 rounded-lg border text-[10px] font-medium transition-all cursor-pointer",
                                v === asset.versionNumber ? "bg-white border-[var(--cre)] text-[var(--text-primary)]" : "bg-white border-[var(--border)] text-[var(--text-tertiary)] hover:border-[var(--text-tertiary)]/50"
                            )}>
                                <span className="font-bold">V{v} {v === asset.versionNumber && " (Actual)"}</span>
                                <span className="text-[8px] opacity-60">ID_{asset.id.substring(0, 4)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-[var(--border)] bg-gray-50/50 space-y-2">
                <MetaUploadModal
                    isOpen={showMetaModal}
                    onClose={() => setShowMetaModal(false)}
                    creative={{ id: asset.id, name: asset.name, thumbnail: asset.thumbnailUrl, type: asset.type }}
                />
                <div className="grid grid-cols-2 gap-2">
                    <button className="h-9 bg-[var(--cre)] text-white rounded-lg text-[10px] font-bold uppercase hover:opacity-90 shadow-sm flex items-center justify-center gap-2 transition-all">
                        <Sparkles size={14} /> VARIANTE
                    </button>
                    <button
                        onClick={() => setShowMetaModal(true)}
                        className="h-9 bg-white border border-[var(--border)] text-[var(--text-primary)] rounded-lg text-[10px] font-bold uppercase hover:bg-[var(--bg)] transition-all flex items-center justify-center gap-2"
                    >
                        <UploadCloud size={14} /> SUBIR META
                    </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-1 h-8 bg-white border border-[var(--border)] rounded-lg flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"><Download size={14} /></div>
                    <div className="col-span-1 h-8 bg-white border border-[var(--border)] rounded-lg flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"><Share2 size={14} /></div>
                    <div className="col-span-1 h-8 bg-white border border-[var(--border)] rounded-lg flex items-center justify-center text-[var(--text-tertiary)] hover:text-rose-500 transition-all cursor-pointer"><Trash2 size={14} /></div>
                </div>
            </div>
        </div>
    );
}

function MetricMiniCard({ label, value, color, bg }: any) {
    return (
        <div className={cn("p-3 rounded-lg border border-[var(--border)] flex flex-col gap-0.5", bg)}>
            <p className="text-[8px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">{label}</p>
            <p className={cn("text-base font-bold", color)}>{value}</p>
        </div>
    );
}

function TagMini({ label, value }: any) {
    return (
        <div className="p-2 border border-[var(--border)] rounded-lg bg-white flex flex-col gap-0.5">
            <span className="text-[7px] font-bold text-[var(--text-tertiary)] uppercase">{label}</span>
            <span className="text-[9px] font-bold text-[var(--text-primary)] uppercase truncate">{value || '---'}</span>
        </div>
    );
}

function TraceMini({ label, text }: any) {
    return (
        <div className="space-y-0.5">
            <p className="text-[8px] font-bold text-[var(--text-tertiary)] uppercase">{label}</p>
            <p className="text-[10px] font-bold text-[var(--text-primary)] uppercase">{text}</p>
        </div>
    );
}
