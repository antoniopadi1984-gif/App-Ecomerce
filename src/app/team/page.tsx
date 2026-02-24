"use client";

import { useEffect, useState } from "react";
import { Users, Bot, Plus, Shield, Mail, MoreHorizontal, UserSquare2, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { getTeamData, createAgent } from "./actions";
import { PageShell } from "@/components/ui/PageShell";
import { ModuleHeader } from "@/components/ui/ModuleHeader";

export default function TeamPage() {
    const [activeTab, setActiveTab] = useState("members");
    const [data, setData] = useState<{ agents: any[], users: any[] }>({ agents: [], users: [] });
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        setLoading(true);
        const res = await getTeamData();
        if (res.success) {
            setData({ agents: res.agents || [], users: res.users || [] });
        } else {
            toast.error("Error cargando equipo: " + res.error);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleCreateAgent = async () => {
        const name = prompt("Nombre del Agente:");
        if (!name) return;
        const role = prompt("Rol (ej: Media Buyer):", "Assistente General");

        const res = await createAgent({ name, role: role || "General" });
        if (res.success) {
            toast.success("Agente creado");
            loadData();
        } else {
            toast.error("Error: " + res.error);
        }
    };

    return (
        <PageShell>
            <ModuleHeader
                title="Equipo y Rendimiento"
                subtitle="Gestiona el acceso de tu equipo humano y configura tus agentes de IA."
                icon={Users}
                actions={
                    <div className="flex items-center gap-2">
                        <Button onClick={loadData} variant="outline" size="sm" className="bg-white">
                            <RefreshCw className={`w-4 h-4 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-200 uppercase tracking-widest text-[10px] h-10 px-6 rounded-xl">
                            <Plus className="w-4 h-4 mr-2" />
                            Invitar Miembro
                        </Button>
                    </div>
                }
            />

            <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto w-full">

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="bg-white border border-slate-200 p-1 h-auto rounded-xl inline-flex">
                        <TabsTrigger value="members" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 text-slate-500 font-bold text-xs uppercase tracking-wider px-6 py-2 rounded-lg gap-2">
                            <Users className="w-4 h-4" />
                            Miembros ({data.users.length})
                        </TabsTrigger>
                        <TabsTrigger value="agents" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 text-slate-500 font-bold text-xs uppercase tracking-wider px-6 py-2 rounded-lg gap-2">
                            <Bot className="w-4 h-4" />
                            Agentes IA ({data.agents.length})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="members" className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {data.users.map((user: any) => (
                                <Card key={user.id} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                    <CardContent className="p-5 flex items-start gap-4">
                                        <Avatar className="w-12 h-12 border-2 border-white shadow-sm">
                                            <AvatarImage src={user.avatar} />
                                            <AvatarFallback>{user.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-bold text-slate-900">{user.name}</h3>
                                                <Badge variant="outline" className="text-[10px] font-black uppercase text-slate-500 bg-slate-50">
                                                    {user.role}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                                                <Mail className="w-3 h-3" /> {user.email}
                                            </p>
                                            <div className="pt-2 flex items-center gap-2">
                                                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200 text-[9px] px-2 h-5">ACTIVO</Badge>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-slate-400">
                                            <MoreHorizontal className="w-4 h-4" />
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="agents" className="space-y-4">
                        <div className="flex justify-end mb-4">
                            <Button onClick={handleCreateAgent} variant="secondary" className="bg-white border border-indigo-100 text-indigo-600 font-bold text-xs hover:bg-indigo-50">
                                <Plus className="w-3.5 h-3.5 mr-2" /> NUEVO AGENTE
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                            <Card className="border-2 border-dashed border-indigo-200 bg-indigo-50/30 flex items-center justify-center p-6 cursor-pointer hover:bg-indigo-50 transition-colors" onClick={handleCreateAgent}>
                                <div className="text-center space-y-2">
                                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center mx-auto text-indigo-500">
                                        <Plus className="w-6 h-6" />
                                    </div>
                                    <p className="text-indigo-600 font-bold text-xs uppercase">Contratar Agente</p>
                                </div>
                            </Card>
                            {data.agents.map((agent: any) => (
                                <Card key={agent.id} className="border-slate-200 shadow-sm hover:ring-2 hover:ring-indigo-100 transition-all">
                                    <CardHeader className="p-5 pb-2 flex flex-row items-center justify-between space-y-0">
                                        <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-100 font-bold text-[10px] uppercase">
                                            {agent.role}
                                        </Badge>
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    </CardHeader>
                                    <CardContent className="p-5 pt-2 space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                                                <Bot className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900 leading-tight">{agent.name}</h3>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">NIVEL 1 • EXPERTO</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 pt-2">
                                            <div className="bg-slate-50 rounded-lg p-2 text-center border border-slate-100">
                                                <span className="block text-[10px] text-slate-400 font-black uppercase">TAREAS</span>
                                                <span className="block text-sm font-bold text-slate-700">0</span>
                                            </div>
                                            <div className="bg-slate-50 rounded-lg p-2 text-center border border-slate-100">
                                                <span className="block text-[10px] text-slate-400 font-black uppercase">EFICIENCIA</span>
                                                <span className="block text-sm font-bold text-slate-700">100%</span>
                                            </div>
                                        </div>

                                        <Button className="w-full h-8 text-xs font-bold bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50">
                                            CONFIGURAR
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </PageShell>
    );
}
