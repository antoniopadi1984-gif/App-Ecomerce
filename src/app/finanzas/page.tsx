'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '@/lib/store/store-context';
import { DollarSign, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

type ViewMode = 'daily' | 'weekly' | 'monthly' | 'annual';

interface FinCol {
    key: string;
    label: string;
    type?: 'sum' | 'avg' | 'calc' | 'string';
    unit?: 'EUR' | '%' | 'x' | '' | undefined;
    thresholds?: number[];
    lowerIsBetter?: boolean;
    calcFn?: (totals: any) => number;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const TABS = [
    { id: 'contabilidad', label: 'Contabilidad' },
    { id: 'gastos', label: 'Gastos Fijos' },
    { id: 'apis', label: 'Coste APIs' },
    { id: 'calculadoras', label: 'Calculadoras' },
    { id: 'proyecciones', label: 'Proyecciones' },
];

const MONTHS = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

const YEARS = [2023, 2024, 2025, 2026];

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmt(value: number, unit?: string): string {
    if (value === undefined || value === null || isNaN(value)) return '—';
    if (unit === 'EUR') return `€${value >= 1000 ? (value / 1000).toFixed(1) + 'k' : Math.round(value)}`;
    if (unit === '%') return `${value.toFixed(1)}%`;
    if (unit === 'x') return `${value.toFixed(2)}x`;
    return `${Math.round(value)}`;
}

function semaforo(value: number, thresholds?: number[], lowerIsBetter?: boolean) {
    if (!thresholds) return {};
    let color = '#ef4444', bg = 'rgba(239,68,68,0.05)';
    if (lowerIsBetter) {
        if (value <= thresholds[0]) { color = '#22c55e'; bg = 'rgba(34,197,94,0.05)'; }
        else if (value <= thresholds[1]) { color = '#eab308'; bg = 'rgba(234,179,8,0.05)'; }
    } else {
        if (value >= thresholds[0]) { color = '#22c55e'; bg = 'rgba(34,197,94,0.05)'; }
        else if (value >= thresholds[1]) { color = '#eab308'; bg = 'rgba(234,179,8,0.05)'; }
    }
    return { color, background: bg, fontWeight: 700 };
}

function generatePeriodRows(mode: ViewMode, month: number, year: number) {
    if (mode === 'daily') {
        const days = new Date(year, month, 0).getDate();
        return Array.from({ length: days }, (_, i) => ({
            key: `d${i + 1}`,
            label: `${i + 1}`,
            isToday: new Date().getDate() === (i + 1) && new Date().getMonth() + 1 === month && new Date().getFullYear() === year,
        }));
    }
    if (mode === 'weekly') {
        return Array.from({ length: 5 }, (_, i) => ({ key: `w${i + 1}`, label: `Sem ${i + 1}`, isToday: false }));
    }
    if (mode === 'monthly') {
        return MONTHS.map((m, i) => ({ key: `m${i + 1}`, label: m.slice(0, 3).toUpperCase(), isToday: false }));
    }
    // annual
    return MONTHS.map((m, i) => ({ key: `m${i + 1}`, label: m.slice(0, 3).toUpperCase(), isToday: false }));
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function PillTab({ active, label, set }: { active: boolean; label: string; set: () => void }) {
    return (
        <button
            onClick={set}
            className={`module-tab ${active ? 'active' : ''}`}
            style={active ? { '--tab-color': 'var(--mkt)' } as any : {}}
        >
            {label}
        </button>
    );
}

function ColHeader({ line1, line2, colKey, sortKey, sortDir, onSort }: any) {
    const isActive = sortKey === colKey;
    return (
        <th
            onClick={() => onSort(colKey)}
            style={{
                padding: '5px 6px',
                fontSize: '8px', fontWeight: 900,
                textTransform: 'uppercase', letterSpacing: '0.04em',
                color: isActive ? '#0f9e6b' : 'var(--color-text-secondary)',
                textAlign: 'center', lineHeight: 1.2,
                cursor: 'pointer', userSelect: 'none',
                whiteSpace: 'normal', wordBreak: 'break-word',
                minWidth: colKey === 'label' ? '40px' : '60px',
                maxWidth: colKey === 'label' ? '50px' : '80px',
                verticalAlign: 'bottom',
                borderBottom: isActive ? '2px solid #0f9e6b' : '2px solid #e2e8f0',
                ...(colKey === 'label' ? { position: 'sticky', left: 0, background: 'white', zIndex: 11 } : {})
            }}
        >
            <span style={{ display: 'block' }}>{line1}</span>
            {line2 && <span style={{ display: 'block' }}>{line2}</span>}
            <span style={{ display: 'block', fontSize: '7px', marginTop: '1px', minHeight: '8px' }}>
                {isActive ? (sortDir === 'asc' ? '↑' : '↓') : ''}
            </span>
        </th>
    );
}

function FinTable({ rows, columns, totals }: { rows: any[]; columns: FinCol[]; totals: any }) {
    const [sortKey, setSortKey] = useState('label');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

    const handleSort = (key: string) => {
        if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortKey(key); setSortDir('desc'); }
    };

    const sorted = [...rows].sort((a, b) => {
        if (sortKey === 'label') return 0;
        return sortDir === 'asc' ? (a[sortKey] || 0) - (b[sortKey] || 0) : (b[sortKey] || 0) - (a[sortKey] || 0);
    });

    return (
        <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <table style={{ width: '100%', tableLayout: 'auto', borderCollapse: 'collapse', minWidth: '900px' }}>
                <thead>
                    <tr style={{ position: 'sticky', top: 0, background: 'white', zIndex: 10 }}>
                        {columns.map(col => {
                            const parts = col.label.split(' ');
                            const line1 = parts[0];
                            const line2 = parts.length > 1 ? parts.slice(1).join(' ') : '';
                            return (
                                <ColHeader
                                    key={col.key}
                                    line1={col.key === 'label' ? col.label : line1}
                                    line2={col.key === 'label' ? '' : line2}
                                    colKey={col.key}
                                    sortKey={sortKey}
                                    sortDir={sortDir}
                                    onSort={handleSort}
                                />
                            );
                        })}
                    </tr>
                </thead>
                <tbody>
                    {sorted.map((row, i) => (
                        <tr key={row.key} style={{
                            borderBottom: '1px solid #f1f5f9',
                            background: row.isToday ? 'rgba(15,158,107,0.04)' : (i % 2 === 0 ? 'white' : '#fafbff'),
                        }}>
                            {columns.map(col => (
                                <td
                                    key={col.key}
                                    style={{
                                        padding: '5px 8px', fontSize: '12px',
                                        whiteSpace: 'nowrap', textAlign: 'center',
                                        ...(col.key === 'label' ? {
                                            position: 'sticky', left: 0,
                                            background: row.isToday ? 'rgba(15,158,107,0.04)' : (i % 2 === 0 ? 'white' : '#fafbff'),
                                            fontWeight: 800, color: '#1e293b', zIndex: 5
                                        } : {}),
                                        ...((col.type === 'calc' || col.type === 'avg') && col.thresholds
                                            ? semaforo(row[col.key], col.thresholds, col.lowerIsBetter)
                                            : {})
                                    }}
                                >
                                    {col.key === 'label' ? row.label : fmt(row[col.key], col.unit)}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr style={{ position: 'sticky', bottom: 0, background: '#f8fafc', borderTop: '2px solid #e2e8f0', zIndex: 10 }}>
                        {columns.map(col => (
                            <td
                                key={col.key}
                                style={{
                                    padding: '7px 12px', fontSize: '12px', fontWeight: 900,
                                    color: '#1e293b', whiteSpace: 'nowrap',
                                    textAlign: col.key === 'label' ? 'left' : 'center',
                                    ...(col.key === 'label' ? { position: 'sticky', left: 0, background: '#f8fafc', zIndex: 11 } : {})
                                }}
                            >
                                {col.key === 'label' ? 'TOTAL' : fmt(totals[col.key], col.unit)}
                            </td>
                        ))}
                    </tr>
                </tfoot>
            </table>
        </div>
    );
}

// ─── Column definitions per tab ───────────────────────────────────────────────

function useColumns(activeTab: string, viewMode: ViewMode): FinCol[] {
    return useMemo(() => {
        const periodCol: FinCol = {
            key: 'label',
            label: viewMode === 'daily' ? 'DÍA' : viewMode === 'weekly' ? 'SEMANA' : viewMode === 'monthly' ? 'MES' : 'MES',
            type: 'string'
        };

        if (activeTab === 'contabilidad') {
            return [
                periodCol,
                { key: 'ingresos', label: 'Ingresos Brutos', type: 'sum', unit: 'EUR' },
                { key: 'devoluciones', label: 'Devoluciones €', type: 'sum', unit: 'EUR' },
                { key: 'ingresosNetos', label: 'Ingresos Netos', type: 'sum', unit: 'EUR' },
                { key: 'cogs', label: 'COGS €', type: 'sum', unit: 'EUR' },
                { key: 'gastosFijos', label: 'Gastos Fijos €', type: 'sum', unit: 'EUR' },
                { key: 'gastosAds', label: 'Inversión Ads €', type: 'sum', unit: 'EUR' },
                { key: 'gastosApis', label: 'Coste APIs €', type: 'sum', unit: 'EUR' },
                { key: 'gastosLogistica', label: 'Logística €', type: 'sum', unit: 'EUR' },
                {
                    key: 'gastosTotal', label: 'Gastos Total €', type: 'calc', unit: 'EUR',
                    calcFn: t => (t.cogs || 0) + (t.gastosFijos || 0) + (t.gastosAds || 0) + (t.gastosApis || 0) + (t.gastosLogistica || 0)
                },
                {
                    key: 'beneficioBruto', label: 'Benef. Bruto €', type: 'calc', unit: 'EUR',
                    calcFn: t => (t.ingresosNetos || 0) - (t.cogs || 0)
                },
                {
                    key: 'beneficioNeto', label: 'Benef. Neto €', type: 'calc', unit: 'EUR',
                    calcFn: t => (t.ingresosNetos || 0) - ((t.cogs || 0) + (t.gastosFijos || 0) + (t.gastosAds || 0) + (t.gastosApis || 0) + (t.gastosLogistica || 0))
                },
                {
                    key: 'margenBruto', label: 'Margen Bruto %', type: 'calc', unit: '%', thresholds: [50, 30],
                    calcFn: t => t.ingresosNetos > 0 ? (t.beneficioBruto / t.ingresosNetos) * 100 : 0
                },
                {
                    key: 'margenNeto', label: 'Margen Neto %', type: 'calc', unit: '%', thresholds: [25, 15],
                    calcFn: t => t.ingresosNetos > 0 ? (t.beneficioNeto / t.ingresosNetos) * 100 : 0
                },
                { key: 'ivaSoportado', label: 'IVA Soportado €', type: 'sum', unit: 'EUR' },
                { key: 'ivaRepercutido', label: 'IVA Repercutido €', type: 'sum', unit: 'EUR' },
                {
                    key: 'ivaNeto', label: 'IVA Neto €', type: 'calc', unit: 'EUR',
                    calcFn: t => (t.ivaRepercutido || 0) - (t.ivaSoportado || 0)
                },
            ];
        }

        if (activeTab === 'gastos') {
            return [
                periodCol,
                { key: 'alquiler', label: 'Alquiler €', type: 'sum', unit: 'EUR' },
                { key: 'nominas', label: 'Nóminas €', type: 'sum', unit: 'EUR' },
                { key: 'seguros', label: 'Seguros €', type: 'sum', unit: 'EUR' },
                { key: 'software', label: 'Software €', type: 'sum', unit: 'EUR' },
                { key: 'herramientas', label: 'Herramientas €', type: 'sum', unit: 'EUR' },
                { key: 'marketing', label: 'Marketing Fijo €', type: 'sum', unit: 'EUR' },
                { key: 'contabilidad', label: 'Contabilidad €', type: 'sum', unit: 'EUR' },
                { key: 'legal', label: 'Legal €', type: 'sum', unit: 'EUR' },
                { key: 'otros', label: 'Otros €', type: 'sum', unit: 'EUR' },
                {
                    key: 'totalFijos', label: 'Total Fijos €', type: 'calc', unit: 'EUR',
                    calcFn: t => ['alquiler', 'nominas', 'seguros', 'software', 'herramientas', 'marketing', 'contabilidad', 'legal', 'otros'].reduce((s, k) => s + (t[k] || 0), 0)
                },
                { key: 'pctSobreIngresos', label: '% s/ Ingresos', type: 'avg', unit: '%', thresholds: [20, 35], lowerIsBetter: true },
            ];
        }

        if (activeTab === 'apis') {
            return [
                periodCol,
                { key: 'openai', label: 'OpenAI €', type: 'sum', unit: 'EUR' },
                { key: 'anthropic', label: 'Anthropic €', type: 'sum', unit: 'EUR' },
                { key: 'google', label: 'Google AI €', type: 'sum', unit: 'EUR' },
                { key: 'elevenlabs', label: 'ElevenLabs €', type: 'sum', unit: 'EUR' },
                { key: 'midjourney', label: 'Midjourney €', type: 'sum', unit: 'EUR' },
                { key: 'wooDelivery', label: 'Woo Delivery €', type: 'sum', unit: 'EUR' },
                { key: 'shopify', label: 'Shopify €', type: 'sum', unit: 'EUR' },
                { key: 'otros', label: 'Otros APIs €', type: 'sum', unit: 'EUR' },
                {
                    key: 'totalApis', label: 'Total APIs €', type: 'calc', unit: 'EUR',
                    calcFn: t => ['openai', 'anthropic', 'google', 'elevenlabs', 'midjourney', 'wooDelivery', 'shopify', 'otros'].reduce((s, k) => s + (t[k] || 0), 0)
                },
                { key: 'tokens', label: 'Tokens Consumidos', type: 'sum', unit: undefined },
                {
                    key: 'costePorToken', label: 'Coste/1k tokens €', type: 'calc', unit: 'EUR',
                    calcFn: t => t.tokens > 0 ? (t.totalApis / t.tokens) * 1000 : 0
                },
            ];
        }

        if (activeTab === 'calculadoras') {
            return [
                periodCol,
                { key: 'pvp', label: 'PVP €', type: 'avg', unit: 'EUR' },
                { key: 'costeProducto', label: 'Coste Prod. €', type: 'avg', unit: 'EUR' },
                { key: 'costeEnvio', label: 'Coste Envío €', type: 'avg', unit: 'EUR' },
                { key: 'margenBruto', label: 'Margen Bruto %', type: 'avg', unit: '%', thresholds: [50, 30] },
                { key: 'roasBR', label: 'ROAS Breakeven', type: 'avg', unit: 'x', thresholds: [2.5, 1.5] },
                { key: 'cpaMax', label: 'CPA Máx €', type: 'avg', unit: 'EUR' },
                { key: 'cpcMax', label: 'CPC Máx €', type: 'avg', unit: 'EUR' },
                { key: 'tasaEntrega', label: 'Tasa Entrega %', type: 'avg', unit: '%', thresholds: [85, 70] },
                { key: 'tasaEnvio', label: 'Tasa Envío %', type: 'avg', unit: '%', thresholds: [90, 80] },
                { key: 'tasaConversion', label: 'Tasa Conv. %', type: 'avg', unit: '%', thresholds: [2, 1] },
            ];
        }

        if (activeTab === 'proyecciones') {
            return [
                periodCol,
                { key: 'pedidosObj', label: 'Pedidos Obj.', type: 'avg', unit: undefined },
                { key: 'pedidosReal', label: 'Pedidos Real', type: 'sum', unit: undefined },
                {
                    key: 'cumplimiento', label: 'Cumplimiento %', type: 'calc', unit: '%', thresholds: [90, 70],
                    calcFn: t => t.pedidosObj > 0 ? (t.pedidosReal / t.pedidosObj) * 100 : 0
                },
                { key: 'ingresosObj', label: 'Ingresos Obj. €', type: 'avg', unit: 'EUR' },
                { key: 'ingresosReal', label: 'Ingresos Real €', type: 'sum', unit: 'EUR' },
                {
                    key: 'desviacion', label: 'Desviación €', type: 'calc', unit: 'EUR',
                    calcFn: t => (t.ingresosReal || 0) - (t.ingresosObj || 0)
                },
                { key: 'beneficioObj', label: 'Benef. Obj. €', type: 'avg', unit: 'EUR' },
                { key: 'beneficioReal', label: 'Benef. Real €', type: 'sum', unit: 'EUR' },
                { key: 'gastoAdsObj', label: 'Ads Obj. €', type: 'avg', unit: 'EUR' },
                { key: 'gastoAdsReal', label: 'Ads Real €', type: 'sum', unit: 'EUR' },
                { key: 'roasObj', label: 'ROAS Obj.', type: 'avg', unit: 'x' },
                {
                    key: 'roasReal', label: 'ROAS Real', type: 'calc', unit: 'x',
                    calcFn: t => t.gastoAdsReal > 0 ? t.ingresosReal / t.gastoAdsReal : 0
                },
            ];
        }

        return [periodCol];
    }, [activeTab, viewMode]);
}

// ─── KPI Cards ────────────────────────────────────────────────────────────────

function KpiCard({ label, value, color = '#0f9e6b', sub }: any) {
    return (
        <div style={{
            background: 'white',
            border: '1px solid #e2e8f0',
            borderLeft: `3px solid ${color}`,
            borderRadius: '8px',
            padding: '7px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '1px',
        }}>
            <p style={{
                fontSize: '8px', fontWeight: 800, color: '#94a3b8',
                textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0
            }}>{label}</p>
            <p style={{
                fontSize: '15px', fontWeight: 900, color: '#1e293b',
                margin: 0, letterSpacing: '-0.5px', fontFamily: 'var(--mono)'
            }}>{value}</p>
            {sub && <p style={{ fontSize: '8px', color: '#94a3b8', margin: 0 }}>{sub}</p>}
        </div>
    );
}

// ─── Tab Health Semáforo ──────────────────────────────────────────────────────

function getTabHealth(activeTab: string, totals: any): 'green' | 'yellow' | 'red' | 'gray' {
    if (activeTab === 'contabilidad') {
        const margen = totals.ingresosNetos > 0
            ? (totals.beneficioNeto / totals.ingresosNetos) * 100 : null;
        if (margen === null) return 'gray';
        if (margen >= 15) return 'green';
        if (margen >= 5) return 'yellow';
        return 'red';
    }
    if (activeTab === 'gastos') {
        const pct = totals.ingresosNetos > 0
            ? (totals.totalFijos / totals.ingresosNetos) * 100 : null;
        if (pct === null) return 'gray';
        if (pct <= 20) return 'green';
        if (pct <= 35) return 'yellow';
        return 'red';
    }
    if (activeTab === 'apis') {
        const total = totals.totalApis || 0;
        if (total === 0) return 'gray';
        if (total < 200) return 'green';
        if (total < 500) return 'yellow';
        return 'red';
    }
    if (activeTab === 'proyecciones') {
        const cumpl = totals.pedidosObj > 0
            ? (totals.pedidosReal / totals.pedidosObj) * 100 : null;
        if (cumpl === null) return 'gray';
        if (cumpl >= 90) return 'green';
        if (cumpl >= 70) return 'yellow';
        return 'red';
    }
    return 'gray';
}

function TabHealthDot({ health }: { health: 'green' | 'yellow' | 'red' | 'gray' }) {
    const colors = {
        green: { dot: '#22c55e', bg: 'rgba(34,197,94,0.08)', label: 'Saludable' },
        yellow: { dot: '#eab308', bg: 'rgba(234,179,8,0.08)', label: 'Atención' },
        red: { dot: '#ef4444', bg: 'rgba(239,68,68,0.08)', label: 'Crítico' },
        gray: { dot: '#94a3b8', bg: 'rgba(148,163,184,0.08)', label: 'Sin datos' },
    };
    const c = colors[health];
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            background: c.bg, borderRadius: '6px',
            padding: '4px 10px', border: `1px solid ${c.dot}44`
        }}>
            <div style={{
                width: '7px', height: '7px', borderRadius: '50%',
                background: c.dot,
                boxShadow: health !== 'gray' ? `0 0 6px ${c.dot}` : 'none',
                animation: health === 'red' ? 'pulse 1.5s infinite' : 'none'
            }} />
            <span style={{
                fontSize: '9px', fontWeight: 800, color: c.dot,
                textTransform: 'uppercase', letterSpacing: '0.06em'
            }}>{c.label}</span>
        </div>
    );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function FinanzasPage() {
    const { activeStoreId } = useStore();
    const [activeTab, setActiveTab] = useState(TABS[0].id);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [viewMode, setViewMode] = useState<ViewMode>('monthly');
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const columns = useColumns(activeTab, viewMode);

    // Fetch data from finances API
    useEffect(() => {
        if (!activeStoreId) return;
        setLoading(true);
        fetch(
            `/api/finances?storeId=${activeStoreId}&tab=${activeTab}&month=${selectedMonth}&year=${selectedYear}&annual=${viewMode === 'annual'}`
        )
            .then(r => r.json())
            .then(d => { if (d.ok || d.success) setData(d); })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [activeStoreId, activeTab, selectedMonth, selectedYear, viewMode]);

    // Build period rows (empty data shell for now → will fill when API ready)
    const tableData = useMemo(() => {
        const rows = generatePeriodRows(viewMode, selectedMonth, selectedYear);
        const apiRows: any[] = data?.data?.rows || [];
        return rows.map((r, i) => ({ ...r, ...(apiRows[i] || {}) }));
    }, [viewMode, selectedMonth, selectedYear, data]);

    // Compute totals
    const tableTotals = useMemo(() => {
        const t: any = {};
        columns.forEach(col => {
            if (col.key === 'label' || col.type === 'calc') return;
            const valid = tableData.filter(r => typeof (r as any)[col.key] === 'number');
            const sum = valid.reduce((acc, r) => acc + ((r as any)[col.key] || 0), 0);
            t[col.key] = (col.type === 'avg') ? (valid.length ? sum / valid.length : 0) : sum;
        });
        columns.forEach(col => {
            if (col.type === 'calc' && col.calcFn) t[col.key] = col.calcFn(t);
        });
        return t;
    }, [tableData, columns]);

    // KPI summary from totals
    const kpiIngresos = tableTotals.ingresos || tableTotals.ingresosReal || 0;
    const kpiBeneficio = tableTotals.beneficioNeto || tableTotals.beneficioReal || 0;
    const kpiGastos = tableTotals.gastosTotal || tableTotals.totalFijos || tableTotals.totalApis || 0;
    const kpiMargen = kpiIngresos > 0 ? (kpiBeneficio / kpiIngresos) * 100 : 0;
    const kpiRoas = tableTotals.roasReal || (tableTotals.gastoAdsReal > 0 ? kpiIngresos / tableTotals.gastoAdsReal : 0);
    const kpiAds = tableTotals.gastosAds || tableTotals.gastoAdsReal || 0;
    const kpiIvaNeto = tableTotals.ivaNeto || 0;

    const monthName = MONTHS[selectedMonth - 1];

    return (
        <div className="content-main flex flex-col gap-4 pt-0">

            {/* ── HEADER — mismo patrón exacto que CRM Forense ── */}
            <div className="flex justify-between items-center py-2 mt-2">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded shrink-0 bg-emerald-500 flex items-center justify-center text-white shadow-sm">
                        <DollarSign size={18} />
                    </div>
                    <div>
                        <h1 className="text-[14px] font-[800] leading-none text-[var(--text)] tracking-tight">Finanzas</h1>
                        <p className="text-[10px] text-[var(--text-muted)] mt-0.5 max-w-sm uppercase tracking-wide">
                            Contabilidad · Control Financiero · Proyecciones
                        </p>
                    </div>
                </div>

                {/* Period toggle + semaforo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TabHealthDot health={getTabHealth(activeTab, tableTotals)} />
                    <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '8px', padding: '2px', gap: '2px', height: 'fit-content' }}>
                        {(['daily', 'weekly', 'monthly', 'annual'] as ViewMode[]).map(mode => (
                            <button key={mode} onClick={() => setViewMode(mode)} style={{
                                padding: '4px 14px', fontSize: '11px', fontWeight: 700,
                                borderRadius: '6px', border: 'none', cursor: 'pointer',
                                background: viewMode === mode ? 'white' : 'transparent',
                                color: viewMode === mode ? '#1e293b' : 'var(--text-muted)',
                                boxShadow: viewMode === mode ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                transition: 'all 0.15s'
                            }}>
                                {mode === 'daily' ? 'Diario' : mode === 'weekly' ? 'Semanal' : mode === 'monthly' ? 'Mensual' : 'Anual'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── TABS — mismo componente que CRM Forense ── */}
            <div className="module-tabs overflow-x-auto no-scrollbar max-w-full ds-card px-1 py-1 flex-nowrap shrink-0">
                {TABS.map(t => (
                    <PillTab key={t.id} active={activeTab === t.id} label={t.label} set={() => setActiveTab(t.id)} />
                ))}
            </div>

            {!activeStoreId ? (
                <div className="text-center p-8 text-[11px] font-semibold text-[var(--text-dim)] ds-card">
                    Selecciona una tienda en el selector superior (TopBar) para ver Finanzas.
                </div>
            ) : (
                <div className="flex-1 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">

                    {/* ── KPI Cards x7 ── */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', marginBottom: '4px' }}>
                        <KpiCard label="Ingresos Brutos" value={fmt(kpiIngresos, 'EUR')} color="#0f9e6b" />
                        <KpiCard label="Beneficio Neto" value={fmt(kpiBeneficio, 'EUR')} color={kpiBeneficio > 0 ? '#0f9e6b' : '#ef4444'} />
                        <KpiCard label="Margen Neto" value={fmt(kpiMargen, '%')} color={kpiMargen >= 25 ? '#0f9e6b' : kpiMargen >= 15 ? '#eab308' : '#ef4444'} />
                        <KpiCard label="Gastos Totales" value={fmt(kpiGastos, 'EUR')} color="#f59e0b" />
                        <KpiCard label="Inversión Ads" value={fmt(kpiAds, 'EUR')} color="#7c3aed" />
                        <KpiCard label="ROAS Periodo" value={kpiRoas > 0 ? kpiRoas.toFixed(2) + 'x' : '—'} color={kpiRoas >= 2.5 ? '#0f9e6b' : kpiRoas >= 1.5 ? '#eab308' : '#ef4444'} />
                        <KpiCard label="IVA Neto" value={fmt(kpiIvaNeto, 'EUR')} color={kpiIvaNeto > 0 ? '#ef4444' : '#0f9e6b'} sub={kpiIvaNeto > 0 ? 'a pagar' : 'a favor'} />
                    </div>

                    {/* ── Header tabla con selector Mes + Año ── */}
                    <div className="ds-card-padded py-3 flex items-center justify-between">
                        <div className="text-[11px] font-bold text-[var(--text)] uppercase tracking-wide">
                            Vista — {TABS.find(t => t.id === activeTab)?.label}
                        </div>

                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            {/* Flecha anterior */}
                            <button onClick={() => {
                                if (selectedMonth === 1) { setSelectedMonth(12); setSelectedYear(y => y - 1); }
                                else setSelectedMonth(m => m - 1);
                            }} style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '3px 7px', cursor: 'pointer' }}>
                                <ChevronLeft size={14} />
                            </button>

                            {viewMode !== 'annual' && (
                                <select
                                    value={selectedMonth}
                                    onChange={e => setSelectedMonth(Number(e.target.value))}
                                    style={{ padding: '4px 8px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px', fontWeight: 700, textTransform: 'capitalize' }}
                                >
                                    {MONTHS.map((m, i) => (
                                        <option key={i + 1} value={i + 1}>{m}</option>
                                    ))}
                                </select>
                            )}

                            <select
                                value={selectedYear}
                                onChange={e => setSelectedYear(Number(e.target.value))}
                                style={{ padding: '4px 8px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px', fontWeight: 700 }}
                            >
                                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>

                            {/* Flecha siguiente */}
                            <button onClick={() => {
                                if (selectedMonth === 12) { setSelectedMonth(1); setSelectedYear(y => y + 1); }
                                else setSelectedMonth(m => m + 1);
                            }} style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '3px 7px', cursor: 'pointer' }}>
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>

                    {/* ── Tabla principal ── */}
                    <div className="ds-table-wrap overflow-x-auto no-scrollbar relative">
                        {loading ? (
                            <div className="min-h-[150px] flex items-center justify-center text-[10px] text-[var(--text-muted)] uppercase tracking-widest">
                                <Loader2 className="w-4 h-4 animate-spin mr-2 text-[var(--mkt)]" /> Procesando datos...
                            </div>
                        ) : (
                            <FinTable rows={tableData} columns={columns} totals={tableTotals} />
                        )}
                    </div>

                </div>
            )}
        </div>
    );
}
