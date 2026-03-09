'use client';

import React, { useState } from 'react';
import {
    FlaskConical,
    Sparkles,
    Plus,
    Video,
    Image as ImageIcon,
    FileText,
    Bot,
    ChevronRight,
    Search,
    Download,
    HardDrive,
    Trash2
} from 'lucide-react';

interface ConceptosTabProps {
    storeId: string;
    productId: string;
    marketLang: string;
}

export function ConceptosTab({ storeId, productId, marketLang }: ConceptosTabProps) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [concepts, setConcepts] = useState<any[]>([
        {
            id: 'CONC_01',
            name: 'Mecanismo Biológico',
            hooks: 12,
            scripts: 5,
            videos: 2,
            statics: 8,
            status: 'active'
        },
        {
            id: 'CONC_02',
            name: 'Prueba Social Viral',
            hooks: 8,
            scripts: 3,
            videos: 1,
            statics: 4,
            status: 'draft'
        }
    ]);

    const handleGenerate = () => {
        setIsGenerating(true);
        setTimeout(() => setIsGenerating(false), 3000);
    };

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500">
            {/* Header & Main Action */}
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">Laboratorio de Conceptos</h2>
                    <p className="text-[10px] text-[var(--text-tertiary)] mt-1 uppercase tracking-widest font-bold">Conceptos C1-C7 · Hooks · Scripts · Producción</p>
                </div>

                <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="h-10 px-6 rounded-lg bg-[var(--cre)] text-white font-bold text-xs uppercase tracking-widest flex items-center gap-2 shadow-sm hover:opacity-90 transition-all disabled:opacity-50"
                >
                    {isGenerating ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Orquestando PEC...</span>
                        </>
                    ) : (
                        <>
                            <Sparkles size={16} />
                            <span>Generar Nuevo Concepto</span>
                        </>
                    )}
                </button>
            </div>

            {/* Grid de Conceptos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {concepts.map((concept) => (
                    <div key={concept.id} className="ds-card group hover:border-[var(--cre)]/30 transition-all cursor-pointer p-5 bg-white border border-[var(--border)] rounded-xl shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${concept.status === 'active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                                {concept.status}
                            </div>
                            <div className="text-[10px] font-mono text-[var(--text-tertiary)] uppercase">{concept.id}</div>
                        </div>

                        <h3 className="text-base font-bold text-[var(--text-primary)] mb-4">{concept.name}</h3>

                        <div className="grid grid-cols-2 gap-2 mb-6">
                            <div className="p-3 rounded-lg bg-[var(--bg)]/50 border border-[var(--border)] group-hover:bg-[var(--cre)]/5 transition-colors">
                                <div className="text-[9px] text-[var(--text-tertiary)] uppercase font-bold mb-1">Hooks</div>
                                <div className="text-base font-bold text-[var(--text-primary)]">{concept.hooks}</div>
                            </div>
                            <div className="p-3 rounded-lg bg-[var(--bg)]/50 border border-[var(--border)] group-hover:bg-[var(--cre)]/5 transition-colors">
                                <div className="text-[9px] text-[var(--text-tertiary)] uppercase font-bold mb-1">Scripts</div>
                                <div className="text-base font-bold text-[var(--text-primary)]">{concept.scripts}</div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
                            <div className="flex gap-3">
                                <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-tertiary)]">
                                    <Video size={14} />
                                    <span className="font-bold">{concept.videos}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-tertiary)]">
                                    <ImageIcon size={14} />
                                    <span className="font-bold">{concept.statics}</span>
                                </div>
                            </div>
                            <ChevronRight size={18} className="text-[var(--text-tertiary)] group-hover:text-[var(--cre)] group-hover:translate-x-1 transition-all" />
                        </div>
                    </div>
                ))}

                {/* Create Card */}
                <div className="ds-card border-dashed border-2 border-[var(--border)] rounded-xl flex flex-col items-center justify-center gap-4 py-12 hover:bg-[var(--cre)]/5 transition-all group cursor-pointer">
                    <div className="w-12 h-12 rounded-full bg-[var(--cre)]/5 flex items-center justify-center text-[var(--cre)] group-hover:scale-110 transition-transform">
                        <Plus size={24} />
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-bold text-[var(--text-primary)]">Nuevo Concepto</p>
                        <p className="text-[10px] text-[var(--text-tertiary)] uppercase font-bold mt-1">Manual o vía Agente Chef</p>
                    </div>
                </div>
            </div>

            {/* Global Chef Intelligence */}
            <div className="mt-8 p-6 rounded-xl bg-[var(--cre-bg)]/50 border border-[var(--cre)]/10 relative overflow-hidden shadow-sm">
                <div className="absolute top-0 right-0 p-8 opacity-5 text-[var(--cre)]">
                    <Bot size={120} />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 text-[var(--cre)] mb-2">
                        <Bot size={18} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Agente Jefe Global - IA Directive</span>
                    </div>
                    <h4 className="text-lg font-bold text-[var(--text-primary)] mb-2 italic leading-tight">"He detectado que el Módulo de Rendimiento muestra un ROAS de 3.2x en el concepto C3 para el avatar 'Mamá Primeriza'. Recomiendo escalar la producción de este concepto con 5 nuevas variantes de Hook NEG."</h4>
                    <button className="mt-4 px-6 py-2 rounded-lg bg-[var(--text-primary)] text-white text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all shadow-sm">
                        Aceptar Recomendación Jefe Global
                    </button>
                </div>
            </div>
        </div>
    );
}
