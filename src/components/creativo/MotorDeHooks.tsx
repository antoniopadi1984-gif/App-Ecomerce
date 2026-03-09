'use client';

import React, { useState, useEffect } from 'react';
import {
    Zap, Clock, Copy, Save, Wand2,
    CheckCircle2, AlertCircle, BarChart3,
    ChevronDown, ChevronUp, Trash2, Loader2,
    Target, Layout, FileText, MousePointer2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const HOOK_TYPES = [
    'Miedo', 'Curiosidad', 'Autoridad', 'Humor', 'Confrontación', 'Comparativo',
    'Testimonial', 'Pattern Interrupt', 'Identidad', 'Vergüenza', 'Mecanismo', 'Resultado'
];

type FunnelPhase = 'FRÍO' | 'TEMPLADO' | 'CALIENTE' | 'RETARGETING';

interface Hook {
    id: string;
    text: string;
    type: string;
    phase: FunnelPhase;
    aggressiveness: number;
    meta_hook_rate?: number | null;
    saved?: boolean;
}

export function MotorDeHooks({
    conceptId,
    conceptName,
    storeId,
    productId,
    onUseHook
}: {
    conceptId: string,
    conceptName: string,
    storeId: string,
    productId: string,
    onUseHook?: (hook: string) => void
}) {
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [amount, setAmount] = useState<number>(30);
    const [phase, setPhase] = useState<FunnelPhase>('FRÍO');
    const [aggressiveness, setAggressiveness] = useState<number>(7);
    const [language, setLanguage] = useState('Español');
    const [isGenerating, setIsGenerating] = useState(false);
    const [results, setResults] = useState<Hook[]>([]);
    const [bank, setBank] = useState<Hook[]>([]);
    const [showBank, setShowBank] = useState(false);

    useEffect(() => {
        if (conceptId) {
            fetchSavedHooks();
        }
    }, [conceptId, productId]);

    const fetchSavedHooks = async () => {
        try {
            const res = await fetch(`/api/centro-creativo/hooks?productId=${productId}&conceptId=${conceptId}`);
            const data = await res.json();
            setBank(data.hooks || []);
        } catch (e) {
            console.error("Error fetching saved hooks", e);
        }
    };

    const toggleType = (type: string) => {
        setSelectedTypes(prev =>
            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
        );
    };

    const handleGenerate = async () => {
        if (selectedTypes.length === 0) {
            toast.error("Selecciona al menos un tipo de hook");
            return;
        }
        setIsGenerating(true);
        try {
            const response = await fetch('/api/centro-creativo/generar-hooks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId,
                    conceptId,
                    tipos: selectedTypes,
                    cantidad: amount,
                    fase: phase,
                    aggressiveness,
                    idioma: language
                })
            });
            const data = await response.json();
            if (data.hooks) {
                setResults(data.hooks);
                toast.success(`Generados ${data.hooks.length} hooks con éxito`);
            }
        } catch (error) {
            toast.error("Error al generar hooks");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSaveHook = async (hook: Hook) => {
        try {
            const res = await fetch('/api/centro-creativo/hooks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...hook, conceptId, productId })
            });
            if (res.ok) {
                toast.success("Hook guardado en el banco");
                setResults(prev => prev.map(h => h.id === hook.id ? { ...h, saved: true } : h));
                fetchSavedHooks();
            }
        } catch (e) {
            toast.error("Error al guardar hook");
        }
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copiado al portapapeles");
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* CONFIGURACIÓN */}
            <div className="bg-white p-5 rounded-xl border border-[var(--border)] shadow-sm space-y-6">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)] ml-1">Tipos de hook</label>
                        <div className="flex flex-wrap gap-1.5">
                            {HOOK_TYPES.map(type => (
                                <button
                                    key={type}
                                    onClick={() => toggleType(type)}
                                    className={cn(
                                        "h-7 px-3 rounded-lg text-[9px] font-bold transition-all border uppercase tracking-wider",
                                        selectedTypes.includes(type)
                                            ? "bg-[var(--cre-bg)] text-[var(--cre)] border-[var(--cre)]/20"
                                            : "bg-transparent text-[var(--text-tertiary)] border-[var(--border)] hover:border-[var(--text-tertiary)]"
                                    )}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)] ml-1">Cantidad</label>
                            <select
                                value={amount}
                                onChange={e => setAmount(Number(e.target.value))}
                                className="w-full h-8 px-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-xs font-semibold outline-none cursor-pointer focus:border-[var(--cre)]"
                            >
                                {[5, 15, 30, 50, 100].map(v => <option key={v} value={v}>{v} Hooks</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)] ml-1">Fase</label>
                            <div className="flex bg-[var(--bg)] p-0.5 rounded-lg border border-[var(--border)]">
                                {['FRÍO', 'CALIENTE'].map(p => (
                                    <button
                                        key={p}
                                        onClick={() => setPhase(p as FunnelPhase)}
                                        className={cn(
                                            "flex-1 h-7 rounded text-[9px] font-bold transition-all uppercase",
                                            phase === p ? "bg-white text-[var(--text-primary)] shadow-sm border border-[var(--border)]" : "text-[var(--text-tertiary)]"
                                        )}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)] ml-1">Agresividad: {aggressiveness}</label>
                            <input
                                type="range" min="1" max="10"
                                value={aggressiveness}
                                onChange={e => setAggressiveness(Number(e.target.value))}
                                className="w-full h-8 accent-[var(--cre)]"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)] ml-1">Idioma</label>
                            <select
                                value={language}
                                onChange={e => setLanguage(e.target.value)}
                                className="w-full h-8 px-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-xs font-semibold outline-none cursor-pointer focus:border-[var(--cre)]"
                            >
                                {['Español', 'Inglés', 'Francés'].map(lang => (
                                    <option key={lang} value={lang}>{lang}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !conceptId}
                    className="w-full h-9 bg-[var(--cre)] text-white font-semibold text-xs uppercase tracking-wider rounded-lg hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {isGenerating ? (
                        <>
                            <Loader2 size={16} className="animate-spin" />
                            <span> Generando contenido...</span>
                        </>
                    ) : (
                        <>
                            <Zap size={16} />
                            <span>Generar Hooks Maestros</span>
                        </>
                    )}
                </button>
            </div>

            {/* RESULTADOS */}
            {results.length > 0 && (
                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-4">
                    {results.map((hook) => (
                        <div key={hook.id} className="bg-white p-5 rounded-xl border border-[var(--border)] shadow-sm flex flex-col hover:border-[var(--cre)]/30 transition-all group">
                            <div className="flex justify-between items-start mb-3">
                                <span className="px-2 py-0.5 rounded bg-[var(--cre-bg)] text-[var(--cre)] text-[9px] font-bold uppercase tracking-wider border border-[var(--cre)]/10">{hook.type}</span>
                                {hook.meta_hook_rate && (
                                    <span className="text-[10px] font-bold text-emerald-600 uppercase flex items-center gap-1"><BarChart3 size={12} /> {hook.meta_hook_rate}%</span>
                                )}
                            </div>
                            <p className="text-xs font-medium text-[var(--text-primary)] leading-relaxed italic mb-4">"{hook.text}"</p>
                            <div className="flex gap-2 mt-auto">
                                <button
                                    onClick={() => onUseHook?.(hook.text)}
                                    className="flex-1 h-8 bg-[var(--bg)] border border-[var(--border)] text-[var(--text-secondary)] text-[10px] font-bold uppercase hover:bg-white hover:border-[var(--cre)] transition-all flex items-center justify-center gap-1.5"
                                >
                                    <FileText size={14} /> Usar Script
                                </button>
                                <button
                                    onClick={() => handleSaveHook(hook)}
                                    disabled={hook.saved}
                                    className={cn(
                                        "flex-1 h-8 border text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-1.5",
                                        hook.saved ? "bg-emerald-50 border-emerald-500 text-emerald-600" : "bg-white border-[var(--border)] text-[var(--text-tertiary)] hover:bg-[var(--bg)]"
                                    )}
                                >
                                    {hook.saved ? <CheckCircle2 size={14} /> : <Save size={14} />} {hook.saved ? 'Guardado' : 'Guardar'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* BANCO */}
            <div className="bg-white border border-[var(--border)] rounded-xl overflow-hidden shadow-sm">
                <button
                    onClick={() => setShowBank(!showBank)}
                    className="w-full p-4 flex items-center justify-between hover:bg-[var(--bg)]/10 transition-all"
                >
                    <div className="flex items-center gap-3 text-left">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center"><Save size={16} /></div>
                        <div>
                            <h5 className="text-[10px] font-bold text-[var(--text-primary)] uppercase tracking-wider">Banco de Hooks</h5>
                            <p className="text-[9px] text-[var(--text-tertiary)] font-medium uppercase">{bank.length} Guardados</p>
                        </div>
                    </div>
                    {showBank ? <ChevronUp size={16} className="text-[var(--text-tertiary)]" /> : <ChevronDown size={16} className="text-[var(--text-tertiary)]" />}
                </button>

                {showBank && (
                    <div className="border-t border-[var(--border)] bg-[var(--bg)]/5">
                        <div className="p-3 overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest border-b border-[var(--border)]">
                                        <th className="pb-2 px-3">Hook Principal</th>
                                        <th className="pb-2">Tipo</th>
                                        <th className="pb-2">HR%</th>
                                        <th className="pb-2 text-right pr-3">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bank.map(h => (
                                        <tr key={h.id} className="group border-b border-[var(--border)] last:border-0 hover:bg-white transition-all">
                                            <td className="py-2.5 px-3">
                                                <p className="text-[11px] font-medium text-[var(--text-primary)] truncate max-w-sm italic">"{h.text}"</p>
                                            </td>
                                            <td className="py-2.5">
                                                <span className="text-[9px] font-bold uppercase bg-[var(--bg)] px-1.5 py-0.5 rounded border border-[var(--border)]">{h.type}</span>
                                            </td>
                                            <td className="py-2.5">
                                                <span className="text-[10px] font-bold text-emerald-600">{h.meta_hook_rate ? `${h.meta_hook_rate}%` : '—'}</span>
                                            </td>
                                            <td className="py-2.5 pr-3 text-right">
                                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100">
                                                    <button className="p-1 hover:text-[var(--cre)]" onClick={() => handleCopy(h.text)}><Copy size={12} /></button>
                                                    <button className="p-1 hover:text-rose-500"><Trash2 size={12} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
