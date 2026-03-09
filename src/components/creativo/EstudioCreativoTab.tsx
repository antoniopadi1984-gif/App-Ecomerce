'use client';

import React, { useState } from 'react';
import {
    Plus, Search, Filter, ChevronRight,
    Sparkles, Video, Layout, List, Table as TableIcon,
    Zap, Target, Heart, Shield, MessageSquare,
    BarChart3, Clock, Copy, Save, Wand2,
    CheckCircle2, AlertCircle, Trash2, Archive
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProduct } from '@/context/ProductContext';
import { MotorDeHooks } from '@/components/creativo/MotorDeHooks';
import { ConstructorDeVideo } from '@/components/creativo/ConstructorDeVideo';
import { FabricaEnMasa } from '@/components/creativo/FabricaEnMasa';
import { TablaCreativa } from '@/components/creativo/TablaCreativa';

type ConceptStatus = 'GANADOR' | 'ACTIVO' | 'TESTANDO' | 'FATIGADO';
type ConceptType = 'MECANISMO' | 'PROBLEMA' | 'SOLUCIÓN' | 'FALSA SOLUCIÓN' | 'ERROR' | 'MIEDO' | 'VERGÜENZA' | 'PRUEBA' | 'HISTORIA' | 'COMPARATIVA' | 'AUTORIDAD' | 'IDENTIDAD' | 'OFERTA' | 'LISTA';

interface Concept {
    id: string;
    code: string;
    name: string;
    creativesCount: number;
    status: ConceptStatus;
    type: ConceptType;
}

export function EstudioCreativoTab({ storeId, productId }: { storeId: string, productId: string }) {
    const { product } = useProduct();
    const [activeTab, setActiveTab] = useState<'HOOKS' | 'VIDEO' | 'MASA' | 'TABLA'>('HOOKS');
    const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null);
    const [filterType, setFilterType] = useState<ConceptType | 'ALL'>('ALL');

    const [concepts] = useState<Concept[]>([
        { id: '1', code: 'PROD-CONC01', name: 'Mecanismo Biológico', creativesCount: 12, status: 'GANADOR', type: 'MECANISMO' },
        { id: '2', code: 'PROD-CONC02', name: 'Prueba Social Viral', creativesCount: 8, status: 'ACTIVO', type: 'PRUEBA' },
        { id: '3', code: 'PROD-CONC03', name: 'El Gran Error', creativesCount: 5, status: 'TESTANDO', type: 'ERROR' },
        { id: '4', code: 'PROD-CONC04', name: 'Miedo al Fracaso', creativesCount: 15, status: 'FATIGADO', type: 'MIEDO' },
    ]);

    const filteredConcepts = filterType === 'ALL'
        ? concepts
        : concepts.filter(c => c.type === filterType);

    return (
        <div className="flex h-full gap-4 animate-in fade-in duration-500 estudio-module">
            {/* COLUMN LEFT */}
            <aside className="w-[300px] flex flex-col bg-white border border-[var(--border)] rounded-xl overflow-hidden shrink-0 shadow-sm">
                <div className="p-4 border-b border-[var(--border)] bg-[var(--cre-bg)]/20">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--cre)] animate-pulse" />
                        <span className="text-[9px] font-bold text-[var(--cre)] uppercase tracking-widest">Producto Activo</span>
                    </div>
                    <h2 className="text-[14px] font-bold text-[var(--text-primary)] truncate uppercase tracking-tight">{product?.title || 'Producto sin nombre'}</h2>
                </div>

                <div className="p-3 border-b border-[var(--border)] space-y-2">
                    <button className="w-full flex items-center justify-center gap-2 bg-[var(--cre)] text-white h-9 px-3 text-[10px] font-bold rounded-lg hover:opacity-90 transition-all uppercase tracking-widest shadow-sm">
                        <Plus size={14} />
                        Nuevo Concepto
                    </button>

                    <div className="relative">
                        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value as any)}
                            className="w-full pl-8 pr-4 h-8 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[10px] font-bold text-[var(--text-tertiary)] appearance-none cursor-pointer outline-none focus:border-[var(--cre)]/40 uppercase tracking-widest"
                        >
                            <option value="ALL">TODOS LOS TIPOS</option>
                            <option value="MECANISMO">MECANISMO</option>
                            <option value="PROBLEMA">PROBLEMA</option>
                            <option value="SOLUCIÓN">SOLUCIÓN</option>
                            <option value="FALSA SOLUCIÓN">FALSA SOLUCIÓN</option>
                            <option value="ERROR">ERROR</option>
                            <option value="MIEDO">MIEDO</option>
                            <option value="VERGÜENZA">VERGÜENZA</option>
                            <option value="PRUEBA">PRUEBA</option>
                            <option value="HISTORIA">HISTORIA</option>
                            <option value="COMPARATIVA">COMPARATIVA</option>
                            <option value="AUTORIDAD">AUTORIDAD</option>
                            <option value="IDENTIDAD">IDENTIDAD</option>
                            <option value="OFERTA">OFERTA</option>
                            <option value="LISTA">LISTA</option>
                        </select>
                        <Filter size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none opacity-40" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1 custom-scrollbar">
                    {filteredConcepts.map((concept) => (
                        <div
                            key={concept.id}
                            onClick={() => setSelectedConcept(concept)}
                            className={cn(
                                "p-3 rounded-xl border transition-all cursor-pointer group",
                                selectedConcept?.id === concept.id
                                    ? "bg-[var(--cre-bg)]/20 border-[var(--cre)]/20 shadow-sm"
                                    : "bg-transparent border-transparent hover:bg-[var(--bg)]/5 hover:border-[var(--border)]"
                            )}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase">{concept.code}</span>
                                <Badge status={concept.status} />
                            </div>
                            <h3 className="text-[12px] font-bold text-[var(--text-primary)] group-hover:text-[var(--cre)] transition-colors leading-snug uppercase tracking-tight">{concept.name}</h3>
                            <div className="flex items-center gap-1.5 mt-2 text-[9px] text-[var(--text-tertiary)] font-bold uppercase tracking-widest">
                                <List size={10} />
                                {concept.creativesCount} Creativos
                            </div>
                        </div>
                    ))}
                </div>
            </aside>

            {/* COLUMN RIGHT */}
            <main className="flex-1 flex flex-col bg-white border border-[var(--border)] rounded-xl overflow-hidden relative shadow-sm">
                {!selectedConcept ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-20 bg-white z-10 gap-6">
                        <div className="w-16 h-16 rounded-xl bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center text-[var(--text-tertiary)] opacity-30 shadow-sm">
                            <Zap size={32} strokeWidth={1} />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--text-primary)]">Selecciona un Concepto</h3>
                            <p className="text-[10px] text-[var(--text-tertiary)] uppercase font-medium max-w-xs mx-auto leading-relaxed">
                                Elige un concepto de la columna izquierda para empezar a fabricar de alta conversión.
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="flex gap-0 border-b border-[var(--border)] bg-white px-4 shrink-0 h-12 shadow-sm relative z-20">
                            <TabButton active={activeTab === 'HOOKS'} onClick={() => setActiveTab('HOOKS')} label="Motor de Hooks" />
                            <TabButton active={activeTab === 'VIDEO'} onClick={() => setActiveTab('VIDEO')} label="Constructor de Vídeo" />
                            <TabButton active={activeTab === 'MASA'} onClick={() => setActiveTab('MASA')} label="Fábrica en Masa" />
                            <TabButton active={activeTab === 'TABLA'} onClick={() => setActiveTab('TABLA')} label="Tabla Creativa" />
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-[var(--bg)]/10">
                            {activeTab === 'HOOKS' && (
                                <MotorDeHooks
                                    conceptId={selectedConcept.id}
                                    conceptName={selectedConcept.name}
                                    storeId={storeId}
                                    productId={productId}
                                />
                            )}
                            {activeTab === 'VIDEO' && (
                                <ConstructorDeVideo
                                    conceptId={selectedConcept.id}
                                    conceptName={selectedConcept.name}
                                    storeId={storeId}
                                    productId={productId}
                                />
                            )}
                            {activeTab === 'MASA' && (
                                <FabricaEnMasa
                                    conceptId={selectedConcept.id}
                                    conceptName={selectedConcept.name}
                                    storeId={storeId}
                                    productId={productId}
                                    productSku={product?.handle?.slice(0, 6).toUpperCase() || 'PROD'}
                                />
                            )}
                            {activeTab === 'TABLA' && (
                                <TablaCreativa
                                    conceptId={selectedConcept.id}
                                    storeId={storeId}
                                    productId={productId}
                                    productSku={product?.handle?.slice(0, 6).toUpperCase() || 'PROD'}
                                />
                            )}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}

function Badge({ status }: { status: ConceptStatus }) {
    const styles = {
        GANADOR: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
        ACTIVO: "bg-blue-500/10 text-blue-600 border-blue-500/20",
        TESTANDO: "bg-gray-100 text-gray-500 border-gray-200",
        FATIGADO: "bg-rose-500/10 text-rose-600 border-rose-500/20",
    }[status];

    return <span className={cn("px-1.5 py-0.5 rounded text-[8px] font-bold border uppercase tracking-widest", styles)}>{status}</span>;
}

function TabButton({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "px-5 h-full text-[10px] font-bold uppercase tracking-widest transition-all relative border-r border-[var(--border)] last:border-0",
                active ? "text-[var(--cre)] bg-[var(--cre-bg)]/5" : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg)]/5"
            )}
        >
            {label}
            {active && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--cre)]" />}
        </button>
    );
}
