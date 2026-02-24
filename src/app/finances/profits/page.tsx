
"use client";

import React, { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, DollarSign, Package, Shuffle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ProfitsDashboard() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        setLoading(true);
        // This will call a new API we're about to create
        const res = await fetch("/api/finances/profit-stats").then(r => r.json());
        setStats(res);
        setLoading(false);
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const MetricCard = ({ title, value, subtitle, icon: Icon, color }: any) => (
        <Card className="border border-slate-100 shadow-sm rounded-lg bg-white overflow-hidden">
            <CardHeader className="p-3 pb-1">
                <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 leading-none">{title}</span>
                    <Icon className="h-3.5 w-3.5 text-slate-900" />
                </div>
                <CardTitle className="text-lg font-black tracking-tighter italic">{value}</CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3">
                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{subtitle}</p>
            </CardContent>
        </Card>
    );

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-6 space-y-4">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-slate-900 rounded-lg flex items-center justify-center shadow-sm">
                        <DollarSign className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-slate-900 flex items-center gap-2 italic uppercase tracking-tighter">
                            PROFIT <span className="text-slate-400">ANALYSIS</span>
                        </h1>
                        <p className="text-slate-500 font-bold uppercase text-[8px] tracking-[0.2em] mt-0.5">Technical Truth Layer: Real-time Profitability</p>
                    </div>
                </div>
                <Button onClick={fetchStats} variant="outline" className="h-8 rounded-lg text-[9px] font-black uppercase tracking-widest px-4 border-slate-200">Recalcular</Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard
                    title="Revenue Real"
                    value={`${stats?.totalRevenue?.toFixed(2) || 0} €`}
                    subtitle="Solo pedidos entregados"
                    icon={TrendingUp}
                    color="text-slate-900"
                />
                <MetricCard
                    title="COGS Acumulado"
                    value={`${stats?.totalCogs?.toFixed(2) || 0} €`}
                    subtitle="Coste de producto enviado"
                    icon={Package}
                    color="text-slate-400"
                />
                <MetricCard
                    title="Logística Total"
                    value={`${stats?.totalLogistics?.toFixed(2) || 0} €`}
                    subtitle="Envío + COD + Retornos"
                    icon={Shuffle}
                    color="text-slate-400"
                />
                <MetricCard
                    title="Profit Neto Real"
                    value={`${stats?.netProfit?.toFixed(2) || 0} €`}
                    subtitle="Verdad técnica (Neto)"
                    icon={DollarSign}
                    color="text-slate-900"
                />
            </div>

            <Card className="border border-slate-100 shadow-sm rounded-lg bg-white overflow-hidden">
                <CardHeader className="p-4 border-b border-slate-50">
                    <CardTitle className="text-sm font-black uppercase italic tracking-tighter">Desglose de Pedidos Recientes</CardTitle>
                    <CardDescription className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Verificando cada céntimo</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-slate-50">
                        {stats?.recentOrders?.map((order: any) => (
                            <div key={order.id} className="flex justify-between items-center p-3 hover:bg-slate-50/50 transition-all">
                                <div className="flex flex-col">
                                    <span className="text-[11px] font-black text-slate-900 italic">{order.orderNumber}</span>
                                    <span className="text-[8px] text-slate-400 uppercase font-black tracking-widest leading-none mt-1">{order.logisticsStatus}</span>
                                </div>
                                <div className="flex gap-6 items-center">
                                    <div className="flex flex-col items-end leading-none">
                                        <span className="text-[8px] uppercase font-black tracking-widest text-slate-400 mb-1">PROFIT</span>
                                        <span className="text-[12px] font-black italic tracking-tighter text-slate-950">
                                            {order.profit?.toFixed(2)} €
                                        </span>
                                    </div>
                                    <Badge variant="outline" className="rounded-sm text-[7px] font-black uppercase tracking-widest px-1.5 h-4 border-slate-200 text-slate-600 bg-slate-50">
                                        {order.status}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
