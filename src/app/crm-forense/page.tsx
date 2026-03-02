'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/lib/store/store-context';
import { Users, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { AgentCompanion } from '@/components/layout/agent-companion';
import { ViewMode } from '@/lib/crmPeriods';

const TABS = [
    { id: 'VENTAS', label: 'Ventas' },
    { id: 'CLIENTES', label: 'Clientes' },
    { id: 'TRANSPORTISTAS', label: 'Transportistas' },
    { id: 'EMPLEADOS', label: 'Empleados' },
    { id: 'AGENTES', label: 'Agentes IA' },
    { id: 'CREATIVOS', label: 'Creativos' },
    { id: 'PRODUCTOS', label: 'Productos' },
    { id: 'COD_VS_CARD', label: 'COD vs Tarjeta' },
];

function PillTab({ active, label, set }: { active: boolean; label: string; set: () => void }) {
    return (
        <button
            onClick={set}
            className={`module-tab ${active ? 'active' : ''}`}
            style={active ? { '--tab-color': 'var(--crm)' } as any : {}}
        >
            {label}
        </button>
    );
}

function MetricTable({ label, values, days }: { label: string, values: number[], days: number }) {
    const isCurrency = label.includes('€');
    const isPct = label.includes('%');
    const isRoas = label.includes('x');

    const format = (v: number) => {
        if (v === 0) return '-';
        if (isCurrency) return `€${v >= 1000 ? (v / 1000).toFixed(1) + 'k' : Math.round(v)}`;
        if (isRoas) return `${v}x`;
        if (isPct) return `${v}%`;
        return Math.round(v);
    };

    return (
        <tr className="border-b border-[var(--border)] hover:bg-[var(--surface2)] transition-colors">
            <td className="sticky left-0 bg-[var(--surface)] z-10 p-2 text-[10px] font-bold text-[var(--text)] border-r border-[var(--border)] whitespace-nowrap shadow-[2px_0_4px_rgba(0,0,0,0.02)]">
                {label}
            </td>
            {Array.from({ length: days }).map((_, i) => (
                <td key={i} className={`p-2 text-center text-[10px] font-mono whitespace-nowrap ${values[i] > 0 ? 'text-[var(--text)]' : 'text-[var(--text-dim)]'}`}>
                    {format(values[i] || 0)}
                </td>
            ))}
            <td className="p-2 text-right text-[10px] font-bold font-mono text-[var(--crm)] border-l border-[var(--border)] bg-[var(--surface2)]/50">
                {format(isRoas || isPct ? values.reduce((a, b) => a + b, 0) / values.filter(v => v > 0).length || 0 : values.reduce((a, b) => a + b, 0))}
            </td>
        </tr>
    );
}

export default function CrmForensePage() {
    const { activeStoreId } = useStore();
    const [activeTab, setActiveTab] = useState(TABS[0].id);
    const [date, setDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<ViewMode>("daily");

    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    useEffect(() => {
        if (!activeStoreId) return;
        setLoading(true);
        fetch(`/api/crm-forense?storeId=${activeStoreId}&tab=${activeTab}&month=${month}&year=${year}`)
            .then(r => r.json())
            .then(d => {
                if (d.ok) setData(d);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [activeStoreId, activeTab, month, year]);

    const changeMonth = (delta: number) => {
        const d = new Date(date);
        d.setMonth(d.getMonth() + delta);
        setDate(d);
    };

    const contextForAgent = `CRM Forense. Viendo datos de ${activeTab} del mes ${month}/${year}.`;

    return (
        <div className="content-main flex flex-col gap-4 pt-0">

            {/* Header compact */}
            <div className="flex justify-between items-center py-2 mt-2">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded shrink-0 bg-[#D44F8E] flex items-center justify-center text-white shadow-sm">
                        <Users size={18} />
                    </div>
                    <div>
                        <h1 className="text-[14px] font-[800] leading-none text-[var(--text)] tracking-tight">CRM Forense</h1>
                        <p className="text-[10px] text-[var(--text-muted)] mt-0.5 max-w-sm uppercase tracking-wide">
                            Análisis granular de rendimiento 360º
                        </p>
                    </div>
                </div>

                <div style={{ display: "flex", background: "#f1f5f9", borderRadius: "8px", padding: "2px", gap: "2px", height: "fit-content" }}>
                    {(["daily", "weekly", "monthly", "annual"] as ViewMode[]).map(mode => (
                        <button key={mode} onClick={() => setViewMode(mode)} style={{
                            padding: "4px 14px", fontSize: "11px", fontWeight: 700,
                            borderRadius: "6px", border: "none", cursor: "pointer",
                            background: viewMode === mode ? "white" : "transparent",
                            color: viewMode === mode ? "#1e293b" : "#94a3b8",
                            boxShadow: viewMode === mode ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                            transition: "all 0.15s"
                        }}>
                            {mode === "daily" ? "Diario" : mode === "weekly" ? "Semanal" : mode === "monthly" ? "Mensual" : "Anual"}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tabs Principales */}
            <div className="module-tabs overflow-x-auto no-scrollbar max-w-full ds-card px-1 py-1 flex-nowrap shrink-0">
                {TABS.map(t => (
                    <PillTab key={t.id} active={activeTab === t.id} label={t.label} set={() => setActiveTab(t.id)} />
                ))}
            </div>

            {!activeStoreId ? (
                <div className="text-center p-8 text-[11px] font-semibold text-[var(--text-dim)] ds-card">
                    Selecciona una tienda en el selector superior (TopBar) para ver el CRM.
                </div>
            ) : (
                <div className="flex-1 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">

                    {/* Header de Tabla Pizarras Mensuales */}
                    <div className="ds-card-padded py-3 flex items-center justify-between">
                        <div className="text-[11px] font-bold text-[var(--text)] uppercase tracking-wide">
                            Vista Pizarra — {TABS.find(t => t.id === activeTab)?.label}
                        </div>

                        <div className="flex items-center gap-2 bg-[var(--surface2)] rounded-[var(--r-sm)] p-0.5 border border-[var(--border)]">
                            <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-[var(--surface)] rounded text-[var(--text-muted)] transition-colors"><ChevronLeft size={14} /></button>
                            <span className="text-[10px] font-bold px-2 uppercase text-[var(--text)] min-w-[100px] text-center">
                                {date.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
                            </span>
                            <button onClick={() => changeMonth(1)} className="p-1 hover:bg-[var(--surface)] rounded text-[var(--text-muted)] transition-colors"><ChevronRight size={14} /></button>
                        </div>
                    </div>

                    {/* Gran Tabla Horizontal (Mobile-First scrollable) */}
                    <div className="ds-table-wrap overflow-x-auto no-scrollbar relative">
                        {loading ? (
                            <div className="min-h-[150px] flex items-center justify-center text-[10px] text-[var(--text-muted)] uppercase tracking-widest">
                                <Loader2 className="w-4 h-4 animate-spin mr-2 text-[var(--crm)]" /> Procesando Pizarra...
                            </div>
                        ) : !data?.data?.metrics?.length ? (
                            <div className="min-h-[150px] flex items-center justify-center text-[10px] text-[var(--text-muted)] uppercase tracking-widest">
                                No hay datos en este ciclo
                            </div>
                        ) : (
                            <table className="ds-table w-full">
                                <thead className="sticky top-0 z-20">
                                    <tr>
                                        <th className="sticky left-0 bg-[var(--surface2)] z-30 min-w-[140px] border-r border-[var(--border)] shadow-[2px_0_4px_rgba(0,0,0,0.02)]">
                                            Métrica
                                        </th>
                                        {Array.from({ length: data.daysInMonth }).map((_, i) => (
                                            <th key={i} className="min-w-[40px] text-center px-1">
                                                D{i + 1}
                                            </th>
                                        ))}
                                        <th className="min-w-[80px] text-right border-l border-[var(--border)] bg-[var(--surface2)]">
                                            Total Mes
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.data.metrics.map((m: any, idx: number) => (
                                        <MetricTable key={idx} label={m.label} values={m.values} days={data.daysInMonth} />
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Resumen Semanal Cards (Placeholder para UI completa futura dictada en manual) */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-2">
                        {[1, 2, 3, 4].map(w => (
                            <div key={w} className="ds-card-padded border-l-[3px] border-l-[var(--crm)]">
                                <div className="text-[9px] font-bold text-[var(--text-dim)] uppercase tracking-widest mb-1">Semana {w}</div>
                                <div className="text-[20px] font-[800] leading-none text-[var(--text)] font-mono">
                                    €—
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
            )}

            {/* Agente Compañante Inyectado, pide perfil crm-forense si existiese */}
            <AgentCompanion pageContext={contextForAgent} agentRole="crm-forense" />
        </div>
    );
}
