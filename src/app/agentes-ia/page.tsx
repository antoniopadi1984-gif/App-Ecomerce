"use client";

import { useEffect, useState } from "react";
import {
    Bot, Plus, Shield, RefreshCw, Cpu,
    MessageSquare, Zap, Activity, Brain,
    Settings2, Search, Filter, Loader2,
    CheckCircle2, AlertCircle, Trash2, Link2
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
import { PageShell } from "@/components/ui/PageShell";
import { ModuleHeader } from "@/components/ui/ModuleHeader";
import Link from "next/link";
import { useStore } from "@/lib/store/store-context";

export default function AIAgentsPage() {
    const { activeStoreId: storeId } = useStore();
    const [agents, setAgents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [isConnected, setIsConnected] = useState<boolean | null>(null);

    useEffect(() => {
        if (storeId) {
            fetch(`/api/connections/status?storeId=${storeId}&service=SHOPIFY`)
                .then(res => res.json())
                .then(data => setIsConnected(data.isConnected));
        }
    }, [storeId]);

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

    if (isConnected === false) {
        return (
            <PageShell>
                <ModuleHeader title="Agentes IA" subtitle="Neural Workforce Management" icon={Bot} />
                <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6 mt-6">
                    <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center">
                        <AlertCircle className="w-10 h-10 text-rose-500" />
                    </div>
                    <div className="space-y-2 text-center">
                        <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase italic">Tienda No Conectada</h2>
                        <p className="text-slate-500 max-w-sm mx-auto font-medium text-sm">Se requiere la integración base de Shopify para reclutar agentes de IA.</p>
                    </div>
                    <Link href="/connections">
                        <Button className="bg-rose-500 hover:bg-black text-white font-black text-[10px] uppercase tracking-widest h-10 px-6 rounded-xl shadow-lg shadow-rose-500/20">
                            <Link2 className="w-4 h-4 mr-2" />
                            Vincular Tienda
                        </Button>
                    </Link>
                </div>
            </PageShell>
        );
    }

    return (
        <PageShell loading={isConnected === null || loading} loadingMessage="Sincronizando Estado IA...">
            <div className="flex flex-col h-[calc(100vh-100px)] space-y-4 pb-20 mt-4">
                <ModuleHeader
                    title="Agentes IA"
                    subtitle="Neural Workforce Management"
                    icon={Bot}
                    actions={
                        <div className="flex items-center gap-3">
                            <div className="flex -space-x-2">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="w-6 h-6 rounded-full bg-indigo-50 border-2 border-white flex items-center justify-center">
                                        <Zap className="w-3 h-3 text-indigo-500" />
                                    </div>
                                ))}
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">3 Nodos Activos</span>
                            <Button onClick={handleCreateAgent} className="h-7 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-[8px] tracking-widest shadow-lg shadow-indigo-100 transition-all">
                                <Plus className="w-3 h-3 mr-2" />
                                RECLUTAR AGENTE
                            </Button>
                        </div>
                    }
                />

                <div className="flex-1 bg-white rounded-lg border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden relative flex flex-col">
                    <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/20">
                        <div className="flex items-center gap-3 flex-1 max-w-md">
                            <div className="relative flex-1">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                                <Input
                                    placeholder="FILTRAR POR NOMBRE O ROL..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="h-8 pl-8 border-slate-200 rounded-lg bg-white text-[8px] font-black uppercase tracking-widest placeholder:text-slate-300 shadow-xs focus:ring-0"
                                />
                            </div>
                            <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-slate-200 shrink-0 shadow-xs">
                                <Filter className="w-3 h-3 text-slate-400" />
                            </Button>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none">CARGA TOTAL</p>
                                <p className="text-[10px] font-black text-slate-900 mt-1 italic">12% <span className="text-emerald-500 not-italic">LOW</span></p>
                            </div>
                            <div className="h-6 w-px bg-slate-100" />
                            <div className="text-right">
                                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none">OPTIMIZACIÓN</p>
                                <p className="text-[10px] font-black text-slate-900 mt-1 italic">98.4%</p>
                            </div>
                        </div>
                    </div>

                    <ScrollArea className="flex-1">
                        <div className="p-4">
                            {loading ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="h-64 rounded-lg bg-slate-50 animate-pulse border border-slate-100" />
                                    ))}
                                </div>
                            ) : filteredAgents.length === 0 ? (
                                <div className="py-20 text-center flex flex-col items-center justify-center opacity-30">
                                    <Bot className="w-12 h-12 mb-4" />
                                    <h3 className="text-sm font-black uppercase tracking-[0.2em]">Sin agentes disponibles</h3>
                                    <p className="text-[10px] font-bold uppercase tracking-widest mt-2">Inicia el reclutamiento para ver tu fuerza neural.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                                    {filteredAgents.map((agent: any) => (
                                        <Card key={agent.id} className="group border-slate-100 rounded-lg shadow-xs hover:shadow-xl transition-all overflow-hidden relative border">
                                            <CardHeader className="p-3 pb-1.5 border-none">
                                                <div className="flex justify-between items-start">
                                                    <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-100 font-black text-[7px] uppercase tracking-widest italic rounded-md px-1.5 h-4">
                                                        {agent.role}
                                                    </Badge>
                                                    <div className="flex items-center gap-1">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-200" />
                                                        <span className="text-[7px] font-black text-emerald-600 uppercase italic">ONLINE</span>
                                                    </div>
                                                </div>
                                            </CardHeader>

                                            <CardContent className="p-3 pt-1 space-y-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-7 h-7 rounded-md bg-slate-900 flex items-center justify-center text-white shadow-md shadow-slate-200 group-hover:rotate-3 transition-transform">
                                                        <Brain className="w-4 h-4 text-indigo-400" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-[11px] font-black text-slate-900 tracking-tight uppercase italic leading-none">{agent.name}</h3>
                                                        <p className="text-[7px] text-slate-400 font-black uppercase tracking-widest mt-1 italic">NEURAL PROTOCOL v4.0</p>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="p-2 bg-slate-50/50 rounded-md border border-slate-100">
                                                        <span className="text-[6px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">TASKS</span>
                                                        <span className="text-[9px] font-black text-slate-900 italic">0 COM</span>
                                                    </div>
                                                    <div className="p-2 bg-slate-50/50 rounded-md border border-slate-100">
                                                        <span className="text-[6px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">AUTH</span>
                                                        <span className="text-[9px] font-black text-indigo-600 italic">100%</span>
                                                    </div>
                                                </div>

                                                <div className="space-y-1.5">
                                                    <div className="flex justify-between text-[6px] font-black uppercase text-slate-400 tracking-widest">
                                                        <span>SYNAPSE LINK</span>
                                                        <span className="text-indigo-500 italic">ACTIVE</span>
                                                    </div>
                                                    <div className="h-0.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                                        <div className="h-full bg-indigo-500 w-[70%]" />
                                                    </div>
                                                </div>

                                                <div className="flex gap-1.5 pt-1">
                                                    <Button size="sm" variant="outline" className="flex-1 h-7 text-[8px] font-black uppercase tracking-widest rounded-md border-slate-200 shadow-xs">
                                                        <Settings2 className="w-3 h-3 mr-1.5 text-slate-400" />
                                                        CONFIG
                                                    </Button>
                                                    <Button size="icon" variant="ghost" className="w-7 h-7 rounded-md text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors">
                                                        <Trash2 className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}

                                    <Card onClick={handleCreateAgent} className="group border-2 border-dashed border-slate-100 rounded-lg p-6 bg-slate-50/30 flex flex-col items-center justify-center cursor-pointer hover:bg-white hover:border-indigo-200 transition-all gap-4">
                                        <div className="w-12 h-12 bg-white rounded-lg border border-slate-100 flex items-center justify-center text-slate-300 group-hover:text-indigo-600 group-hover:shadow-lg transition-all">
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
        </PageShell>
    );
}
