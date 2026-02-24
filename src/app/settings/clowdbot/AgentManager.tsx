"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bot, User, ShieldCheck, Zap, MessageSquare, Megaphone, Trash2, Edit3, Plus, Search, Activity, BarChart3, GraduationCap, Sparkles, Video, Layout, SearchCode, Microscope } from "lucide-react";
import { toast } from "sonner";
import { saveAgentProfile, deleteAgentProfile, getAgentProfiles } from "./actions";

export default function AgentManager({ storeId }: { storeId: string }) {
    const [agents, setAgents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingAgent, setEditingAgent] = useState<any>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const [performance, setPerformance] = useState<any>(null);

    useEffect(() => {
        loadAgents();
        loadPerformance();
    }, [storeId]);

    const loadAgents = async () => {
        setLoading(true);
        try {
            const data = await getAgentProfiles(storeId);
            setAgents(data);
        } catch (e) {
            toast.error("Error al cargar agentes");
        } finally {
            setLoading(false);
        }
    };

    const loadPerformance = async () => {
        try {
            const { getAgentPerformance } = await import("./actions");
            const data = await getAgentPerformance(storeId);
            setPerformance(data);
        } catch (e) {
            console.error("Error loading performance", e);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await saveAgentProfile(storeId, editingAgent);
            toast.success("Agente guardado con éxito");
            setEditingAgent(null);
            setIsSidebarOpen(false);
            loadAgents();
        } catch (e) {
            toast.error("Error al guardar agente");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Seguro que quieres eliminar este agente?")) return;
        try {
            await deleteAgentProfile(id);
            toast.success("Agente eliminado");
            loadAgents();
        } catch (e) {
            toast.error("Error al eliminar");
        }
    };

    return (
        <div className="space-y-6 p-6 max-w-7xl mx-auto animate-in fade-in duration-500">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
                        <div className="p-2 bg-rose-600 rounded-xl text-white shadow-sm">
                            <Bot className="w-8 h-8" />
                        </div>
                        CLOWDBOT MULTI-ROL
                    </h1>
                    <p className="text-slate-500 font-medium ml-14">Agentes especializados, medibles y auditables.</p>
                </div>
                <Button
                    onClick={() => { setEditingAgent({ name: '', role: 'ATT', tone: 'neutral', instructions: '', isActive: true }); setIsSidebarOpen(true); }}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-6 rounded-xl shadow-sm transition-all hover:scale-105 active:scale-95 py-6"
                >
                    <Plus className="w-5 h-5 mr-2" /> NUEVO AGENTE
                </Button>
            </header>

            <Tabs defaultValue="agents" className="w-full">
                <TabsList className="bg-slate-100 p-1.5 rounded-2xl mb-8 w-fit border border-slate-200/60 shadow-sm">
                    <TabsTrigger value="agents" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-xl px-6 font-bold py-2.5">
                        <Bot className="w-4 h-4 mr-2" /> GESTIÓN DE AGENTES
                    </TabsTrigger>
                    <TabsTrigger value="performance" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-xl px-6 font-bold py-2.5">
                        <BarChart3 className="w-4 h-4 mr-2" /> RENDIMIENTO (IA vs HUMANO)
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="agents">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {agents.map((agent) => (
                            <Card key={agent.id} className="group overflow-hidden border-slate-200/60 hover:border-rose-200 transition-all hover:shadow-sm hover:shadow-sm rounded-3xl bg-white/50">
                                <CardHeader className="pb-3 flex-row justify-between items-start space-y-0">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-2xl shadow-sm ${agent.role === 'MEDIA_BUYING' ? 'bg-amber-50 text-amber-600' :
                                            agent.role === 'MODERACION' ? 'bg-rose-50 text-rose-600' :
                                                agent.role === 'ATT' ? 'bg-rose-50 text-rose-600' :
                                                    agent.role === 'EDUCATOR' ? 'bg-emerald-50 text-emerald-600' :
                                                        agent.role === 'CREATIVE_DIRECTOR' ? 'bg-rose-50 text-rose-600' :
                                                            agent.role === 'VIDEO_EDITOR' ? 'bg-purple-50 text-purple-600' :
                                                                agent.role === 'LANDING_DESIGNER' ? 'bg-blue-50 text-blue-600' :
                                                                    'bg-slate-50 text-slate-600'
                                            }`}>
                                            {agent.role === 'MEDIA_BUYING' ? <Megaphone className="w-6 h-6" /> :
                                                agent.role === 'MODERACION' ? <ShieldCheck className="w-6 h-6" /> :
                                                    agent.role === 'ATT' ? <MessageSquare className="w-6 h-6" /> :
                                                        agent.role === 'EDUCATOR' ? <GraduationCap className="w-6 h-6" /> :
                                                            agent.role === 'CREATIVE_DIRECTOR' ? <Sparkles className="w-6 h-6" /> :
                                                                agent.role === 'VIDEO_EDITOR' ? <Video className="w-6 h-6" /> :
                                                                    agent.role === 'LANDING_DESIGNER' ? <Layout className="w-6 h-6" /> :
                                                                        <User className="w-6 h-6" />}
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl font-black text-slate-800 tracking-tight">{agent.name}</CardTitle>
                                            <Badge variant="outline" className="mt-1 font-bold bg-white text-[10px] tracking-widest uppercase">
                                                {agent.role}
                                            </Badge>
                                        </div>
                                    </div>
                                    <Switch checked={agent.isActive} onCheckedChange={() => { }} disabled className="scale-75" />
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 text-sm italic text-slate-600 line-clamp-3">
                                            "{agent.instructions}"
                                        </div>
                                        <div className="flex gap-2">
                                            {(JSON.parse(agent.menus || '[]')).map((m: string) => (
                                                <Badge key={m} className="bg-slate-800 text-white rounded-lg text-[9px] font-black">{m}</Badge>
                                            ))}
                                        </div>
                                        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="sm" onClick={() => { setEditingAgent(agent); setIsSidebarOpen(true); }} className="rounded-xl hover:bg-slate-100 text-slate-600 font-bold">
                                                <Edit3 className="w-4 h-4 mr-2" /> EDITAR
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => handleDelete(agent.id)} className="rounded-xl hover:bg-rose-50 text-rose-600 font-bold">
                                                <Trash2 className="w-4 h-4 mr-2" /> BORRAR
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="performance">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {/* Summary Cards */}
                        <Card className="rounded-3xl border-slate-100 shadow-sm bg-rose-600 text-white">
                            <CardContent className="pt-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-rose-100 text-xs tracking-widest uppercase">Ejecuciones IA</p>
                                        <h3 className="text-4xl font-black mt-1">{performance?.ia?.runs || 0}</h3>
                                    </div>
                                    <Zap className="w-8 h-8 text-rose-300 opacity-50" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="rounded-3xl border-slate-100 shadow-sm bg-white border">
                            <CardContent className="pt-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-slate-400 text-xs tracking-widest uppercase">Acciones Humanas</p>
                                        <h3 className="text-4xl font-black mt-1 text-slate-800">{performance?.human?.actions || 0}</h3>
                                    </div>
                                    <User className="w-8 h-8 text-slate-200" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="rounded-3xl border-slate-100 shadow-sm bg-white border border-emerald-100">
                            <CardContent className="pt-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-emerald-600 text-xs tracking-widest uppercase">Confirmaciones IA</p>
                                        <h3 className="text-4xl font-black mt-1 text-emerald-700">{performance?.ia?.confirmations || 0}</h3>
                                    </div>
                                    <ShieldCheck className="w-8 h-8 text-emerald-200" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="rounded-3xl border-slate-100 shadow-sm bg-white border border-rose-100">
                            <CardContent className="pt-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-rose-600 text-xs tracking-widest uppercase">Latencia Media</p>
                                        <h3 className="text-4xl font-black mt-1 text-rose-700">{performance?.ia?.avgLatency ? (performance.ia.avgLatency / 1000).toFixed(2) : 0}s</h3>
                                    </div>
                                    <Activity className="w-8 h-8 text-rose-200" />
                                </div>
                            </CardContent>
                        </Card>
                        {/* More summary cards and chart placeholder */}
                        <div className="col-span-full">
                            <Card className="rounded-3xl border-slate-200/60 shadow-sm overflow-hidden">
                                <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                                    <CardTitle className="text-xl font-black text-slate-800">TABLA DE COMPARATIVA</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="p-6 text-center text-slate-400 font-medium">
                                        <Activity className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                        Cargando telemetría en tiempo real...
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Editing Sidebar Placeholder (Simplified) */}
            {isSidebarOpen && (
                <div className="fixed inset-0 bg-slate-900/40 z-50 flex justify-end animate-in fade-in slide-in-from-right duration-300">
                    <Card className="w-full max-w-xl h-full rounded-none rounded-l-[40px] shadow-sm border-l border-white/20 bg-white/95 overflow-y-auto">
                        <CardHeader className="p-6 border-b border-slate-100">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-2xl font-black italic tracking-tighter text-rose-600 uppercase">
                                    {editingAgent?.id ? 'CONFIGURAR AGENTE' : 'NUEVO ESPECIALISTA'}
                                </CardTitle>
                                <Button variant="ghost" className="rounded-full" onClick={() => setIsSidebarOpen(false)}>×</Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Nombre del Agente</label>
                                <Input
                                    value={editingAgent?.name}
                                    onChange={(e) => setEditingAgent({ ...editingAgent, name: e.target.value })}
                                    placeholder="Ej: Clowdbot ATT"
                                    className="rounded-2xl border-slate-200 focus:ring-4 focus:ring-rose-100 py-6"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Rol</label>
                                    <Select value={editingAgent?.role} onValueChange={(v) => setEditingAgent({ ...editingAgent, role: v })}>
                                        <SelectTrigger className="rounded-2xl border-slate-200 py-6">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl border-slate-200">
                                            <SelectItem value="ATT">ATENCIÓN AL CLIENTE</SelectItem>
                                            <SelectItem value="MEDIA_BUYING">MEDIA BUYING (KPIs)</SelectItem>
                                            <SelectItem value="MODERACION">MODERACIÓN (COMUNICACIÓN)</SelectItem>
                                            <SelectItem value="RECOVERY">RECUPERACIÓN (CARRITOS)</SelectItem>
                                            <SelectItem value="EDUCATOR">EDUCADOR (REGALOS & CURSOS)</SelectItem>
                                            <SelectItem value="CREATIVE_DIRECTOR">CREATIVE DIRECTOR (ESTRATEGIA)</SelectItem>
                                            <SelectItem value="VIDEO_EDITOR">VIDEO EDITOR (VARIACIONES)</SelectItem>
                                            <SelectItem value="LANDING_DESIGNER">LANDING DESIGNER (UX/UI)</SelectItem>
                                            <SelectItem value="MARKETING_STRATEGIST">MARKETING STRATEGIST (PSICOLOGÍA)</SelectItem>
                                            <SelectItem value="RESEARCHER">RESEARCHER (EVIDENCIA)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Tono</label>
                                    <Select value={editingAgent?.tone} onValueChange={(v) => setEditingAgent({ ...editingAgent, tone: v })}>
                                        <SelectTrigger className="rounded-2xl border-slate-200 py-6">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl border-slate-200">
                                            <SelectItem value="neutral">NORMAL (NEUTRAL)</SelectItem>
                                            <SelectItem value="ventas">VENDEDOR (PERSUASIVO)</SelectItem>
                                            <SelectItem value="pro">PROFESIONAL (CONCISO)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Instrucciones de Sistema</label>
                                <Textarea
                                    value={editingAgent?.instructions}
                                    onChange={(e) => setEditingAgent({ ...editingAgent, instructions: e.target.value })}
                                    placeholder="Escribe el prompt del sistema aqu..."
                                    className="rounded-2xl border-slate-200 min-h-[200px] focus:ring-4 focus:ring-rose-100"
                                />
                            </div>
                            <Button onClick={handleSave} className="w-full bg-rose-600 hover:bg-rose-700 py-8 rounded-2xl font-black text-lg shadow-sm mt-4 transition-all hover:scale-105">
                                GUARDAR AGENTE ESPECIALISTA
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
