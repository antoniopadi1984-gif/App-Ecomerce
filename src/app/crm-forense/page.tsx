'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/lib/store/store-context';
import { Users, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { AgentCompanion } from '@/components/layout/agent-companion';
import { ViewMode, getWeeklySummary, DayData, WeekSummary } from '@/lib/crmPeriods';

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
    const [activeWeek, setActiveWeek] = useState(0);

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
        setActiveWeek(0);
    };

    const parseDailyData = (metrics: any[], daysInMonth: number): DayData[] => {
        if (!metrics || metrics.length === 0) return [];
        const getV = (label: string) => metrics.find((m: any) => m.label.includes(label))?.values || Array(daysInMonth).fill(0);

        const fact = getV("Facturación") || getV("Ventas") || getV("Inversión") || getV("Volumen");
        const ped = getV("Pedidos") || getV("Total") || getV("Ingresos") || Array(daysInMonth).fill(0);

        return Array.from({ length: daysInMonth }, (_, i) => ({
            day: i + 1,
            facturacion: fact[i] || 0,
            pedidos: ped[i] || 0,
            entregados: Math.round((ped[i] || 0) * 0.8), // Mock temp 
            incidencias: Math.round((ped[i] || 0) * 0.05), // Mock temp
            ticketMedio: fact[i] && ped[i] ? Math.round(fact[i] / ped[i]) : 0,
            margen: 25 // Mock temp
        }));
    };

    const dailyData = data?.data?.metrics ? parseDailyData(data.data.metrics, data.daysInMonth) : [];
    const weeklySummary = dailyData.length > 0 ? getWeeklySummary(dailyData, month, year) : [];

    const formatValue = (value: number, unit: string) => {
        if (unit === "EUR") return `€${value >= 1000 ? (value / 1000).toFixed(1) + 'k' : Math.round(value)}`;
        if (unit === "%") return `${value}%`;
        return `${value}`;
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

                    {/* Resumen Semanal Cards (Siempre visibles) */}
                    {weeklySummary.length > 0 && (
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: `repeat(${weeklySummary.length}, 1fr)`,
                            gap: "10px",
                            marginBottom: "16px",
                            marginTop: "8px"
                        }}>
                            {weeklySummary.map((week: WeekSummary, i: number) => (
                                <div key={i} style={{
                                    background: "white",
                                    borderRadius: "12px",
                                    border: "1px solid #e2e8f0",
                                    padding: "12px 14px",
                                    cursor: "pointer",
                                    outline: activeWeek === i && viewMode === "daily" ? "2px solid #7c3aed" : "none"
                                }}
                                    onClick={() => setActiveWeek(i)}
                                >
                                    {/* Header tarjeta */}
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                                        <div>
                                            <p style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8", margin: 0 }}>
                                                {week.label}
                                            </p>
                                            <p style={{ fontSize: "8px", color: "#cbd5e1", margin: 0 }}>{week.dateRange}</p>
                                        </div>
                                        {/* Variación vs semana anterior */}
                                        {week.varVsPrev !== null && (
                                            <span style={{
                                                fontSize: "9px", fontWeight: 700,
                                                color: week.varVsPrev >= 0 ? "#22c55e" : "#ef4444",
                                                background: week.varVsPrev >= 0 ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                                                borderRadius: "4px", padding: "1px 5px"
                                            }}>
                                                {week.varVsPrev >= 0 ? "↑" : "↓"}{Math.abs(week.varVsPrev)}%
                                            </span>
                                        )}
                                    </div>

                                    {/* Métrica principal */}
                                    <p style={{ fontSize: "18px", fontWeight: 900, color: "#1e293b", margin: "0 0 4px 0" }}>
                                        {formatValue(week.facturacion, "EUR")}
                                    </p>

                                    {/* Métricas secundarias */}
                                    <div style={{ display: "flex", gap: "8px", fontSize: "10px", color: "#64748b" }}>
                                        <span>{week.pedidos} ped.</span>
                                        <span>·</span>
                                        <span>{week.entregados} entr.</span>
                                        <span>·</span>
                                        <span style={{ color: week.incidencias > 0 ? "#ef4444" : "#94a3b8" }}>
                                            {week.incidencias} inc.
                                        </span>
                                    </div>

                                    {/* Margen */}
                                    <p style={{
                                        fontSize: "10px", fontWeight: 700, marginTop: "4px",
                                        color: week.margen >= 20 ? "#22c55e" : week.margen >= 10 ? "#eab308" : "#ef4444"
                                    }}>
                                        Margen: {week.margen}%
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}

                </div>
            )}

            {/* Agente Compañante Inyectado, pide perfil crm-forense si existiese */}
            <AgentCompanion pageContext={contextForAgent} agentRole="crm-forense" />
        </div>
    );
}
