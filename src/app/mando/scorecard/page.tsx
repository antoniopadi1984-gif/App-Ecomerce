'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/lib/store/store-context';
import { RefreshCw, Loader2, ChevronDown, ChevronRight, Zap, Pencil, X, TrendingUp, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getWeeksInMonth, getWeekRanges } from '@/lib/weekUtils';
import { getStatus, getObjPct, getProjection, getNeededPerWeek, isOnTrack, getVariation, formatValue, METRICS_WITH_TARGET, TARGET_FIELD_MAP } from '@/lib/scorecardUtils';

interface DataCellProps { value: number; unit: string; status: "green" | "yellow" | "red" | "neutral"; variation: number | null; isBest: boolean; }
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
        neutral: { bg: "transparent", color: "#1e293b", dotBg: "#cbd5e1" }
    }[status];

    return (
        <td style={{
            padding: "0",
            background: isBest && status === "neutral" ? "rgba(234,179,8,0.08)" : styles.bg,
            borderBottom: "1px solid rgba(0,0,0,0.04)",
            position: "relative"
        }}>
            <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                justifyContent: "center",
                padding: "5px 12px",
                height: "100%"
            }}>
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    justifyContent: "flex-end"
                }}>
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: styles.dotBg, flexShrink: 0 }} />
                    <span style={{ fontSize: "13px", fontWeight: 800, color: styles.color, whiteSpace: "nowrap" }}>
                        {formatValue(value, unit)}
                    </span>
                    {isBest && <span style={{ fontSize: "8px", color: "#eab308" }}>★</span>}
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
            </div>
        </td>
    )
}

function AccumCell({ value, unit, status }: AccumCellProps) {
    const textColor = status === "red" ? "#ffffff" : status === "green" ? "#4c1d95" : status === "yellow" ? "#4c1d95" : "#6d28d9";
    const bg = status === "red" ? "#7c3aed" : status === "green" ? "#ede9fe" : status === "yellow" ? "#ede9fe" : "#f5f3ff";

    return (
        <td style={{ padding: "0", background: bg, borderBottom: "1px solid #ede9fe" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "5px", padding: "5px 12px", height: "100%" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: textColor === "#ffffff" ? "rgba(255,255,255,0.6)" : "#a78bfa", flexShrink: 0 }} />
                <span style={{ fontSize: "13px", fontWeight: 900, color: textColor, whiteSpace: "nowrap" }}>
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
    if (!projection) return <td style={{ textAlign: "right", padding: "5px 12px", color: "#e2e8f0", fontSize: "12px", borderBottom: "1px solid #f1f5f9" }}>—</td>

    const meetsTarget = target && projection >= target;

    return (
        <td style={{ padding: "5px 12px", textAlign: "right", borderBottom: "1px solid #f1f5f9" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "3px" }}>
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
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", height: "100%", padding: "5px 12px" }}>
                <span style={{ fontSize: "12px", fontWeight: 800, color: onTrack ? "#166534" : "#ef4444", whiteSpace: "nowrap" }}>
                    {formatValue(needed, unit)}
                </span>
            </div>
        </td>
    )
}

function FaltanCell({ acum, target, unit }: FaltanCellProps) {
    if (!target) return <td style={{ textAlign: "right", padding: "5px 12px", color: "#e2e8f0", fontSize: "12px", borderBottom: "1px solid #f1f5f9" }}>—</td>

    const diff = target - acum;
    const achieved = diff <= 0;

    return (
        <td style={{ padding: "5px 12px", textAlign: "right", borderBottom: "1px solid #f1f5f9" }}>
            <span style={{ fontSize: "12px", fontWeight: 800, color: achieved ? "#166534" : "#ef4444", whiteSpace: "nowrap" }}>
                {achieved ? "✓" : `-${formatValue(diff, unit)}`}
            </span>
        </td>
    )
}

function TargetCell({ target, unit, hasTarget, onEdit }: TargetCellProps) {
    if (!hasTarget) return (
        <td style={{ textAlign: "right", padding: "5px 10px", color: "#e2e8f0", fontSize: "12px", borderBottom: "1px solid #f1f5f9" }}>
            <span style={{ color: "#e2e8f0" }}>—</span>
        </td>
    )

    return (
        <td style={{
            padding: "5px 10px",
            textAlign: "right",
            borderBottom: "1px solid #f1f5f9",
            position: "relative"
        }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#334155", whiteSpace: "nowrap" }}>
                {target ? formatValue(target, unit) : <span style={{ color: "#cbd5e1", fontSize: "11px" }}>Sin objetivo</span>}
            </span>

            <button
                className="target-edit-btn"
                onClick={onEdit}
                style={{
                    position: "absolute",
                    top: "50%",
                    right: "-20px",
                    transform: "translateY(-50%)",
                    opacity: 0,
                    transition: "opacity 0.15s",
                    background: "#7c3aed",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    color: "white",
                    width: "18px",
                    height: "18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "9px",
                    zIndex: 20,
                    boxShadow: "0 1px 4px rgba(124,58,237,0.4)"
                }}
            >
                ✏️
            </button>
        </td>
    )
}

function CategoryRow({ label, colSpan }: { label: string, colSpan: number }) {
    return (
        <tr style={{ background: "#f8fafc", borderTop: "2px solid #e2e8f0" }}>
            <td colSpan={colSpan} style={{ padding: "5px 12px", fontSize: "11px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748b" }}>
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
        if (!modalData) return;
        const val = Number(inputValue);
        if (isNaN(val)) return;

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
                value: val
            }),
        })
            .then(r => r.json())
            .then(d => {
                setLoading(false);
                if (d.ok) {
                    setModalData(null);
                    loadData();
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
                    setModalData(null);
                    loadData();
                } else {
                    alert("Error al eliminar: " + (d.error || "No se pudo eliminar"));
                }
            }).catch(err => {
                console.error(err);
                setLoading(false);
            });
    };

    const RowInfo = ({ label, propId, unit }: { label: string; propId: string; unit: string }) => {
        const hasTarget = SCORECARD_METRICS.find(m => m.id === propId)?.hasTarget || false;

        // Setup data arrays
        const weeklyValues = Array.from({ length: totalWeeks }).map((_, idx) => (w[idx] || {})[propId] || 0);
        const bestWeekValue = Math.max(...weeklyValues.filter(v => v !== null && v !== undefined && !isNaN(v) && v > 0));

        const acumValue = a[propId] || 0;
        const targetValue = g[propId] || null;
        const projection = getProjection(weeklyValues, currentWeekInfo, totalWeeks);
        const objPct = getObjPct(acumValue, targetValue);
        const neededPerWeek = getNeededPerWeek(acumValue, targetValue, currentWeekInfo, totalWeeks);
        const diffToTarget = targetValue !== null ? targetValue - acumValue : null;
        const achieved = diffToTarget !== null && diffToTarget <= 0;
        const trackState = isOnTrack(acumValue, targetValue, currentWeekInfo, totalWeeks);

        return (
            <tr style={{ cursor: "default" }}>
                <td style={{ padding: "5px 12px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "#334155", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", borderBottom: "1px solid #f1f5f9" }}>
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
                <td style={{ textAlign: "center", borderBottom: "1px solid #f1f5f9" }}>
                    <ObjPctCell objPct={objPct} />
                </td>
                <ProyCell projection={projection} target={targetValue} unit={unit} />
                <NeededCell needed={neededPerWeek} onTrack={trackState} achieved={achieved} unit={unit} />
                <FaltanCell acum={acumValue} target={targetValue} unit={unit} />
                <TargetCell target={targetValue} unit={unit} hasTarget={hasTarget} onEdit={() => {
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
                        <col style={{ width: "18%" }} />   {/* VARIABLE */}
                        {weeksArray.map((_, i) => (
                            <col key={i} style={{ width: `${42 / totalWeeks}%` }} />
                        ))}
                        <col style={{ width: "7%", background: "#f5f3ff" }} />  {/* ACUM */}
                        <col style={{ width: "5%" }} />    {/* OBJ % */}
                        <col style={{ width: "7%" }} />    {/* PROY. */}
                        <col style={{ width: "8%" }} />    {/* NEC./SEM */}
                        <col style={{ width: "7%" }} />    {/* FALTAN */}
                        <col style={{ width: "7%" }} />    {/* TARGET */}
                    </colgroup>
                    <thead>
                        <tr style={{ position: "sticky", top: 0, background: "white", zIndex: 10, borderBottom: "2px solid #e2e8f0" }}>
                            <th style={{ textAlign: "left", padding: "8px 12px", fontSize: "10px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8", overflow: "hidden" }}>
                                Variable
                            </th>
                            {weeksArray.map((w, i) => (
                                <th key={i} title={w?.from ? `${w.from} - ${w.to}` : `Semana ${i + 1}`} style={{ textAlign: "right", padding: "8px 12px", fontSize: "10px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8" }}>
                                    Sem {i + 1}
                                </th>
                            ))}
                            <th style={{ textAlign: "right", padding: "8px 12px", fontSize: "10px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", color: "#7c3aed", background: "#f5f3ff" }}>
                                Acum
                            </th>
                            <th style={{ textAlign: "center", padding: "8px 4px", fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.06em", color: "#94a3b8" }}>
                                Obj %
                            </th>
                            <th style={{ textAlign: "right", padding: "8px 12px", fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.06em", color: "#6366f1" }}>
                                Proy.
                            </th>
                            <th style={{ textAlign: "right", padding: "8px 12px", fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.06em", color: "#94a3b8" }}>
                                Nec./Sem
                            </th>
                            <th style={{ textAlign: "right", padding: "8px 12px", fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.06em", color: "#94a3b8" }}>
                                Faltan
                            </th>
                            <th style={{ textAlign: "right", padding: "8px 12px", fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.06em", color: "#94a3b8" }}>
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

            {/* Target Definition Modal */}
            {modalData && (
                <div
                    style={{
                        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                        background: "rgba(15,23,42,0.4)",
                        backdropFilter: "blur(4px)",
                        zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center"
                    }}
                    onClick={() => setModalData(null)}
                >
                    <div
                        style={{
                            background: "rgba(255, 255, 255, 0.98)",
                            backdropFilter: "blur(25px)",
                            padding: "24px",
                            borderRadius: "28px",
                            width: "360px",
                            boxShadow: "0 20px 40px -12px rgba(15,23,42,0.3), inset 0 1px 0 rgba(255,255,255,1)",
                            display: "flex",
                            flexDirection: "column",
                            border: "1px solid rgba(255,255,255,0.6)",
                            position: "relative",
                            gap: "20px"
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button
                            onClick={() => setModalData(null)}
                            style={{
                                position: "absolute", top: "20px", right: "20px",
                                background: "rgba(241,245,249,0.8)", border: "none",
                                borderRadius: "12px", padding: "8px", cursor: "pointer",
                                color: "#64748b", display: "flex", alignItems: "center",
                                transition: "all 0.2s"
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = "#fee2e2"}
                            onMouseLeave={e => e.currentTarget.style.background = "rgba(241,245,249,0.8)"}
                        >
                            <X size={18} />
                        </button>

                        <div>
                            <h3 style={{ fontSize: "18px", fontWeight: 900, color: "#1e293b", margin: "0 0 4px 0", letterSpacing: "-0.02em" }}>
                                Configurar Objetivo
                            </h3>
                            <p style={{ fontSize: "13px", color: "#64748b", margin: 0, fontWeight: 500 }}>
                                Establecer meta mensual para <span style={{ color: "#7c3aed", fontWeight: 700 }}>{modalData.label}</span>
                            </p>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "#f8fafc", padding: "16px", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: "10px", fontWeight: 800, textTransform: "uppercase", color: "#94a3b8", marginBottom: "4px", letterSpacing: "0.05em" }}>
                                        Valor del Objetivo
                                    </div>
                                    <input
                                        type="number"
                                        autoFocus
                                        value={inputValue || ''}
                                        onChange={e => setInputValue(Number(e.target.value))}
                                        placeholder="0.00"
                                        style={{
                                            fontSize: "24px", fontWeight: 900, width: "100%",
                                            background: "none", border: "none", outline: "none", color: "#1e293b",
                                            padding: 0
                                        }}
                                    />
                                </div>
                                <span style={{ fontSize: "14px", color: "#64748b", fontWeight: 900, background: "white", padding: "8px 12px", borderRadius: "10px", border: "1px solid #e2e8f0", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                                    {modalData.unit || "UNI"}
                                </span>
                            </div>

                            {inputValue > 0 && weeksRemainingModal > 0 && (
                                <div style={{
                                    background: "rgba(124,58,237,0.05)",
                                    borderRadius: "16px",
                                    padding: "16px",
                                    fontSize: "12px",
                                    color: "#4c1d95",
                                    border: "1px solid rgba(124,58,237,0.1)",
                                    lineHeight: 1.5
                                }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                                        <TrendingUp size={14} />
                                        <strong style={{ fontWeight: 800 }}>Ritmo Sugerido</strong>
                                    </div>
                                    Necesitas promediar <strong style={{ color: "#7c3aed", fontSize: "14px" }}>{formatValue((inputValue - modalData.acumValue) / weeksRemainingModal, modalData.unit)}</strong> por semana en las {weeksRemainingModal} semanas restantes.
                                    <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "6px", fontWeight: 700 }}>
                                        {(currentWeekInfo > 0 ? modalData.acumValue / currentWeekInfo : 0) >= ((inputValue - modalData.acumValue) / weeksRemainingModal)
                                            ? <><Check size={14} color="#22c55e" /> <span style={{ color: "#166534" }}>Buen ritmo actual</span></>
                                            : <><AlertCircle size={14} color="#ef4444" /> <span style={{ color: "#991b1b" }}>Requiere aceleración</span></>
                                        }
                                    </div>
                                </div>
                            )}

                            <div>
                                <div style={{ fontSize: "10px", fontWeight: 800, textTransform: "uppercase", color: "#94a3b8", marginBottom: "8px", letterSpacing: "0.05em", marginLeft: "4px" }}>
                                    Notas de Estrategia
                                </div>
                                <textarea
                                    placeholder="¿Cuál es el plan para alcanzar este objetivo?"
                                    style={{
                                        width: "100%", boxSizing: "border-box", fontSize: "13px", padding: "14px",
                                        border: "1px solid #e2e8f0", borderRadius: "16px", resize: "none",
                                        height: "80px", background: "#f8fafc", color: "#334155",
                                        fontFamily: "inherit", outline: "none", transition: "border-color 0.2s"
                                    }}
                                    onFocus={e => e.currentTarget.style.borderColor = "#7c3aed"}
                                    onBlur={e => e.currentTarget.style.borderColor = "#e2e8f0"}
                                />
                            </div>
                        </div>

                        <div style={{ display: "flex", gap: "12px" }}>
                            <button
                                onClick={handleSaveGoal}
                                disabled={loading}
                                style={{
                                    flex: 1, background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
                                    color: "white", border: "none", borderRadius: "16px", padding: "14px",
                                    fontWeight: 900, fontSize: "14px", cursor: "pointer",
                                    boxShadow: "0 10px 15px -3px rgba(124,58,237,0.3)",
                                    transition: "all 0.2s"
                                }}
                                onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"}
                                onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
                            >
                                {loading ? "Guardando..." : "Confirmar Objetivo"}
                            </button>
                            {modalData.currentTarget !== null && (
                                <button
                                    onClick={handleDeleteGoal}
                                    style={{
                                        background: "#fff", border: "1px solid #fee2e2", color: "#ef4444",
                                        borderRadius: "16px", padding: "14px 20px", fontWeight: 800,
                                        fontSize: "14px", cursor: "pointer", transition: "all 0.2s"
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = "#fef2f2"}
                                    onMouseLeave={e => e.currentTarget.style.background = "#fff"}
                                >
                                    Eliminar
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
