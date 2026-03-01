'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/lib/store/store-context';
import { Bot, RefreshCw, Layers } from 'lucide-react';

export default function AgentesPage() {
    const { activeStoreId: storeId } = useStore();
    const [agents, setAgents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedAgent, setSelectedAgent] = useState<any>(null);
    const [localPrompt, setLocalPrompt] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (storeId) fetchAgents();
    }, [storeId]);

    const fetchAgents = () => {
        setLoading(true);
        fetch(`/api/operaciones/agents?storeId=${storeId}`)
            .then(res => res.json())
            .then(d => {
                if (d.ok) setAgents(d.agents);
                setLoading(false);
            });
    };

    const handleSelect = (ag: any) => {
        setSelectedAgent(ag);
        setLocalPrompt(ag.systemPrompt || '');
    };

    const toggleStatus = (ag: any, current: boolean) => {
        fetch(`/api/operaciones/agents`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: ag.id, storeId, isActive: !current })
        }).then(fetchAgents);
    };

    const savePrompt = () => {
        if (!selectedAgent) return;
        setSaving(true);
        fetch(`/api/operaciones/agents`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: selectedAgent.id, storeId, systemPrompt: localPrompt })
        }).then(() => {
            setSaving(false);
            fetchAgents();
        });
    };

    if (!storeId) return null; // Handled by layout
    if (loading) return <div className="p-8 flex justify-center"><RefreshCw size={24} className="animate-spin text-[var(--ops)]" /></div>;

    return (
        <div className="flex flex-col md:flex-row gap-4 h-[calc(100vh-160px)]">
            <div className="w-full md:w-1/3 flex flex-col gap-2 overflow-y-auto no-scrollbar pr-2">
                <h3 className="section-title text-[var(--ops)]! sticky top-0 bg-[var(--bg)] z-10 pt-1 pb-2">Sistema Operativo IA</h3>
                {agents.map(ag => (
                    <div
                        key={ag.id}
                        onClick={() => handleSelect(ag)}
                        className={`ds-card-padded cursor-pointer transition-colors border-l-[3px] ${selectedAgent?.id === ag.id ? 'bg-[var(--surface2)] border-l-[var(--ops)] shadow-md' : 'hover:bg-[var(--surface2)] border-l-transparent'}`}
                    >
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[12px] font-[800] uppercase text-[var(--text)]">{ag.role}</span>
                            <button
                                onClick={(e) => { e.stopPropagation(); toggleStatus(ag, ag.isActive); }}
                                className={`text-[8px] px-2 py-0.5 rounded-full font-bold tracking-widest uppercase ${ag.isActive ? 'bg-[var(--s-ok)]/10 text-[var(--s-ok)]' : 'bg-[var(--s-ko)]/10 text-[var(--s-ko)]'}`}
                            >
                                {ag.isActive ? 'ACTIVO' : 'PAUSA'}
                            </button>
                        </div>
                        <p className="text-[10px] text-[var(--text-dim)] truncate">{ag.systemPrompt}</p>
                    </div>
                ))}
            </div>

            {/* Detail Area */}
            <div className="w-full md:w-2/3 ds-card flex flex-col overflow-hidden relative">
                {!selectedAgent ? (
                    <div className="flex-1 flex items-center justify-center text-[12px] text-[var(--text-muted)] p-8 text-center flex-col">
                        <Bot size={40} className="mb-4 text-[var(--border-high)] opacity-50" />
                        <p>Selecciona un agente para configurar su contexto, modelado y memoria.</p>
                    </div>
                ) : (
                    <div className="flex flex-col h-full animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-4 border-b border-[var(--border)] bg-[var(--surface2)] flex justify-between items-center shrink-0">
                            <div>
                                <h2 className="text-[16px] font-[800] text-[var(--text)] leading-tight">{selectedAgent.role}</h2>
                                <p className="text-[10px] uppercase text-[var(--text-dim)] font-bold tracking-widest mt-1">Configuración Core</p>
                            </div>
                            <button onClick={savePrompt} disabled={saving} className="ds-btn py-1.5 px-4 text-[11px]">
                                {saving ? <RefreshCw size={12} className="animate-spin inline mr-1" /> : 'Guardar'}
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[var(--surface)]">
                            <div>
                                <label className="text-label flex gap-1 items-center mb-1 text-[var(--ops)] font-black uppercase"><Layers size={12} /> SYSTEM PROMPT</label>
                                <textarea
                                    value={localPrompt}
                                    onChange={e => setLocalPrompt(e.target.value)}
                                    className="w-full h-80 bg-slate-50 border border-[var(--border)] rounded-[var(--r-md)] p-3 text-[12px] text-[var(--text)] font-mono resize-none focus:outline-none focus:border-[var(--ops)]"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="ds-card-padded bg-[var(--surface2)]">
                                    <span className="text-[9px] font-bold text-[var(--text-dim)] uppercase tracking-wider mb-2 block">Métricas de Rendimiento (Histórico)</span>
                                    <div className="flex justify-between text-[11px] font-mono border-b border-[var(--border)] py-1"><span>Llamadas API:</span> <b>342</b></div>
                                    <div className="flex justify-between text-[11px] font-mono border-b border-[var(--border)] py-1"><span>Tokens Procesados:</span> <b>8.2M</b></div>
                                    <div className="flex justify-between text-[11px] font-mono py-1"><span>Avg Latency:</span> <b>1.2s</b></div>
                                </div>
                                <div className="ds-card-padded bg-[var(--surface2)] opacity-70">
                                    <span className="text-[9px] font-bold text-[var(--text-dim)] uppercase tracking-wider mb-2 block">Settings del Modelo</span>
                                    <div className="flex justify-between text-[11px] font-mono border-b border-[var(--border)] py-1"><span>Engine:</span> <b>GPT-4o / Claude 3.5</b></div>
                                    <div className="flex justify-between text-[11px] font-mono py-1"><span>Temperatura:</span> <b>0.4</b></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
