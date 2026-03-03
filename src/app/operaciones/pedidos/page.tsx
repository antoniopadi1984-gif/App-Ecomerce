'use client';

import React, { useState } from 'react';
import { RefreshCw, Search, Filter, MapPin, User, AlertTriangle } from 'lucide-react';
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



const FULFILLMENT_BADGES: Record<string, { label: string; color: string; bg: string; border: string }> = {
    "beeping": { label: "Beeping", color: "#ca8a04", bg: "rgba(234,179,8,0.15)", border: "rgba(234,179,8,0.4)" },
    "dropea": { label: "Dropea", color: "#1e40af", bg: "rgba(30,64,175,0.1)", border: "rgba(30,64,175,0.3)" },
    "shopify": { label: "Shopify", color: "#16a34a", bg: "rgba(22,163,74,0.1)", border: "rgba(22,163,74,0.3)" },
    "dropi": { label: "Dropi", color: "#ea580c", bg: "rgba(234,88,12,0.1)", border: "rgba(234,88,12,0.3)" },
    "manual": { label: "Manual", color: "#64748b", bg: "rgba(100,116,139,0.1)", border: "rgba(100,116,139,0.3)" },
    "none": { label: "—", color: "#94a3b8", bg: "transparent", border: "transparent" }
};

function FulfillmentBadge({ type }: { type: string }) {
    const b = FULFILLMENT_BADGES[type] ?? FULFILLMENT_BADGES["none"];
    return (
        <span style={{
            background: b.bg,
            color: b.color,
            border: `1px solid ${b.border}`,
            fontSize: "11px",
            fontWeight: 700,
            borderRadius: "6px",
            padding: "3px 8px",
            whiteSpace: "nowrap",
            display: "inline-block",
        }}>
            {b.label}
        </span>
    );
}


function StateBadge({ state }: { state: string }) {
    // @ts-expect-error - Dictionary indexing safe
    const s = ORDER_STATES[state] || ORDER_STATES.nuevo;
    return (
        <div style={{
            display: "inline-flex", alignItems: "center", gap: "4px",
            padding: "4px 8px", borderRadius: "6px",
            background: s.bg, color: s.color,
            fontSize: "10px", fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase"
        }}>
            <span style={{ fontSize: "6px" }}>{s.icon}</span>
            {s.label}
        </div>
    );
}

function formatDate(_date?: string) {
    return "12 Oct 2023";
}

function formatTime(_date?: string) {
    return "14:32";
}

function calcTiempo(from?: string, to?: string | Date): string {
    if (!from || !to) return "—";
    const toDate = to instanceof Date ? to : new Date(to);
    const diff = toDate.getTime() - new Date(from).getTime();
    if (isNaN(diff) || diff < 0) return "—";
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    if (h === 0) return `${m}min`;
    const d = Math.floor(h / 24);
    if (d > 0) return `${d}d ${h % 24}h`;
    return `${h}h ${m}min`;
}

type TimelineEventType = "info" | "success" | "warning" | "error";
type TimelineSource = "shopify" | "beeping" | "dropea" | "dropi" | "17track" | "sistema" | "usuario";

interface TimelineEvent {
    label: string;
    description: string;
    type: TimelineEventType;
    source: TimelineSource;
    timestamp: string;
}

const SOURCE_COLORS: Record<TimelineSource, string> = {
    shopify: "#16a34a",
    beeping: "#ca8a04",
    dropea: "#1e40af",
    dropi: "#ea580c",
    "17track": "#7c3aed",
    sistema: "#0891b2",
    usuario: "#64748b",
};

const MOCK_TIMELINE: TimelineEvent[] = [
    { label: "Pedido creado en Shopify", description: "Referencia #10045", type: "info", source: "shopify", timestamp: "2023-10-12T10:42:00Z" },
    { label: "Pago procesado", description: "Stripe · CH_12932", type: "success", source: "shopify", timestamp: "2023-10-12T10:42:30Z" },
    { label: "Pedido enviado a Beeping", description: "Sync automática", type: "info", source: "sistema", timestamp: "2023-10-12T10:43:00Z" },
    { label: "Beeping: Pedido recibido", description: "Status 1", type: "info", source: "beeping", timestamp: "2023-10-12T10:45:00Z" },
    { label: "Beeping: En preparación", description: "Status 3", type: "info", source: "beeping", timestamp: "2023-10-12T11:00:00Z" },
    { label: "Beeping: Etiqueta generada", description: "GLS · GLS0012929", type: "info", source: "beeping", timestamp: "2023-10-12T11:30:00Z" },
    { label: "Tracking registrado en 17track", description: "GLS0012929", type: "info", source: "17track", timestamp: "2023-10-12T12:00:00Z" },
    { label: "Recogido por carrier", description: "GLS en Madrid", type: "info", source: "17track", timestamp: "2023-10-13T08:00:00Z" },
    { label: "En réparto hoy", description: "Repartidor asignado", type: "info", source: "17track", timestamp: "2023-10-14T09:00:00Z" },
    { label: "Entregado", description: "Firmado por cliente", type: "success", source: "17track", timestamp: "2023-10-14T11:20:00Z" },
];

async function fetchMetaAd(adId: string, accessToken: string) {
    const fields = "name,effective_status,creative{thumbnail_url,object_type},adset{name},campaign{name}";
    const insightFields = "ctr,cpc,cpm,impressions,clicks,spend";
    const [adRes, insightsRes] = await Promise.all([
        fetch(`https://graph.facebook.com/v19.0/${adId}?fields=${fields}&access_token=${accessToken}`),
        fetch(`https://graph.facebook.com/v19.0/${adId}/insights?fields=${insightFields}&access_token=${accessToken}`)
    ]);
    const ad = await adRes.json();
    const insights = await insightsRes.json();
    return { ...ad, insights: insights.data?.[0] ?? null };
}

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
        <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "3px",
            height: "100%",
        }}>
            {/* Línea 1: punto + número — siempre juntos */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{
                    width: "9px", height: "9px", borderRadius: "50%",
                    flexShrink: 0, display: "inline-block",
                    background: riesgo.status === "red" ? "#ef4444"
                        : riesgo.status === "yellow" ? "#eab308" : "#22c55e"
                }} />
                <span style={{ fontSize: "14px", fontWeight: 900, color: "#0f172a", lineHeight: 1 }}>
                    {riesgo.score}
                </span>
            </div>

            {/* Línea 2: etiqueta — alineada con el número, no con el punto */}
            <span style={{
                fontSize: "11px", fontWeight: 600,
                textAlign: "center",
                lineHeight: 1,
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


const DRAWER_TABS = [
    { key: "cliente", label: "Cliente", icon: "👤" },
    { key: "timeline", label: "Timeline", icon: "📋" },
    { key: "riesgo", label: "Riesgo", icon: "🛡️" },
    { key: "origen", label: "Origen", icon: "📡" },
    { key: "historial", label: "Historial", icon: "🕐" },
    { key: "comunicaciones", label: "Mensajes", icon: "💬" },
    { key: "notas", label: "Notas", icon: "📝" }
];


function DrawerSection({ title, children }: { title: string, children: React.ReactNode }) {
    const items = React.Children.toArray(children);
    const enhanced = items.map((child, i) =>
        React.isValidElement(child) && i === items.length - 1
            ? React.cloneElement(child as React.ReactElement<{ isLast?: boolean }>, { isLast: true })
            : child
    );
    return (
        <div style={{ marginBottom: "6px" }}>
            <p style={{
                fontSize: "10px", fontWeight: 900, textTransform: "uppercase",
                color: "#94a3b8", letterSpacing: "0.08em",
                margin: "0 0 2px 0",
                paddingLeft: "2px",
            }}>
                {title}
            </p>
            <div style={{
                background: "#f8fafc", borderRadius: "8px",
                padding: "2px 10px",
            }}>
                {enhanced}
            </div>
        </div>
    );
}

function DrawerRow({ label, value, isLast }: { label: string, value: React.ReactNode, isLast?: boolean }) {
    return (
        <div style={{
            display: "flex", justifyContent: "space-between",
            alignItems: "center",
            padding: "3px 0",
            borderBottom: isLast ? "none" : "1px solid #f1f5f9",
            minHeight: "24px",
        }}>
            <span style={{ fontSize: "12px", color: "#64748b", minWidth: "110px" }}>
                {label}
            </span>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "#0f172a", textAlign: "right" }}>
                {value}
            </span>
        </div>
    );
}

function CarrierBadge({ type }: { type: string }) {
    const bg = type === "Correos Exp." ? "#dbeafe" : "#fef3c7";
    const color = type === "Correos Exp." ? "#2563eb" : "#d97706";
    const border = type === "Correos Exp." ? "#bfdbfe" : "#fde68a";
    return (
        <span style={{
            background: bg, color: color, border: `1px solid ${border}`,
            fontSize: "10px", fontWeight: 700, borderRadius: "4px",
            padding: "2px 8px", whiteSpace: "nowrap", display: "inline-block"
        }}>
            {type || "GLS"}
        </span>
    );
}
type RiskLevel = "low" | "medium" | "high";

interface RiskFactor {
    key: string;
    label: string;
    value: string;
    risk: RiskLevel;
    points: number;
    source: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function calcClienteMetrics(pedidos: Record<string, any>[]) {
    const total = pedidos.length;
    const entregados = pedidos.filter(p => p.state === "entregado").length;
    const devueltos = pedidos.filter(p => ["devolucion", "devuelto"].includes(p.state)).length;
    const incidencias = pedidos.filter(p => p.state === "incidencia").length;
    const totalGastado = pedidos
        .filter(p => p.state === "entregado")
        .reduce((acc, p) => acc + parseFloat(p.importe || "0"), 0);
    const sorted = [...pedidos].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return {
        totalPedidos: total,
        totalGastado: totalGastado.toFixed(2),
        ticketMedio: entregados > 0 ? (totalGastado / entregados).toFixed(2) : "0.00",
        tasaEntrega: total > 0 ? ((entregados / total) * 100).toFixed(1) : "0",
        tasaDevolucion: total > 0 ? ((devueltos / total) * 100).toFixed(1) : "0",
        tasaIncidencia: total > 0 ? ((incidencias / total) * 100).toFixed(1) : "0",
        pedidosEntregados: entregados,
        pedidosDevoluciones: devueltos,
        ultimoPedido: sorted[0]?.createdAt ?? null,
        primerPedido: sorted[sorted.length - 1]?.createdAt ?? null,
    };
}

function getCPRiskLevel(cp: string): { label: string; level: RiskLevel } {
    // Hardcoded high-risk CPs known from returns history; replace with DB query
    const high = ["18008", "18009", "18010", "29001", "28005", "28012", "08001", "08002", "08003"];
    const medium = ["41001", "41002", "46001", "46002", "50001", "03001", "03002"];
    if (high.some(x => cp.startsWith(x.slice(0, 3)))) return { label: "Alto riesgo", level: "high" };
    if (medium.some(x => cp.startsWith(x.slice(0, 3)))) return { label: "Riesgo medio", level: "medium" };
    return { label: "Riesgo bajo", level: "low" };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function calcRiskScore(pedido: Record<string, any>): { score: number; factors: RiskFactor[] } {
    const factors: RiskFactor[] = [];

    // CP zona
    const cpRisk = getCPRiskLevel(pedido?.shipping_zip || "00000");
    factors.push({
        key: "cp", label: `Zona CP ${pedido?.shipping_zip || "—"}`,
        value: cpRisk.label, risk: cpRisk.level,
        points: cpRisk.level === "high" ? 40 : cpRisk.level === "medium" ? 20 : 0,
        source: "datos propios"
    });

    // Devoluciones previas
    const devs = pedido?.clienteStats?.totalDevoluciones ?? 0;
    if (devs > 2) factors.push({
        key: "devoluciones", label: "Devoluciones previas",
        value: `${devs} devoluciones`, risk: "high", points: 30, source: "historial"
    });
    else if (devs > 0) factors.push({
        key: "devoluciones", label: "Devoluciones previas",
        value: `${devs} devolución`, risk: "medium", points: 10, source: "historial"
    });
    else factors.push({
        key: "devoluciones", label: "Sin devoluciones previas",
        value: "OK", risk: "low", points: -10, source: "historial"
    });

    // Teléfono válido
    const tel = (pedido?.telefono || "").replace(/\s/g, "");
    const telValid = /^(\+34|0034|34)?[6789]\d{8}$/.test(tel);
    factors.push({
        key: "telefono", label: "Teléfono válido",
        value: telValid ? "OK" : "Inválido", risk: telValid ? "low" : "high",
        points: telValid ? -5 : 25, source: "validación local"
    });

    // IP vs dirección
    if (pedido?.geoCity && pedido?.shipping_city) {
        const match = pedido.geoCity.toLowerCase() === pedido.shipping_city.toLowerCase();
        factors.push({
            key: "ip_geo", label: "IP coincide con dirección",
            value: match ? "Coincide" : `IP: ${pedido.geoCity}`, risk: match ? "low" : "medium",
            points: match ? -5 : 15, source: "geolocalización"
        });
    }

    // VPN/Proxy
    if (pedido?.isProxy) factors.push({
        key: "vpn", label: "VPN/Proxy detectado",
        value: "⚠️ Detectado", risk: "high", points: 35, source: "ipinfo.io"
    });

    // Nombre completo
    const hasRealName = (pedido?.cliente || "").trim().split(" ").length >= 2;
    factors.push({
        key: "nombre", label: "Nombre completo",
        value: hasRealName ? "OK" : "Solo un nombre", risk: hasRealName ? "low" : "medium",
        points: hasRealName ? 0 : 10, source: "validación local"
    });

    // Cliente nuevo vs recurrente
    const totalPedidos = pedido?.clienteStats?.totalPedidos ?? 1;
    if (totalPedidos === 1) factors.push({
        key: "nuevo", label: "Primera compra",
        value: "Cliente nuevo", risk: "medium", points: 10, source: "historial"
    });
    else factors.push({
        key: "recurrente", label: "Cliente recurrente",
        value: `${totalPedidos} pedidos`, risk: "low", points: -15, source: "historial"
    });

    // Método de pago
    const isCOD = ["COD", "Contra reembolso"].includes(pedido?.pago || "");
    factors.push({
        key: "pago", label: "Método de pago",
        value: isCOD ? "COD (mayor riesgo)" : (pedido?.pago || "—"), risk: isCOD ? "medium" : "low",
        points: isCOD ? 20 : 0, source: "shopify"
    });

    // Hora del pedido
    const hour = new Date(pedido?.createdAt || Date.now()).getHours();
    if (hour >= 2 && hour <= 6) factors.push({
        key: "hora", label: "Pedido en madrugada",
        value: `${hour}:00h`, risk: "medium", points: 10, source: "shopify"
    });

    const totalPoints = factors.reduce((acc, f) => acc + f.points, 0);
    const score = Math.max(0, Math.min(100, 100 - totalPoints));
    return { score, factors };
}


// eslint-disable-next-line @typescript-eslint/no-explicit-any
function OrderDrawer({ pedido, onClose, onSelectOrder }: { pedido: Record<string, any> | null, onClose: () => void, onSelectOrder?: (p: any) => void }) {
    const [activeTab, setActiveTab] = React.useState("cliente");
    const [msgSource, setMsgSource] = React.useState("WhatsApp Business");
    const [newMessage, setNewMessage] = React.useState("");

    const mensajes = pedido?.mensajes || [
        { "direction": "inbound", "body": "¿Cuándo llega mi pedido?", "timestamp": "2023-10-12T14:30:00Z", "status": "read" },
        { "direction": "outbound", "body": "Buenas tardes Juan. Hemos enviado tu pedido hoy, debería llegar en 24-48 horas.", "timestamp": "2023-10-12T14:35:00Z", "status": "read" }
    ];

    const sendMessage = () => {
        if (!newMessage.trim()) return;
        setNewMessage("");
    };

    const [newNota, setNewNota] = React.useState("");
    const notas = pedido?.notas || [
        { texto: "El cliente ha llamado para confirmar la dirección de entrega, le faltaba poner que es el Bajo A.", autor: "María (A. Cliente)", createdAt: "2023-10-12T15:00:00Z" }
    ];
    const saveNota = () => {
        if (!newNota.trim()) return;
        setNewNota("");
    };

    // Meta Ad creativo — cargado desde Graph API cuando pedido.metaAdId exista
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [metaAd, setMetaAd] = React.useState<Record<string, any> | null>(null);
    React.useEffect(() => {
        if (!pedido?.metaAdId) { setMetaAd(null); return; }
        const token = process.env.NEXT_PUBLIC_META_ACCESS_TOKEN;
        if (token) {
            fetchMetaAd(pedido.metaAdId, token).then(setMetaAd).catch(() => setMetaAd(null));
        } else {
            // Mock mientras no hay token configurado
            setMetaAd({
                name: "VSL Zapatos | Retargeting Compra | ES",
                effective_status: "ACTIVE",
                thumbnail_url: null,
                creative: { object_type: "VIDEO" },
                adset: { name: "Retargeting 30 d\u00edas" },
                campaign: { name: "CON | Zapatillas | ES | Octubre" },
                insights: { ctr: "2.41", cpc: "0.38", cpm: "9.15" },
            });
        }
    }, [pedido?.metaAdId]);

    if (!pedido) return null;
    return (
        <>
            <div
                onClick={onClose}
                style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(2px)", zIndex: 100, animation: "fade-in 0.2s ease-out" }}
            />
            <div
                style={{
                    position: "fixed", right: 0, top: 0, bottom: 0, width: "620px", maxWidth: "100%",
                    background: "white", zIndex: 101, boxShadow: "-8px 0 24px rgba(0,0,0,0.1)",
                    display: "flex", flexDirection: "column",
                    animation: "slide-in-right 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
                }}
            >

                <div style={{
                    position: "sticky", top: 0, zIndex: 10,
                    background: "white", borderBottom: "1px solid #e2e8f0",
                    padding: "16px 20px 0",
                }}>
                    {/* Fila 1: ref + estado + cerrar */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span style={{ fontSize: "18px", fontWeight: 900, color: "#3b82f6" }}>#{pedido.ref || "10045"}</span>
                            <StateBadge state={pedido.state || 'nuevo'} />
                        </div>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                            {/* Botón Enviar */}
                            <button style={{
                                background: "rgba(22,163,74,0.1)", color: "#16a34a",
                                border: "1px solid rgba(22,163,74,0.3)", borderRadius: "7px",
                                padding: "5px 14px", fontSize: "12px", fontWeight: 700, cursor: "pointer"
                            }}>Enviar</button>
                            {/* Botón Cancelar */}
                            <button style={{
                                background: "rgba(239,68,68,0.08)", color: "#ef4444",
                                border: "1px solid rgba(239,68,68,0.2)", borderRadius: "7px",
                                padding: "5px 14px", fontSize: "12px", fontWeight: 700, cursor: "pointer"
                            }}>Cancelar</button>
                            {/* Cerrar */}
                            <button onClick={onClose} style={{
                                background: "#f1f5f9", border: "none", borderRadius: "7px",
                                width: "30px", height: "30px", cursor: "pointer", fontSize: "14px",
                                display: "flex", alignItems: "center", justifyContent: "center"
                            }}>✕</button>
                        </div>
                    </div>

                    {/* Fila 2: cliente + fecha rápida */}
                    <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "12px" }}>
                        {pedido.cliente || "Juan Pérez"} · {pedido.telefono || "+34 600 000 000"} · Entrada: {formatDate(pedido.createdAt)} {formatTime(pedido.createdAt)}
                    </div>

                    {/* Tabs */}
                    <div style={{ display: "flex", gap: "2px", overflowX: "auto" }} className="ds-scrollbar-hide">
                        {DRAWER_TABS.map(tab => (
                            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                                padding: "7px 12px", fontSize: "11px", fontWeight: 600,
                                border: "none", background: "none", cursor: "pointer",
                                borderBottom: activeTab === tab.key ? "2px solid #3b82f6" : "2px solid transparent",
                                color: activeTab === tab.key ? "#3b82f6" : "#64748b",
                                whiteSpace: "nowrap",
                            }}>
                                {tab.icon} {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Body scrollable content per tab */}
                <div className="ds-scrollbar" style={{ height: "calc(100vh - 130px)", padding: "8px 14px", overflowY: "auto", background: "white" }}>

                    {activeTab === "cliente" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "24px", animation: "fade-in 0.2s" }}>
                            <DrawerSection title="Datos del cliente">
                                <DrawerRow label="Nombre" value={pedido?.cliente || "Juan Pérez"} />
                                <DrawerRow label="Teléfono" value={
                                    <a href={`https://wa.me/${(pedido?.telefono || "+34 600 000 000").replace(/\D/g, "")}`}
                                        target="_blank" rel="noreferrer" style={{ color: "#25d366", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px", justifyContent: "flex-end" }}>
                                        💬 {pedido?.telefono || "+34 600 000 000"}
                                    </a>
                                } />
                                <DrawerRow label="Email" value={pedido?.email ?? "juan.perez@email.com"} />
                                <DrawerRow label="Documento" value={pedido?.dni ?? "—"} />
                            </DrawerSection>

                            {(() => {
                                const cliente = pedido?.clienteStats || {
                                    totalGastado: "269.97",
                                    totalPedidos: 3,
                                    tasaEntrega: 67,
                                    totalDevoluciones: 1,
                                    primerPedido: "2023-09-12T14:20:00Z",
                                };
                                return (
                                    <DrawerSection title="Resumen del cliente">
                                        <DrawerRow label="Total gastado" value={`€${cliente.totalGastado}`} />
                                        <DrawerRow label="Pedidos totales" value={cliente.totalPedidos} />
                                        <DrawerRow label="Tasa entrega" value={`${cliente.tasaEntrega}%`} />
                                        <DrawerRow label="Devoluciones" value={cliente.totalDevoluciones} />
                                        <DrawerRow label="Primera compra" value={formatDate(cliente.primerPedido)} />
                                        <DrawerRow label="Cliente desde" value={calcTiempo(cliente.primerPedido, new Date()) + " atrás"} />
                                    </DrawerSection>
                                );
                            })()}

                            <DrawerSection title="Dirección de envío">
                                <DrawerRow label="Dirección" value={pedido?.shipping_address_1 || "Calle Principal 123, Piso 4B"} />
                                <DrawerRow label="CP" value={pedido?.shipping_zip || "28001"} />
                                <DrawerRow label="Ciudad" value={pedido?.shipping_city || "Madrid"} />
                                <DrawerRow label="Provincia" value={pedido?.shipping_province || "Comunidad de Madrid"} />
                                <DrawerRow label="País" value={pedido?.shipping_country || "España"} />
                                {/* Enlace Google Maps */}
                                <a href={`https://www.google.com/maps/search/${encodeURIComponent(
                                    `${pedido?.shipping_address_1 || "Calle Principal 123"} ${pedido?.shipping_zip || "28001"} ${pedido?.shipping_city || "Madrid"}`
                                )}`} target="_blank" rel="noreferrer" style={{ fontSize: "11px", color: "#3b82f6", display: "block", marginTop: "6px", fontWeight: 600 }}>
                                    📍 Ver en Google Maps
                                </a>
                            </DrawerSection>

                            <DrawerSection title="Pedido">
                                <DrawerRow label="Producto" value={`${pedido?.producto || "Zapatillas Deportivas X"} · Qty: ${pedido?.cantidad || 1}`} />
                                <DrawerRow label="Importe" value={`€${pedido?.importe || "89.99"}`} />
                                <DrawerRow label="Pago" value={pedido?.pago || "Stripe"} />
                                <DrawerRow label="Descuento" value={pedido?.descuento ? `€${pedido?.descuento}` : "—"} />
                                <DrawerRow label="Fulfillment" value={<FulfillmentBadge type={pedido?.fulfillment || "beeping"} />} />
                                <DrawerRow label="Transportista" value={<CarrierBadge type={pedido?.carrier || "GLS"} />} />
                                <DrawerRow label="Tracking" value={
                                    pedido?.trackingNumber
                                        ? <a href={getTrackingUrl(pedido?.carrier || "GLS", pedido?.trackingNumber)}
                                            target="_blank" rel="noreferrer" style={{ color: "#3b82f6", fontWeight: 700 }}>
                                            {pedido?.trackingNumber}
                                        </a>
                                        : "Sin tracking"
                                } />
                            </DrawerSection>

                            <DrawerSection title="Métricas del pedido">
                                <DrawerRow label="Hora entrada" value={formatTime(pedido?.createdAt)} />
                                <DrawerRow label="Dispositivo" value={pedido?.deviceType ?? "—"} />
                                <DrawerRow label="T. gestión" value={calcTiempo(pedido?.createdAt, pedido?.timestamps?.primerCambio)} />
                                <DrawerRow label="T. preparación" value={calcTiempo(pedido?.timestamps?.pendiente, pedido?.timestamps?.enviado)} />
                                <DrawerRow label="T. tránsito" value={calcTiempo(pedido?.timestamps?.enviado, pedido?.timestamps?.entregado)} />
                                <DrawerRow label="Intentos entrega" value={pedido?.intentosEntrega ?? "—"} />
                            </DrawerSection>
                        </div>
                    )}

                    {activeTab === "timeline" && (
                        <div style={{ display: "flex", flexDirection: "column", animation: "fade-in 0.2s", paddingTop: "4px" }}>
                            {(pedido?.timeline as TimelineEvent[] || MOCK_TIMELINE).map((event, i, arr) => {
                                const typeColor = event.type === "error" ? "#ef4444" : event.type === "warning" ? "#f59e0b" : event.type === "success" ? "#16a34a" : "#3b82f6";
                                const srcColor = SOURCE_COLORS[event.source as TimelineSource] ?? "#94a3b8";
                                return (
                                    <div key={i} style={{ display: "flex", gap: "10px", paddingBottom: "10px" }}>
                                        {/* Punto + línea vertical */}
                                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                                            <div style={{
                                                width: "9px", height: "9px", borderRadius: "50%", marginTop: "3px",
                                                background: typeColor, border: "2px solid white",
                                                boxShadow: "0 0 0 1.5px " + typeColor,
                                            }} />
                                            {i < arr.length - 1 && (
                                                <div style={{ width: "1px", flex: 1, background: "#e2e8f0", marginTop: "3px" }} />
                                            )}
                                        </div>
                                        {/* Texto del evento */}
                                        <div style={{ flex: 1, paddingBottom: "2px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                                <span style={{ fontSize: "12px", fontWeight: 700, color: "#0f172a", lineHeight: 1.3 }}>{event.label}</span>
                                            </div>
                                            {event.description && (
                                                <div style={{ fontSize: "11px", color: "#64748b", marginTop: "1px", lineHeight: 1.3 }}>{event.description}</div>
                                            )}
                                            <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "1px", display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                                                <span style={{
                                                    fontSize: "9px", fontWeight: 700, padding: "1px 5px", borderRadius: "4px",
                                                    background: srcColor + "22",
                                                    color: srcColor,
                                                    textTransform: "uppercase",
                                                }}>
                                                    {event.source}
                                                </span>
                                                {formatDate(event.timestamp)} · {formatTime(event.timestamp)}
                                                {i > 0 && (
                                                    <span style={{ color: "#cbd5e1" }}>
                                                        +{calcTiempo(arr[i - 1].timestamp, event.timestamp)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {activeTab === "riesgo" && (() => {
                        const { score, factors } = calcRiskScore(pedido);
                        const scoreColor = score >= 80 ? "#16a34a" : score >= 50 ? "#d97706" : "#ef4444";
                        return (
                            <div style={{ animation: "fade-in 0.2s" }}>
                                <DrawerSection title="Score de riesgo">
                                    <div style={{ padding: "4px 0 8px" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                                            <span style={{ fontSize: "12px", color: "#64748b" }}>Score calculado</span>
                                            <span style={{ fontSize: "20px", fontWeight: 900, color: scoreColor }}>{score}/100</span>
                                        </div>
                                        <div style={{ height: "6px", background: "#f1f5f9", borderRadius: "999px" }}>
                                            <div style={{
                                                height: "6px", borderRadius: "999px", width: `${score}%`,
                                                background: scoreColor,
                                                transition: "width 0.5s ease",
                                            }} />
                                        </div>
                                        <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "4px" }}>
                                            {score >= 80 ? "✅ Bajo riesgo" : score >= 50 ? "⚠️ Riesgo moderado" : "🔴 Alto riesgo — revisar antes de enviar"}
                                        </div>
                                    </div>
                                    <DrawerRow label="Confianza del score" value={
                                        (pedido?.clienteStats?.totalPedidos ?? 1) < 3
                                            ? "⚠️ Datos insuficientes"
                                            : (pedido?.clienteStats?.totalPedidos ?? 1) < 10
                                                ? "📊 Datos parciales"
                                                : "✅ Alta confianza"
                                    } />
                                </DrawerSection>

                                <DrawerSection title="Factores de riesgo">
                                    {factors.map((f, i) => (
                                        <div key={f.key} style={{
                                            display: "flex", justifyContent: "space-between", alignItems: "center",
                                            padding: "3px 0",
                                            borderBottom: i < factors.length - 1 ? "1px solid #f1f5f9" : "none",
                                            minHeight: "24px",
                                        }}>
                                            <div style={{ flex: 1 }}>
                                                <span style={{ fontSize: "12px", color: "#0f172a" }}>{f.label}</span>
                                                <span style={{ fontSize: "10px", color: "#94a3b8", marginLeft: "5px" }}>{f.source}</span>
                                            </div>
                                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                <span style={{ fontSize: "10px", color: f.points > 0 ? "#ef4444" : f.points < 0 ? "#16a34a" : "#94a3b8", fontWeight: 700 }}>
                                                    {f.points > 0 ? `+${f.points}` : f.points < 0 ? f.points : "—"}
                                                </span>
                                                <span style={{
                                                    fontSize: "11px", fontWeight: 700, padding: "2px 7px", borderRadius: "999px",
                                                    background: f.risk === "high" ? "rgba(239,68,68,0.1)" : f.risk === "medium" ? "rgba(245,158,11,0.1)" : "rgba(22,163,74,0.1)",
                                                    color: f.risk === "high" ? "#ef4444" : f.risk === "medium" ? "#d97706" : "#16a34a",
                                                }}>
                                                    {f.value}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </DrawerSection>

                                <DrawerSection title="IP y geolocalización">
                                    <DrawerRow label="IP" value={pedido?.ipAddress ?? "—"} />
                                    <DrawerRow label="Ciudad" value={pedido?.geoCity ?? "—"} />
                                    <DrawerRow label="País" value={pedido?.geoCountry ?? "—"} />
                                    <DrawerRow label="ISP" value={pedido?.geoISP ?? "—"} />
                                    <DrawerRow label="VPN/Proxy" value={pedido?.isProxy ? "⚠️ Detectado" : "No detectado"} />
                                </DrawerSection>
                            </div>
                        );
                    })()}

                    {activeTab === "origen" && (
                        <div style={{ animation: "fade-in 0.2s" }}>
                            <DrawerSection title="Origen del pedido">
                                <DrawerRow label="Fuente" value={pedido?.utmSource ?? "—"} />
                                <DrawerRow label="Medio" value={pedido?.utmMedium ?? "—"} />
                                <DrawerRow label="Campaña" value={pedido?.utmCampaign ?? "—"} />
                                <DrawerRow label="Contenido" value={pedido?.utmContent ?? "—"} />
                                <DrawerRow label="Placement" value={pedido?.utmPlacement ?? "—"} />
                                <DrawerRow label="Ad ID" value={pedido?.metaAdId ?? "—"} />
                                <DrawerRow label="Adset ID" value={pedido?.metaAdsetId ?? "—"} />
                                <DrawerRow label="Campaign ID" value={pedido?.metaCampaignId ?? "—"} />
                            </DrawerSection>

                            {pedido?.metaAdId && metaAd && (
                                <DrawerSection title="Creativo que generó la venta">
                                    {metaAd.thumbnail_url && (
                                        <img src={metaAd.thumbnail_url} alt="Creativo" style={{
                                            width: "100%", maxHeight: "120px", objectFit: "cover",
                                            borderRadius: "6px", marginBottom: "6px"
                                        }} />
                                    )}
                                    <DrawerRow label="Nombre ad" value={metaAd.name} />
                                    <DrawerRow label="Tipo" value={metaAd.creative?.object_type ?? "—"} />
                                    <DrawerRow label="Estado" value={metaAd.effective_status} />
                                    <DrawerRow label="Adset" value={metaAd.adset?.name ?? "—"} />
                                    <DrawerRow label="Campaña" value={metaAd.campaign?.name ?? "—"} />
                                    <DrawerRow label="CTR" value={metaAd.insights?.ctr ? `${metaAd.insights.ctr}%` : "—"} />
                                    <DrawerRow label="CPC" value={metaAd.insights?.cpc ? `€${metaAd.insights.cpc}` : "—"} />
                                    <DrawerRow label="CPM" value={metaAd.insights?.cpm ? `€${metaAd.insights.cpm}` : "—"} />
                                    <a href={`https://www.facebook.com/ads/manager/account/ads/?selected_ad_ids=${pedido?.metaAdId}`}
                                        target="_blank" rel="noreferrer"
                                        style={{ fontSize: "11px", color: "#3b82f6", fontWeight: 600, display: "block", marginTop: "6px" }}>
                                        Ver en Meta Ads Manager →
                                    </a>
                                </DrawerSection>
                            )}

                            <DrawerSection title="Landing de conversión">
                                <DrawerRow label="URL" value={
                                    pedido?.landingUrl
                                        ? <a href={pedido.landingUrl} target="_blank" rel="noreferrer" style={{ color: "#3b82f6", fontSize: "11px" }}>
                                            {pedido.landingUrl.replace("https://", "").substring(0, 40)}...
                                        </a>
                                        : "—"
                                } />
                                <DrawerRow label="Tipo" value={pedido?.landingType ?? "Advertorial"} />
                            </DrawerSection>
                        </div>
                    )}

                    {activeTab === "historial" && (() => {
                        const historial = pedido?.historialCliente || [
                            { id: "1", ref: "10042", state: "entregado", producto: "Zapatillas Deportivas X", importe: "89.99", createdAt: "2023-10-05T10:00:00Z" },
                            { id: "2", ref: "09821", state: "devolucion", producto: "Zapatillas Deportivas X", importe: "89.99", createdAt: "2023-09-12T14:20:00Z" },
                        ];
                        const m = pedido?.clienteStats ? pedido.clienteStats : calcClienteMetrics(historial);
                        return (
                            <div style={{ animation: "fade-in 0.2s" }}>
                                <DrawerSection title="Métricas del cliente">
                                    <DrawerRow label="LTV total" value={`€${m.totalGastado}`} />
                                    <DrawerRow label="Ticket medio" value={`€${m.ticketMedio}`} />
                                    <DrawerRow label="Tasa entrega" value={`${m.tasaEntrega}%`} />
                                    <DrawerRow label="Tasa devolución" value={`${m.tasaDevolucion}%`} />
                                    <DrawerRow label="Tasa incidencia" value={`${m.tasaIncidencia}%`} />
                                    <DrawerRow label="Pedidos entregados" value={m.pedidosEntregados} />
                                    <DrawerRow label="Pedidos devueltos" value={m.pedidosDevoluciones} />
                                    <DrawerRow label="Último pedido" value={formatDate(m.ultimoPedido ?? "")} />
                                </DrawerSection>

                                <p style={{ fontSize: "10px", fontWeight: 900, textTransform: "uppercase", color: "#94a3b8", margin: "0 0 6px 0" }}>
                                    {historial.length} pedidos anteriores
                                </p>
                                {(pedido?.historialCliente || [
                                    { id: "1", ref: "10042", state: "entregado", producto: "Zapatillas Deportivas X", importe: "89.99", createdAt: "2023-10-05T10:00:00Z" },
                                    { id: "2", ref: "09821", state: "devolucion", producto: "Zapatillas Deportivas X", importe: "89.99", createdAt: "2023-09-12T14:20:00Z" }
                                ]).map((h: { id: string; ref: string; state: string; producto: string; importe: string; createdAt: string }) => (
                                    <div key={h.id} onClick={(e) => { e.stopPropagation(); if (onSelectOrder) onSelectOrder(h); }} style={{
                                        padding: "8px 10px", borderRadius: "8px",
                                        border: "1px solid #e2e8f0", marginBottom: "6px",
                                        cursor: "pointer", background: "white",
                                        transition: "background 0.1s",
                                    }}
                                        onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                                        onMouseLeave={e => e.currentTarget.style.background = "white"}
                                    >
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <span style={{ fontSize: "12px", fontWeight: 700, color: "#3b82f6" }}>#{h.ref}</span>
                                            <StateBadge state={h.state} />
                                        </div>
                                        <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                                            {h.producto} · €{h.importe} · {formatDate(h.createdAt)}
                                        </div>
                                    </div>
                                ))}
                                {(historial.length === 0) && (
                                    <div style={{ textAlign: "center", color: "#94a3b8", fontSize: "12px", padding: "24px 0" }}>
                                        Primera compra del cliente
                                    </div>
                                )}
                            </div>
                        );
                    })()}
                    {activeTab === "comunicaciones" && (
                        <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 175px)", animation: "fade-in 0.2s" }}>

                            {/* Selector de fuente */}
                            <div style={{ display: "flex", gap: "6px", marginBottom: "10px", flexShrink: 0 }}>
                                {["WhatsApp Business", "WhatsApp API"].map(source => (
                                    <button key={source} onClick={() => setMsgSource(source)} style={{
                                        padding: "4px 12px", fontSize: "11px", fontWeight: 600,
                                        borderRadius: "20px", cursor: "pointer", border: "none",
                                        background: msgSource === source ? "#25d366" : "#f1f5f9",
                                        color: msgSource === source ? "white" : "#64748b",
                                    }}>{source}</button>
                                ))}
                            </div>

                            {/* Mensajes — ocupa todo el espacio restante */}
                            <div className="ds-scrollbar" style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px" }}>
                                {mensajes.map((msg: { body: string; direction: string; timestamp: string; status: string }, i: number) => (
                                    <div key={i} style={{ display: "flex", justifyContent: msg.direction === "outbound" ? "flex-end" : "flex-start" }}>
                                        <div style={{
                                            maxWidth: "75%", padding: "7px 10px", borderRadius: "10px",
                                            fontSize: "12px", lineHeight: 1.4,
                                            background: msg.direction === "outbound" ? "#dcf8c6" : "#f1f5f9",
                                        }}>
                                            {msg.body}
                                            <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "2px", textAlign: "right" }}>
                                                {formatTime(msg.timestamp)}
                                                {msg.direction === "outbound" && <span style={{ marginLeft: "3px" }}>{msg.status === "read" ? "✓✓" : "✓"}</span>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Plantillas r\u00e1pidas */}
                            {(() => {
                                const PLANTILLAS = [
                                    { label: "Confirmar pedido", texto: `Hola ${(pedido?.cliente || "cliente").split(" ")[0]}, te confirmamos tu pedido ${pedido?.ref || ""}. En breve lo preparamos y te enviamos el tracking. \uD83D\uDE4C` },
                                    { label: "Tracking enviado", texto: `Hola ${(pedido?.cliente || "cliente").split(" ")[0]}, tu pedido ya est\u00e1 en camino. N\u00famero de seguimiento: ${pedido?.trackingNumber || "—"}. Tiempo estimado: 24-48h. \uD83D\uDCE6` },
                                    { label: "Intento fallido", texto: `Hola ${(pedido?.cliente || "cliente").split(" ")[0]}, hemos intentado entregarte el pedido pero no hab\u00eda nadie. \u00BFCu\u00e1ndo podemos volver a intentarlo? \uD83D\uDE9A` },
                                    { label: "Solicitar rese\u00f1a", texto: `Hola ${(pedido?.cliente || "cliente").split(" ")[0]}, esperamos que est\u00e9s disfrutando tu compra. \u00BFPodr\u00EDas dejarnos una rese\u00f1a? Nos ayuda mucho \uD83D\uDE4F` },
                                ];
                                return (
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "8px", flexShrink: 0 }}>
                                        {PLANTILLAS.map(p => (
                                            <button key={p.label} onClick={() => setNewMessage(p.texto)} style={{
                                                fontSize: "10px", fontWeight: 600, padding: "3px 8px",
                                                borderRadius: "20px", border: "1px solid #e2e8f0",
                                                background: "#f8fafc", color: "#64748b", cursor: "pointer",
                                                whiteSpace: "nowrap",
                                            }}>
                                                {p.label}
                                            </button>
                                        ))}
                                    </div>
                                );
                            })()}

                            {/* Input pegado al fondo */}
                            <div style={{ display: "flex", gap: "6px", paddingTop: "8px", borderTop: "1px solid #e2e8f0", flexShrink: 0 }}>
                                <input
                                    value={newMessage} onChange={e => setNewMessage(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }}
                                    placeholder="Escribe un mensaje..."
                                    style={{ flex: 1, padding: "7px 10px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px", outline: "none" }}
                                />
                                <button onClick={sendMessage} style={{
                                    background: "#25d366", color: "white", border: "none",
                                    borderRadius: "8px", padding: "7px 14px", cursor: "pointer", fontSize: "12px", fontWeight: 700
                                }}>Enviar</button>
                            </div>
                        </div>
                    )}

                    {activeTab === "notas" && (
                        <div style={{ animation: "fade-in 0.2s" }}>
                            {notas.map((nota: { texto: string; autor: string; createdAt: string }, i: number) => (
                                <div key={i} style={{
                                    padding: "8px 10px", background: "#fffbeb",
                                    border: "1px solid #fef08a", borderRadius: "8px", marginBottom: "6px"
                                }}>
                                    <div style={{ fontSize: "12px", color: "#0f172a" }}>{nota.texto}</div>
                                    <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "3px" }}>
                                        {nota.autor} · {formatDate(nota.createdAt)}
                                    </div>
                                </div>
                            ))}
                            <textarea
                                value={newNota}
                                onChange={e => setNewNota(e.target.value)}
                                placeholder="Añadir nota interna..."
                                rows={3}
                                style={{
                                    width: "100%", padding: "8px 10px", borderRadius: "8px",
                                    border: "1px solid #e2e8f0", fontSize: "12px",
                                    resize: "vertical", outline: "none", fontFamily: "inherit",
                                    boxSizing: "border-box", marginTop: "4px"
                                }}
                            />
                            <button onClick={saveNota} style={{
                                marginTop: "6px", background: "#3b82f6", color: "white",
                                border: "none", borderRadius: "8px", padding: "7px 16px",
                                fontSize: "12px", fontWeight: 700, cursor: "pointer"
                            }}>Guardar nota</button>
                        </div>
                    )}

                    {/* Failsafe for unfinished content tabs */}
                    {!["cliente", "timeline", "riesgo", "origen", "historial", "comunicaciones", "notas"].includes(activeTab) && (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "64px 20px", flexDirection: "column", gap: "12px", textAlign: "center", opacity: 0.5, animation: "fade-in 0.2s" }}>
                            <span style={{ fontSize: "48px" }}>🚧</span>
                            <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#334155" }}>Tab en desarrollo</h3>
                            <p style={{ fontSize: "14px", color: "#64748b" }}>El contenido para &lsquo;{activeTab}&rsquo; se está diseñando.</p>
                        </div>
                    )}
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
                                        <th style={{ padding: "8px 10px", fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "center", whiteSpace: "nowrap", borderBottom: "2px solid #e2e8f0", background: "white", width: "7%" }}>Riesgo</th>

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
                                    <ColumnaCheckbox />
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
                                        <FulfillmentBadge type="beeping" />
                                    </td>
                                    <td style={{ padding: "0 10px", height: "52px", minWidth: "70px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <CarrierBadge type="GLS" />
                                        <a href={getTrackingUrl("GLS", "BP-1234444")} target="_blank" onClick={e => e.stopPropagation()} style={{ fontSize: "10px", color: "#3b82f6", display: "block", marginTop: "3px", textDecoration: "none", fontWeight: 600 }}>BP-1234444</a>
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
                                    <ColumnaCheckbox />
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
                                        <FulfillmentBadge type="dropea" />
                                        <span style={{ fontSize: "10px", color: "#94a3b8", display: "block", marginTop: "3px", fontWeight: 600 }}>Sin tracking</span>
                                    </td>
                                    <td style={{ padding: "0 10px", height: "52px", minWidth: "70px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <CarrierBadge type="GLS" />
                                        <span style={{ fontSize: "10px", color: "#94a3b8", display: "block", marginTop: "3px", fontWeight: 600 }}>Sin tracking</span>
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
                                    <ColumnaCheckbox />
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
                                    <ColumnaCheckbox />
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
                                        <FulfillmentBadge type="beeping" />
                                    </td>
                                    <td style={{ padding: "0 10px", height: "52px", minWidth: "70px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <CarrierBadge type="Correos Exp." />
                                        <a href={getTrackingUrl("Correos Exp.", "PQ41029312")} target="_blank" onClick={e => e.stopPropagation()} style={{ fontSize: "10px", color: "#3b82f6", display: "block", marginTop: "3px", textDecoration: "none", fontWeight: 600 }}>PQ41029312</a>
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
                                    <ColumnaCheckbox />
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
                                        <FulfillmentBadge type="beeping" />
                                        <span style={{ fontSize: "10px", color: "#94a3b8", display: "block", marginTop: "3px", fontWeight: 600 }}>Sin tracking</span>
                                    </td>
                                    <td style={{ padding: "0 10px", height: "52px", minWidth: "70px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <CarrierBadge type="GLS" />
                                        <span style={{ fontSize: "10px", color: "#94a3b8", display: "block", marginTop: "3px", fontWeight: 600 }}>Sin tracking</span>
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
                                    <ColumnaCheckbox />
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
                                        <FulfillmentBadge type="beeping" />
                                    </td>
                                    <td style={{ padding: "0 10px", height: "52px", minWidth: "70px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <CarrierBadge type="Correos Exp." />
                                        <a href={getTrackingUrl("Correos Exp.", "PQ41029888")} target="_blank" onClick={e => e.stopPropagation()} style={{ fontSize: "10px", color: "#3b82f6", display: "block", marginTop: "3px", textDecoration: "none", fontWeight: 600 }}>PQ41029888</a>
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
                                    <ColumnaCheckbox />
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
                                        <FulfillmentBadge type="beeping" />
                                    </td>
                                    <td style={{ padding: "0 10px", height: "52px", minWidth: "70px", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9", overflow: "hidden" }}>
                                        <CarrierBadge type="GLS" />
                                        <a href={getTrackingUrl("GLS", "GLS0012929")} target="_blank" onClick={e => e.stopPropagation()} style={{ fontSize: "10px", color: "#3b82f6", display: "block", marginTop: "3px", textDecoration: "none", fontWeight: 600 }}>GLS0012929</a>
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
            {selectedOrder && <OrderDrawer pedido={selectedOrder} onClose={() => setSelectedOrder(null)} onSelectOrder={setSelectedOrder} />}
        </div>
    );
}
