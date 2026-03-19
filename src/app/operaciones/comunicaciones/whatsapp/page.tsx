"use client";
import { useEffect, useState, useRef } from "react";
import { useStore } from "@/lib/store/store-context";
import { ComunicacionesTabs } from "@/components/operaciones/ComunicacionesTabs";
import {
    MessageSquare, Send, Loader2, Bot, User, AlertTriangle,
    CheckCheck, Clock, Phone, Settings, UserPlus, Trash2,
    RefreshCw, Search, Filter
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type SubTab = "bandeja" | "empleados" | "config";

interface Message {
    id: string;
    customerContact: string;
    sender: "CUSTOMER" | "AI" | "AGENT";
    content: string;
    status: string;
    isRead: boolean;
    createdAt: string;
    metadata?: string;
}

interface Employee {
    id: string;
    name: string;
    role: string;
    phone?: string;
    isActive: boolean;
    metrics?: { totalOrders: number; confirmRate: number; deliveryRate: number; revenue: number; avgAttempts: number };
}

export default function WhatsAppPage() {
    const { activeStore } = useStore();
    const storeId = activeStore?.id;
    const [subTab, setSubTab] = useState<SubTab>("bandeja");
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedContact, setSelectedContact] = useState<string | null>(null);
    const [replyText, setReplyText] = useState("");
    const [sending, setSending] = useState(false);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [newEmp, setNewEmp] = useState({ name: "", role: "AGENT", phone: "", email: "" });
    const [addingEmp, setAddingEmp] = useState(false);
    const [config, setConfig] = useState({ phoneNumberId: "", accessToken: "", businessId: "", verifyToken: "ecomboom_verify_2026" });
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    const fetchMessages = async () => {
        if (!storeId) return;
        setLoading(true);
        const res = await fetch(`/api/notifications/history?storeId=${storeId}`).catch(() => null);
        const d = await res?.json().catch(() => ({}));
        setMessages(d?.messages || []);
        setLoading(false);
    };

    const fetchEmployees = async () => {
        if (!storeId) return;
        const res = await fetch(`/api/employees?storeId=${storeId}`, { headers: { "X-Store-Id": storeId } }).catch(() => null);
        const d = await res?.json().catch(() => ({}));
        setEmployees(d?.employees || []);
    };

    useEffect(() => { fetchMessages(); fetchEmployees(); }, [storeId]);
    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages, selectedContact]);

    // Agrupar mensajes por contacto
    const contacts = Array.from(new Set(messages.map(m => m.customerContact)))
        .filter(c => !search || c.includes(search) || messages.find(m => m.customerContact === c && m.content.toLowerCase().includes(search.toLowerCase())))
        .map(contact => {
            const contactMsgs = messages.filter(m => m.customerContact === contact);
            const last = contactMsgs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
            const hasAlert = contactMsgs.some(m => { try { return JSON.parse(m.metadata||"{}").isAlert; } catch { return false; } });
            const unread = contactMsgs.filter(m => !m.isRead && m.sender === "CUSTOMER").length;
            return { contact, last, hasAlert, unread, msgs: contactMsgs };
        })
        .sort((a, b) => new Date(b.last?.createdAt||"").getTime() - new Date(a.last?.createdAt||"").getTime());

    const selectedMsgs = selectedContact
        ? messages.filter(m => m.customerContact === selectedContact).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        : [];

    const sendManualReply = async () => {
        if (!replyText.trim() || !selectedContact || !storeId) return;
        setSending(true);
        try {
            const res = await fetch("/api/communications/whatsapp/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ to: selectedContact, message: replyText, storeId, isManual: true }),
            });
            if (res.ok) {
                setReplyText("");
                toast.success("Mensaje enviado");
                fetchMessages();
            } else {
                toast.error("Error enviando mensaje");
            }
        } catch { toast.error("Error de conexión"); }
        finally { setSending(false); }
    };

    const addEmployee = async () => {
        if (!newEmp.name || !storeId) return;
        setAddingEmp(true);
        try {
            const res = await fetch("/api/employees", {
                method: "POST",
                headers: { "Content-Type": "application/json", "X-Store-Id": storeId },
                body: JSON.stringify({ ...newEmp, storeId }),
            });
            if (res.ok) {
                toast.success("Empleado añadido");
                setNewEmp({ name: "", role: "AGENT", phone: "", email: "" });
                fetchEmployees();
            }
        } catch { toast.error("Error"); }
        finally { setAddingEmp(false); }
    };

    const saveConfig = async () => {
        setSaving(true);
        try {
            await fetch("/api/communications/whatsapp/config", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(config),
            });
            toast.success("Configuración guardada");
        } catch { toast.error("Error"); }
        finally { setSaving(false); }
    };

    return (
        <ComunicacionesTabs>
            <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 140px)", gap: "12px" }}>
                {/* Sub-tabs */}
                <div style={{ display: "flex", gap: "4px" }}>
                    {(["bandeja", "empleados", "config"] as SubTab[]).map(t => (
                        <button key={t} onClick={() => setSubTab(t)} style={{
                            padding: "5px 14px", borderRadius: "8px", fontSize: "10px", fontWeight: 700,
                            textTransform: "uppercase", cursor: "pointer", letterSpacing: "0.05em",
                            border: `1px solid ${subTab === t ? "var(--mkt)" : "var(--border)"}`,
                            background: subTab === t ? "var(--mkt-bg)" : "transparent",
                            color: subTab === t ? "var(--mkt)" : "var(--text-muted)",
                        }}>
                            {t === "bandeja" ? "📬 Bandeja" : t === "empleados" ? "👥 Empleados" : "⚙️ Config"}
                        </button>
                    ))}
                    <button onClick={fetchMessages} style={{ marginLeft: "auto", padding: "5px 10px", borderRadius: "8px", border: "1px solid var(--border)", background: "transparent", cursor: "pointer" }}>
                        <RefreshCw size={12} color="var(--text-muted)" />
                    </button>
                </div>

                {/* BANDEJA */}
                {subTab === "bandeja" && (
                    <div style={{ display: "flex", gap: "12px", flex: 1, minHeight: 0 }}>
                        {/* Lista de contactos */}
                        <div style={{ width: "260px", display: "flex", flexDirection: "column", gap: "6px", overflowY: "auto" }}>
                            <div style={{ position: "relative" }}>
                                <Search size={12} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                                <input value={search} onChange={e => setSearch(e.target.value)}
                                    placeholder="Buscar..." style={{ width: "100%", padding: "6px 10px 6px 28px", borderRadius: "8px", border: "1px solid var(--border)", fontSize: "11px", boxSizing: "border-box" }} />
                            </div>
                            {loading ? <div style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)", fontSize: "11px" }}><Loader2 size={14} /></div>
                            : contacts.length === 0 ? <div style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)", fontSize: "11px" }}>Sin conversaciones</div>
                            : contacts.map(({ contact, last, hasAlert, unread }) => (
                                <div key={contact} onClick={() => setSelectedContact(contact)}
                                    style={{
                                        padding: "10px 12px", borderRadius: "10px", cursor: "pointer",
                                        border: `1px solid ${selectedContact === contact ? "var(--mkt)" : hasAlert ? "#FCA5A5" : "var(--border)"}`,
                                        background: selectedContact === contact ? "var(--mkt-bg)" : hasAlert ? "#FEF2F2" : "white",
                                    }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: hasAlert ? "#FEE2E2" : "var(--mkt-bg)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                            {hasAlert ? <AlertTriangle size={13} color="#EF4444" /> : <MessageSquare size={13} color="var(--mkt)" />}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-primary)" }}>+{contact}</span>
                                                {unread > 0 && <span style={{ background: "var(--mkt)", color: "white", borderRadius: "99px", padding: "0 5px", fontSize: "9px", fontWeight: 800 }}>{unread}</span>}
                                            </div>
                                            <p style={{ margin: 0, fontSize: "10px", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                {last?.content?.slice(0, 40)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Chat */}
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden", background: "white" }}>
                            {!selectedContact ? (
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-muted)", fontSize: "12px" }}>
                                    Selecciona una conversación
                                </div>
                            ) : (
                                <>
                                    <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "8px" }}>
                                        <Phone size={14} color="var(--mkt)" />
                                        <span style={{ fontWeight: 700, fontSize: "12px" }}>+{selectedContact}</span>
                                        <span style={{ marginLeft: "auto", fontSize: "10px", color: "var(--text-muted)", background: "var(--mkt-bg)", padding: "2px 8px", borderRadius: "99px" }}>
                                            {selectedMsgs.length} mensajes
                                        </span>
                                    </div>
                                    <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
                                        {selectedMsgs.map(msg => {
                                            const isCustomer = msg.sender === "CUSTOMER";
                                            const isAI = msg.sender === "AI";
                                            return (
                                                <div key={msg.id} style={{ display: "flex", flexDirection: "column", alignItems: isCustomer ? "flex-start" : "flex-end" }}>
                                                    <div style={{
                                                        maxWidth: "75%", padding: "8px 12px", borderRadius: isCustomer ? "12px 12px 12px 2px" : "12px 12px 2px 12px",
                                                        background: isCustomer ? "#F1F5F9" : isAI ? "#EEF2FF" : "var(--mkt)",
                                                        color: isCustomer || isAI ? "var(--text-primary)" : "white",
                                                        fontSize: "11px", lineHeight: 1.5,
                                                    }}>
                                                        {isAI && <div style={{ fontSize: "9px", fontWeight: 800, color: "#6366F1", marginBottom: "3px", display: "flex", alignItems: "center", gap: "3px" }}><Bot size={9} /> AGENTE IA</div>}
                                                        {msg.content}
                                                    </div>
                                                    <span style={{ fontSize: "9px", color: "var(--text-muted)", marginTop: "3px" }}>
                                                        {new Date(msg.createdAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)", display: "flex", gap: "8px" }}>
                                        <input value={replyText} onChange={e => setReplyText(e.target.value)}
                                            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendManualReply(); } }}
                                            placeholder="Escribe un mensaje manual..." style={{ flex: 1, padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border)", fontSize: "11px" }} />
                                        <button onClick={sendManualReply} disabled={!replyText.trim() || sending}
                                            style={{ padding: "8px 14px", borderRadius: "8px", background: "var(--mkt)", color: "white", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", fontWeight: 700 }}>
                                            {sending ? <Loader2 size={12} /> : <Send size={12} />} Enviar
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* EMPLEADOS */}
                {subTab === "empleados" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px", overflowY: "auto" }}>
                        {/* Añadir empleado */}
                        <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: "12px", padding: "16px" }}>
                            <div style={{ fontSize: "11px", fontWeight: 800, marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Añadir empleado</div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", gap: "8px" }}>
                                {[["name","Nombre *"], ["role","Rol"], ["phone","Teléfono"], ["email","Email"]].map(([key, placeholder]) => (
                                    <input key={key} placeholder={placeholder} value={(newEmp as any)[key]}
                                        onChange={e => setNewEmp(p => ({ ...p, [key]: e.target.value }))}
                                        style={{ padding: "7px 10px", borderRadius: "8px", border: "1px solid var(--border)", fontSize: "11px" }} />
                                ))}
                                <button onClick={addEmployee} disabled={addingEmp || !newEmp.name}
                                    style={{ padding: "7px 14px", borderRadius: "8px", background: "var(--mkt)", color: "white", border: "none", cursor: "pointer", fontWeight: 700, fontSize: "11px", display: "flex", alignItems: "center", gap: "5px" }}>
                                    {addingEmp ? <Loader2 size={12} /> : <UserPlus size={12} />} Añadir
                                </button>
                            </div>
                        </div>
                        {/* Lista empleados */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {employees.map(emp => (
                                <div key={emp.id} style={{ background: "white", border: "1px solid var(--border)", borderRadius: "12px", padding: "14px 16px", display: "grid", gridTemplateColumns: "1fr auto auto auto auto auto auto", alignItems: "center", gap: "16px" }}>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: "12px" }}>{emp.name}</div>
                                        <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>{emp.role} {emp.phone ? `· ${emp.phone}` : ""}</div>
                                    </div>
                                    {[
                                        ["Pedidos", emp.metrics?.totalOrders ?? "—", ""],
                                        ["Confirmación", emp.metrics?.confirmRate !== undefined ? `${emp.metrics.confirmRate}%` : "—", ""],
                                        ["Entrega", emp.metrics?.deliveryRate !== undefined ? `${emp.metrics.deliveryRate}%` : "—", ""],
                                        ["Facturación", emp.metrics?.revenue !== undefined ? `${emp.metrics.revenue.toLocaleString("es-ES")}€` : "—", ""],
                                        ["Intentos", emp.metrics?.avgAttempts ?? "—", ""],
                                    ].map(([label, val]) => (
                                        <div key={label as string} style={{ textAlign: "center" }}>
                                            <div style={{ fontSize: "13px", fontWeight: 800 }}>{val as string}</div>
                                            <div style={{ fontSize: "9px", color: "var(--text-muted)", textTransform: "uppercase" }}>{label as string}</div>
                                        </div>
                                    ))}
                                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: emp.isActive ? "#10B981" : "#94A3B8" }} />
                                </div>
                            ))}
                            {employees.length === 0 && <div style={{ textAlign: "center", padding: "30px", color: "var(--text-muted)", fontSize: "11px" }}>Sin empleados — añade el primero</div>}
                        </div>
                    </div>
                )}

                {/* CONFIG */}
                {subTab === "config" && (
                    <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", gap: "12px", maxWidth: "500px" }}>
                        <div style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase" }}>WhatsApp Cloud API — Global</div>
                        <p style={{ fontSize: "10px", color: "var(--text-muted)", margin: 0 }}>Esta configuración es compartida entre todas las tiendas</p>
                        {[
                            ["phoneNumberId", "Phone Number ID"],
                            ["accessToken", "Access Token"],
                            ["businessId", "Business Account ID"],
                            ["verifyToken", "Verify Token (webhook)"],
                        ].map(([key, label]) => (
                            <div key={key}>
                                <label style={{ fontSize: "10px", fontWeight: 700, display: "block", marginBottom: "4px", textTransform: "uppercase", color: "var(--text-muted)" }}>{label}</label>
                                <input value={(config as any)[key]} onChange={e => setConfig(p => ({ ...p, [key]: e.target.value }))}
                                    type={key === "accessToken" ? "password" : "text"}
                                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border)", fontSize: "11px", boxSizing: "border-box" }} />
                            </div>
                        ))}
                        <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: "8px", padding: "10px 12px", fontSize: "10px", color: "#166534" }}>
                            <strong>Webhook URL:</strong> {typeof window !== "undefined" ? window.location.origin : ""}/api/webhooks/whatsapp
                        </div>
                        <button onClick={saveConfig} disabled={saving}
                            style={{ padding: "9px", borderRadius: "8px", background: "var(--mkt)", color: "white", border: "none", cursor: "pointer", fontWeight: 700, fontSize: "11px" }}>
                            {saving ? "Guardando..." : "Guardar configuración"}
                        </button>
                    </div>
                )}
            </div>
        </ComunicacionesTabs>
    );
}
