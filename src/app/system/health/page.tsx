
"use client";

import { useState, useEffect } from "react";
import {
    Activity, ShieldCheck, Database,
    Globe, Zap, RefreshCw, AlertCircle,
    CheckCircle2, Clock, Server, Cloud,
    ArrowRight, Settings, ShoppingCart, Truck
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export default function SystemHealthPage() {
    const [lastScan, setLastScan] = useState(new Date());

    const services = [
        { name: "Meta Ads API", status: "HEALTHY", latency: 120, uptime: 99.9, icon: Zap, color: "indigo" },
        { name: "Shopify Webhooks", status: "HEALTHY", latency: 45, uptime: 100, icon: ShoppingCart, color: "emerald" },
        { name: "Logística Engine", status: "WARNING", latency: 850, uptime: 98.5, icon: Truck, color: "amber", issues: ["Latencia elevada en el endpoint de tracking"] },
        { name: "AI Moderation Guard", status: "HEALTHY", latency: 310, uptime: 99.8, icon: ShieldCheck, color: "purple" },
        { name: "Database (LibSQL)", status: "HEALTHY", latency: 12, uptime: 100, icon: Database, color: "slate" }
    ];

    const syncJobs = [
        { name: "Daily Snapshot Sync", lastRun: "hace 14 min", progress: 100, status: "SUCCESS" },
        { name: "Ads Metric Aggregation", lastRun: "en progreso", progress: 65, status: "RUNNING" },
        { name: "Inventory Reconciliation", lastRun: "hace 2 min", progress: 100, status: "SUCCESS" }
    ];

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 text-slate-900 font-sans selection:bg-indigo-100">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                <div className="flex items-center gap-6">
                    <div className="h-14 w-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
                        <Activity className="h-7 w-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tighter text-slate-900 uppercase">
                            Salud del <span className="text-indigo-600">Sistema</span>
                        </h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                            Live Infrastructure Monitor • v2.0
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-6 py-3">
                    <div className="flex flex-col text-right mr-4">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-tight">Último Análisis</span>
                        <span className="text-xs font-bold text-slate-700 uppercase leading-tight">{lastScan.toLocaleTimeString()}</span>
                    </div>
                    <Button
                        variant="ghost" size="icon"
                        onClick={() => setLastScan(new Date())}
                        className="h-10 w-10 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm"
                    >
                        <RefreshCw className="h-4 w-4 text-indigo-600" />
                    </Button>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Column Left: Service Status */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {services.map((service, idx) => (
                            <ServiceCard key={idx} {...service} />
                        ))}
                    </div>

                    {/* Sync Engine Details */}
                    <Card className="bg-white border-none rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                        <CardHeader className="p-8 border-b border-slate-50 bg-slate-50/30">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <Server className="h-5 w-5 text-indigo-600" />
                                        <CardTitle className="text-xl font-black uppercase tracking-tighter">Motor de Sincronización</CardTitle>
                                    </div>
                                    <CardDescription className="text-slate-400 font-bold uppercase text-[9px] tracking-widest mt-1">Cola de trabajos activos y completados</CardDescription>
                                </div>
                                <Badge className="bg-indigo-50 text-indigo-600 border-none font-black text-[10px] tracking-widest px-3 py-1 rounded-full uppercase italic">Active Queue</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            {syncJobs.map((job, idx) => (
                                <div key={idx} className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={cn("h-1.5 w-1.5 rounded-full", job.status === "RUNNING" ? "bg-indigo-500 animate-pulse" : "bg-emerald-500")} />
                                            <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">{job.name}</span>
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase italic">{job.lastRun}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Progress value={job.progress} className="h-2 bg-slate-50 border border-slate-100" />
                                        <span className="text-[10px] font-black text-slate-900 w-10 text-right">{job.progress}%</span>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                {/* Column Right: Infrastructure Metrics */}
                <div className="space-y-8">
                    <Card className="bg-white border-none rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden p-8">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                                <Cloud className="h-5 w-5 text-indigo-600" />
                            </div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Truth Layer Health</h3>
                        </div>

                        <div className="space-y-8">
                            <HealthMetric label="Integridad de Datos" score={98} sub="Snapshots Diarios" />
                            <HealthMetric label="Cobertura Meta" score={100} sub="Atribución Real" />
                            <HealthMetric label="Eficiencia API" score={94} sub="Request Success Rate" />
                        </div>

                        <div className="mt-12 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                            <div className="flex items-center gap-3 mb-3">
                                <AlertCircle className="h-4 w-4 text-emerald-600" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Sistema Optimizado</span>
                            </div>
                            <p className="text-[10px] font-medium text-slate-500 leading-relaxed italic">
                                El sistema está operando dentro de los parámetros esperados. La latencia en logística no afecta la integridad de los datos contables.
                            </p>
                        </div>
                    </Card>

                    <Button className="w-full h-16 bg-slate-900 hover:bg-slate-800 text-white border-none rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-xl group">
                        Configurar Alertas
                        <ArrowRight className="h-4 w-4 ml-3 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

function ServiceCard({ name, status, latency, uptime, icon: Icon, color, issues }: any) {
    const isHealthy = status === "HEALTHY";

    return (
        <Card className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
            <CardContent className="p-8">
                <div className="flex items-start justify-between mb-6">
                    <div className={cn(
                        "h-12 w-12 rounded-2xl flex items-center justify-center transition-colors",
                        isHealthy ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                    )}>
                        <Icon className="h-6 w-6" />
                    </div>
                    <Badge className={cn(
                        "border-none font-black text-[9px] tracking-widest px-3 py-1 rounded-full uppercase",
                        isHealthy ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                    )}>
                        {status}
                    </Badge>
                </div>

                <div className="mb-6">
                    <h3 className="text-lg font-black uppercase tracking-tighter text-slate-900 mb-1">{name}</h3>
                    <div className="flex items-center gap-4">
                        <span className="text-[10px] font-bold text-slate-400 border-r border-slate-200 pr-4">{latency}ms Latencia</span>
                        <span className="text-[10px] font-bold text-slate-400">{uptime}% Uptime</span>
                    </div>
                </div>

                {issues && issues.length > 0 && (
                    <div className="space-y-2 pt-4 border-t border-slate-50">
                        {issues.map((issue: string, i: number) => (
                            <div key={i} className="flex items-start gap-2">
                                <AlertCircle className="h-3 w-3 text-amber-600 mt-0.5" />
                                <span className="text-[9px] font-bold text-slate-500 uppercase italic leading-tight">{issue}</span>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function HealthMetric({ label, score, sub }: any) {
    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between font-black uppercase tracking-widest text-[9px]">
                <span className="text-slate-400">{label}</span>
                <span className="text-slate-900">{score}%</span>
            </div>
            <Progress value={score} className="h-1.5 bg-slate-50" />
            <span className="text-[8px] font-bold text-slate-300 uppercase tracking-tighter italic">{sub}</span>
        </div>
    );
}
