'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/context/StoreContext';
import { Bot, RefreshCw, Save, RotateCcw, Sparkles, MessageSquare, Trash2, Plus, Type, FileImage, Youtube } from 'lucide-react';
import { DEFAULT_AGENT_PROMPTS } from '@/lib/ai/defaults/agent-prompts';
import { toast } from 'sonner';

const AGENT_LIST = [
    { id: 'creative', name: 'Especialista Creativo', role: 'ESPECIALISTA_CREATIVO', tier: 1 },
    { id: 'marketing', name: 'Director Marketing', role: 'DIRECTOR_MARKETING', tier: 2 },
    { id: 'operations', name: 'Agente Operaciones', role: 'AGENTE_OPERACIONES', tier: 3 },
];

interface Example {
    tipo: 'text' | 'image' | 'video';
    contenido: string;
}

export default function AgentesPage() {
    const { activeStoreId: storeId } = useStore();
    const [agentsFromDb, setAgentsFromDb] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedAgentId, setSelectedAgentId] = useState<string>(AGENT_LIST[0].id);
    const [saving, setSaving] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        systemPrompt: '',
        examples: [] as Example[]
    });

    useEffect(() => {
        if (storeId) {
            fetchAgents();
        }
    }, [storeId]);

    const fetchAgents = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/settings/agents?storeId=${storeId}`);
            const data = await res.json();
            if (data.ok) {
                setAgentsFromDb(data.configs || []);
            }
        } catch (error) {
            console.error('Error fetching agents:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateFormData = (agentId: string, fromDb: any[]) => {
        const configAgent = AGENT_LIST.find(a => a.id === agentId);
        const dbAgent = fromDb.find((a: any) => a.agentId === configAgent?.role);

        if (dbAgent) {
            setFormData({
                name: configAgent?.name || '',
                systemPrompt: dbAgent.systemPrompt || '',
                examples: Array.isArray(dbAgent.examples) ? dbAgent.examples : []
            });
        } else {
            const defaultPrompt = DEFAULT_AGENT_PROMPTS[configAgent?.role as keyof typeof DEFAULT_AGENT_PROMPTS] || '';
            setFormData({
                name: configAgent?.name || '',
                systemPrompt: defaultPrompt,
                examples: []
            });
        }
    };

    useEffect(() => {
        updateFormData(selectedAgentId, agentsFromDb);
    }, [selectedAgentId, agentsFromDb]);

    const handleSave = async () => {
        if (!storeId) return;
        const configAgent = AGENT_LIST.find(a => a.id === selectedAgentId);
        if (!configAgent) return;

        setSaving(true);
        try {
            const res = await fetch('/api/settings/agents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    storeId,
                    agentId: configAgent.role,
                    systemPrompt: formData.systemPrompt,
                    examples: formData.examples
                }),
            });
            const data = await res.json();
            if (data.ok) {
                await fetchAgents();
                toast.success('Configuración guardada correctamente');
            }
        } catch (error) {
            toast.error('Error al guardar la configuración');
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        const configAgent = AGENT_LIST.find(a => a.id === selectedAgentId);
        if (configAgent) {
            const defaultPrompt = DEFAULT_AGENT_PROMPTS[configAgent.role as keyof typeof DEFAULT_AGENT_PROMPTS] || '';
            setFormData(prev => ({
                ...prev,
                systemPrompt: defaultPrompt
            }));
            toast.info('Instrucciones reseteadas a valores por defecto');
        }
    };

    const addExample = (tipo: 'text' | 'image' | 'video') => {
        setFormData(prev => ({
            ...prev,
            examples: [...prev.examples, { tipo, contenido: '' }]
        }));
    };

    const removeExample = (index: number) => {
        setFormData(prev => ({
            ...prev,
            examples: prev.examples.filter((_, i) => i !== index)
        }));
    };

    const updateExample = (index: number, contenido: string) => {
        setFormData(prev => {
            const newEx = [...prev.examples];
            newEx[index].contenido = contenido;
            return { ...prev, examples: newEx };
        });
    };

    if (!storeId) return <div className="p-8 text-center text-[var(--text-muted)]">Cargando tienda...</div>;

    return (
        <div className="flex h-[calc(100vh-140px)] gap-6 animate-in fade-in duration-500">

            {/* Sidebar de Agentes */}
            <div className="w-80 flex flex-col gap-2 overflow-y-auto pr-2 custom-scrollbar">
                <div className="flex items-center gap-2 mb-4 px-1">
                    <Bot size={18} className="text-[var(--ops)]" />
                    <h2 className="text-[14px] font-[900] uppercase tracking-tighter text-[var(--text-primary)]">Agentes Inteligentes</h2>
                </div>

                {AGENT_LIST.map(agent => {
                    const isSelected = selectedAgentId === agent.id;
                    const hasCustom = agentsFromDb.some(a => a.agentId === agent.role);

                    return (
                        <button
                            key={agent.id}
                            onClick={() => setSelectedAgentId(agent.id)}
                            className={`flex flex-col gap-1 p-4 rounded-2xl text-left transition-all border group relative ${isSelected
                                ? 'bg-white border-[var(--ops)] shadow-xl scale-[1.02] z-10'
                                : 'bg-[var(--surface2)]/50 border-transparent hover:border-[var(--border)] opacity-80'
                                }`}
                        >
                            {hasCustom && (
                                <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-[var(--ops)] shadow-sm shadow-[var(--ops)]/50 animate-pulse" />
                            )}

                            <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[12px] font-[900] uppercase tracking-tighter ${isSelected ? 'text-[var(--ops)]' : 'text-[var(--text-primary)]'}`}>
                                    {agent.name}
                                </span>
                                <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">Tier {agent.tier}</span>
                            </div>
                            <span className="text-[9px] text-[var(--text-tertiary)] font-bold uppercase tracking-widest flex items-center gap-1">
                                <Sparkles size={8} /> {agent.role}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Editor de Agente */}
            <div className="flex-1 bg-white rounded-3xl border border-[var(--border)] shadow-sm flex flex-col overflow-hidden">

                {/* Header del Editor */}
                <div className="p-6 border-b border-[var(--border)] flex justify-between items-center bg-[var(--surface2)]/20">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white border border-[var(--border)] flex items-center justify-center shadow-sm">
                            <Bot className="text-[var(--ops)]" size={24} />
                        </div>
                        <div>
                            <h2 className="text-[18px] font-black text-[var(--text-primary)]">{formData.name}</h2>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[9px] font-black text-[var(--ops)] uppercase bg-[var(--ops)]/10 px-2 py-0.5 rounded tracking-widest">
                                    CONFIG: {AGENT_LIST.find(a => a.id === selectedAgentId)?.role}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={handleReset}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--border)] text-[11px] font-bold hover:bg-[var(--surface2)] transition-colors text-[var(--text-secondary)]"
                        >
                            <RotateCcw size={14} />
                            Resetear
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-2 rounded-xl bg-[var(--ops)] text-white text-[11px] font-[900] shadow-lg shadow-[var(--ops)]/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 uppercase tracking-tighter"
                        >
                            {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                            Guardar Cambios
                        </button>
                    </div>
                </div>

                {/* Contenido del Editor */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">

                    {/* System Prompt Section */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Sparkles size={14} className="text-[var(--s-in)]" />
                                <label className="text-[11px] font-black uppercase tracking-widest text-[var(--text-primary)]">System Prompt (Personalidad y Reglas)</label>
                            </div>
                            <span className="text-[10px] text-[var(--text-tertiary)] font-medium">Instrucciones fundamentales</span>
                        </div>
                        <textarea
                            value={formData.systemPrompt}
                            onChange={e => setFormData({ ...formData, systemPrompt: e.target.value })}
                            className="w-full h-80 bg-[var(--bg)] border border-[var(--border)] rounded-2xl p-6 text-[12px] leading-relaxed text-[var(--text-primary)] font-medium outline-none focus:border-[var(--ops)] focus:ring-2 focus:ring-[var(--ops)]/5 transition-all resize-none shadow-inner"
                            placeholder="Escribe aquí las instrucciones maestras del agente..."
                        />
                    </div>

                    {/* Mejora y Ejemplos Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <MessageSquare size={14} className="text-[var(--ops)]" />
                                <label className="text-[11px] font-black uppercase tracking-widest text-[var(--text-primary)]">Ejemplos de Mejora (RAG / Few-Shot)</label>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => addExample('text')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] text-[9px] font-bold bg-[var(--surface2)] hover:border-slate-300">
                                    <Type size={12} /> + TEXTO
                                </button>
                                <button onClick={() => addExample('image')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] text-[9px] font-bold bg-[var(--surface2)] hover:border-slate-300">
                                    <FileImage size={12} /> + IMAGEN
                                </button>
                                <button onClick={() => addExample('video')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] text-[9px] font-bold bg-[var(--surface2)] hover:border-slate-300">
                                    <Youtube size={12} /> + VIDEO
                                </button>
                            </div>
                        </div>

                        {formData.examples.length === 0 && (
                            <div className="border border-dashed border-[var(--border)] rounded-2xl p-8 text-center bg-[var(--surface2)]/50">
                                <p className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase tracking-widest">Sin ejemplos configurados</p>
                            </div>
                        )}

                        <div className="space-y-3">
                            {formData.examples.map((ex, i) => (
                                <div key={i} className="flex gap-3 items-start bg-[var(--surface2)] p-4 rounded-xl border border-[var(--border)] animate-in slide-in-from-top-2 duration-200">
                                    <div className="p-2 rounded-lg bg-white border border-[var(--border)] text-[var(--ops)]">
                                        {ex.tipo === 'text' && <Type size={16} />}
                                        {ex.tipo === 'image' && <FileImage size={16} />}
                                        {ex.tipo === 'video' && <Youtube size={16} />}
                                    </div>
                                    <div className="flex-1">
                                        <textarea
                                            value={ex.contenido}
                                            onChange={e => updateExample(i, e.target.value)}
                                            className="w-full bg-white border border-[var(--border)] rounded-lg p-2 text-[11px] text-[var(--text-primary)] outline-none focus:border-[var(--ops)]"
                                            rows={2}
                                            placeholder={ex.tipo === 'text' ? 'Ejemplo de texto o respuesta ideal...' : 'URL del asset o descripción técnica...'}
                                        />
                                    </div>
                                    <button onClick={() => removeExample(i)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

            </div>

        </div>
    );
}
