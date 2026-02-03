
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
        <Card className="border-0 shadow-lg rounded-3xl bg-white overflow-hidden">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{title}</span>
                    <Icon className={`h-4 w-4 ${color}`} />
                </div>
                <CardTitle className="text-2xl font-black">{value}</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-[10px] font-bold text-slate-500 uppercase">{subtitle}</p>
            </CardContent>
        </Card>
    );

    return (
        <div className="min-h-screen bg-slate-50 p-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3 lowercase">
                        <DollarSign className="h-8 w-8 text-emerald-600" />
                        PROFIT <span className="text-emerald-600 uppercase">ANALYSIS</span>
                    </h1>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1">Technical Truth Layer: Real-time Profitability</p>
                </div>
                <Button onClick={fetchStats} variant="outline" className="rounded-xl">Recalcular</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <MetricCard
                    title="Revenue Real"
                    value={`${stats?.totalRevenue?.toFixed(2) || 0} €`}
                    subtitle="Solo pedidos entregados"
                    icon={TrendingUp}
                    color="text-emerald-500"
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
                    color="text-blue-400"
                />
                <MetricCard
                    title="Profit Neto Real"
                    value={`${stats?.netProfit?.toFixed(2) || 0} €`}
                    subtitle="Verdad técnica (Neto)"
                    icon={DollarSign}
                    color="text-emerald-600"
                />
            </div>

            <Card className="border-0 shadow-2xl rounded-[3rem] bg-white overflow-hidden">
                <CardHeader className="p-10">
                    <CardTitle className="text-xl font-black uppercase">Desglose de Pedidos Recientes</CardTitle>
                    <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Verificando cada céntimo</CardDescription>
                </CardHeader>
                <CardContent className="p-10">
                    <div className="space-y-4">
                        {stats?.recentOrders?.map((order: any) => (
                            <div key={order.id} className="flex justify-between items-center p-4 border rounded-2xl border-slate-50 hover:bg-slate-50 transition-all">
                                <div className="flex flex-col">
                                    <span className="text-xs font-black">{order.orderNumber}</span>
                                    <span className="text-[10px] text-slate-400 uppercase font-bold">{order.logisticsStatus}</span>
                                </div>
                                <div className="flex gap-10 items-center">
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] uppercase font-bold text-slate-400">Profit</span>
                                        <span className={`text-sm font-black ${order.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {order.profit?.toFixed(2)} €
                                        </span>
                                    </div>
                                    <Badge variant={order.status === 'REAL' ? 'default' : 'secondary'} className="rounded-lg text-[8px] h-5">
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
