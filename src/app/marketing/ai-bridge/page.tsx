"use client";

import { useState } from "react";
import {
    Cpu, Share2, Clipboard, ExternalLink,
    RefreshCw, CheckCircle2, Bot, Sparkles,
    Send, Database, Wand2, Terminal, ShieldCheck, ArrowRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function AiBridgePanel() {
    const [status, setStatus] = useState("CONNECTED");
    const [activeTask, setActiveTask] = useState<any>(null);

    const copyToBridge = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Payload copiado al puente", {
            description: "Listo para inyectar en Gemini/Claude (Modo No-API)"
        });
    };

    return (
        <div className="w-full flex flex-col gap-10 min-h-screen bg-[#F8FAFC] p-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-slate-200 pb-10">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <Badge className="bg-indigo-600 text-white border-none font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-full">
                            Cross-Model Bridge v2.0
                        </Badge>
                        <div className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sincronización Persistente</span>
                        </div>
                    </div>
                    <div>
                        <h1 className="text-6xl font-black text-slate-900 italic tracking-tighter leading-none flex items-center gap-4">
                            AI <span className="text-indigo-600 not-italic">COLLAB</span> BRIDGE
                        </h1>
                        <p className="text-sm text-slate-500 font-bold uppercase tracking-[0.3em] mt-3">Interconexión de Modelos & Transferencia de Datos</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <StatusBadge label="GEMINI" status="ACTIVE" />
                    <StatusBadge label="CLAUDE" status="ACTIVE" />
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                {/* Automation Controller */}
                <Card className="xl:col-span-8 rounded-[3rem] border-none shadow-2xl bg-white overflow-hidden">
                    <CardHeader className="p-10 bg-slate-900 text-white">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center">
                                    <Cpu className="h-6 w-6 text-indigo-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-2xl font-black italic uppercase italic">Controlador de Tareas</CardTitle>
                                    <CardDescription className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Orquestación No-API</CardDescription>
                                </div>
                            </div>
                            <Button variant="outline" className="border-white/10 hover:bg-white/10 text-white rounded-xl gap-2 font-black text-[9px] uppercase">
                                <RefreshCw className="h-4 w-4" /> RECONECTAR PUENTE
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-10 space-y-8">
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Flujos de Automatización Disponibles</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <TaskCard
                                    title="Deep Research -> Gemini"
                                    desc="Envía datos de scraping de Amazon/AliExpress para análisis de ángulos."
                                    icon={Terminal}
                                    onAction={() => copyToBridge("DATOS DE PRODUCTO: [X, Y, Z] ANALIZA ÁNGULOS...")}
                                />
                                <TaskCard
                                    title="Gemini Angles -> Claude Copy"
                                    desc="Pasa los ángulos ganadores para generar scripts de VSL y Estáticos."
                                    icon={Wand2}
                                    onAction={() => copyToBridge("ÁNGULOS DETECTADOS: [1, 2, 3] GENERA 5 HOOKS...")}
                                />
                                <TaskCard
                                    title="Creative Dissection -> App"
                                    desc="Extrae insights de creativos de la competencia a la base de datos."
                                    icon={Database}
                                    onAction={() => copyToBridge("DISSECT VIDEO URL: ...")}
                                />
                                <TaskCard
                                    title="Landing Cloner -> Optimizer"
                                    desc="Lleva el HTML clonado a la IA para mejora de conversión (CRO)."
                                    icon={Sparkles}
                                    onAction={() => copyToBridge("OPTIMIZA ESTE HTML PARA MÓVIL...")}
                                />
                            </div>
                        </div>

                        <div className="pt-8 border-t border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                                    <ShieldCheck className="h-6 w-6" />
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-xs font-black text-slate-900 uppercase">Seguridad del Puente</p>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Encriptación End-to-End activa en Localhost</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-slate-300 uppercase italic">Power by Nano Banana Core</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Direct Links & Utilities */}
                <div className="xl:col-span-4 flex flex-col gap-8">
                    <Card className="rounded-[3rem] border-none shadow-xl bg-indigo-600 text-white p-8">
                        <div className="space-y-6">
                            <div className="h-14 w-14 bg-white/20 rounded-2xl flex items-center justify-center">
                                <ExternalLink className="h-8 w-8 text-white" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black italic uppercase leading-tight">Acceso Directo No-API</h3>
                                <p className="text-[10px] font-bold text-indigo-100 mt-2 opacity-80 leading-relaxed uppercase">Manual-Assisted Automation: El puente inyecta el contexto en tu cuenta abierta.</p>
                            </div>
                            <div className="space-y-3">
                                <Button className="w-full bg-white text-indigo-600 hover:bg-slate-50 font-black rounded-2xl h-14 gap-3 uppercase text-[10px] tracking-widest shadow-xl" onClick={() => window.open('https://gemini.google.com', '_blank')}>
                                    <Bot className="h-4 w-4" /> ABRIR GEMINI MASTER
                                </Button>
                                <Button variant="outline" className="w-full border-white/20 hover:bg-white/10 text-white font-black rounded-2xl h-14 gap-3 uppercase text-[10px] tracking-widest" onClick={() => window.open('https://claude.ai', '_blank')}>
                                    <Sparkles className="h-4 w-4" /> ABRIR CLAUDE OPS
                                </Button>
                            </div>
                        </div>
                    </Card>

                    <Card className="rounded-[3rem] border-none shadow-xl bg-white p-8 space-y-6">
                        <div className="flex items-center gap-3">
                            <Share2 className="h-5 w-5 text-indigo-600" />
                            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Historial de Puente</h4>
                        </div>
                        <div className="space-y-4">
                            <BridgeHistoryItem
                                title="Análisis de Ángulos"
                                model="Gemini"
                                time="Hace 10 min"
                            />
                            <BridgeHistoryItem
                                title="Copywriting VSL #1"
                                model="Claude"
                                time="Hace 25 min"
                            />
                            <BridgeHistoryItem
                                title="Inyección CRM Hub"
                                model="App Core"
                                time="Ayer"
                            />
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ label, status }: any) {
    return (
        <div className="bg-white border border-slate-200 rounded-2xl px-6 py-4 flex items-center gap-4 shadow-sm">
            <div className={cn("h-2 w-2 rounded-full", status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-300')} />
            <div className="flex flex-col">
                <span className="text-[9px] font-black text-slate-400 tracking-widest">{label}</span>
                <span className="text-[11px] font-black text-slate-900 italic tracking-tight">{status}</span>
            </div>
        </div>
    );
}

function TaskCard({ title, desc, icon: Icon, onAction }: any) {
    return (
        <div className="group border border-slate-100 rounded-[2rem] p-6 hover:bg-slate-50 transition-all cursor-pointer">
            <div className="flex justify-between items-start mb-4">
                <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <Icon className="h-5 w-5" />
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-indigo-600" onClick={(e) => { e.stopPropagation(); onAction(); }}>
                    <Clipboard className="h-4 w-4" />
                </Button>
            </div>
            <h5 className="text-sm font-black text-slate-900 uppercase italic mb-1">{title}</h5>
            <p className="text-[10px] text-slate-400 font-bold leading-relaxed">{desc}</p>
            <div className="mt-4 flex items-center gap-2 text-indigo-600 font-black text-[9px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                Ejecutar Pipeline <ArrowRight className="h-3 w-3" />
            </div>
        </div>
    );
}

function BridgeHistoryItem({ title, model, time }: any) {
    return (
        <div className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
            <div className="flex flex-col">
                <span className="text-[11px] font-black text-slate-900">{title}</span>
                <span className="text-[9px] text-slate-400 font-bold flex items-center gap-1">
                    {model} • {time}
                </span>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-300 hover:text-indigo-600">
                <RefreshCw className="h-3.5 w-3.5" />
            </Button>
        </div>
    );
}
