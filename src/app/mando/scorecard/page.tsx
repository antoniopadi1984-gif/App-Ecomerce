'use client';

import { AgentPanel } from "@/components/AgentPanel";
import React, { useState, useEffect } from 'react';
import { useStore } from '@/lib/store/store-context';
import { RefreshCw, Loader2, ChevronDown, ChevronRight, Zap, Pencil, X, TrendingUp, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getWeeksInMonth, getWeekRanges } from '@/lib/weekUtils';
import { getStatus, getObjPct, getProjection, getNeededPerWeek, isOnTrack, getVariation, formatValue, METRICS_WITH_TARGET, TARGET_FIELD_MAP } from '@/lib/scorecardUtils';

interface DataCellProps { value: number; unit: string; status: "green" | "yellow" | "red" | "neutral"; variation: number | null; isBest: boolean; key?: string | number; }
interface AccumCellProps { value: number; unit: string; status: "green" | "yellow" | "red" | "neutral"; }
interface ProyCellProps { projection: number; target: number | null; unit: string; }
interface NeededCellProps { needed: number | null; onTrack: boolean; achieved: boolean; unit: string; }
interface FaltanCellProps { acum: number; target: number | null; unit: string; }
interface TargetCellProps { target: number | null; unit: string; hasTarget: boolean; onEdit: () => void; }

const SCORECARD_METRICS = [
    // 🛒 VENTAS Y PEDIDOS
    { id: "facturacion", label: "Facturación", unit: "EUR", group: "ventas", hasTarget: true },
    { id: "pedidos", label: "Pedidos", unit: "", group: "ventas", hasTarget: true },
    { id: "ticket_medio", label: "Ticket Medio", unit: "EUR", group: "ventas", hasTarget: false },

    // 📈 MARKETING (META)
    { id: "inversion", label: "Inversión", unit: "EUR", group: "marketing", hasTarget: false },
    { id: "roas", label: "ROAS", unit: "x", group: "marketing", hasTarget: true },
    { id: "cpa", label: "CPA", unit: "EUR", group: "marketing", hasTarget: true },
    { id: "coste_visita", label: "Coste Visita", unit: "EUR", group: "marketing", hasTarget: false },
    { id: "roi", label: "ROI", unit: "%", group: "marketing", hasTarget: false },
    { id: "tasa_conversion", label: "Tasa Conversión", unit: "%", group: "marketing", hasTarget: false },

    // 🎨 GESTIÓN DE CREATIVOS
    { id: "lanzados", label: "Lanzados", unit: "", group: "creativos", hasTarget: false },
    { id: "ganadores", label: "Ganadores (ROAS>2)", unit: "", group: "creativos", hasTarget: false },
    { id: "ratio_acierto", label: "Ratio Acierto", unit: "%", group: "creativos", hasTarget: true },

    // 📦 LOGÍSTICA Y COD
    { id: "entregados", label: "Entregados", unit: "", group: "logistica", hasTarget: false },
    { id: "enviados", label: "Enviados", unit: "", group: "logistica", hasTarget: false },
    { id: "tasa_envio", label: "Tasa Envío", unit: "%", group: "logistica", hasTarget: true },
    { id: "tasa_entrega", label: "Tasa Entrega", unit: "%", group: "logistica", hasTarget: true },
    { id: "tasa_rebote", label: "Tasa Rebote", unit: "%", group: "logistica", hasTarget: false },
    { id: "devoluciones", label: "Devoluciones", unit: "", group: "logistica", hasTarget: false },
    { id: "coste_envio", label: "Coste Envío Medio", unit: "EUR", group: "logistica", hasTarget: false },

    // 💰 ECONOMÍA Y P&L
    { id: "cogs", label: "COGS (Producto)", unit: "EUR", group: "economia", hasTarget: false },
    { id: "shipping_total", label: "Shipping Total", unit: "EUR", group: "economia", hasTarget: false },
    { id: "beneficio_neto", label: "Beneficio Neto", unit: "EUR", group: "economia", hasTarget: false },
    { id: "margen", label: "Margen (%)", unit: "%", group: "economia", hasTarget: false },
]

function DataCell({ value, unit, status, variation, isBest }: DataCellProps) {
    const styles = {
        green: { bg: "rgba(34,197,94,0.13)", color: "#166534", dotBg: "#22c55e" },
        yellow: { bg: "rgba(234,179,8,0.15)", color: "#92400e", dotBg: "#eab308" },
        red: { bg: "#ef4444", color: "#ffffff", dotBg: "#ffffff" },
        neutral: { bg: "transparent", color: "#1e293b", dotBg: "var(--text-dim)" }
    }[status];

    return (
        <td style={{ borderBottom: "1px solid rgba(0,0,0,0.04)", background: isBest && status === "neutral" ? "rgba(234,179,8,0.08)" : styles.bg }}>
            <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "3px"
            }}>
                <span style={{
                    width: "5px", height: "5px",
                    borderRadius: "50%",
                    background: styles.dotBg,
                    flexShrink: 0
                }} />
                <span style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: styles.color,
                    whiteSpace: "nowrap"
                }}>
                    {formatValue(value, unit)}
                </span>
                {isBest && <span style={{ fontSize: "8px", color: "#eab308", marginLeft: "2px" }}>★</span>}
            </div>
            {variation !== null && (
                <div style={{
                    fontSize: "9px",
                    fontWeight: 700,
                    color: status === "red" ? "rgba(255,255,255,0.8)" : variation >= 0 ? "#22c55e" : "#ef4444",
                    lineHeight: 1,
                    marginTop: "1px"
                }}>
                    {variation >= 0 ? "↑" : "↓"} {Math.abs(variation)}%
                </div>
            )}
        </td>
    )
}

function AccumCell({ value, unit, status }: AccumCellProps) {
    const textColor = status === "red" ? "#ffffff" : status === "green" ? "#4c1d95" : status === "yellow" ? "#4c1d95" : "#6d28d9";
    const bg = status === "red" ? "#7c3aed" : status === "green" ? "#ede9fe" : status === "yellow" ? "#ede9fe" : "#f5f3ff";

    return (
        <td style={{ padding: "0", background: bg, borderBottom: "1px solid #ede9fe" }}>
            <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "3px"
            }}>
                <span style={{
                    width: "5px", height: "5px",
                    borderRadius: "50%",
                    background: textColor === "#ffffff" ? "rgba(255,255,255,0.6)" : "#a78bfa",
                    flexShrink: 0
                }} />
                <span style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: textColor,
                    whiteSpace: "nowrap"
                }}>
                    {formatValue(value, unit)}
                </span>
            </div>
        </td>
    )
}

function ObjPctCell({ objPct }: { objPct: number | null }) {
    if (objPct === null) return <td style={{ textAlign: "center", background: "transparent", borderBottom: "1px solid #f1f5f9" }}><span style={{ color: "#e2e8f0", fontSize: "12px" }}>—</span></td>

    const bg = objPct >= 90 ? "rgba(34,197,94,0.1)" : objPct >= 70 ? "rgba(234,179,8,0.1)" : "rgba(239,68,68,0.1)";
    const color = objPct >= 90 ? "#166534" : objPct >= 70 ? "#92400e" : "#ffffff";
    const bgSolid = objPct < 70 ? "#ef4444" : bg;

    return (
        <td style={{ padding: "0", background: bgSolid, borderBottom: "1px solid #f1f5f9" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", padding: "5px 4px" }}>
                <span style={{ fontSize: "11px", fontWeight: 900, color: objPct < 70 ? "#ffffff" : color }}>
                    {objPct}%
                </span>
            </div>
        </td>
    )
}

function ProyCell({ projection, target, unit }: ProyCellProps) {
    if (!projection) return <td style={{ textAlign: "center", padding: "5px 12px", color: "#e2e8f0", fontSize: "12px", borderBottom: "1px solid #f1f5f9" }}>—</td>

    const meetsTarget = target && projection >= target;

    return (
        <td style={{ padding: "5px 12px", textAlign: "center", borderBottom: "1px solid #f1f5f9" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "3px" }}>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#6366f1", whiteSpace: "nowrap" }}>
                    {formatValue(projection, unit)}
                </span>
                {target && (
                    <span style={{ fontSize: "10px" }}>
                        {meetsTarget ? "✓" : "✗"}
                    </span>
                )}
            </div>
        </td>
    )
}

function NeededCell({ needed, onTrack, achieved, unit }: NeededCellProps) {
    if (needed === null) return <td style={{ textAlign: "right", padding: "5px 12px", color: "#e2e8f0", fontSize: "12px", borderBottom: "1px solid #f1f5f9" }}>—</td>

    if (achieved) return (
        <td style={{ padding: "0", background: "rgba(34,197,94,0.1)", borderBottom: "1px solid #f1f5f9" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", padding: "5px 12px" }}>
                <span style={{ fontSize: "11px", fontWeight: 900, color: "#166534" }}>✓ Logrado</span>
            </div>
        </td>
    )

    return (
        <td style={{ padding: "0", background: onTrack ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)", borderBottom: "1px solid #f1f5f9" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", padding: "5px 12px" }}>
                <span style={{ fontSize: "12px", fontWeight: 700, color: onTrack ? "#166534" : "#ef4444", whiteSpace: "nowrap" }}>
                    {formatValue(needed, unit)}
                </span>
            </div>
        </td>
    )
}

function FaltanCell({ acum, target, unit }: FaltanCellProps) {
    if (!target) return <td style={{ textAlign: "center", padding: "5px 12px", color: "#e2e8f0", fontSize: "12px", borderBottom: "1px solid #f1f5f9" }}>—</td>

    const diff = target - acum;
    const achieved = diff <= 0;

    return (
        <td style={{ padding: "5px 12px", textAlign: "center", borderBottom: "1px solid #f1f5f9" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: achieved ? "#166534" : "#ef4444", whiteSpace: "nowrap" }}>
                {achieved ? "✓" : `-${formatValue(diff, unit)}`}
            </span>
        </td>
    )
}

interface TargetCellProps { target: number | null; unit: string; hasTarget: boolean; onEdit: () => void; isHovered: boolean; }

function TargetCell({ target, unit, hasTarget, onEdit }: TargetCellProps) {
    return (
        <td style={{ borderBottom: "1px solid #f1f5f9" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                {target ? (
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#334155" }}>
                        {formatValue(target, unit)}
                    </span>
                ) : null}

                {hasTarget && (
                    <button
                        onClick={onEdit}
                        style={{
                            background: target ? "none" : "#f5f3ff",
                            border: target ? "none" : "1px dashed #c4b5fd",
                            borderRadius: "4px",
                            cursor: "pointer",
                            color: "#7c3aed",
                            width: "18px",
                            height: "18px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "9px",
                            flexShrink: 0,
                            padding: 0
                        }}
                    >
                        ✏️
                    </button>
                )}

                {!hasTarget && (
                    <span style={{ color: "#e2e8f0", fontSize: "12px" }}>—</span>
                )}
            </div>
        </td>
    )
}

function CategoryRow({ label, colSpan }: { label: string, colSpan: number }) {
    return (
        <tr style={{ background: "#f1f5f9", borderTop: "2px solid var(--text-dim)", borderBottom: "1px solid var(--text-dim)" }}>
            <td colSpan={colSpan} style={{ padding: "10px 12px", fontSize: "12px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", color: "#334155" }}>
                {label}
            </td>
        </tr>
    )
}

export default function ScorecardPage() {
    const { activeStoreId: storeId } = useStore();
    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [modalData, setModalData] = useState<{ active: boolean; propId: string; label: string; unit: string; currentTarget: number | null; acumValue: number } | null>(null);
    const [inputValue, setInputValue] = useState<number>(0);
    const [hoveredRow, setHoveredRow] = useState<string | null>(null);

    const MONTH_NAMES = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    const loadData = () => {
        if (!storeId) return;
        setLoading(true);
        fetch(`/api/mando/scorecard?storeId=${storeId}&month=${month}&year=${year}`)
            .then(r => r.json())
            .then(d => {
                if (d.ok) setData(d);
                setLoading(false);
            });
    };

    useEffect(() => { loadData(); }, [storeId, month, year]);

    if (!storeId) return null;
    if (loading && !data) return (
        <div className="p-8 flex flex-col items-center justify-center text-center text-[11px] text-slate-500 font-bold ds-card">
            <Loader2 className="w-8 h-8 animate-spin mb-3 text-indigo-600" />
            Preparando Scorecard Mensual...
        </div>
    );
    if (!data) return <div className="p-8 text-center text-[11px] font-bold text-rose-600 ds-card">Sin datos de scorecard</div>;

    const w = data.weeks || [];
    const totalWeeks = getWeeksInMonth(month, year);
    const weeksRanges = getWeekRanges(month, year);
    const weeksArray = weeksRanges.map(r => r);
    const currentWeekInfo = Math.min(totalWeeks, Math.max(0, w.length));
    const weeksRemainingModal = totalWeeks - currentWeekInfo;

    const a = data.accumulated || {};
    const g = data.goal || {};
    const isCOD = data.store?.isCOD;

    const handleSaveGoal = () => {
        if (!modalData || !inputValue) return;

        setLoading(true);
        const mappedField = TARGET_FIELD_MAP[modalData.propId] || modalData.propId;

        fetch('/api/mando/scorecard', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                storeId,
                month,
                year,
                field: mappedField,
                value: inputValue
            }),
        })
            .then(r => r.json())
            .then(d => {
                setLoading(false);
                if (d.ok) {
                    setData((prev: any) => ({
                        ...prev,
                        goal: {
                            ...(prev.goal || {}),
                            [mappedField]: inputValue
                        }
                    }));
                    setModalData(null);
                } else {
                    alert("Error: " + (d.error || "No se pudo guardar el objetivo"));
                }
            })
            .catch(err => {
                console.error(err);
                alert("Error de conexión al guardar");
                setLoading(false);
            });
    };

    const handleDeleteGoal = () => {
        if (!modalData) return;
        setLoading(true);
        const mappedField = TARGET_FIELD_MAP[modalData.propId] || modalData.propId;

        fetch('/api/mando/scorecard', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                storeId,
                month,
                year,
                field: mappedField,
                value: null
            }),
        }).then(r => r.json())
            .then(d => {
                setLoading(false);
                if (d.ok) {
                    setData((prev: any) => {
                        const newGoal = { ...(prev.goal || {}) };
                        delete newGoal[mappedField];
                        return { ...prev, goal: newGoal };
                    });
                    setModalData(null);
                } else {
                    alert("Error al eliminar: " + (d.error || "No se pudo eliminar"));
                }
            }).catch(err => {
                console.error(err);
                setLoading(false);
            });
    };

    const RowInfo = ({ label, propId, unit }: { key?: string; label: string; propId: string; unit: string }) => {
        const hasTarget = SCORECARD_METRICS.find(m => m.id === propId)?.hasTarget || false;

        // Setup data arrays
        const weeklyValues = Array.from({ length: totalWeeks }).map((_, idx) => (w[idx] || {})[propId] || 0);
        const bestWeekValue = Math.max(...weeklyValues.filter(v => v !== null && v !== undefined && !isNaN(v) && v > 0));

        const acumValue = a[propId] || 0;
        const mappedField = TARGET_FIELD_MAP[propId] || propId;
        const targetValue = g[mappedField] ?? g[propId] ?? null;
        const projection = getProjection(weeklyValues, currentWeekInfo, totalWeeks);
        const objPct = getObjPct(acumValue, targetValue);
        const neededPerWeek = getNeededPerWeek(acumValue, targetValue, currentWeekInfo, totalWeeks);
        const diffToTarget = targetValue !== null ? targetValue - acumValue : null;
        const achieved = diffToTarget !== null && diffToTarget <= 0;
        const trackState = isOnTrack(acumValue, targetValue, currentWeekInfo, totalWeeks);

        return (
            <tr
                onMouseEnter={() => setHoveredRow(propId)}
                onMouseLeave={() => setHoveredRow(null)}
                style={{ borderBottom: "1px solid #f1f5f9", background: hoveredRow === propId ? "#fafbff" : "white" }}
            >
                <td style={{ padding: "5px 12px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "#334155", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {label}
                </td>
                {weeksArray.map((_, i) => {
                    const val = weeklyValues[i] || 0;
                    const prevVal = i > 0 ? weeklyValues[i - 1] : 0;
                    const status = getStatus(val, targetValue ? targetValue / 4 : 0, propId);
                    const isBest = val > 0 && val === bestWeekValue;
                    const variation = getVariation(val, prevVal);

                    return <DataCell key={i} value={val} unit={unit} status={status} variation={variation} isBest={isBest} />
                })}

                <AccumCell value={acumValue} unit={unit} status={getStatus(acumValue, targetValue, propId)} />
                <td style={{ textAlign: "center" }}>
                    <ObjPctCell objPct={objPct} />
                </td>
                <ProyCell projection={projection} target={targetValue} unit={unit} />
                <NeededCell needed={neededPerWeek} onTrack={trackState} achieved={achieved} unit={unit} />
                <FaltanCell acum={acumValue} target={targetValue} unit={unit} />
                <TargetCell target={targetValue} unit={unit} hasTarget={hasTarget} isHovered={hoveredRow === propId} onEdit={() => {
                    setInputValue(targetValue || 0);
                    setModalData({ active: true, propId, label, unit, currentTarget: targetValue, acumValue });
                }} />
            </tr>
        );
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", animation: "fade-in 0.3s ease-out" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "white", padding: "10px 16px", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                <h2 style={{ fontSize: "11px", fontWeight: 900, textTransform: "uppercase", color: "#4f46e5", letterSpacing: "0.08em", display: "flex", alignItems: "center", gap: "8px" }}>
                    Scorecard Mensual (Sem 1-{totalWeeks})
                </h2>
                <div style={{ display: "flex", gap: "8px" }}>
                    <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))} style={{ height: "32px", fontSize: "10px", border: "2px solid #e2e8f0", borderRadius: "12px", padding: "0 10px", background: "#f8fafc", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", outline: "none", color: "#1e293b" }}>
                        {MONTH_NAMES.map((name, i) => <option key={i + 1} value={i + 1}>{name}</option>)}
                    </select>
                    <select value={year} onChange={(e) => setYear(parseInt(e.target.value))} style={{ height: "32px", fontSize: "10px", border: "2px solid #e2e8f0", borderRadius: "12px", padding: "0 10px", background: "#f8fafc", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", outline: "none", color: "#1e293b" }}>
                        {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
            </div>

            <div style={{ overflowY: "auto", maxHeight: "calc(100vh - 160px)" }}>
                <table style={{ width: "100%", tableLayout: "fixed", borderCollapse: "collapse" }}>
                    <colgroup>
                        <col style={{ width: "15%" }} />   {/* VARIABLE */}
                        {weeksArray.map((_, i) => (
                            <col key={i} style={{ width: "7%" }} />
                        ))}
                        <col style={{ width: "8%" }} />  {/* ACUM */}
                        <col style={{ width: "5%" }} />    {/* OBJ % */}
                        <col style={{ width: "7%" }} />    {/* PROY. */}
                        <col style={{ width: "8%" }} />    {/* NEC./SEM */}
                        <col style={{ width: "7%" }} />    {/* FALTAN */}
                        <col style={{ width: "6%" }} />    {/* TARGET */}
                    </colgroup>
                    <thead>
                        <tr style={{ position: "sticky", top: 0, background: "white", zIndex: 10, borderBottom: "2px solid var(--text-dim)" }}>
                            <th style={{ textAlign: "left", padding: "10px 12px", fontSize: "12px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", color: "#334155", overflow: "hidden" }}>
                                Variable
                            </th>
                            {weeksArray.map((w, i) => (
                                <th key={i} title={w?.from ? `${w.from} - ${w.to}` : `Semana ${i + 1}`} style={{ textAlign: "right", padding: "10px 12px", fontSize: "12px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", color: "#334155" }}>
                                    Sem {i + 1}
                                </th>
                            ))}
                            <th style={{ textAlign: "right", padding: "10px 12px", fontSize: "12px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", color: "#7c3aed", background: "#f5f3ff" }}>
                                Acum
                            </th>
                            <th style={{ textAlign: "center", padding: "10px 4px", fontSize: "11px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.06em", color: "#334155" }}>
                                Obj %
                            </th>
                            <th style={{ textAlign: "right", padding: "10px 12px", fontSize: "11px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.06em", color: "#6366f1" }}>
                                Proy.
                            </th>
                            <th style={{ textAlign: "right", padding: "10px 12px", fontSize: "11px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.06em", color: "#334155" }}>
                                Nec./Sem
                            </th>
                            <th style={{ textAlign: "right", padding: "10px 12px", fontSize: "11px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.06em", color: "#334155" }}>
                                Faltan
                            </th>
                            <th style={{ textAlign: "right", padding: "10px 12px", fontSize: "11px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.06em", color: "#334155" }}>
                                Target
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* 🛒 VENTAS Y PEDIDOS */}
                        <CategoryRow label="🛒 Ventas y Pedidos" colSpan={totalWeeks + 7} />
                        {SCORECARD_METRICS.filter(m => m.group === 'ventas').map(m => (
                            <RowInfo key={m.id} label={m.label} propId={m.id} unit={m.unit} />
                        ))}

                        {/* 📈 MARKETING (META) */}
                        <CategoryRow label="📈 Marketing (Meta)" colSpan={totalWeeks + 7} />
                        {SCORECARD_METRICS.filter(m => m.group === 'marketing').map(m => (
                            <RowInfo key={m.id} label={m.label} propId={m.id} unit={m.unit} />
                        ))}

                        {/* 🎨 GESTIÓN DE CREATIVOS */}
                        <CategoryRow label="🎨 Gestión de Creativos" colSpan={totalWeeks + 7} />
                        {SCORECARD_METRICS.filter(m => m.group === 'creativos').map(m => (
                            <RowInfo key={m.id} label={m.label} propId={m.id} unit={m.unit} />
                        ))}

                        {/* 📦 LOGÍSTICA Y COD */}
                        <CategoryRow label="📦 Logística y COD" colSpan={totalWeeks + 7} />
                        {SCORECARD_METRICS.filter(m => m.group === 'logistica').map(m => (
                            <RowInfo key={m.id} label={m.label} propId={m.id} unit={m.unit} />
                        ))}

                        {/* 💰 ECONOMÍA Y P&L */}
                        <CategoryRow label="💰 Economía y P&L" colSpan={totalWeeks + 7} />
                        {SCORECARD_METRICS.filter(m => m.group === 'economia').map(m => (
                            <RowInfo key={m.id} label={m.label} propId={m.id} unit={m.unit} />
                        ))}
                    </tbody>
                </table>
            </div>

            {modalData && (
                <>
                    {/* Overlay */}
                    <div
                        onClick={() => setModalData(null)}
                        style={{
                            position: "fixed", inset: 0,
                            background: "rgba(15,23,42,0.4)",
                            zIndex: 50,
                            backdropFilter: "blur(2px)"
                        }}
                    />

                    {/* Modal compacto */}
                    <div style={{
                        position: "fixed",
                        top: "50%", left: "50%",
                        transform: "translate(-50%, -50%)",
                        zIndex: 51,
                        background: "white",
                        borderRadius: "16px",
                        padding: "20px",
                        width: "320px",
                        boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
                        border: "1px solid #e2e8f0"
                    }}>

                        {/* Header */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                            <div>
                                <p style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "2px" }}>
                                    Objetivo mensual
                                </p>
                                <h3 style={{ fontSize: "14px", fontWeight: 900, color: "#1e293b", margin: 0 }}>
                                    {modalData.label}
                                </h3>
                            </div>
                            <button
                                onClick={() => setModalData(null)}
                                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "18px", lineHeight: 1, padding: "2px" }}
                            >
                                ×
                            </button>
                        </div>

                        {/* Input compacto */}
                        <div style={{
                            display: "flex", alignItems: "center", gap: "8px",
                            background: "#f8fafc", borderRadius: "10px",
                            border: "2px solid #7c3aed", padding: "8px 12px",
                            marginBottom: "10px"
                        }}>
                            <input
                                type="number"
                                value={inputValue || ""}
                                onChange={e => setInputValue(Number(e.target.value))}
                                placeholder="0"
                                autoFocus
                                style={{
                                    flex: 1, background: "none", border: "none", outline: "none",
                                    fontSize: "20px", fontWeight: 800, color: "#1e293b",
                                    width: "100%"
                                }}
                            />
                            <span style={{ fontSize: "13px", fontWeight: 700, color: "#7c3aed" }}>
                                {modalData.unit === "EUR" ? "€" : modalData.unit}
                            </span>
                        </div>

                        {/* Preview ritmo necesario — solo si hay valor */}
                        {inputValue > 0 && weeksRemainingModal > 0 && (
                            <div style={{
                                background: "#f8fafc", borderRadius: "8px",
                                padding: "8px 10px", marginBottom: "10px",
                                fontSize: "11px", color: "#64748b", lineHeight: 1.5
                            }}>
                                Necesitas{" "}
                                <strong style={{ color: "#7c3aed" }}>
                                    {formatValue(
                                        Math.round((inputValue - modalData.acumValue) / weeksRemainingModal),
                                        modalData.unit
                                    )}
                                </strong>
                                {" "}/sem en {weeksRemainingModal} semanas restantes
                                <br />
                                <span style={{
                                    fontSize: "10px", fontWeight: 700,
                                    color: ((currentWeekInfo > 0 ? modalData.acumValue / currentWeekInfo : 0) >= ((inputValue - modalData.acumValue) / weeksRemainingModal)) ? "#22c55e" : "#ef4444"
                                }}>
                                    {((currentWeekInfo > 0 ? modalData.acumValue / currentWeekInfo : 0) >= ((inputValue - modalData.acumValue) / weeksRemainingModal)) ? "✓ Tu ritmo actual lo cubre" : "✗ Necesitas acelerar el ritmo"}
                                </span>
                            </div>
                        )}

                        {/* Sugerencia mes anterior (Placeholder if previous month not fetched, just use simple UI for now, logic can be added later if needed) Omitted as requested to keep UI minimal and match provided spec where prevMonthValue was shown */}

                        {/* Botones */}
                        <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                            <button
                                onClick={handleSaveGoal}
                                disabled={!inputValue || loading}
                                style={{
                                    flex: 1, background: inputValue ? "#7c3aed" : "#e2e8f0",
                                    color: inputValue ? "white" : "var(--text-dim)",
                                    border: "none", borderRadius: "10px",
                                    padding: "10px", fontWeight: 900,
                                    fontSize: "12px", cursor: inputValue ? "pointer" : "not-allowed",
                                    transition: "all 0.15s"
                                }}
                            >
                                {loading ? "Guardando..." : "Guardar objetivo"}
                            </button>

                            {modalData.currentTarget !== null && (
                                <button
                                    onClick={handleDeleteGoal}
                                    style={{
                                        background: "none", border: "1px solid #fca5a5",
                                        color: "#ef4444", borderRadius: "10px",
                                        padding: "10px 12px", fontWeight: 700,
                                        fontSize: "11px", cursor: "pointer"
                                    }}
                                >
                                    Eliminar
                                </button>
                            )}
                        </div>

                    </div>
                </>
            )}
        </div>
        <AgentPanel
        specialistRole="neural-mother"
        specialistLabel="Neural Mother"
        accentColor="#6366F1"
        storeId={storeId || activeStoreId || "store-main"}
        productId={productId}
        moduleContext={{}}
        specialistActions={[{"label": "Analizar semana", "prompt": "Analiza las métricas de esta semana y detecta el mayor problema"}, {"label": "¿Qué escalar?", "prompt": "¿Qué métricas están en verde y merece escalar presupuesto?"}, {"label": "Forecast mes", "prompt": "Proyecta el cierre de mes con los datos actuales"}]}
    />
    );
}
