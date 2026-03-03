'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store/store-context';
import { RefreshCw, Search, Filter, MoreHorizontal } from 'lucide-react';
import { ORDER_STATES, OrderState } from '@/lib/orderStates';

const ACTIONS_BY_STATE: Record<OrderState, string[]> = {
    nuevo: ["asignar", "confirmar", "cancelar"],
    en_gestion: ["confirmar", "cancelar", "notas"],
    confirmado: ["marcar_enviado", "editar", "cancelar"],
    en_preparacion: ["marcar_enviado", "cancelar"],
    enviado: ["ver_tracking", "marcar_entregado", "reportar_incidencia"],
    entregado: ["ver_detalle", "gestionar_devolucion"],
    fallido: ["reintentar", "cancelar", "reportar_incidencia"],
    reintento: ["marcar_enviado", "cancelar"],
    devolucion: ["procesar_devolucion", "reenviar"],
    cancelado: ["ver_detalle"],
};

const ACTIONS_BY_CHECKOUT = [
    "enviar_whatsapp_recuperacion",  // bot manda mensaje con link checkout
    "enviar_email_recuperacion",     // email con abandoned_checkout_url
    "crear_borrador",                // convertir en draft_order
    "marcar_recuperado",             // tracking manual
];

const segmentacionUrgencia = (horasDesdeAbandono: number) =>
    horasDesdeAbandono < 1 ? "alta" :
        horasDesdeAbandono < 24 ? "media" : "baja";

const TABS = [
    { id: 'todos', label: 'Todos' },
    { id: 'por-gestionar', label: 'Por Gestionar' },
    { id: 'en-transito', label: 'En Tránsito' },
    { id: 'incidencias', label: 'Incidencias' },
    { id: 'devoluciones', label: 'Devoluciones' },
    { id: 'carritos-abandonados', label: 'Carritos Abandonados' },
    { id: 'borradores', label: 'Borradores' },
    { id: 'historial', label: 'Historial' }
];

export default function PedidosPage() {
    const { activeStoreId: storeId } = useStore();
    const [activeTab, setActiveTab] = useState('todos');

    const pedidos = [
        ...Array(42).fill({ state: 'nuevo' }),
        ...Array(18).fill({ state: 'en_gestion' }),
        ...Array(85).fill({ state: 'enviado' }),
        ...Array(10).fill({ state: 'confirmado' }),
        ...Array(30).fill({ state: 'en_preparacion' }),
        ...Array(5).fill({ state: 'fallido' }),
        ...Array(12).fill({ state: 'reintento' }),
        ...Array(31).fill({ state: 'devolucion' }),
        ...Array(15).fill({ state: 'entregado' }),
        ...Array(6).fill({ state: 'cancelado' }),
    ];
    const carritosAbandonados = Array(12).fill({ state: 'abandonado' });
    const borradores = Array(5).fill({ state: 'borrador' });

    const pedidosFiltrados = {
        "todos": pedidos,
        "por-gestionar": pedidos.filter(p => ["nuevo", "en_gestion"].includes(p.state)),
        "en-transito": pedidos.filter(p => ["enviado", "confirmado", "en_preparacion"].includes(p.state)),
        "incidencias": pedidos.filter(p => ["fallido", "reintento"].includes(p.state)),
        "devoluciones": pedidos.filter(p => p.state === "devolucion"),
        "carritos-abandonados": carritosAbandonados,
        "borradores": borradores,
        "historial": pedidos.filter(p => ["entregado", "cancelado"].includes(p.state)),
    }[activeTab as string] ?? pedidos;



    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px", animation: "fade-in 0.3s ease-out" }}>
            {/* Header + Actions */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                    <h1 style={{ fontSize: "20px", fontWeight: 800, color: "var(--color-text-primary)", letterSpacing: "-0.02em" }}>
                        Gestión de Pedidos
                    </h1>
                    <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px", fontWeight: 500 }}>
                        Control y seguimiento unificado del fulfillment (Shopify, Beeping, Dropea, Dropi)
                    </p>
                </div>

                {/* Global Actions */}
                <div style={{ display: "flex", gap: "8px" }}>
                    <div style={{ position: "relative", width: "240px" }}>
                        <Search style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", width: "14px", height: "14px", color: "var(--text-dim)" }} />
                        <input
                            type="text"
                            placeholder="Buscar pedido, cliente, teléfono..."
                            className="ds-input"
                            style={{ paddingLeft: "32px", width: "100%" }}
                        />
                    </div>
                    <button className="ds-btn" style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)", textTransform: "none", letterSpacing: "normal", fontSize: "11px" }}>
                        <Filter className="w-3.5 h-3.5" />
                        Filtros
                    </button>
                </div>
            </div>

            <div className="module-tabs" style={{ '--tab-color': 'var(--ops)' } as React.CSSProperties}>
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        className={`module-tab ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Conditional KPIs for Por Gestionar */}
            {activeTab === 'por-gestionar' && (
                <div style={{ display: "flex", gap: "16px", marginBottom: "-8px" }}>
                    {[
                        { label: "Sin gestionar", value: pedidosFiltrados.filter(p => p.state === 'nuevo').length.toString(), color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe" },
                        { label: "En gestión", value: pedidosFiltrados.filter(p => p.state === 'en_gestion').length.toString(), color: "#eab308", bg: "#fefce8", border: "#fde047" },
                        { label: "Fallidos", value: pedidosFiltrados.filter(p => p.state === 'fallido').length.toString(), color: "#ef4444", bg: "#fef2f2", border: "#fecaca" },
                        { label: "Reintentos", value: pedidosFiltrados.filter(p => p.state === 'reintento').length.toString(), color: "#f97316", bg: "#fff7ed", border: "#fed7aa" }
                    ].map((kpi, i) => (
                        <div key={i} className="ds-card" style={{ flex: 1, padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-secondary)" }}>{kpi.label}</span>
                            <div style={{ background: kpi.bg, color: kpi.color, border: `1px solid ${kpi.border}`, padding: "4px 12px", borderRadius: "8px", fontSize: "14px", fontWeight: 800 }}>
                                {kpi.value}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Conditional KPIs for En Tránsito */}
            {activeTab === 'en-transito' && (
                <div style={{ display: "flex", gap: "16px", marginBottom: "-8px" }}>
                    {[
                        { label: "En tránsito", value: pedidosFiltrados.filter(p => p.state === 'enviado').length.toString(), color: "#0ea5e9", bg: "#f0f9ff", border: "#bae6fd" },
                        { label: "Con retraso", value: "14", color: "#ef4444", bg: "#fef2f2", border: "#fecaca" },
                        { label: "Entregados hoy", value: "32", color: "#10b981", bg: "#ecfdf5", border: "#a7f3d0" },
                        { label: "Tasa entrega 7d", value: "94%", color: "#8b5cf6", bg: "#f5f3ff", border: "#ddd6fe" }
                    ].map((kpi, i) => (
                        <div key={i} className="ds-card" style={{ flex: 1, padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-secondary)" }}>{kpi.label}</span>
                            <div style={{ background: kpi.bg, color: kpi.color, border: `1px solid ${kpi.border}`, padding: "4px 12px", borderRadius: "8px", fontSize: "14px", fontWeight: 800 }}>
                                {kpi.value}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Conditional KPIs for Incidencias */}
            {activeTab === 'incidencias' && (
                <div style={{ display: "flex", gap: "16px", marginBottom: "-8px" }}>
                    {[
                        { label: "Incidencias abiertas", value: pedidosFiltrados.length.toString(), color: "#ef4444", bg: "#fef2f2", border: "#fecaca" },
                        { label: "Recuperadas hoy", value: "8", color: "#10b981", bg: "#ecfdf5", border: "#a7f3d0" },
                        { label: "Tasa recuperación", value: "65%", color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe" },
                        { label: "Pérdida estimada", value: "€340", color: "#f97316", bg: "#fff7ed", border: "#fed7aa" }
                    ].map((kpi, i) => (
                        <div key={i} className="ds-card" style={{ flex: 1, padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-secondary)" }}>{kpi.label}</span>
                            <div style={{ background: kpi.bg, color: kpi.color, border: `1px solid ${kpi.border}`, padding: "4px 12px", borderRadius: "8px", fontSize: "14px", fontWeight: 800 }}>
                                {kpi.value}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Conditional KPIs for Devoluciones */}
            {activeTab === 'devoluciones' && (
                <div style={{ display: "flex", gap: "16px", marginBottom: "-8px" }}>
                    {[
                        { label: "Devoluciones activas", value: pedidosFiltrados.length.toString(), color: "#f97316", bg: "#fff7ed", border: "#fed7aa" },
                        { label: "Importe total", value: "€1,250", color: "#ef4444", bg: "#fef2f2", border: "#fecaca" },
                        { label: "Procesadas hoy", value: "12", color: "#10b981", bg: "#ecfdf5", border: "#a7f3d0" },
                        { label: "Tasa devolución", value: "3.2%", color: "#8b5cf6", bg: "#f5f3ff", border: "#ddd6fe" }
                    ].map((kpi, i) => (
                        <div key={i} className="ds-card" style={{ flex: 1, padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-secondary)" }}>{kpi.label}</span>
                            <div style={{ background: kpi.bg, color: kpi.color, border: `1px solid ${kpi.border}`, padding: "4px 12px", borderRadius: "8px", fontSize: "14px", fontWeight: 800 }}>
                                {kpi.value}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Conditional KPIs for Carritos Abandonados */}
            {activeTab === 'carritos-abandonados' && (
                <div style={{ display: "flex", gap: "16px", marginBottom: "-8px" }}>
                    {[
                        { label: "Carritos abandonados", value: "12", color: "#f97316", bg: "#fff7ed", border: "#fed7aa" },
                        { label: "Valor potencial", value: "€850", color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe" },
                        { label: "Tasa recuperación", value: "25%", color: "#10b981", bg: "#ecfdf5", border: "#a7f3d0" },
                        { label: "Recuperado", value: "€212.50", color: "#8b5cf6", bg: "#f5f3ff", border: "#ddd6fe" }
                    ].map((kpi, i) => (
                        <div key={i} className="ds-card" style={{ flex: 1, padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-secondary)" }}>{kpi.label}</span>
                            <div style={{ background: kpi.bg, color: kpi.color, border: `1px solid ${kpi.border}`, padding: "4px 12px", borderRadius: "8px", fontSize: "14px", fontWeight: 800 }}>
                                {kpi.value}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Conditional KPIs for Historial */}
            {activeTab === 'historial' && (
                <div style={{ display: "flex", gap: "16px", marginBottom: "-8px" }}>
                    {[
                        { label: "Entregados total", value: pedidosFiltrados.filter(p => p.state === 'entregado').length.toString(), color: "#10b981", bg: "#ecfdf5", border: "#a7f3d0" },
                        { label: "Cancelados total", value: pedidosFiltrados.filter(p => p.state === 'cancelado').length.toString(), color: "#ef4444", bg: "#fef2f2", border: "#fecaca" },
                        { label: "Tasa éxito", value: "88.5%", color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe" },
                        { label: "Facturación total", value: "€148.5K", color: "#8b5cf6", bg: "#f5f3ff", border: "#ddd6fe" }
                    ].map((kpi, i) => (
                        <div key={i} className="ds-card" style={{ flex: 1, padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-secondary)" }}>{kpi.label}</span>
                            <div style={{ background: kpi.bg, color: kpi.color, border: `1px solid ${kpi.border}`, padding: "4px 12px", borderRadius: "8px", fontSize: "14px", fontWeight: 800 }}>
                                {kpi.value}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Content Body */}
            <div className="ds-card" style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: "500px", overflow: "hidden" }}>
                {/* Controls Bar */}
                <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
                    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                        <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text)" }}>
                            {TABS.find(t => t.id === activeTab)?.label}
                        </span>
                        <span style={{ fontSize: "11px", color: "var(--text-muted)", padding: "2px 8px", background: "white", borderRadius: "10px", border: "1px solid var(--border)", fontWeight: 600 }}>
                            {pedidosFiltrados.length} {activeTab === 'carritos-abandonados' ? 'carritos' : activeTab === 'borradores' ? 'borradores' : 'pedidos'}
                        </span>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                        {activeTab === 'historial' && (
                            <select className="ds-input" style={{ fontSize: "11px", height: "30px", padding: "0 12px", background: "white", width: "120px" }}>
                                <option>Este mes</option>
                                <option>Mes anterior</option>
                                <option>Este año</option>
                                <option>Histórico completo</option>
                            </select>
                        )}
                        <button className="ds-btn" style={{ background: "white", color: "var(--text-muted)", textTransform: "none", letterSpacing: "normal", fontSize: "11px", fontWeight: 600 }}>
                            <RefreshCw className="w-3.5 h-3.5" />
                            Sincronizar Estados
                        </button>
                    </div>
                </div>

                {/* Mock Table */}

                {/* Custom compact table styles */}
                <style>{`
                    .ds-compact-table th {
                        padding: 8px 8px !important;
                        white-space: nowrap;
                    }
                    .ds-compact-table td {
                        padding: 6px 8px !important;
                        font-size: 12px;
                        white-space: nowrap !important;
                    }
                `}</style>
                <div style={{ overflowX: "auto", flex: 1 }}>
                    <table className="ds-table ds-compact-table" style={{ borderTop: "none" }}>
                        <thead>
                            <tr>
                                <th style={{ width: "40px", padding: "12px" }}>
                                    <input type="checkbox" style={{ borderRadius: "4px", border: "1px solid var(--border-high)" }} />
                                </th>
                                {activeTab === 'carritos-abandonados' ? (
                                    <>
                                        <th style={{ color: "var(--color-text-secondary)", fontSize: "10px", textTransform: "uppercase" }}>ID</th>
                                        <th style={{ color: "var(--color-text-secondary)", fontSize: "10px", textTransform: "uppercase" }}>Cliente</th>
                                        <th style={{ color: "var(--color-text-secondary)", fontSize: "10px", textTransform: "uppercase" }}>Teléfono</th>
                                        <th style={{ color: "var(--color-text-secondary)", fontSize: "10px", textTransform: "uppercase" }}>Producto</th>
                                        <th style={{ color: "var(--color-text-secondary)", fontSize: "10px", textTransform: "uppercase", textAlign: "right" }}>Importe €</th>
                                        <th style={{ color: "var(--color-text-secondary)", fontSize: "10px", textTransform: "uppercase" }}>UTM Source</th>
                                        <th style={{ color: "var(--color-text-secondary)", fontSize: "10px", textTransform: "uppercase" }}>UTM Campaign</th>
                                        <th style={{ color: "var(--color-text-secondary)", fontSize: "10px", textTransform: "uppercase" }}>Landing</th>
                                        <th style={{ color: "var(--color-text-secondary)", fontSize: "10px", textTransform: "uppercase" }}>Dispositivo</th>
                                        <th style={{ color: "var(--color-text-secondary)", fontSize: "10px", textTransform: "uppercase" }}>Abandono Hace</th>
                                        <th style={{ color: "var(--color-text-secondary)", fontSize: "10px", textTransform: "uppercase" }}>Estado</th>
                                        <th style={{ color: "var(--color-text-secondary)", width: "40px", textAlign: "center" }}></th>
                                    </>
                                ) : activeTab === 'borradores' ? (
                                    <>
                                        <th style={{ color: "var(--color-text-secondary)", fontSize: "10px", textTransform: "uppercase" }}>ID</th>
                                        <th style={{ color: "var(--color-text-secondary)", fontSize: "10px", textTransform: "uppercase" }}>Cliente</th>
                                        <th style={{ color: "var(--color-text-secondary)", fontSize: "10px", textTransform: "uppercase" }}>Últ. Actualización</th>
                                        <th style={{ color: "var(--color-text-secondary)", width: "40px", textAlign: "center" }}></th>
                                    </>
                                ) : (
                                    <>
                                        <th style={{ color: "var(--color-text-secondary)", fontSize: "10px", textTransform: "uppercase", width: "90px" }}>Pedido</th>
                                        <th style={{ color: "var(--color-text-secondary)", fontSize: "10px", textTransform: "uppercase", width: "115px" }}>Estado</th>
                                        <th style={{ color: "var(--color-text-secondary)", fontSize: "10px", textTransform: "uppercase", width: "105px" }}>Fulfillment</th>
                                        <th style={{ color: "var(--color-text-secondary)", fontSize: "10px", textTransform: "uppercase", width: "115px" }}>Transportista</th>
                                        <th style={{ color: "var(--color-text-secondary)", fontSize: "10px", textTransform: "uppercase", width: "150px" }}>Cliente</th>
                                        <th style={{ color: "var(--color-text-secondary)", fontSize: "10px", textTransform: "uppercase", width: "100px" }}>CP / Zona</th>
                                        <th style={{ color: "var(--color-text-secondary)", fontSize: "10px", textTransform: "uppercase", width: "160px" }}>Producto</th>
                                        <th style={{ color: "var(--color-text-secondary)", fontSize: "10px", textTransform: "uppercase", textAlign: "right", width: "85px" }}>Importe</th>
                                        <th style={{ color: "var(--color-text-secondary)", fontSize: "10px", textTransform: "uppercase", width: "120px" }}>Pago / Gestor</th>
                                        <th style={{ color: "var(--color-text-secondary)", fontSize: "10px", textTransform: "uppercase", width: "110px" }}>Riesgo</th>

                                        {activeTab === 'incidencias' && (
                                            <>
                                                <th style={{ color: "var(--color-text-secondary)", fontSize: "10px", textTransform: "uppercase" }}>Tipo Incid.</th>
                                                <th style={{ color: "var(--color-text-secondary)", fontSize: "10px", textTransform: "uppercase", textAlign: "center" }}>Intentos</th>
                                                <th style={{ color: "var(--color-text-secondary)", fontSize: "10px", textTransform: "uppercase" }}>Días Abierta</th>
                                                <th style={{ color: "#ef4444", fontSize: "10px", textTransform: "uppercase", textAlign: "right" }}>Pérdida Est.</th>
                                            </>
                                        )}

                                        {activeTab === 'devoluciones' && (
                                            <>
                                                <th style={{ color: "var(--color-text-secondary)", fontSize: "10px", textTransform: "uppercase" }}>Motivo Devol.</th>
                                                <th style={{ color: "var(--color-text-secondary)", fontSize: "10px", textTransform: "uppercase", textAlign: "right" }}>Importe Devol.</th>
                                                <th style={{ color: "var(--color-text-secondary)", fontSize: "10px", textTransform: "uppercase", textAlign: "center" }}>Estado Devol.</th>
                                                <th style={{ color: "var(--color-text-secondary)", fontSize: "10px", textTransform: "uppercase", textAlign: "right" }}>Reembolso</th>
                                            </>
                                        )}

                                        {activeTab === 'en-transito' && <th style={{ color: "var(--color-text-secondary)", fontSize: "10px", textTransform: "uppercase" }}>Días</th>}
                                        <th style={{ color: "var(--color-text-secondary)", fontSize: "10px", textTransform: "uppercase", width: "85px" }}>Entrada</th>
                                        <th style={{ color: "var(--color-text-secondary)", width: "40px", textAlign: "center" }}></th>
                                    </>
                                )}
                            </tr>
                        </thead>
                        <tbody>

                            {/* Example Row - 10045 */}
                            {activeTab !== 'por-gestionar' && activeTab !== 'en-transito' && activeTab !== 'incidencias' && activeTab !== 'devoluciones' && activeTab !== 'historial' && activeTab !== 'carritos-abandonados' && activeTab !== 'borradores' && (
                                <tr>
                                    <td style={{ padding: "12px", minHeight: "56px" }}>
                                        <input type="checkbox" style={{ borderRadius: "4px", border: "1px solid var(--border-high)" }} />
                                    </td>
                                    <td>
                                        <span style={{ fontSize: "13px", fontWeight: 700, color: "#3b82f6", display: "block" }}>#10045</span>
                                        <span style={{ fontSize: "10px", color: "#94a3b8", display: "block" }}>#910045</span>
                                    </td>
                                    <td>
                                        <span style={{
                                            display: "inline-flex", alignItems: "center", gap: "4px",
                                            padding: "2px 8px", borderRadius: "20px",
                                            fontSize: "10px", fontWeight: 700,
                                            background: ORDER_STATES.en_preparacion.bg,
                                            color: ORDER_STATES.en_preparacion.color
                                        }}>
                                            <span style={{ fontSize: "6px" }}>{ORDER_STATES.en_preparacion.icon}</span>
                                            {ORDER_STATES.en_preparacion.label}
                                        </span>
                                    </td>
                                    <td>
                                        <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", background: "#ede9fe", border: "1px solid #ddd6fe", color: "#8b5cf6" }}>Beeping</span>
                                    </td>
                                    <td>
                                        <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", background: "#fef3c7", border: "1px solid #fde68a", color: "#d97706" }}>GLS</span>
                                    </td>
                                    <td>
                                        <span style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a", display: "block" }}>Juan Pérez</span>
                                        <span style={{ fontSize: "11px", color: "#64748b", display: "block", marginTop: "3px" }}>+34 600 000 000</span>
                                    </td>
                                    <td>
                                        <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", display: "block" }}>28001</span>
                                        <span style={{ fontSize: "11px", color: "#64748b", display: "block", marginTop: "3px" }}>Madrid</span>
                                    </td>
                                    <td>
                                        <span title="Zapatillas Nike Air Force" style={{ fontSize: "12px", fontWeight: 600, color: "#0f172a", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "155px" }}>
                                            Zapatillas Nike Air Force
                                        </span>
                                        <span style={{ fontSize: "11px", color: "#64748b", display: "block", marginTop: "3px" }}>Qty: 1</span>
                                    </td>
                                    <td>
                                        <span style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a" }}>€49.99</span>
                                    </td>
                                    <td>
                                        <span style={{ fontSize: "9px", fontWeight: 800, padding: "2px 6px", borderRadius: "4px", background: "#f1f5f9", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>COD</span>
                                        <span style={{ fontSize: "11px", color: "#64748b", display: "block", marginTop: "3px" }}>🤖 Bot COD</span>
                                    </td>
                                    <td>
                                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                            <span style={{ fontSize: "14px" }}>🟢</span>
                                            <span style={{ fontSize: "11px", fontWeight: 600, color: "#0f172a" }}>98</span>
                                        </div>
                                        <a href="#" target="_blank" onClick={e => e.stopPropagation()} style={{ fontSize: "10px", color: "#3b82f6", display: "block", marginTop: "3px", textDecoration: "underline", fontWeight: 600 }}>BP-1234444</a>
                                    </td>




                                    <td>
                                        <span style={{ fontSize: "12px", fontWeight: 600, color: "#0f172a", display: "block" }}>Hoy</span>
                                        <span style={{ fontSize: "11px", color: "#64748b", display: "block", marginTop: "3px" }}>10:42</span>
                                    </td>
                                    <td>
                                        <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px" }}>
                                            <MoreHorizontal size={14} />
                                        </button>
                                    </td>
                                </tr>
                            )}

                            {/* Example Row - 10046 */}
                            {activeTab !== 'en-transito' && activeTab !== 'incidencias' && activeTab !== 'devoluciones' && activeTab !== 'historial' && activeTab !== 'carritos-abandonados' && activeTab !== 'borradores' && (
                                <tr>
                                    <td style={{ padding: "12px", minHeight: "56px" }}>
                                        <input type="checkbox" style={{ borderRadius: "4px", border: "1px solid var(--border-high)" }} />
                                    </td>
                                    <td>
                                        <span style={{ fontSize: "13px", fontWeight: 700, color: "#3b82f6", display: "block" }}>#10046</span>
                                        <span style={{ fontSize: "10px", color: "#94a3b8", display: "block" }}>#910046</span>
                                    </td>
                                    <td>
                                        <span style={{
                                            display: "inline-flex", alignItems: "center", gap: "4px",
                                            padding: "2px 8px", borderRadius: "20px",
                                            fontSize: "10px", fontWeight: 700,
                                            background: ORDER_STATES.reintento.bg,
                                            color: ORDER_STATES.reintento.color
                                        }}>
                                            <span style={{ fontSize: "6px" }}>{ORDER_STATES.reintento.icon}</span>
                                            {ORDER_STATES.reintento.label}
                                        </span>
                                    </td>
                                    <td>
                                        <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", background: "#fce7f3", border: "1px solid #fbcfe8", color: "#ec4899" }}>Dropea</span>
                                    </td>
                                    <td>
                                        <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", background: "#fef3c7", border: "1px solid #fde68a", color: "#d97706" }}>GLS</span>
                                    </td>
                                    <td>
                                        <span style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a", display: "block" }}>María Gómez</span>
                                        <span style={{ fontSize: "11px", color: "#64748b", display: "block", marginTop: "3px" }}>+34 600 000 001</span>
                                    </td>
                                    <td>
                                        <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", display: "block" }}>41002</span>
                                        <span style={{ fontSize: "11px", color: "#64748b", display: "block", marginTop: "3px" }}>Sevilla</span>
                                    </td>
                                    <td>
                                        <span title="Camiseta Básica Blanca" style={{ fontSize: "12px", fontWeight: 600, color: "#0f172a", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "155px" }}>
                                            Camiseta Básica Blanca
                                        </span>
                                        <span style={{ fontSize: "11px", color: "#64748b", display: "block", marginTop: "3px" }}>Qty: 2</span>
                                    </td>
                                    <td>
                                        <span style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a" }}>€29.99</span>
                                    </td>
                                    <td>
                                        <span style={{ fontSize: "9px", fontWeight: 800, padding: "2px 6px", borderRadius: "4px", background: "#f1f5f9", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>STRIPE</span>
                                        <span style={{ fontSize: "11px", color: "#64748b", display: "block", marginTop: "3px" }}>👤 María G.</span>
                                    </td>
                                    <td>
                                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                            <span style={{ fontSize: "14px" }}>🟢</span>
                                            <span style={{ fontSize: "11px", fontWeight: 600, color: "#0f172a" }}>98</span>
                                        </div>
                                        <span style={{ fontSize: "10px", color: "#94a3b8", display: "block", marginTop: "3px", fontWeight: 600 }}>Sin tracking</span>
                                    </td>




                                    <td>
                                        <span style={{ fontSize: "12px", fontWeight: 600, color: "#0f172a", display: "block" }}>Hoy</span>
                                        <span style={{ fontSize: "11px", color: "#64748b", display: "block", marginTop: "3px" }}>10:35</span>
                                    </td>
                                    <td>
                                        <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px" }}>
                                            <MoreHorizontal size={14} />
                                        </button>
                                    </td>
                                </tr>
                            )}

                            {/* Example Row - 10047 */}
                            {activeTab === 'todos' || activeTab === 'por-gestionar' && (
                                <tr>
                                    <td style={{ padding: "12px", minHeight: "56px" }}>
                                        <input type="checkbox" style={{ borderRadius: "4px", border: "1px solid var(--border-high)" }} />
                                    </td>
                                    <td>
                                        <span style={{ fontSize: "13px", fontWeight: 700, color: "#3b82f6", display: "block" }}>#10047</span>
                                        <span style={{ fontSize: "10px", color: "#94a3b8", display: "block" }}>#910047</span>
                                    </td>
                                    <td>
                                        <span style={{
                                            display: "inline-flex", alignItems: "center", gap: "4px",
                                            padding: "2px 8px", borderRadius: "20px",
                                            fontSize: "10px", fontWeight: 700,
                                            background: ORDER_STATES.nuevo.bg,
                                            color: ORDER_STATES.nuevo.color
                                        }}>
                                            <span style={{ fontSize: "6px" }}>{ORDER_STATES.nuevo.icon}</span>
                                            {ORDER_STATES.nuevo.label}
                                        </span>
                                    </td>
                                    <td>
                                        <span style={{ fontSize: "11px", fontWeight: 600, color: "#94a3b8" }}>—</span>
                                    </td>
                                    <td>
                                        <span style={{ fontSize: "11px", fontWeight: 600, color: "#94a3b8" }}>—</span>
                                    </td>
                                    <td>
                                        <span style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a", display: "block" }}>Carlos López</span>
                                        <span style={{ fontSize: "11px", color: "#64748b", display: "block", marginTop: "3px" }}>+34 600 000 002</span>
                                    </td>
                                    <td>
                                        <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", display: "block" }}>08001</span>
                                        <span style={{ fontSize: "11px", color: "#64748b", display: "block", marginTop: "3px" }}>Barcelona</span>
                                    </td>
                                    <td>
                                        <span title="Sudadera Urban Black" style={{ fontSize: "12px", fontWeight: 600, color: "#0f172a", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "155px" }}>
                                            Sudadera Urban Black
                                        </span>
                                        <span style={{ fontSize: "11px", color: "#64748b", display: "block", marginTop: "3px" }}>Qty: 1</span>
                                    </td>
                                    <td>
                                        <span style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a" }}>€59.90</span>
                                    </td>
                                    <td>
                                        <span style={{ fontSize: "9px", fontWeight: 800, padding: "2px 6px", borderRadius: "4px", background: "#f1f5f9", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>COD</span>
                                        <span style={{ fontSize: "11px", color: "#64748b", display: "block", marginTop: "3px" }}>⚠️ Sin gest.</span>
                                    </td>
                                    <td>
                                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                            <span style={{ fontSize: "14px" }}>🟢</span>
                                            <span style={{ fontSize: "11px", fontWeight: 600, color: "#0f172a" }}>98</span>
                                        </div>
                                        <span style={{ fontSize: "10px", color: "#94a3b8", display: "block", marginTop: "3px", fontWeight: 600 }}>Sin tracking</span>
                                    </td>




                                    <td>
                                        <span style={{ fontSize: "12px", fontWeight: 600, color: "#0f172a", display: "block" }}>Ayer</span>
                                        <span style={{ fontSize: "11px", color: "#64748b", display: "block", marginTop: "3px" }}>18:20</span>
                                    </td>
                                    <td>
                                        <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px" }}>
                                            <MoreHorizontal size={14} />
                                        </button>
                                    </td>
                                </tr>
                            )}

                            {/* Example Row - 10048 */}
                            {activeTab === 'todos' || activeTab === 'en-transito' && (
                                <tr>
                                    <td style={{ padding: "12px", minHeight: "56px" }}>
                                        <input type="checkbox" style={{ borderRadius: "4px", border: "1px solid var(--border-high)" }} />
                                    </td>
                                    <td>
                                        <span style={{ fontSize: "13px", fontWeight: 700, color: "#3b82f6", display: "block" }}>#10048</span>
                                        <span style={{ fontSize: "10px", color: "#94a3b8", display: "block" }}>#910048</span>
                                    </td>
                                    <td>
                                        <span style={{
                                            display: "inline-flex", alignItems: "center", gap: "4px",
                                            padding: "2px 8px", borderRadius: "20px",
                                            fontSize: "10px", fontWeight: 700,
                                            background: ORDER_STATES.enviado.bg,
                                            color: ORDER_STATES.enviado.color
                                        }}>
                                            <span style={{ fontSize: "6px" }}>{ORDER_STATES.enviado.icon}</span>
                                            {ORDER_STATES.enviado.label}
                                        </span>
                                    </td>
                                    <td>
                                        <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", background: "#ede9fe", border: "1px solid #ddd6fe", color: "#8b5cf6" }}>Beeping</span>
                                    </td>
                                    <td>
                                        <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", background: "#bfdbfe", border: "1px solid #93c5fd", color: "#2563eb" }}>Correos Exp.</span>
                                    </td>
                                    <td>
                                        <span style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a", display: "block" }}>Ana Martínez</span>
                                        <span style={{ fontSize: "11px", color: "#64748b", display: "block", marginTop: "3px" }}>+34 600 000 003</span>
                                    </td>
                                    <td>
                                        <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", display: "block" }}>46001</span>
                                        <span style={{ fontSize: "11px", color: "#64748b", display: "block", marginTop: "3px" }}>Valencia</span>
                                    </td>
                                    <td>
                                        <span title="Auriculares Inalámbricos" style={{ fontSize: "12px", fontWeight: 600, color: "#0f172a", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "155px" }}>
                                            Auriculares Inalámbricos
                                        </span>
                                        <span style={{ fontSize: "11px", color: "#64748b", display: "block", marginTop: "3px" }}>Qty: 1</span>
                                    </td>
                                    <td>
                                        <span style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a" }}>€89.00</span>
                                    </td>
                                    <td>
                                        <span style={{ fontSize: "9px", fontWeight: 800, padding: "2px 6px", borderRadius: "4px", background: "#f1f5f9", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>TARJETA</span>
                                        <span style={{ fontSize: "11px", color: "#64748b", display: "block", marginTop: "3px" }}>👤 Sistema</span>
                                    </td>
                                    <td>
                                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                            <span style={{ fontSize: "14px" }}>🟢</span>
                                            <span style={{ fontSize: "11px", fontWeight: 600, color: "#0f172a" }}>98</span>
                                        </div>
                                        <a href="#" target="_blank" onClick={e => e.stopPropagation()} style={{ fontSize: "10px", color: "#3b82f6", display: "block", marginTop: "3px", textDecoration: "underline", fontWeight: 600 }}>PQ41029312</a>
                                    </td>



                                    {activeTab === 'en-transito' && (
                                        <td>
                                            <span style={{ fontSize: "10px", fontWeight: 800, padding: "4px 8px", borderRadius: "6px", background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca" }}>
                                                8 Días
                                            </span>
                                        </td>
                                    )}


                                    <td>
                                        <span style={{ fontSize: "12px", fontWeight: 600, color: "#0f172a", display: "block" }}>Hace 8d</span>
                                        <span style={{ fontSize: "11px", color: "#64748b", display: "block", marginTop: "3px" }}>12:05</span>
                                    </td>
                                    <td>
                                        <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px" }}>
                                            <MoreHorizontal size={14} />
                                        </button>
                                    </td>
                                </tr>
                            )}

                            {/* Example Row - 10049 */}
                            {activeTab === 'todos' || activeTab === 'incidencias' && (
                                <tr>
                                    <td style={{ padding: "12px", minHeight: "56px" }}>
                                        <input type="checkbox" style={{ borderRadius: "4px", border: "1px solid var(--border-high)" }} />
                                    </td>
                                    <td>
                                        <span style={{ fontSize: "13px", fontWeight: 700, color: "#3b82f6", display: "block" }}>#10049</span>
                                        <span style={{ fontSize: "10px", color: "#94a3b8", display: "block" }}>#910049</span>
                                    </td>
                                    <td>
                                        <span style={{
                                            display: "inline-flex", alignItems: "center", gap: "4px",
                                            padding: "2px 8px", borderRadius: "20px",
                                            fontSize: "10px", fontWeight: 700,
                                            background: ORDER_STATES.fallido.bg,
                                            color: ORDER_STATES.fallido.color
                                        }}>
                                            <span style={{ fontSize: "6px" }}>{ORDER_STATES.fallido.icon}</span>
                                            {ORDER_STATES.fallido.label}
                                        </span>
                                    </td>
                                    <td>
                                        <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", background: "#ede9fe", border: "1px solid #ddd6fe", color: "#8b5cf6" }}>Beeping</span>
                                    </td>
                                    <td>
                                        <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", background: "#fef3c7", border: "1px solid #fde68a", color: "#d97706" }}>GLS</span>
                                    </td>
                                    <td>
                                        <span style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a", display: "block" }}>Luis García</span>
                                        <span style={{ fontSize: "11px", color: "#64748b", display: "block", marginTop: "3px" }}>+34 600 000 004</span>
                                    </td>
                                    <td>
                                        <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", display: "block" }}>29001</span>
                                        <span style={{ fontSize: "11px", color: "#64748b", display: "block", marginTop: "3px" }}>Málaga</span>
                                    </td>
                                    <td>
                                        <span title="Chaqueta Invierno XL" style={{ fontSize: "12px", fontWeight: 600, color: "#0f172a", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "155px" }}>
                                            Chaqueta Invierno XL
                                        </span>
                                        <span style={{ fontSize: "11px", color: "#64748b", display: "block", marginTop: "3px" }}>Qty: 1</span>
                                    </td>
                                    <td>
                                        <span style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a" }}>€120.00</span>
                                    </td>
                                    <td>
                                        <span style={{ fontSize: "9px", fontWeight: 800, padding: "2px 6px", borderRadius: "4px", background: "#f1f5f9", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>COD</span>
                                        <span style={{ fontSize: "11px", color: "#64748b", display: "block", marginTop: "3px" }}>👤 María G.</span>
                                    </td>
                                    <td>
                                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                            <span style={{ fontSize: "14px" }}>🟢</span>
                                            <span style={{ fontSize: "11px", fontWeight: 600, color: "#0f172a" }}>98</span>
                                        </div>
                                        <span style={{ fontSize: "10px", color: "#94a3b8", display: "block", marginTop: "3px", fontWeight: 600 }}>Sin tracking</span>
                                    </td>


                                    {activeTab === 'incidencias' && (
                                        <>
                                            <td>
                                                <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 6px", borderRadius: "4px", background: "#fee2e2", color: "#b91c1c", whiteSpace: "nowrap" }}>
                                                    Dirección Incorrecta
                                                </span>
                                            </td>
                                            <td style={{ textAlign: "center", fontWeight: 800, color: "var(--color-text-secondary)" }}>2</td>
                                            <td>
                                                <span style={{ fontSize: "10px", fontWeight: 700 }}>4 días</span>
                                            </td>
                                            <td style={{ fontWeight: 800, textAlign: "right", color: "#ef4444" }}>€15.50</td>
                                        </>
                                    )}



                                    <td>
                                        <span style={{ fontSize: "12px", fontWeight: 600, color: "#0f172a", display: "block" }}>Hace 6d</span>
                                        <span style={{ fontSize: "11px", color: "#64748b", display: "block", marginTop: "3px" }}>09:12</span>
                                    </td>
                                    <td>
                                        <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px" }}>
                                            <MoreHorizontal size={14} />
                                        </button>
                                    </td>
                                </tr>
                            )}

                            {/* Example Row - 10050 */}
                            {activeTab === 'todos' || activeTab === 'devoluciones' && (
                                <tr>
                                    <td style={{ padding: "12px", minHeight: "56px" }}>
                                        <input type="checkbox" style={{ borderRadius: "4px", border: "1px solid var(--border-high)" }} />
                                    </td>
                                    <td>
                                        <span style={{ fontSize: "13px", fontWeight: 700, color: "#3b82f6", display: "block" }}>#10050</span>
                                        <span style={{ fontSize: "10px", color: "#94a3b8", display: "block" }}>#910050</span>
                                    </td>
                                    <td>
                                        <span style={{
                                            display: "inline-flex", alignItems: "center", gap: "4px",
                                            padding: "2px 8px", borderRadius: "20px",
                                            fontSize: "10px", fontWeight: 700,
                                            background: ORDER_STATES.devolucion.bg,
                                            color: ORDER_STATES.devolucion.color
                                        }}>
                                            <span style={{ fontSize: "6px" }}>{ORDER_STATES.devolucion.icon}</span>
                                            {ORDER_STATES.devolucion.label}
                                        </span>
                                    </td>
                                    <td>
                                        <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", background: "#ede9fe", border: "1px solid #ddd6fe", color: "#8b5cf6" }}>Beeping</span>
                                    </td>
                                    <td>
                                        <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", background: "#bfdbfe", border: "1px solid #93c5fd", color: "#2563eb" }}>Correos Exp.</span>
                                    </td>
                                    <td>
                                        <span style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a", display: "block" }}>Marta Díaz</span>
                                        <span style={{ fontSize: "11px", color: "#64748b", display: "block", marginTop: "3px" }}>+34 600 000 005</span>
                                    </td>
                                    <td>
                                        <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", display: "block" }}>03001</span>
                                        <span style={{ fontSize: "11px", color: "#64748b", display: "block", marginTop: "3px" }}>Alicante</span>
                                    </td>
                                    <td>
                                        <span title="Bolso Piel Sintética" style={{ fontSize: "12px", fontWeight: 600, color: "#0f172a", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "155px" }}>
                                            Bolso Piel Sintética
                                        </span>
                                        <span style={{ fontSize: "11px", color: "#64748b", display: "block", marginTop: "3px" }}>Qty: 1</span>
                                    </td>
                                    <td>
                                        <span style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a" }}>€49.90</span>
                                    </td>
                                    <td>
                                        <span style={{ fontSize: "9px", fontWeight: 800, padding: "2px 6px", borderRadius: "4px", background: "#f1f5f9", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>TARJETA</span>
                                        <span style={{ fontSize: "11px", color: "#64748b", display: "block", marginTop: "3px" }}>👤 María G.</span>
                                    </td>
                                    <td>
                                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                            <span style={{ fontSize: "14px" }}>🟢</span>
                                            <span style={{ fontSize: "11px", fontWeight: 600, color: "#0f172a" }}>98</span>
                                        </div>
                                        <a href="#" target="_blank" onClick={e => e.stopPropagation()} style={{ fontSize: "10px", color: "#3b82f6", display: "block", marginTop: "3px", textDecoration: "underline", fontWeight: 600 }}>PQ41029888</a>
                                    </td>


                                    {activeTab === 'devoluciones' && (
                                        <>
                                            <td><span style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-muted)" }}>Cliente Rechaza</span></td>
                                            <td style={{ fontWeight: 800, textAlign: "right", color: "var(--color-text-primary)" }}>€49.90</td>
                                            <td style={{ textAlign: "center" }}><span style={{ fontSize: "9px", fontWeight: 800, padding: "2px 6px", borderRadius: "12px", background: "#fef3c7", color: "#d97706" }}>En proceso</span></td>
                                            <td style={{ fontWeight: 800, textAlign: "right", color: "#64748b" }}>-</td>
                                        </>
                                    )}



                                    <td>
                                        <span style={{ fontSize: "12px", fontWeight: 600, color: "#0f172a", display: "block" }}>Hace 2d</span>
                                        <span style={{ fontSize: "11px", color: "#64748b", display: "block", marginTop: "3px" }}>14:15</span>
                                    </td>
                                    <td>
                                        <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px" }}>
                                            <MoreHorizontal size={14} />
                                        </button>
                                    </td>
                                </tr>
                            )}

                            {/* Example Row - 10041 */}
                            {activeTab === 'todos' || activeTab === 'historial' && (
                                <tr>
                                    <td style={{ padding: "12px", minHeight: "56px" }}>
                                        <input type="checkbox" style={{ borderRadius: "4px", border: "1px solid var(--border-high)" }} />
                                    </td>
                                    <td>
                                        <span style={{ fontSize: "13px", fontWeight: 700, color: "#3b82f6", display: "block" }}>#10041</span>
                                        <span style={{ fontSize: "10px", color: "#94a3b8", display: "block" }}>#910041</span>
                                    </td>
                                    <td>
                                        <span style={{
                                            display: "inline-flex", alignItems: "center", gap: "4px",
                                            padding: "2px 8px", borderRadius: "20px",
                                            fontSize: "10px", fontWeight: 700,
                                            background: ORDER_STATES.entregado.bg,
                                            color: ORDER_STATES.entregado.color
                                        }}>
                                            <span style={{ fontSize: "6px" }}>{ORDER_STATES.entregado.icon}</span>
                                            {ORDER_STATES.entregado.label}
                                        </span>
                                    </td>
                                    <td>
                                        <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", background: "#ede9fe", border: "1px solid #ddd6fe", color: "#8b5cf6" }}>Beeping</span>
                                    </td>
                                    <td>
                                        <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", background: "#fef3c7", border: "1px solid #fde68a", color: "#d97706" }}>GLS</span>
                                    </td>
                                    <td>
                                        <span style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a", display: "block" }}>Javier Nieto</span>
                                        <span style={{ fontSize: "11px", color: "#64748b", display: "block", marginTop: "3px" }}>+34 600 000 006</span>
                                    </td>
                                    <td>
                                        <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", display: "block" }}>15001</span>
                                        <span style={{ fontSize: "11px", color: "#64748b", display: "block", marginTop: "3px" }}>A Coruña</span>
                                    </td>
                                    <td>
                                        <span title="Monitor Gaming 24&quot;" style={{ fontSize: "12px", fontWeight: 600, color: "#0f172a", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "155px" }}>
                                            Monitor Gaming 24&quot;
                                        </span>
                                        <span style={{ fontSize: "11px", color: "#64748b", display: "block", marginTop: "3px" }}>Qty: 1</span>
                                    </td>
                                    <td>
                                        <span style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a" }}>€199.00</span>
                                    </td>
                                    <td>
                                        <span style={{ fontSize: "9px", fontWeight: 800, padding: "2px 6px", borderRadius: "4px", background: "#f1f5f9", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>TARJETA</span>
                                        <span style={{ fontSize: "11px", color: "#64748b", display: "block", marginTop: "3px" }}>👤 Sistema</span>
                                    </td>
                                    <td>
                                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                            <span style={{ fontSize: "14px" }}>🟢</span>
                                            <span style={{ fontSize: "11px", fontWeight: 600, color: "#0f172a" }}>98</span>
                                        </div>
                                        <a href="#" target="_blank" onClick={e => e.stopPropagation()} style={{ fontSize: "10px", color: "#3b82f6", display: "block", marginTop: "3px", textDecoration: "underline", fontWeight: 600 }}>GLS0012929</a>
                                    </td>




                                    <td>
                                        <span style={{ fontSize: "12px", fontWeight: 600, color: "#0f172a", display: "block" }}>Hace 12d</span>
                                        <span style={{ fontSize: "11px", color: "#64748b", display: "block", marginTop: "3px" }}>10:00</span>
                                    </td>
                                    <td>
                                        <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px" }}>
                                            <MoreHorizontal size={14} />
                                        </button>
                                    </td>
                                </tr>
                            )}


                            {/* Example Row - CARRITO ABANDONADO */}
                            {activeTab === 'carritos-abandonados' && (
                                <tr>
                                    <td style={{ padding: "12px", minHeight: "56px" }}>
                                        <input type="checkbox" style={{ borderRadius: "4px", border: "1px solid var(--border-high)" }} />
                                    </td>
                                    <td><a href="#" style={{ color: "var(--ops)", fontWeight: 700 }}>#C-4291</a></td>
                                    <td>Ana Martínez</td>
                                    <td style={{ color: "var(--text-muted)", fontSize: "11px" }}>+34 600 000 010</td>
                                    <td style={{ display: "flex", alignItems: "center", gap: "8px", paddingTop: "8px" }}>
                                        <div style={{ width: "24px", height: "24px", borderRadius: "4px", background: "#f1f5f9" }} />
                                        <div style={{ display: "flex", flexDirection: "column" }}>
                                            <span style={{ fontWeight: 600, fontSize: "11px", maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Pack Cosmética</span>
                                            <span style={{ color: "var(--text-dim)", fontSize: "10px", marginTop: "2px" }}>Qty: 2</span>
                                        </div>
                                    </td>
                                    <td style={{ fontWeight: 700, margin: "0 auto", textAlign: "right", color: "var(--color-text-primary)" }}>€89.00</td>
                                    <td><span style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-muted)" }}>ig_story</span></td>
                                    <td><span style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-muted)" }}>promo_sanvalentin</span></td>
                                    <td><span style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-muted)" }}>/p/cosmetica-pack</span></td>
                                    <td>
                                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                            <span style={{ fontSize: "12px" }}>📱</span>
                                            <span style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 600 }}>iPhone (iOS 17)</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span style={{ fontSize: "10px", fontWeight: 800, padding: "2px 6px", borderRadius: "12px", background: "#fee2e2", color: "#dc2626" }}>
                                            45 min
                                        </span>
                                    </td>
                                    <td>
                                        <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "20px", background: "#fef3c7", color: "#d97706" }}>
                                            Abandonado
                                        </span>
                                    </td>
                                    <td>
                                        <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px" }}>
                                            <MoreHorizontal size={14} />
                                        </button>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div >
    );
}
