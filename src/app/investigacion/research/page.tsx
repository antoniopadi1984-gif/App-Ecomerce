'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/lib/store/store-context';
import { useProduct } from '@/context/ProductContext';
import { Play, CheckCircle2, Circle, Loader2, ArrowRight, BrainCircuit, ScanSearch, UserPlus, FileText, Share2, Target } from 'lucide-react';

const STEPS = [
    { id: 'P1', name: 'Product Core Extraction', desc: 'Funcionalidad, mecanismos y features', icon: ScanSearch },
    { id: 'P2', name: 'Macro Avatar Engine', desc: 'Generación de 20 perfiles arquetipo', icon: UserPlus },
    { id: 'P3', name: 'Language Bank', desc: 'Extracción de vocabulario taboo y creencias', icon: FileText },
    { id: 'P4', name: 'Angle Engine', desc: 'Identificación de Ángulos P.A.S.T.', icon: Target },
    { id: 'P5', name: 'Combo Matrix', desc: '400 combinaciones AV x ANG + Hooks', icon: Share2 },
    { id: 'P6', name: 'Vector Mapping', desc: 'Estructuras base para cada formato Ad', icon: BrainCircuit },
];

export default function ResearchCorePage() {
    const { activeStoreId } = useStore();
    const { productId } = useProduct();
    const [running, setRunning] = useState(false);
    const [runId, setRunId] = useState<string | null>(null);
    const [completedSteps, setCompletedSteps] = useState<string[]>([]);
    const [currentStep, setCurrentStep] = useState<string | null>(null);
    const [historyRuns, setHistoryRuns] = useState<any[]>([]);

    useEffect(() => {
        if (!productId || productId === 'GLOBAL') return;
        fetch(`/api/research/god-tier?productId=${productId}`)
            .then(res => res.json())
            .then(d => {
                if (d.ok && d.runs) {
                    const runsArr = Object.values(d.runs) as any[];
                    if (runsArr.length > 0) {
                        const latestRun = runsArr.sort((a, b) => new Date(b[0].createdAt).getTime() - new Date(a[0].createdAt).getTime())[0];
                        setRunId(latestRun[0].runId);
                        setCompletedSteps(latestRun.map((s: any) => s.stepKey));
                        setHistoryRuns(runsArr);
                    } else {
                        setRunId(null);
                        setCompletedSteps([]);
                    }
                }
            });
    }, [productId]);

    const startPipeline = async () => {
        if (!activeStoreId || !productId || productId === 'GLOBAL') return;
        setRunning(true);
        setCompletedSteps([]);
        const newRunId = `run_${Date.now()}`;
        setRunId(newRunId);

        for (const step of STEPS) {
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
                if (!d.ok) break;
                setCompletedSteps(prev => [...prev, step.id]);
            } catch (e) {
                break;
            }
        }
        setCurrentStep(null);
        setRunning(false);
    };

    return (
        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="ds-card-padded bg-[var(--surface2)] flex items-center justify-between shadow-sm">
                <div>
                    <h2 className="text-[14px] font-[800] text-[var(--text)] flex items-center gap-2">
                        <BrainCircuit size={16} className="text-[var(--inv)]" /> Pipeline Canónico (God Tier)
                    </h2>
                    <p className="text-[10px] text-[var(--text-muted)] mt-0.5">La base de nuestra inteligencia artificial generativa. Ejecuta secuencialmente.</p>
                </div>

                <button
                    onClick={startPipeline}
                    disabled={running}
                    className="ds-btn bg-[var(--inv)] text-white hover:brightness-110 shadow-[0_4px_14px_rgba(139,92,246,0.39)] px-6"
                >
                    {running ? (
                        <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Procesando...</span>
                    ) : completedSteps.length === 6 ? (
                        <span className="flex items-center gap-2"><Play size={14} /> Re-ejecutar (Actualizar Contexto)</span>
                    ) : (
                        <span className="flex items-center gap-2"><Play size={14} /> Run Research</span>
                    )}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {STEPS.map((step) => {
                    const isCompleted = completedSteps.includes(step.id);
                    const isActive = currentStep === step.id;
                    return (
                        <div key={step.id}
                            className={`ds-card-padded border-l-4 transition-all duration-300 relative overflow-hidden ${isCompleted ? 'border-l-[var(--s-ok)] bg-[var(--s-ok)]/5' :
                                isActive ? 'border-l-[var(--inv)] border-t border-r border-b border-[var(--inv)] shadow-lg scale-[1.02] z-10' :
                                    'border-l-[var(--border-high)] bg-[var(--surface)] opacity-70'
                                }`}
                        >
                            {isActive && <div className="absolute top-0 left-0 w-full h-[2px] bg-[var(--inv)] animate-pulse" />}
                            <div className="flex justify-between items-start mb-2">
                                <div className={`p-1.5 rounded-md ${isCompleted ? 'bg-[var(--s-ok)]/20 text-[var(--s-ok)]' : isActive ? 'bg-[var(--inv)]/20 text-[var(--inv)]' : 'bg-[var(--surface2)] text-[var(--text-dim)]'}`}>
                                    <step.icon size={16} />
                                </div>
                                <div>
                                    {isCompleted ? <CheckCircle2 size={16} className="text-[var(--s-ok)]" /> : isActive ? <Loader2 size={16} className="text-[var(--inv)] animate-spin" /> : <Circle size={16} className="text-[var(--border-high)]" />}
                                </div>
                            </div>
                            <h3 className={`text-[12px] font-[800] mb-0.5 flex gap-1 items-center ${isActive ? 'text-[var(--inv)]' : 'text-[var(--text)]'}`}>
                                {step.id} <ArrowRight size={10} className="text-[var(--border-high)]" /> {step.name}
                            </h3>
                            <p className="text-[10px] text-[var(--text-muted)] min-h-[30px] leading-snug">{step.desc}</p>
                            {isCompleted && (
                                <div className="mt-2 pt-2 border-t border-[var(--s-ok)]/20 flex justify-between items-center text-[9px] font-bold text-[var(--s-ok)]">
                                    <span>Output inyectado</span>
                                    <span className="font-mono">JSON OK</span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="mt-4 ds-card p-4">
                <h3 className="text-[11px] font-bold text-[var(--text)] uppercase tracking-widest mb-3 border-b border-[var(--border)] pb-2 flex gap-2 items-center">
                    <ScanSearch size={14} className="text-[var(--inv)]" /> Historial de Ciclos (Output P1-P6)
                </h3>
                {historyRuns.length > 0 ? (
                    <div className="space-y-2">
                        {historyRuns.map((runSteps, idx) => (
                            <div key={idx} className="flex justify-between items-center text-[11px] p-2 hover:bg-[var(--surface2)] rounded-[var(--r-sm)] font-mono border border-transparent hover:border-[var(--border)] transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-[var(--s-ok)]" />
                                    <span className="text-[var(--text-muted)]">{new Date(runSteps[0].createdAt).toLocaleString()}</span>
                                    <span className="font-bold text-[var(--text)] opacity-70">Run ID: {runSteps[0].runId}</span>
                                </div>
                                <div className="flex gap-2">
                                    {runSteps.map((s: any) => s.stepKey).sort().map((k: any) => (
                                        <span key={k} className="px-1.5 bg-[var(--inv)]/10 text-[var(--inv)] font-bold rounded text-[9px]">{k}</span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : <div className="text-center text-[10px] text-[var(--text-dim)] py-4">No hay ciclos grabados todavía.</div>}
            </div>
        </div>
    );
}
