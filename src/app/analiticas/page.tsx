"use client";

import React, { useState, useEffect } from "react";
import { useProduct } from "@/context/ProductContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

import { t } from "@/lib/constants/translations";
import { PremiumCard } from "@/components/ui/premium-card";
import { ds } from "@/lib/styles/design-system";

import {
    BarChart3, TrendingUp, Users, ShoppingBag,
    Calendar, RefreshCw, Activity, ArrowUpRight,
    ArrowDownRight, Zap, Target, Gauge, AlertCircle
} from "lucide-react";

export default function ProductAnalyticsPage() {
    const { productId, product, allProducts } = useProduct();

    if (!productId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center animate-in fade-in duration-700">
                <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center">
                    <AlertCircle className="w-10 h-10 text-rose-500" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight italic uppercase">Contexto Requerido</h2>
                    <p className="text-slate-500 max-w-sm mx-auto font-medium">Por favor, selecciona un producto en el menú lateral para acceder a Analíticas Detalladas.</p>
                </div>
                <div className="flex gap-4">
                    <div className="flex -space-x-3 overflow-hidden p-1">
                        {allProducts.slice(0, 3).map((p) => (
                            <div key={p.id}
                                className="inline-block h-10 w-10 rounded-xl ring-4 ring-white shadow-sm overflow-hidden bg-slate-100">
                                {p.imageUrl ? <img src={p.imageUrl} alt="" /> : <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold">?</div>}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);

    // Mock data for now, similar to PerformanceMaster but filtered for this product
    useEffect(() => {
        const timer = setTimeout(() => {
            setData({
                revenue: 12450,
                orders: 142,
                roas: 3.42,
                cpa: 12.50,
                visitors: 4500,
                conversionRate: 3.15,
                spend: 3640,
                profit: 4210,
                roi: 115,
                deliveredRate: 88.5
            });
            setLoading(false);
        }, 1000);
        return () => clearTimeout(timer);
    }, [productId]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
            <RefreshCw className="h-10 w-10 text-blue-600 animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Analizando Métricas del Producto...</p>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-[1600px] mx-auto p-6 pb-20">
            {/* Header Control */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 px-6 py-5 rounded-2xl shadow-sm border border-slate-800">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tight uppercase italic">
                        {t('analytics_deep_dive')} <span className="text-blue-500 not-italic">V4</span>
                    </h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                        ID: {productId.slice(0, 8)} • {t('real_data_desc')}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Select defaultValue="MONTH">
                        <SelectTrigger className="w-[130px] h-9 bg-white/5 border-slate-700 rounded-xl font-bold text-[9px] uppercase tracking-widest text-slate-300">
                            <Calendar className="h-3 w-3 mr-2 text-blue-500" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-800 bg-slate-900 text-slate-300">
                            <SelectItem value="DAY">{t('today')}</SelectItem>
                            <SelectItem value="WEEK">{t('this_week')}</SelectItem>
                            <SelectItem value="MONTH">{t('this_month')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard label="REVENUE" value={`€${data.revenue.toLocaleString()}`} trend={+12} icon={ShoppingBag} color="blue" />
                <KPICard label="ROAS" value={`${data.roas}x`} trend={+0.5} icon={TrendingUp} color="emerald" />
                <KPICard label="CVR" value={`${data.conversionRate}%`} trend={-0.2} icon={Activity} color="rose" />
                <KPICard label="PROFIT" value={`€${data.profit.toLocaleString()}`} trend={+8} icon={Zap} color="amber" />
            </div>

            {/* Performance Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <PremiumCard className="col-span-1 lg:col-span-2 shadow-sm p-5 rounded-2xl">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('embu_trafico')}</h3>
                            <Badge className="bg-slate-100 text-slate-600 border-none font-bold text-[8px]">{t('live')}</Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                            <StatCircle label={t('visitas')} value={data.visitors.toLocaleString()} />
                            <StatCircle label={t('añadidos')} value="482" />
                            <StatCircle label={t('pagos')} value={data.orders.toLocaleString()} />
                        </div>
                    </div>
                </PremiumCard>

                <PremiumCard className="bg-slate-900 text-white overflow-hidden relative border-0 p-5 rounded-2xl">
                    <div className="absolute -top-2 -right-2 opacity-5">
                        <Target className="w-24 h-24 text-blue-400" />
                    </div>
                    <div className="relative z-10 space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-400">{t('logistica_eficiencia')}</h3>
                        <div className="space-y-0.5">
                            <p className="text-3xl font-black">{data.deliveredRate}%</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t('entrega_real')}</p>
                        </div>
                        <div className="pt-3 border-t border-slate-800 space-y-2">
                            <div className="flex justify-between text-[11px] font-bold font-mono">
                                <span className="text-slate-500">{t('profit_real')}</span>
                                <span className="text-emerald-400">€{data.profit.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-[11px] font-bold font-mono">
                                <span className="text-slate-500">{t('roi_impact')}</span>
                                <span className="text-blue-400">{data.roi}%</span>
                            </div>
                        </div>
                    </div>
                </PremiumCard>
            </div>
        </div>
    );
}

function KPICard({ label, value, trend, icon: Icon, color }: any) {
    const colors: any = {
        blue: "bg-blue-50 text-blue-600",
        emerald: "bg-emerald-50 text-emerald-600",
        rose: "bg-rose-50 text-rose-600",
        amber: "bg-amber-50 text-amber-600"
    };

    return (
        <PremiumCard hover className="group p-4 rounded-xl">
            <div className="flex items-center justify-between mb-3">
                <div className={cn("p-2 rounded-lg", colors[color])}>
                    <Icon className="h-3.5 w-3.5" />
                </div>
                {trend && (
                    <div className={cn(
                        "flex items-center gap-0.5 text-[9px] font-black px-1.5 py-0.5 rounded-full",
                        trend > 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                    )}>
                        {trend > 0 ? <ArrowUpRight className="h-2.5 w-2.5" /> : <ArrowDownRight className="h-2.5 w-2.5" />}
                        {Math.abs(trend)}%
                    </div>
                )}
            </div>
            <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">{label}</p>
            <p className="text-xl font-black tracking-tighter text-slate-900 mt-0.5">{value}</p>
        </PremiumCard>
    );
}

function StatCircle({ label, value }: any) {
    return (
        <div className="flex flex-col items-center text-center space-y-1.5">
            <div className="w-14 h-14 rounded-full border-2 border-slate-50 flex items-center justify-center bg-white shadow-sm">
                <span className="text-base font-black text-slate-900">{value}</span>
            </div>
            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">{label}</span>
        </div>
    );
}
