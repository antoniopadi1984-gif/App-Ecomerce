'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/lib/store/store-context';
import { RefreshCw, LayoutDashboard, Target, Loader2 } from 'lucide-react';
import { AgentCompanion } from '@/components/layout/agent-companion';

// ─── Componentes UI Compartidos ──────────────────────────────────
function PillTab({ active, label, set }: { active: boolean; label: string; set: () => void }) {
    return (
        <button
            onClick={set}
            className={`module-tab ${active ? 'active' : ''}`}
            style={active ? { '--tab-color': 'var(--mando)' } as any : {}}
        >
            {label}
        </button>
    );
}

// ─── Tab: EL PULSO ───────────────────────────────────────────────
function MetricCard({ title, data }: { title: string; data: any }) {
    if (!data) return null;
    const statusColors = {
        green: 'var(--s-ok)',
        yellow: 'var(--s-wa)',
        red: 'var(--s-ko)',
    };
    const color = statusColors[data.status as keyof typeof statusColors] || 'var(--text)';

    const formatValue = (v: number) => {
        // Basic formatting based on title
        if (Date.now() < 0) return v; // Hack to use v before return if needed
        if (v >= 1000 && !title.toLowerCase().includes('roas') && !title.toLowerCase().includes('margen') && !title.toLowerCase().includes('tasa')) {
            return (v / 1000).toFixed(1) + 'k';
        }
        return v;
    };

    return (
        <div className="ds-card-padded flex flex-col justify-between" style={{ minHeight: 90 }}>
            {/* Usamos el CSS Token de color para la barra animada */}
            <div
                className="h-[2px] w-full absolute top-0 left-0"
                style={{ backgroundColor: color, opacity: 0.8 }}
            />
            <div className="text-label mb-1 uppercase text-[9px] tracking-wider text-[var(--text-dim)]">{title}</div>
            <div className="flex items-baseline gap-1 mt-auto">
                <span className="text-[20px] font-[800] leading-none text-[var(--text)] font-mono">
                    {formatValue(data.value)}
                </span>
                <span className="text-[10px] font-bold text-[var(--text-muted)]">{data.unit}</span>
            </div>
        </div>
    );
}

function ElPulsoTab({ storeId }: { storeId: string }) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchPulse = () => {
        setLoading(true);
        fetch(`/api/mando/pulse?storeId=${storeId}`)
            .then(r => r.json())
            .then(d => {
                if (d.ok) setData(d);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    useEffect(() => {
        if (!storeId) return;
        fetchPulse();
        const interval = setInterval(fetchPulse, 5 * 60 * 1000); // 5 mins
        return () => clearInterval(interval);
    }, [storeId]);

    if (loading && !data) return <div className="p-4 text-center text-[11px] text-[var(--text-muted)]"><Loader2 className="w-4 h-4 animate-spin inline mr-2 text-[var(--mando)]" /> Cargando el pulso...</div>;
    if (!data || !data.metrics) return <div className="p-4 text-center text-[11px] text-[var(--text-ko)]">Error cargando métricas</div>;

    const m = data.metrics;
    const isCOD = data.store?.isCOD;

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex justify-between items-center mb-4">
                <h2 className="section-title text-[var(--mando)]! mb-0 h-6">Métricas en Vivo (Hoy)</h2>
                <button onClick={fetchPulse} disabled={loading} className="text-[var(--text-dim)] hover:text-[var(--mando)] transition-colors">
                    <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                </button>
            </div>

            {/* Adaptative Grid (2 cols móvil, 4 cols desktop) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 relative">
                <MetricCard title="Facturación" data={m.facturacionHoy} />
                <MetricCard title="ROAS Global" data={m.roas} />
                <MetricCard title="CPA Global" data={m.cpa} />
                <MetricCard title="Margen Neto" data={m.margenNeto} />
                <MetricCard title="Sesiones Totales" data={m.sesiones} />
                <MetricCard title="Pedidos Totales" data={m.pedidos} />

                {/* COD Variables */}
                {isCOD && m.tasaEntrega && (
                    <MetricCard title="Tasa de Entrega" data={m.tasaEntrega} />
                )}
            </div>
        </div>
    );
}

// ─── Tab: SCORECARD ──────────────────────────────────────────────
function ScorecardCell({ value, type, goal, isCurrency, invertColors }: { value: number; type?: string; goal?: number; isCurrency?: boolean; invertColors?: boolean }) {
    let displayValue = value.toFixed(isCurrency ? 2 : 1);
    if (value % 1 === 0) displayValue = value.toString();

    // Default status
    let badgeClass = '';

    if (goal) {
        const isGood = invertColors ? value <= goal : value >= goal;
        const isWarning = invertColors ? value <= goal * 1.15 : value >= goal * 0.85;

        if (isGood) badgeClass = 'text-[var(--s-ok)] font-bold';
        else if (isWarning) badgeClass = 'text-[var(--s-wa)] font-bold';
        else badgeClass = 'text-[var(--s-ko)] font-bold';
    }

    return (
        <span className={badgeClass || 'text-[var(--text)] font-semibold font-mono'}>
            {isCurrency && '€'}{displayValue}{type === '%' && '%'}
        </span>
    );
}

function GoalInput({ storeId, month, year, field, currentVal }: { storeId: string; month: number; year: number; field: string; currentVal: number | null }) {
    const [val, setVal] = useState(currentVal?.toString() || '');
    const [editing, setEditing] = useState(false);

    const handleSave = () => {
        setEditing(false);
        if (val === currentVal?.toString()) return;

        fetch('/api/mando/scorecard', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ storeId, month, year, field, value: val }),
        });
        // Optimistic UI - in a real app would trigger a refetch trigger, but we let user refresh for now to avoid prop drilling complex state
    };

    if (!editing) {
        return (
            <div
                onClick={() => setEditing(true)}
                className="cursor-pointer text-[10px] text-[var(--mando)] hover:underline opacity-80"
            >
                {currentVal ? currentVal : 'Definir'}
            </div>
        );
    }

    return (
        <input
            autoFocus
            type="number"
            value={val}
            onChange={e => setVal(e.target.value)}
            onBlur={handleSave}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            className="w-14 bg-[var(--surface2)] border border-[var(--border)] text-[9px] px-1 py-0.5 rounded text-center outline-none focus:border-[var(--mando)]"
        />
    );
}

function ScorecardTab({ storeId }: { storeId: string }) {
    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!storeId) return;
        setLoading(true);
        fetch(`/api/mando/scorecard?storeId=${storeId}&month=${month}&year=${year}`)
            .then(r => r.json())
            .then(d => {
                if (d.ok) setData(d);
                setLoading(false);
            });
    }, [storeId, month, year]);

    if (loading && !data) return <div className="p-4 text-center text-[11px] text-[var(--text-muted)]"><Loader2 className="w-4 h-4 animate-spin inline mr-2 text-[var(--mando)]" /> Cargando Scorecard...</div>;
    if (!data) return <div className="p-4 text-center text-[11px] text-[var(--text-ko)]">Sin datos</div>;

    const w = data.weeks || [];
    const a = data.accumulated || {};
    const g = data.goal || {};
    const isCOD = data.store?.isCOD;

    const Row = ({ label, prop, isCurrency, isPct, goalRow, invertColors }: { label: string; prop: string; isCurrency?: boolean; isPct?: boolean; goalRow?: string; invertColors?: boolean }) => {
        const goalVal = goalRow && g[goalRow] ? g[goalRow] : undefined;

        return (
            <tr className="hover:bg-[var(--surface2)] transition-colors border-b border-[var(--border)] group">
                <td className="py-2.5 px-3 text-[10px] font-bold text-[var(--text)]">{label}</td>
                <td className="text-right py-2.5 px-2 text-[11px] text-[var(--text-muted)]"><ScorecardCell value={w[0]?.[prop] || 0} isCurrency={isCurrency} type={isPct ? '%' : ''} /></td>
                <td className="text-right py-2.5 px-2 text-[11px] text-[var(--text-muted)]"><ScorecardCell value={w[1]?.[prop] || 0} isCurrency={isCurrency} type={isPct ? '%' : ''} /></td>
                <td className="text-right py-2.5 px-2 text-[11px] text-[var(--text-muted)]"><ScorecardCell value={w[2]?.[prop] || 0} isCurrency={isCurrency} type={isPct ? '%' : ''} /></td>
                <td className="text-right py-2.5 px-2 text-[11px] text-[var(--text-muted)]"><ScorecardCell value={w[3]?.[prop] || 0} isCurrency={isCurrency} type={isPct ? '%' : ''} /></td>
                <td className="text-right py-2.5 px-3 bg-[var(--surface2)]/50 group-hover:bg-transparent text-[11px] border-l border-[var(--border)]">
                    <ScorecardCell value={a[prop] || 0} goal={goalVal} isCurrency={isCurrency} type={isPct ? '%' : ''} invertColors={invertColors} />
                </td>
                <td className="text-center py-2.5 px-3 text-[10px] border-l border-[var(--border)] bg-gray-50/10">
                    {goalRow ? <GoalInput storeId={storeId} month={month} year={year} field={goalRow} currentVal={g[goalRow]} /> : '-'}
                </td>
            </tr>
        );
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex justify-between items-center mb-4">
                <h2 className="section-title text-[var(--mando)]! mb-0 h-6">Scorecard Mensual</h2>

                <div className="flex gap-2">
                    <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))} className="ds-input w-24">
                        {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>Mes {i + 1}</option>)}
                    </select>
                    <select value={year} onChange={(e) => setYear(parseInt(e.target.value))} className="ds-input w-20">
                        {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
            </div>

            <div className="ds-table-wrap">
                <table className="ds-table w-full">
                    <thead>
                        <tr>
                            <th className="w-1/4">Métrica</th>
                            <th className="text-right">S1</th>
                            <th className="text-right">S2</th>
                            <th className="text-right">S3</th>
                            <th className="text-right">S4</th>
                            <th className="text-right border-l border-[var(--border)]">Acumulado</th>
                            <th className="text-center border-l border-[var(--border)]">Objetivo</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td colSpan={7} className="bg-[var(--bg)] text-[9px] font-black uppercase text-[var(--text-dim)] py-1.5 px-3 border-y border-[var(--border)] tracking-[0.1em]">🛒 Ventas</td></tr>
                        <Row label="Facturación" prop="revenue" isCurrency />
                        <Row label="Pedidos" prop="orders" />

                        <tr><td colSpan={7} className="bg-[var(--bg)] text-[9px] font-black uppercase text-[var(--text-dim)] py-1.5 px-3 border-y border-[var(--border)] tracking-[0.1em]">📈 Marketing (Meta)</td></tr>
                        <Row label="Inversión" prop="adSpend" isCurrency />
                        <Row label="ROAS" prop="roas" goalRow="targetRoas" />
                        <Row label="CPA" prop="cpa" isCurrency invertColors goalRow="maxCpa" />
                        <Row label="Coste Visita" prop="costPerSession" isCurrency invertColors goalRow="maxCpc" />

                        <tr><td colSpan={7} className="bg-[var(--bg)] text-[9px] font-black uppercase text-[var(--text-dim)] py-1.5 px-3 border-y border-[var(--border)] tracking-[0.1em]">🎨 Creativos</td></tr>
                        <Row label="Lanzados" prop="creativesLaunched" />
                        <Row label="Ganadores (ROAS > 2)" prop="creativesWinner" />
                        <Row label="Ratio Acierto" prop="ratioAcierto" isPct />

                        {(isCOD || typeof isCOD === 'undefined') && (
                            <>
                                <tr><td colSpan={7} className="bg-[var(--bg)] text-[9px] font-black uppercase text-[var(--text-dim)] py-1.5 px-3 border-y border-[var(--border)] tracking-[0.1em]">📦 Logística</td></tr>
                                <Row label="Pedidos Entregados" prop="delivered" />
                                <Row label="Tasa Entrega" prop="deliveryRate" isPct />
                                <Row label="Reintentos" prop="reintentos" invertColors />
                                <Row label="Devoluciones" prop="returned" invertColors />
                                <Row label="Coste Envío Medio" prop="envioMedio" isCurrency invertColors />
                            </>
                        )}

                        <tr><td colSpan={7} className="bg-[var(--bg)] text-[9px] font-black uppercase text-[var(--text-dim)] py-1.5 px-3 border-y border-[var(--border)] tracking-[0.1em]">💰 Economía</td></tr>
                        <Row label="COGS (Producto)" prop="cogs" isCurrency invertColors />
                        <Row label="Shipping Total" prop="shippingCost" isCurrency invertColors />
                        <Row label="Beneficio Neto" prop="netProfit" isCurrency />
                        <Row label="Margen (%)" prop="netMargin" isPct />

                        <tr><td colSpan={7} className="bg-[var(--bg)] text-[9px] font-black uppercase text-[var(--text-dim)] py-1.5 px-3 border-y border-[var(--border)] tracking-[0.1em]">👥 Clientes</td></tr>
                        <Row label="Nuevos Clientes" prop="newCustomers" />
                        <Row label="Recurrentes" prop="recurrentes" />
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ─── PÁGINA PRINCIPAL ──────────────────────────────────────────
export default function MandoPage() {
    const [activeTab, setActiveTab] = useState<'PULSE' | 'SCORECARD'>('PULSE');
    const { activeStoreId } = useStore();

    const contextForAgent = `Centro de Mando. Viendo métricas en la pestaña ${activeTab}. StoreID: ${activeStoreId}`;

    return (
        <div className="content-main flex flex-col gap-5 pt-0">

            {/* Header compact */}
            <div className="flex justify-between items-center py-2 mt-2">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded shrink-0 bg-[#6D5FD8] flex items-center justify-center text-white shadow-sm">
                        <LayoutDashboard size={18} />
                    </div>
                    <div>
                        <h1 className="text-[14px] font-[800] leading-none text-[var(--text)] tracking-tight">Centro de Mando</h1>
                        <p className="text-[10px] text-[var(--text-muted)] mt-0.5 max-w-sm uppercase tracking-wide">
                            Resumen ejecutivo y Scorecard
                        </p>
                    </div>
                </div>
            </div>

            {/* Navegación por tabs locales */}
            <div className="module-tabs">
                <PillTab active={activeTab === 'PULSE'} label="El Pulso (Hoy)" set={() => setActiveTab('PULSE')} />
                <PillTab active={activeTab === 'SCORECARD'} label="Scorecard Mensual" set={() => setActiveTab('SCORECARD')} />
            </div>

            {/* Área de contenido cargado condicionalmente */}
            <div className="flex-1 mt-2">
                {!activeStoreId ? (
                    <div className="text-center p-8 text-[11px] font-semibold text-[var(--text-dim)] ds-card">
                        Selecciona una tienda en el selector superior (TopBar) para ver el mando.
                    </div>
                ) : (
                    <>
                        {activeTab === 'PULSE' && <ElPulsoTab storeId={activeStoreId} />}
                        {activeTab === 'SCORECARD' && <ScorecardTab storeId={activeStoreId} />}
                    </>
                )}
            </div>

            {/* Agente Compañante Inyectado, usa ROLE mando y envía contexto ligero */}
            <AgentCompanion pageContext={contextForAgent} agentRole="mando" />

        </div>
    );
}
