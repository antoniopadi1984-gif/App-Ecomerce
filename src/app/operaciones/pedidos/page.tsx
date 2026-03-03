'use client';

import React, { useState } from 'react';
import { RefreshCw, Search, Filter, X, MapPin, User, AlertTriangle } from 'lucide-react';
import { ORDER_STATES } from '@/lib/orderStates';

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


function getTrackingUrl(carrier: string, trackingNumber: string): string {
    const urls: Record<string, string> = {
        "correos_express": `https://www.correos.es/ss/Satellite/site/aplicacion-oficina_virtual-1349167560549/detalle_app-sidioma=es_ES&numero=${trackingNumber}`,
        "gls": `https://gls-group.com/ES/es/seguimiento-envios?match=${trackingNumber}`,
        "seur": `https://www.seur.com/livetracking/?segmentationLevel=3&hash=${trackingNumber}`,
        "mrw": `https://www.mrw.es/seguimiento_envios/MRW_resultados_consultas.asp?Num=${trackingNumber}`,
        "dhl": `https://www.dhl.com/es-es/home/tracking.html?tracking-id=${trackingNumber}`,
        "nacex": `https://www.nacex.es/seguimiento.do?numero_albaran=${trackingNumber}`,
    };
    const c = carrier.toLowerCase().replace(/\s/g, "_").replace(/\./g, "");
    for (const key of Object.keys(urls)) {
        if (c.includes(key)) return urls[key];
    }
    return `https://www.17track.net/es/track#nums=${trackingNumber}`;
}

function ColumnaRiesgo({ riesgo }: { riesgo: { status: "red" | "yellow" | "green", score: number } }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "2px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <span style={{
                    width: "8px", height: "8px", borderRadius: "50%", flexShrink: 0,
                    background: riesgo.status === "red" ? "#ef4444"
                        : riesgo.status === "yellow" ? "#eab308" : "#22c55e"
                }} />
                <span style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a" }}>
                    {riesgo.score}
                </span>
            </div>
            <span style={{
                fontSize: "10px", fontWeight: 600,
                color: riesgo.status === "red" ? "#ef4444"
                    : riesgo.status === "yellow" ? "#d97706" : "#16a34a"
            }}>
                {riesgo.status === "red" ? "Alto riesgo"
                    : riesgo.status === "yellow" ? "Revisar" : "Sin riesgo"}
            </span>
        </div>
    );
}

function ColumnaAcciones({ pedido }: { pedido: { state: string } }) {

    const handleEnviar = (p: { state: string }) => console.log("Enviando", p);
    const handleCancelar = (p: { state: string }) => console.log("Cancelando", p);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-end", justifyContent: "center" }}>

            {/* ENVIAR — verde, solo activo si el estado lo permite */}
            <button
                onClick={e => { e.stopPropagation(); handleEnviar(pedido) }}
                disabled={["enviado", "entregado", "cancelado"].includes(pedido.state)}
                style={{
                    fontSize: "11px", fontWeight: 700,
                    padding: "4px 10px", borderRadius: "6px",
                    cursor: ["enviado", "entregado", "cancelado"].includes(pedido.state) ? "not-allowed" : "pointer",
                    whiteSpace: "nowrap",
                    width: "100%",          // ← ocupa todo el ancho de la celda
                    textAlign: "center",
                    border: "none",
                    background: ["enviado", "entregado", "cancelado"].includes(pedido.state)
                        ? "#f1f5f9" : "rgba(22,163,74,0.1)",
                    color: ["enviado", "entregado", "cancelado"].includes(pedido.state)
                        ? "#94a3b8" : "#16a34a",
                }}
            >
                Enviar
            </button>

            {/* CANCELAR — rojo, siempre visible salvo entregado */}
            <button
                onClick={e => { e.stopPropagation(); handleCancelar(pedido) }}
                disabled={["entregado", "cancelado"].includes(pedido.state)}
                style={{
                    fontSize: "11px", fontWeight: 700,
                    padding: "4px 10px", borderRadius: "6px",
                    cursor: ["entregado", "cancelado"].includes(pedido.state) ? "not-allowed" : "pointer",
                    whiteSpace: "nowrap",
                    width: "100%",          // ← ocupa todo el ancho de la celda
                    textAlign: "center",
                    border: "none",
                    background: ["entregado", "cancelado"].includes(pedido.state)
                        ? "#f1f5f9" : "rgba(239,68,68,0.08)",
                    color: ["entregado", "cancelado"].includes(pedido.state)
                        ? "#94a3b8" : "#ef4444",
                }}
            >
                Cancelar
            </button>


        </div>
    );
}

function ColumnaCheckbox() {
    const [menuOpen, setMenuOpen] = React.useState(false);
    return (
        <td data-no-drawer style={{
            padding: "0 6px 0 14px", verticalAlign: "middle",
            height: "52px", width: "36px", borderBottom: "1px solid #f1f5f9"
        }}>
            <div style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", gap: "4px", height: "100%", position: "relative"
            }}>
                <input
                    type="checkbox"
                    onClick={e => e.stopPropagation()}
                    style={{ width: "14px", height: "14px", cursor: "pointer", flexShrink: 0 }}
                />
                <button
                    onClick={e => { e.stopPropagation(); setMenuOpen(!menuOpen) }}
                    style={{
                        background: "none", border: "none", cursor: "pointer",
                        color: "#94a3b8", fontSize: "13px", padding: "0",
                        lineHeight: 1, letterSpacing: "0.5px",
                    }}
                >
                    ···
                </button>
                {menuOpen && (
                    <div style={{
                        position: "absolute", left: "100%", top: "50%", zIndex: 100,
                        background: "white", border: "1px solid #e2e8f0",
                        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                        borderRadius: "8px", padding: "4px", minWidth: "160px",
                        display: "flex", flexDirection: "column", gap: "2px",
                        textAlign: "left", transform: "translateY(-50%)", marginLeft: "8px"
                    }}>
                        <button onClick={(e) => { e.stopPropagation(); console.log("Ver detalle") }} style={{ textAlign: "left", background: "none", border: "none", padding: "8px 12px", fontSize: "12px", cursor: "pointer", borderRadius: "4px" }}>
                            Ver detalles
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); console.log("Cancelar") }} style={{ textAlign: "left", background: "none", border: "none", padding: "8px 12px", fontSize: "12px", cursor: "pointer", color: "#ef4444", borderRadius: "4px" }}>
                            ✕ Cancelar pedido
                        </button>
                    </div>
                )}
            </div>
        </td>
    );
}

function OrderDrawer({ pedido, onClose }: { pedido: { ref: string } | null, onClose: () => void }) {
    if (!pedido) return null;
    return (
        <>
            <div
                onClick={onClose}
                style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(2px)", zIndex: 100, animation: "fade-in 0.2s ease-out" }}
            />
            <div
                style={{
                    position: "fixed", right: 0, top: 0, bottom: 0, width: "33vw", minWidth: "400px", maxWidth: "480px",
                    background: "white", zIndex: 101, boxShadow: "-8px 0 24px rgba(0,0,0,0.1)",
                    display: "flex", flexDirection: "column",
                    animation: "slide-in-right 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
                }}
            >
                {/* Header */}
                <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <h2 style={{ fontSize: "18px", fontWeight: 800, color: "var(--color-text-primary)" }}>#{pedido.ref || "10045"}</h2>
                            <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "20px", background: "#dcfce7", color: "#16a34a" }}>Pagado</span>
                        </div>
                        <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>12 Oct 2023, 14:32</p>
                    </div>
                    <button onClick={onClose} style={{ background: "white", border: "1px solid var(--border)", borderRadius: "8px", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-dim)" }}>
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <div className="ds-scrollbar" style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>

                    {/* Riesgo */}
                    <div className="ds-card" style={{ padding: "16px", background: "#fff1f2", border: "1px solid #ffe4e6", display: "flex", flexDirection: "column", gap: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#e11d48" }}>
                            <AlertTriangle size={16} />
                            <h3 style={{ fontSize: "13px", fontWeight: 800 }}>Análisis de Fraude (Score: 15/100)</h3>
                        </div>
                        <p style={{ fontSize: "12px", color: "#be123c", lineHeight: "1.5" }}>
                            El cliente ha realizado 3 devoluciones en los últimos 6 meses. La IP de compra no coincide con la zona de entrega y el teléfono es VoIP.
                        </p>
                    </div>

                    {/* Cliente & Dirección */}
                    <div>
                        <h3 style={{ fontSize: "11px", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "12px" }}>Cliente & Dirección</h3>
                        <div className="ds-card" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
                                    <User size={16} />
                                </div>
                                <div>
                                    <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)" }}>Juan Pérez</p>
                                    <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>juan.perez@email.com · +34 600 000 000</p>
                                </div>
                            </div>
                            <hr style={{ border: "none", borderTop: "1px dashed var(--border)" }} />
                            <div style={{ display: "flex", gap: "12px" }}>
                                <div style={{ color: "#64748b", marginTop: "2px" }}><MapPin size={16} /></div>
                                <div>
                                    <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>Calle Principal 123, Piso 4B</p>
                                    <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>28001 Madrid, Comunidad de Madrid, España</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* UTMs */}
                    <div>
                        <h3 style={{ fontSize: "11px", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "12px" }}>Atribución UTM</h3>
                        <div className="ds-card" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Source:</span>
                                <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text)" }}>ig_story</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Campaign:</span>
                                <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text)" }}>promo_verano_fb</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Medium:</span>
                                <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text)" }}>social_paid</span>
                            </div>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div>
                        <h3 style={{ fontSize: "11px", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "12px" }}>Timeline</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px", paddingLeft: "8px" }}>
                            {[
                                { title: "Pedido creado en Shopify", time: "Hoy, 10:42", detail: "Referencia #10045" },
                                { title: "Dropea: Pago procesado", time: "Hoy, 10:45", detail: "Stripe CH_12932" },
                                { title: "Beeping: Etiqueta generada", time: "Hoy, 11:30", detail: "GLS 00012929" },
                            ].map((evt, i) => (
                                <div key={i} style={{ display: "flex", gap: "12px", position: "relative" }}>
                                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#3b82f6", marginTop: "4px", zIndex: 2 }} />
                                    {i < 2 && <div style={{ position: "absolute", left: "3px", top: "12px", bottom: "-12px", width: "2px", background: "var(--border)" }} />}
                                    <div>
                                        <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>{evt.title}</p>
                                        <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>{evt.time} · {evt.detail}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Notas */}
                    <div>
                        <h3 style={{ fontSize: "11px", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "12px" }}>Notas del Pedido</h3>
                        <textarea className="ds-input" placeholder="Añadir nota interna..." style={{ width: "100%", height: "80px", resize: "none" }} />
                        <button className="ds-btn" style={{ background: "var(--color-primary)", color: "white", marginTop: "8px", width: "100%" }}>Guardar Nota</button>
                    </div>
                </div>
            </div>
        </>
    );
}

export default function PedidosPage() {
    const [activeTab, setActiveTab] = useState('todos');
    const [selectedOrder, setSelectedOrder] = useState<{ ref: string } | null>(null);

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
                <div style={{ width: "100%", overflowX: "auto", flex: 1 }}>
                    <table className="ds-table ds-compact-table" style={{ borderTop: "none", width: "100%", tableLayout: "auto", borderCollapse: "collapse", fontSize: "12px" }}>
                        <thead>
                            <tr>
                                <th style={{ width: "3%", padding: "0 0 0 12px" }}>
                                    <input type="checkbox" style={{ width: "14px", height: "14px", cursor: "pointer" }} />
                                </th>
                                {activeTab === 'carritos-abandonados' ? (
                                    <>
                                        <th style={{ padding: "8px 10px", fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "left", whiteSpace: "nowrap", borderBottom: "2px solid #e2e8f0", background: "white" }}>ID</th>
                                        <th style={{ padding: "8px 10px", fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "left", whiteSpace: "nowrap", borderBottom: "2px solid #e2e8f0", background: "white" }}>Cliente</th>
                                        <th style={{ padding: "8px 10px", fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "left", whiteSpace: "nowrap", borderBottom: "2px solid #e2e8f0", background: "white" }}>Teléfono</th>
                                        <th style={{ padding: "8px 10px", fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "left", whiteSpace: "nowrap", borderBottom: "2px solid #e2e8f0", background: "white" }}>Producto</th>
                                        <th style={{ padding: "8px 10px", fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "right", whiteSpace: "nowrap", borderBottom: "2px solid #e2e8f0", background: "white" }}>Importe €</th>
                                        <th style={{ padding: "8px 10px", fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "left", whiteSpace: "nowrap", borderBottom: "2px solid #e2e8f0", background: "white" }}>UTM Source</th>
                                        <th style={{ padding: "8px 10px", fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "left", whiteSpace: "nowrap", borderBottom: "2px solid #e2e8f0", background: "white" }}>UTM Campaign</th>
                                        <th style={{ padding: "8px 10px", fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "left", whiteSpace: "nowrap", borderBottom: "2px solid #e2e8f0", background: "white" }}>Landing</th>
                                        <th style={{ padding: "8px 10px", fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "left", whiteSpace: "nowrap", borderBottom: "2px solid #e2e8f0", background: "white" }}>Dispositivo</th>
                                        <th style={{ padding: "8px 10px", fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "left", whiteSpace: "nowrap", borderBottom: "2px solid #e2e8f0", background: "white" }}>Abandono Hace</th>
                                        <th style={{ padding: "8px 10px", fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "left", whiteSpace: "nowrap", borderBottom: "2px solid #e2e8f0", background: "white" }}>Estado</th>
                                        <th style={{ padding: "8px 10px", fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "center", whiteSpace: "nowrap", borderBottom: "2px solid #e2e8f0", background: "white", width: "95px" }}></th>
                                    </>
                                ) : activeTab === 'borradores' ? (
                                    <>
                                        <th style={{ padding: "8px 10px", fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "left", whiteSpace: "nowrap", borderBottom: "2px solid #e2e8f0", background: "white" }}>ID</th>
                                        <th style={{ padding: "8px 10px", fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "left", whiteSpace: "nowrap", borderBottom: "2px solid #e2e8f0", background: "white" }}>Cliente</th>
                                        <th style={{ padding: "8px 10px", fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "left", whiteSpace: "nowrap", borderBottom: "2px solid #e2e8f0", background: "white" }}>Últ. Actualización</th>
                                        <th style={{ padding: "8px 10px", fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "center", whiteSpace: "nowrap", borderBottom: "2px solid #e2e8f0", background: "white", width: "95px" }}></th>
                                    </>
                                ) : (
                                    <>
                                        <th style={{ padding: "8px 10px", fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "left", whiteSpace: "nowrap", borderBottom: "2px solid #e2e8f0", background: "white", width: "6%" }}>Pedido</th>
                                        <th style={{ padding: "8px 10px", fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "left", whiteSpace: "nowrap", borderBottom: "2px solid #e2e8f0", background: "white", width: "9%" }}>Estado</th>
                                        <th style={{ padding: "8px 10px", fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "left", whiteSpace: "nowrap", borderBottom: "2px solid #e2e8f0", background: "white", width: "8%" }}>Fulfillment</th>
                                        <th style={{ padding: "8px 10px", fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "left", whiteSpace: "nowrap", borderBottom: "2px solid #e2e8f0", background: "white", width: "7%" }}>Transportista</th>
                                        <th style={{ padding: "8px 10px", fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "left", whiteSpace: "nowrap", borderBottom: "2px solid #e2e8f0", background: "white", width: "11%" }}>Cliente</th>
                                        <th style={{ padding: "8px 10px", fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "left", whiteSpace: "nowrap", borderBottom: "2px solid #e2e8f0", background: "white", width: "7%" }}>CP / Zona</th>
                                        <th style={{ padding: "8px 10px", fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "left", whiteSpace: "nowrap", borderBottom: "2px solid #e2e8f0", background: "white", width: "13%" }}>Producto</th>
                                        <th style={{ padding: "8px 10px", fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "right", whiteSpace: "nowrap", borderBottom: "2px solid #e2e8f0", background: "white", width: "7%" }}>Importe</th>
                                        <th style={{ padding: "8px 10px", fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "left", whiteSpace: "nowrap", borderBottom: "2px solid #e2e8f0", background: "white", width: "8%" }}>Gestor</th>
                                        <th style={{ padding: "8px 10px", fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "left", whiteSpace: "nowrap", borderBottom: "2px solid #e2e8f0", background: "white", width: "7%" }}>Riesgo</th>

                                        {activeTab === 'incidencias' && (
                                            <>
                                                <th style={{ padding: "8px 10px", fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "left", whiteSpace: "nowrap", borderBottom: "2px solid #e2e8f0", background: "white" }}>Tipo Incid.</th>
                                                <th style={{ padding: "8px 10px", fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "center", whiteSpace: "nowrap", borderBottom: "2px solid #e2e8f0", background: "white" }}>Intentos</th>
                                                <th style={{ padding: "8px 10px", fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "left", whiteSpace: "nowrap", borderBottom: "2px solid #e2e8f0", background: "white" }}>Días Abierta</th>
                                                <th style={{ padding: "8px 10px", fontSize: "11px", fontWeight: 700, color: "#ef4444", textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "right", whiteSpace: "nowrap", borderBottom: "2px solid #e2e8f0", background: "white" }}>Pérdida Est.</th>
                                            </>
                                        )}

                                        {activeTab === 'devoluciones' && (
                                            <>
                                                <th style={{ padding: "8px 10px", fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "left", whiteSpace: "nowrap", borderBottom: "2px solid #e2e8f0", background: "white" }}>Motivo Devol.</th>
                                                <th style={{ padding: "8px 10px", fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "right", whiteSpace: "nowrap", borderBottom: "2px solid #e2e8f0", background: "white" }}>Importe Devol.</th>
                                                <th style={{ padding: "8px 10px", fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "center", whiteSpace: "nowrap", borderBottom: "2px solid #e2e8f0", background: "white" }}>Estado Devol.</th>
                                                <th style={{ padding: "8px 10px", fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "right", whiteSpace: "nowrap", borderBottom: "2px solid #e2e8f0", background: "white" }}>Reembolso</th>
                                            </>
                                        )}

                                        {activeTab === 'en-transito' && <th style={{ padding: "8px 10px", fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "left", whiteSpace: "nowrap", borderBottom: "2px solid #e2e8f0", background: "white" }}>Días</th>}
                                        <th style={{ padding: "8px 10px", fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "left", whiteSpace: "nowrap", borderBottom: "2px solid #e2e8f0", background: "white", width: "7%" }}>Entrada</th>
                                        <th style={{ padding: "8px 10px", fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "center", whiteSpace: "nowrap", borderBottom: "2px solid #e2e8f0", background: "white", width: "7%" }}></th>
                                    </>
                                )}
                            </tr>
                        </thead>
                        <tbody>

                            {/* Example Row - 10045 */}
                            {activeTab !== 'por-gestionar' && activeTab !== 'en-transito' && activeTab !== 'incidencias' && activeTab !== 'devoluciones' && activeTab !== 'historial' && activeTab !== 'carritos-abandonados' && activeTab !== 'borradores' && (
                                <tr style={{
                                    cursor: "pointer",
                                    borderBottom: "1px solid #f1f5f9",
                                    height: "52px",
                                    maxHeight: "52px",
                                    transition: "background 0.1s",
                                }}
                                    onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                    onClick={(e) => {
                                        if ((e.target as HTMLElement).closest('[data-no-drawer]')) return;
                                        setSelectedOrder({ ref: "Example" });
                                    }}
                                >
                                    <ColumnaCheckbox pedido={{ ref: "Example" }} />
                                    <td style={{ padding: "0 10px", height: "52px", minWidth: "70px", maxWidth: "80px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <span style={{ fontSize: "13px", fontWeight: 700, color: "#3b82f6", display: "block" }}>#10045</span>
                                    </td>
                                    <td style={{ padding: "0 10px", height: "52px", minWidth: "110px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
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
                                    <td style={{ padding: "0 10px", height: "52px", minWidth: "85px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <span style={{ display: "inline-block", fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", background: "#ede9fe", border: "1px solid #ddd6fe", color: "#8b5cf6" }}>Beeping</span>
                                        {/** Tracking */}
                                        <a href={getTrackingUrl("GLS", "BP-1234444")} target="_blank" onClick={e => e.stopPropagation()} style={{ fontSize: "10px", color: "#3b82f6", display: "block", marginTop: "3px", textDecoration: "underline", fontWeight: 600 }}>BP-1234444</a>
                                    </td>
                                    <td style={{ padding: "0 10px", height: "52px", minWidth: "70px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <span style={{ display: "inline-block", fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", background: "#fef3c7", border: "1px solid #fde68a", color: "#d97706" }}>GLS</span>
                                    </td>
                                    <td style={{ padding: "0 10px", height: "52px", minWidth: "130px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <span style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a", display: "block" }}>Juan Pérez</span>
                                        <a href={`https://wa.me/${"+34 600 000 000"}`} target="_blank" onClick={e => e.stopPropagation()} style={{ fontSize: "11px", color: "#25d366", display: "block", textDecoration: "none", fontWeight: 600, marginTop: "2px" }}>
                                            💬 +34 600 000 000
                                        </a>
                                    </td>
                                    <td style={{ padding: "0 10px", height: "52px", minWidth: "80px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", display: "block" }}>28001</span>
                                        <span style={{ fontSize: "11px", color: "#64748b", display: "block", marginTop: "3px" }}>Madrid</span>
                                    </td>
                                    <td style={{ padding: "0 10px", height: "52px", minWidth: "140px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <span title="Zapatillas Nike Air Force" style={{ fontSize: "12px", fontWeight: 600, color: "#0f172a", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "155px" }}>
                                            Zapatillas Nike Air Force
                                        </span>
                                        <span style={{ fontSize: "11px", color: "#64748b", display: "block", marginTop: "3px" }}>Qty: 1</span>
                                    </td>
                                    <td style={{ padding: "0 10px", height: "52px", minWidth: "75px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <span style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a", display: "block" }}>€49.99</span>
                                        <span style={{ display: "inline-block", marginTop: "4px", fontSize: "9px", fontWeight: 800, padding: "2px 6px", borderRadius: "4px", background: "#f1f5f9", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>COD</span>
                                    </td>
                                    <td style={{ padding: "0 10px", height: "52px", minWidth: "85px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <span style={{ fontSize: "12px", fontWeight: 600, color: "#0f172a", display: "block" }}>🤖 Bot COD</span>
                                    </td>
                                    <td style={{ padding: "0 10px", height: "52px", minWidth: "80px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <ColumnaRiesgo riesgo={{ status: "green", score: 98 }} />
                                    </td>




                                    <td style={{ padding: "0 10px", height: "52px", minWidth: "70px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <span style={{ fontSize: "12px", fontWeight: 600, color: "#0f172a", display: "block" }}>Hoy</span>
                                        <span style={{ fontSize: "11px", color: "#64748b", display: "block", marginTop: "3px" }}>10:42</span>
                                    </td>
                                    <td data-no-drawer style={{ padding: "0 14px 0 6px", height: "52px", minWidth: "90px", textAlign: "right", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <ColumnaAcciones pedido={{ state: "en_preparacion" }} />
                                    </td>
                                </tr>
                            )}

                            {/* Example Row - 10046 */}
                            {activeTab !== 'en-transito' && activeTab !== 'incidencias' && activeTab !== 'devoluciones' && activeTab !== 'historial' && activeTab !== 'carritos-abandonados' && activeTab !== 'borradores' && (
                                <tr style={{
                                    cursor: "pointer",
                                    borderBottom: "1px solid #f1f5f9",
                                    height: "52px",
                                    maxHeight: "52px",
                                    transition: "background 0.1s",
                                }}
                                    onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                    onClick={(e) => {
                                        if ((e.target as HTMLElement).closest('[data-no-drawer]')) return;
                                        setSelectedOrder({ ref: "Example" });
                                    }}
                                >
                                    <ColumnaCheckbox pedido={{ ref: "Example" }} />
                                    <td style={{ padding: "0 10px", height: "52px", minWidth: "70px", maxWidth: "80px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <span style={{ fontSize: "13px", fontWeight: 700, color: "#3b82f6", display: "block" }}>#10046</span>
                                    </td>
                                    <td style={{ padding: "0 10px", height: "52px", minWidth: "110px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
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
                                    <td style={{ padding: "0 10px", height: "52px", minWidth: "85px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <span style={{ display: "inline-block", fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", background: "#fce7f3", border: "1px solid #fbcfe8", color: "#ec4899" }}>Dropea</span>
                                        <span style={{ fontSize: "10px", color: "#94a3b8", display: "block", marginTop: "3px", fontWeight: 600 }}>Sin tracking</span>
                                    </td>
                                    <td style={{ padding: "0 10px", height: "52px", minWidth: "70px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <span style={{ display: "inline-block", fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", background: "#fef3c7", border: "1px solid #fde68a", color: "#d97706" }}>GLS</span>
                                    </td>
                                    <td style={{ padding: "0 10px", height: "52px", minWidth: "130px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <span style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a", display: "block" }}>María Gómez</span>
                                        <a href={`https://wa.me/${"+34 600 000 001"}`} target="_blank" onClick={e => e.stopPropagation()} style={{ fontSize: "11px", color: "#25d366", display: "block", textDecoration: "none", fontWeight: 600, marginTop: "2px" }}>
                                            💬 +34 600 000 001
                                        </a>
                                    </td>
                                    <td style={{ padding: "0 10px", height: "52px", minWidth: "80px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", display: "block" }}>41002</span>
                                        <span style={{ fontSize: "11px", color: "#64748b", display: "block", marginTop: "3px" }}>Sevilla</span>
                                    </td>
                                    <td style={{ padding: "0 10px", height: "52px", minWidth: "140px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <span title="Camiseta Básica Blanca" style={{ fontSize: "12px", fontWeight: 600, color: "#0f172a", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "155px" }}>
                                            Camiseta Básica Blanca
                                        </span>
                                        <span style={{ fontSize: "11px", color: "#64748b", display: "block", marginTop: "3px" }}>Qty: 2</span>
                                    </td>
                                    <td style={{ padding: "0 10px", height: "52px", minWidth: "75px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <span style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a", display: "block" }}>€29.99</span>
                                        <span style={{ display: "inline-block", marginTop: "4px", fontSize: "9px", fontWeight: 800, padding: "2px 6px", borderRadius: "4px", background: "#f1f5f9", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>STRIPE</span>
                                    </td>
                                    <td style={{ padding: "0 10px", height: "52px", minWidth: "85px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <span style={{ fontSize: "12px", fontWeight: 600, color: "#0f172a", display: "block" }}>👤 María G.</span>
                                    </td>
                                    <td style={{ padding: "0 10px", height: "52px", minWidth: "80px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <ColumnaRiesgo riesgo={{ status: "yellow", score: 65 }} />
                                    </td>




                                    <td style={{ padding: "0 10px", height: "52px", minWidth: "70px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <span style={{ fontSize: "12px", fontWeight: 600, color: "#0f172a", display: "block" }}>Hoy</span>
                                        <span style={{ fontSize: "11px", color: "#64748b", display: "block", marginTop: "3px" }}>10:35</span>
                                    </td>
                                    <td data-no-drawer style={{ padding: "0 14px 0 6px", height: "52px", minWidth: "90px", textAlign: "right", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <ColumnaAcciones pedido={{ state: "reintento" }} />
                                    </td>
                                </tr>
                            )}

                            {/* Example Row - 10047 */}
                            {activeTab === 'todos' || activeTab === 'por-gestionar' && (
                                <tr style={{
                                    cursor: "pointer",
                                    borderBottom: "1px solid #f1f5f9",
                                    height: "52px",
                                    maxHeight: "52px",
                                    transition: "background 0.1s",
                                }}
                                    onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                    onClick={(e) => {
                                        if ((e.target as HTMLElement).closest('[data-no-drawer]')) return;
                                        setSelectedOrder({ ref: "Example" });
                                    }}
                                >
                                    <ColumnaCheckbox pedido={{ ref: "Example" }} />
                                    <td style={{ padding: "0 10px", height: "52px", minWidth: "70px", maxWidth: "80px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <span style={{ fontSize: "13px", fontWeight: 700, color: "#3b82f6", display: "block" }}>#10047</span>
                                    </td>
                                    <td style={{ padding: "0 10px", height: "52px", minWidth: "110px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
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
                                    <td style={{ padding: "0 10px", height: "52px", minWidth: "85px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <span style={{ fontSize: "11px", fontWeight: 600, color: "#94a3b8" }}>—</span>
                                        <span style={{ fontSize: "10px", color: "#94a3b8", display: "block", marginTop: "3px", fontWeight: 600 }}>Sin tracking</span>
                                    </td>
                                    <td style={{ padding: "0 10px", height: "52px", minWidth: "70px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <span style={{ fontSize: "11px", fontWeight: 600, color: "#94a3b8" }}>—</span>
                                    </td>
                                    <td style={{ padding: "0 10px", height: "52px", minWidth: "130px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <span style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a", display: "block" }}>Carlos López</span>
                                        <a href={`https://wa.me/${"+34 600 000 002"}`} target="_blank" onClick={e => e.stopPropagation()} style={{ fontSize: "11px", color: "#25d366", display: "block", textDecoration: "none", fontWeight: 600, marginTop: "2px" }}>
                                            💬 +34 600 000 002
                                        </a>
                                    </td>
                                    <td style={{ padding: "0 10px", height: "52px", minWidth: "80px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", display: "block" }}>08001</span>
                                        <span style={{ fontSize: "11px", color: "#64748b", display: "block", marginTop: "3px" }}>Barcelona</span>
                                    </td>
                                    <td style={{ padding: "0 10px", height: "52px", minWidth: "140px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <span title="Sudadera Urban Black" style={{ fontSize: "12px", fontWeight: 600, color: "#0f172a", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "155px" }}>
                                            Sudadera Urban Black
                                        </span>
                                        <span style={{ fontSize: "11px", color: "#64748b", display: "block", marginTop: "3px" }}>Qty: 1</span>
                                    </td>
                                    <td style={{ padding: "0 10px", height: "52px", minWidth: "75px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <span style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a", display: "block" }}>€59.90</span>
                                        <span style={{ display: "inline-block", marginTop: "4px", fontSize: "9px", fontWeight: 800, padding: "2px 6px", borderRadius: "4px", background: "#f1f5f9", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>COD</span>
                                    </td>
                                    <td style={{ padding: "0 10px", height: "52px", minWidth: "85px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <span style={{ fontSize: "12px", fontWeight: 600, color: "#0f172a", display: "block" }}>⚠️ Sin gest.</span>
                                    </td>
                                    <td style={{ padding: "0 10px", height: "52px", minWidth: "80px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <ColumnaRiesgo riesgo={{ status: "red", score: 15 }} />
                                    </td>




                                    <td style={{ padding: "0 10px", height: "52px", minWidth: "70px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <span style={{ fontSize: "12px", fontWeight: 600, color: "#0f172a", display: "block" }}>Ayer</span>
                                        <span style={{ fontSize: "11px", color: "#64748b", display: "block", marginTop: "3px" }}>18:20</span>
                                    </td>
                                    <td data-no-drawer style={{ padding: "0 14px 0 6px", height: "52px", minWidth: "90px", textAlign: "right", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <ColumnaAcciones pedido={{ state: "nuevo" }} />
                                    </td>
                                </tr>
                            )}

                            {/* Example Row - 10048 */}
                            {activeTab === 'todos' || activeTab === 'en-transito' && (
                                <tr style={{
                                    cursor: "pointer",
                                    borderBottom: "1px solid #f1f5f9",
                                    height: "52px",
                                    maxHeight: "52px",
                                    transition: "background 0.1s",
                                }}
                                    onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                    onClick={(e) => {
                                        if ((e.target as HTMLElement).closest('[data-no-drawer]')) return;
                                        setSelectedOrder({ ref: "Example" });
                                    }}
                                >
                                    <ColumnaCheckbox pedido={{ ref: "Example" }} />
                                    <td style={{ padding: "0 10px", height: "52px", minWidth: "70px", maxWidth: "80px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <span style={{ fontSize: "13px", fontWeight: 700, color: "#3b82f6", display: "block" }}>#10048</span>
                                    </td>
                                    <td style={{ padding: "0 10px", height: "52px", minWidth: "110px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
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
                                    <td style={{ padding: "0 10px", height: "52px", minWidth: "85px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <span style={{ display: "inline-block", fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", background: "#ede9fe", border: "1px solid #ddd6fe", color: "#8b5cf6" }}>Beeping</span>
                                        {/** Tracking */}
                                        <a href={getTrackingUrl("Correos Exp.", "PQ41029312")} target="_blank" onClick={e => e.stopPropagation()} style={{ fontSize: "10px", color: "#3b82f6", display: "block", marginTop: "3px", textDecoration: "underline", fontWeight: 600 }}>PQ41029312</a>
                                    </td>
                                    <td style={{ padding: "0 10px", height: "52px", minWidth: "70px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <span style={{ display: "inline-block", fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", background: "#bfdbfe", border: "1px solid #93c5fd", color: "#2563eb" }}>Correos Exp.</span>
                                    </td>
                                    <td style={{ padding: "0 10px", height: "52px", minWidth: "130px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <span style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a", display: "block" }}>Ana Martínez</span>
                                        <a href={`https://wa.me/${"+34 600 000 003"}`} target="_blank" onClick={e => e.stopPropagation()} style={{ fontSize: "11px", color: "#25d366", display: "block", textDecoration: "none", fontWeight: 600, marginTop: "2px" }}>
                                            💬 +34 600 000 003
                                        </a>
                                    </td>
                                    <td style={{ padding: "0 10px", height: "52px", minWidth: "80px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", display: "block" }}>46001</span>
                                        <span style={{ fontSize: "11px", color: "#64748b", display: "block", marginTop: "3px" }}>Valencia</span>
                                    </td>
                                    <td style={{ padding: "0 10px", height: "52px", minWidth: "140px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <span title="Auriculares Inalámbricos" style={{ fontSize: "12px", fontWeight: 600, color: "#0f172a", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "155px" }}>
                                            Auriculares Inalámbricos
                                        </span>
                                        <span style={{ fontSize: "11px", color: "#64748b", display: "block", marginTop: "3px" }}>Qty: 1</span>
                                    </td>
                                    <td style={{ padding: "0 10px", height: "52px", minWidth: "75px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <span style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a", display: "block" }}>€89.00</span>
                                        <span style={{ display: "inline-block", marginTop: "4px", fontSize: "9px", fontWeight: 800, padding: "2px 6px", borderRadius: "4px", background: "#f1f5f9", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>TARJETA</span>
                                    </td>
                                    <td style={{ padding: "0 10px", height: "52px", minWidth: "85px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <span style={{ fontSize: "12px", fontWeight: 600, color: "#0f172a", display: "block" }}>👤 Sistema</span>
                                    </td>
                                    <td style={{ padding: "0 10px", height: "52px", minWidth: "80px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <ColumnaRiesgo riesgo={{ status: "green", score: 99 }} />
                                    </td>



                                    {activeTab === 'en-transito' && (
                                        <td style={{ padding: "0 10px", height: "52px", minWidth: "70px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                            <span style={{ fontSize: "10px", fontWeight: 800, padding: "4px 8px", borderRadius: "6px", background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca" }}>
                                                8 Días
                                            </span>
                                        </td>
                                    )}


                                    <td style={{ padding: "0 10px", height: "52px", minWidth: "70px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <span style={{ fontSize: "12px", fontWeight: 600, color: "#0f172a", display: "block" }}>Hace 8d</span>
                                        <span style={{ fontSize: "11px", color: "#64748b", display: "block", marginTop: "3px" }}>12:05</span>
                                    </td>
                                    <td data-no-drawer style={{ padding: "0 14px 0 6px", height: "52px", minWidth: "90px", textAlign: "right", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <ColumnaAcciones pedido={{ state: "enviado" }} />
                                    </td>
                                </tr>
                            )}

                            {/* Example Row - 10049 */}
                            {activeTab === 'todos' || activeTab === 'incidencias' && (
                                <tr style={{
                                    cursor: "pointer",
                                    borderBottom: "1px solid #f1f5f9",
                                    height: "52px",
                                    maxHeight: "52px",
                                    transition: "background 0.1s",
                                }}
                                    onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                    onClick={(e) => {
                                        if ((e.target as HTMLElement).closest('[data-no-drawer]')) return;
                                        setSelectedOrder({ ref: "Example" });
                                    }}
                                >
                                    <ColumnaCheckbox pedido={{ ref: "Example" }} />
                                    <td style={{ padding: "0 10px", height: "52px", minWidth: "70px", maxWidth: "80px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <span style={{ fontSize: "13px", fontWeight: 700, color: "#3b82f6", display: "block" }}>#10049</span>
                                    </td>
                                    <td style={{ padding: "0 10px", height: "52px", minWidth: "110px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
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
                                    <td style={{ padding: "0 10px", height: "52px", minWidth: "85px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <span style={{ display: "inline-block", fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", background: "#ede9fe", border: "1px solid #ddd6fe", color: "#8b5cf6" }}>Beeping</span>
                                        <span style={{ fontSize: "10px", color: "#94a3b8", display: "block", marginTop: "3px", fontWeight: 600 }}>Sin tracking</span>
                                    </td>
                                    <td style={{ padding: "0 10px", height: "52px", minWidth: "70px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <span style={{ display: "inline-block", fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", background: "#fef3c7", border: "1px solid #fde68a", color: "#d97706" }}>GLS</span>
                                    </td>
                                    <td style={{ padding: "0 10px", height: "52px", minWidth: "130px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <span style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a", display: "block" }}>Luis García</span>
                                        <a href={`https://wa.me/${"+34 600 000 004"}`} target="_blank" onClick={e => e.stopPropagation()} style={{ fontSize: "11px", color: "#25d366", display: "block", textDecoration: "none", fontWeight: 600, marginTop: "2px" }}>
                                            💬 +34 600 000 004
                                        </a>
                                    </td>
                                    <td style={{ padding: "0 10px", height: "52px", minWidth: "80px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", display: "block" }}>29001</span>
                                        <span style={{ fontSize: "11px", color: "#64748b", display: "block", marginTop: "3px" }}>Málaga</span>
                                    </td>
                                    <td style={{ padding: "0 10px", height: "52px", minWidth: "140px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <span title="Chaqueta Invierno XL" style={{ fontSize: "12px", fontWeight: 600, color: "#0f172a", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "155px" }}>
                                            Chaqueta Invierno XL
                                        </span>
                                        <span style={{ fontSize: "11px", color: "#64748b", display: "block", marginTop: "3px" }}>Qty: 1</span>
                                    </td>
                                    <td style={{ padding: "0 10px", height: "52px", minWidth: "75px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <span style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a", display: "block" }}>€120.00</span>
                                        <span style={{ display: "inline-block", marginTop: "4px", fontSize: "9px", fontWeight: 800, padding: "2px 6px", borderRadius: "4px", background: "#f1f5f9", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>COD</span>
                                    </td>
                                    <td style={{ padding: "0 10px", height: "52px", minWidth: "85px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <span style={{ fontSize: "12px", fontWeight: 600, color: "#0f172a", display: "block" }}>👤 María G.</span>
                                    </td>
                                    <td style={{ padding: "0 10px", height: "52px", minWidth: "80px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <ColumnaRiesgo riesgo={{ status: "yellow", score: 33 }} />
                                    </td>


                                    {activeTab === 'incidencias' && (
                                        <>
                                            <td style={{ padding: "0 10px", height: "52px", minWidth: "70px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                                <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 6px", borderRadius: "4px", background: "#fee2e2", color: "#b91c1c", whiteSpace: "nowrap" }}>
                                                    Dirección Incorrecta
                                                </span>
                                            </td>
                                            <td style={{ padding: "0 10px", height: "52px", minWidth: "70px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>2</td>
                                            <td style={{ padding: "0 10px", height: "52px", minWidth: "70px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                                <span style={{ fontSize: "10px", fontWeight: 700 }}>4 días</span>
                                            </td>
                                            <td style={{ padding: "0 10px", height: "52px", minWidth: "70px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>€15.50</td>
                                        </>
                                    )}



                                    <td style={{ padding: "0 10px", height: "52px", minWidth: "70px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <span style={{ fontSize: "12px", fontWeight: 600, color: "#0f172a", display: "block" }}>Hace 6d</span>
                                        <span style={{ fontSize: "11px", color: "#64748b", display: "block", marginTop: "3px" }}>09:12</span>
                                    </td>
                                    <td data-no-drawer style={{ padding: "0 14px 0 6px", height: "52px", minWidth: "90px", textAlign: "right", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <ColumnaAcciones pedido={{ state: "fallido" }} />
                                    </td>
                                </tr>
                            )}

                            {/* Example Row - 10050 */}
                            {activeTab === 'todos' || activeTab === 'devoluciones' && (
                                <tr style={{
                                    cursor: "pointer",
                                    borderBottom: "1px solid #f1f5f9",
                                    height: "52px",
                                    maxHeight: "52px",
                                    transition: "background 0.1s",
                                }}
                                    onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                    onClick={(e) => {
                                        if ((e.target as HTMLElement).closest('[data-no-drawer]')) return;
                                        setSelectedOrder({ ref: "Example" });
                                    }}
                                >
                                    <ColumnaCheckbox pedido={{ ref: "Example" }} />
                                    <td style={{ padding: "0 10px", height: "52px", minWidth: "70px", maxWidth: "80px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <span style={{ fontSize: "13px", fontWeight: 700, color: "#3b82f6", display: "block" }}>#10050</span>
                                    </td>
                                    <td style={{ padding: "0 10px", height: "52px", minWidth: "110px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
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
                                    <td style={{ padding: "0 10px", height: "52px", minWidth: "85px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <span style={{ display: "inline-block", fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", background: "#ede9fe", border: "1px solid #ddd6fe", color: "#8b5cf6" }}>Beeping</span>
                                        {/** Tracking */}
                                        <a href={getTrackingUrl("Correos Exp.", "PQ41029888")} target="_blank" onClick={e => e.stopPropagation()} style={{ fontSize: "10px", color: "#3b82f6", display: "block", marginTop: "3px", textDecoration: "underline", fontWeight: 600 }}>PQ41029888</a>
                                    </td>
                                    <td style={{ padding: "0 10px", height: "52px", minWidth: "70px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <span style={{ display: "inline-block", fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", background: "#bfdbfe", border: "1px solid #93c5fd", color: "#2563eb" }}>Correos Exp.</span>
                                    </td>
                                    <td style={{ padding: "0 10px", height: "52px", minWidth: "130px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <span style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a", display: "block" }}>Marta Díaz</span>
                                        <a href={`https://wa.me/${"+34 600 000 005"}`} target="_blank" onClick={e => e.stopPropagation()} style={{ fontSize: "11px", color: "#25d366", display: "block", textDecoration: "none", fontWeight: 600, marginTop: "2px" }}>
                                            💬 +34 600 000 005
                                        </a>
                                    </td>
                                    <td style={{ padding: "0 10px", height: "52px", minWidth: "80px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", display: "block" }}>03001</span>
                                        <span style={{ fontSize: "11px", color: "#64748b", display: "block", marginTop: "3px" }}>Alicante</span>
                                    </td>
                                    <td style={{ padding: "0 10px", height: "52px", minWidth: "140px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <span title="Bolso Piel Sintética" style={{ fontSize: "12px", fontWeight: 600, color: "#0f172a", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "155px" }}>
                                            Bolso Piel Sintética
                                        </span>
                                        <span style={{ fontSize: "11px", color: "#64748b", display: "block", marginTop: "3px" }}>Qty: 1</span>
                                    </td>
                                    <td style={{ padding: "0 10px", height: "52px", minWidth: "75px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <span style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a", display: "block" }}>€49.90</span>
                                        <span style={{ display: "inline-block", marginTop: "4px", fontSize: "9px", fontWeight: 800, padding: "2px 6px", borderRadius: "4px", background: "#f1f5f9", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>TARJETA</span>
                                    </td>
                                    <td style={{ padding: "0 10px", height: "52px", minWidth: "85px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <span style={{ fontSize: "12px", fontWeight: 600, color: "#0f172a", display: "block" }}>👤 María G.</span>
                                    </td>
                                    <td style={{ padding: "0 10px", height: "52px", minWidth: "80px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <ColumnaRiesgo riesgo={{ status: "green", score: 80 }} />
                                    </td>


                                    {activeTab === 'devoluciones' && (
                                        <>
                                            <td style={{ padding: "0 10px", height: "52px", minWidth: "70px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}><span style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-muted)" }}>Cliente Rechaza</span></td>
                                            <td style={{ padding: "0 10px", height: "52px", minWidth: "70px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>€49.90</td>
                                            <td style={{ padding: "0 10px", height: "52px", minWidth: "70px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}><span style={{ fontSize: "9px", fontWeight: 800, padding: "2px 6px", borderRadius: "12px", background: "#fef3c7", color: "#d97706" }}>En proceso</span></td>
                                            <td style={{ padding: "0 10px", height: "52px", minWidth: "70px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>-</td>
                                        </>
                                    )}



                                    <td style={{ padding: "0 10px", height: "52px", minWidth: "70px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <span style={{ fontSize: "12px", fontWeight: 600, color: "#0f172a", display: "block" }}>Hace 2d</span>
                                        <span style={{ fontSize: "11px", color: "#64748b", display: "block", marginTop: "3px" }}>14:15</span>
                                    </td>
                                    <td data-no-drawer style={{ padding: "0 14px 0 6px", height: "52px", minWidth: "90px", textAlign: "right", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <ColumnaAcciones pedido={{ state: "devolucion" }} />
                                    </td>
                                </tr>
                            )}

                            {/* Example Row - 10041 */}
                            {activeTab === 'todos' || activeTab === 'historial' && (
                                <tr style={{
                                    cursor: "pointer",
                                    borderBottom: "1px solid #f1f5f9",
                                    height: "52px",
                                    maxHeight: "52px",
                                    transition: "background 0.1s",
                                }}
                                    onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                    onClick={(e) => {
                                        if ((e.target as HTMLElement).closest('[data-no-drawer]')) return;
                                        setSelectedOrder({ ref: "Example" });
                                    }}
                                >
                                    <ColumnaCheckbox pedido={{ ref: "Example" }} />
                                    <td style={{ padding: "0 10px", height: "52px", minWidth: "70px", maxWidth: "80px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <span style={{ fontSize: "13px", fontWeight: 700, color: "#3b82f6", display: "block" }}>#10041</span>
                                    </td>
                                    <td style={{ padding: "0 10px", height: "52px", minWidth: "110px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
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
                                    <td style={{ padding: "0 10px", height: "52px", minWidth: "85px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <span style={{ display: "inline-block", fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", background: "#ede9fe", border: "1px solid #ddd6fe", color: "#8b5cf6" }}>Beeping</span>
                                        {/** Tracking */}
                                        <a href={getTrackingUrl("GLS", "GLS0012929")} target="_blank" onClick={e => e.stopPropagation()} style={{ fontSize: "10px", color: "#3b82f6", display: "block", marginTop: "3px", textDecoration: "underline", fontWeight: 600 }}>GLS0012929</a>
                                    </td>
                                    <td style={{ padding: "0 10px", height: "52px", minWidth: "70px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <span style={{ display: "inline-block", fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", background: "#fef3c7", border: "1px solid #fde68a", color: "#d97706" }}>GLS</span>
                                    </td>
                                    <td style={{ padding: "0 10px", height: "52px", minWidth: "130px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <span style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a", display: "block" }}>Javier Nieto</span>
                                        <a href={`https://wa.me/${"+34 600 000 006"}`} target="_blank" onClick={e => e.stopPropagation()} style={{ fontSize: "11px", color: "#25d366", display: "block", textDecoration: "none", fontWeight: 600, marginTop: "2px" }}>
                                            💬 +34 600 000 006
                                        </a>
                                    </td>
                                    <td style={{ padding: "0 10px", height: "52px", minWidth: "80px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", display: "block" }}>15001</span>
                                        <span style={{ fontSize: "11px", color: "#64748b", display: "block", marginTop: "3px" }}>A Coruña</span>
                                    </td>
                                    <td style={{ padding: "0 10px", height: "52px", minWidth: "140px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <span title="Monitor Gaming 24&quot;" style={{ fontSize: "12px", fontWeight: 600, color: "#0f172a", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "155px" }}>
                                            Monitor Gaming 24&quot;
                                        </span>
                                        <span style={{ fontSize: "11px", color: "#64748b", display: "block", marginTop: "3px" }}>Qty: 1</span>
                                    </td>
                                    <td style={{ padding: "0 10px", height: "52px", minWidth: "75px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <span style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a", display: "block" }}>€199.00</span>
                                        <span style={{ display: "inline-block", marginTop: "4px", fontSize: "9px", fontWeight: 800, padding: "2px 6px", borderRadius: "4px", background: "#f1f5f9", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>TARJETA</span>
                                    </td>
                                    <td style={{ padding: "0 10px", height: "52px", minWidth: "85px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <span style={{ fontSize: "12px", fontWeight: 600, color: "#0f172a", display: "block" }}>👤 Sistema</span>
                                    </td>
                                    <td style={{ padding: "0 10px", height: "52px", minWidth: "80px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <ColumnaRiesgo riesgo={{ status: "green", score: 100 }} />
                                    </td>




                                    <td style={{ padding: "0 10px", height: "52px", minWidth: "70px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <span style={{ fontSize: "12px", fontWeight: 600, color: "#0f172a", display: "block" }}>Hace 12d</span>
                                        <span style={{ fontSize: "11px", color: "#64748b", display: "block", marginTop: "3px" }}>10:00</span>
                                    </td>
                                    <td data-no-drawer style={{ padding: "0 14px 0 6px", height: "52px", minWidth: "90px", textAlign: "right", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <ColumnaAcciones pedido={{ state: "entregado" }} />
                                    </td>
                                </tr>
                            )}


                            {/* Example Row - CARRITO ABANDONADO */}
                            {activeTab === 'carritos-abandonados' && (
                                <tr style={{
                                    cursor: "pointer",
                                    borderBottom: "1px solid #f1f5f9",
                                    height: "52px",
                                    maxHeight: "52px",
                                    transition: "background 0.1s",
                                }}
                                    onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                    onClick={(e) => {
                                        if ((e.target as HTMLElement).closest('[data-no-drawer]')) return;
                                        setSelectedOrder({ ref: "Example" });
                                    }}
                                >
                                    <td style={{ padding: "0 8px 0 12px", height: "52px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <input type="checkbox" style={{ width: "14px", height: "14px", cursor: "pointer" }} />
                                    </td>
                                    <td style={{ padding: "10px 8px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}><a href="#" style={{ color: "var(--ops)", fontWeight: 700 }}>#C-4291</a></td>
                                    <td style={{ padding: "10px 8px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>Ana Martínez</td>
                                    <td style={{ color: "var(--text-muted)", fontSize: "11px", padding: "10px 8px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>+34 600 000 010</td>
                                    <td style={{ display: "flex", alignItems: "center", gap: "8px", paddingTop: "8px", padding: "10px 8px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <div style={{ width: "24px", height: "24px", borderRadius: "4px", background: "#f1f5f9" }} />
                                        <div style={{ display: "flex", flexDirection: "column" }}>
                                            <span style={{ fontWeight: 600, fontSize: "11px", maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Pack Cosmética</span>
                                            <span style={{ color: "var(--text-dim)", fontSize: "10px", marginTop: "2px" }}>Qty: 2</span>
                                        </div>
                                    </td>
                                    <td style={{ fontWeight: 700, margin: "0 auto", textAlign: "right", color: "var(--color-text-primary)", padding: "10px 8px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>€89.00</td>
                                    <td style={{ padding: "10px 8px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}><span style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-muted)" }}>ig_story</span></td>
                                    <td style={{ padding: "10px 8px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}><span style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-muted)" }}>promo_sanvalentin</span></td>
                                    <td style={{ padding: "10px 8px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}><span style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-muted)" }}>/p/cosmetica-pack</span></td>
                                    <td style={{ padding: "10px 8px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                            <span style={{ fontSize: "12px" }}>📱</span>
                                            <span style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 600 }}>iPhone (iOS 17)</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: "10px 8px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <span style={{ fontSize: "10px", fontWeight: 800, padding: "2px 6px", borderRadius: "12px", background: "#fee2e2", color: "#dc2626" }}>
                                            45 min
                                        </span>
                                    </td>
                                    <td style={{ padding: "10px 8px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "20px", background: "#fef3c7", color: "#d97706" }}>
                                            Abandonado
                                        </span>
                                    </td>
                                    <td data-no-drawer style={{ padding: "8px", textAlign: "right", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <ColumnaAcciones pedido={{ state: "nuevo" }} />
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {selectedOrder && <OrderDrawer pedido={selectedOrder} onClose={() => setSelectedOrder(null)} />}
        </div>
    );
}
