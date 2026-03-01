'use client';

import React, { useState, useRef } from 'react';
import { useStore } from '@/lib/store/store-context';
import { useProduct } from '@/context/ProductContext';
import {
    Clapperboard, UploadCloud, FileVideo, LayoutTemplate,
    Users, FolderGit2, Sparkles, RefreshCw, Layers, Link as LinkIcon, Download, Search, Loader2
} from 'lucide-react';
import { AgentCompanion } from '@/components/layout/agent-companion';

const TABS = [
    { id: 'VIDEO_LAB', label: 'Video Lab', icon: FileVideo },
    { id: 'LANDING_BUILDER', label: 'Landing Builder', icon: LayoutTemplate },
    { id: 'AVATARES', label: 'Avatares IA', icon: Users },
    { id: 'BIBLIOTECA', label: 'Biblioteca', icon: FolderGit2 },
    { id: 'CONCEPTOS', label: 'Conceptos Spencer', icon: Layers },
];

function PillTab({ active, label, icon: Icon, set }: { active: boolean; label: string; icon: any; set: () => void }) {
    return (
        <button
            onClick={set}
            className={`module-tab flex items-center gap-1.5 ${active ? 'active' : ''}`}
            style={active ? { '--tab-color': 'var(--cre)' } as any : {}}
        >
            <Icon size={14} className={active ? '' : 'text-[var(--text-dim)]'} />
            {label}
        </button>
    );
}

// ─── Sub-Tab: VIDEO LAB ─────────────────────────────────────────
function VideoLabTab({ storeId }: { storeId: string }) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [dragActive, setDragActive] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [filesMock, setFilesMock] = useState<string[]>([]);
    const [conceptForm, setConceptForm] = useState('PROMO_NAVIDAD');
    const [funnelForm, setFunnelForm] = useState('TOF');

    const handleDrag = (e: any) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
        else if (e.type === "dragleave") setDragActive(false);
    };

    const processFiles = (count: number) => {
        setUploading(true);
        fetch('/api/creativo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'PROCESS_VIDEO', storeId, filesCount: count, concept: conceptForm, funnel: funnelForm })
        })
            .then(r => r.json())
            .then(d => {
                if (d.ok) setFilesMock(prev => [...d.processedNames, ...prev]);
                setUploading(false);
                setDragActive(false);
            });
    };

    const handleDrop = (e: any) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFiles(e.dataTransfer.files.length);
        }
    };

    return (
        <div className="flex flex-col h-[600px] gap-4">
            {/* Upload Zone */}
            <div
                className={`ds-card border-dashed border-2 flex flex-col items-center justify-center p-8 transition-colors ${dragActive ? 'border-[var(--cre)] bg-[var(--cre)]/5' : 'border-[var(--border-high)] bg-[var(--surface)] hover:bg-[var(--surface2)]'}`}
                onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
            >
                <UploadCloud size={40} className="text-[var(--cre)] mb-3 opacity-80" />
                <h3 className="text-[14px] font-[800] text-[var(--text)] text-center mb-1">Upload Masivo al Video Lab</h3>
                <p className="text-[11px] text-[var(--text-muted)] text-center max-w-sm mb-4">
                    Arrastra vídeos (MP4) o carpetas completas. El sistema purgará metadata, separará clips y asignará nomenclatura estándar Spencer automáticamente en tu Drive.
                </p>

                <div className="flex gap-2 mb-4">
                    <input type="text" value={conceptForm} onChange={e => setConceptForm(e.target.value)} placeholder="Concepto..." className="ds-input w-32 border-[var(--border-high)] text-[10px]" />
                    <select value={funnelForm} onChange={e => setFunnelForm(e.target.value)} className="ds-input w-24 border-[var(--border-high)] text-[10px]">
                        <option value="TOF">TOF (Frío)</option>
                        <option value="MOF">MOF (Tibio)</option>
                        <option value="BOF">BOF (Caliente)</option>
                        <option value="RT">Retargeting</option>
                    </select>
                </div>

                <button
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="ds-btn py-1.5 px-4 text-[11px] bg-[var(--cre)] text-white hover:brightness-110 shadow-sm"
                >
                    {uploading ? <RefreshCw size={12} className="animate-spin inline mr-2" /> : 'Seleccionar Archivos'}
                </button>
                <input ref={fileInputRef} type="file" multiple accept="video/*" className="hidden" onChange={(e) => {
                    if (e.target.files?.length) processFiles(e.target.files.length);
                }} />
            </div>

            {/* Grid de Resultados */}
            <h3 className="section-title text-[var(--cre)]! mt-2">Cola de Procesamiento / Drive Sync</h3>
            <div className="flex-1 ds-card overflow-y-auto">
                <table className="ds-table w-full">
                    <thead>
                        <tr>
                            <th className="w-1/2">Nomenclatura Spencer (Drive)</th>
                            <th className="text-center">Fase</th>
                            <th className="text-center">Extracción</th>
                            <th className="text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filesMock.length === 0 ? (
                            <tr><td colSpan={4} className="text-center p-6 text-[11px] text-[var(--text-dim)]">No se han subido creativos hoy.</td></tr>
                        ) : filesMock.map((f, i) => (
                            <tr key={i} className="group">
                                <td className="font-mono text-[10px] font-bold text-[var(--text)] py-3 px-3">
                                    <FileVideo size={12} className="inline mr-2 text-[var(--cre)]" />
                                    {f}.mp4
                                </td>
                                <td className="text-center text-[10px]"><span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-bold tracking-widest">{f.split('_')[4] || 'MIX'}</span></td>
                                <td className="text-center text-[10px] text-[var(--s-ok)] font-medium">Clips Analizados</td>
                                <td className="text-right py-3 px-3">
                                    <button className="text-[10px] text-[var(--text-dim)] hover:text-[var(--cre)] underline mr-2">Meta Ads</button>
                                    <button className="text-[10px] text-[var(--text-dim)] hover:text-[var(--cre)] underline border-l border-slate-200 pl-2">Variantes (IA)</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ─── Sub-Tab: LANDING BUILDER ─────────────────────────────────────
function LandingBuilderTab({ storeId }: { storeId: string }) {
    const [urlComp, setUrlComp] = useState('');
    const [analyzing, setAnalyzing] = useState(false);
    const [analysisRes, setAnalysisRes] = useState<string | null>(null);

    const analyzeUrl = () => {
        if (!urlComp) return;
        setAnalyzing(true);
        fetch('/api/creativo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'ANALYZE_COMPETITOR', storeId, url: urlComp })
        })
            .then(r => r.json())
            .then(d => {
                if (d.ok) setAnalysisRes(d.result);
                setAnalyzing(false);
            });
    };

    return (
        <div className="flex flex-col md:flex-row gap-4 h-[600px]">
            {/* Creador de Landings */}
            <div className="w-full md:w-1/2 flex flex-col gap-4">

                <div className="ds-card-padded bg-[var(--surface2)]">
                    <h3 className="text-[12px] font-[800] text-[var(--text)] flex items-center gap-2 mb-3">
                        <Sparkles size={14} className="text-[var(--cre)]" /> IA Landing Generator
                    </h3>
                    <div className="flex flex-col gap-3">
                        <div>
                            <label className="text-label mb-1">Estructura</label>
                            <select className="ds-input w-full">
                                <option>Landing Product Page (LPP)</option>
                                <option>Listicle + LPP</option>
                                <option>Advertorial + LPP</option>
                                <option>Varios Advertorials + LPP</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-label mb-1">Marco Psicológico (Agente Copy)</label>
                            <select className="ds-input w-full disabled:opacity-50">
                                <option>Cashvertising (Direct Response Aggressive)</option>
                                <option>Breakthrough Advertising (Awareness Based)</option>
                                <option>Hormozi (Value Equation Grand Slam)</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-label mb-1">Ángulo Creativo</label>
                            <input type="text" placeholder="Ej: Dolor lumbar por estar sentado..." className="ds-input w-full" />
                        </div>
                        <button className="ds-btn w-full mt-2 bg-[var(--text)] text-white hover:bg-[var(--cre)] border-none">
                            Generar Bloques V1
                        </button>
                    </div>
                </div>

                <div className="ds-card-padded flex-1 flex flex-col items-center justify-center opacity-50 bg-[var(--surface2)] border-dashed border border-[var(--border-high)]">
                    <LayoutTemplate size={32} className="mb-2" />
                    <p className="text-[11px] text-center font-bold text-[var(--text-dim)] uppercase tracking-wide">Pre-visualización</p>
                    <p className="text-[9px] text-center px-4 mt-2 leading-tight">Agente Copywriter insertará la salida directa aquí para revisión. Las sesiones MS Clarity se embeben dinámicamente usando iframe en Producción.</p>
                </div>

            </div>

            {/* Espía & Análisis */}
            <div className="w-full md:w-1/2 flex flex-col">
                <h3 className="section-title text-[var(--cre)]! mb-2">Spy Lab (Ingeniería Inversa)</h3>
                <div className="ds-card flex-1 flex flex-col overflow-hidden">
                    <div className="p-3 border-b border-[var(--border)] bg-[var(--surface)] flex gap-2">
                        <div className="relative flex-1">
                            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-dim)]" />
                            <input
                                type="text"
                                value={urlComp}
                                onChange={e => setUrlComp(e.target.value)}
                                placeholder="Pega URL de competencia (Shopify/Funnels)..."
                                className="ds-input w-full pl-8"
                            />
                        </div>
                        <button onClick={analyzeUrl} disabled={analyzing} className="ds-btn py-1 px-3 text-[11px] shrink-0 min-w-[80px]">
                            {analyzing ? <RefreshCw size={12} className="animate-spin" /> : 'Auditar'}
                        </button>
                    </div>

                    <div className="flex-1 p-4 bg-[var(--surface2)]/50 overflow-y-auto text-[11px] font-mono leading-relaxed text-[var(--text-muted)] whitespace-pre-wrap">
                        {analyzing ? (
                            <div className="flex flex-col items-center justify-center h-full text-[var(--text-dim)]">
                                <Loader2 className="animate-spin w-8 h-8 text-[var(--cre)] mb-2" />
                                Replicando y desestructurando oferta...
                            </div>
                        ) : analysisRes ? (
                            <div className="animate-in fade-in zoom-in-95 text-[12px] text-[var(--text)]">
                                {/* Render raw AI output for prototype */}
                                {analysisRes}
                                <div className="mt-4 pt-4 border-t border-[var(--border-high)] text-right">
                                    <button className="ds-btn border border-[var(--cre)] bg-[var(--cre)]/10 text-[var(--cre)] text-[10px]">
                                        Replicar Estructura e Inyectar Mis Datos
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-60">
                                <LinkIcon size={32} className="mb-3 text-[var(--border-high)]" />
                                <p className="font-bold text-[12px] uppercase tracking-wider mb-1">CRO Forensic Auditor</p>
                                <p>Pega un funnel ganador para extraer AOV, Ángulo del CTA, Patrones de Cashvertising y estructura del cuerpo textado.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── PÁGINA PRINCIPAL /creativo ─────────────────────────────────
export default function CreativoPage() {
    const { activeStoreId } = useStore();
    const { productId } = useProduct();
    const [activeTab, setActiveTab] = useState(TABS[0].id);

    const contextForAgent = `Centro Creativo. Viendo pestaña ${activeTab}. Tienda: ${activeStoreId}. Producto filtrado: ${productId}`;

    return (
        <div className="content-main flex flex-col gap-4 pt-0 h-full">
            <div className="flex justify-between items-center py-2 mt-2">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded shrink-0 bg-[#F59E0B] flex items-center justify-center text-white shadow-sm">
                        <Clapperboard size={18} />
                    </div>
                    <div>
                        <h1 className="text-[14px] font-[800] leading-none text-[var(--text)] tracking-tight">Centro Creativo</h1>
                        <p className="text-[10px] text-[var(--text-muted)] mt-0.5 max-w-sm uppercase tracking-wide">
                            Producción masiva, CRO y Avatares Inteligentes
                        </p>
                    </div>
                </div>
            </div>

            <div className="module-tabs overflow-x-auto no-scrollbar max-w-full ds-card px-1 py-1 flex-nowrap shrink-0">
                {TABS.map(t => (
                    <PillTab key={t.id} active={activeTab === t.id} label={t.label} icon={t.icon} set={() => setActiveTab(t.id)} />
                ))}
            </div>

            {!activeStoreId ? (
                <div className="text-center p-8 text-[11px] font-semibold text-[var(--text-dim)] ds-card">
                    Selecciona una tienda en el selector superior (TopBar).
                </div>
            ) : (
                <div className="flex-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {activeTab === 'VIDEO_LAB' && <VideoLabTab storeId={activeStoreId} />}
                    {activeTab === 'LANDING_BUILDER' && <LandingBuilderTab storeId={activeStoreId} />}

                    {/* Placeholders for Avatares, Biblioteca, Conceptos */}
                    {['AVATARES', 'BIBLIOTECA', 'CONCEPTOS'].includes(activeTab) && (
                        <div className="h-[400px] flex flex-col items-center justify-center text-center p-8 ds-card text-[var(--text-muted)] border-dashed border-2 bg-transparent">
                            <Clapperboard size={32} className="mb-2 opacity-50 text-[var(--cre)]" />
                            <h3 className="text-[14px] font-[800] text-[var(--text)] mb-1">Módulo "{TABS.find(t => t.id === activeTab)?.label}" Reservado</h3>
                            <p className="text-[11px]">Reservado para Drive Integration & ElevenLabs API Sync.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Agente Compañante Inyectado, usa ROLE copywriter (o video_editor según pestaña real, dejo general_creativo aquí). */}
            <AgentCompanion pageContext={contextForAgent} agentRole="copywriter-elite" />
        </div>
    );
}
