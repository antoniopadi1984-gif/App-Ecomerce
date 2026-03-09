'use client';

import React, { useState } from 'react';
import {
    Sparkles, Zap, Layout, Play,
    Plus, Trash2, CheckCircle2,
    Loader2, Send, Filter,
    ChevronRight, Smartphone,
    Monitor, Square, Music, Mic,
    Wand2, Layers, Download,
    FolderUp, CheckSquare, XCircle,
    Eye, MoreHorizontal, AlertCircle, ShieldCheck, RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Variant {
    id: string;
    nomenclature: string;
    hook: string;
    approved: boolean;
    selected: boolean;
    status: 'PENDIENTE' | 'GENERANDO' | 'LISTO' | 'ERROR';
    format: string;
    duration: string;
    hookType: string;
    phase: string;
    videoUrl?: string;
}

const VARIATION_OPTIONS = [
    { id: 'hook', label: 'El Hook' },
    { id: 'cta', label: 'El CTA' },
    { id: 'oferta', label: 'La Oferta' },
    { id: 'avatar', label: 'El Avatar' },
    { id: 'framework', label: 'El Framework' }
];

const FORMATS = [
    { id: '9:16', label: '9:16 Story', icon: Smartphone },
    { id: '4:5', label: '4:5 Feed', icon: Smartphone },
    { id: '1:1', label: '1:1 Square', icon: Square }
];

export function FabricaEnMasa({ conceptId, conceptName, storeId, productId, productSku }: {
    conceptId: string,
    conceptName: string,
    storeId: string,
    productId: string,
    productSku: string
}) {
    const [numVariants, setNumVariants] = useState<number>(10);
    const [phase, setPhase] = useState('FRÍO');
    const [selectedVariations, setSelectedVariations] = useState<string[]>(['hook']);
    const [selectedFormats, setSelectedFormats] = useState<string[]>(['9:16']);
    const [step, setStep] = useState<'CONFIG' | 'PRODUCTION'>('CONFIG');
    const [variants, setVariants] = useState<Variant[]>([]);
    const [productionProgress, setProductionProgress] = useState(0);
    const [isLaunching, setIsLaunching] = useState(false);

    const toggleVariation = (id: string) => {
        setSelectedVariations(prev =>
            prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
        );
    };

    const toggleFormat = (id: string) => {
        setSelectedFormats(prev =>
            prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
        );
    };

    const handleLaunchFactory = async () => {
        if (selectedVariations.length === 0) {
            toast.error("Selecciona qué varía");
            return;
        }
        setIsLaunching(true);
        try {
            await new Promise(r => setTimeout(r, 1500));
            const newVariants: Variant[] = [];
            for (let i = 0; i < numVariants; i++) {
                selectedFormats.forEach(fmt => {
                    newVariants.push({
                        id: `v-${i}-${fmt}`,
                        nomenclature: `${productSku}-VAR${i + 1}-${fmt.replace(':', 'x')}`,
                        hook: `Variante ${i + 1} (${phase})`,
                        approved: false,
                        selected: false,
                        status: 'PENDIENTE',
                        format: fmt,
                        duration: '30s',
                        hookType: 'Mecanismo',
                        phase
                    });
                });
            }
            setVariants(newVariants);
            setStep('PRODUCTION');
            await simulateProduction(newVariants);
        } catch (e) {
            toast.error("Error al lanzar");
        } finally {
            setIsLaunching(false);
        }
    };

    const simulateProduction = async (items: Variant[]) => {
        const updated = [...items];
        for (let i = 0; i < updated.length; i++) {
            updated[i].status = 'GENERANDO';
            setVariants([...updated]);
            await new Promise(r => setTimeout(r, 600));
            updated[i].status = 'LISTO';
            updated[i].videoUrl = 'https://ai-videos.com/mass-preview.mp4';
            setVariants([...updated]);
            setProductionProgress(Math.round(((i + 1) / items.length) * 100));
        }
        toast.success("Producción completada");
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {step === 'CONFIG' ? (
                <div className="grid grid-cols-2 gap-6">
                    <div className="bg-white p-5 rounded-xl border border-[var(--border)] shadow-sm space-y-6">
                        <div className="flex items-center gap-2 px-1">
                            <div className="w-8 h-8 rounded-lg bg-[var(--cre-bg)] text-[var(--cre)] flex items-center justify-center border border-[var(--cre)]/10"><Zap size={16} /></div>
                            <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-primary)]">Configurar Fábrica</h3>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)] ml-1">Cant. Variantes</label>
                                <div className="flex bg-[var(--bg)] p-0.5 rounded-lg border border-[var(--border)]">
                                    {[5, 10, 20].map(n => (
                                        <button
                                            key={n} onClick={() => setNumVariants(n)}
                                            className={cn(
                                                "flex-1 h-7 rounded text-[10px] font-bold transition-all uppercase",
                                                numVariants === n ? "bg-white text-[var(--text-primary)] shadow-sm border border-[var(--border)]" : "text-[var(--text-tertiary)]"
                                            )}
                                        >
                                            {n} VAR
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)] ml-1">Qué varía</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {VARIATION_OPTIONS.map(opt => (
                                        <button
                                            key={opt.id} onClick={() => toggleVariation(opt.id)}
                                            className={cn(
                                                "h-8 px-3 rounded-lg border text-[10px] font-bold uppercase flex items-center gap-2 transition-all",
                                                selectedVariations.includes(opt.id) ? "bg-[var(--cre-bg)] border-[var(--cre)]/20 text-[var(--cre)]" : "bg-white border-[var(--border)] text-[var(--text-tertiary)]"
                                            )}
                                        >
                                            <div className={cn("w-3 h-3 rounded-sm border", selectedVariations.includes(opt.id) ? "bg-[var(--cre)] border-transparent flex items-center justify-center" : "border-[var(--border)]")}>
                                                {selectedVariations.includes(opt.id) && <CheckSquare size={10} className="text-white" />}
                                            </div>
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)] ml-1">Formatos Andromeda</label>
                                <div className="flex gap-2">
                                    {FORMATS.map(fmt => (
                                        <button
                                            key={fmt.id} onClick={() => toggleFormat(fmt.id)}
                                            className={cn(
                                                "flex-1 h-14 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all outline-none",
                                                selectedFormats.includes(fmt.id) ? "bg-[var(--cre-bg)] border-[var(--cre)] tex-[var(--cre)] shadow-sm" : "bg-white border-[var(--border)] text-[var(--text-tertiary)]"
                                            )}
                                        >
                                            <fmt.icon size={16} />
                                            <span className="text-[9px] font-bold uppercase">{fmt.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={handleLaunchFactory}
                                disabled={isLaunching}
                                className="w-full h-9 bg-[var(--cre)] text-white font-semibold text-xs uppercase tracking-wider rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
                            >
                                {isLaunching ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                                <span>Lanzar Producción Masiva</span>
                            </button>
                        </div>
                    </div>

                    <div className="bg-[var(--bg)]/50 border border-dashed border-[var(--border)] rounded-xl flex flex-col items-center justify-center p-8 text-center opacity-40">
                        <Layers size={32} className="mb-3 text-[var(--text-tertiary)]" />
                        <h4 className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-wider">Ready for Bulk Production</h4>
                        <p className="text-[10px] text-[var(--text-tertiary)] uppercase mt-2 leading-relaxed font-medium">Permutaciones automáticas optimizadas para Advantage+</p>
                    </div>
                </div>
            ) : (
                <div className="space-y-6 animate-in slide-in-from-bottom-4">
                    <div className="bg-white p-5 rounded-xl border border-[var(--border)] shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-[var(--cre-bg)] text-[var(--cre)] flex items-center justify-center border border-[var(--cre)]/10">
                                    {productionProgress < 100 ? <RefreshCw className="animate-spin" size={20} /> : <ShieldCheck size={20} />}
                                </div>
                                <div>
                                    <h3 className="text-[11px] font-bold text-[var(--text-primary)] uppercase">Producción en Masa</h3>
                                    <p className="text-[9px] text-[var(--text-tertiary)] font-medium uppercase">{variants.length} Variantes Registradas</p>
                                </div>
                            </div>
                            <span className="text-xl font-bold text-[var(--cre)] font-mono">{productionProgress}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-[var(--bg)] rounded-full border border-[var(--border)] overflow-hidden">
                            <div className="h-full bg-[var(--cre)] transition-all duration-500" style={{ width: `${productionProgress}%` }} />
                        </div>
                    </div>

                    <div className="grid grid-cols-5 gap-3">
                        {variants.map(v => (
                            <div key={v.id} className="bg-white rounded-xl border border-[var(--border)] overflow-hidden hover:border-[var(--cre)]/30 transition-all flex flex-col group relative">
                                <div className="aspect-[9/16] bg-black relative flex items-center justify-center">
                                    {v.videoUrl ? <video src={v.videoUrl} className="w-full h-full object-cover" controls /> : <div className="flex flex-col items-center gap-2 opacity-30"><Loader2 className="animate-spin text-white" size={16} /><span className="text-[8px] text-white font-bold uppercase">{v.status}</span></div>}
                                </div>
                                <div className="p-2.5 space-y-1.5">
                                    <h4 className="text-[10px] font-bold text-[var(--text-primary)] truncate uppercase leading-tight">{v.nomenclature}</h4>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[8px] font-bold bg-gray-100 px-1.5 py-0.5 rounded">{v.format}</span>
                                        <span className="text-[8px] font-bold text-[var(--cre)]">{v.duration}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function ConfigSelect({ label, value, options, onChange }: any) {
    return (
        <div className="space-y-1">
            <label className="text-[8px] font-bold uppercase tracking-widest text-[var(--text-tertiary)] ml-1">{label}</label>
            <select
                value={value} onChange={e => onChange(e.target.value)}
                className="w-full h-8 px-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[10px] font-semibold outline-none focus:border-[var(--cre)] appearance-none cursor-pointer"
            >
                {options.map((opt: any) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
        </div>
    );
}
