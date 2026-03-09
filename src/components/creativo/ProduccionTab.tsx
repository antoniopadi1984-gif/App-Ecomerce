'use client';

import React, { useState, useEffect } from 'react';
import {
    Plus, Search, Filter, ChevronRight,
    Zap, List, Sparkles, Target,
    BadgeCheck, Clock, MoreVertical,
    BarChart3, Video, FileText, Image as ImageIcon, Monitor, X, RefreshCw, Loader2, Bot, TrendingUp, Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProduct } from '@/context/ProductContext';
import { toast } from 'sonner';
import { MotorDeHooks } from './MotorDeHooks';
import { ConstructorDeVideo } from './ConstructorDeVideo';
import { FabricaEnMasa } from './FabricaEnMasa';
import { TablaCreativa } from './TablaCreativa';

interface Concept {
    id: string;
    code: string;
    name: string;
    type: string;
    meta_ad_id: string | null;
    status: 'ACTIVE' | 'DRAFT' | 'WINNER' | 'PAUSED';
    creatives_count: number;
}

type ConceptType = 'Mecanismo' | 'Problema' | 'Solución' | 'Miedo' | 'Error' | 'Prueba';

const CONCEPT_TYPES = [
    'Todos', 'Mecanismo', 'Problema', 'Solución', 'Miedo', 'Error', 'Prueba'
];

export function ProduccionTab({ storeId, productId }: { storeId: string; productId: string }) {
    const { product } = useProduct();
    const [concepts, setConcepts] = useState<Concept[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeConceptId, setActiveConceptId] = useState<string | null>(null);
    const [filterType, setFilterType] = useState('Todos');

    // Modal state
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newConcept, setNewConcept] = useState({ name: '', type: 'Mecanismo' as ConceptType, description: '' });
    const [isSaving, setIsSaving] = useState(false);
    const [isLaunchingAI, setIsLaunchingAI] = useState(false);
    const [iaConfig, setIaConfig] = useState<any>(null);

    // Shared State between Section A and B
    const [activeHook, setActiveHook] = useState('');

    useEffect(() => {
        fetchConcepts();
    }, [productId]);

    const fetchConcepts = async () => {
        if (!productId || productId === 'GLOBAL') return;
        setIsLoading(true);
        try {
            const res = await fetch(`/api/centro-creativo/conceptos?productId=${productId}`);
            const data = await res.json();
            if (data.concepts) {
                setConcepts(data.concepts);
                if (data.concepts.length > 0 && !activeConceptId) {
                    setActiveConceptId(data.concepts[0].id);
                }
            }
        } catch (e) {
            console.error("Error fetching concepts", e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateConcept = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newConcept.name) return;
        setIsSaving(true);
        try {
            const res = await fetch('/api/centro-creativo/conceptos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...newConcept, productId, storeId })
            });
            const data = await res.json();
            if (data.concept) {
                setConcepts(prev => [...prev, data.concept]);
                setActiveConceptId(data.concept.id);
                setShowCreateModal(false);
                setNewConcept({ name: '', type: 'Mecanismo', description: '' });
                toast.success("Concepto de producción creado");
            }
        } catch (e) {
            toast.error("Error al crear concepto");
        } finally {
            setIsSaving(false);
        }
    };

    const handleLaunchAI = async () => {
        if (!activeConceptId) {
            toast.error("Selecciona un concepto para lanzar el análisis IA");
            return;
        }

        setIsLaunchingAI(true);
        toast.info("Iniciando Agente de Estrategia...", {
            description: "Analizando competidores y assets del producto."
        });

        try {
            // Simulación de pipeline IA
            await new Promise(r => setTimeout(r, 2500));

            toast.success("Estrategia generada", {
                description: "Se han pre-configurado los parámetros ideales para este concepto."
            });

            setIaConfig({
                framework: 'DTC',
                duracion: '30s',
                fase: 'FRÍO',
                formato: '9:16',
                oferta: '50% OFF + Envío Gratis'
            });
        } catch (e) {
            toast.error("Error al lanzar el Agente");
        } finally {
            setIsLaunchingAI(false);
        }
    };

    const filteredConcepts = filterType === 'Todos'
        ? concepts
        : concepts.filter(c => c.type.toLowerCase() === filterType.toLowerCase());

    const activeConcept = concepts.find(c => c.id === activeConceptId);

    return (
        <div className="flex h-full overflow-hidden bg-[var(--bg)]">
            {/* PANEL DE CONCEPTOS */}
            <aside className="w-[240px] flex-shrink-0 flex flex-col bg-white border-r border-[var(--border)] h-full">
                <div className="h-10 px-3 border-b border-[var(--border)] flex items-center justify-between shrink-0 bg-[var(--bg)]/10">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-tertiary)]">Conceptos</span>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="h-6 px-2 text-[10px] bg-[var(--cre)] text-white rounded font-bold hover:opacity-90 flex items-center gap-1"
                    >
                        <Plus size={10} /> NUEVO
                    </button>
                </div>

                <div className="px-3 py-2 border-b border-[var(--border)] overflow-x-auto no-scrollbar flex items-center gap-1.5 shrink-0">
                    {CONCEPT_TYPES.map(type => (
                        <button
                            key={type}
                            onClick={() => setFilterType(type)}
                            className={cn(
                                "h-6 px-2 text-[10px] rounded-full whitespace-nowrap transition-all border font-semibold uppercase tracking-wider",
                                filterType === type
                                    ? "bg-[var(--cre-bg)] text-[var(--cre)] border-[var(--cre)]/20"
                                    : "bg-transparent text-[var(--text-tertiary)] border-[var(--border)] hover:border-[var(--text-tertiary)]"
                            )}
                        >
                            {type}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1 custom-scrollbar">
                    {isLoading ? (
                        <div className="p-8 flex items-center justify-center">
                            <RefreshCw size={16} className="text-[var(--cre)] animate-spin" />
                        </div>
                    ) : filteredConcepts.length === 0 ? (
                        <div className="p-8 text-center">
                            <p className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase tracking-widest">Sin conceptos</p>
                        </div>
                    ) : (
                        filteredConcepts.map(concept => (
                            <button
                                key={concept.id}
                                onClick={() => setActiveConceptId(concept.id)}
                                className={cn(
                                    "px-3 py-2 flex items-center gap-3 rounded-lg transition-all text-left group",
                                    activeConceptId === concept.id
                                        ? "bg-[var(--cre-bg)] border border-[var(--cre)]/10 shadow-sm"
                                        : "bg-transparent border border-transparent hover:bg-[var(--bg)]"
                                )}
                            >
                                <span className="text-[9px] font-mono text-[var(--text-tertiary)] uppercase">{concept.code}</span>
                                <span className={cn(
                                    "text-xs font-semibold truncate flex-1",
                                    activeConceptId === concept.id ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"
                                )}>
                                    {concept.name}
                                </span>
                                {concept.creatives_count > 0 && (
                                    <span className="text-[9px] font-bold text-[var(--text-tertiary)] bg-white px-1.5 py-0.5 rounded border border-[var(--border)]">
                                        {concept.creatives_count}
                                    </span>
                                )}
                            </button>
                        ))
                    )}
                </div>
            </aside>

            {/* TRABAJO */}
            <main className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="max-w-4xl mx-auto p-6 lg:p-10 space-y-10">
                        {/* CABECERA */}
                        <section className="flex justify-between items-start animate-in fade-in slide-in-from-top-2">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="px-1.5 py-0.5 bg-[var(--cre-bg)] text-[var(--cre)] font-bold text-[9px] uppercase tracking-widest rounded border border-[var(--cre)]/10">
                                        {activeConcept?.type || 'CONCEPTO'}
                                    </span>
                                    <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-tight">
                                        SKU: {product?.sku || 'PROD'}
                                    </span>
                                </div>
                                <h1 className="text-xl font-semibold text-[var(--text-primary)] tracking-tight uppercase">
                                    {activeConcept?.name || 'Selecciona un concepto'}
                                </h1>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-bold text-[var(--cre)] bg-[var(--cre-bg)] px-2 py-0.5 rounded-full border border-[var(--cre)]/10 uppercase tracking-widest">IA Powered Pipeline</span>
                                    <button
                                        onClick={handleLaunchAI}
                                        disabled={isLaunchingAI || !activeConceptId}
                                        className="h-8 px-4 text-[10px] font-semibold uppercase bg-[var(--cre)] text-white rounded-lg hover:opacity-90 transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                                    >
                                        {isLaunchingAI ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                                        {isLaunchingAI ? "Analizando..." : "LANZAR IA"}
                                    </button>
                                </div>
                                <button className="h-8 w-8 flex items-center justify-center bg-white border border-[var(--border)] text-[var(--text-tertiary)] rounded-lg hover:bg-[var(--bg)]">
                                    <MoreVertical size={14} />
                                </button>
                            </div>
                        </section>

                        {/* SECCIONES */}
                        <div className="space-y-8">
                            <section className="space-y-4">
                                <div className="flex items-center gap-2 px-1">
                                    <div className="w-8 h-8 rounded-lg bg-[var(--cre-bg)] text-[var(--cre)] flex items-center justify-center border border-[var(--cre)]/10"><Zap size={16} /></div>
                                    <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-primary)]">Motor de Hooks</h3>
                                </div>
                                {activeConceptId ? (
                                    <MotorDeHooks
                                        conceptId={activeConceptId}
                                        conceptName={activeConcept?.name || ''}
                                        storeId={storeId}
                                        productId={productId}
                                        onUseHook={setActiveHook}
                                    />
                                ) : <EmptyState message="Selecciona un concepto para activar el motor" />}
                            </section>

                            <section className="space-y-4">
                                <div className="flex items-center gap-2 px-1">
                                    <div className="w-8 h-8 rounded-lg bg-[var(--cre-bg)] text-[var(--cre)] flex items-center justify-center border border-[var(--cre)]/10"><Video size={16} /></div>
                                    <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-primary)]">Constructor de Vídeo</h3>
                                </div>
                                {activeConceptId ? (
                                    <ConstructorDeVideo
                                        conceptId={activeConceptId}
                                        conceptName={activeConcept?.name || ''}
                                        storeId={storeId}
                                        productId={productId}
                                        initialHook={activeHook}
                                        iaConfig={iaConfig}
                                    />
                                ) : <EmptyState message="Selecciona un concepto para activar el constructor" />}
                            </section>

                            <section className="space-y-4">
                                <div className="flex items-center gap-2 px-1">
                                    <div className="w-8 h-8 rounded-lg bg-[var(--cre-bg)] text-[var(--cre)] flex items-center justify-center border border-[var(--cre)]/10"><Sparkles size={16} /></div>
                                    <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-primary)]">Fábrica en Masa</h3>
                                </div>
                                {activeConceptId ? (
                                    <FabricaEnMasa
                                        conceptId={activeConceptId}
                                        conceptName={activeConcept?.name || ''}
                                        storeId={storeId}
                                        productId={productId}
                                        productSku={product?.sku || 'PROD'}
                                    />
                                ) : <EmptyState message="Selecciona un concepto para activar la fábrica" />}
                            </section>

                            <section className="space-y-4">
                                <div className="flex items-center gap-2 px-1">
                                    <div className="w-8 h-8 rounded-lg bg-[var(--cre-bg)] text-[var(--cre)] flex items-center justify-center border border-[var(--cre)]/10"><Globe size={16} /></div>
                                    <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-primary)]">Sección C: Localización & Idiomas</h3>
                                </div>
                                <div className="bg-white border border-[var(--border)] rounded-xl p-6 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">Traducción de Assets</p>
                                            <p className="text-sm font-semibold text-[var(--text-primary)] uppercase">Convertir Concepto a otro Mercado</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <select
                                                id="lang-selector"
                                                className="h-9 px-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-xs font-bold uppercase outline-none focus:border-[var(--cre)] transition-all appearance-none"
                                            >
                                                <option value="EN">🇺🇸 Inglés (Global)</option>
                                                <option value="FR">🇫🇷 Francés</option>
                                                <option value="IT">🇮🇹 Italiano</option>
                                                <option value="DE">🇩🇪 Alemán</option>
                                                <option value="PT">🇵🇹 Portugués</option>
                                            </select>
                                            <button
                                                onClick={async () => {
                                                    const lang = (document.getElementById('lang-selector') as HTMLSelectElement).value;
                                                    const toastId = toast.loading(`Traduciendo concepto a ${lang}...`);
                                                    try {
                                                        const res = await fetch('/api/centro-creativo/cambiar-idioma', {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({ productId, conceptId: activeConceptId, language: lang })
                                                        });
                                                        if (res.ok) toast.success("Idioma cambiado con éxito", { id: toastId });
                                                        else throw new Error();
                                                    } catch (e) {
                                                        toast.error("Error en la traducción", { id: toastId });
                                                    }
                                                }}
                                                className="h-9 px-6 bg-[var(--text-primary)] text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:opacity-90 transition-all shadow-md"
                                            >
                                                Localizar
                                            </button>
                                        </div>
                                    </div>
                                    <div className="mt-4 p-4 bg-blue-50/50 border border-blue-100 rounded-lg flex items-center gap-3">
                                        <Bot size={18} className="text-blue-600" />
                                        <p className="text-[10px] text-blue-700 font-medium uppercase tracking-tight">
                                            La IA clonará la voz actual (ElevenLabs) y ajustará los subtítulos manteniendo el ritmo.
                                        </p>
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-4">
                                <div className="flex items-center gap-2 px-1">
                                    <div className="w-8 h-8 rounded-lg bg-[var(--cre-bg)] text-[var(--cre)] flex items-center justify-center border border-[var(--cre)]/10"><Monitor size={16} /></div>
                                    <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-primary)]">Rendimiento & Inventario</h3>
                                </div>
                                <TablaCreativa
                                    conceptId={activeConceptId}
                                    storeId={storeId}
                                    productId={productId}
                                    productSku={product?.sku || 'PROD'}
                                />
                            </section>
                        </div>
                    </div>
                </div>
            </main>

            {/* MODAL NUEVO CONCEPTO */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 min-h-screen">
                    <div className="bg-white w-full max-w-sm rounded-xl shadow-md overflow-hidden animate-in zoom-in-95 duration-200 border border-[var(--border)]">
                        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg)]/10">
                            <div>
                                <h3 className="text-xs font-semibold text-[var(--text-primary)] uppercase">Nuevo Concepto</h3>
                                <p className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase mt-0.5">Ángulo Maestro IA</p>
                            </div>
                            <button onClick={() => setShowCreateModal(false)} className="p-1 hover:bg-white rounded-md text-[var(--text-tertiary)] transition-colors"><X size={16} /></button>
                        </div>
                        <form onSubmit={handleCreateConcept} className="p-4 space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] pl-1">Nombre</label>
                                <input
                                    autoFocus required type="text"
                                    className="w-full h-9 px-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-xs font-medium focus:outline-none focus:border-[var(--cre)] transition-all"
                                    placeholder="Ej: Mecanismo de Hidratación"
                                    value={newConcept.name}
                                    onChange={e => setNewConcept({ ...newConcept, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] pl-1">Tipo</label>
                                <select
                                    className="w-full h-9 px-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-xs font-medium focus:outline-none focus:border-[var(--cre)] transition-all appearance-none"
                                    value={newConcept.type}
                                    onChange={e => setNewConcept({ ...newConcept, type: e.target.value as ConceptType })}
                                >
                                    {CONCEPT_TYPES.filter(t => t !== 'Todos').map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] pl-1">Descripción</label>
                                <textarea
                                    className="w-full h-20 p-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-xs font-medium focus:outline-none focus:border-[var(--cre)] transition-all resize-none"
                                    placeholder="Detalla la idea principal..."
                                    value={newConcept.description}
                                    onChange={e => setNewConcept({ ...newConcept, description: e.target.value })}
                                />
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 h-9 rounded-lg border border-[var(--border)] text-[var(--text-primary)] font-semibold text-[10px] uppercase transition-all hover:bg-[var(--bg)]">Cancelar</button>
                                <button type="submit" disabled={isSaving} className="flex-1 h-9 rounded-lg bg-[var(--cre)] text-white font-semibold text-[10px] uppercase transition-all disabled:opacity-50">
                                    {isSaving ? 'Guardando...' : 'Crear Concepto'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Chef Global Insight */}
            {!isLoading && concepts.length === 0 && (
                <div className="absolute bottom-6 left-6 right-6 p-6 rounded-xl bg-[var(--cre-bg)]/80 backdrop-blur-md border border-[var(--cre)]/20 shadow-xl animate-in slide-in-from-bottom-10 duration-700 z-10">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[var(--cre)] text-white flex items-center justify-center shrink-0 shadow-lg shadow-[var(--cre)]/20">
                            <Bot size={20} />
                        </div>
                        <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-[var(--cre)] uppercase tracking-widest">Agente Estratégico AI</span>
                                <div className="h-px flex-1 bg-[var(--cre)]/10" />
                            </div>
                            <h4 className="text-sm font-semibold text-[var(--text-primary)] leading-snug italic">
                                "He analizado tu producto y competidores. No tienes conceptos activos, pero detecto una oportunidad masiva en un ángulo de **'Mecanismo de Acción'** basado en la rapidez de absorción. ¿Quieres que cree el primer brief?"
                            </h4>
                            <div className="flex gap-2 pt-1">
                                <button
                                    onClick={() => {
                                        setNewConcept({ name: 'Mecanismo de Absorción Rápida', type: 'Mecanismo', description: 'Enfoque en la velocidad de penetración cutánea.' });
                                        setShowCreateModal(true);
                                    }}
                                    className="h-8 px-4 rounded-lg bg-[var(--text-primary)] text-white text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all shadow-sm"
                                >
                                    Aceptar Sugerencia
                                </button>
                                <button className="h-8 px-4 rounded-lg bg-white border border-[var(--border)] text-[var(--text-tertiary)] text-[10px] font-bold uppercase tracking-widest hover:bg-[var(--bg)] transition-all">
                                    Descartar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function GlobalChefIntelligence() {
    return (
        <div className="p-6 rounded-xl bg-gradient-to-br from-white to-[var(--bg)] border border-[var(--border)] shadow-sm relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Bot size={100} />
            </div>
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-[var(--cre)]">
                    <Sparkles size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Inteligencia Compartida</span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed italic pr-12">
                    "El mercado está saturado de testimonios falsos. Los datos muestran que los anuncios con **demostración técnica** (Mecanismo) están rindiendo un 40% mejor esta semana."
                </p>
                <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600"><TrendingUp size={12} /></div>
                    <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">CTR Trend: +1.2%</span>
                </div>
            </div>
        </div>
    );
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="h-32 bg-[var(--bg)]/50 rounded-xl border border-dashed border-[var(--border)] flex items-center justify-center p-6 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)] leading-tight max-w-[200px]">{message}</p>
        </div>
    );
}
