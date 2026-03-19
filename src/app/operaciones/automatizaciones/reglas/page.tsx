"use client";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store/store-context";
import { AutomatizacionesTabs } from "@/components/operaciones/AutomatizacionesTabs";
import { Plus, Trash2, Loader2, ToggleLeft, ToggleRight, Image, Link, Tag, Send, Gift, ChevronDown, ChevronUp, Wand2 } from "lucide-react";
import { toast } from "sonner";

const TRIGGERS: Record<string, string> = {
  ORDER_CREATED: "📦 Pedido creado",
  PAYMENT_CONFIRMED: "💳 Pago confirmado",
  TRACKING_ADDED: "🚚 Tracking añadido",
  OUT_FOR_DELIVERY: "🛵 En reparto",
  DELIVERY_ATTEMPTED: "⚠️ Intento fallido",
  DELIVERED: "✅ Entregado",
  RETURNED: "↩️ Devuelto",
  DELIVERED_D3: "📬 D+3 post-entrega",
  DELIVERED_D7: "⭐ D+7 review",
  DELIVERED_D14: "🎯 D+14 upsell",
  MANUAL_GIFT: "🎁 Regalo manual",
  NO_PICKUP_D1: "📦 Sin recoger D+1",
  NO_PICKUP_D3: "📦 Sin recoger D+3",
  REORDER_OFFER: "🔄 Oferta recompra",
};

const IMAGE_MODES = [
  { value: "none", label: "Sin imagen" },
  { value: "fixed", label: "Imagen fija (URL)" },
  { value: "ai", label: "Imagen IA generada" },
];

interface Rule {
  id: string;
  name: string;
  trigger: string;
  delayHours: number;
  messageBody: string;
  imageUrl?: string;
  imageMode: string;
  isActive: boolean;
  includeLink?: string;
  discountCode?: string;
  channel: string;
}

const VARIABLES = ["{{nombre}}", "{{pedido}}", "{{producto}}", "{{tracking}}", "{{descuento}}", "{{link}}"];

const DEFAULT_MESSAGES: Record<string, string> = {
  ORDER_CREATED: "Hola {{nombre}} 👋 Tu pedido {{pedido}} de {{producto}} ha sido confirmado. ¡Te avisamos cuando salga!",
  TRACKING_ADDED: "🚚 Hola {{nombre}}, tu pedido {{pedido}} ya está en camino. Seguimiento: {{tracking}}",
  OUT_FOR_DELIVERY: "🛵 ¡Hola {{nombre}}! Tu pedido está en reparto hoy. Estate pendiente 📦",
  DELIVERED: "✅ {{nombre}}, tu pedido ha sido entregado. ¡Esperamos que te encante! Si tienes cualquier duda, escríbenos 💬",
  DELIVERED_D3: "📚 Hola {{nombre}}, te enviamos tu guía de uso de {{producto}} como regalo. ¡Aprovéchala al máximo!",
  DELIVERED_D7: "⭐ {{nombre}}, ¿qué te ha parecido {{producto}}? Tu opinión nos ayuda mucho 🙏",
  DELIVERED_D14: "🎯 {{nombre}}, como cliente especial tienes un descuento exclusivo: {{descuento}} — válido 48h 🔥",
  MANUAL_GIFT: "🎁 {{nombre}}, tenemos un regalo especial para ti. {{descuento}}",
  NO_PICKUP_D1: "📦 {{nombre}}, tu pedido {{pedido}} está esperándote. ¡No te olvides de recogerlo!",
  REORDER_OFFER: "🔄 {{nombre}}, ¿ya te quedaste sin {{producto}}? Recompra con descuento: {{descuento}} → {{link}}",
};

export default function ReglaPage() {
  const { activeStore } = useStore();
  const storeId = activeStore?.id;
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newRule, setNewRule] = useState({
    name: "", trigger: "ORDER_CREATED", delayHours: 0,
    messageBody: "", imageMode: "none", imageUrl: "", includeLink: "", discountCode: "", channel: "WHATSAPP",
  });
  const [showNew, setShowNew] = useState(false);

  const load = async () => {
    if (!storeId) return;
    setLoading(true);
    const res = await fetch(`/api/whatsapp/rules?storeId=${storeId}`, { headers: { "X-Store-Id": storeId } });
    const d = await res.json();
    setRules(d.rules || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [storeId]);

  const toggle = async (rule: Rule) => {
    setSaving(rule.id);
    await fetch("/api/whatsapp/rules", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: rule.id, isActive: !rule.isActive }),
    });
    setRules(prev => prev.map(r => r.id === rule.id ? { ...r, isActive: !r.isActive } : r));
    setSaving(null);
  };

  const save = async (rule: Rule) => {
    setSaving(rule.id);
    await fetch("/api/whatsapp/rules", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rule),
    });
    toast.success("Regla guardada");
    setSaving(null);
  };

  const del = async (id: string) => {
    await fetch("/api/whatsapp/rules", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setRules(prev => prev.filter(r => r.id !== id));
    toast.success("Regla eliminada");
  };

  const addRule = async () => {
    if (!storeId || !newRule.name || !newRule.messageBody) { toast.error("Nombre y mensaje requeridos"); return; }
    setAdding(true);
    const res = await fetch("/api/whatsapp/rules", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Store-Id": storeId },
      body: JSON.stringify({ ...newRule, storeId }),
    });
    const d = await res.json();
    setRules(prev => [...prev, d.rule]);
    setNewRule({ name: "", trigger: "ORDER_CREATED", delayHours: 0, messageBody: "", imageMode: "none", imageUrl: "", includeLink: "", discountCode: "", channel: "WHATSAPP" });
    setShowNew(false);
    setAdding(false);
    toast.success("Regla creada");
  };

  const insertVar = (ruleId: string | null, v: string) => {
    if (ruleId) {
      setRules(prev => prev.map(r => r.id === ruleId ? { ...r, messageBody: r.messageBody + v } : r));
    } else {
      setNewRule(p => ({ ...p, messageBody: p.messageBody + v }));
    }
  };

  const s: Record<string, any> = {
    page: { padding: "0" },
    card: { background: "white", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden", marginBottom: "10px" },
    header: { padding: "14px 16px", display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" },
    body: { padding: "16px", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "12px" },
    label: { fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: "4px", display: "block" },
    input: { width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border)", fontSize: "11px", boxSizing: "border-box" as const },
    textarea: { width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border)", fontSize: "11px", resize: "vertical" as const, minHeight: "80px", fontFamily: "inherit", boxSizing: "border-box" as const },
    btn: { padding: "7px 14px", borderRadius: "8px", border: "none", cursor: "pointer", fontSize: "11px", fontWeight: 700, display: "flex", alignItems: "center", gap: "5px" },
    grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" },
    grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" },
    vars: { display: "flex", flexWrap: "wrap" as const, gap: "5px", marginBottom: "6px" },
    varBtn: { padding: "2px 8px", borderRadius: "6px", border: "1px solid var(--border)", background: "#F8FAFC", fontSize: "10px", cursor: "pointer", fontFamily: "monospace" },
  };

  const RuleForm = ({ rule, id }: { rule: any; id: string | null }) => {
    const update = (key: string, val: any) => {
      if (id) setRules(prev => prev.map(r => r.id === id ? { ...r, [key]: val } : r));
      else setNewRule(p => ({ ...p, [key]: val }));
    };
    return (
      <div style={s.body}>
        <div style={s.grid2}>
          <div>
            <label style={s.label}>Nombre de la regla</label>
            <input style={s.input} value={rule.name} onChange={e => update("name", e.target.value)} placeholder="Ej: Confirmación COD" />
          </div>
          <div>
            <label style={s.label}>Trigger</label>
            <select style={s.input} value={rule.trigger} onChange={e => {
              update("trigger", e.target.value);
              if (!rule.messageBody) update("messageBody", DEFAULT_MESSAGES[e.target.value] || "");
            }}>
              {Object.entries(TRIGGERS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        </div>
        <div style={s.grid3}>
          <div>
            <label style={s.label}>Retraso (horas)</label>
            <input style={s.input} type="number" min={0} value={rule.delayHours} onChange={e => update("delayHours", Number(e.target.value))} />
          </div>
          <div>
            <label style={s.label}>Canal</label>
            <select style={s.input} value={rule.channel} onChange={e => update("channel", e.target.value)}>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="EMAIL">Email</option>
              <option value="BOTH">WhatsApp + Email</option>
            </select>
          </div>
          <div>
            <label style={s.label}>Imagen</label>
            <select style={s.input} value={rule.imageMode} onChange={e => update("imageMode", e.target.value)}>
              {IMAGE_MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
        </div>
        {rule.imageMode === "fixed" && (
          <div>
            <label style={s.label}>URL de imagen fija</label>
            <input style={s.input} value={rule.imageUrl || ""} onChange={e => update("imageUrl", e.target.value)} placeholder="https://..." />
          </div>
        )}
        <div>
          <label style={s.label}>Mensaje — variables disponibles:</label>
          <div style={s.vars}>
            {VARIABLES.map(v => <button key={v} style={s.varBtn} onClick={() => insertVar(id, v)}>{v}</button>)}
          </div>
          <textarea style={s.textarea} value={rule.messageBody} onChange={e => update("messageBody", e.target.value)}
            placeholder={DEFAULT_MESSAGES[rule.trigger] || "Escribe el mensaje..."} />
        </div>
        <div style={s.grid2}>
          <div>
            <label style={s.label}>Código descuento (opcional)</label>
            <input style={s.input} value={rule.discountCode || ""} onChange={e => update("discountCode", e.target.value)} placeholder="GRACIAS10" />
          </div>
          <div>
            <label style={s.label}>Link Shopify (opcional)</label>
            <input style={s.input} value={rule.includeLink || ""} onChange={e => update("includeLink", e.target.value)} placeholder="https://tutienda.com/products/..." />
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
          {id ? (
            <>
              <button style={{ ...s.btn, background: "#FEF2F2", color: "#EF4444" }} onClick={() => del(id)}>
                <Trash2 size={12} /> Eliminar
              </button>
              <button style={{ ...s.btn, background: "var(--ops)", color: "white" }} onClick={() => save(rules.find(r => r.id === id)!)}
                disabled={saving === id}>
                {saving === id ? <Loader2 size={12} /> : <Send size={12} />} Guardar
              </button>
            </>
          ) : (
            <button style={{ ...s.btn, background: "var(--ops)", color: "white" }} onClick={addRule} disabled={adding}>
              {adding ? <Loader2 size={12} /> : <Plus size={12} />} Crear regla
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <AutomatizacionesTabs>
      <div style={s.page}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <h2 style={{ fontSize: "15px", fontWeight: 900, margin: 0 }}>Automatizaciones WhatsApp</h2>
            <p style={{ fontSize: "10px", color: "var(--text-muted)", margin: "3px 0 0" }}>Reglas por tienda — se disparan automáticamente según el estado del pedido</p>
          </div>
          <button style={{ ...s.btn, background: "var(--ops)", color: "white" }} onClick={() => setShowNew(!showNew)}>
            <Plus size={13} /> Nueva regla
          </button>
        </div>

        {showNew && (
          <div style={{ ...s.card, border: "1px solid var(--ops)", marginBottom: "16px" }}>
            <div style={{ ...s.header, background: "var(--ops-bg)" }}>
              <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--ops)" }}>+ Nueva regla</span>
            </div>
            <RuleForm rule={newRule} id={null} />
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: "30px" }}><Loader2 size={16} /></div>
        ) : rules.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)", fontSize: "12px" }}>
            Sin reglas — crea la primera para empezar a automatizar
          </div>
        ) : (
          rules.map(rule => (
            <div key={rule.id} style={s.card}>
              <div style={s.header} onClick={() => setExpanded(expanded === rule.id ? null : rule.id)}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: rule.isActive ? "#10B981" : "#94A3B8", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "12px", fontWeight: 800 }}>{rule.name}</div>
                  <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>{TRIGGERS[rule.trigger]} {rule.delayHours > 0 ? `· ${rule.delayHours}h después` : ""} · {rule.channel}</div>
                </div>
                <button style={{ ...s.btn, background: "transparent", padding: "4px", border: "none" }} onClick={e => { e.stopPropagation(); toggle(rule); }}>
                  {saving === rule.id ? <Loader2 size={16} /> : rule.isActive ? <ToggleRight size={20} color="#10B981" /> : <ToggleLeft size={20} color="#94A3B8" />}
                </button>
                {expanded === rule.id ? <ChevronUp size={14} color="var(--text-muted)" /> : <ChevronDown size={14} color="var(--text-muted)" />}
              </div>
              {expanded === rule.id && <RuleForm rule={rule} id={rule.id} />}
            </div>
          ))
        )}
      </div>
    </AutomatizacionesTabs>
  );
}
