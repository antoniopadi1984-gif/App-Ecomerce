'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '@/lib/store/store-context';
import { DollarSign, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { AgentButton } from '@/components/shared/AgentButton';

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
    width?: string;
}

interface ApiService {
    key: string;
    label: string;
    hasUsageTracking: boolean;
}

interface Gasto {
    id: string;
    nombre: string;
    categoria: string;
    importe: number;
    frecuencia: string;
    iva: number;
    activo: boolean;
    notas?: string;
    tienda?: string;
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

const ALL_KPIS = [
    { key: 'ingresosBrutos', label: 'Ingresos Brutos' },
    { key: 'beneficioNeto', label: 'Beneficio Neto' },
    { key: 'margenNeto', label: 'Margen Neto %' },
    { key: 'gastosTotal', label: 'Gastos Totales' },
    { key: 'inversionAds', label: 'Inversión Ads' },
    { key: 'roasReal', label: 'ROAS Real' },
    { key: 'cpaReal', label: 'CPA Real' },
    { key: 'ivaNeto', label: 'IVA Neto' },
    { key: 'profitBruto', label: 'Profit Bruto' },
    { key: 'pedidosTotal', label: 'Pedidos Total' },
    { key: 'tasaEntrega', label: 'Tasa Entrega %' },
    { key: 'tasaEnvio', label: 'Tasa Envío %' },
];

const ALERTABLE_COLUMNS = [
    { key: 'margenNeto', label: 'Margen Neto %', unit: '%', defaultGreen: 15, defaultYellow: 5, lowerIsBetter: false },
    { key: 'roasReal', label: 'ROAS Real', unit: 'x', defaultGreen: 2.5, defaultYellow: 1.5, lowerIsBetter: false },
    { key: 'pctProfit', label: 'Profit %', unit: '%', defaultGreen: 15, defaultYellow: 5, lowerIsBetter: false },
    { key: 'tasaEntregaReal', label: 'Tasa Entrega Real %', unit: '%', defaultGreen: 70, defaultYellow: 55, lowerIsBetter: false },
    { key: 'tasaEnvioReal', label: 'Tasa Envío Real %', unit: '%', defaultGreen: 90, defaultYellow: 75, lowerIsBetter: false },
    { key: 'tasaRecuperacion', label: 'Tasa Recuperación %', unit: '%', defaultGreen: 50, defaultYellow: 25, lowerIsBetter: false },
    { key: 'cvr', label: 'CVR %', unit: '%', defaultGreen: 3, defaultYellow: 1.5, lowerIsBetter: false },
    { key: 'cpaReal', label: 'CPA Real €', unit: 'EUR', defaultGreen: 15, defaultYellow: 25, lowerIsBetter: true },
    { key: 'roiReal', label: 'ROI Real %', unit: '%', defaultGreen: 30, defaultYellow: 10, lowerIsBetter: false },
    { key: 'gapMargen', label: 'Gap Margen %', unit: '%', defaultGreen: 0, defaultYellow: -5, lowerIsBetter: false },
    { key: 'pctSobreIngresos', label: 'Gastos % s/Ingresos', unit: '%', defaultGreen: 20, defaultYellow: 35, lowerIsBetter: true },
];

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

function getCellStyle(col: FinCol, value: number, alertThresholds: Record<string, any>): React.CSSProperties {
    const config = alertThresholds[col.key];

    // Si no hay config guardada O no está habilitada → sin color
    if (!config || !config.enabled) return {};
    if (value === undefined || value === null || isNaN(value)) return {};

    const { green, yellow, lowerIsBetter } = config;
    let color: string, bg: string;

    if (lowerIsBetter) {
        if (value <= green) { color = '#16a34a'; bg = 'rgba(34,197,94,0.09)'; }
        else if (value <= yellow) { color = '#d97706'; bg = 'rgba(234,179,8,0.09)'; }
        else { color = '#dc2626'; bg = 'rgba(239,68,68,0.09)'; }
    } else {
        if (value >= green) { color = '#16a34a'; bg = 'rgba(34,197,94,0.09)'; }
        else if (value >= yellow) { color = '#d97706'; bg = 'rgba(234,179,8,0.09)'; }
        else { color = '#dc2626'; bg = 'rgba(239,68,68,0.09)'; }
    }

    return { color, background: bg, fontWeight: 700 };
}

function generatePeriodRows(mode: ViewMode, month: number, year: number) {
    const today = new Date();
    const isCurrentMonth = today.getMonth() + 1 === month && today.getFullYear() === year;

    if (mode === 'daily') {
        const days = new Date(year, month, 0).getDate();
        return Array.from({ length: days }, (_, i) => {
            const d = i + 1;
            const isDayToday = isCurrentMonth && today.getDate() === d;
            return {
                key: `d${d}`,
                label: `${d}`,
                isToday: isDayToday,
                isActive: isDayToday // día hoy por defecto
            };
        });
    }
    if (mode === 'weekly') {
        let activeWeek = -1;
        if (isCurrentMonth) {
            const day = today.getDate();
            activeWeek = Math.floor((day - 1) / 7) + 1;
        }
        return Array.from({ length: 5 }, (_, i) => {
            const w = i + 1;
            return {
                key: `w${w}`,
                label: `Sem ${w}`,
                isToday: w === activeWeek,
                isActive: w === activeWeek
            };
        });
    }
    if (mode === 'monthly' || mode === 'annual') {
        return MONTHS.map((m, i) => {
            const mIdx = i + 1;
            const isMonthToday = today.getMonth() === i && today.getFullYear() === year;
            return {
                key: `m${mIdx}`,
                label: m.slice(0, 3).toUpperCase(),
                isToday: isMonthToday,
                isActive: mIdx === month
            };
        });
    }
    return [];
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

function ColHeader({ col, sortKey, sortDir, onSort }: any) {
    const isActive = sortKey === col.key;
    const parts = col.label?.split('\n') || [col.label];
    const symbol = parts.length >= 2 ? parts[0] : null;
    const lines = parts.length >= 2 ? parts.slice(1) : parts;

    return (
        <th
            onClick={() => onSort(col.key)}
            style={{
                padding: '0 4px',
                height: '44px',              // ← altura fija igual para TODOS los th
                verticalAlign: 'middle',     // ← centrado vertical real
                textAlign: 'center',
                fontSize: '8px', fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: isActive ? '#0f9e6b' : '#475569',
                lineHeight: 1.2,
                cursor: 'pointer',
                width: col.width || (col.key === 'label' ? '36px' : '58px'),
                borderBottom: isActive ? '2px solid #0f9e6b' : '2px solid #e2e8f0',
                boxSizing: 'border-box',
                ...(col.key === 'label'
                    ? { position: 'sticky', left: 0, background: 'white', zIndex: 11 }
                    : {})
            }}
        >
            {/* Contenedor interior centrado tanto horizontal como vertical */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',   // ← centra verticalmente dentro del th
                height: '100%',
                gap: '1px',
            }}>
                {/* Símbolo */}
                {symbol && (
                    <span style={{
                        fontSize: '9px', fontWeight: 900, lineHeight: 1,
                        color: isActive ? '#0f9e6b' : '#94a3b8',
                    }}>{symbol}</span>
                )}
                {/* Líneas del nombre */}
                {lines.map((line: string, i: number) => (
                    <span key={i} style={{ display: 'block', lineHeight: 1.15 }}>{line}</span>
                ))}
                {/* Indicador sort */}
                {isActive && (
                    <span style={{ fontSize: '7px', lineHeight: 1, color: '#0f9e6b' }}>
                        {sortDir === 'asc' ? '↑' : '↓'}
                    </span>
                )}
            </div>
        </th>
    );
}

function FinTable({ rows, columns, totals, alertThresholds }: { rows: any[]; columns: FinCol[]; totals: any; alertThresholds: Record<string, any> }) {
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

    const getRowBg = (isActive: boolean, isToday: boolean, index: number) => {
        if (isActive) return 'rgba(99, 102, 241, 0.12)';
        if (isToday) return 'rgba(15, 158, 107, 0.04)';
        return index % 2 === 0 ? 'white' : '#fafbff';
    };

    return (
        <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', minWidth: '1400px', fontSize: '11px' }}>
                <thead>
                    <tr style={{ position: 'sticky', top: 0, background: 'white', zIndex: 10 }}>
                        {columns.map(col => (
                            <ColHeader
                                key={col.key}
                                col={col}
                                sortKey={sortKey}
                                sortDir={sortDir}
                                onSort={handleSort}
                            />
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {sorted.map((row, i) => (
                        <tr key={row.key} style={{
                            borderBottom: row.isActive
                                ? '1px solid rgba(99, 102, 241, 0.25)'
                                : '1px solid #f1f5f9',
                            borderLeft: row.isActive ? '3px solid #6366f1' : '3px solid transparent',
                            transition: 'background 0.15s ease',
                        }}>
                            {columns.map(col => {
                                const baseBg = getRowBg(row.isActive, row.isToday, i);
                                const semaStyle = (row[col.key] !== undefined && row[col.key] !== null)
                                    ? (() => {
                                        const s = getCellStyle(col, row[col.key], alertThresholds);
                                        if (!s.background) return {};
                                        // Aumentar alpha del semáforo para que se vea sobre el highlight:
                                        const semaforoColor = (s.background as string).replace('0.09)', row.isActive ? '0.18)' : '0.09)');
                                        return { background: semaforoColor, color: s.color, fontWeight: s.fontWeight };
                                    })()
                                    : {};

                                return (
                                    <td
                                        key={col.key}
                                        style={{
                                            padding: '3px 5px',
                                            fontSize: '11px',
                                            whiteSpace: 'nowrap',
                                            textAlign: col.key === 'label' ? 'left' : 'right',
                                            width: col.width || (col.key === 'label' ? '32px' : '58px'),
                                            background: baseBg,
                                            ...semaStyle,
                                            ...(col.key === 'label' ? {
                                                position: 'sticky', left: 0,
                                                zIndex: 5,
                                                fontWeight: row.isActive ? 900 : 800,
                                                color: row.isActive ? '#4338ca' : '#0f172a',
                                                background: baseBg,
                                                textAlign: 'left',
                                            } : {}),
                                            ...(['profitNeto', 'profitBruto', 'pctProfit', 'roasReal'].includes(col.key) && row[col.key]
                                                ? { fontWeight: 900 }
                                                : {}),
                                        }}
                                    >
                                        {col.key === 'label' ? row.label : fmt(row[col.key], col.unit)}
                                    </td>
                                );
                            })}
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

// ─── CALCULADORAS ──────────────────────────────────────────────────────────────

// CALCULADORA 1 — ROAS Breakeven por producto
function CalcROAS() {
    const [precio, setPrecio] = useState(40);
    const [coste, setCoste] = useState(6);
    const [envio, setEnvio] = useState(4.5);
    const [devolucion, setDevolucion] = useState(3);
    const [tasaEntrega, setTasaEntrega] = useState(65);
    const [tasaDevolucion, setTasaDevolucion] = useState(15);
    const [feePasarela, setFeePasarela] = useState(6);
    const [feeOp, setFeeOp] = useState(0.30);

    const margenBruto = precio - coste;
    const costoFulfill = envio + (devolucion * tasaDevolucion / 100);
    const margenNeto = margenBruto - costoFulfill;
    const beRoas = margenNeto > 0 ? precio / margenNeto : 0;
    const margenCC = margenNeto - (precio * feePasarela / 100) - feeOp;
    const roasProfit10 = margenNeto > 0 ? precio / (margenNeto * 0.9) : 0;
    const roasProfit20 = margenNeto > 0 ? precio / (margenNeto * 0.8) : 0;
    const roasProfit30 = margenNeto > 0 ? precio / (margenNeto * 0.7) : 0;

    return (
        <div className="ds-card" style={{ padding: '14px' }}>
            <p style={{ fontSize: '11px', fontWeight: 900, color: '#0f172a', marginBottom: '10px' }}>
                ROAS Breakeven
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '10px' }}>
                {[
                    ['Precio venta €', precio, setPrecio],
                    ['Coste producto €', coste, setCoste],
                    ['Coste envío €', envio, setEnvio],
                    ['Coste devolución €', devolucion, setDevolucion],
                    ['Tasa entrega %', tasaEntrega, setTasaEntrega],
                    ['Tasa devolución %', tasaDevolucion, setTasaDevolucion],
                    ['Fee pasarela %', feePasarela, setFeePasarela],
                    ['Fee operación €', feeOp, setFeeOp],
                ].map(([label, val, setter]: any) => (
                    <div key={label}>
                        <label style={{ fontSize: '8px', fontWeight: 700, color: '#475569', display: 'block' }}>{label}</label>
                        <input type="number" value={val} onChange={e => setter(Number(e.target.value))}
                            style={{ width: '100%', padding: '4px 6px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '11px', fontWeight: 700, color: '#0f172a' }} />
                    </div>
                ))}
            </div>
            <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                {[
                    ['Margen bruto', `€${margenBruto.toFixed(2)}`, margenBruto > 0 ? '#16a34a' : '#dc2626'],
                    ['Margen neto', `€${margenNeto.toFixed(2)}`, margenNeto > 0 ? '#16a34a' : '#dc2626'],
                    ['BE ROAS', `${beRoas.toFixed(2)}x`, '#0f172a'],
                    ['Margen CC', `€${margenCC.toFixed(2)}`, margenCC > 0 ? '#16a34a' : '#dc2626'],
                    ['ROAS +10% profit', `${roasProfit10.toFixed(2)}x`, '#d97706'],
                    ['ROAS +20% profit', `${roasProfit20.toFixed(2)}x`, '#d97706'],
                    ['ROAS +30% profit', `${roasProfit30.toFixed(2)}x`, '#7c3aed'],
                ].map(([label, val, color]: any) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '9px', color: '#475569', fontWeight: 600 }}>{label}</span>
                        <span style={{ fontSize: '12px', fontWeight: 900, color, fontFamily: 'var(--mono)' }}>{val}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// CALCULADORA 2 — CPV / RPV / PPV
function CalcCPV() {
    const [aov, setAov] = useState(77);
    const [margen, setMargen] = useState(60);
    const [cr, setCr] = useState(3.2);
    const [cpvActual, setCpvActual] = useState(1.20);

    const rpv = aov * (cr / 100);
    const ppv = rpv * (margen / 100);
    const cpvMax = ppv;
    const miPpv = ppv - cpvActual;

    return (
        <div className="ds-card" style={{ padding: '14px' }}>
            <p style={{ fontSize: '11px', fontWeight: 900, color: '#0f172a', marginBottom: '10px' }}>
                CPV / RPV / PPV
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '10px' }}>
                {[
                    ['AOV (Ticket medio) €', aov, setAov],
                    ['Margen %', margen, setMargen],
                    ['CVR landing %', cr, setCr],
                    ['Mi CPV actual €', cpvActual, setCpvActual],
                ].map(([label, val, setter]: any) => (
                    <div key={label}>
                        <label style={{ fontSize: '8px', fontWeight: 700, color: '#475569', display: 'block' }}>{label}</label>
                        <input type="number" value={val} onChange={e => setter(Number(e.target.value))}
                            style={{ width: '100%', padding: '4px 6px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '11px', fontWeight: 700, color: '#0f172a' }} />
                    </div>
                ))}
            </div>
            <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                {[
                    ['CPV Máximo €', `€${cpvMax.toFixed(2)}`, '#0f172a'],
                    ['RPV (Rev/visita) €', `€${rpv.toFixed(2)}`, '#0f172a'],
                    ['PPV (Profit/visita) €', `€${ppv.toFixed(2)}`, ppv > 0 ? '#16a34a' : '#dc2626'],
                    ['Mi PPV actual €', `€${miPpv.toFixed(2)}`, miPpv > 0 ? '#16a34a' : '#dc2626'],
                ].map(([label, val, color]: any) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '9px', color: '#475569', fontWeight: 600 }}>{label}</span>
                        <span style={{ fontSize: '12px', fontWeight: 900, color, fontFamily: 'var(--mono)' }}>{val}</span>
                    </div>
                ))}
            </div>
            <p style={{ fontSize: '8px', color: '#64748b', marginTop: '6px', lineHeight: 1.4 }}>
                CPV = Coste por visita · RPV = Facturación por visita · PPV = Profit por visita
            </p>
        </div>
    );
}

// CALCULADORA 3 — CPA Máximo
function CalcCPA() {
    const [precio, setPrecio] = useState(40);
    const [coste, setCoste] = useState(6);
    const [envio, setEnvio] = useState(4.5);
    const [devolucion, setDevolucion] = useState(3);
    const [tasaEntrega, setTasaEntrega] = useState(65);
    const [tasaDev, setTasaDev] = useState(15);
    const [margenMin, setMargenMin] = useState(10);

    const ingresoEsperado = precio * (tasaEntrega / 100);
    const costes = coste + envio + (devolucion * tasaDev / 100);
    const beneficioUnitario = ingresoEsperado - costes;
    const cpaMax = beneficioUnitario;
    const cpaObj = beneficioUnitario * (1 - margenMin / 100);

    return (
        <div className="ds-card" style={{ padding: '14px' }}>
            <p style={{ fontSize: '11px', fontWeight: 900, color: '#0f172a', marginBottom: '10px' }}>
                CPA Máximo
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '10px' }}>
                {[
                    ['Precio venta €', precio, setPrecio],
                    ['Coste producto €', coste, setCoste],
                    ['Coste envío €', envio, setEnvio],
                    ['Coste devolución €', devolucion, setDevolucion],
                    ['Tasa entrega %', tasaEntrega, setTasaEntrega],
                    ['Tasa devolución %', tasaDev, setTasaDev],
                    ['Margen mínimo %', margenMin, setMargenMin],
                ].map(([label, val, setter]: any) => (
                    <div key={label}>
                        <label style={{ fontSize: '8px', fontWeight: 700, color: '#475569', display: 'block' }}>{label}</label>
                        <input type="number" value={val} onChange={e => setter(Number(e.target.value))}
                            style={{ width: '100%', padding: '4px 6px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '11px', fontWeight: 700, color: '#0f172a' }} />
                    </div>
                ))}
            </div>
            <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                {[
                    ['Beneficio/unidad €', `€${beneficioUnitario.toFixed(2)}`, beneficioUnitario > 0 ? '#16a34a' : '#dc2626'],
                    ['CPA máx (break-even)', `€${cpaMax.toFixed(2)}`, '#0f172a'],
                    [`CPA obj (${margenMin}% profit)`, `€${cpaObj.toFixed(2)}`, '#d97706'],
                    ['ROAS mínimo', `${cpaMax > 0 ? (precio / cpaMax).toFixed(2) : 0}x`, '#7c3aed'],
                ].map(([label, val, color]: any) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '9px', color: '#475569', fontWeight: 600 }}>{label}</span>
                        <span style={{ fontSize: '12px', fontWeight: 900, color, fontFamily: 'var(--mono)' }}>{val}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// CALCULADORA 4 — Escalado de presupuesto
function CalcEscalado() {
    const [cpa, setCpa] = useState(8);
    const [roas, setRoas] = useState(3.2);
    const [pctProfit, setPctProfit] = useState(21);

    const budgets = [100, 300, 500, 1000, 2000, 5000];

    return (
        <div className="ds-card" style={{ padding: '14px' }}>
            <p style={{ fontSize: '11px', fontWeight: 900, color: '#0f172a', marginBottom: '10px' }}>
                Escalado de Presupuesto
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginBottom: '10px' }}>
                {[
                    ['CPA €', cpa, setCpa],
                    ['ROAS x', roas, setRoas],
                    ['% Profit', pctProfit, setPctProfit],
                ].map(([label, val, setter]: any) => (
                    <div key={label}>
                        <label style={{ fontSize: '8px', fontWeight: 700, color: '#475569', display: 'block' }}>{label}</label>
                        <input type="number" value={val} onChange={e => setter(Number(e.target.value))}
                            style={{ width: '100%', padding: '4px 6px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '11px', fontWeight: 700, color: '#0f172a' }} />
                    </div>
                ))}
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
                <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                        {['Gasto/día', 'Pedidos', 'Revenue', 'Profit', '%'].map(h => (
                            <th key={h} style={{ padding: '3px 6px', textAlign: 'right', fontSize: '8px', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {budgets.map(budget => {
                        const pedidos = cpa > 0 ? Math.round(budget / cpa) : 0;
                        const revenue = budget * roas;
                        const profit = revenue * (pctProfit / 100);
                        return (
                            <tr key={budget} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '3px 6px', fontWeight: 700, color: '#0f172a', textAlign: 'right', fontFamily: 'var(--mono)' }}>€{budget}</td>
                                <td style={{ padding: '3px 6px', color: '#334155', textAlign: 'right', fontFamily: 'var(--mono)' }}>{pedidos}</td>
                                <td style={{ padding: '3px 6px', color: '#334155', textAlign: 'right', fontFamily: 'var(--mono)' }}>€{revenue.toFixed(0)}</td>
                                <td style={{ padding: '3px 6px', color: profit > 0 ? '#16a34a' : '#dc2626', fontWeight: 700, textAlign: 'right', fontFamily: 'var(--mono)' }}>€{profit.toFixed(0)}</td>
                                <td style={{ padding: '3px 6px', color: '#475569', textAlign: 'right', fontFamily: 'var(--mono)' }}>{pctProfit}%</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

// SIMULADOR DE ESCENARIOS (PROYECCIONES)
function ProyeccionesTab({ storeId, activeStoreId, tableTotals }: any) {
    const [facturacionObj, setFacturacionObj] = useState(50000);
    const [profitObj, setProfitObj] = useState(8000);
    const [tasaEntrega, setTasaEntrega] = useState(65);
    const [tasaEnvio, setTasaEnvio] = useState(95);
    const [cvr, setCvr] = useState(2.5);
    const [roas, setRoas] = useState(3.0);
    const [aov, setAov] = useState(40);
    const [coste, setCoste] = useState(6);
    const [costoEnvio, setCostoEnvio] = useState(4.5);
    const [costoDev, setCostoDev] = useState(3);
    const [gastosFijos, setGastosFijos] = useState(500);
    const [diasMes, setDiasMes] = useState(31);

    const presupuestoAds = roas > 0 ? facturacionObj / roas : 0;
    const pedidosNecesarios = aov > 0 ? Math.round(facturacionObj / aov) : 0;
    const pedidosConfirmados = tasaEnvio > 0 ? Math.round(pedidosNecesarios / (tasaEnvio / 100)) : 0;
    const visitantesNecesarios = cvr > 0 ? Math.round(pedidosConfirmados / (cvr / 100)) : 0;
    const pedidosEntregados = Math.round(pedidosConfirmados * (tasaEntrega / 100));
    const facturacionReal = pedidosEntregados * aov;
    const cogsTotal = pedidosConfirmados * coste;
    const enviosTotal = pedidosConfirmados * costoEnvio;
    const devTotal = (pedidosConfirmados - pedidosEntregados) * costoDev;
    const profitEstimado = facturacionReal - presupuestoAds - cogsTotal - enviosTotal - devTotal - gastosFijos;
    const pctProfitEstimado = facturacionReal > 0 ? (profitEstimado / facturacionReal) * 100 : 0;
    const gapProfit = profitEstimado - profitObj;
    const presupuestoDiario = diasMes > 0 ? presupuestoAds / diasMes : 0;

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '16px', padding: '4px' }}>
            <div className="ds-card" style={{ padding: '14px' }}>
                <p style={{ fontSize: '11px', fontWeight: 900, color: '#0f172a', marginBottom: '10px' }}>
                    Parámetros del escenario
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                    {[
                        ['Facturación objetivo €', facturacionObj, setFacturacionObj],
                        ['Profit objetivo €', profitObj, setProfitObj],
                        ['ROAS esperado x', roas, setRoas],
                        ['CVR landing %', cvr, setCvr],
                        ['Ticket medio (AOV) €', aov, setAov],
                        ['Tasa envío %', tasaEnvio, setTasaEnvio],
                        ['Tasa entrega %', tasaEntrega, setTasaEntrega],
                        ['Coste producto €', coste, setCoste],
                        ['Coste envío €', costoEnvio, setCostoEnvio],
                        ['Coste devolución €', costoDev, setCostoDev],
                        ['Gastos fijos mes €', gastosFijos, setGastosFijos],
                        ['Días del mes', diasMes, setDiasMes],
                    ].map(([label, val, setter]: any) => (
                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                            <label style={{ fontSize: '9px', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>{label}</label>
                            <input
                                type="number" value={val}
                                onChange={e => setter(Number(e.target.value))}
                                style={{
                                    width: '90px', padding: '3px 7px', borderRadius: '6px',
                                    border: '1px solid #e2e8f0', fontSize: '11px',
                                    fontWeight: 700, color: '#0f172a', textAlign: 'right',
                                }}
                            />
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    {[
                        ['Presupuesto Ads total', `€${presupuestoAds.toFixed(0)}`, '#7c3aed'],
                        ['Presupuesto Ads/día', `€${presupuestoDiario.toFixed(0)}`, '#7c3aed'],
                        ['Pedidos necesarios', `${pedidosNecesarios}`, '#0f172a'],
                        ['Visitantes necesarios', `${visitantesNecesarios.toLocaleString()}`, '#0f172a'],
                        ['Pedidos entregados', `${pedidosEntregados}`, '#0f172a'],
                        ['Facturación real est.', `€${facturacionReal.toFixed(0)}`, '#0f9e6b'],
                        ['Profit estimado', `€${profitEstimado.toFixed(0)}`, profitEstimado >= profitObj ? '#16a34a' : profitEstimado > 0 ? '#d97706' : '#dc2626'],
                        ['% Profit estimado', `${pctProfitEstimado.toFixed(1)}%`, pctProfitEstimado >= 15 ? '#16a34a' : pctProfitEstimado >= 5 ? '#d97706' : '#dc2626'],
                        ['Gap vs objetivo', `€${gapProfit.toFixed(0)}`, gapProfit >= 0 ? '#16a34a' : '#dc2626'],
                    ].map(([label, val, color]: any) => (
                        <div key={label} style={{
                            background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px',
                            padding: '8px 12px',
                        }}>
                            <p style={{ fontSize: '8px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', margin: 0, lineHeight: 1.2 }}>{label}</p>
                            <p style={{ fontSize: '16px', fontWeight: 900, color, margin: 0, lineHeight: 1.1, fontFamily: 'var(--mono)' }}>{val}</p>
                        </div>
                    ))}
                </div>

                <div style={{
                    background: '#f0fdf4', border: '1px solid #bbf7d0',
                    borderRadius: '10px', padding: '12px 14px',
                }}>
                    <p style={{ fontSize: '10px', fontWeight: 800, color: '#166534', marginBottom: '6px' }}>
                        🎯 Para alcanzar el objetivo de €{profitObj.toLocaleString()} profit:
                    </p>
                    {gapProfit < 0 && (
                        <ul style={{ margin: 0, paddingLeft: '14px', fontSize: '10px', color: '#334155', lineHeight: 1.6 }}>
                            <li>Necesitas <strong>€{Math.abs(gapProfit).toFixed(0)} más</strong> de profit</li>
                            <li>Subir ROAS a <strong>{((facturacionObj) / (facturacionObj / roas - Math.abs(gapProfit))).toFixed(2)}x</strong> manteniendolo todo igual</li>
                            <li>O reducir CPA en <strong>€{pedidosNecesarios > 0 ? (Math.abs(gapProfit) / pedidosNecesarios).toFixed(2) : 0}</strong> por pedido</li>
                            <li>O mejorar tasa entrega al <strong>{pedidosConfirmados > 0 && aov > 0 && facturacionReal > 0 ? (((profitEstimado + pedidosConfirmados * aov * (Math.abs(gapProfit) / facturacionReal)) / (pedidosConfirmados * aov)) * 100).toFixed(1) : 0}%</strong></li>
                        </ul>
                    )}
                    {gapProfit >= 0 && (
                        <p style={{ fontSize: '10px', color: '#166534', margin: 0 }}>
                            ✅ El escenario actual supera el objetivo en <strong>€{gapProfit.toFixed(0)}</strong>. Puedes escalar o mejorar margen.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── GASTOS FIJOS ──────────────────────────────────────────────────────────────
function GastosFijosTab({ storeId }: any) {
    const [gastos, setGastos] = useState<Gasto[]>([]);
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<Gasto | null>(null);

    // Initial load placeholder
    useEffect(() => {
        if (!storeId) return;
        fetch(`/api/finanzas/gastos-fijos?storeId=${storeId}`)
            .then(res => res.json())
            .then(data => {
                if (data.ok && data.gastos) setGastos(data.gastos);
            })
            .catch(() => { });
    }, [storeId]);

    const saveGasto = async (data: any) => {
        const isEditing = !!editing;
        try {
            const method = isEditing ? 'PUT' : 'POST';
            const url = isEditing ? `/api/finanzas/gastos-fijos/${editing.id}` : '/api/finanzas/gastos-fijos';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...data, storeId })
            });
            const result = await res.json();
            if (result.ok) {
                if (isEditing) {
                    setGastos(prev => prev.map(g => g.id === result.gasto.id ? result.gasto : g));
                } else {
                    setGastos(prev => [...prev, result.gasto]);
                }
            } else {
                // local fallback if api not implemented
                const newGasto = { id: editing?.id || Date.now().toString(), ...data, activo: editing ? editing.activo : true };
                if (isEditing) setGastos(prev => prev.map(g => g.id === newGasto.id ? newGasto : g));
                else setGastos(prev => [...prev, newGasto]);
            }
        } catch (error) {
            // local fallback if api fails
            const newGasto = { id: editing?.id || Date.now().toString(), ...data, activo: editing ? editing.activo : true };
            if (isEditing) setGastos(prev => prev.map(g => g.id === newGasto.id ? newGasto : g));
            else setGastos(prev => [...prev, newGasto]);
        }
    };

    const deleteGasto = async (id: string) => {
        try {
            await fetch(`/api/finanzas/gastos-fijos/${id}`, { method: 'DELETE' });
            setGastos(prev => prev.filter(g => g.id !== id));
        } catch {
            setGastos(prev => prev.filter(g => g.id !== id));
        }
    };

    const toggleActivo = async (id: string) => {
        const gasto = gastos.find(g => g.id === id);
        if (!gasto) return;
        try {
            await fetch(`/api/finanzas/gastos-fijos/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ activo: !gasto.activo })
            });
            setGastos(prev => prev.map(g => g.id === id ? { ...g, activo: !g.activo } : g));
        } catch {
            setGastos(prev => prev.map(g => g.id === id ? { ...g, activo: !g.activo } : g));
        }
    };

    const totalMensual = gastos
        .filter(g => g.activo)
        .reduce((acc, g) => {
            if (g.frecuencia === 'mensual') return acc + g.importe;
            if (g.frecuencia === 'anual') return acc + g.importe / 12;
            if (g.frecuencia === 'semanal') return acc + g.importe * 4.33;
            if (g.frecuencia === 'diario') return acc + g.importe * 30;
            return acc;
        }, 0);

    const totalDiario = totalMensual / 31;

    return (
        <div style={{ padding: '4px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
                {[
                    ['Total mensual', `€${totalMensual.toFixed(2)}`, '#0f172a'],
                    ['Prorrateado/día', `€${totalDiario.toFixed(2)}`, '#d97706'],
                    ['Gastos activos', `${gastos.filter(g => g.activo).length}`, '#0f172a'],
                ].map(([label, val, color]: any) => (
                    <div key={label} style={{
                        background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px',
                        padding: '8px 14px', borderLeft: `3px solid ${color}`
                    }}>
                        <p style={{ fontSize: '8px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', margin: 0 }}>{label}</p>
                        <p style={{ fontSize: '16px', fontWeight: 900, color, margin: 0, fontFamily: 'var(--mono)' }}>{val}</p>
                    </div>
                ))}
                <button onClick={() => { setEditing(null); setFormOpen(true); }} style={{
                    marginLeft: 'auto', padding: '8px 16px', borderRadius: '8px',
                    background: '#0f9e6b', color: 'white', border: 'none',
                    fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                }}>+ Añadir gasto</button>
            </div>

            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                            {['Nombre', 'Categoría', 'Importe €', 'Frecuencia', 'Mensual €', 'IVA %', 'Activo', ''].map(h => (
                                <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontSize: '8px', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {gastos.map((g, i) => (
                            <tr key={g.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? 'white' : '#fafbff', opacity: g.activo ? 1 : 0.5 }}>
                                <td style={{ padding: '7px 10px', fontWeight: 700, color: '#0f172a' }}>{g.nombre}</td>
                                <td style={{ padding: '7px 10px', color: '#475569' }}>
                                    <span style={{ background: '#f1f5f9', padding: '2px 7px', borderRadius: '4px', fontSize: '9px', fontWeight: 700 }}>{g.categoria}</span>
                                </td>
                                <td style={{ padding: '7px 10px', fontWeight: 700, color: '#0f172a', fontFamily: 'var(--mono)' }}>€{g.importe.toFixed(2)}</td>
                                <td style={{ padding: '7px 10px', color: '#475569', textTransform: 'capitalize' }}>{g.frecuencia}</td>
                                <td style={{ padding: '7px 10px', fontWeight: 700, color: '#d97706', fontFamily: 'var(--mono)' }}>
                                    €{(g.frecuencia === 'mensual' ? g.importe : g.frecuencia === 'anual' ? g.importe / 12 : g.frecuencia === 'semanal' ? g.importe * 4.33 : g.importe * 30).toFixed(2)}
                                </td>
                                <td style={{ padding: '7px 10px', color: '#475569' }}>{g.iva}%</td>
                                <td style={{ padding: '7px 10px' }}>
                                    <button onClick={() => toggleActivo(g.id)} style={{
                                        width: '32px', height: '16px', borderRadius: '8px',
                                        background: g.activo ? '#0f9e6b' : '#e2e8f0',
                                        border: 'none', cursor: 'pointer', position: 'relative', transition: 'all 0.2s'
                                    }}>
                                        <div style={{
                                            width: '12px', height: '12px', borderRadius: '50%', background: 'white',
                                            position: 'absolute', top: '2px',
                                            left: g.activo ? '18px' : '2px', transition: 'all 0.2s'
                                        }} />
                                    </button>
                                </td>
                                <td style={{ padding: '7px 10px' }}>
                                    <button onClick={() => { setEditing(g); setFormOpen(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '11px' }}>✏</button>
                                    <button onClick={() => deleteGasto(g.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '11px', marginLeft: '4px' }}>🗑</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {formOpen && (
                <GastoForm
                    gasto={editing}
                    onSave={(data: any) => { saveGasto(data); setFormOpen(false); }}
                    onClose={() => setFormOpen(false)}
                />
            )}
        </div>
    );
}

function GastoForm({ gasto, onSave, onClose }: any) {
    const [nombre, setNombre] = useState(gasto?.nombre || '');
    const [importe, setImporte] = useState(gasto?.importe || 0);
    const [frecuencia, setFrecuencia] = useState(gasto?.frecuencia || 'mensual');
    const [categoria, setCategoria] = useState(gasto?.categoria || 'Plataforma');
    const [iva, setIva] = useState(gasto?.iva || 21);
    const [notas, setNotas] = useState(gasto?.notas || '');
    const [tienda, setTienda] = useState(gasto?.tienda || 'esta');

    const CATEGORIAS = ['Plataforma', 'API IA', 'Logística', 'Marketing', 'Empleados', 'Administración', 'Legal', 'Oficina', 'Otro'];
    const FRECUENCIAS = ['diario', 'semanal', 'mensual', 'anual'];
    const IVA_RATES = [0, 4, 10, 21];

    return (
        <div style={{
            position: 'fixed', right: 0, top: 0, bottom: 0, width: '340px',
            background: 'white', borderLeft: '1px solid #e2e8f0',
            boxShadow: '-4px 0 24px rgba(0,0,0,0.08)', zIndex: 100,
            padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <p style={{ fontSize: '13px', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                    {gasto ? 'Editar gasto' : 'Nuevo gasto'}
                </p>
                <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>

            {[
                { label: 'Nombre del gasto *', val: nombre, set: setNombre, type: 'text' },
                { label: 'Importe €', val: importe, set: setImporte, type: 'number' },
                { label: 'Notas', val: notas, set: setNotas, type: 'text' },
            ].map(({ label, val, set, type }: any) => (
                <div key={label}>
                    <label style={{ fontSize: '9px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '3px' }}>{label}</label>
                    <input type={type as string} value={val} onChange={e => set(type === 'number' ? Number(e.target.value) : e.target.value)}
                        style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px', color: '#0f172a', boxSizing: 'border-box' }} />
                </div>
            ))}

            <div>
                <label style={{ fontSize: '9px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '3px' }}>Frecuencia</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                    {FRECUENCIAS.map(f => (
                        <button key={f} onClick={() => setFrecuencia(f)} style={{
                            flex: 1, padding: '5px', borderRadius: '6px', fontSize: '9px', fontWeight: 700, cursor: 'pointer',
                            background: frecuencia === f ? '#0f9e6b' : '#f1f5f9',
                            color: frecuencia === f ? 'white' : '#475569', border: 'none',
                            textTransform: 'capitalize'
                        }}>{f}</button>
                    ))}
                </div>
            </div>

            <div>
                <label style={{ fontSize: '9px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '3px' }}>Categoría</label>
                <select value={categoria} onChange={e => setCategoria(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px', color: '#0f172a', boxSizing: 'border-box' }}>
                    {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>

            <div>
                <label style={{ fontSize: '9px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '3px' }}>IVA %</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                    {IVA_RATES.map(r => (
                        <button key={r} onClick={() => setIva(r)} style={{
                            flex: 1, padding: '5px', borderRadius: '6px', fontSize: '10px', fontWeight: 700, cursor: 'pointer',
                            background: iva === r ? '#7c3aed' : '#f1f5f9',
                            color: iva === r ? 'white' : '#475569', border: 'none',
                        }}>{r}%</button>
                    ))}
                </div>
            </div>

            <div>
                <label style={{ fontSize: '9px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '3px' }}>Aplica a</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                    {[['esta', 'Esta tienda'], ['todas', 'Todas las tiendas']].map(([val, label]) => (
                        <button key={val} onClick={() => setTienda(val)} style={{
                            flex: 1, padding: '5px', borderRadius: '6px', fontSize: '9px', fontWeight: 700, cursor: 'pointer',
                            background: tienda === val ? '#0f172a' : '#f1f5f9',
                            color: tienda === val ? 'white' : '#475569', border: 'none',
                        }}>{label}</button>
                    ))}
                </div>
            </div>

            <button
                onClick={() => onSave({ nombre, importe, frecuencia, categoria, iva, notas, tienda })}
                style={{
                    marginTop: 'auto', padding: '10px', borderRadius: '8px',
                    background: '#0f9e6b', color: 'white', border: 'none',
                    fontSize: '12px', fontWeight: 800, cursor: 'pointer',
                }}
            >
                {gasto ? 'Guardar cambios' : 'Añadir gasto'}
            </button>
        </div>
    );
}

// ─── Column definitions per tab ───────────────────────────────────────────────

function useColumns(activeTab: string, viewMode: ViewMode, apiServices: ApiService[]): FinCol[] {
    return useMemo(() => {
        const periodCol: FinCol = {
            key: 'label',
            label: viewMode === 'daily' ? 'DÍA' : viewMode === 'weekly' ? 'SEM' : viewMode === 'monthly' ? 'MES' : 'MES',
            type: 'string',
            width: viewMode === 'daily' ? '32px' : viewMode === 'weekly' ? '44px' : '48px'
        };

        if (activeTab === 'contabilidad') {
            return [
                periodCol,
                { key: 'ingresos', label: '€\nINGRESOS\nBRUTOS', type: 'sum', unit: 'EUR' },
                { key: 'devoluciones', label: '€\nDEVOL.', type: 'sum', unit: 'EUR' },
                { key: 'ingresosNetos', label: '€\nINGRESOS\nNETOS', type: 'sum', unit: 'EUR' },
                { key: 'cogs', label: '€\nCOGS', type: 'sum', unit: 'EUR' },
                { key: 'gastosFijos', label: '€\nFIJOS', type: 'sum', unit: 'EUR' },
                { key: 'gastosAds', label: '€\nADS', type: 'sum', unit: 'EUR' },
                { key: 'gastosApisDia', label: '€\nAPIs', type: 'sum', unit: 'EUR' },
                {
                    key: 'gastosTotal', label: '€\nGASTOS\nTOTAL', type: 'calc', unit: 'EUR',
                    calcFn: t => (t.cogs || 0) + (t.gastosFijos || 0) + (t.gastosAds || 0) + (t.gastosApisDia || 0) + (t.gastosEnvios || 0) + (t.gastosDevolucion || 0)
                },
                {
                    key: 'profitNeto', label: '€\nPROFIT', type: 'calc', unit: 'EUR',
                    thresholds: [0.01, 0],
                    calcFn: t => {
                        const facturacionEntregados = (t.pedidosEntregados || 0) * ((t.ingresos || 0) / (t.pedidosConfirmados || 1));
                        return facturacionEntregados - ((t.cogs || 0) + (t.gastosFijos || 0) + (t.gastosAds || 0) + (t.gastosApisDia || 0) + (t.gastosEnvios || 0) + (t.gastosDevolucion || 0));
                    }
                },
                {
                    key: 'margenNeto', label: '%\nMARGEN\nNETO', type: 'calc', unit: '%', thresholds: [25, 15],
                    calcFn: t => t.ingresosNetos > 0 ? (((t.ingresosNetos || 0) - ((t.cogs || 0) + (t.gastosFijos || 0) + (t.gastosAds || 0) + (t.gastosApisDia || 0) + (t.gastosEnvios || 0) + (t.gastosDevolucion || 0))) / t.ingresosNetos) * 100 : 0
                },
                {
                    key: 'pctProfit', label: '%\nPROFIT', type: 'calc', unit: '%', thresholds: [15, 5],
                    calcFn: t => {
                        const facturacionEntregados = (t.pedidosEntregados || 0) * ((t.ingresos || 0) / (t.pedidosConfirmados || 1));
                        const profit = facturacionEntregados - ((t.cogs || 0) + (t.gastosFijos || 0) + (t.gastosAds || 0) + (t.gastosApisDia || 0) + (t.gastosEnvios || 0) + (t.gastosDevolucion || 0));
                        return facturacionEntregados > 0 ? (profit / facturacionEntregados) * 100 : 0;
                    }
                },
                {
                    key: 'roasReal', label: 'x\nROAS', type: 'calc', unit: 'x', thresholds: [2.5, 1.5],
                    calcFn: t => {
                        const facturacionEntregados = (t.pedidosEntregados || 0) * ((t.ingresos || 0) / (t.pedidosConfirmados || 1));
                        return t.gastosAds > 0 ? facturacionEntregados / t.gastosAds : 0;
                    }
                },
                {
                    key: 'cpaReal', label: '€\nCPA', type: 'calc', unit: 'EUR',
                    thresholds: [15, 25], lowerIsBetter: true,
                    calcFn: t => t.pedidosConfirmados > 0 ? (t.gastosAds || 0) / t.pedidosConfirmados : 0
                },
                {
                    key: 'roiReal', label: '%\nROI', type: 'calc', unit: '%', thresholds: [30, 10],
                    calcFn: t => {
                        const facturacionEntregados = (t.pedidosEntregados || 0) * ((t.ingresos || 0) / (t.pedidosConfirmados || 1));
                        const costs = (t.cogs || 0) + (t.gastosFijos || 0) + (t.gastosAds || 0) + (t.gastosApisDia || 0) + (t.gastosEnvios || 0) + (t.gastosDevolucion || 0);
                        const profit = facturacionEntregados - costs;
                        return costs > 0 ? (profit / costs) * 100 : 0;
                    }
                },
                { key: 'tasaEnvioReal', label: '%\nT.ENVÍO', type: 'avg', unit: '%', thresholds: [90, 75] },
                { key: 'tasaEntregaReal', label: '%\nT.ENTREGA', type: 'avg', unit: '%', thresholds: [70, 55] },
                { key: 'tasaRecuperacion', label: '%\nT.RECUP.', type: 'avg', unit: '%', thresholds: [50, 25] },
                { key: 'cvr', label: '%\nCVR', type: 'avg', unit: '%', thresholds: [3, 1.5] },
                { key: 'tasaEntregaConfig', label: '%\nT.ENTREGA\nCONFIG.', type: 'avg', unit: '%', thresholds: [70, 55] },
                {
                    key: 'facturacionEntregados', label: '€\nFACT.\nENTREG.', type: 'calc', unit: 'EUR',
                    calcFn: t => (t.pedidosEntregados || 0) * ((t.ingresos || 0) / (t.pedidosConfirmados || 1))
                },
                { key: 'facturacionCOD', label: '€\nFACT.\nCOD', type: 'sum', unit: 'EUR' },
                { key: 'facturacionTarjeta', label: '€\nFACT.\nTARJETA', type: 'sum', unit: 'EUR' },
                { key: 'gastosEnvios', label: '€\nENVÍOS', type: 'sum', unit: 'EUR' },
                { key: 'gastosDevolucion', label: '€\nDEV.', type: 'sum', unit: 'EUR' },
                {
                    key: 'pctCOD', label: '%\nCOD', type: 'calc', unit: '%',
                    calcFn: t => t.ingresos > 0 ? (t.facturacionCOD / t.ingresos) * 100 : 0
                },
                {
                    key: 'pctTarjeta', label: '%\nTARJETA', type: 'calc', unit: '%',
                    calcFn: t => t.ingresos > 0 ? (t.facturacionTarjeta / t.ingresos) * 100 : 0
                },
                { key: 'ivaSoportado', label: '€\nIVA\nSOPORT.', type: 'sum' as const, unit: 'EUR' as const },
                { key: 'ivaRepercutido', label: '€\nIVA\nREPERC.', type: 'sum' as const, unit: 'EUR' as const },
                {
                    key: 'ivaNeto', label: '€\nIVA\nNETO', type: 'calc' as const, unit: 'EUR' as const,
                    calcFn: t => (t.ivaRepercutido || 0) - (t.ivaSoportado || 0)
                },
                { key: 'margenObjetivo', label: '%\nMARGEN\nOBJ.', type: 'avg' as const, unit: '%' as const },
                {
                    key: 'gapMargen', label: '%\nGAP\nMARGEN', type: 'calc' as const, unit: '%' as const,
                    thresholds: [0, -5],
                    calcFn: t => (t.margenNeto || 0) - (t.margenObjetivo || 0)
                },
            ];
        }

        if (activeTab === 'gastos') {
            return [
                periodCol,
                { key: 'alquiler', label: '€\nALQUILER', type: 'sum', unit: 'EUR' },
                { key: 'nominas', label: '€\nNÓMINAS', type: 'sum', unit: 'EUR' },
                { key: 'seguros', label: '€\nSEGUROS', type: 'sum', unit: 'EUR' },
                { key: 'software', label: '€\nSOFTWARE', type: 'sum', unit: 'EUR' },
                { key: 'herramientas', label: '€\nHERRAMIENT.', type: 'sum', unit: 'EUR' },
                { key: 'marketing', label: '€\nMARKETING\nFIJO', type: 'sum', unit: 'EUR' },
                { key: 'contabilidad', label: '€\nCONTABIL.', type: 'sum', unit: 'EUR' },
                { key: 'legal', label: '€\nLEGAL', type: 'sum', unit: 'EUR' },
                { key: 'otros', label: '€\nOTROS', type: 'sum', unit: 'EUR' },
                {
                    key: 'totalFijos', label: '€\nTOTAL\nFIJOS', type: 'calc', unit: 'EUR',
                    calcFn: t => ['alquiler', 'nominas', 'seguros', 'software', 'herramientas', 'marketing', 'contabilidad', 'legal', 'otros'].reduce((s, k) => s + (t[k] || 0), 0)
                },
                { key: 'pctSobreIngresos', label: '%\nS/INGRESOS', type: 'avg', unit: '%', thresholds: [20, 35], lowerIsBetter: true },
            ];
        }

        if (activeTab === 'apis') {
            return [
                periodCol,
                ...apiServices.map(s => ({
                    key: s.key,
                    label: `${s.label.toUpperCase()}\n€`,
                    type: 'sum' as const,
                    unit: 'EUR' as const,
                })),
                {
                    key: 'totalApis', label: '€\nTOTAL\nAPIS', type: 'calc', unit: 'EUR',
                    calcFn: (t: any) => apiServices.reduce((acc, s) => acc + (t[s.key] || 0), 0)
                },
                ...(apiServices.some(s => s.hasUsageTracking) ? [
                    { key: 'tokens', label: '#\nTOKENS', type: 'sum' as const, unit: undefined },
                    {
                        key: 'costePorToken', label: '€\nCOSTE/1K\nTOKENS', type: 'calc' as const, unit: 'EUR' as const,
                        calcFn: (t: any) => t.tokens > 0 ? (t.totalApis / t.tokens) * 1000 : 0
                    }
                ] : []),
            ];
        }

        if (activeTab === 'calculadoras') {
            return [
                periodCol,
                { key: 'pvp', label: '€\nPVP', type: 'avg', unit: 'EUR' },
                { key: 'costeProducto', label: '€\nCOSTE\nPROD.', type: 'avg', unit: 'EUR' },
                { key: 'costeEnvio', label: '€\nCOSTE\nENVÍO', type: 'avg', unit: 'EUR' },
                { key: 'margenBruto', label: '%\nMARGEN\nBRUTO', type: 'avg', unit: '%', thresholds: [50, 30] },
                { key: 'roasBR', label: 'x\nROAS\nBREAKEVEN', type: 'avg', unit: 'x', thresholds: [2.5, 1.5] },
                { key: 'cpaMax', label: '€\nCPA\nMÁX.', type: 'avg', unit: 'EUR' },
                { key: 'cpcMax', label: '€\nCPC\nMÁX.', type: 'avg', unit: 'EUR' },
                { key: 'tasaEntrega', label: '%\nT.ENTREGA', type: 'avg', unit: '%', thresholds: [85, 70] },
                { key: 'tasaEnvio', label: '%\nT.ENVÍO', type: 'avg', unit: '%', thresholds: [90, 80] },
                { key: 'tasaConversion', label: '%\nT.CONV.', type: 'avg', unit: '%', thresholds: [2, 1] },
            ];
        }

        if (activeTab === 'proyecciones') {
            return [
                periodCol,
                { key: 'pedidosObj', label: '#\nPEDIDOS\nOBJ.', type: 'avg', unit: undefined },
                { key: 'pedidosReal', label: '#\nPEDIDOS\nREAL', type: 'sum', unit: undefined },
                {
                    key: 'cumplimiento', label: '%\nCUMPL.', type: 'calc', unit: '%', thresholds: [90, 70],
                    calcFn: t => t.pedidosObj > 0 ? (t.pedidosReal / t.pedidosObj) * 100 : 0
                },
                { key: 'ingresosObj', label: '€\nINGRESOS\nOBJ.', type: 'avg', unit: 'EUR' },
                { key: 'ingresosReal', label: '€\nINGRESOS\nREAL', type: 'sum', unit: 'EUR' },
                {
                    key: 'desviacion', label: '€\nDESVIACIÓN', type: 'calc', unit: 'EUR',
                    calcFn: t => (t.ingresosReal || 0) - (t.ingresosObj || 0)
                },
                { key: 'beneficioObj', label: '€\nBENEFICIO\nOBJ.', type: 'avg', unit: 'EUR' },
                {
                    key: 'beneficioReal', label: '€\nBENEFICIO\nREAL', type: 'sum', unit: 'EUR',
                    thresholds: [0.01, 0]
                },
                { key: 'gastoAdsObj', label: '€\nADS\nOBJ.', type: 'avg', unit: 'EUR' },
                { key: 'gastoAdsReal', label: '€\nADS\nREAL', type: 'sum', unit: 'EUR' },
                { key: 'roasObj', label: 'x\nROAS\nOBJ.', type: 'avg', unit: 'x', thresholds: [2.5, 1.5] },
                {
                    key: 'roasReal', label: 'x\nROAS\nREAL', type: 'calc', unit: 'x', thresholds: [2.5, 1.5],
                    calcFn: t => t.gastoAdsReal > 0 ? t.ingresosReal / t.gastoAdsReal : 0
                },
            ];
        }

        return [periodCol];
    }, [activeTab, viewMode, apiServices]);
}

// ─── KPI Cards ────────────────────────────────────────────────────────────────

function KpiCard({
    label, value, color = '#0f9e6b', sub, onEditAlert
}: {
    label: string; value: string; color?: string;
    sub?: string; onEditAlert?: () => void;
}) {
    return (
        <div style={{
            background: 'white',
            border: '1px solid #e2e8f0',
            borderLeft: `3px solid ${color}`,
            borderRadius: '6px',
            padding: '5px 8px',
            display: 'flex', flexDirection: 'column', gap: '0px',
            position: 'relative', flex: '1 1 0', minWidth: 0,
        }}>
            {onEditAlert && (
                <button
                    onClick={onEditAlert}
                    title="Configurar alerta"
                    style={{
                        position: 'absolute', top: '3px', right: '3px',
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: '#94a3b8', fontSize: '8px', padding: '1px', lineHeight: 1,
                    }}
                >✏</button>
            )}
            <p style={{
                fontSize: '7px', fontWeight: 800, color: '#334155',
                textTransform: 'uppercase', letterSpacing: '0.06em',
                margin: 0, lineHeight: 1.3, paddingRight: '10px',
            }}>{label}</p>
            <p style={{
                fontSize: '16px', fontWeight: 900, color: '#0f172a',
                margin: 0, lineHeight: 1.1, letterSpacing: '-0.5px',
                fontFamily: 'var(--mono)',
            }}>{value}</p>
            {sub && (
                <p style={{ fontSize: '7px', color: '#475569', margin: 0, lineHeight: 1.2 }}>{sub}</p>
            )}
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

    const [configOpen, setConfigOpen] = useState(false);
    const [alertThresholds, setAlertThresholds] = useState<Record<string, {
        green: number; yellow: number; lowerIsBetter: boolean; enabled: boolean;
    }>>({});
    const [kpiOrder, setKpiOrder] = useState<string[]>(ALL_KPIS.map(k => k.key));
    const [kpiEnabled, setKpiEnabled] = useState<Record<string, boolean>>(
        Object.fromEntries(ALL_KPIS.map(k => [k.key, true]))
    );

    const [apiServices, setApiServices] = useState<ApiService[]>([]);

    const columns = useColumns(activeTab, viewMode, apiServices);

    // Fetch alerts/KPIs config
    useEffect(() => {
        if (!activeStoreId) return;
        fetch(`/api/finanzas/alert-config?storeId=${activeStoreId}`)
            .then(res => res.json())
            .then(d => {
                if (d.success || d.ok) {
                    const config = d.data || d;
                    if (config.alertThresholds) setAlertThresholds(config.alertThresholds);
                    if (config.kpisVisibles) {
                        setKpiOrder(config.kpisVisibles);
                        const enabled: Record<string, boolean> = {};
                        config.kpisVisibles.forEach((k: string) => enabled[k] = true);
                        setKpiEnabled(enabled);
                    }
                }
            })
            .catch(() => { });
    }, [activeStoreId]);

    // Fetch API services
    useEffect(() => {
        if (!activeStoreId) return;
        fetch(`/api/finanzas/api-services?storeId=${activeStoreId}`)
            .then(res => res.json())
            .then(d => {
                if (d.ok || d.success) setApiServices(d.services || []);
            })
            .catch(() => { });
    }, [activeStoreId]);

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

    // Compute totals with aggregation rules
    const tableTotals = useMemo(() => {
        // 1. Get raw sums for ALL fields (even if not in columns) to allow recalc
        const allFields = Array.from(new Set(tableData.flatMap(r => Object.keys(r))));
        const rawSums: any = {};
        allFields.forEach(f => {
            if (f === 'label' || f === 'key') return;
            const valid = tableData.filter(r => typeof (r as any)[f] === 'number');
            rawSums[f] = valid.reduce((acc, r) => acc + ((r as any)[f] || 0), 0);
        });

        // 2. Build final totals for columns
        const t: any = {};
        columns.forEach(col => {
            if (col.key === 'label') return;
            if (col.type === 'calc' && col.calcFn) {
                // RECALC rule: use raw sums for calculations
                t[col.key] = col.calcFn(rawSums);
            } else if (col.type === 'avg') {
                const valid = tableData.filter(r => typeof (r as any)[col.key] === 'number');
                t[col.key] = valid.length ? rawSums[col.key] / valid.length : 0;
            } else {
                // SUM rule: use raw sums
                t[col.key] = rawSums[col.key] || 0;
            }
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

                {/* Period toggle + semáforo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                        onClick={() => setConfigOpen(true)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '5px',
                            padding: '3px 10px', borderRadius: '6px',
                            background: '#f8fafc', border: '1px solid #e2e8f0',
                            fontSize: '9px', fontWeight: 700, color: '#334155',
                            cursor: 'pointer',
                        }}
                    >
                        ⚙ Configurar alertas y KPIs
                    </button>
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

                    {/* ── KPI Cards ── */}
                    <div style={{
                        display: 'flex',
                        gap: '4px',
                        marginBottom: '4px',
                        flexWrap: 'nowrap',
                        overflowX: 'auto',
                    }}>
                        {kpiOrder.filter(k => kpiEnabled[k]).map(key => {
                            let val: number | string = 0;
                            let unit: 'EUR' | '%' | 'x' | undefined;
                            let color = '#0f9e6b';
                            let sub: string | undefined;

                            if (key === 'ingresosBrutos') { val = kpiIngresos; unit = 'EUR'; color = '#0f9e6b'; }
                            else if (key === 'beneficioNeto') { val = kpiBeneficio; unit = 'EUR'; color = kpiBeneficio > 0 ? '#0f9e6b' : '#ef4444'; }
                            else if (key === 'margenNeto') { val = kpiMargen; unit = '%'; color = kpiMargen >= 25 ? '#0f9e6b' : kpiMargen >= 15 ? '#eab308' : '#ef4444'; }
                            else if (key === 'gastosTotal') { val = kpiGastos; unit = 'EUR'; color = '#f59e0b'; }
                            else if (key === 'inversionAds') { val = kpiAds; unit = 'EUR'; color = '#7c3aed'; }
                            else if (key === 'roasReal') { val = kpiRoas; unit = 'x'; color = kpiRoas >= 2.5 ? '#0f9e6b' : kpiRoas >= 1.5 ? '#eab308' : '#ef4444'; }
                            else if (key === 'cpaReal') { val = tableTotals.cpaReal || 0; unit = 'EUR'; color = '#0f9e6b'; }
                            else if (key === 'ivaNeto') { val = kpiIvaNeto; unit = 'EUR'; color = kpiIvaNeto > 0 ? '#ef4444' : '#0f9e6b'; sub = kpiIvaNeto > 0 ? 'a pagar' : 'a favor'; }
                            else if (key === 'profitBruto') { val = tableTotals.beneficioBruto || 0; unit = 'EUR'; color = '#0f9e6b'; }
                            else if (key === 'pedidosTotal') { val = tableTotals.pedidosConfirmados || tableTotals.pedidosReal || 0; unit = undefined; color = '#0f9e6b'; }
                            else if (key === 'tasaEntrega') { val = tableTotals.tasaEntregaReal || 0; unit = '%'; color = '#0f9e6b'; }
                            else if (key === 'tasaEnvio') { val = tableTotals.tasaEnvioReal || 0; unit = '%'; color = '#0f9e6b'; }

                            // Check alerts
                            const alertConf = alertThresholds[key];
                            if (alertConf && alertConf.enabled) {
                                if (alertConf.lowerIsBetter) {
                                    if (Number(val) <= alertConf.green) color = '#22c55e';
                                    else if (Number(val) <= alertConf.yellow) color = '#eab308';
                                    else color = '#ef4444';
                                } else {
                                    if (Number(val) >= alertConf.green) color = '#22c55e';
                                    else if (Number(val) >= alertConf.yellow) color = '#eab308';
                                    else color = '#ef4444';
                                }
                            }

                            return (
                                <KpiCard
                                    key={key}
                                    label={ALL_KPIS.find(k => k.key === key)?.label || key}
                                    value={unit === 'x' ? Number(val).toFixed(2) + 'x' : fmt(Number(val), unit)}
                                    color={color}
                                    sub={sub}
                                    onEditAlert={() => {
                                        // Focus or something - optional
                                    }}
                                />
                            );
                        })}
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
                        {activeTab === 'calculadoras' ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '16px', padding: '4px' }}>
                                <CalcROAS />
                                <CalcCPV />
                                <CalcCPA />
                                <CalcEscalado />
                            </div>
                        ) : activeTab === 'proyecciones' ? (
                            <ProyeccionesTab storeId={activeStoreId} activeStoreId={activeStoreId} tableTotals={tableTotals} />
                        ) : activeTab === 'gastos' ? (
                            <GastosFijosTab storeId={activeStoreId} />
                        ) : loading ? (
                            <div className="min-h-[150px] flex items-center justify-center text-[10px] text-[var(--text-muted)] uppercase tracking-widest">
                                <Loader2 className="w-4 h-4 animate-spin mr-2 text-[var(--mkt)]" /> Procesando datos...
                            </div>
                        ) : (
                            <FinTable rows={tableData} columns={columns} totals={tableTotals} alertThresholds={alertThresholds} />
                        )}
                    </div>

                </div>
            )}



            {/* Drawer Izquierdo - Configuración */}
            {configOpen && (
                <div style={{
                    position: 'fixed', left: 0, top: 0, bottom: 0, width: '400px',
                    background: 'white', borderRight: '1px solid #e2e8f0',
                    boxShadow: '4px 0 24px rgba(0,0,0,0.08)',
                    zIndex: 200, display: 'flex', flexDirection: 'column',
                }}>
                    <div style={{
                        padding: '14px 16px', borderBottom: '1px solid #e2e8f0',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                        <p style={{ fontSize: '13px', fontWeight: 900, margin: 0, color: '#0f172a' }}>⚙ Configurar KPIs y Alertas</p>
                        <button onClick={() => setConfigOpen(false)}
                            style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#475569', fontSize: '16px' }}>✕</button>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                        {/* SECCIÓN 1 — KPIs visibles en cards */}
                        <div style={{ marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '11px', fontWeight: 800, color: '#0f172a', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                KPIs Visibles
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {ALL_KPIS.map((kpi, index) => (
                                    <div key={kpi.key}
                                        draggable
                                        onDragStart={e => e.dataTransfer.setData('text/plain', index.toString())}
                                        onDragOver={e => e.preventDefault()}
                                        onDrop={e => {
                                            e.preventDefault();
                                            const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                                            if (isNaN(fromIndex)) return;
                                            const newOrder = [...kpiOrder];
                                            const item = newOrder.splice(fromIndex, 1)[0];
                                            newOrder.splice(index, 0, item);
                                            setKpiOrder(newOrder);
                                        }}
                                        style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '8px 12px', background: '#f8fafc', borderRadius: '8px',
                                            border: '1px solid #e2e8f0', cursor: 'grab'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ color: '#94a3b8', fontSize: '12px' }}>⋮⋮</span>
                                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#334155' }}>{kpi.label}</span>
                                        </div>
                                        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={kpiEnabled[kpi.key] ?? true}
                                                onChange={e => setKpiEnabled(prev => ({ ...prev, [kpi.key]: e.target.checked }))}
                                                style={{ cursor: 'pointer' }}
                                            />
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* SECCIÓN 2 — Umbrales de alerta por columna */}
                        <div>
                            <h3 style={{ fontSize: '11px', fontWeight: 800, color: '#0f172a', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                Umbrales de Alerta
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {ALERTABLE_COLUMNS.map(col => {
                                    const config = alertThresholds[col.key] ?? {
                                        enabled: false,
                                        green: col.defaultGreen,
                                        yellow: col.defaultYellow,
                                        lowerIsBetter: col.lowerIsBetter,
                                    };

                                    return (
                                        <div key={col.key} style={{
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '8px',
                                            padding: '10px 12px',
                                            background: config.enabled ? '#fafbff' : 'white',
                                            opacity: config.enabled ? 1 : 0.6,
                                            marginBottom: '6px',
                                        }}>
                                            {/* Fila superior: checkbox nombre + toggle menor es mejor */}
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: config.enabled ? '8px' : '0' }}>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={config.enabled}
                                                        onChange={e => setAlertThresholds(prev => ({
                                                            ...prev,
                                                            [col.key]: { ...config, enabled: e.target.checked }
                                                        }))}
                                                    />
                                                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#0f172a' }}>{col.label}</span>
                                                </label>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={config.lowerIsBetter}
                                                        onChange={e => setAlertThresholds(prev => ({
                                                            ...prev,
                                                            [col.key]: { ...config, lowerIsBetter: e.target.checked }
                                                        }))}
                                                    />
                                                    <span style={{ fontSize: '9px', color: '#475569', fontWeight: 600 }}>Menor es mejor</span>
                                                </label>
                                            </div>

                                            {/* Inputs de umbrales — solo visibles si está activado */}
                                            {config.enabled && (
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                                    {/* Umbral verde */}
                                                    <div>
                                                        <label style={{
                                                            fontSize: '8px', fontWeight: 800, color: '#16a34a',
                                                            display: 'flex', alignItems: 'center', gap: '4px',
                                                            marginBottom: '3px', textTransform: 'uppercase'
                                                        }}>
                                                            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                                                            Verde {config.lowerIsBetter ? '≤' : '≥'} {col.unit}
                                                        </label>
                                                        <input
                                                            type="number"
                                                            value={config.green}
                                                            onChange={e => setAlertThresholds(prev => ({
                                                                ...prev,
                                                                [col.key]: { ...config, green: Number(e.target.value) }
                                                            }))}
                                                            style={{
                                                                width: '100%', padding: '5px 8px', borderRadius: '6px',
                                                                border: '1px solid #bbf7d0', background: 'rgba(34,197,94,0.05)',
                                                                fontSize: '12px', fontWeight: 800, color: '#16a34a',
                                                                textAlign: 'right', outline: 'none',
                                                            }}
                                                        />
                                                    </div>
                                                    {/* Umbral amarillo */}
                                                    <div>
                                                        <label style={{
                                                            fontSize: '8px', fontWeight: 800, color: '#d97706',
                                                            display: 'flex', alignItems: 'center', gap: '4px',
                                                            marginBottom: '3px', textTransform: 'uppercase'
                                                        }}>
                                                            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#eab308', display: 'inline-block' }} />
                                                            Amarillo {config.lowerIsBetter ? '≤' : '≥'} {col.unit}
                                                        </label>
                                                        <input
                                                            type="number"
                                                            value={config.yellow}
                                                            onChange={e => setAlertThresholds(prev => ({
                                                                ...prev,
                                                                [col.key]: { ...config, yellow: Number(e.target.value) }
                                                            }))}
                                                            style={{
                                                                width: '100%', padding: '5px 8px', borderRadius: '6px',
                                                                border: '1px solid #fde68a', background: 'rgba(234,179,8,0.05)',
                                                                fontSize: '12px', fontWeight: 800, color: '#d97706',
                                                                textAlign: 'right', outline: 'none',
                                                            }}
                                                        />
                                                    </div>
                                                    {/* Preview del semáforo con los umbrales actuales */}
                                                    <div style={{
                                                        gridColumn: '1 / -1',
                                                        fontSize: '8px', color: '#475569',
                                                        display: 'flex', gap: '8px', alignItems: 'center',
                                                        padding: '4px 0',
                                                    }}>
                                                        <span>Preview:</span>
                                                        <span style={{ color: '#16a34a', fontWeight: 700 }}>
                                                            🟢 {config.lowerIsBetter ? `≤ ${config.green}` : `≥ ${config.green}`}{col.unit}
                                                        </span>
                                                        <span style={{ color: '#d97706', fontWeight: 700 }}>
                                                            🟡 {config.lowerIsBetter
                                                                ? `${config.green} – ${config.yellow}`
                                                                : `${config.yellow} – ${config.green}`}{col.unit}
                                                        </span>
                                                        <span style={{ color: '#dc2626', fontWeight: 700 }}>
                                                            🔴 {config.lowerIsBetter ? `> ${config.yellow}` : `< ${config.yellow}`}{col.unit}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div style={{ padding: '16px', borderTop: '1px solid #e2e8f0', background: 'white' }}>
                        <button
                            onClick={() => {
                                const kpisVisibles = kpiOrder.filter(k => kpiEnabled[k]);
                                fetch('/api/finanzas/alert-config', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ storeId: activeStoreId, alertThresholds, kpisVisibles })
                                }).catch(console.error);
                                setConfigOpen(false);
                            }}
                            style={{
                                width: '100%', padding: '10px', borderRadius: '8px',
                                background: '#1e293b', color: 'white', border: 'none',
                                fontSize: '12px', fontWeight: 800, cursor: 'pointer'
                            }}
                        >Guardar Configuración</button>
                    </div>
                </div>
            )}

            <AgentButton
                agentId='FINANZAS'
                moduleColor='#10B981'
                moduleName='Finanzas'
                contextSnapshot={() => ({
                    totals: tableTotals,
                    activeTab,
                    selectedMonth,
                    selectedYear
                })}
            />

        </div>
    );
}
