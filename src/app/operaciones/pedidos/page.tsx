'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store/store-context';
import { RefreshCw, Search, Filter } from 'lucide-react';
import { ORDER_STATES, OrderState } from '@/lib/orderStates';

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

            {/* Content Body */}
            <div className="ds-card" style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: "500px", overflow: "hidden" }}>
                {/* Controls Bar */}
                <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
                    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                        <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text)" }}>
                            {TABS.find(t => t.id === activeTab)?.label}
                        </span>
                        <span style={{ fontSize: "11px", color: "var(--text-muted)", padding: "2px 8px", background: "white", borderRadius: "10px", border: "1px solid var(--border)", fontWeight: 600 }}>
                            254 pedidos
                        </span>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                        <button className="ds-btn" style={{ background: "white", color: "var(--text-muted)", textTransform: "none", letterSpacing: "normal", fontSize: "11px", fontWeight: 600 }}>
                            <RefreshCw className="w-3.5 h-3.5" />
                            Sincronizar Estados
                        </button>
                    </div>
                </div>

                {/* Mock Table */}
                <div style={{ overflowX: "auto", flex: 1 }}>
                    <table className="ds-table" style={{ borderTop: "none" }}>
                        <thead>
                            <tr>
                                <th style={{ width: "40px", padding: "12px" }}>
                                    <input type="checkbox" style={{ borderRadius: "4px", border: "1px solid var(--border-high)" }} />
                                </th>
                                <th style={{ color: "var(--color-text-secondary)" }}>Pedido #</th>
                                <th style={{ color: "var(--color-text-secondary)" }}>Fecha</th>
                                <th style={{ color: "var(--color-text-secondary)" }}>Cliente</th>
                                <th style={{ color: "var(--color-text-secondary)" }}>Estado Universal</th>
                                <th style={{ color: "var(--color-text-secondary)" }}>Importe</th>
                                <th style={{ color: "var(--color-text-secondary)" }}>Método</th>
                                <th style={{ color: "var(--color-text-secondary)" }}>Gestor</th>
                                <th style={{ color: "var(--color-text-secondary)" }}>Transportista</th>
                                <th style={{ color: "var(--color-text-secondary)", textAlign: "right", paddingRight: "24px" }}>Últ. Act.</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* Example Row to show universal order state */}
                            <tr>
                                <td style={{ padding: "12px" }}>
                                    <input type="checkbox" style={{ borderRadius: "4px", border: "1px solid var(--border-high)" }} />
                                </td>
                                <td><a href="#" style={{ color: "var(--ops)", fontWeight: 700 }}>#10045</a></td>
                                <td style={{ color: "var(--text-muted)", fontSize: "11px" }}>Hoy, 10:42</td>
                                <td>
                                    <div style={{ display: "flex", flexDirection: "column" }}>
                                        <span style={{ fontWeight: 600 }}>Juan Pérez</span>
                                        <span style={{ color: "var(--text-dim)", fontSize: "10px" }}>Madrid, 28001</span>
                                    </div>
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
                                <td style={{ fontWeight: 700 }}>€49.99</td>
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
                                <td>
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                        <div style={{ width: "16px", height: "16px", borderRadius: "4px", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 800, color: "#94a3b8" }}>B</div>
                                        <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>Beeping</span>
                                    </div>
                                </td>
                                <td style={{ textAlign: "right", color: "var(--text-dim)", fontSize: "10px", paddingRight: "24px" }}>Hace 5 min</td>
                            </tr>
                            {/* Example Row 2 to show empleado and sin asignar logic, just hardcoded */}
                            <tr>
                                <td style={{ padding: "12px" }}>
                                    <input type="checkbox" style={{ borderRadius: "4px", border: "1px solid var(--border-high)" }} />
                                </td>
                                <td><a href="#" style={{ color: "var(--ops)", fontWeight: 700 }}>#10046</a></td>
                                <td style={{ color: "var(--text-muted)", fontSize: "11px" }}>Hoy, 10:35</td>
                                <td>
                                    <div style={{ display: "flex", flexDirection: "column" }}>
                                        <span style={{ fontWeight: 600 }}>María Gómez</span>
                                        <span style={{ color: "var(--text-dim)", fontSize: "10px" }}>Sevilla, 41002</span>
                                    </div>
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
                                <td style={{ fontWeight: 700 }}>€29.99</td>
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
                                        👤 María García
                                    </span>
                                </td>
                                <td>
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                        <div style={{ width: "16px", height: "16px", borderRadius: "4px", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 800, color: "#94a3b8" }}>-</div>
                                        <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>Dropea</span>
                                    </div>
                                </td>
                                <td style={{ textAlign: "right", color: "var(--text-dim)", fontSize: "10px", paddingRight: "24px" }}>Hace 12 min</td>
                            </tr>
                            {/* Example Row 3 to show sin asignar logic */}
                            <tr>
                                <td style={{ padding: "12px" }}>
                                    <input type="checkbox" style={{ borderRadius: "4px", border: "1px solid var(--border-high)" }} />
                                </td>
                                <td><a href="#" style={{ color: "var(--ops)", fontWeight: 700 }}>#10047</a></td>
                                <td style={{ color: "var(--text-muted)", fontSize: "11px" }}>Ayer, 18:20</td>
                                <td>
                                    <div style={{ display: "flex", flexDirection: "column" }}>
                                        <span style={{ fontWeight: 600 }}>Carlos López</span>
                                        <span style={{ color: "var(--text-dim)", fontSize: "10px" }}>Barcelona, 08001</span>
                                    </div>
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
                                <td style={{ fontWeight: 700 }}>€59.90</td>
                                <td>
                                    <span style={{ fontSize: "9px", fontWeight: 800, padding: "2px 6px", borderRadius: "4px", background: "#f1f5f9", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>COD</span>
                                </td>
                                <td>
                                    <span style={{
                                        display: "inline-flex", alignItems: "center", gap: "4px",
                                        padding: "4px 8px", borderRadius: "6px",
                                        fontSize: "11px", fontWeight: 600,
                                        background: "#fef3c7", color: "#d97706", border: "1px solid #fde68a"
                                    }}>
                                        ⚠️ Sin gestionar
                                    </span>
                                </td>
                                <td>
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                        <div style={{ width: "16px", height: "16px", borderRadius: "4px", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 800, color: "#94a3b8" }}>-</div>
                                        <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>Pendiente</span>
                                    </div>
                                </td>
                                <td style={{ textAlign: "right", color: "var(--text-dim)", fontSize: "10px", paddingRight: "24px" }}>Hace 2 min</td>
                            </tr>
                            {/* Empty State message for the rest */}
                            <tr>
                                <td colSpan={10} style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-muted)" }}>
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
