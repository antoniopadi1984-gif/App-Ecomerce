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

const TABS = [
    { id: 'todos', label: 'Todos' },
    { id: 'por-gestionar', label: 'Por Gestionar' },
    { id: 'en-transito', label: 'En Tránsito' },
    { id: 'incidencias', label: 'Incidencias' },
    { id: 'devoluciones', label: 'Devoluciones' },
    { id: 'historial', label: 'Historial' }
];

export default function PedidosPage() {
    const { activeStoreId: storeId } = useStore();
    const [activeTab, setActiveTab] = useState('todos');

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

            {/* Tabs */}
            <div className="module-tabs" style={{ '--tab-color': 'var(--ops)' } as any}>
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
                        { label: "Sin gestionar", value: "42", color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe" },
                        { label: "En gestión", value: "18", color: "#eab308", bg: "#fefce8", border: "#fde047" },
                        { label: "Fallidos", value: "5", color: "#ef4444", bg: "#fef2f2", border: "#fecaca" },
                        { label: "Reintentos", value: "12", color: "#f97316", bg: "#fff7ed", border: "#fed7aa" }
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
                        { label: "En tránsito", value: "85", color: "#0ea5e9", bg: "#f0f9ff", border: "#bae6fd" },
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
                        { label: "Incidencias abiertas", value: "24", color: "#ef4444", bg: "#fef2f2", border: "#fecaca" },
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
                        { label: "Devoluciones activas", value: "31", color: "#f97316", bg: "#fff7ed", border: "#fed7aa" },
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

            {/* Conditional KPIs for Historial */}
            {activeTab === 'historial' && (
                <div style={{ display: "flex", gap: "16px", marginBottom: "-8px" }}>
                    {[
                        { label: "Entregados total", value: "3,450", color: "#10b981", bg: "#ecfdf5", border: "#a7f3d0" },
                        { label: "Cancelados total", value: "214", color: "#ef4444", bg: "#fef2f2", border: "#fecaca" },
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
                            {activeTab === 'historial' ? '3,664 pedidos' : '254 pedidos'}
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
                                <th style={{ color: "var(--color-text-secondary)", fontSize: "10px", textTransform: "uppercase" }}>Pedido</th>
                                <th style={{ color: "var(--color-text-secondary)", fontSize: "10px", textTransform: "uppercase" }}>Estado</th>
                                <th style={{ color: "var(--color-text-secondary)", fontSize: "10px", textTransform: "uppercase", textAlign: "center" }}>Fte.</th>
                                <th style={{ color: "var(--color-text-secondary)", fontSize: "10px", textTransform: "uppercase", textAlign: "center" }}>Fullfillm.</th>
                                <th style={{ color: "var(--color-text-secondary)", fontSize: "10px", textTransform: "uppercase", textAlign: "center" }}>Transp.</th>
                                <th style={{ color: "var(--color-text-secondary)", fontSize: "10px", textTransform: "uppercase" }}>Cliente</th>
                                <th style={{ color: "var(--color-text-secondary)", fontSize: "10px", textTransform: "uppercase" }}>Teléfono</th>
                                <th style={{ color: "var(--color-text-secondary)", fontSize: "10px", textTransform: "uppercase" }}>CP / Zona</th>
                                <th style={{ color: "var(--color-text-secondary)", fontSize: "10px", textTransform: "uppercase" }}>Producto</th>
                                <th style={{ color: "var(--color-text-secondary)", fontSize: "10px", textTransform: "uppercase", textAlign: "right" }}>Importe €</th>
                                <th style={{ color: "var(--color-text-secondary)", fontSize: "10px", textTransform: "uppercase" }}>Pago</th>
                                <th style={{ color: "var(--color-text-secondary)", fontSize: "10px", textTransform: "uppercase" }}>Gestor</th>
                                {activeTab !== 'incidencias' && activeTab !== 'devoluciones' && <th style={{ color: "var(--color-text-secondary)", fontSize: "10px", textTransform: "uppercase" }}>Tracking</th>}
                                <th style={{ color: "var(--color-text-secondary)", fontSize: "10px", textTransform: "uppercase", textAlign: "center" }}>Riesgo</th>

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
                                <th style={{ color: "var(--color-text-secondary)", fontSize: "10px", textTransform: "uppercase" }}>T. Gestión</th>
                                <th style={{ color: "var(--color-text-secondary)", fontSize: "10px", textTransform: "uppercase" }}>Entrada</th>

                                <th style={{ color: "var(--color-text-secondary)", width: "40px", textAlign: "center" }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* Example Row 1 - Hidden in 'por-gestionar' as it's 'en_preparacion' */}
                            {activeTab !== 'por-gestionar' && activeTab !== 'en-transito' && activeTab !== 'incidencias' && activeTab !== 'devoluciones' && activeTab !== 'historial' && (
                                <tr>
                                    <td style={{ padding: "12px" }}>
                                        <input type="checkbox" style={{ borderRadius: "4px", border: "1px solid var(--border-high)" }} />
                                    </td>
                                    <td><a href="#" style={{ color: "var(--ops)", fontWeight: 700 }}>#10045</a></td>
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
                                    <td style={{ textAlign: "center" }} title="Proveedor: Shopify"><div style={{ width: "16px", height: "16px", borderRadius: "4px", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 800, color: "#10b981", border: "1px solid #d1fae5", margin: "0 auto" }}>S</div></td>
                                    <td style={{ textAlign: "center" }} title="Beeping">
                                        <div style={{ width: "16px", height: "16px", borderRadius: "4px", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 800, color: "#8b5cf6", border: "1px solid #ede9fe", margin: "0 auto" }}>B</div>
                                    </td>
                                    <td style={{ textAlign: "center" }} title="GLS">
                                        <div style={{ width: "16px", height: "16px", borderRadius: "4px", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 800, color: "#f59e0b", border: "1px solid #fef3c7", margin: "0 auto" }}>G</div>
                                    </td>
                                    <td>Juan Pérez</td>
                                    <td style={{ color: "var(--text-muted)", fontSize: "11px" }}>+34 600 000 000</td>
                                    <td style={{ fontSize: "11px" }}>28001<br /><span style={{ color: "var(--text-dim)", fontSize: "10px" }}>Madrid</span></td>
                                    <td style={{ display: "flex", alignItems: "center", gap: "8px", paddingTop: "8px" }}>
                                        <div style={{ width: "24px", height: "24px", borderRadius: "4px", background: "#f1f5f9" }} />
                                        <div style={{ display: "flex", flexDirection: "column" }}>
                                            <span style={{ fontWeight: 600, fontSize: "11px", maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Zapatillas Nike Air Force</span>
                                            <span style={{ color: "var(--text-dim)", fontSize: "10px" }}>Qty: 1</span>
                                        </div>
                                    </td>
                                    <td style={{ fontWeight: 700, textAlign: "right", color: "var(--color-text-primary)" }}>€49.99</td>
                                    <td>
                                        <span style={{ fontSize: "9px", fontWeight: 800, padding: "2px 6px", borderRadius: "4px", background: "#f1f5f9", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>COD</span>
                                    </td>
                                    <td>
                                        <span style={{
                                            display: "inline-flex", alignItems: "center", gap: "4px",
                                            padding: "4px 8px", borderRadius: "6px",
                                            fontSize: "11px", fontWeight: 700,
                                            background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe"
                                        }}>
                                            🤖 Bot COD
                                        </span>
                                    </td>
                                                                                                            <td style={{ color: "var(--ops)", fontSize: "11px", fontWeight: 600, textDecoration: "underline" }}>BP-1234444</td>
                                    <td style={{ textAlign: "center" }} title="Riesgo Bajo"><span style={{ fontSize: "14px" }}>🟢</span></td>
                                    <td style={{ color: "var(--text-dim)", fontSize: "10px", fontWeight: 600 }}>12m<br /><span style={{ color: "#10b981" }}>En tiempo</span></td>
                                    <td style={{ color: "var(--text-muted)", fontSize: "10px" }}>Hoy<br />10:42</td>
                                    
                                    <td>
                                        <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px" }}>
                                            <MoreHorizontal size={14} />
                                        </button>
                                    </td>
                                </tr>
                            )}
                            {/* Example Row 2 - Siempre se muestra porque es 'reintento' (entra también en incidencias) */}
                            {activeTab !== 'en-transito' && activeTab !== 'incidencias' && activeTab !== 'devoluciones' && activeTab !== 'historial' && (
                                <tr>
                                    <td style={{ padding: "12px" }}>
                                        <input type="checkbox" style={{ borderRadius: "4px", border: "1px solid var(--border-high)" }} />
                                    </td>
                                    <td><a href="#" style={{ color: "var(--ops)", fontWeight: 700 }}>#10046</a></td>
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
                                    <td style={{ textAlign: "center" }} title="Proveedor: Beeping"><div style={{ width: "16px", height: "16px", borderRadius: "4px", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 800, color: "#10b981", border: "1px solid #d1fae5", margin: "0 auto" }}>B</div></td>
                                    <td style={{ textAlign: "center" }} title="Dropea">
                                        <div style={{ width: "16px", height: "16px", borderRadius: "4px", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 800, color: "#8b5cf6", border: "1px solid #ede9fe", margin: "0 auto" }}>D</div>
                                    </td>
                                    <td style={{ textAlign: "center" }} title="GLS">
                                        <div style={{ width: "16px", height: "16px", borderRadius: "4px", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 800, color: "#f59e0b", border: "1px solid #fef3c7", margin: "0 auto" }}>G</div>
                                    </td>
                                    <td>María Gómez</td>
                                    <td style={{ color: "var(--text-muted)", fontSize: "11px" }}>+34 600 000 001</td>
                                    <td style={{ fontSize: "11px" }}>41002<br /><span style={{ color: "var(--text-dim)", fontSize: "10px" }}>Sevilla</span></td>
                                    <td style={{ display: "flex", alignItems: "center", gap: "8px", paddingTop: "8px" }}>
                                        <div style={{ width: "24px", height: "24px", borderRadius: "4px", background: "#f1f5f9" }} />
                                        <div style={{ display: "flex", flexDirection: "column" }}>
                                            <span style={{ fontWeight: 600, fontSize: "11px", maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Camiseta Básica Blanca</span>
                                            <span style={{ color: "var(--text-dim)", fontSize: "10px" }}>Qty: 2</span>
                                        </div>
                                    </td>
                                    <td style={{ fontWeight: 700, textAlign: "right", color: "var(--color-text-primary)" }}>€29.99</td>
                                    <td>
                                        <span style={{ fontSize: "9px", fontWeight: 800, padding: "2px 6px", borderRadius: "4px", background: "#f1f5f9", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>STRIPE</span>
                                    </td>
                                    <td>
                                        <span style={{
                                            display: "inline-flex", alignItems: "center", gap: "4px",
                                            padding: "4px 8px", borderRadius: "6px",
                                            fontSize: "11px", fontWeight: 600,
                                            background: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0"
                                        }}>
                                            👤 María G.
                                        </span>
                                    </td>
                                                                                                            <td style={{ color: "var(--ops)", fontSize: "11px", fontWeight: 600, textDecoration: "underline" }}></td>
                                    <td style={{ textAlign: "center" }} title="Riesgo Bajo"><span style={{ fontSize: "14px" }}>🟢</span></td>
                                    <td style={{ color: "var(--text-dim)", fontSize: "10px", fontWeight: 600 }}>12m<br /><span style={{ color: "#10b981" }}>En tiempo</span></td>
                                    <td style={{ color: "var(--text-muted)", fontSize: "10px" }}>Hoy<br />10:35</td>
                                    
                                    <td>
                                        <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px" }}>
                                            <MoreHorizontal size={14} />
                                        </button>
                                    </td>
                                </tr>
                            )}
                            {/* Example Row 3 - Novedades - en todos y por-gestionar */}
                            {(activeTab === 'todos' || activeTab === 'por-gestionar') && (
                                <tr>
                                    <td style={{ padding: "12px" }}>
                                        <input type="checkbox" style={{ borderRadius: "4px", border: "1px solid var(--border-high)" }} />
                                    </td>
                                    <td><a href="#" style={{ color: "var(--ops)", fontWeight: 700 }}>#10047</a></td>
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
                                    <td style={{ textAlign: "center" }} title="Proveedor: Dropi"><div style={{ width: "16px", height: "16px", borderRadius: "4px", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 800, color: "#10b981", border: "1px solid #d1fae5", margin: "0 auto" }}>D</div></td>
                                    <td style={{ textAlign: "center" }} title="-">
                                        <div style={{ width: "16px", height: "16px", borderRadius: "4px", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 800, color: "#8b5cf6", border: "1px solid #ede9fe", margin: "0 auto" }}>-</div>
                                    </td>
                                    <td style={{ textAlign: "center" }} title="-">
                                        <div style={{ width: "16px", height: "16px", borderRadius: "4px", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 800, color: "#f59e0b", border: "1px solid #fef3c7", margin: "0 auto" }}>-</div>
                                    </td>
                                    <td>Carlos López</td>
                                    <td style={{ color: "var(--text-muted)", fontSize: "11px" }}>+34 600 000 002</td>
                                    <td style={{ fontSize: "11px" }}>08001<br /><span style={{ color: "var(--text-dim)", fontSize: "10px" }}>Barcelona</span></td>
                                    <td style={{ display: "flex", alignItems: "center", gap: "8px", paddingTop: "8px" }}>
                                        <div style={{ width: "24px", height: "24px", borderRadius: "4px", background: "#f1f5f9" }} />
                                        <div style={{ display: "flex", flexDirection: "column" }}>
                                            <span style={{ fontWeight: 600, fontSize: "11px", maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Sudadera Urban Black</span>
                                            <span style={{ color: "var(--text-dim)", fontSize: "10px" }}>Qty: 1</span>
                                        </div>
                                    </td>
                                    <td style={{ fontWeight: 700, textAlign: "right", color: "var(--color-text-primary)" }}>€59.90</td>
                                    <td>
                                        <span style={{ fontSize: "9px", fontWeight: 800, padding: "2px 6px", borderRadius: "4px", background: "#f1f5f9", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>COD</span>
                                    </td>
                                    <td>
                                        {activeTab === 'por-gestionar' ? (
                                            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                                <button style={{ fontSize: "10px", fontWeight: 700, padding: "4px 8px", borderRadius: "4px", background: "#f8fafc", color: "#475569", border: "1px solid #cbd5e1", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", width: "100%", textAlign: "left" }}>
                                                    👤 Asignarme
                                                </button>
                                                <button style={{ fontSize: "10px", fontWeight: 700, padding: "4px 8px", borderRadius: "4px", background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", width: "100%", textAlign: "left" }}>
                                                    🤖 Al Bot
                                                </button>
                                            </div>
                                        ) : (
                                            <span style={{
                                                display: "inline-flex", alignItems: "center", gap: "4px",
                                                padding: "4px 8px", borderRadius: "6px",
                                                fontSize: "11px", fontWeight: 600,
                                                background: "#fef3c7", color: "#d97706", border: "1px solid #fde68a"
                                            }}>
                                                ⚠️ Sin gest.
                                            </span>
                                        )}
                                    </td>
                                                                                                            <td style={{ color: "var(--ops)", fontSize: "11px", fontWeight: 600, textDecoration: "underline" }}></td>
                                    <td style={{ textAlign: "center" }} title="Riesgo Bajo"><span style={{ fontSize: "14px" }}>🟢</span></td>
                                    <td style={{ color: "var(--text-dim)", fontSize: "10px", fontWeight: 600 }}>12m<br /><span style={{ color: "#10b981" }}>En tiempo</span></td>
                                    <td style={{ color: "var(--text-muted)", fontSize: "10px" }}>Ayer<br />18:20</td>
                                    
                                    <td>
                                        <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px" }}>
                                            <MoreHorizontal size={14} />
                                        </button>
                                    </td>
                                </tr>
                            )}
                            {/* Example Row 4 - EN TRÁNSITO */}
                            {(activeTab === 'todos' || activeTab === 'en-transito') && (
                                <tr>
                                    <td style={{ padding: "12px" }}>
                                        <input type="checkbox" style={{ borderRadius: "4px", border: "1px solid var(--border-high)" }} />
                                    </td>
                                    <td><a href="#" style={{ color: "var(--ops)", fontWeight: 700 }}>#10048</a></td>
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
                                    <td style={{ textAlign: "center" }} title="Proveedor: Shopify"><div style={{ width: "16px", height: "16px", borderRadius: "4px", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 800, color: "#10b981", border: "1px solid #d1fae5", margin: "0 auto" }}>S</div></td>
                                    <td style={{ textAlign: "center" }} title="Beeping">
                                        <div style={{ width: "16px", height: "16px", borderRadius: "4px", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 800, color: "#8b5cf6", border: "1px solid #ede9fe", margin: "0 auto" }}>B</div>
                                    </td>
                                    <td style={{ textAlign: "center" }} title="Correos Express">
                                        <div style={{ width: "16px", height: "16px", borderRadius: "4px", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 800, color: "#3b82f6", border: "1px solid #bfdbfe", margin: "0 auto" }}>C</div>
                                    </td>
                                    <td>Ana Martínez</td>
                                    <td style={{ color: "var(--text-muted)", fontSize: "11px" }}>+34 600 000 003</td>
                                    <td style={{ fontSize: "11px" }}>46001<br /><span style={{ color: "var(--text-dim)", fontSize: "10px" }}>Valencia</span></td>
                                    <td style={{ display: "flex", alignItems: "center", gap: "8px", paddingTop: "8px" }}>
                                        <div style={{ width: "24px", height: "24px", borderRadius: "4px", background: "#f1f5f9" }} />
                                        <div style={{ display: "flex", flexDirection: "column" }}>
                                            <span style={{ fontWeight: 600, fontSize: "11px", maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Auriculares Inalámbricos</span>
                                            <span style={{ color: "var(--text-dim)", fontSize: "10px" }}>Qty: 1</span>
                                        </div>
                                    </td>
                                    <td style={{ fontWeight: 700, textAlign: "right", color: "var(--color-text-primary)" }}>€89.00</td>
                                    <td>
                                        <span style={{ fontSize: "9px", fontWeight: 800, padding: "2px 6px", borderRadius: "4px", background: "#f1f5f9", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>TARJETA</span>
                                    </td>
                                    <td>
                                        <span style={{
                                            display: "inline-flex", alignItems: "center", gap: "4px",
                                            padding: "4px 8px", borderRadius: "6px",
                                            fontSize: "11px", fontWeight: 600,
                                            background: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0"
                                        }}>
                                            👤 Sistema
                                        </span>
                                    </td>
                                                                                                            <td style={{ color: "var(--ops)", fontSize: "11px", fontWeight: 600, textDecoration: "underline" }}>PQ41029312</td>
                                    {activeTab === 'en-transito' && (
                                        <td>
                                            <span style={{ fontSize: "10px", fontWeight: 800, padding: "4px 8px", borderRadius: "6px", background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca" }}>
                                                8 Días
                                            </span>
                                        </td>
                                    )}
                                    <td style={{ textAlign: "center" }} title="Riesgo Bajo"><span style={{ fontSize: "14px" }}>🟢</span></td>
                                    <td style={{ color: "var(--text-dim)", fontSize: "10px", fontWeight: 600 }}>12m<br /><span style={{ color: "#10b981" }}>En tiempo</span></td>
                                    <td style={{ color: "var(--text-muted)", fontSize: "10px" }}>Hace 8d<br />12:05</td>
                                    
                                    <td>
                                        <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px" }}>
                                            <MoreHorizontal size={14} />
                                        </button>
                                    </td>
                                </tr>
                            )}
                            {/* Example Row 5 - INCIDENCIAS */}
                            {(activeTab === 'todos' || activeTab === 'incidencias') && (
                                <tr>
                                    <td style={{ padding: "12px" }}>
                                        <input type="checkbox" style={{ borderRadius: "4px", border: "1px solid var(--border-high)" }} />
                                    </td>
                                    <td><a href="#" style={{ color: "var(--ops)", fontWeight: 700 }}>#10049</a></td>
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
                                    <td style={{ textAlign: "center" }} title="Proveedor: Shopify"><div style={{ width: "16px", height: "16px", borderRadius: "4px", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 800, color: "#10b981", border: "1px solid #d1fae5", margin: "0 auto" }}>S</div></td>
                                    <td style={{ textAlign: "center" }} title="Beeping">
                                        <div style={{ width: "16px", height: "16px", borderRadius: "4px", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 800, color: "#8b5cf6", border: "1px solid #ede9fe", margin: "0 auto" }}>B</div>
                                    </td>
                                    <td style={{ textAlign: "center" }} title="GLS">
                                        <div style={{ width: "16px", height: "16px", borderRadius: "4px", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 800, color: "#f59e0b", border: "1px solid #fef3c7", margin: "0 auto" }}>G</div>
                                    </td>
                                    <td>Luis García</td>
                                    <td style={{ color: "var(--text-muted)", fontSize: "11px" }}>+34 600 000 004</td>
                                    <td style={{ fontSize: "11px" }}>29001<br /><span style={{ color: "var(--text-dim)", fontSize: "10px" }}>Málaga</span></td>
                                    <td style={{ display: "flex", alignItems: "center", gap: "8px", paddingTop: "8px" }}>
                                        <div style={{ width: "24px", height: "24px", borderRadius: "4px", background: "#f1f5f9" }} />
                                        <div style={{ display: "flex", flexDirection: "column" }}>
                                            <span style={{ fontWeight: 600, fontSize: "11px", maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Chaqueta Invierno XL</span>
                                            <span style={{ color: "var(--text-dim)", fontSize: "10px" }}>Qty: 1</span>
                                        </div>
                                    </td>
                                    <td style={{ fontWeight: 700, textAlign: "right", color: "var(--color-text-primary)" }}>€120.00</td>
                                    <td>
                                        <span style={{ fontSize: "9px", fontWeight: 800, padding: "2px 6px", borderRadius: "4px", background: "#f1f5f9", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>COD</span>
                                    </td>
                                    <td>
                                        <span style={{
                                            display: "inline-flex", alignItems: "center", gap: "4px",
                                            padding: "4px 8px", borderRadius: "6px",
                                            fontSize: "11px", fontWeight: 600,
                                            background: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0"
                                        }}>
                                            👤 María G.
                                        </span>
                                    </td>
                                                                        
                                    {activeTab !== 'incidencias' && (
                                        <td style={{ color: "var(--ops)", fontSize: "11px", fontWeight: 600, textDecoration: "underline" }}></td>
                                    )}
                                    <td style={{ textAlign: "center" }} title="Riesgo Bajo"><span style={{ fontSize: "14px" }}>🟢</span></td>

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

                                    <td style={{ textAlign: "center" }} title="Riesgo Bajo"><span style={{ fontSize: "14px" }}>🟢</span></td>
                                    <td style={{ color: "var(--text-dim)", fontSize: "10px", fontWeight: 600 }}>12m<br /><span style={{ color: "#10b981" }}>En tiempo</span></td>
                                    <td style={{ color: "var(--text-muted)", fontSize: "10px" }}>Hace 6d<br />09:12</td>
                                    
                                    <td>
                                        <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px" }}>
                                            <MoreHorizontal size={14} />
                                        </button>
                                    </td>
                                </tr>
                            )}
                            {/* Example Row 6 - DEVOLUCIONES */}
                            {(activeTab === 'todos' || activeTab === 'devoluciones') && (
                                <tr>
                                    <td style={{ padding: "12px" }}>
                                        <input type="checkbox" style={{ borderRadius: "4px", border: "1px solid var(--border-high)" }} />
                                    </td>
                                    <td><a href="#" style={{ color: "var(--ops)", fontWeight: 700 }}>#10050</a></td>
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
                                    <td style={{ textAlign: "center" }} title="Proveedor: Shopify"><div style={{ width: "16px", height: "16px", borderRadius: "4px", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 800, color: "#10b981", border: "1px solid #d1fae5", margin: "0 auto" }}>S</div></td>
                                    <td style={{ textAlign: "center" }} title="Beeping">
                                        <div style={{ width: "16px", height: "16px", borderRadius: "4px", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 800, color: "#8b5cf6", border: "1px solid #ede9fe", margin: "0 auto" }}>B</div>
                                    </td>
                                    <td style={{ textAlign: "center" }} title="Correos Express">
                                        <div style={{ width: "16px", height: "16px", borderRadius: "4px", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 800, color: "#3b82f6", border: "1px solid #bfdbfe", margin: "0 auto" }}>C</div>
                                    </td>
                                    <td>Marta Díaz</td>
                                    <td style={{ color: "var(--text-muted)", fontSize: "11px" }}>+34 600 000 005</td>
                                    <td style={{ fontSize: "11px" }}>03001<br /><span style={{ color: "var(--text-dim)", fontSize: "10px" }}>Alicante</span></td>
                                    <td style={{ display: "flex", alignItems: "center", gap: "8px", paddingTop: "8px" }}>
                                        <div style={{ width: "24px", height: "24px", borderRadius: "4px", background: "#f1f5f9" }} />
                                        <div style={{ display: "flex", flexDirection: "column" }}>
                                            <span style={{ fontWeight: 600, fontSize: "11px", maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Bolso Piel Sintética</span>
                                            <span style={{ color: "var(--text-dim)", fontSize: "10px" }}>Qty: 1</span>
                                        </div>
                                    </td>
                                    <td style={{ fontWeight: 700, textAlign: "right", color: "var(--color-text-primary)" }}>€49.90</td>
                                    <td>
                                        <span style={{ fontSize: "9px", fontWeight: 800, padding: "2px 6px", borderRadius: "4px", background: "#f1f5f9", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>TARJETA</span>
                                    </td>
                                    <td>
                                        <span style={{
                                            display: "inline-flex", alignItems: "center", gap: "4px",
                                            padding: "4px 8px", borderRadius: "6px",
                                            fontSize: "11px", fontWeight: 600,
                                            background: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0"
                                        }}>
                                            👤 María G.
                                        </span>
                                    </td>
                                                                        
                                    {activeTab !== 'devoluciones' && (
                                        <td style={{ color: "var(--ops)", fontSize: "11px", fontWeight: 600, textDecoration: "underline" }}>PQ41029888</td>
                                    )}
                                    <td style={{ textAlign: "center" }} title="Riesgo Bajo"><span style={{ fontSize: "14px" }}>🟢</span></td>

                                    {activeTab === 'devoluciones' && (
                                        <>
                                            <td><span style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-muted)" }}>Cliente Rechaza</span></td>
                                            <td style={{ fontWeight: 800, textAlign: "right", color: "var(--color-text-primary)" }}>€49.90</td>
                                            <td style={{ textAlign: "center" }}><span style={{ fontSize: "9px", fontWeight: 800, padding: "2px 6px", borderRadius: "12px", background: "#fef3c7", color: "#d97706" }}>En proceso</span></td>
                                            <td style={{ fontWeight: 800, textAlign: "right", color: "#64748b" }}>-</td>
                                        </>
                                    )}

                                    <td style={{ textAlign: "center" }} title="Riesgo Bajo"><span style={{ fontSize: "14px" }}>🟢</span></td>
                                    <td style={{ color: "var(--text-dim)", fontSize: "10px", fontWeight: 600 }}>12m<br /><span style={{ color: "#10b981" }}>En tiempo</span></td>
                                    <td style={{ color: "var(--text-muted)", fontSize: "10px" }}>Hace 2d<br />14:15</td>
                                    
                                    <td>
                                        <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px" }}>
                                            <MoreHorizontal size={14} />
                                        </button>
                                    </td>
                                </tr>
                            )}
                            {/* Example Row 7 - HISTORIAL (Entregado) */}
                            {(activeTab === 'todos' || activeTab === 'historial') && (
                                <tr>
                                    <td style={{ padding: "12px" }}>
                                        <input type="checkbox" style={{ borderRadius: "4px", border: "1px solid var(--border-high)" }} />
                                    </td>
                                    <td><a href="#" style={{ color: "var(--ops)", fontWeight: 700 }}>#10041</a></td>
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
                                    <td style={{ textAlign: "center" }} title="Proveedor: Shopify"><div style={{ width: "16px", height: "16px", borderRadius: "4px", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 800, color: "#10b981", border: "1px solid #d1fae5", margin: "0 auto" }}>S</div></td>
                                    <td style={{ textAlign: "center" }} title="Beeping">
                                        <div style={{ width: "16px", height: "16px", borderRadius: "4px", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 800, color: "#8b5cf6", border: "1px solid #ede9fe", margin: "0 auto" }}>B</div>
                                    </td>
                                    <td style={{ textAlign: "center" }} title="GLS">
                                        <div style={{ width: "16px", height: "16px", borderRadius: "4px", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 800, color: "#f59e0b", border: "1px solid #fef3c7", margin: "0 auto" }}>G</div>
                                    </td>
                                    <td>Javier Nieto</td>
                                    <td style={{ color: "var(--text-muted)", fontSize: "11px" }}>+34 600 000 006</td>
                                    <td style={{ fontSize: "11px" }}>15001<br /><span style={{ color: "var(--text-dim)", fontSize: "10px" }}>A Coruña</span></td>
                                    <td style={{ display: "flex", alignItems: "center", gap: "8px", paddingTop: "8px" }}>
                                        <div style={{ width: "24px", height: "24px", borderRadius: "4px", background: "#f1f5f9" }} />
                                        <div style={{ display: "flex", flexDirection: "column" }}>
                                            <span style={{ fontWeight: 600, fontSize: "11px", maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Monitor Gaming 24"</span>
                                            <span style={{ color: "var(--text-dim)", fontSize: "10px" }}>Qty: 1</span>
                                        </div>
                                    </td>
                                    <td style={{ fontWeight: 700, textAlign: "right", color: "var(--color-text-primary)" }}>€199.00</td>
                                    <td>
                                        <span style={{ fontSize: "9px", fontWeight: 800, padding: "2px 6px", borderRadius: "4px", background: "#f1f5f9", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>TARJETA</span>
                                    </td>
                                    <td>
                                        <span style={{
                                            display: "inline-flex", alignItems: "center", gap: "4px",
                                            padding: "4px 8px", borderRadius: "6px",
                                            fontSize: "11px", fontWeight: 600,
                                            background: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0"
                                        }}>
                                            👤 Sistema
                                        </span>
                                    </td>
                                                                        
                                    {activeTab !== 'historial' && (
                                        <td style={{ color: "var(--ops)", fontSize: "11px", fontWeight: 600, textDecoration: "underline" }}>GLS0012929</td>
                                    )}
                                    <td style={{ textAlign: "center" }} title="Riesgo Bajo"><span style={{ fontSize: "14px" }}>🟢</span></td>

                                    <td style={{ textAlign: "center" }} title="Riesgo Bajo"><span style={{ fontSize: "14px" }}>🟢</span></td>
                                    <td style={{ color: "var(--text-dim)", fontSize: "10px", fontWeight: 600 }}>12m<br /><span style={{ color: "#10b981" }}>En tiempo</span></td>
                                    <td style={{ color: "var(--text-muted)", fontSize: "10px" }}>Hace 12d<br />10:00</td>
                                    
                                    <td>
                                        <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px" }}>
                                            <MoreHorizontal size={14} />
                                        </button>
                                    </td>
                                </tr>
                            )}
                            {/* Empty State message for the rest */}
                            <tr>
                                <td colSpan={activeTab === 'en-transito' ? 18 : (activeTab === 'incidencias' ? 20 : (activeTab === 'devoluciones' ? 20 : 17))} style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-muted)" }}>
                                    <p style={{ fontWeight: 700, fontSize: "14px", color: "var(--text)" }}>Módulo de Pedidos en Desarrollo</p>

                                    <p style={{ fontSize: "12px", marginTop: "6px", maxWidth: "400px", margin: "6px auto 0" }}>El motor de sincronización logística unificará aquí todos los estados de Shopify y tus operadores de fulfillment seleccionados.</p>
                                </td>

                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
