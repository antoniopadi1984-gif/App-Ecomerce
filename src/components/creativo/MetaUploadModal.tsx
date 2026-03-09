'use client';

import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogContent, DialogHeader,
    DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
    Facebook, Settings, Zap,
    CheckCircle2, Loader2, Sparkles,
    AlertCircle, Info, ChevronRight,
    Play, Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface MetaUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    creative: {
        id: string;
        name: string;
        thumbnail?: string;
        type: string;
    };
}

export function MetaUploadModal({ isOpen, onClose, creative }: MetaUploadModalProps) {
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState('');
    const [selectedCampaign, setSelectedCampaign] = useState('');
    const [useSuggestedStructure, setUseSuggestedStructure] = useState(true);

    const accounts = [
        { id: 'act_123456789', name: 'Ecommerce Global - BM 01' },
        { id: 'act_987654321', name: 'Scaling Ads - Master' },
    ];

    const campaigns = [
        { id: 'cmp_1', name: 'C01_PROSPECTING_ADVANTAGE_V25', objective: 'SALES' },
        { id: 'cmp_2', name: 'C02_RETARGETING_DYNAMIC', objective: 'SALES' },
    ];

    const handlePublish = async () => {
        setIsLoading(true);
        // Simulate API call to Meta Marketing API v25
        await new Promise(r => setTimeout(r, 3000));
        setIsLoading(false);
        toast.success("¡Anuncio publicado en Meta!", {
            description: "El ad_id ha sido vinculado y la sincronización está activa."
        });
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-2xl bg-white rounded-xl border border-[var(--border)] p-0 overflow-hidden shadow-md">
                <div className="flex flex-col h-full max-h-[90vh]">
                    {/* Header with Progress */}
                    <div className="p-8 border-b border-[var(--border)] bg-[var(--bg)]/10 relative">
                        <div className="absolute top-0 left-0 h-1 bg-[var(--cre)] transition-all duration-500" style={{ width: `${(step / 3) * 100}%` }} />
                        <DialogHeader className="flex-row items-center gap-4 space-y-0 text-left">
                            <div className="w-12 h-12 rounded-lg bg-[var(--cre)] flex items-center justify-center text-white shadow-sm shadow-[var(--cre)]/10">
                                <Facebook size={24} />
                            </div>
                            <div className="text-left">
                                <DialogTitle className="text-lg font-bold uppercase tracking-tight text-[var(--text-primary)]">Subir a Meta Ads</DialogTitle>
                                <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest mt-0.5">Marketing API Engine v25 • Sincronización 6h</p>
                            </div>
                        </DialogHeader>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                        {step === 1 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <div className="p-4 bg-[var(--cre-bg)]/50 rounded-xl border border-[var(--cre)]/10 flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-lg bg-[var(--text-primary)] overflow-hidden shrink-0">
                                        {creative.thumbnail ? (
                                            <img src={creative.thumbnail} className="w-full h-full object-cover opacity-80" alt="" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-[var(--text-tertiary)]">
                                                <Play size={20} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest leading-none">Creativo Seleccionado</p>
                                        <h4 className="text-sm font-bold text-[var(--text-primary)] uppercase mt-2 truncate italic">{creative.id}</h4>
                                        <p className="text-[9px] font-bold text-[var(--cre)] uppercase mt-0.5">{creative.type}</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest px-1 italic">1. Cuenta de Anuncios</label>
                                        <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                                            <SelectTrigger className="w-full h-12 rounded-lg border-[var(--border)] bg-white px-4 text-[13px] font-bold shadow-sm focus:ring-[var(--cre)]">
                                                <SelectValue placeholder="Selecciona una cuenta..." />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-[var(--border)] shadow-md">
                                                {accounts.map(acc => (
                                                    <SelectItem key={acc.id} value={acc.id} className="rounded-lg py-3 text-[12px] font-bold uppercase tracking-tight">
                                                        {acc.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest px-1 italic">2. Campaña</label>
                                        <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                                            <SelectTrigger className="w-full h-12 rounded-lg border-[var(--border)] bg-white px-4 text-[13px] font-bold shadow-sm focus:ring-[var(--cre)]">
                                                <SelectValue placeholder="Selecciona una campaña..." />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-[var(--border)] shadow-md">
                                                {campaigns.map(cmp => (
                                                    <SelectItem key={cmp.id} value={cmp.id} className="rounded-lg py-3">
                                                        <div className="flex flex-col">
                                                            <span className="text-[12px] font-bold uppercase tracking-tight">{cmp.name}</span>
                                                            <span className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">{cmp.objective}</span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <div className="p-6 bg-white border border-[var(--border)] rounded-xl relative overflow-hidden shadow-sm">
                                    <div className="absolute top-0 right-0 p-8 opacity-5 text-[var(--cre)]">
                                        <Sparkles size={120} />
                                    </div>

                                    <div className="relative space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-[var(--cre-bg)] flex items-center justify-center text-[var(--cre)] border border-[var(--cre)]/20 backdrop-blur-md">
                                                <Zap size={20} />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold uppercase tracking-tight italic text-[var(--text-primary)]">Estructura Sugerida (Andromeda Core)</h4>
                                                <p className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">Optimización por Inteligencia Artificial</p>
                                            </div>
                                        </div>

                                        <p className="text-[12px] leading-relaxed text-[var(--text-primary)] font-medium">
                                            "Basado en el histórico de tu cuenta y la arquitectura <b>Meta Andromeda</b>, recomendamos crear un nuevo <b>Ad Set</b> con targeting <b> Broad</b> y Advantage+ activado. Añade este creativo junto con otros 14 similares para maximizar el aprendizaje."
                                        </p>

                                        <div className="flex items-center gap-4 pt-2">
                                            <button
                                                onClick={() => setUseSuggestedStructure(true)}
                                                className={cn(
                                                    "flex-1 h-11 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-all flex items-center justify-center gap-2",
                                                    useSuggestedStructure
                                                        ? "bg-[var(--cre)] border-[var(--cre)] text-white shadow-sm"
                                                        : "bg-[var(--bg)] border-[var(--border)] text-[var(--text-tertiary)] hover:border-[var(--cre)]/30"
                                                )}
                                            >
                                                <CheckCircle2 size={14} /> Usar Sugerido
                                            </button>
                                            <button
                                                onClick={() => setUseSuggestedStructure(false)}
                                                className={cn(
                                                    "flex-1 h-11 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-all flex items-center justify-center gap-2",
                                                    !useSuggestedStructure
                                                        ? "bg-[var(--text-primary)] border-[var(--text-primary)] text-white"
                                                        : "bg-white border-[var(--border)] text-[var(--text-tertiary)] hover:border-[var(--cre)]/30"
                                                )}
                                            >
                                                Config. Manual
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-[var(--bg)]/50 border border-[var(--border)] rounded-xl">
                                            <p className="text-[8px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest mb-1">Targeting</p>
                                            <p className="text-[11px] font-bold text-[var(--text-primary)] uppercase italic">{useSuggestedStructure ? 'BROAD (Abierto)' : 'Intereses / Lookalike'}</p>
                                        </div>
                                        <div className="p-4 bg-[var(--bg)]/50 border border-[var(--border)] rounded-xl">
                                            <p className="text-[8px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest mb-1">Advantage+</p>
                                            <p className="text-[11px] font-bold text-[var(--s-ok)] uppercase italic">{useSuggestedStructure ? 'ACTIVADO' : 'MANUAL'}</p>
                                        </div>
                                    </div>

                                    {!useSuggestedStructure && (
                                        <div className="p-4 bg-[var(--s-wa)]/10 border border-[var(--s-wa)]/20 rounded-xl flex items-start gap-3">
                                            <AlertCircle size={16} className="text-[var(--s-wa)] shrink-0 mt-0.5" />
                                            <p className="text-[10px] font-bold text-[var(--s-wa)] leading-relaxed uppercase">
                                                Cuidado: La configuración manual podría aumentar tu CPM un 15% según el histórico de este producto.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300 text-center py-4">
                                <div className="w-24 h-24 rounded-2xl bg-[var(--bg)] border border-[var(--border)] mx-auto flex items-center justify-center text-[var(--text-primary)] shadow-sm overflow-hidden relative">
                                    {creative.thumbnail ? (
                                        <img src={creative.thumbnail} className="w-full h-full object-cover" alt="" />
                                    ) : (
                                        <Play size={32} />
                                    )}
                                    <div className="absolute inset-0 bg-[var(--text-primary)]/40 flex items-center justify-center text-white">
                                        <CheckCircle2 size={32} />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="text-lg font-bold uppercase text-[var(--text-primary)] italic">Resumen de Publicación</h4>
                                    <p className="text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">IDC-NOMENCLATURE: {creative.id}</p>
                                </div>

                                <div className="max-w-md mx-auto p-6 bg-[var(--bg)]/30 rounded-xl border border-[var(--border)] space-y-4 text-left shadow-sm">
                                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-tight">
                                        <span className="text-[var(--text-tertiary)]">Campaign</span>
                                        <span className="text-[var(--text-primary)]">{campaigns.find(c => c.id === selectedCampaign)?.name || 'Campaña no seleccionada'}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-tight">
                                        <span className="text-[var(--text-tertiary)]">Ad Set Naming</span>
                                        <span className="text-[var(--text-primary)]">AS_{creative.id.split('_')[1]}_{creative.type}_V25</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-tight">
                                        <span className="text-[var(--text-tertiary)]">Ad Naming (Auto)</span>
                                        <span className="text-[var(--text-primary)]">{creative.id}_META_V1</span>
                                    </div>
                                    <div className="pt-4 border-t border-[var(--border)] flex items-center gap-2">
                                        <Info size={12} className="text-[var(--cre)]" />
                                        <p className="text-[9px] font-bold text-[var(--cre)] uppercase tracking-tight">La sincronización de métricas comenzará en 15m tras la aprobación de Meta.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="p-8 border-t border-[var(--border)] bg-[var(--bg)]/10 flex items-center justify-between">
                        <Button
                            variant="ghost"
                            disabled={step === 1 || isLoading}
                            onClick={() => setStep(step - 1)}
                            className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                        >
                            Atrás
                        </Button>

                        <div className="flex items-center gap-3">
                            {step < 3 ? (
                                <button
                                    onClick={() => setStep(step + 1)}
                                    disabled={!selectedAccount || !selectedCampaign}
                                    className="h-12 px-8 bg-[var(--cre)] text-white rounded-lg text-[11px] font-bold uppercase tracking-widest hover:opacity-90 shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    Siguiente <ChevronRight size={16} />
                                </button>
                            ) : (
                                <button
                                    onClick={handlePublish}
                                    disabled={isLoading}
                                    className="h-12 px-10 bg-[var(--text-primary)] text-white rounded-lg text-[11px] font-bold uppercase tracking-widest hover:opacity-90 shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" /> Publicando...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 size={16} className="text-[var(--s-ok)]" /> Publicar en Meta
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
