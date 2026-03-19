"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
    MessageSquare, X, Send, Sparkles, Bot, Maximize2, Minimize2,
    Paperclip, Image as ImageIcon, Mic, Video, Wand2, ChevronDown,
    RefreshCw, Copy, Check, StopCircle, Loader2, Brain
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ── Tipos ────────────────────────────────────────────────────────────────
interface Message {
    id: string;
    role: "user" | "agent" | "mother";
    content: string;
    ts: string;
    attachments?: { type: "image" | "audio" | "video"; url: string; name: string }[];
    isImprovedPrompt?: boolean;
}

interface AgentPanelProps {
    // Agente especialista del módulo
    specialistRole: string;
    specialistLabel: string;
    specialistActions?: { label: string; prompt: string }[];
    // Contexto del módulo
    storeId: string;
    productId?: string;
    moduleContext?: Record<string, any>; // datos del módulo para dar contexto
    // Color del módulo
    accentColor?: string;
}

// ── Contexto global que Neural Mother siempre recibe ─────────────────────
function buildMotherContext(storeId: string, moduleContext: any) {
    return `Eres Neural Mother, la IA central de EcomBoom. Tienes visión completa del sistema.
Tienda activa: ${storeId}
Contexto del módulo: ${JSON.stringify(moduleContext || {}, null, 2)}
Tu rol: diagnosticar, coordinar agentes, mejorar prompts, detectar oportunidades y fallos.
Cuando el usuario comparta imágenes, audio o vídeo, analiza el contenido y da feedback específico.`;
}

function buildSpecialistContext(role: string, storeId: string, moduleContext: any) {
    return `Contexto operativo:
Tienda: ${storeId}
Datos del módulo: ${JSON.stringify(moduleContext || {}, null, 2)}
Responde siempre en español. Sé directo, accionable y específico para ecommerce COD.`;
}

// ── Componente principal ─────────────────────────────────────────────────
export function AgentPanel({
    specialistRole, specialistLabel, specialistActions = [],
    storeId, productId, moduleContext = {}, accentColor = "#FF6B2B"
}: AgentPanelProps) {
    const [open, setOpen] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [tab, setTab] = useState<"specialist" | "mother">("specialist");
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [attachments, setAttachments] = useState<{ type: string; data: string; name: string }[]>([]);
    const [copied, setCopied] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const fileRef = useRef<HTMLInputElement>(null);
    const mediaRef = useRef<HTMLInputElement>(null);

    // Scroll al fondo cuando llegan mensajes
    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages, loading]);

    // Mensaje de bienvenida al abrir
    useEffect(() => {
        if (open && messages.length === 0) {
            const welcome: Message = {
                id: "welcome",
                role: tab === "specialist" ? "agent" : "mother",
                content: tab === "specialist"
                    ? `Hola, soy tu **${specialistLabel}**. Tengo acceso al contexto de este módulo. ¿En qué te ayudo?`
                    : `Hola, soy **Neural Mother**. Tengo visión completa de todas las tiendas y módulos. Puedo ayudarte a mejorar prompts, diagnosticar fallos o coordinar agentes. También puedes compartirme imágenes, audio o vídeo.`,
                ts: new Date().toISOString(),
            };
            setMessages([welcome]);
        }
    }, [open, tab]);

    const handleFileAttach = async (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "audio" | "video") => {
        const files = Array.from(e.target.files || []);
        for (const file of files) {
            const reader = new FileReader();
            reader.onload = () => {
                setAttachments(prev => [...prev, {
                    type,
                    data: reader.result as string,
                    name: file.name,
                }]);
            };
            reader.readAsDataURL(file);
        }
        e.target.value = "";
    };

    const send = async (overrideInput?: string) => {
        const text = (overrideInput || input).trim();
        if (!text && attachments.length === 0) return;
        if (loading) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: "user",
            content: text,
            ts: new Date().toISOString(),
            attachments: attachments.map(a => ({ type: a.type as any, url: a.data, name: a.name })),
        };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setAttachments([]);
        setLoading(true);

        try {
            const role = tab === "mother" ? "neural-mother" : specialistRole;
            const context = tab === "mother"
                ? buildMotherContext(storeId, moduleContext)
                : buildSpecialistContext(specialistRole, storeId, moduleContext);

            // Construir prompt con attachments
            let fullPrompt = text;
            if (attachments.length > 0) {
                fullPrompt += `\n\n[El usuario adjunta ${attachments.length} archivo(s): ${attachments.map(a => `${a.type}: ${a.name}`).join(", ")}]`;
            }
            // Añadir historial reciente
            const history = messages.slice(-6).filter(m => m.role !== "mother" || tab === "mother");
            const historyText = history.map(m => `${m.role === "user" ? "Usuario" : "Asistente"}: ${m.content}`).join("\n");
            if (historyText) fullPrompt = `Historial:\n${historyText}\n\nNueva consulta: ${fullPrompt}`;

            const res = await fetch("/api/agents/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    role,
                    prompt: fullPrompt,
                    context,
                    storeId,
                    productId,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Error del agente");

            const agentMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: tab === "mother" ? "mother" : "agent",
                content: data.content || data.text || "Sin respuesta",
                ts: new Date().toISOString(),
            };
            setMessages(prev => [...prev, agentMsg]);
        } catch (e: any) {
            toast.error(e.message);
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: "agent",
                content: `Error: ${e.message}`,
                ts: new Date().toISOString(),
            }]);
        } finally {
            setLoading(false);
        }
    };

    const improvePrompt = async () => {
        if (!input.trim()) { toast.error("Escribe un prompt primero"); return; }
        setLoading(true);
        try {
            const res = await fetch("/api/agents/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    role: "neural-mother",
                    prompt: `Mejora este prompt para obtener mejores resultados del agente ${specialistLabel}. 
Prompt original: "${input}"
Devuelve SOLO el prompt mejorado, sin explicaciones.`,
                    context: `Agente objetivo: ${specialistRole}. Módulo: ${JSON.stringify(moduleContext).slice(0, 500)}`,
                    storeId,
                }),
            });
            const data = await res.json();
            const improved = data.content || data.text || "";
            if (improved) {
                setInput(improved);
                toast.success("Prompt mejorado por Neural Mother ✨");
            }
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setLoading(false);
        }
    };

    const copyMsg = (id: string, content: string) => {
        navigator.clipboard.writeText(content);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    const switchTab = (t: "specialist" | "mother") => {
        setTab(t);
        setMessages([]);
    };

    const roleColor = tab === "mother" ? "#6366F1" : accentColor;

    return (
        <div className="fixed bottom-6 right-6 z-[200] flex flex-col items-end">
            {open && (
                <div className={cn(
                    "bg-white rounded-2xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden mb-3 transition-all duration-200",
                    expanded ? "w-[640px] h-[80vh]" : "w-[400px] h-[560px]"
                )}>
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between"
                        style={{ background: `linear-gradient(135deg, ${roleColor}15, white)` }}>
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm"
                                style={{ background: roleColor }}>
                                {tab === "mother" ? <Brain size={15} /> : <Bot size={15} />}
                            </div>
                            <div>
                                <div className="text-[11px] font-black text-slate-900 uppercase tracking-tight">
                                    {tab === "mother" ? "Neural Mother" : specialistLabel}
                                </div>
                                <div className="flex items-center gap-1 mt-0.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    <span className="text-[9px] text-slate-400 font-medium uppercase tracking-wider">
                                        {tab === "mother" ? "Visión global" : "Especialista módulo"}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setExpanded(!expanded)}
                                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-all">
                                {expanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                            </button>
                            <button onClick={() => setOpen(false)}
                                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-all">
                                <X size={13} />
                            </button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-slate-100 bg-slate-50/50">
                        {[
                            { id: "specialist", label: specialistLabel, icon: Bot },
                            { id: "mother", label: "Neural Mother", icon: Brain },
                        ].map(t => {
                            const Icon = t.icon;
                            const active = tab === t.id;
                            return (
                                <button key={t.id} onClick={() => switchTab(t.id as any)}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-black uppercase tracking-wider transition-all border-b-2",
                                        active ? "border-current" : "border-transparent text-slate-400 hover:text-slate-600"
                                    )}
                                    style={active ? { color: roleColor, borderColor: roleColor } : {}}>
                                    <Icon size={11} />
                                    {t.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Acciones rápidas */}
                    {tab === "specialist" && specialistActions.length > 0 && (
                        <div className="px-3 py-2 flex gap-1.5 overflow-x-auto scrollbar-none border-b border-slate-50">
                            {specialistActions.map((action, i) => (
                                <button key={i} onClick={() => send(action.prompt)}
                                    className="shrink-0 h-6 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[9px] font-bold uppercase tracking-wide text-slate-600 transition-all">
                                    {action.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Chat */}
                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30">
                        {messages.map(msg => (
                            <div key={msg.id} className={cn(
                                "flex flex-col",
                                msg.role === "user" ? "items-end" : "items-start"
                            )}>
                                <div className={cn(
                                    "max-w-[85%] px-3.5 py-2.5 rounded-2xl text-[11px] leading-relaxed relative group",
                                    msg.role === "user"
                                        ? "text-white rounded-tr-sm"
                                        : "bg-white border border-slate-200 text-slate-700 rounded-tl-sm shadow-sm"
                                )}
                                    style={msg.role === "user" ? { background: roleColor } : {}}>
                                    {msg.content.split("\n").map((line, i) => (
                                        <p key={i} className={i > 0 ? "mt-1.5" : ""}>{line}</p>
                                    ))}
                                    {msg.attachments?.map((a, i) => (
                                        <div key={i} className="mt-2 flex items-center gap-1.5 bg-white/20 rounded-lg px-2 py-1">
                                            {a.type === "image" && <ImageIcon size={10} />}
                                            {a.type === "audio" && <Mic size={10} />}
                                            {a.type === "video" && <Video size={10} />}
                                            <span className="text-[9px] opacity-80">{a.name}</span>
                                        </div>
                                    ))}
                                    {msg.role !== "user" && (
                                        <button onClick={() => copyMsg(msg.id, msg.content)}
                                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all p-1 hover:bg-slate-100 rounded">
                                            {copied === msg.id ? <Check size={9} className="text-green-500" /> : <Copy size={9} className="text-slate-400" />}
                                        </button>
                                    )}
                                </div>
                                <span className="text-[9px] text-slate-400 mt-1 px-1">
                                    {msg.role === "user" ? "Tú" : msg.role === "mother" ? "Neural Mother" : specialistLabel}
                                    {" · "}{new Date(msg.ts).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                                </span>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                <Loader2 size={12} className="animate-spin" style={{ color: roleColor }} />
                                <span>Pensando...</span>
                            </div>
                        )}
                    </div>

                    {/* Attachments preview */}
                    {attachments.length > 0 && (
                        <div className="px-3 py-2 border-t border-slate-100 flex gap-2 overflow-x-auto bg-white">
                            {attachments.map((a, i) => (
                                <div key={i} className="flex items-center gap-1.5 bg-slate-100 rounded-lg px-2 py-1 text-[9px] font-medium text-slate-600">
                                    {a.type === "image" && <ImageIcon size={10} />}
                                    {a.type === "audio" && <Mic size={10} />}
                                    {a.type === "video" && <Video size={10} />}
                                    <span className="max-w-[80px] truncate">{a.name}</span>
                                    <button onClick={() => setAttachments(prev => prev.filter((_, j) => j !== i))}>
                                        <X size={9} className="text-slate-400 hover:text-red-500" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Input */}
                    <div className="p-3 border-t border-slate-100 bg-white space-y-2">
                        {/* Fila de herramientas */}
                        <div className="flex items-center gap-1.5">
                            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
                                onChange={e => handleFileAttach(e, "image")} />
                            <input ref={mediaRef} type="file" accept="audio/*,video/*" multiple className="hidden"
                                onChange={e => handleFileAttach(e, e.target.files?.[0]?.type.startsWith("audio") ? "audio" : "video")} />
                            <button onClick={() => fileRef.current?.click()}
                                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all" title="Adjuntar imagen">
                                <ImageIcon size={13} />
                            </button>
                            <button onClick={() => mediaRef.current?.click()}
                                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all" title="Adjuntar audio/vídeo">
                                <Mic size={13} />
                            </button>
                            <div className="flex-1" />
                            <button onClick={improvePrompt} disabled={!input.trim() || loading}
                                className="flex items-center gap-1 h-6 px-2.5 rounded-lg text-[9px] font-bold uppercase tracking-wide transition-all disabled:opacity-30"
                                style={{ background: `${roleColor}15`, color: roleColor }}
                                title="Neural Mother mejora tu prompt">
                                <Wand2 size={10} />
                                Mejorar
                            </button>
                        </div>
                        {/* Input + enviar */}
                        <div className="flex gap-2">
                            <textarea
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                                placeholder="Escribe o pega un prompt... (Shift+Enter para nueva línea)"
                                rows={2}
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[11px] text-slate-700 resize-none outline-none focus:border-slate-400 transition-all"
                            />
                            <button onClick={() => send()} disabled={(!input.trim() && attachments.length === 0) || loading}
                                className="w-9 h-9 self-end rounded-xl flex items-center justify-center text-white transition-all disabled:opacity-30 hover:opacity-90"
                                style={{ background: roleColor }}>
                                <Send size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Botón flotante */}
            <button onClick={() => setOpen(!open)}
                className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-95 relative group",
                )
                }
                style={{ background: open ? "#1e293b" : roleColor }}>
                {open ? <X className="text-white" size={18} /> : (
                    <>
                        <MessageSquare className="text-white" size={18} />
                        <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-indigo-500 rounded-full border-2 border-white flex items-center justify-center">
                            <Sparkles size={6} className="text-white" />
                        </div>
                        <div className="absolute right-full mr-3 opacity-0 group-hover:opacity-100 pointer-events-none transition-all whitespace-nowrap">
                            <div className="bg-slate-900 text-white px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wide shadow-lg">
                                {specialistLabel}
                            </div>
                        </div>
                    </>
                )}
            </button>
        </div>
    );
}
