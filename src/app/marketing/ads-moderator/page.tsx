"use client";

import { useState } from "react";
import {
    MessageSquare, ShieldCheck, EyeOff, Reply, Trash2,
    Search, Filter, Facebook, Instagram, AlertCircle,
    CheckCircle2, Zap, Brain, Settings, ArrowUpRight,
    UserCircle, Bot, Save, Sparkles, Sliders, FileText,
    RefreshCw, Download, Film
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import { PageShell } from "@/components/ui/PageShell";
import { ModuleHeader } from "@/components/ui/ModuleHeader";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const MOCK_COMMENTS = [
    {
        id: "1",
        platform: "Instagram",
        user: "@marketing_guru",
        text: "¿Cuál es el precio de este sérum? Se ve increíble.",
        time: "2m",
        status: "pending",
        sentiment: "positive",
        adName: "Promo Verano v2",
        aiAction: "Suggested Reply"
    },
    {
        id: "2",
        platform: "Facebook",
        user: "Juan Perez",
        text: "ESTO ES UNA ESTAFA, NO COMPREN NADA AQUÍ!!!",
        time: "5m",
        status: "hidden",
        sentiment: "negative",
        adName: "Ad General 04",
        aiAction: "Auto-Hidden (Bot Detection)"
    },
    {
        id: "3",
        platform: "Instagram",
        user: "@beauty_lover",
        text: "Tanto tiempo esperando este lanzamiento ❤️",
        time: "15m",
        status: "replied",
        sentiment: "positive",
        adName: "Promo Verano v2",
        aiAction: "Liked & Replied"
    }
];

export default function ModerationPage() {
    const [comments, setComments] = useState(MOCK_COMMENTS);
    const [selectedTab, setSelectedTab] = useState("pendientes");
    const [agentModalOpen, setAgentModalOpen] = useState(false);

    // Agent Config State
    const [agentPersonality, setAgentPersonality] = useState("profesional");
    const [agentKnowledge, setAgentKnowledge] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [showAdvancedRules, setShowAdvancedRules] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = () => {
        setIsRefreshing(true);
        setTimeout(() => {
            setIsRefreshing(false);
            toast.success("Comentarios actualizados (Sincronizado con Graph API)");
        }, 1500);
    };

    const handleAction = (id: string, action: "hide" | "reply" | "approve") => {
        setComments(prev => prev.map(c => {
            if (c.id === id) {
                if (action === "hide") return { ...c, status: "hidden", aiAction: "Auto-Hidden" };
                if (action === "reply") return { ...c, status: "replied", aiAction: "AI Replied" };
                if (action === "approve") return { ...c, status: "approved" };
            }
            return c;
        }));
        toast.success(`Comentario ${action === "hide" ? "ocultado" : (action === "reply" ? "respondido" : "aprobado")} con éxito.`);
    };

    const filteredComments = comments.filter(c => {
        if (selectedTab === "pendientes") return c.status === "pending";
        if (selectedTab === "aprobados") return c.status === "replied" || c.status === "approved";
        if (selectedTab === "ocultos") return c.status === "hidden";
        return true;
    });

    const stats = [
        { label: "Spam Bloqueado", value: "1,248", color: "text-yellow-500" },
        { label: "Sentimiento Positivo", value: "94%", color: "text-yellow-400" },
    ];

    return (
        <PageShell>
            <ModuleHeader
                title="CommentGuard AI"
                subtitle="Moderación Inteligente de Ads"
                icon={ShieldCheck}
                actions={
                    <div className="flex items-center gap-6">
                        {stats.map((s, i) => (
                            <div key={i} className="text-right flex flex-col items-end">
                                <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest leading-none mb-1">{s.label}</p>
                                <p className={cn("text-xl font-black italic tracking-tighter leading-none", s.color)}>{s.value}</p>
                            </div>
                        ))}
                    </div>
                }
            />

            <div className="grid grid-cols-12 gap-6 p-6 relative z-10 max-w-[1600px] mx-auto w-full">
                {/* Control Sidebar */}
                <div className="col-span-12 lg:col-span-3 space-y-6">
                    <Card className="bg-white border-slate-200 rounded-3xl p-6 space-y-8 shadow-sm">
                        <div>
                            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4">Canales Conectados</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-amber-500/20 transition-all cursor-pointer group">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                            <Facebook className="h-4 w-4" />
                                        </div>
                                        <p className="font-bold text-slate-700 text-xs">Facebook Ads</p>
                                    </div>
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-amber-500/20 transition-all cursor-pointer group">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-lg bg-pink-50 flex items-center justify-center text-pink-600">
                                            <Instagram className="h-4 w-4" />
                                        </div>
                                        <p className="font-bold text-slate-700 text-xs">Instagram Ads</p>
                                    </div>
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4">Reglas de IA</h3>
                            <div className="space-y-3">
                                {[
                                    { l: "Ocultar Spam Automático", active: true },
                                    { l: "Auto-Reply (AI Brain)", active: true },
                                    { l: "Alerta de Crisis", active: true }
                                ].map((r, i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <p className="text-xs font-bold text-slate-600">{r.l}</p>
                                        <Badge className="bg-amber-100 text-amber-700 font-black text-[8px] uppercase px-2 py-0 border-none">ON</Badge>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <Button
                            onClick={() => setAgentModalOpen(true)}
                            className="w-full h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 text-[10px]"
                        >
                            <Settings className="h-3.5 w-3.5 mr-2 text-indigo-200" /> Configurar Agente IA
                        </Button>
                    </Card>

                    <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200/50 rounded-3xl p-6 space-y-4 group relative overflow-hidden shadow-sm">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                            <Brain className="h-16 w-16 text-amber-500" />
                        </div>
                        <div className="relative z-10 space-y-3">
                            <div className="h-8 w-8 bg-amber-500/20 rounded-lg flex items-center justify-center text-amber-600">
                                <Sparkles className="h-4 w-4" />
                            </div>
                            <h3 className="text-sm font-black italic uppercase leading-tight text-slate-900">Optimizar Respuestas</h3>
                            <p className="text-amber-700/80 text-[10px] font-bold leading-relaxed">
                                Mejora la calidad de las respuestas automáticas basándote en el tono de tu marca y FAQs actualizadas.
                            </p>
                        </div>
                    </Card>
                </div>

                {/* Main Feed */}
                <div className="col-span-12 lg:col-span-9 space-y-6">
                    <Card className="bg-white border-slate-200 rounded-3xl p-6 space-y-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <Tabs defaultValue="pendientes" className="w-fit" onValueChange={setSelectedTab}>
                                <TabsList className="bg-slate-50 border border-slate-100 rounded-xl p-1 h-10">
                                    <TabsTrigger value="pendientes" className="rounded-lg px-4 font-black text-[9px] uppercase data-[state=active]:bg-amber-50 data-[state=active]:text-amber-600 data-[state=active]:shadow-sm">
                                        Pendientes ({comments.filter(c => c.status === "pending").length})
                                    </TabsTrigger>
                                    <TabsTrigger value="aprobados" className="rounded-lg px-4 font-black text-[9px] uppercase data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">
                                        Aprobados
                                    </TabsTrigger>
                                    <TabsTrigger value="ocultos" className="rounded-lg px-4 font-black text-[9px] uppercase data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">
                                        Ocultos
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>

                            <div className="flex items-center gap-2">
                                <div className="relative group">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                                    <Input
                                        placeholder="Buscar comentario..."
                                        className="w-64 h-10 bg-white border-slate-200 rounded-xl pl-9 focus:ring-amber-500/20 text-xs font-bold shadow-sm"
                                    />
                                </div>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className={cn("h-10 w-10 rounded-xl bg-white border-slate-200 hover:border-amber-500/30 shadow-sm", isRefreshing && "animate-spin")}
                                    onClick={handleRefresh}
                                >
                                    <RefreshCw className="h-3.5 w-3.5 text-slate-400" />
                                </Button>
                                <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl bg-white border-slate-200 shadow-sm hover:border-amber-500/30">
                                    <Filter className="h-3.5 w-3.5 text-slate-400" />
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {filteredComments.map((comment) => (
                                <div key={comment.id} className="group flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all shadow-sm">
                                    <div className="h-9 w-9 shrink-0 rounded-full bg-slate-200 border border-white flex items-center justify-center font-black text-[10px] text-slate-500 shadow-sm">
                                        {comment.user.charAt(1).toUpperCase()}
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <p className="font-black text-slate-900 text-xs">{comment.user}</p>
                                                <Badge className="bg-white border-slate-200 text-slate-500 text-[8px] font-black tracking-widest uppercase shadow-sm">{comment.adName}</Badge>
                                                {comment.platform === "Instagram" ? <Instagram className="h-3.5 w-3.5 text-pink-500" /> : <Facebook className="h-3.5 w-3.5 text-blue-500" />}
                                            </div>
                                            <span className="text-[9px] font-bold text-slate-400">{comment.time}</span>
                                        </div>
                                        <p className="text-slate-700 text-xs font-semibold leading-relaxed">
                                            {comment.text}
                                        </p>
                                        <div className="flex items-center justify-between pt-1">
                                            <div className="flex items-center gap-3">
                                                <Button
                                                    variant="ghost" size="sm"
                                                    onClick={() => handleAction(comment.id, "reply")}
                                                    className="h-7 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 text-[9px] font-black uppercase tracking-widest px-2"
                                                >
                                                    <Reply className="h-3 w-3 mr-1.5" /> Responder
                                                </Button>
                                                <Button
                                                    variant="ghost" size="sm"
                                                    onClick={() => handleAction(comment.id, "hide")}
                                                    className="h-7 text-slate-500 hover:text-slate-900 hover:bg-slate-200/50 text-[9px] font-black uppercase tracking-widest px-2"
                                                >
                                                    <EyeOff className="h-3 w-3 mr-1.5" /> Ocultar
                                                </Button>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {comment.aiAction && (
                                                    <Badge className="bg-amber-50 border-amber-200 text-amber-700 py-0.5 px-2.5 text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
                                                        <Sparkles className="h-2.5 w-2.5 text-amber-500" /> {comment.aiAction}
                                                    </Badge>
                                                )}
                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-500">
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 flex justify-center">
                            <Button variant="ghost" className="text-slate-500 hover:text-slate-900 font-black uppercase text-[10px] tracking-widest">
                                Cargar más comentarios
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>

            {/* AI AGENT CONFIGURATION MODAL */}
            <Dialog open={agentModalOpen} onOpenChange={setAgentModalOpen}>
                <DialogContent className="bg-[#0a0a0a] border-white/10 text-white rounded-[2.5rem] max-w-2xl p-0 overflow-hidden">
                    <div className="h-2 w-full bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-600" />

                    <div className="p-10 space-y-8">
                        <DialogHeader className="space-y-2">
                            <DialogTitle className="text-3xl font-black italic uppercase flex items-center gap-4">
                                <div className="h-12 w-12 bg-yellow-500/10 rounded-xl flex items-center justify-center text-yellow-500 border border-yellow-500/20">
                                    <Brain className="h-6 w-6" />
                                </div>
                                <span className="flex-1">Cerebro del Agente IA</span>
                                <Badge className="bg-yellow-500 text-black font-black uppercase text-[10px]">v4.0 Alpha</Badge>
                            </DialogTitle>
                            <DialogDescription className="text-slate-500 font-bold uppercase tracking-widest text-[11px] pl-16">
                                Configura cómo interactúa tu marca con la comunidad automáticamente.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid grid-cols-2 gap-8">
                            {/* Left Col: Personality */}
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] flex items-center gap-2">
                                        <Bot className="h-3 w-3" /> Personalidad del Agente
                                    </label>
                                    <div className="grid grid-cols-1 gap-2">
                                        {[
                                            { id: "profesional", label: "Profesional", desc: "Serio y eficiente" },
                                            { id: "divertido", label: "Divertido", desc: "Uso de emojis y humor" },
                                            { id: "sarcastico", label: "Sarcástico", desc: "Estilo disruptivo" }
                                        ].map((p) => (
                                            <div
                                                key={p.id}
                                                onClick={() => setAgentPersonality(p.id)}
                                                className={cn(
                                                    "p-4 rounded-xl border-2 transition-all cursor-pointer group",
                                                    agentPersonality === p.id
                                                        ? "bg-yellow-500/10 border-yellow-500/40"
                                                        : "bg-white/5 border-white/5 hover:border-white/20"
                                                )}
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <p className="font-black uppercase text-[10px] tracking-tight text-white">{p.label}</p>
                                                    {agentPersonality === p.id && <CheckCircle2 className="h-3.5 w-3.5 text-yellow-500" />}
                                                </div>
                                                <p className="text-[9px] text-slate-300 font-medium">{p.desc}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Right Col: Knowledge */}
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] flex items-center gap-2">
                                        <FileText className="h-3 w-3" /> Base de Conocimiento
                                    </label>
                                    <textarea
                                        className="w-full h-[120px] bg-[#050505] border border-white/10 rounded-2xl p-4 text-xs font-medium text-slate-300 focus:ring-1 focus:ring-yellow-500/50 outline-none resize-none"
                                        placeholder="Pega aquí información sobre tus productos, tiempos de envío, FAQs... El agente usará esto para responder."
                                        value={agentKnowledge}
                                        onChange={(e) => setAgentKnowledge(e.target.value)}
                                    />
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-dashed border-white/10 cursor-pointer hover:bg-white/10 transition-all">
                                        <Download className="h-3.5 w-3.5 text-slate-500" />
                                        <span className="text-[9px] font-black uppercase text-slate-400">Subir PDF o TXT de FAQ</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <AnimatePresence>
                            {showAdvancedRules && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="space-y-6 pt-6 border-t border-white/10 overflow-hidden"
                                >
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Blacklist de Palabras (Automatic Hide)</label>
                                            <Input placeholder="estafa, mentira, fake..." className="h-12 bg-black border-white/10 rounded-xl" />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Keywords VIP (Priority Reply)</label>
                                            <Input placeholder="precio, cupon, oferta..." className="h-12 bg-black border-white/10 rounded-xl" />
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="pt-4 flex gap-4">
                            <Button
                                variant="ghost"
                                onClick={() => setShowAdvancedRules(!showAdvancedRules)}
                                className={cn("flex-1 h-14 rounded-2xl text-slate-500 font-black uppercase tracking-widest text-[10px]", showAdvancedRules && "text-yellow-500 bg-yellow-500/10")}
                            >
                                <Sliders className="h-4 w-4 mr-3" /> Reglas Avanzadas
                            </Button>
                            <Button
                                className="flex-[2] h-14 rounded-2xl bg-yellow-500 hover:bg-yellow-600 text-black font-black uppercase tracking-widest shadow-xl shadow-yellow-900/20 text-[10px]"
                                onClick={() => {
                                    setIsSaving(true);
                                    setTimeout(() => {
                                        setIsSaving(false);
                                        setAgentModalOpen(false);
                                        toast.success("Agente sincronizado correctamente.");
                                    }, 1500);
                                }}
                            >
                                {isSaving ? <RefreshCw className="h-4 w-4 animate-spin mr-3" /> : <Save className="h-4 w-4 mr-3" />}
                                {isSaving ? "Guardando Cerebro..." : "Sincronizar Agente"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </PageShell>
    );
}
