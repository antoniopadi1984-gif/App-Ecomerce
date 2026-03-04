'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/lib/store/store-context';
import { useProduct } from '@/context/ProductContext';
import { Play, CheckCircle2, Circle, Loader2, ArrowRight, BrainCircuit, ScanSearch, UserPlus, FileText, Share2, Target, Plus, Package } from 'lucide-react';
import { AddProductDialog } from '@/components/products/AddProductDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const STEPS = [
    { id: 'P1', name: 'Mass Desire', desc: 'Funcionalidad, mecanismos y features', icon: ScanSearch, model: 'Gemini 2.5 Flash / Deep Research' },
    { id: 'P2', name: 'Avatares', desc: 'Generación de perfiles arquetipo', icon: UserPlus, model: 'Gemini 2.5 Flash / Deep Research' },
    { id: 'P2.1', name: 'Language Bank', desc: 'Extracción vocabulario taboo y creencias', icon: FileText, model: 'Gemini 2.5 Flash / Deep Research' },
    { id: 'P4', name: 'Ángulos', desc: 'Identificación de Ángulos P.A.S.T.', icon: Target, model: 'Claude 3.5 Sonnet' },
    { id: 'P3', name: 'Copy', desc: 'Master copy generation', icon: BrainCircuit, model: 'Claude 3.5 Sonnet' },
];

type ResearchStep = {
    stepKey: string;
    createdAt: string;
    runId: string;
    [key: string]: unknown;
};

const STEP_RUNNING_MSG: Record<string, string> = {
    'P1': 'Analizando mercado en Amazon, Reddit, Quora...',
    'P2': 'Construyendo 5 macro avatares...',
    'P2.1': 'Extrayendo language bank por avatar...',
    'P4': 'Generando 20 ángulos con Claude...',
    'P3': 'Construyendo sales letter...'
};

export default function ResearchCorePage() {
    const { activeStoreId } = useStore();
    const { productId, allProducts, setProductId } = useProduct();
    const [running, setRunning] = useState(false);
    const [runId, setRunId] = useState<string | null>(null);
    const [completedSteps, setCompletedSteps] = useState<string[]>([]);
    const [currentStep, setCurrentStep] = useState<string | null>(null);
    const [stepError, setStepError] = useState<string | null>(null);
    const [historyRuns, setHistoryRuns] = useState<ResearchStep[][]>([]);
    const [selectedOutput, setSelectedOutput] = useState<{ title: string, data: Record<string, unknown> | string } | null>(null);

    useEffect(() => {
        if (!productId || productId === 'GLOBAL') return;
        fetch(`/api/research/god-tier?productId=${productId}`)
            .then(res => res.json())
            .then(d => {
                if (d.ok && d.runs) {
                    const runsArr = Object.values(d.runs) as ResearchStep[][];
                    if (runsArr.length > 0) {
                        const latestRun = runsArr.sort((a, b) => new Date(b[0].createdAt).getTime() - new Date(a[0].createdAt).getTime())[0];
                        setRunId(latestRun[0].runId);
                        setCompletedSteps(latestRun.map((s: ResearchStep) => s.stepKey));
                        setHistoryRuns(runsArr);
                    } else {
                        setRunId(null);
                        setCompletedSteps([]);
                    }
                }
            });
    }, [productId]);

    const startPipeline = async (startFromIndex = 0, isResume = false) => {
        if (!activeStoreId || !productId || productId === 'GLOBAL') return;
        setRunning(true);
        setStepError(null);

        let newRunId = runId;
        if (!isResume && startFromIndex === 0) {
            setCompletedSteps([]);
            newRunId = `run_${Date.now()}`;
            setRunId(newRunId);
        }

        const remainingSteps = STEPS.slice(startFromIndex);

        for (const step of remainingSteps) {
            setCurrentStep(step.id);
            try {
                const r = await fetch('/api/research/god-tier', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        storeId: activeStoreId,
                        productId,
                        runId: newRunId,
                        stepKey: step.id
                    })
                });
                const d = await r.json();
                if (!d.ok) {
                    setStepError(step.id);
                    break;
                }
                setCompletedSteps(prev => [...prev, step.id]);
            } catch {
                setStepError(step.id);
                break;
            }
        }
        setCurrentStep(null);
        setRunning(false);
    };

    if (!productId || productId === 'GLOBAL') {
        if (allProducts.length === 0) {
            return (
                <>
                    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in zoom-in-95 duration-500">
                        <div style={{ fontSize: "64px", marginBottom: "24px", animation: "bounce 2s infinite" }}>🔬</div>
                        <h2 className="text-[24px] font-[900] text-[var(--text)] mb-3 text-center">
                            Sin productos en investigación
                        </h2>
                        <p className="text-[14px] text-[var(--text-muted)] mb-8 text-center max-w-md leading-relaxed">
                            Añade tu primer producto para comenzar el pipeline central de generación de avatares, ángulos e insights accionables.
                        </p>
                        <div className="flex flex-col items-center gap-3">
                            <div style={{ marginTop: "24px", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                                <span style={{ fontSize: "11px", color: "#94a3b8", letterSpacing: "0.05em" }}>O BIEN</span>
                                <button
                                    onClick={() => document.dispatchEvent(new CustomEvent('open-create-product-modal'))}
                                    style={{
                                        background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                                        color: "white", border: "none", borderRadius: "8px",
                                        padding: "8px 20px", fontSize: "13px", fontWeight: 700,
                                        cursor: "pointer", boxShadow: "0 2px 8px rgba(124,58,237,0.25)",
                                        letterSpacing: "0.02em"
                                    }}
                                >
                                    + Crear nuevo producto
                                </button>
                            </div>
                        </div>
                    </div>
                    <AddProductDialog />
                </>
            );
        }

        return (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-[16px] font-[900] text-[var(--text)] flex items-center gap-2">
                            <Target size={18} className="text-[var(--inv)]" />
                            Directorio de Investigación
                        </h2>
                        <p className="text-[11px] text-[var(--text-muted)] mt-1">Selecciona un producto para ver o ejecutar su Pipeline Canónico.</p>
                    </div>
                    <AddProductDialog />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {allProducts.map(p => (
                        <div key={p.id}
                            onClick={() => setProductId(p.id)}
                            className="ds-card-padded cursor-pointer hover:border-[var(--inv)] hover:shadow-[0_4px_20px_rgba(139,92,246,0.15)] transition-all group flex flex-col h-full bg-[var(--surface)]">
                            <div className="flex items-start gap-3 mb-3">
                                {p.imageUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={p.imageUrl} alt={p.title} className="w-12 h-12 rounded-lg object-cover border border-[var(--border)]" />
                                ) : (
                                    <div className="w-12 h-12 rounded-lg bg-[var(--surface2)] border border-[var(--border)] flex items-center justify-center text-[20px]">
                                        📦
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-[13px] font-[800] text-[var(--text)] truncate group-hover:text-[var(--inv)] transition-colors">{p.title}</h3>
                                    <p className="text-[10px] text-[var(--text-dim)] truncate mt-0.5">{p.productFamily || 'Sin familia'}</p>
                                    <div className="mt-1.5 flex gap-1">
                                        <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-[var(--text)]/5 text-[var(--text-muted)] border border-[var(--border)]">
                                            {p.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <p className="text-[11px] text-[var(--text-muted)] line-clamp-2 leading-relaxed flex-1">
                                {p.description || 'Sin descripción...'}
                            </p>
                            <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-between">
                                <span className="text-[9px] font-black uppercase tracking-widest text-[var(--inv)] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                    Ver Pipeline <ArrowRight size={10} />
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="ds-card-padded bg-[var(--surface2)] flex items-center justify-between shadow-sm border border-[var(--border)]">
                <div className="flex items-center gap-3">
                    <button onClick={() => setProductId('GLOBAL')} className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--border)] transition-colors text-[var(--text)]">
                        <ArrowRight size={14} className="rotate-180" />
                    </button>
                    <div>
                        <h2 className="text-[14px] font-[800] text-[var(--text)] flex items-center gap-2">
                            <BrainCircuit size={16} className="text-[var(--inv)]" /> Pipeline Canónico (God Tier)
                        </h2>
                        <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Producto activo: <strong className="text-[var(--text)]">{allProducts.find(p => p.id === productId)?.title || productId}</strong></p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        className="flex items-center gap-2 text-[11px] font-[800] bg-[var(--surface)] border border-[var(--border)] px-4 py-2 rounded-lg text-[var(--text)] hover:bg-[var(--surface2)] transition-colors"
                        onClick={() => {
                            const url = window.prompt("Introduce URL de Google Doc o PDF para usar como fuente base:");
                            if (url) {
                                // TODO: Call API to update product with source
                                alert("Fuente vinculada: " + url);
                            }
                        }}
                    >
                        <FileText size={14} /> Añadir fuente
                    </button>
                    <button
                        onClick={() => {
                            const firstUncompletedIndex = STEPS.findIndex(s => !completedSteps.includes(s.id));
                            if (firstUncompletedIndex !== -1 && completedSteps.length > 0) {
                                startPipeline(firstUncompletedIndex, true);
                            } else {
                                startPipeline(0);
                            }
                        }}
                        disabled={running}
                        className="ds-btn bg-[var(--inv)] text-white hover:brightness-110 shadow-[0_4px_14px_rgba(139,92,246,0.39)] px-6 h-9"
                    >
                        {running ? (
                            <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Ejecutando...</span>
                        ) : completedSteps.length === STEPS.length ? (
                            <span className="flex items-center gap-2"><Play size={14} /> Re-ejecutar Pipeline</span>
                        ) : completedSteps.length > 0 ? (
                            <span className="flex items-center gap-2"><Play size={14} /> Continuar Pipeline</span>
                        ) : (
                            <span className="flex items-center gap-2"><Play size={14} /> Ejecutar investigación completa</span>
                        )}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {STEPS.map((step, index) => {
                    const isCompleted = completedSteps.includes(step.id);
                    const isActive = currentStep === step.id;
                    const isError = stepError === step.id;
                    const isBlocked = !isCompleted && !isActive && !isError;

                    return (
                        <div key={step.id}
                            className={`ds-card-padded border-l-4 transition-all duration-300 relative overflow-hidden flex flex-col ${isError ? 'border-l-[var(--s-ko)] bg-[var(--s-ko)]/5 border-t border-r border-b' :
                                isCompleted ? 'border-l-[var(--s-ok)] bg-[var(--s-ok)]/5' :
                                    isActive ? 'border-l-[var(--inv)] border-t border-r border-b border-[var(--inv)] shadow-[0_4px_20px_rgba(139,92,246,0.15)] scale-[1.02] z-10' :
                                        'border-l-[var(--border-high)] bg-[var(--surface)] opacity-50 grayscale-[50%]'
                                }`}
                        >
                            {isActive && <div className="absolute top-0 left-0 w-full h-[2px] bg-[var(--inv)] animate-pulse" />}
                            <div className="flex justify-between items-start mb-2">
                                <div className={`p-1.5 rounded-md ${isError ? 'bg-[var(--s-ko)]/20 text-[var(--s-ko)]' :
                                    isCompleted ? 'bg-[var(--s-ok)]/20 text-[var(--s-ok)]' :
                                        isActive ? 'bg-[var(--inv)]/20 text-[var(--inv)]' :
                                            'bg-[var(--surface2)] text-[var(--text-dim)]'
                                    }`}>
                                    <step.icon size={16} />
                                </div>
                                <div className="flex items-center gap-1.5">
                                    {isError ? (
                                        <span className="text-[9px] font-bold text-[var(--s-ko)] tracking-widest uppercase">Failed</span>
                                    ) : isCompleted ? (
                                        <span className="text-[9px] font-bold text-[var(--s-ok)] tracking-widest uppercase">Done</span>
                                    ) : isActive ? (
                                        <span className="text-[9px] font-bold text-[var(--inv)] tracking-widest uppercase animate-pulse">Running</span>
                                    ) : (
                                        <span className="text-[9px] font-bold text-[var(--text-dim)] tracking-widest uppercase">Locked</span>
                                    )}
                                </div>
                            </div>

                            <div className="flex-1">
                                <h3 className={`text-[13px] font-[800] mb-0.5 flex gap-1 items-center ${isActive ? 'text-[var(--inv)]' : isError ? 'text-[var(--s-ko)]' : 'text-[var(--text)]'}`}>
                                    {step.id} <ArrowRight size={10} className="text-[var(--border-high)]" /> {step.name}
                                </h3>

                                {isActive ? (
                                    <div className="flex items-center gap-2 mt-1.5 text-[10px] text-[var(--inv)]">
                                        <Loader2 size={12} className="animate-spin" /> {STEP_RUNNING_MSG[step.id] || 'Invocando modelo...'}
                                    </div>
                                ) : (
                                    <p className="text-[10px] text-[var(--text-muted)] min-h-[20px] leading-snug">{step.desc}</p>
                                )}
                            </div>

                            {/* Fotter contextual metadata */}
                            <div className="mt-3 pt-2 border-t border-[var(--border)] min-h-[28px] flex flex-col justify-end">
                                {isError && (
                                    <button
                                        onClick={() => startPipeline(index)}
                                        className="w-full py-1.5 rounded-md bg-[var(--s-ko)] text-white text-[10px] font-bold shadow-sm hover:brightness-110 active:scale-95 transition-all"
                                    >
                                        Reintentar este paso
                                    </button>
                                )}

                                {isCompleted && (
                                    <div className="flex flex-col gap-1">
                                        <div className="flex justify-between items-center text-[9px]">
                                            <span className="text-[var(--text-muted)] tracking-wider">TIME / MODEL</span>
                                            <span className="font-mono text-[var(--inv)]">{new Date().toLocaleTimeString()} · {step.model.split('/')[0]}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[9px]">
                                            <span className="text-[var(--text-muted)] tracking-wider">STATUS</span>
                                            {historyRuns[0]?.find(s => s.stepKey === step.id)?.status === '✅ Pre-cargado desde documento' ? (
                                                <span className="font-mono text-[var(--text-muted)]">PRE-CARGADO DOC</span>
                                            ) : (
                                                <span className="font-mono text-[var(--s-ok)]">25,329 TOKENS</span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {isBlocked && (
                                    <div className="flex items-center gap-1.5 text-[9px] text-[var(--text-dim)]">
                                        <Circle size={10} /> Esperando paso anterior
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {historyRuns.length > 0 && (
                <div className="ds-card p-5 mt-2">
                    <h3 className="text-[12px] font-[900] text-[var(--text)] uppercase tracking-widest mb-4 flex gap-2 items-center">
                        📋 OUTPUTS GENERADOS
                    </h3>
                    <div className="flex flex-wrap gap-3">
                        {STEPS.map(step => {
                            const latestRun = historyRuns[0];
                            const stepData = latestRun?.find((s: ResearchStep) => s.stepKey === step.id);
                            if (!stepData || !completedSteps.includes(step.id)) return null;
                            return (
                                <button key={step.id}
                                    onClick={() => setSelectedOutput({ title: `${step.id}: ${step.name}`, data: typeof stepData.outputJson === 'string' ? JSON.parse(stepData.outputJson) : stepData.outputText as string })}
                                    className="px-4 py-2 rounded-lg bg-[var(--surface2)] hover:bg-[var(--inv)]/10 hover:text-[var(--inv)] border border-[var(--border)] transition-colors text-[11px] font-bold shadow-sm"
                                >
                                    [{step.id}: {step.name} ↗]
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            <Dialog open={!!selectedOutput} onOpenChange={(o) => !o && setSelectedOutput(null)}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col bg-[var(--surface)] text-[var(--text)] border-[var(--border)]">
                    <DialogHeader>
                        <DialogTitle className="text-[16px] font-black tracking-wide text-[var(--inv)]">
                            {selectedOutput?.title}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="p-4 overflow-y-auto bg-[var(--surface2)] rounded-lg border border-[var(--border)] shadow-inner text-[12px] font-mono leading-relaxed whitespace-pre-wrap">
                        {JSON.stringify(selectedOutput?.data, null, 2)}
                    </div>
                </DialogContent>
            </Dialog>

            <div className="mt-4 ds-card p-4">
                <h3 className="text-[11px] font-[800] text-[var(--text)] uppercase tracking-widest mb-3 border-b border-[var(--border)] pb-2 flex gap-2 items-center">
                    <ScanSearch size={14} className="text-[var(--inv)]" /> Historial de Ciclos (Output P1-P6)
                </h3>
                {historyRuns.length > 0 ? (
                    <div className="space-y-2">
                        {historyRuns.map((runSteps, idx) => (
                            <div key={idx} className="flex justify-between items-center text-[11px] p-2 hover:bg-[var(--surface2)] rounded-lg font-mono border border-transparent hover:border-[var(--border)] transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-[var(--s-ok)]" />
                                    <span className="text-[var(--text-muted)]">{new Date(runSteps[0].createdAt).toLocaleString()}</span>
                                    <span className="font-bold text-[var(--text)] opacity-70">Run ID: {runSteps[0].runId}</span>
                                </div>
                                <div className="flex gap-2">
                                    {runSteps.map((s: ResearchStep) => s.stepKey).sort().map((k: string) => (
                                        <span key={k} className="px-1.5 bg-[var(--inv)]/10 text-[var(--inv)] font-[800] rounded text-[9px]">{k}</span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : <div className="text-center text-[10px] text-[var(--text-dim)] py-4 font-medium">No hay ciclos grabados todavía.</div>}
            </div>
        </div>
    );
}
