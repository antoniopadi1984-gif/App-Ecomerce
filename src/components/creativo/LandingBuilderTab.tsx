'use client';
import React, { useState, useRef } from 'react';
import {
    LayoutTemplate, Sparkles, FolderOpen, Image, Code2,
    Loader2, ChevronDown, ChevronRight, Download, Copy, Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { TranslationToggle } from '@/components/ui/translation-toggle';
import { cn } from '@/lib/utils';

const STRUCT_TYPES = [
    { value: 'PDP', label: 'Product Page (PDP)' },
    { value: 'ADVERTORIAL', label: 'Advertorial + PDP' },
    { value: 'LISTICLE', label: 'Listicle + PDP' },
    { value: 'VECTOR', label: 'Vector Específico' },
];
const FRAMEWORKS = [
    { value: 'CASHVERTISING', label: 'Cashvertising (Direct Response)' },
    { value: 'BREAKTHROUGH', label: 'Breakthrough Advertising (Awareness)' },
    { value: 'HORMOZI', label: 'Hormozi — Value Equation Grand Slam' },
];
const SECTIONS = [
    'Hero + Titular', 'Problema / Agitación', 'Mecanismo Único',
    'Beneficios con Pruebas', 'Testimonios + Reviews', 'Garantía',
    'Oferta + Urgencia', 'FAQ Objeciones', 'CTA Principal',
];

interface GeneratedSection {
    name: string;
    content: string;
    liquid?: string;
    lang: string;
}

export function LandingBuilderTab({ storeId, productId, marketLang }: {
    storeId: string; productId: string; marketLang?: string;
}) {
    const [struct, setStruct] = useState('PDP');
    const [framework, setFramework] = useState('CASHVERTISING');
    const [angle, setAngle] = useState('');
    const [selectedSections, setSelectedSections] = useState<Set<string>>(
        new Set(['Hero + Titular', 'Mecanismo Único', 'Testimonios + Reviews', 'Garantía', 'CTA Principal'])
    );
    const [generating, setGenerating] = useState(false);
    const [generatedSections, setGeneratedSections] = useState<GeneratedSection[]>([]);
    const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0]));
    const [driveImages, setDriveImages] = useState<any[]>([]);
    const [loadingImages, setLoadingImages] = useState(false);
    const [themeFile, setThemeFile] = useState<string | null>(null);
    const themeInputRef = useRef<HTMLInputElement>(null);

    const toggleSection = (s: string) => {
        setSelectedSections(prev => {
            const n = new Set(prev);
            n.has(s) ? n.delete(s) : n.add(s);
            return n;
        });
    };

    const loadDriveImages = async () => {
        setLoadingImages(true);
        try {
            const res = await fetch(`/api/drive/list?productId=${productId}&subPath=04_ASSETS/imagenes`, {
                headers: { 'X-Store-Id': storeId }
            });
            const d = await res.json();
            setDriveImages(d.files ?? []);
        } catch { }
        finally { setLoadingImages(false); }
    };

    const generate = async () => {
        if (!productId || productId === 'GLOBAL') {
            toast.error('Selecciona un producto'); return;
        }
        setGenerating(true);
        try {
            const res = await fetch('/api/landing-builder/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Store-Id': storeId },
                body: JSON.stringify({
                    productId, storeId, struct, framework, angle,
                    sections: Array.from(selectedSections),
                    marketLang: marketLang ?? 'ES',
                }),
            });
            const d = await res.json();
            if (d.ok) {
                setGeneratedSections(d.sections ?? []);
                setExpandedSections(new Set([0]));
                toast.success(`${d.sections?.length ?? 0} secciones generadas`);
            } else throw new Error(d.error);
        } catch (e: any) {
            toast.error(e.message);
        } finally { setGenerating(false); }
    };

    const handleThemeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        toast.info('Analizando tema Shopify…');
        const fd = new FormData();
        fd.append('theme', file);
        fd.append('productId', productId);
        try {
            const res = await fetch('/api/landing-builder/analyze-theme', {
                method: 'POST', body: fd, headers: { 'X-Store-Id': storeId }
            });
            const d = await res.json();
            if (d.ok) {
                setThemeFile(file.name);
                toast.success(`Tema analizado: ${d.sections?.length ?? 0} secciones detectadas`);
            }
        } catch { toast.error('Error al analizar tema'); }
    };

    return (
        <div className="flex gap-5 min-h-[600px]">
            {/* Left Panel */}
            <div className="w-64 shrink-0 space-y-4">
                {/* Config */}
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 space-y-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Configuración</p>
                    <div className="space-y-1.5">
                        <label className="text-[8px] font-black uppercase tracking-widest text-[var(--text-dim)]">Estructura</label>
                        <select value={struct} onChange={e => setStruct(e.target.value)}
                            className="w-full h-8 px-2 text-[10px] bg-[var(--surface2)] border border-[var(--border)] rounded-lg">
                            {STRUCT_TYPES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[8px] font-black uppercase tracking-widest text-[var(--text-dim)]">Framework Copy</label>
                        <select value={framework} onChange={e => setFramework(e.target.value)}
                            className="w-full h-8 px-2 text-[10px] bg-[var(--surface2)] border border-[var(--border)] rounded-lg">
                            {FRAMEWORKS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[8px] font-black uppercase tracking-widest text-[var(--text-dim)]">Ángulo / Vector</label>
                        <input value={angle} onChange={e => setAngle(e.target.value)}
                            placeholder="Mecanismo único, dolor, etc." className="w-full h-8 px-2 text-[10px] bg-[var(--surface2)] border border-[var(--border)] rounded-lg focus:outline-none" />
                    </div>
                </div>

                {/* Sections */}
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 space-y-2">
                    <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Secciones</p>
                    {SECTIONS.map(s => (
                        <label key={s} className="flex items-center gap-2 cursor-pointer hover:bg-[var(--surface2)] px-1 py-0.5 rounded">
                            <input type="checkbox" checked={selectedSections.has(s)} onChange={() => toggleSection(s)}
                                className="accent-[var(--cre)] w-3 h-3" />
                            <span className="text-[10px] text-[var(--text)]">{s}</span>
                        </label>
                    ))}
                </div>

                {/* Drive Images */}
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                        <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Imágenes Drive</p>
                        <button onClick={loadDriveImages} className="text-[8px] text-[var(--inv)] font-bold hover:underline">
                            {loadingImages ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Cargar'}
                        </button>
                    </div>
                    {driveImages.slice(0, 6).map((img, i) => (
                        <div key={i} className="flex items-center gap-2 text-[9px] text-[var(--text-muted)] truncate">
                            <Image className="w-3 h-3 shrink-0" />
                            <span className="truncate">{img.name}</span>
                        </div>
                    ))}
                    {driveImages.length === 0 && !loadingImages && (
                        <p className="text-[9px] text-[var(--text-dim)]">Pulsa "Cargar" para ver las imágenes del producto</p>
                    )}
                </div>

                {/* Theme Upload */}
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 space-y-2">
                    <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Archivo Tema Shopify</p>
                    <button onClick={() => themeInputRef.current?.click()}
                        className="w-full flex items-center justify-center gap-2 py-2 border-2 border-dashed border-[var(--border-high)] rounded-xl text-[9px] font-bold text-[var(--text-muted)] hover:border-[var(--cre)]/40 hover:text-[var(--cre)] transition-colors">
                        <FolderOpen className="w-3.5 h-3.5" />
                        {themeFile ?? 'Subir theme.zip'}
                    </button>
                    <input ref={themeInputRef} type="file" accept=".zip,.json" className="hidden" onChange={handleThemeUpload} />
                </div>

                <button onClick={generate} disabled={generating || !productId || productId === 'GLOBAL'}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--cre)] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 disabled:opacity-50 transition-all">
                    {generating ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generando…</> :
                        <><Sparkles className="w-3.5 h-3.5" /> Generar Landing</>}
                </button>
            </div>

            {/* Right: Generated sections */}
            <div className="flex-1 space-y-3">
                {generatedSections.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full border-2 border-dashed border-[var(--border-high)] rounded-xl opacity-50">
                        <LayoutTemplate className="w-10 h-10 mb-3 text-[var(--text-dim)]" />
                        <p className="text-[11px] font-bold text-[var(--text-muted)]">Preview aparece aquí</p>
                        <p className="text-[10px] text-[var(--text-dim)] mt-1 max-w-xs text-center">
                            Configura la estructura y pulsa "Generar Landing"
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between">
                            <p className="text-[11px] font-black text-[var(--text)]">
                                {generatedSections.length} secciones generadas — {marketLang !== 'ES' ? marketLang : 'ES'}
                            </p>
                            <button onClick={() => {
                                const all = generatedSections.map(s => `<!-- ${s.name} -->\n${s.content}`).join('\n\n');
                                navigator.clipboard.writeText(all);
                                toast.success('Copiado al portapapeles');
                            }} className="flex items-center gap-1 text-[9px] font-black text-[var(--inv)] hover:underline">
                                <Copy className="w-3 h-3" /> Copiar todo
                            </button>
                        </div>

                        {generatedSections.map((section, i) => (
                            <div key={i} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
                                <button
                                    onClick={() => setExpandedSections(prev => {
                                        const n = new Set(prev);
                                        n.has(i) ? n.delete(i) : n.add(i);
                                        return n;
                                    })}
                                    className="w-full flex items-center justify-between p-3 text-left hover:bg-[var(--surface2)] transition-colors">
                                    <span className="text-[11px] font-black text-[var(--text)]">{section.name}</span>
                                    <div className="flex items-center gap-2">
                                        <button onClick={e => {
                                            e.stopPropagation();
                                            navigator.clipboard.writeText(section.content);
                                            toast.success('Sección copiada');
                                        }} className="p-1 rounded hover:bg-[var(--surface2)]">
                                            <Copy className="w-3 h-3 text-[var(--text-dim)]" />
                                        </button>
                                        {expandedSections.has(i) ?
                                            <ChevronDown className="w-4 h-4 text-[var(--text-dim)]" /> :
                                            <ChevronRight className="w-4 h-4 text-[var(--text-dim)]" />
                                        }
                                    </div>
                                </button>

                                {expandedSections.has(i) && (
                                    <div className="px-4 pb-4 border-t border-[var(--border)] pt-3">
                                        {marketLang && marketLang !== 'ES' ? (
                                            <TranslationToggle
                                                text={section.content}
                                                marketLang={marketLang}
                                                context="landing page section">
                                                {(text, lang) => (
                                                    <div className={cn(
                                                        'text-[11px] text-[var(--text)] leading-relaxed whitespace-pre-wrap p-3 bg-[var(--surface2)] rounded-lg',
                                                        lang === 'es' && 'italic opacity-90'
                                                    )}>
                                                        {text}
                                                    </div>
                                                )}
                                            </TranslationToggle>
                                        ) : (
                                            <div className="text-[11px] text-[var(--text)] leading-relaxed whitespace-pre-wrap p-3 bg-[var(--surface2)] rounded-lg">
                                                {section.content}
                                            </div>
                                        )}
                                        {section.liquid && (
                                            <details className="mt-3">
                                                <summary className="text-[9px] font-black uppercase tracking-widest text-[var(--text-dim)] cursor-pointer flex items-center gap-1">
                                                    <Code2 className="w-3 h-3" /> Código Liquid/HTML
                                                </summary>
                                                <pre className="mt-2 p-3 bg-[var(--surface2)] rounded-lg text-[9px] font-mono overflow-x-auto text-[var(--text-muted)] max-h-48 overflow-y-auto">
                                                    {section.liquid}
                                                </pre>
                                            </details>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </>
                )}
            </div>
        </div>
    );
}
