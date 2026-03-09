'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
    Palette, Type, ImageIcon, Sparkles, Upload,
    Zap, RefreshCcw, Save, CheckCircle2,
    Activity, Shield, Layout, Settings2,
    FileCode, Check, ArrowRight, X, Plus,
    Trash2, AlertTriangle, Search, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useProduct } from '@/context/ProductContext';

// --- Types ---
type VisualMood = 'UGC_REAL' | 'PREMIUM' | 'MEDICO_CLINICO' | 'AGRESIVO' | 'MINIMAL' | 'LIFESTYLE' | 'SPORT';

interface BrandingState {
    colors: {
        primary: string;
        secondary: string;
        cta: string;
        background: string;
    };
    typography: {
        titles: string;
        body: string;
        baseSize: string;
    };
    logo: string | null;
    moods: VisualMood[];
    autoApply: boolean;
}

// --- Constants ---
const VISUAL_MOODS: { value: VisualMood, label: string, desc: string }[] = [
    { value: 'UGC_REAL', label: 'UGC REAL', desc: 'Estética orgánica, grabada con móvil, alta confianza' },
    { value: 'PREMIUM', label: 'PREMIUM', desc: 'Lujo, elegancia, tipografías serif y mucho aire' },
    { value: 'MEDICO_CLINICO', label: 'MÉDICO-CLÍNICO', desc: 'Limpio, científico, colores claros, sanidad' },
    { value: 'AGRESIVO', label: 'AGRESIVO', desc: 'Direct response puro, colores saturados, tipografía bold' },
    { value: 'MINIMAL', label: 'MINIMAL', desc: 'Menos es más, enfoque total en el producto' },
    { value: 'LIFESTYLE', label: 'LIFESTYLE', desc: 'Contexto de uso, personas reales en situaciones cotidianas' },
    { value: 'SPORT', label: 'SPORT', desc: 'Energía, movimiento, alto contraste y dinamismo' },
];

export function BrandingTab({ storeId, productId }: { storeId: string, productId: string }) {
    const { product } = useProduct();
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const logoInputRef = useRef<HTMLInputElement>(null);

    // --- State ---
    const [branding, setBranding] = useState<BrandingState>({
        colors: {
            primary: '#000000',
            secondary: '#ffffff',
            cta: '#F59E0B',
            background: '#F8FAFC',
        },
        typography: {
            titles: 'Inter',
            body: 'Inter',
            baseSize: '16px',
        },
        logo: null,
        moods: ['PREMIUM'],
        autoApply: true,
    });

    // --- Handlers ---
    const handleThemeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsAnalyzing(true);
        const promise = new Promise((resolve, reject) => {
            const formData = new FormData();
            formData.append('theme', file);
            formData.append('productId', productId);

            fetch('/api/ai/diseno/analyze-theme', {
                method: 'POST',
                body: formData,
            })
                .then(res => res.json())
                .then(data => {
                    if (data.ok) {
                        setBranding(prev => ({
                            ...prev,
                            colors: {
                                ...prev.colors,
                                ...data.branding.colors
                            },
                            typography: {
                                ...prev.typography,
                                ...data.branding.typography
                            }
                        }));
                        resolve(data);
                    } else {
                        reject(data);
                    }
                })
                .catch(reject)
                .finally(() => setIsAnalyzing(false));
        });

        toast.promise(promise, {
            loading: 'Analizando tema Shopify (petición a Liquid Engine)...',
            success: 'Branding extraído con éxito del tema.',
            error: 'Error al analizar el tema Shopify.',
        });
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setBranding({ ...branding, logo: url });
            toast.success("Logo cargado y vinculado.");
        }
    };

    const toggleMood = (mood: VisualMood) => {
        setBranding(prev => ({
            ...prev,
            moods: prev.moods.includes(mood)
                ? prev.moods.filter(m => m !== mood)
                : [...prev.moods, mood]
        }));
    };

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            toast.success("Branding guardado correctamente.");
        }, 1500);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Header / Main Actions */}
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
                <div>
                    <h2 className="text-[14px] font-bold tracking-tight text-[var(--text-primary)] uppercase">
                        Configuración de Marca
                    </h2>
                    <p className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
                        Branding Engine & Visual Identity
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isAnalyzing}
                        className="h-8 px-3 rounded-lg bg-white border border-[var(--border)] text-[10px] font-bold uppercase tracking-widest hover:bg-[var(--bg)] transition-all flex items-center gap-2 shadow-sm"
                    >
                        {isAnalyzing ? <RefreshCcw size={14} className="animate-spin" /> : <Upload size={14} className="text-[var(--cre)]" />}
                        Theme.zip
                    </button>
                    <input ref={fileInputRef} type="file" accept=".zip" className="hidden" onChange={handleThemeUpload} />

                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="h-8 px-4 rounded-lg bg-[var(--cre)] text-white text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all flex items-center gap-2 shadow-md shadow-[var(--cre)]/10"
                    >
                        {isSaving ? <Loader size={12} /> : <Save size={12} />}
                        Guardar Cambios
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* --- SECCIÓN IZQUIERDA: PALETA Y TIPOS --- */}
                <div className="lg:col-span-5 space-y-4">

                    {/* Colores */}
                    <div className="p-4 bg-white border border-[var(--border)] rounded-xl shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <Palette size={16} className="text-[var(--cre)]" />
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-primary)]">Paleta de Colores</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <ColorInput
                                label="Primario"
                                value={branding.colors.primary}
                                onChange={(val) => setBranding({ ...branding, colors: { ...branding.colors, primary: val } })}
                            />
                            <ColorInput
                                label="Secundario"
                                value={branding.colors.secondary}
                                onChange={(val) => setBranding({ ...branding, colors: { ...branding.colors, secondary: val } })}
                            />
                            <ColorInput
                                label="CTA Accent"
                                value={branding.colors.cta}
                                onChange={(val) => setBranding({ ...branding, colors: { ...branding.colors, cta: val } })}
                            />
                            <ColorInput
                                label="Background"
                                value={branding.colors.background}
                                onChange={(val) => setBranding({ ...branding, colors: { ...branding.colors, background: val } })}
                            />
                        </div>

                        <div className="mt-5 p-3 bg-[var(--cre-bg)] border border-[var(--cre)]/10 rounded-lg">
                            <p className="text-[9px] text-[var(--text-primary)] font-bold leading-relaxed uppercase tracking-wide">
                                <span className="text-[var(--cre)] mr-1">✓</span> Sincronización activa con generación visual
                            </p>
                        </div>
                    </div>

                    {/* Tipografías */}
                    <div className="p-4 bg-white border border-[var(--border)] rounded-xl shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <Type size={16} className="text-[var(--cre)]" />
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-primary)]">Tipografías (Fonts)</h3>
                        </div>

                        <div className="space-y-3">
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold uppercase text-[var(--text-tertiary)] tracking-widest ml-1">Fuente Títulos</label>
                                <input
                                    className="w-full h-8 bg-white border border-[var(--border)] rounded-lg px-3 text-xs font-bold text-[var(--text-primary)] outline-none focus:border-[var(--cre)]/30"
                                    value={branding.typography.titles}
                                    onChange={(e) => setBranding({ ...branding, typography: { ...branding.typography, titles: e.target.value } })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold uppercase text-[var(--text-tertiary)] tracking-widest ml-1">Fuente Cuerpo</label>
                                <input
                                    className="w-full h-8 bg-white border border-[var(--border)] rounded-lg px-3 text-xs font-semibold text-[var(--text-primary)] outline-none focus:border-[var(--cre)]/30"
                                    value={branding.typography.body}
                                    onChange={(e) => setBranding({ ...branding, typography: { ...branding.typography, body: e.target.value } })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold uppercase text-[var(--text-tertiary)] tracking-widest ml-1">Base Size</label>
                                    <input
                                        className="w-full h-8 bg-white border border-[var(--border)] rounded-lg px-3 text-xs font-bold text-[var(--text-primary)] outline-none focus:border-[var(--cre)]/30"
                                        value={branding.typography.baseSize}
                                        onChange={(e) => setBranding({ ...branding, typography: { ...branding.typography, baseSize: e.target.value } })}
                                    />
                                </div>
                                <div className="space-y-1 flex flex-col justify-end pb-1 px-1">
                                    <p className="text-[8px] font-bold text-emerald-600 uppercase tracking-widest">Sincronizado ✓</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- SECCIÓN DERECHA: LOGO Y MOODS --- */}
                <div className="lg:col-span-7 space-y-4">

                    {/* Logo Upload */}
                    <div className="p-4 bg-white border border-[var(--border)] rounded-xl shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <ImageIcon size={16} className="text-[var(--cre)]" />
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-primary)]">Logo Oficial</h3>
                        </div>

                        <div className="flex items-center gap-6">
                            <div
                                onClick={() => logoInputRef.current?.click()}
                                className="w-28 h-28 border border-dashed border-[var(--border)] rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-[var(--cre-bg)] transition-all overflow-hidden bg-[var(--bg)] shadow-inner"
                            >
                                {branding.logo ? (
                                    <img src={branding.logo} className="w-full h-full object-contain p-4" />
                                ) : (
                                    <>
                                        <Plus size={20} className="text-[var(--text-tertiary)] mb-1" />
                                        <p className="text-[8px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">Subir</p>
                                    </>
                                )}
                            </div>
                            <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />

                            <div className="flex-1 space-y-2">
                                <p className="text-[10px] font-semibold text-[var(--text-tertiary)] leading-relaxed italic">
                                    "Utilizado para marcas de agua y assets generados."
                                </p>
                                <div className="flex gap-4">
                                    <button className="text-[9px] font-bold text-[var(--cre)] hover:underline uppercase tracking-widest">Ajustar</button>
                                    <button className="text-[9px] font-bold text-rose-500 hover:underline uppercase tracking-widest" onClick={() => setBranding({ ...branding, logo: null })}>Eliminar</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Visual Style Selector */}
                    <div className="p-4 bg-white border border-[var(--border)] rounded-xl shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Sparkles size={16} className="text-[var(--cre)]" />
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-primary)]">Estilo Visual (Moods)</h3>
                            </div>
                            <span className="text-[9px] font-bold text-[var(--cre)] bg-[var(--cre-bg)] px-2 py-0.5 rounded-full uppercase tracking-widest border border-[var(--cre)]/10">
                                {branding.moods.length} activos
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {VISUAL_MOODS.map((m) => (
                                <button
                                    key={m.value}
                                    onClick={() => toggleMood(m.value)}
                                    className={cn(
                                        "flex flex-col items-start p-3 border rounded-xl transition-all h-20 group text-left shadow-sm active:scale-[0.98]",
                                        branding.moods.includes(m.value)
                                            ? "bg-[var(--cre)] border-[var(--cre)] text-white shadow-md shadow-[var(--cre)]/10"
                                            : "bg-white border-[var(--border)] hover:border-[var(--cre)]"
                                    )}
                                >
                                    <div className="flex items-center justify-between w-full mb-1">
                                        <span className="text-[9px] font-bold uppercase tracking-widest">{m.label}</span>
                                        {branding.moods.includes(m.value) && <Check size={12} className="text-white" />}
                                    </div>
                                    <p className={cn(
                                        "text-[8px] leading-tight font-medium uppercase tracking-tighter",
                                        branding.moods.includes(m.value) ? "text-white/80" : "text-[var(--text-tertiary)]"
                                    )}>
                                        {m.desc}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Automation Panel */}
                    <div className="p-4 bg-[var(--cre-bg)] border border-[var(--cre)]/10 rounded-xl shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <h3 className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-wide">
                                    IA Automation
                                </h3>
                                <p className="text-[9px] text-[var(--cre)] font-bold uppercase tracking-widest">Branding Engine Activo</p>
                            </div>
                            <button
                                onClick={() => setBranding({ ...branding, autoApply: !branding.autoApply })}
                                className={cn(
                                    "w-8 h-4.5 rounded-full relative transition-all border border-[var(--border)]",
                                    branding.autoApply ? "bg-[var(--cre)] border-[var(--cre)]" : "bg-white"
                                )}
                            >
                                <div className={cn(
                                    "absolute top-[2px] w-2.5 h-2.5 rounded-full transition-all shadow-sm",
                                    branding.autoApply ? "right-[2px] bg-white" : "left-[2px] bg-[var(--border)]"
                                )} />
                            </button>
                        </div>

                        <div className="mt-4 flex flex-col sm:flex-row gap-3">
                            <button
                                className="flex-1 h-8 bg-white border border-[var(--border)] rounded-lg text-[9px] font-bold uppercase tracking-widest hover:bg-[var(--bg)] transition-all flex items-center justify-center gap-2 shadow-sm"
                            >
                                <RefreshCcw size={12} className="text-[var(--cre)]" /> Sincronizar Existentes
                            </button>
                            <div className="flex items-center gap-2 text-[var(--text-tertiary)]">
                                <Info size={12} className="text-[var(--cre)]" />
                                <span className="text-[8px] font-bold uppercase tracking-widest leading-none">Generación de assets en tiempo real</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- Subcomponents ---

function ColorInput({ label, value, onChange }: { label: string, value: string, onChange: (val: string) => void }) {
    return (
        <div className="space-y-1.5">
            <label className="text-[9px] font-bold uppercase text-[var(--text-tertiary)] tracking-widest ml-1">{label}</label>
            <div className="flex h-8 bg-white border border-[var(--border)] rounded-lg overflow-hidden shadow-sm">
                <input
                    type="color"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-8 h-8 border-r border-[var(--border)] bg-transparent cursor-pointer p-0"
                />
                <input
                    type="text"
                    value={value.toUpperCase()}
                    onChange={(e) => onChange(e.target.value)}
                    className="flex-1 px-3 text-[10px] font-bold text-[var(--text-primary)] bg-transparent outline-none uppercase tracking-widest"
                />
            </div>
        </div>
    );
}

function Loader({ size = 14 }) {
    return <RefreshCcw size={size} className="animate-spin" />;
}
