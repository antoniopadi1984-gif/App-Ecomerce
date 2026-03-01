'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/lib/store/store-context';
import { useProduct } from '@/context/ProductContext';
import {
    ShoppingCart, Package, CreditCard, Users,
    MessageSquare, Settings, Bot, Sparkles, AlertCircle, RefreshCw, Layers
} from 'lucide-react';
import { AgentCompanion } from '@/components/layout/agent-companion';

const TABS = [
    { id: 'PEDIDOS', label: 'Pedidos', icon: Package },
    { id: 'FINANZAS', label: 'Finanzas', icon: CreditCard },
    { id: 'EQUIPO', label: 'Equipo', icon: Users },
    { id: 'COMUNICACIONES', label: 'Comunicaciones', icon: MessageSquare },
    { id: 'AUTOMATIZACIONES', label: 'Autos', icon: Settings },
    { id: 'AGENTES', label: 'Agentes IA', icon: Bot },
    { id: 'VALOR', label: 'Valor Percibido', icon: Sparkles },
];

// Reutilizamos PillTab
function PillTab({ active, label, icon: Icon, set }: { active: boolean; label: string; icon: any; set: () => void }) {
    return (
        <button
            onClick={set}
            className={`module-tab flex items-center gap-1.5 ${active ? 'active' : ''}`}
            style={active ? { '--tab-color': 'var(--ops)' } as any : {}}
        >
            <Icon size={14} className={active ? '' : 'text-[var(--text-dim)]'} />
            {label}
        </button>
    );
}

// ─── Sub-Tab: AGENTES IA ──────────────────────────────────────────
function AgentesTab({ storeId }: { storeId: string }) {
    const [agents, setAgents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedAgent, setSelectedAgent] = useState<any>(null);
    const [localPrompt, setLocalPrompt] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchAgents();
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

    if (loading) return <div className="p-8 flex justify-center"><RefreshCw size={24} className="animate-spin text-[var(--ops)]" /></div>;

    return (
        <div className="flex flex-col md:flex-row gap-4 h-[600px]">
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
                                <label className="text-label flex gap-1 items-center mb-1 text-[var(--ops)]"><Layers size={12} /> SYSTEM PROMPT</label>
                                <textarea
                                    value={localPrompt}
                                    onChange={e => setLocalPrompt(e.target.value)}
                                    className="w-full h-64 bg-slate-50 border border-[var(--border)] rounded-[var(--r-md)] p-3 text-[12px] text-[var(--text)] font-mono resize-none focus:outline-none focus:border-[var(--ops)]"
                                />
                            </div>

                            {/* Placeholders UI for other requested elements */}
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

// ─── Sub-Tab: VALOR PERCIBIDO ─────────────────────────────────────
function ValorPercibidoTab({ storeId, productId }: { storeId: string, productId: string | null }) {
    const [generaciones, setGeneraciones] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const reqGen = (type: string) => {
        if (!storeId) return;
        setLoading(true);
        fetch('/api/perceived-value/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ storeId, productId, type })
        })
            .then(r => r.json())
            .then(() => {
                fetchList();
                setLoading(false);
            });
    };

    const fetchList = () => {
        fetch(`/api/perceived-value/generate?storeId=${storeId}${productId !== 'GLOBAL' ? '&productId=' + productId : ''}`)
            .then(r => r.json())
            .then(d => { if (d.success) setGeneraciones(d.items); });
    };

    useEffect(() => { fetchList(); }, [storeId, productId]);

    const BuilderCard = ({ title, desc, type, colorHex }: { title: string, desc: string, type: string, colorHex: string }) => (
        <div className="ds-card-padded border-t-[4px] relative overflow-hidden group hover:shadow-lg transition-all" style={{ borderTopColor: colorHex }}>
            <Sparkles size={60} className="absolute -right-4 -bottom-4 opacity-[0.03] text-black group-hover:scale-125 transition-transform duration-500" />
            <h3 className="text-[14px] font-[800] text-[var(--text)] mb-1 leading-tight">{title}</h3>
            <p className="text-[10px] text-[var(--text-muted)] mb-4 min-h-[30px]">{desc}</p>
            <button
                onClick={() => reqGen(type)}
                disabled={loading}
                className="btn-compact text-white w-full shadow-md hover:brightness-110"
                style={{ backgroundColor: colorHex }}
            >
                {loading ? <RefreshCw size={12} className="animate-spin" /> : 'Generar IA'}
            </button>
        </div>
    );

    return (
        <div className="flex flex-col h-[600px]">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <BuilderCard title="Ebook Premium" desc="Genera PDF con portada e índice sobre tu producto de manera autónoma." type="EBOOK" colorHex="#8B5CF6" />
                <BuilderCard title="Mini Curso Video" desc="Guioniza y renderiza un mini curso con avatar IA impartiéndolo." type="MINICOURSE" colorHex="#F59E0B" />
                <BuilderCard title="Lista de Bonos" desc="Audita el producto actual y crea 5 bonos satélite de alto valor." type="BONUS" colorHex="#10B981" />
                <BuilderCard title="Estrategia Cupón" desc="Dinámicas de urgencia para email marketing automatizado." type="COUPON" colorHex="#EF4444" />
            </div>

            <h3 className="section-title text-[var(--ops)]!">Biblioteca Generada</h3>
            <div className="flex-1 ds-card overflow-y-auto">
                <table className="ds-table w-full">
                    <thead>
                        <tr>
                            <th className="w-1/4">Tipo / Status</th>
                            <th>Título / Salida Base</th>
                            <th className="text-right">Fecha</th>
                        </tr>
                    </thead>
                    <tbody>
                        {generaciones.length === 0 ? (
                            <tr><td colSpan={3} className="text-center p-4 text-[11px] text-[var(--text-dim)]">No hay items generados.</td></tr>
                        ) : generaciones.map(g => (
                            <tr key={g.id} className="hover:bg-[var(--surface2)] group cursor-pointer">
                                <td className="p-3">
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${g.status === 'READY' ? 'bg-[var(--s-ok)]/10 text-[var(--s-ok)]' : 'bg-[var(--s-wa)]/10 text-[var(--s-wa)] animate-pulse'}`}>
                                        {g.type} • {g.status}
                                    </span>
                                </td>
                                <td className="p-3 text-[12px] font-semibold text-[var(--text)]">
                                    {g.title}
                                </td>
                                <td className="p-3 text-right text-[11px] text-[var(--text-dim)] font-mono">
                                    {new Date(g.createdAt).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ─── PÁGINA PRINCIPAL /operaciones ─────────────────────────────────
export default function OperacionesPage() {
    const { activeStoreId } = useStore();
    const { productId } = useProduct();
    const [activeTab, setActiveTab] = useState(TABS[0].id);

    const contextForAgent = `Operaciones. Viendo pestaña ${activeTab}. Tienda: ${activeStoreId}. Producto filtrado (si aplica): ${productId}`;

    return (
        <div className="content-main flex flex-col gap-4 pt-0 h-full">
            <div className="flex justify-between items-center py-2 mt-2">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded shrink-0 bg-[#10B981] flex items-center justify-center text-white shadow-sm">
                        <ShoppingCart size={18} />
                    </div>
                    <div>
                        <h1 className="text-[14px] font-[800] leading-none text-[var(--text)] tracking-tight">Operaciones Base</h1>
                        <p className="text-[10px] text-[var(--text-muted)] mt-0.5 max-w-sm uppercase tracking-wide">
                            Gestor central: Finanzas, Equipo, IA y Automatización
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
                    {activeTab === 'AGENTES' && <AgentesTab storeId={activeStoreId} />}
                    {activeTab === 'VALOR' && <ValorPercibidoTab storeId={activeStoreId} productId={productId} />}

                    {/* Placeholders for other tabs - preserving UI standard */}
                    {['PEDIDOS', 'FINANZAS', 'EQUIPO', 'COMUNICACIONES', 'AUTOMATIZACIONES'].includes(activeTab) && (
                        <div className="h-[400px] flex flex-col items-center justify-center text-center p-8 ds-card text-[var(--text-muted)] border-dashed border-2 bg-transparent">
                            <AlertCircle size={32} className="mb-2 opacity-50" />
                            <h3 className="text-[14px] font-[800] text-[var(--text)] mb-1">Módulo "{TABS.find(t => t.id === activeTab)?.label}" en Construcción</h3>
                            <p className="text-[11px]">Reservado para implementación de tablas masivas y P&L directo.</p>
                        </div>
                    )}
                </div>
            )}

            <AgentCompanion pageContext={contextForAgent} agentRole="general" />
        </div>
    );
}
