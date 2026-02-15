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
        <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12 font-sans selection:bg-yellow-500/30">
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-yellow-900/10 via-[#050505] to-[#050505] pointer-events-none" />

            <header className="relative flex items-center justify-between mb-10 z-10">
                <div>
                    <h1 className="text-4xl font-black uppercase italic tracking-tighter flex items-center gap-4">
                        <div className="h-12 w-12 bg-gradient-to-br from-yellow-500 to-amber-700 rounded-xl flex items-center justify-center shadow-[0_0_30px_-5px_rgba(245,158,11,0.4)] border border-yellow-400/20">
                            <ShieldCheck className="h-6 w-6 text-white" />
                        </div>
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-yellow-100 to-slate-400">
                            CommentGuard
                        </span>
                        <span className="text-yellow-500 font-black">AI</span>
                    </h1>
                    <div className="flex items-center gap-4 mt-2 ml-16">
                        <Badge variant="outline" className="bg-yellow-500/10 border-yellow-500/30 text-yellow-500 px-2 py-0 font-black text-[9px] uppercase tracking-widest">
                            Protección Activa
                        </Badge>
                        <p className="text-slate-300 font-bold uppercase tracking-[0.2em] text-[11px]">
                            Moderación Inteligente de Ads
                        </p>
                    </div>
                </div>

                <div className="flex gap-8">
                    {stats.map((s, i) => (
                        <div key={i} className="text-right">
                            <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-1">{s.label}</p>
                            <p className={cn("text-3xl font-black italic tracking-tighter", s.color)}>{s.value}</p>
                        </div>
                    ))}
                </div>
            </header>

            <div className="grid grid-cols-12 gap-8 relative z-10">
                {/* Control Sidebar */}
                <div className="col-span-12 lg:col-span-3 space-y-6">
                    <Card className="bg-[#0a0a0a]/60 backdrop-blur-2xl border-white/10 rounded-[2.5rem] p-8 space-y-8">
                        <div>
                            <h3 className="text-xs font-black uppercase text-slate-500 tracking-[0.2em] mb-6">Canales Conectados</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-yellow-500/20 transition-all cursor-pointer group">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                                            <Facebook className="h-5 w-5" />
                                        </div>
                                        <p className="font-bold text-white text-sm">Facebook Ads</p>
                                    </div>
                                    <CheckCircle2 className="h-4 w-4 text-yellow-500" />
                                </div>
                                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-yellow-500/20 transition-all cursor-pointer group">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                                            <Instagram className="h-5 w-5" />
                                        </div>
                                        <p className="font-bold text-white text-sm">Instagram Ads</p>
                                    </div>
                                    <CheckCircle2 className="h-4 w-4 text-yellow-500" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xs font-black uppercase text-slate-500 tracking-[0.2em] mb-6">Reglas de IA</h3>
                            <div className="space-y-4">
                                {[
                                    { l: "Ocultar Spam Automático", active: true },
                                    { l: "Auto-Reply (AI Brain)", active: true },
                                    { l: "Alerta de Crisis", active: true }
                                ].map((r, i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <p className="text-sm font-medium text-slate-300">{r.l}</p>
                                        <Badge className="bg-yellow-500 text-black font-black text-[9px] uppercase px-2">ON</Badge>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <Button
                            onClick={() => setAgentModalOpen(true)}
                            className="w-full h-14 rounded-2xl bg-yellow-500 hover:bg-yellow-600 text-black font-black uppercase tracking-widest shadow-xl shadow-yellow-900/20 text-[10px]"
                        >
                            <Settings className="h-4 w-4 mr-3" /> Configurar Agente IA
                        </Button>
                    </Card>

                    <Card className="bg-gradient-to-br from-yellow-700/20 to-amber-900/40 border-yellow-500/20 rounded-[2rem] p-6 space-y-4 group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                            <Brain className="h-16 w-16 text-yellow-500" />
                        </div>
                        <div className="relative z-10 space-y-4">
                            <div className="h-10 w-10 bg-yellow-500/20 rounded-lg flex items-center justify-center text-yellow-400">
                                <Sparkles className="h-5 w-5" />
                            </div>
                            <h3 className="text-lg font-black italic uppercase leading-tight">Optimizar Respuestas</h3>
                            <p className="text-yellow-200/60 text-[10px] font-medium leading-relaxed">
                                Mejora la calidad de las respuestas automáticas basándote en el tono de tu marca y FAQs actualizadas.
                            </p>
                        </div>
                    </Card>
                </div>

                {/* Main Feed */}
                <div className="col-span-12 lg:col-span-9 space-y-6">
                    <Card className="bg-[#0a0a0a]/60 backdrop-blur-2xl border-white/10 rounded-[2.5rem] p-8 space-y-6">
                        <div className="flex items-center justify-between">
                            <Tabs defaultValue="pendientes" className="w-fit" onValueChange={setSelectedTab}>
                                <TabsList className="bg-[#050505] border border-white/10 rounded-xl p-1 h-12">
                                    <TabsTrigger value="pendientes" className="rounded-lg px-6 font-black text-[10px] uppercase data-[state=active]:bg-yellow-500 data-[state=active]:text-black">
                                        Pendientes ({comments.filter(c => c.status === "pending").length})
                                    </TabsTrigger>
                                    <TabsTrigger value="aprobados" className="rounded-lg px-6 font-black text-[10px] uppercase">
                                        Aprobados
                                    </TabsTrigger>
                                    <TabsTrigger value="ocultos" className="rounded-lg px-6 font-black text-[10px] uppercase">
                                        Ocultos
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>

                            <div className="flex items-center gap-3">
                                <div className="relative group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 group-focus-within:text-yellow-500 transition-colors" />
                                    <Input
                                        placeholder="Buscar comentario..."
                                        className="w-72 h-12 bg-[#050505] border-white/10 rounded-xl pl-12 focus:ring-yellow-500/20"
                                    />
                                </div>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className={cn("h-12 w-12 rounded-xl bg-[#050505] border-white/10 hover:border-yellow-500/30", isRefreshing && "animate-spin")}
                                    onClick={handleRefresh}
                                >
                                    <RefreshCw className="h-4 w-4 text-slate-400" />
                                </Button>
                                <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl bg-[#050505] border-white/10 hover:border-yellow-500/30">
                                    <Filter className="h-4 w-4 text-slate-400" />
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {filteredComments.map((comment) => (
                                <div key={comment.id} className="group flex items-start gap-4 p-5 rounded-2xl bg-[#050505] border border-white/5 hover:border-white/10 transition-all">
                                    <div className="h-10 w-10 shrink-0 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center font-black text-[10px] text-slate-400">
                                        {comment.user.charAt(1).toUpperCase()}
                                    </div>
                                    <div className="flex-1 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <p className="font-black text-white text-sm">{comment.user}</p>
                                                <Badge className="bg-white/5 border-white/10 text-[8px] font-black tracking-widest uppercase">{comment.adName}</Badge>
                                                {comment.platform === "Instagram" ? <Instagram className="h-3 w-3 text-pink-500" /> : <Facebook className="h-3 w-3 text-blue-500" />}
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-600">{comment.time}</span>
                                        </div>
                                        <p className="text-slate-200 text-sm leading-relaxed">
                                            {comment.text}
                                        </p>
                                        <div className="flex items-center justify-between pt-2">
                                            <div className="flex items-center gap-4">
                                                <Button
                                                    variant="ghost" size="sm"
                                                    onClick={() => handleAction(comment.id, "reply")}
                                                    className="h-8 text-yellow-500 hover:text-yellow-400 hover:bg-yellow-500/10 text-[10px] font-black uppercase tracking-widest"
                                                >
                                                    <Reply className="h-3.5 w-3.5 mr-2" /> Responder
                                                </Button>
                                                <Button
                                                    variant="ghost" size="sm"
                                                    onClick={() => handleAction(comment.id, "hide")}
                                                    className="h-8 text-slate-500 hover:text-white hover:bg-white/10 text-[10px] font-black uppercase tracking-widest"
                                                >
                                                    <EyeOff className="h-3.5 w-3.5 mr-2" /> Ocultar
                                                </Button>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {comment.aiAction && (
                                                    <Badge className="bg-yellow-500/10 border-yellow-500/20 text-yellow-500 py-1 px-3 text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                                                        <Sparkles className="h-3 w-3" /> {comment.aiAction}
                                                    </Badge>
                                                )}
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600 hover:text-red-500">
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 flex justify-center">
                            <Button variant="ghost" className="text-slate-500 hover:text-white font-black uppercase text-[10px] tracking-widest">
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
        </div>
    );
}
