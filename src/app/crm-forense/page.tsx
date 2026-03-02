'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/lib/store/store-context';
import { Users, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { AgentCompanion } from '@/components/layout/agent-companion';
import { ViewMode, getWeeklySummary, getQuarterlySummary, DayData, WeekSummary, QuarterSummary, generateRows, MonthData } from '@/lib/crmPeriods';
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface CRMChartProps {
    data: any[];
    viewMode: ViewMode;
    tab: string;
}

function CRMChart({ data, viewMode, tab }: CRMChartProps) {
    return (
        <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "16px", marginBottom: "16px", height: "300px", width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data}>
                    <XAxis
                        dataKey="label"
                        tick={{ fontSize: 10, fill: "#94a3b8" }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis
                        yAxisId="left"
                        tick={{ fontSize: 10, fill: "#94a3b8" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={v => `€${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
                    />
                    <YAxis
                        yAxisId="right"
                        orientation="right"
                        tick={{ fontSize: 10, fill: "#94a3b8" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={v => `${v}%`}
                    />
                    <Tooltip
                        contentStyle={{ fontSize: "11px", borderRadius: "8px", border: "1px solid #e2e8f0" }}
                    />
                    <Legend wrapperStyle={{ fontSize: "10px" }} />

                    {/* Barras principales */}
                    <Bar yAxisId="left" dataKey="facturacion" name="Facturación €" fill="#7c3aed" radius={[3, 3, 0, 0]} opacity={0.85} />
                    <Bar yAxisId="left" dataKey="beneficioNeto" name="Beneficio €" fill="#a78bfa" radius={[3, 3, 0, 0]} opacity={0.7} />

                    {/* Líneas de ratios */}
                    <Line yAxisId="right" type="monotone" dataKey="margen" name="Margen %" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
                    <Line yAxisId="right" type="monotone" dataKey="tasaEntrega" name="Tasa Entrega %" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
                    <Line yAxisId="right" type="monotone" dataKey="tasaIncidencias" name="Incidencias %" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 4" />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    )
}

const TABS = [
    { id: 'VENTAS', label: 'Ventas' },
    { id: 'CLIENTES', label: 'Clientes' },
    { id: 'TRANSPORTISTAS', label: 'Transportistas' },
    { id: 'EMPLEADOS', label: 'Empleados' },
    { id: 'AGENTES', label: 'Agentes IA' },
    { id: 'CREATIVOS', label: 'Creativos' },
    { id: 'PRODUCTOS', label: 'Productos' },
    { id: 'COD_VS_CARD', label: 'COD vs Tarjeta' },
    { id: 'FULFILLMENT', label: 'Fulfillment' },
    { id: 'LANDING_PAGES', label: 'Landing Pages' },
    { id: 'COHORTES', label: 'Cohortes' },
    { id: 'INCIDENCIAS', label: 'Incidencias' },
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

interface CRMColumn {
    key: string;
    label: string;
    type?: "sum" | "avg" | "rate" | "string" | "calc";
    unit?: "EUR" | "%" | "text" | "x" | "";
    thresholds?: number[];
    lowerIsBetter?: boolean;
    calcFn?: (totals: any) => number;
}

interface CRMTableProps {
    rows: any[];
    columns: CRMColumn[];
    totals: any;
}

function getSemaforoStyle(value: number, thresholds?: number[], lowerIsBetter?: boolean) {
    if (value === undefined || value === null || !thresholds) return {};
    let color = "#ef4444";
    let bg = "rgba(239, 68, 68, 0.05)";
    if (lowerIsBetter) {
        if (value <= thresholds[0]) { color = "#22c55e"; bg = "rgba(34, 197, 94, 0.05)"; }
        else if (value <= thresholds[1]) { color = "#eab308"; bg = "rgba(234, 179, 8, 0.05)"; }
    } else {
        if (value >= thresholds[0]) { color = "#22c55e"; bg = "rgba(34, 197, 94, 0.05)"; }
        else if (value >= thresholds[1]) { color = "#eab308"; bg = "rgba(234, 179, 8, 0.05)"; }
    }
    return { color, background: bg, fontWeight: 700 };
}

const formatValueInfo = (value: number, unit?: string) => {
    if (value === undefined || value === null || isNaN(value)) return "-";
    if (unit === "EUR") return `€${value >= 1000 ? (value / 1000).toFixed(1) + 'k' : Math.round(value)}`;
    if (unit === "%") return `${value.toFixed(1)}%`;
    return `${Math.round(value)}`;
};

function CRMTable({ rows, columns, totals }: CRMTableProps) {
    const [sortKey, setSortKey] = useState<string>("label");
    const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

    const handleSort = (key: string) => {
        if (sortKey === key) {
            setSortDir(sortDir === "asc" ? "desc" : "asc");
        } else {
            setSortKey(key);
            setSortDir("desc");
        }
    };

    const sortedRows = [...rows].sort((a, b) => {
        if (sortKey === "label") return 0; // maintain period order normally
        const aVal = a[sortKey] || 0;
        const bVal = b[sortKey] || 0;
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
    });

    return (
        <div style={{ overflowX: "auto", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
            <table style={{ width: "100%", tableLayout: "auto", borderCollapse: "collapse", minWidth: "1200px" }}>

                {/* CABECERA sticky */}
                <thead>
                    <tr style={{ position: "sticky", top: 0, background: "white", zIndex: 10, borderBottom: "2px solid #e2e8f0" }}>
                        {columns.map(col => (
                            <th
                                key={col.key}
                                onClick={() => handleSort(col.key)}
                                style={{
                                    padding: col.key === "label" ? "6px 8px" : "6px 6px",
                                    fontSize: col.key === "label" ? "8px" : "8px", fontWeight: 900,
                                    textTransform: "uppercase", letterSpacing: "0.05em",
                                    color: "#94a3b8", whiteSpace: "normal",
                                    cursor: "pointer", userSelect: "none",
                                    textAlign: "center",
                                    lineHeight: 1.2,
                                    minWidth: col.key === "label" ? "40px" : "60px",
                                    maxWidth: col.key === "label" ? "50px" : "80px",
                                    ...(col.key === "label" ? { position: "sticky", left: 0, background: "white", zIndex: 11 } : {})
                                }}
                            >
                                {col.key === "label" ? col.label : col.label.split(" ").map((word, wIdx) => (
                                    <span key={wIdx} style={{ display: "block" }}>{word}</span>
                                ))}
                                {sortKey === col.key && (
                                    <span style={{ display: "block", color: "#64748b", marginTop: "2px" }}>
                                        {sortDir === "asc" ? "↑" : "↓"}
                                    </span>
                                )}
                            </th>
                        ))}
                    </tr>
                </thead>

                <tbody>
                    {/* FILAS DE DATOS */}
                    {sortedRows.map((row, i) => (
                        <tr
                            key={row.key}
                            style={{
                                borderBottom: "1px solid #f1f5f9",
                                background: i % 2 === 0 ? "white" : "#fafbff",
                                ...(row.isToday ? { background: "rgba(124,58,237,0.04)" } : {})
                            }}
                        >
                            {columns.map(col => (
                                <td
                                    key={col.key}
                                    style={{
                                        padding: "5px 8px",
                                        fontSize: "12px",
                                        whiteSpace: "nowrap",
                                        textAlign: "center",
                                        ...(col.key === "label" ? {
                                            position: "sticky", left: 0,
                                            background: i % 2 === 0 ? "white" : "#fafbff",
                                            fontWeight: 800, color: "#1e293b", zIndex: 5
                                        } : {}),
                                        ...(col.type === "rate" ? getSemaforoStyle(row[col.key], col.thresholds, col.lowerIsBetter) : {})
                                    }}
                                >
                                    {col.key === "label"
                                        ? <span>{row.label}{row.sublabel && <span style={{ display: "block", fontSize: "9px", color: "#94a3b8", marginTop: "2px" }}>{row.sublabel}</span>}</span>
                                        : formatValueInfo(row[col.key], col.unit)
                                    }
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>

                {/* FILA TOTAL sticky abajo */}
                <tfoot>
                    <tr style={{
                        position: "sticky", bottom: 0,
                        background: "#f8fafc",
                        borderTop: "2px solid #e2e8f0",
                        zIndex: 10
                    }}>
                        {columns.map(col => (
                            <td
                                key={col.key}
                                style={{
                                    padding: "7px 12px",
                                    fontSize: "12px", fontWeight: 900,
                                    color: "#1e293b", whiteSpace: "nowrap",
                                    textAlign: col.key === "label" ? "left" : "center",
                                    ...(col.key === "label" ? {
                                        position: "sticky", left: 0,
                                        background: "#f8fafc", zIndex: 11
                                    } : {})
                                }}
                            >
                                {col.key === "label"
                                    ? "TOTAL"
                                    : col.type === "avg" || col.type === "rate" || col.type === "calc"
                                        ? formatValueInfo(totals[col.key], col.unit)
                                        : formatValueInfo(totals[col.key], col.unit)
                                }
                            </td>
                        ))}
                    </tr>
                </tfoot>

            </table>
        </div>
    )
}

export default function CrmForensePage() {
    const { activeStoreId } = useStore();
    const [activeTab, setActiveTab] = useState(TABS[0].id);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [viewMode, setViewMode] = useState<ViewMode>("daily");
    const [activeWeek, setActiveWeek] = useState(0);

    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const month = selectedMonth;
    const year = selectedYear;

    useEffect(() => {
        if (!activeStoreId) return;
        setLoading(true);
        fetch(`/api/crm-forense?storeId=${activeStoreId}&tab=${activeTab}&month=${month}&year=${year}&annual=${viewMode === "annual"}`)
            .then(r => r.json())
            .then(d => {
                if (d.ok) setData(d);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [activeStoreId, activeTab, month, year, viewMode]);

    const parseDailyData = (metrics: any[], daysInMonth: number, isAnnual: boolean): DayData[] | MonthData[] => {
        if (!metrics || metrics.length === 0) return [];
        const slotsCount = isAnnual ? 12 : daysInMonth;
        const getV = (label: string) => metrics.find((m: any) => m.label.includes(label))?.values || Array(slotsCount).fill(0);

        const fact = getV("Facturación") || getV("Ventas") || getV("Inversión") || getV("Volumen");
        const ped = getV("Pedidos") || getV("Total") || getV("Ingresos") || Array(slotsCount).fill(0);

        return Array.from({ length: slotsCount }, (_, i) => ({
            ...(isAnnual ? { month: i } : { day: i + 1 }),
            day: i + 1, // keeping day for typings
            facturacion: fact[i] || 0,
            pedidos: ped[i] || 0,
            entregados: Math.round((ped[i] || 0) * 0.8), // Mock temp 
            incidencias: Math.round((ped[i] || 0) * 0.05), // Mock temp
            ticketMedio: fact[i] && ped[i] ? Math.round(fact[i] / ped[i]) : 0,
            margen: 25 // Mock temp
        }));
    };

    const periodData = data?.data?.metrics ? parseDailyData(data.data.metrics, data.slotsCount || data.daysInMonth, data.isAnnual) : [];
    const dailyData: DayData[] = viewMode !== "annual" ? (periodData as DayData[]) : [];
    const monthlyData: MonthData[] = viewMode === "annual" ? (periodData as MonthData[]) : [];

    const weeklySummary = viewMode !== "annual" && dailyData.length > 0 ? getWeeklySummary(dailyData, month, year) : [];
    const quarterlySummary = viewMode === "annual" && monthlyData.length > 0 ? getQuarterlySummary(monthlyData) : [];

    const getChartData = () => {
        if (viewMode === "daily") {
            return dailyData.map((d: DayData) => ({
                label: `Día ${d.day}`,
                facturacion: d.facturacion,
                beneficioNeto: d.facturacion * (d.margen / 100),
                margen: d.margen,
                tasaEntrega: d.pedidos > 0 ? Math.round((d.entregados / d.pedidos) * 100) : 0,
                tasaIncidencias: d.pedidos > 0 ? Math.round((d.incidencias / d.pedidos) * 100) : 0
            }));
        }
        if (viewMode === "weekly") {
            return weeklySummary.map((w: WeekSummary) => ({
                label: w.label,
                facturacion: w.facturacion,
                beneficioNeto: w.facturacion * (w.margen / 100),
                margen: w.margen,
                tasaEntrega: w.pedidos > 0 ? Math.round((w.entregados / w.pedidos) * 100) : 0,
                tasaIncidencias: w.pedidos > 0 ? Math.round((w.incidencias / w.pedidos) * 100) : 0
            }));
        }
        if (viewMode === "annual" || viewMode === "monthly") {
            const periodRows = generateRows(viewMode, month, year);
            const dataToUse = viewMode === "annual" ? monthlyData : monthlyData; // Fix needed long term for pure monthly, but using monthlyData works if it was fetched with annual=true
            return periodRows.map((r: any, i: number) => {
                const m = monthlyData[i] || { facturacion: 0, pedidos: 0, entregados: 0, incidencias: 0, ticketMedio: 0, margen: 0 };
                return {
                    label: r.label,
                    facturacion: m.facturacion,
                    beneficioNeto: m.facturacion * (m.margen / 100),
                    margen: m.margen,
                    tasaEntrega: m.pedidos > 0 ? Math.round((m.entregados / m.pedidos) * 100) : 0,
                    tasaIncidencias: m.pedidos > 0 ? Math.round((m.incidencias / m.pedidos) * 100) : 0
                }
            });
        }
        const periodRows = generateRows(viewMode, month, year);
        return periodRows.map((row: any) => ({
            label: row.label,
            facturacion: 0, beneficioNeto: 0, margen: 0, tasaEntrega: 0, tasaIncidencias: 0
        }));
    };

    const chartData = getChartData();

    const tableData = React.useMemo(() => {
        let periodRows = generateRows(viewMode, month, year);
        if (viewMode === "daily") {
            return periodRows.map((r, i) => {
                const d = dailyData[i] || { facturacion: 0, pedidos: 0, entregados: 0, incidencias: 0, ticketMedio: 0, margen: 0 };
                return {
                    ...r,
                    ...d,
                    beneficioNeto: d.facturacion * (d.margen / 100),
                    tasaEntrega: d.pedidos > 0 ? (d.entregados / d.pedidos) * 100 : 0,
                    tasaIncidencias: d.pedidos > 0 ? (d.incidencias / d.pedidos) * 100 : 0,
                    isToday: new Date().getDate() === (i + 1) && new Date().getMonth() + 1 === month && new Date().getFullYear() === year
                };
            });
        }
        if (viewMode === "weekly") {
            return periodRows.map((r, i) => {
                const w = weeklySummary[i] || { facturacion: 0, pedidos: 0, entregados: 0, incidencias: 0, ticketMedio: 0, margen: 0 };
                return {
                    ...r,
                    ...w,
                    beneficioNeto: w.facturacion * (w.margen / 100),
                    tasaEntrega: w.pedidos > 0 ? (w.entregados / w.pedidos) * 100 : 0,
                    tasaIncidencias: w.pedidos > 0 ? (w.incidencias / w.pedidos) * 100 : 0,
                };
            });
        }
        if (viewMode === "monthly" || viewMode === "annual") {
            return periodRows.map((r, i) => {
                const d = monthlyData[i] || { facturacion: 0, pedidos: 0, entregados: 0, incidencias: 0, ticketMedio: 0, margen: 0 };
                return {
                    ...r,
                    ...d,
                    beneficioNeto: d.facturacion * (d.margen / 100),
                    tasaEntrega: d.pedidos > 0 ? (d.entregados / d.pedidos) * 100 : 0,
                    tasaIncidencias: d.pedidos > 0 ? (d.incidencias / d.pedidos) * 100 : 0,
                };
            });
        }
        return periodRows.map(r => ({
            ...r, facturacion: 0, pedidos: 0, entregados: 0, incidencias: 0, ticketMedio: 0, margen: 0, beneficioNeto: 0, tasaEntrega: 0, tasaIncidencias: 0
        }));
    }, [viewMode, dailyData, weeklySummary, month, year]);

    const tableColumns: CRMColumn[] = React.useMemo(() => {
        const periodCol: CRMColumn = { key: "label", label: viewMode === "daily" ? "DÍA" : viewMode === "weekly" ? "SEMANA" : viewMode === "monthly" ? "MES" : "AÑO", type: "string" };

        if (activeTab === "VENTAS") {
            return [
                periodCol,
                // PEDIDOS
                { key: "pedidos", label: "Pedidos Total", type: "sum", unit: "" },
                { key: "confirmados", label: "Confirmados", type: "sum", unit: "" },
                { key: "cancelados", label: "Cancelados", type: "sum", unit: "" },
                { key: "tasaCancelacion", label: "Tasa Cancel.", type: "calc", unit: "%", thresholds: [15, 25], lowerIsBetter: true, calcFn: (t) => t.pedidos > 0 ? (t.cancelados / t.pedidos) * 100 : 0 },
                { key: "enviados", label: "Enviados", type: "sum", unit: "" },
                { key: "tasaEnvio", label: "Tasa Envío", type: "calc", unit: "%", thresholds: [85, 70], lowerIsBetter: false, calcFn: (t) => t.confirmados > 0 ? (t.enviados / t.confirmados) * 100 : 0 },
                { key: "entregados", label: "Entregados", type: "sum", unit: "" },
                { key: "tasaEntrega", label: "Tasa Entrega", type: "calc", unit: "%", thresholds: [85, 70], lowerIsBetter: false, calcFn: (t) => t.enviados > 0 ? (t.entregados / t.enviados) * 100 : 0 },
                { key: "reintentos", label: "Reintentos", type: "sum", unit: "" },
                { key: "incidencias", label: "Incidencias", type: "sum", unit: "" },
                { key: "tasaIncidencias", label: "Tasa Incid.", type: "calc", unit: "%", thresholds: [5, 10], lowerIsBetter: true, calcFn: (t) => t.enviados > 0 ? (t.incidencias / t.enviados) * 100 : 0 },
                { key: "recuperadas", label: "Recuperadas", type: "sum", unit: "" },
                { key: "tasaRecuperacion", label: "Tasa Recup.", type: "calc", unit: "%", thresholds: [80, 50], lowerIsBetter: false, calcFn: (t) => t.incidencias > 0 ? (t.recuperadas / t.incidencias) * 100 : 0 },

                // FACTURACIÓN
                { key: "facturacionBruta", label: "Facturación Bruta", type: "sum", unit: "EUR" },
                { key: "facturacionNeta", label: "Facturación Neta", type: "sum", unit: "EUR" },
                { key: "ticketMedio", label: "Ticket Medio", type: "calc", unit: "EUR", calcFn: (t) => t.pedidos > 0 ? t.facturacionBruta / t.pedidos : 0 },
                { key: "unidades", label: "Unidades Vendidas", type: "sum", unit: "" },
                { key: "udsPorPedido", label: "Uds. Pedido", type: "calc", unit: "", calcFn: (t) => t.pedidos > 0 ? t.unidades / t.pedidos : 0 },

                // DEVOLUCIONES
                { key: "devoluciones", label: "Devol.", type: "sum", unit: "" },
                { key: "tasaDevolucion", label: "Tasa Devol.", type: "calc", unit: "%", thresholds: [5, 10], lowerIsBetter: true, calcFn: (t) => t.entregados > 0 ? (t.devoluciones / t.entregados) * 100 : 0 },
                { key: "importeDevolucion", label: "Importe Devol.", type: "sum", unit: "EUR" },

                // PAGO
                { key: "pedidosCOD", label: "Pedidos COD", type: "sum", unit: "" },
                { key: "pedidosTarjeta", label: "Pedidos Tarjeta", type: "sum", unit: "" },
                { key: "pctCOD", label: "% COD", type: "calc", unit: "%", calcFn: (t) => t.pedidos > 0 ? (t.pedidosCOD / t.pedidos) * 100 : 0 },
                { key: "pctTarjeta", label: "% Tarjeta", type: "calc", unit: "%", calcFn: (t) => t.pedidos > 0 ? (t.pedidosTarjeta / t.pedidos) * 100 : 0 },
                { key: "facturacionCOD", label: "Fact. COD", type: "sum", unit: "EUR" },
                { key: "facturacionTarjeta", label: "Fact. Tarjeta", type: "sum", unit: "EUR" },

                // ECONOMÍA
                { key: "cogs", label: "COGS", type: "sum", unit: "EUR" },
                { key: "shippingTotal", label: "Shipping Total", type: "sum", unit: "EUR" },
                { key: "beneficioBruto", label: "Benef. Bruto", type: "calc", unit: "EUR", calcFn: (t) => t.facturacionNeta - t.cogs },
                { key: "beneficioNeto", label: "Benef. Neto", type: "calc", unit: "EUR", calcFn: (t) => t.facturacionNeta - t.cogs - t.shippingTotal },
                { key: "margenBruto", label: "Margen Bruto", type: "calc", unit: "%", thresholds: [50, 30], lowerIsBetter: false, calcFn: (t) => t.facturacionNeta > 0 ? (t.beneficioBruto / t.facturacionNeta) * 100 : 0 },
                { key: "margenNeto", label: "Margen Neto", type: "calc", unit: "%", thresholds: [25, 15], lowerIsBetter: false, calcFn: (t) => t.facturacionNeta > 0 ? (t.beneficioNeto / t.facturacionNeta) * 100 : 0 },
                { key: "roi", label: "ROI", type: "calc", unit: "%", calcFn: (t) => t.cogs > 0 ? (t.beneficioNeto / t.cogs) * 100 : 0 },
            ];
        }

        if (activeTab === "CLIENTES") {
            return [
                periodCol,
                { key: "clientesTotal", label: "Clientes Total", type: "sum", unit: "" },
                { key: "clientesNuevos", label: "Nuevos", type: "sum", unit: "" },
                { key: "recurrentes", label: "Recurrentes", type: "sum", unit: "" },
                { key: "pctRecurrentes", label: "% Recurrentes", type: "calc", unit: "%", calcFn: (t) => t.clientesTotal > 0 ? (t.recurrentes / t.clientesTotal) * 100 : 0 },
                { key: "ltvMedio", label: "LTV Medio", type: "calc", unit: "EUR", calcFn: (t) => t.clientesTotal > 0 ? t.facturacion / t.clientesTotal : 0 },
                { key: "ltvMaximo", label: "LTV Máximo", type: "avg", unit: "EUR" },
                { key: "ticketMedio", label: "Ticket Medio", type: "calc", unit: "EUR", calcFn: (t) => t.pedidos > 0 ? t.facturacion / t.pedidos : 0 },
                { key: "comprasCliente", label: "Compras x Cliente", type: "calc", unit: "", calcFn: (t) => t.clientesTotal > 0 ? t.pedidos / t.clientesTotal : 0 },
                { key: "diasEntreCompras", label: "Días entre Compras", type: "avg", unit: "" },
                { key: "pedidos", label: "Pedidos Total", type: "sum", unit: "" },
                { key: "enviados", label: "Enviados", type: "sum", unit: "" },
                { key: "tasaEnvio", label: "Tasa Envío", type: "calc", unit: "%", thresholds: [85, 70], lowerIsBetter: false, calcFn: (t) => t.pedidos > 0 ? (t.enviados / t.pedidos) * 100 : 0 },
                { key: "entregados", label: "Entregados", type: "sum", unit: "" },
                { key: "tasaEntrega", label: "Tasa Entrega", type: "calc", unit: "%", thresholds: [85, 70], lowerIsBetter: false, calcFn: (t) => t.enviados > 0 ? (t.entregados / t.enviados) * 100 : 0 },
                { key: "reintentos", label: "Reintentos", type: "sum", unit: "" },
                { key: "incidencias", label: "Incidencias", type: "sum", unit: "" },
                { key: "tasaIncidencias", label: "Tasa Incid.", type: "calc", unit: "%", thresholds: [5, 10], lowerIsBetter: true, calcFn: (t) => t.enviados > 0 ? (t.incidencias / t.enviados) * 100 : 0 },
                { key: "recuperadas", label: "Recuperadas", type: "sum", unit: "" },
                { key: "tasaRecuperacion", label: "Tasa Recup.", type: "calc", unit: "%", thresholds: [80, 50], lowerIsBetter: false, calcFn: (t) => t.incidencias > 0 ? (t.recuperadas / t.incidencias) * 100 : 0 },
                { key: "devoluciones", label: "Devol.", type: "sum", unit: "" },
                { key: "tasaDevolucion", label: "Tasa Devol.", type: "calc", unit: "%", thresholds: [5, 10], lowerIsBetter: true, calcFn: (t) => t.entregados > 0 ? (t.devoluciones / t.entregados) * 100 : 0 },
                { key: "cancelaciones", label: "Cancelac.", type: "sum", unit: "" },
                { key: "tasaCancelacion", label: "Tasa Cancel.", type: "calc", unit: "%", thresholds: [15, 25], lowerIsBetter: true, calcFn: (t) => t.pedidos > 0 ? (t.cancelaciones / t.pedidos) * 100 : 0 },
                { key: "upsellsAceptados", label: "Upsells Acept.", type: "sum", unit: "" },
                { key: "importeUpsell", label: "Importe Upsell", type: "sum", unit: "EUR" },
                { key: "tasaUpsell", label: "Tasa Upsell", type: "calc", unit: "%", calcFn: (t) => t.pedidos > 0 ? (t.upsellsAceptados / t.pedidos) * 100 : 0 },
                { key: "pctCOD", label: "% COD", type: "avg", unit: "%" },
                { key: "pctTarjeta", label: "% Tarjeta", type: "avg", unit: "%" },
                { key: "scoreRiesgo", label: "Score Riesgo", type: "avg", unit: "" },
                { key: "facturacion", label: "Fact. Total", type: "sum", unit: "EUR" },
            ];
        }

        if (activeTab === "TRANSPORTISTAS") {
            return [
                periodCol,
                { key: "nombre", label: "Transportista", type: "string", unit: "" },
                { key: "asignados", label: "Pedidos Asignados", type: "sum", unit: "" },
                { key: "recogidos", label: "Recogidos", type: "sum", unit: "" },
                { key: "tasaRecogida", label: "Tasa Recogida", type: "calc", unit: "%", thresholds: [95, 80], lowerIsBetter: false, calcFn: (t) => t.asignados > 0 ? (t.recogidos / t.asignados) * 100 : 0 },
                { key: "enTransito", label: "En Tránsito", type: "sum", unit: "" },
                { key: "entregados", label: "Entregados", type: "sum", unit: "" },
                { key: "tasaEntrega", label: "Tasa Entrega", type: "calc", unit: "%", thresholds: [85, 70], lowerIsBetter: false, calcFn: (t) => t.asignados > 0 ? (t.entregados / t.asignados) * 100 : 0 }, // o vs recogidos
                { key: "reintentos", label: "Reintentos", type: "sum", unit: "" },
                { key: "tasaReintento", label: "Tasa Reintento", type: "calc", unit: "%", thresholds: [10, 20], lowerIsBetter: true, calcFn: (t) => t.asignados > 0 ? (t.reintentos / t.asignados) * 100 : 0 },
                { key: "incidencias", label: "Incidencias Total", type: "sum", unit: "" },
                { key: "tasaIncidencias", label: "Tasa Incid.", type: "calc", unit: "%", thresholds: [5, 10], lowerIsBetter: true, calcFn: (t) => t.asignados > 0 ? (t.incidencias / t.asignados) * 100 : 0 },
                { key: "extraviados", label: "Extraviados", type: "sum", unit: "" },
                { key: "daniados", label: "Dañados", type: "sum", unit: "" },
                { key: "noLocalizado", label: "No Localiz.", type: "sum", unit: "" },
                { key: "recuperadas", label: "Recuperadas", type: "sum", unit: "" },
                { key: "tasaRecuperacion", label: "Tasa Recup.", type: "calc", unit: "%", thresholds: [80, 50], lowerIsBetter: false, calcFn: (t) => t.incidencias > 0 ? (t.recuperadas / t.incidencias) * 100 : 0 },
                { key: "tiempoResolucion", label: "T. Resol. (h)", type: "avg", unit: "" },
                { key: "devoluciones", label: "Devol.", type: "sum", unit: "" },
                { key: "tasaDevolucion", label: "Tasa Devol.", type: "calc", unit: "%", thresholds: [5, 10], lowerIsBetter: true, calcFn: (t) => t.entregados > 0 ? (t.devoluciones / t.entregados) * 100 : 0 },
                { key: "tiempoMedio", label: "T. Medio Entrega", type: "avg", unit: "" },
                { key: "enPlazo", label: "En Plazo %", type: "avg", unit: "%" },
                { key: "tarde", label: "Tarde %", type: "calc", unit: "%", calcFn: (t) => t.enPlazo > 0 ? 100 - t.enPlazo : 0 }, // Simplificación
                { key: "costeMedio", label: "Coste Medio", type: "calc", unit: "EUR", calcFn: (t) => t.asignados > 0 ? t.costeTotal / t.asignados : 0 },
                { key: "costeTotal", label: "Coste Total", type: "sum", unit: "EUR" },
                { key: "costeIncidencia", label: "Coste x Incid.", type: "calc", unit: "EUR", calcFn: (t) => t.incidencias > 0 ? t.costeTotal / t.incidencias : 0 }, // Pseudo-métrica real
                { key: "cpConflictivos", label: "CP Conflict.", type: "sum", unit: "" },
                { key: "score", label: "Score", type: "avg", unit: "" },
            ];
        }

        if (activeTab === "EMPLEADOS") {
            return [
                periodCol,
                { key: "nombre", label: "Empleado", type: "string", unit: "" },
                { key: "llamadasRealizadas", label: "Llamadas Realizadas", type: "sum", unit: "" },
                { key: "llamadasAtendidas", label: "Llamadas Atendidas", type: "sum", unit: "" },
                { key: "noContesta", label: "No Contesta", type: "sum", unit: "" },
                { key: "tasaContacto", label: "Tasa Contacto", type: "calc", unit: "%", thresholds: [80, 50], lowerIsBetter: false, calcFn: (t) => t.llamadasRealizadas > 0 ? (t.llamadasAtendidas / t.llamadasRealizadas) * 100 : 0 },
                { key: "tiempoMedioLlamada", label: "T. Medio Llamada", type: "avg", unit: "" },
                { key: "tiempoTotal", label: "T. Total (h)", type: "sum", unit: "" },
                { key: "pedidosAsignados", label: "Pedidos Asignados", type: "sum", unit: "" },
                { key: "confirmados", label: "Confirmados", type: "sum", unit: "" },
                { key: "cancelados", label: "Cancelados", type: "sum", unit: "" },
                { key: "tasaConfirmacion", label: "Tasa Confirm.", type: "calc", unit: "%", thresholds: [80, 60], lowerIsBetter: false, calcFn: (t) => t.pedidosAsignados > 0 ? (t.confirmados / t.pedidosAsignados) * 100 : 0 },
                { key: "enviados", label: "Enviados", type: "sum", unit: "" },
                { key: "tasaEnvio", label: "Tasa Envío", type: "calc", unit: "%", thresholds: [95, 80], lowerIsBetter: false, calcFn: (t) => t.confirmados > 0 ? (t.enviados / t.confirmados) * 100 : 0 },
                { key: "entregados", label: "Entregados", type: "sum", unit: "" },
                { key: "tasaEntrega", label: "Tasa Entrega", type: "calc", unit: "%", thresholds: [85, 70], lowerIsBetter: false, calcFn: (t) => t.enviados > 0 ? (t.entregados / t.enviados) * 100 : 0 },
                { key: "incidGestionadas", label: "Incid. Gestionadas", type: "sum", unit: "" },
                { key: "incidRecuperadas", label: "Incid. Recuperadas", type: "sum", unit: "" },
                { key: "tasaRecuperacion", label: "Tasa Recup.", type: "calc", unit: "%", thresholds: [80, 50], lowerIsBetter: false, calcFn: (t) => t.incidGestionadas > 0 ? (t.incidRecuperadas / t.incidGestionadas) * 100 : 0 },
                { key: "tiempoResolucion", label: "T. Resol. (h)", type: "avg", unit: "" },
                { key: "devolucionesGest", label: "Devol. Gestionadas", type: "sum", unit: "" },
                { key: "tasaDevolucion", label: "Tasa Devol.", type: "calc", unit: "%", thresholds: [5, 10], lowerIsBetter: true, calcFn: (t) => t.entregados > 0 ? (t.devolucionesGest / t.entregados) * 100 : 0 },
                { key: "upsellsOfrecidos", label: "Upsells Ofrecidos", type: "sum", unit: "" },
                { key: "upsellsAceptados", label: "Upsells Aceptados", type: "sum", unit: "" },
                { key: "tasaUpsell", label: "Tasa Upsell", type: "calc", unit: "%", thresholds: [25, 15], lowerIsBetter: false, calcFn: (t) => t.upsellsOfrecidos > 0 ? (t.upsellsAceptados / t.upsellsOfrecidos) * 100 : 0 },
                { key: "importeUpsell", label: "Importe Upsell", type: "sum", unit: "EUR" },
                { key: "pedidosRecuperados", label: "Pedidos Recuper.", type: "sum", unit: "" },
                { key: "importeRecuperado", label: "Importe Recuper.", type: "sum", unit: "EUR" },
                { key: "facturacionGenerada", label: "Fact. Generada", type: "sum", unit: "EUR" },
                { key: "facturacionHora", label: "Fact. x Hora", type: "calc", unit: "EUR", calcFn: (t) => t.tiempoTotal > 0 ? t.facturacionGenerada / t.tiempoTotal : 0 },
                { key: "scoreRendimiento", label: "Score Rend.", type: "avg", unit: "" },
            ];
        }

        if (activeTab === "AGENTES") {
            return [
                periodCol,
                { key: "nombre", label: "Agente", type: "string", unit: "" },
                { key: "tipo", label: "Tipo", type: "string", unit: "" },
                { key: "interacciones", label: "Interacc. Total", type: "sum", unit: "" },
                { key: "conversCompletas", label: "Convers. Complet.", type: "sum", unit: "" },
                { key: "tasaCompletado", label: "Tasa Complet.", type: "calc", unit: "%", thresholds: [80, 50], lowerIsBetter: false, calcFn: (t) => t.interacciones > 0 ? (t.conversCompletas / t.interacciones) * 100 : 0 },
                { key: "resueltosAuton", label: "Resueltos Autón.", type: "sum", unit: "" },
                { key: "escalados", label: "Escalados Humano", type: "sum", unit: "" },
                { key: "tasaResolucion", label: "Tasa Resoluc.", type: "calc", unit: "%", thresholds: [70, 40], lowerIsBetter: false, calcFn: (t) => t.conversCompletas > 0 ? (t.resueltosAuton / t.conversCompletas) * 100 : 0 },
                { key: "tasaEscalado", label: "Tasa Escalado", type: "calc", unit: "%", thresholds: [20, 40], lowerIsBetter: true, calcFn: (t) => t.conversCompletas > 0 ? (t.escalados / t.conversCompletas) * 100 : 0 },
                { key: "consultasRecibidas", label: "Consultas Recibidas", type: "sum", unit: "" },
                { key: "consultasResueltas", label: "Consultas Resueltas", type: "sum", unit: "" },
                { key: "tiempoRespuesta", label: "T. Resp. (s)", type: "avg", unit: "" },
                { key: "satisfaccion", label: "Satisf. /5", type: "avg", unit: "" },
                { key: "csat", label: "CSAT %", type: "avg", unit: "%" },
                { key: "quejasGest", label: "Quejas Gestión.", type: "sum", unit: "" },
                { key: "quejasResueltas", label: "Quejas Resueltas", type: "sum", unit: "" },
                { key: "tasaQuejas", label: "Tasa Quejas", type: "calc", unit: "%", thresholds: [80, 50], lowerIsBetter: false, calcFn: (t) => t.quejasGest > 0 ? (t.quejasResueltas / t.quejasGest) * 100 : 0 },
                { key: "pedidosInfluenc", label: "Pedidos Influenc.", type: "sum", unit: "" },
                { key: "upsellsSugeridos", label: "Upsells Sugeridos", type: "sum", unit: "" },
                { key: "upsellsAceptados", label: "Upsells Aceptados", type: "sum", unit: "" },
                { key: "tasaUpsell", label: "Tasa Upsell", type: "calc", unit: "%", thresholds: [25, 15], lowerIsBetter: false, calcFn: (t) => t.upsellsSugeridos > 0 ? (t.upsellsAceptados / t.upsellsSugeridos) * 100 : 0 },
                { key: "facturacionInfluenc", label: "Fact. Influenc.", type: "sum", unit: "EUR" },
                { key: "importeUpsell", label: "Importe Upsell", type: "sum", unit: "EUR" },
                { key: "incidGestionadas", label: "Incid. Gestión.", type: "sum", unit: "" },
                { key: "incidRecuperadas", label: "Incid. Recuper.", type: "sum", unit: "" },
                { key: "tasaRecuperacion", label: "Tasa Recup.", type: "calc", unit: "%", thresholds: [80, 50], lowerIsBetter: false, calcFn: (t) => t.incidGestionadas > 0 ? (t.incidRecuperadas / t.incidGestionadas) * 100 : 0 },
                { key: "tokens", label: "Tokens", type: "sum", unit: "" },
                { key: "coste", label: "Coste €", type: "sum", unit: "EUR" },
                { key: "costeInteraccion", label: "Coste x Interac.", type: "calc", unit: "EUR", calcFn: (t) => t.interacciones > 0 ? t.coste / t.interacciones : 0 },
                { key: "ahorro", label: "Ahorro €", type: "sum", unit: "EUR" },
                { key: "roi", label: "ROI Agente", type: "calc", unit: "%", calcFn: (t) => t.coste > 0 ? (t.ahorro / t.coste) * 100 : 0 },
                { key: "score", label: "Score Rend.", type: "avg", unit: "" },
            ];
        }

        // Default estandar anterior fallback hasta que pongamos el resto de tabs
        return [
            periodCol,
            { key: "facturacion", label: "Facturación", type: "sum", unit: "EUR" },
            { key: "pedidos", label: "Pedidos", type: "sum" },
            { key: "entregados", label: "Entregados", type: "sum" },
            { key: "tasaEntrega", label: "Tasa Entrega", type: "calc", unit: "%", thresholds: [85, 70], lowerIsBetter: false, calcFn: (t) => t.pedidos > 0 ? (t.entregados / t.pedidos) * 100 : 0 },
            { key: "incidencias", label: "Incidencias", type: "sum" },
            { key: "tasaIncidencias", label: "Tasa Incid.", type: "calc", unit: "%", thresholds: [5, 10], lowerIsBetter: true, calcFn: (t) => t.pedidos > 0 ? (t.incidencias / t.pedidos) * 100 : 0 },
            { key: "ticketMedio", label: "Ticket Medio", type: "calc", unit: "EUR", calcFn: (t) => t.pedidos > 0 ? t.facturacion / t.pedidos : 0 },
            { key: "beneficioNeto", label: "Benef. Neto", type: "sum", unit: "EUR" },
            { key: "margen", label: "Margen Neto", type: "calc", unit: "%", thresholds: [25, 15], lowerIsBetter: false, calcFn: (t) => t.facturacion > 0 ? (t.beneficioNeto / t.facturacion) * 100 : 0 },
        ];
    }, [viewMode, activeTab]);

    const tableTotals = React.useMemo(() => {
        const t: any = {};
        // Primero computa las sumas y promedios base
        tableColumns.forEach(col => {
            if (col.key === "label" || col.type === "calc") return;
            const valid = tableData.filter(r => typeof (r as any)[col.key] === "number");
            const sum = valid.reduce((acc, r) => acc + ((r as any)[col.key] || 0), 0);
            t[col.key] = (col.type === "avg" || col.type === "rate") ? (valid.length ? sum / valid.length : 0) : sum;
        });

        // Luego ejecuta los campos calculados basados en los totales purificados
        tableColumns.forEach(col => {
            if (col.type === "calc" && col.calcFn) {
                t[col.key] = col.calcFn(t);
            }
        });

        return t;
    }, [tableData, tableColumns]);

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

                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                            {viewMode !== "annual" && (
                                <select value={selectedMonth} onChange={e => { setSelectedMonth(Number(e.target.value)); setActiveWeek(0); }}
                                    style={{ padding: "4px 8px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px", fontWeight: 700 }}>
                                    {Array.from({ length: 12 }, (_, i) => (
                                        <option key={i + 1} value={i + 1}>
                                            {new Date(2024, i, 1).toLocaleString("es-ES", { month: "long" })}
                                        </option>
                                    ))}
                                </select>
                            )}
                            <select value={selectedYear} onChange={e => { setSelectedYear(Number(e.target.value)); setActiveWeek(0); }}
                                style={{ padding: "4px 8px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px", fontWeight: 700 }}>
                                {[2023, 2024, 2025, 2026].map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
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
                            <CRMTable rows={tableData} columns={tableColumns} totals={tableTotals} />
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

                    {quarterlySummary.length > 0 && viewMode === "annual" && (
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: `repeat(4, 1fr)`,
                            gap: "10px",
                            marginBottom: "16px",
                            marginTop: "8px"
                        }}>
                            {quarterlySummary.map((q: QuarterSummary, i: number) => (
                                <div key={i} style={{
                                    background: "white",
                                    borderRadius: "12px",
                                    border: "1px solid #e2e8f0",
                                    padding: "12px 14px",
                                    cursor: "pointer",
                                    outline: activeWeek === i ? "2px solid #7c3aed" : "none"
                                }}
                                    onClick={() => setActiveWeek(i)}
                                >
                                    {/* Header tarjeta */}
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                                        <div>
                                            <p style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8", margin: 0 }}>
                                                {q.label}
                                            </p>
                                            <p style={{ fontSize: "8px", color: "#cbd5e1", margin: 0 }}>{q.dateRange}</p>
                                        </div>
                                        {/* Variación vs Q anterior */}
                                        {q.varVsPrev !== null && (
                                            <span style={{
                                                fontSize: "9px", fontWeight: 700,
                                                color: q.varVsPrev >= 0 ? "#22c55e" : "#ef4444",
                                                background: q.varVsPrev >= 0 ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                                                borderRadius: "4px", padding: "1px 5px"
                                            }}>
                                                {q.varVsPrev >= 0 ? "↑" : "↓"}{Math.abs(q.varVsPrev)}%
                                            </span>
                                        )}
                                    </div>

                                    {/* Métrica principal */}
                                    <p style={{ fontSize: "18px", fontWeight: 900, color: "#1e293b", margin: "0 0 4px 0" }}>
                                        {formatValue(q.facturacion, "EUR")}
                                    </p>

                                    {/* Métricas secundarias */}
                                    <div style={{ display: "flex", gap: "8px", fontSize: "10px", color: "#64748b" }}>
                                        <span>{q.pedidos} ped.</span>
                                        <span>·</span>
                                        <span>{q.entregados} entr.</span>
                                        <span>·</span>
                                        <span style={{ color: q.incidencias > 0 ? "#ef4444" : "#94a3b8" }}>
                                            {q.incidencias} inc.
                                        </span>
                                    </div>

                                    {/* Margen */}
                                    <p style={{
                                        fontSize: "10px", fontWeight: 700, marginTop: "4px",
                                        color: q.margen >= 20 ? "#22c55e" : q.margen >= 10 ? "#eab308" : "#ef4444"
                                    }}>
                                        Margen: {q.margen}%
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Gráfica */}
                    {chartData.length > 0 && (
                        <CRMChart data={chartData} viewMode={viewMode} tab={activeTab} />
                    )}

                </div>
            )}

            {/* Agente Compañante Inyectado, pide perfil crm-forense si existiese */}
            <AgentCompanion pageContext={contextForAgent} agentRole="crm-forense" />
        </div>
    );
}
