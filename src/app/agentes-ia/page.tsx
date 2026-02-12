"use client";

import { useEffect, useState } from "react";
import {
    Bot, Plus, Shield, RefreshCw, Cpu,
    MessageSquare, Zap, Activity, Brain,
    Settings2, Search, Filter, Loader2,
    CheckCircle2, AlertCircle, Trash2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { getTeamData, createAgent } from "../team/actions";
import { cn } from "@/lib/utils";

export default function AIAgentsPage() {
    const [agents, setAgents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const loadData = async () => {
        setLoading(true);
        const res = await getTeamData();
        if (res.success) {
            setAgents(res.agents || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleCreateAgent = async () => {
        const name = prompt("Nombre del Agente:");
        if (!name) return;
        const role = prompt("Rol (ej: Media Buyer):", "Asistente General");

        const res = await createAgent({ name, role: role || "General" });
        if (res.success) {
            toast.success("Nuevo Agente de IA reclutado");
            loadData();
        }
    };

    const filteredAgents = agents.filter(a =>
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.role.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] space-y-4">
            {/* Header / Nav */}
            <div className="bg-white rounded-3xl border border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-100">
                        <Bot className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="text-sm font-black text-slate-900 uppercase tracking-tighter leading-none italic">Agentes IA</h1>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Neural Workforce Management</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="w-6 h-6 rounded-full bg-indigo-50 border-2 border-white flex items-center justify-center">
                                <Zap className="w-3 h-3 text-indigo-500" />
                            </div>
                        ))}
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">3 Nodos Activos</span>
                    <Button onClick={handleCreateAgent} className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-[9px] tracking-widest shadow-lg shadow-indigo-100 transition-all">
                        <Plus className="w-3.5 h-3.5 mr-2" />
                        Reclutar Agente
                    </Button>
                </div>
            </div>

            <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden relative flex flex-col">
                <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/20">
                    <div className="flex items-center gap-4 flex-1 max-w-md">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                            <Input
                                placeholder="Filtrar por nombre o rol..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="h-10 pl-10 border-slate-200 rounded-xl bg-white text-xs font-bold uppercase tracking-tight placeholder:text-slate-300"
                            />
                        </div>
                        <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-slate-200 shrink-0">
                            <Filter className="w-4 h-4 text-slate-400" />
                        </Button>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Carga Total</p>
                            <p className="text-sm font-black text-slate-900 mt-1">12% <span className="text-emerald-500">Low</span></p>
                        </div>
                        <div className="h-8 w-px bg-slate-100" />
                        <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Nivel de Optimización</p>
                            <p className="text-sm font-black text-slate-900 mt-1">98.4%</p>
                        </div>
                    </div>
                </div>

                <ScrollArea className="flex-1">
                    <div className="p-8">
                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="h-64 rounded-3xl bg-slate-50 animate-pulse border border-slate-100" />
                                ))}
                            </div>
                        ) : filteredAgents.length === 0 ? (
                            <div className="py-40 text-center flex flex-col items-center justify-center opacity-30">
                                <Bot className="w-16 h-16 mb-4" />
                                <h3 className="text-sm font-black uppercase tracking-[0.2em]">Sin agentes disponibles</h3>
                                <p className="text-[10px] font-bold uppercase tracking-widest mt-2">Inicia el reclutamiento para ver tu fuerza neural.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                                {filteredAgents.map((agent: any) => (
                                    <Card key={agent.id} className="group border-slate-100 rounded-3xl shadow-sm hover:shadow-2xl hover:scale-[1.02] transition-all overflow-hidden relative">
                                        {/* Status Header */}
                                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 to-purple-600" />

                                        <CardHeader className="p-6 pb-2 border-none">
                                            <div className="flex justify-between items-start">
                                                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-100 font-black text-[9px] uppercase tracking-widest italic rounded-lg px-2 h-5">
                                                    {agent.role}
                                                </Badge>
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                    <span className="text-[8px] font-black text-emerald-600 uppercase">Online</span>
                                                </div>
                                            </div>
                                        </CardHeader>

                                        <CardContent className="p-6 pt-2 space-y-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-xl shadow-indigo-100/50 group-hover:rotate-6 transition-transform">
                                                    <Brain className="w-6 h-6 text-indigo-400" />
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-black text-slate-900 tracking-tight uppercase italic">{agent.name}</h3>
                                                    <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mt-0.5 italic">Protocolo Experimental v4.0</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Tareas</span>
                                                    <span className="text-xs font-black text-slate-900 italic">0 Completas</span>
                                                </div>
                                                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Precisión</span>
                                                    <span className="text-xs font-black text-indigo-600 italic">100%</span>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex justify-between text-[8px] font-black uppercase text-slate-400 tracking-widest">
                                                    <span>Neural Synapse</span>
                                                    <span>Active</span>
                                                </div>
                                                <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-indigo-500 w-[70%]" />
                                                </div>
                                            </div>

                                            <div className="flex gap-2 pt-2">
                                                <Button size="sm" variant="outline" className="flex-1 h-8 text-[9px] font-black uppercase tracking-widest rounded-xl border-slate-200">
                                                    <Settings2 className="w-3 h-3 mr-2 text-slate-400" />
                                                    Config
                                                </Button>
                                                <Button size="sm" variant="ghost" className="w-8 h-8 rounded-xl p-0 text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}

                                <Card onClick={handleCreateAgent} className="group border-2 border-dashed border-slate-100 rounded-3xl p-6 bg-slate-50/30 flex flex-col items-center justify-center cursor-pointer hover:bg-white hover:border-indigo-200 transition-all gap-4">
                                    <div className="w-12 h-12 bg-white rounded-2xl border border-slate-100 flex items-center justify-center text-slate-300 group-hover:text-indigo-600 group-hover:shadow-lg transition-all">
                                        <Plus className="w-6 h-6" />
                                    </div>
                                    <div className="text-center">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-indigo-600 transition-colors">Contratar Agente Neural</h4>
                                        <p className="text-[8px] text-slate-300 font-bold uppercase mt-1 italic">Click para expandir equipo</p>
                                    </div>
                                </Card>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                {/* FOOTER STATS */}
                <div className="p-4 bg-slate-900 border-t border-indigo-500/10 flex items-center justify-between text-[9px] font-black uppercase tracking-[0.2em] text-white/50">
                    <div className="flex gap-8">
                        <div className="flex items-center gap-2">
                            <Activity className="h-3 w-3 text-emerald-500" />
                            <span>System Health: Nominal</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Cpu className="h-3 w-3 text-indigo-400" />
                            <span>Core Usage: 14%</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
                        <span>Neural Link: ESTABLISHED</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
