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
import { PageShell } from "@/components/ui/PageShell";
import { ModuleHeader } from "@/components/ui/ModuleHeader";
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from "@/lib/styles/tokens";

export default function SystemHealthPage() {
    const [lastScan, setLastScan] = useState(new Date());

    const services = [
        { name: "Meta Ads API", status: "HEALTHY", latency: 120, uptime: 99.9, icon: Zap, color: "rose" },
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
        <PageShell>
            <ModuleHeader
                title="Salud del Sistema"
                subtitle="Live Infrastructure Monitor"
                icon={Activity}
                actions={
                    <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-1.5">
                        <div className="flex flex-col text-right">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-tight">Último Análisis</span>
                            <span className="text-[10px] font-bold text-slate-700 uppercase leading-tight">{lastScan.toLocaleTimeString()}</span>
                        </div>
                        <Button
                            variant="ghost" size="icon"
                            onClick={() => setLastScan(new Date())}
                            className="h-8 w-8 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm"
                        >
                            <RefreshCw className="h-4 w-4 text-rose-600" />
                        </Button>
                    </div>
                }
            />

            <main className="p-4 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {services.map((service, idx) => (
                                <ServiceCard key={idx} {...service} />
                            ))}
                        </div>

                        <Card className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
                            <CardHeader className="p-4 border-b border-slate-50 bg-slate-50/50">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <Server className="h-4 w-4 text-rose-600" />
                                            <CardTitle className="text-sm font-black uppercase tracking-tight">Motor de Sincronización</CardTitle>
                                        </div>
                                        <CardDescription className="text-slate-400 font-bold uppercase text-[8px] tracking-widest mt-1">Status de procesos activos</CardDescription>
                                    </div>
                                    <Badge className="bg-rose-50 text-rose-600 border-none font-black text-[9px] tracking-widest px-2 py-0.5 rounded-full uppercase italic">Active</Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 space-y-4">
                                {syncJobs.map((job, idx) => (
                                    <div key={idx} className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className={cn("h-1.5 w-1.5 rounded-full", job.status === "RUNNING" ? "bg-rose-500 animate-pulse" : "bg-emerald-500")} />
                                                <span className="text-[10px] font-black text-slate-700 uppercase tracking-tight">{job.name}</span>
                                            </div>
                                            <span className="text-[9px] font-bold text-slate-400 uppercase italic">{job.lastRun}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <Progress value={job.progress} className="h-1.5 bg-slate-50 border border-slate-100" />
                                            <span className="text-[10px] font-black text-slate-900 w-8 text-right">{job.progress}%</span>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="h-8 w-8 bg-rose-50 rounded-lg flex items-center justify-center">
                                    <Cloud className="h-4 w-4 text-rose-600" />
                                </div>
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Truth Layer Health</h3>
                            </div>

                            <div className="space-y-6">
                                <HealthMetric label="Integridad de Datos" score={98} sub="Snapshots Diarios" />
                                <HealthMetric label="Cobertura Meta" score={100} sub="Atribución Real" />
                                <HealthMetric label="Eficiencia API" score={94} sub="Request Success Rate" />
                            </div>

                            <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="flex items-start gap-2 mb-2">
                                    <AlertCircle className="h-3 w-3 text-emerald-600 mt-0.5" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-900">Sistema Optimizado</span>
                                </div>
                                <p className="text-[9px] font-medium text-slate-500 leading-relaxed italic">
                                    Operando dentro de los parámetros esperados. Latencia bajo control.
                                </p>
                            </div>
                        </Card>

                        <Button className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white border-none rounded-xl font-black uppercase text-[10px] tracking-widest shadow-sm group">
                            Configurar Alertas
                            <ArrowRight className="h-3.5 w-3.5 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </div>
                </div>
            </main>
        </PageShell>
    );
}

function ServiceCard({ name, status, latency, uptime, icon: Icon, color, issues }: any) {
    const isHealthy = status === "HEALTHY";

    return (
        <Card className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden group hover:shadow-sm transition-shadow">
            <CardContent className="p-4">
                <div className="flex items-start justify-between mb-4">
                    <div className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center transition-colors",
                        isHealthy ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                    )}>
                        <Icon className="h-5 w-5" />
                    </div>
                    <Badge className={cn(
                        "border-none font-black text-[8px] tracking-widest px-2 py-0.5 rounded-full uppercase",
                        isHealthy ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                    )}>
                        {status}
                    </Badge>
                </div>

                <div className="mb-4">
                    <h3 className="text-sm font-black uppercase tracking-tight text-slate-900 mb-1">{name}</h3>
                    <div className="flex items-center gap-3">
                        <span className="text-[9px] font-bold text-slate-400 border-r border-slate-200 pr-3">{latency}ms Latencia</span>
                        <span className="text-[9px] font-bold text-slate-400">{uptime}% Uptime</span>
                    </div>
                </div>

                {issues && issues.length > 0 && (
                    <div className="space-y-1.5 pt-3 border-t border-slate-50">
                        {issues.map((issue: string, i: number) => (
                            <div key={i} className="flex items-start gap-2">
                                <AlertCircle className="h-3 w-3 text-amber-600 mt-0.5" />
                                <span className="text-[8px] font-bold text-slate-500 uppercase italic leading-tight">{issue}</span>
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
        <div className="space-y-2">
            <div className="flex items-center justify-between font-black uppercase tracking-widest text-[8px]">
                <span className="text-slate-400">{label}</span>
                <span className="text-slate-900">{score}%</span>
            </div>
            <Progress value={score} className="h-1 bg-slate-50" />
            <span className="text-[8px] font-bold text-slate-300 uppercase tracking-tighter italic">{sub}</span>
        </div>
    );
}
