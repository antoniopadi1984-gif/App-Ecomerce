"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
    TrendingUp, Target, Truck, Layout, Zap, AlertTriangle,
    ChevronUp, ChevronDown, Eye, BarChart3, Compass, Globe, MousePointer2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getEagleEyeStats } from "./actions";
import { cn } from "@/lib/utils";

export default function EagleEyePage() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [analyticsData, setAnalyticsData] = useState<any>(null);

    useEffect(() => {
        const loadAll = async () => {
            const [eeData, gaData] = await Promise.all([
                getEagleEyeStats(),
                import("@/app/analytics/actions").then(mod => mod.getAnalyticsData())
            ]);
            setStats(eeData);
            setAnalyticsData(gaData);
            setLoading(false);
        };
        loadAll();
    }, []);

    if (loading) return (
        <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
            <Zap className="h-12 w-12 text-indigo-600 animate-pulse" />
            <p className="text-sm font-black text-indigo-900 tracking-tighter animate-bounce">CALIBRANDO DATA...</p>
        </div>
    );

    return (
        <div className="space-y-4 max-w-[1600px] mx-auto p-4 bg-mesh-light min-h-screen">
            {/* Header / Title */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <Badge variant="outline" className="bg-indigo-600 text-white border-none gap-2 px-3 py-1 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100 italic">
                        <Compass className="h-3 w-3" /> ESTRATEGIA MASTER INTEL
                    </Badge>
                    <h1 className="text-lg font-black tracking-tighter text-slate-900 drop-shadow-sm uppercase italic leading-tight">
                        Vista de Águila
                    </h1>
                    <p className="text-slate-500 font-bold tracking-tight text-sm">Fusión master de Shopify, Ads & Google Analytics 4.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="premium-card h-10 px-6 font-black border-slate-100 hover:bg-slate-50 transition-all">DATASET: 7D</Button>
                    <Button className="h-10 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-lg shadow-xl shadow-indigo-100 transition-all active:scale-95 uppercase tracking-tighter">RECALIBRAR SISTEMA</Button>
                </div>
            </div>

            {/* REAL-TIME PULSE (GA4) */}
            <Card className="premium-card overflow-hidden border-none vibrant-shadow-indigo bg-white">
                <CardHeader className="bg-slate-50/50 py-5 flex flex-row items-center justify-between border-b border-slate-100">
                    <CardTitle className="text-[10px] font-black flex items-center gap-2 tracking-[0.2em] text-slate-400 uppercase">
                        <BarChart3 className="h-4 w-4 text-indigo-600" /> GOOGLE ANALYTICS 4 • REAL-TIME PULSE
                    </CardTitle>
                    {analyticsData?.connected ? (
                        <div className="flex items-center gap-3 bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-100">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                            </span>
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">SISTEMA ONLINE</span>
                        </div>
                    ) : (
                        <Badge className="bg-slate-100 text-slate-400 border-none font-black text-[9px] uppercase px-3">OFFLINE</Badge>
                    )}
                </CardHeader>
                <CardContent className="p-0">
                    <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-100">
                        <PulseStat label="Visitantes (7d)" value={analyticsData?.data?.visitors || "0"} />
                        <PulseStat label="Tasa de Rebote" value={`${analyticsData?.data?.bounceRate || "0"}%`} />
                        <PulseStat label="Conversión Store" value={`${analyticsData?.data?.conversionRate || "0"}%`} color="text-indigo-600" />
                        <PulseStat label="Repurchase Rate" value={`${analyticsData?.data?.repurchaseRate || "0"}%`} color="text-pink-600" />
                    </div>
                </CardContent>
            </Card>

            {/* Main Scorecard Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                {/* 1. VENTAS & MARKETING */}
                <div className="space-y-4">
                    <h3 className="text-lg font-black flex items-center gap-3 tracking-tighter text-slate-900 italic uppercase">
                        <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-100">
                            <TrendingUp className="h-5 w-5 text-white" />
                        </div>
                        Rentabilidad & Media
                    </h3>
                    <div className="premium-card divide-y divide-slate-50 border-none vibrant-shadow-indigo bg-white/95">
                        <MetricRow label="Ingresos Master" value={`€${stats.sales.revenue.toLocaleString()}`} target="€25,000" status="green" />
                        <MetricRow label="Total Ad Spend" value={`€${stats.sales.spend.toLocaleString()}`} target="€5,000" status="green" />
                        <MetricRow label="ROAS Consolidado" value={`${stats.sales.roas.toFixed(2)}x`} target="3.50x" status="yellow" />
                        <MetricRow label="CPA Real" value={`€${stats.performance.realCPA.toFixed(2)}`} target="€15.00" status="rose" />
                    </div>
                </div>

                {/* 2. OPERACIONES & LOGÍSTICA */}
                <div className="space-y-4">
                    <h3 className="text-lg font-black flex items-center gap-3 tracking-tighter text-slate-900 italic uppercase">
                        <div className="h-8 w-8 bg-emerald-600 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-100">
                            <Truck className="h-5 w-5 text-white" />
                        </div>
                        Logística & Fullfilment
                    </h3>
                    <div className="premium-card divide-y divide-slate-50 border-none vibrant-shadow-emerald bg-white/95">
                        <MetricRow label="Órdenes Entregadas" value={stats.logistics.delivered} target="95%" status="green" />
                        <MetricRow label="Delivery Rate" value={`${stats.logistics.deliveryRate.toFixed(1)}%`} target="85%" status="yellow" />
                        <MetricRow label="Incidencias Críticas" value={stats.logistics.incidences} target="< 5" status="rose" />
                        <MetricRow label="Tasa de Devolución" value={`${stats.logistics.returns}%`} target="2%" status="green" />
                    </div>
                </div>

            </div>
        </div>
    );
}

function PulseStat({ label, value, color }: any) {
    return (
        <div className="p-4 text-center group hover:bg-slate-50/50 transition-all duration-500">
            <span className="text-[10px] uppercase font-black text-slate-400 block mb-2 tracking-[0.2em] opacity-80">{label}</span>
            <span className={cn("text-lg font-black tracking-tighter block drop-shadow-sm group-hover:scale-110 transition-transform duration-500", color || "text-slate-900")}>{value}</span>
        </div>
    );
}

function MetricRow({ label, value, target, status }: any) {
    return (
        <div className="flex items-center justify-between p-4 hover:bg-indigo-50/30 transition-all group cursor-default">
            <div className="flex items-center gap-4">
                <div className={cn(
                    "h-2 w-2 rounded-full",
                    status === 'green' ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.6)]" :
                        status === 'yellow' ? "bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.6)]" :
                            "bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.6)]"
                )} />
                <span className="text-sm font-black text-slate-500 group-hover:text-slate-900 transition-colors uppercase tracking-tight">{label}</span>
            </div>
            <div className="flex items-center gap-6">
                <div className="text-right">
                    <span className="text-[10px] font-black text-slate-300 uppercase block tracking-wider">Actual</span>
                    <span className="text-lg font-black text-slate-900 tracking-tighter italic">{value}</span>
                </div>
                <div className="text-right min-w-[70px]">
                    <span className="text-[10px] font-black text-slate-300 uppercase block tracking-wider">Target</span>
                    <span className="text-xs font-black text-slate-400 opacity-60 px-2 bg-slate-100 rounded-md">{target}</span>
                </div>
            </div>
        </div>
    );
}
