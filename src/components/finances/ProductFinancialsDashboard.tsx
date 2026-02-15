"use client";

import React, { useState } from "react";
import {
    DollarSign,
    Zap,
    Megaphone,
    TrendingUp as TrendingUpIcon,
    CalendarDays,
    CalendarRange,
    Truck,
    Box,
    LayoutGrid,
    BarChart3,
    ArrowUpRight,
    ArrowDownRight,
    Info,
    ChevronRight,
    Search
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ProductFinancialsDashboardProps {
    data: any;
    loading: boolean;
}

export function ProductFinancialsDashboard({ data, loading }: ProductFinancialsDashboardProps) {
    const [activeTab, setActiveTab] = useState("daily");

    if (loading && !data) {
        return (
            <div className="space-y-4">
                <div className="grid grid-cols-4 gap-4 animate-pulse">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-24 bg-slate-100 rounded-lg" />
                    ))}
                </div>
                <div className="h-[400px] bg-slate-50 rounded-lg animate-pulse" />
            </div>
        );
    }

    const { summary, dailyStats } = data || { summary: {}, dailyStats: [] };
    const netProfit = summary.netProfit || 0;
    const isProfitable = netProfit > 0;

    return (
        <div className="space-y-4 pb-12">
            {/* Top Summaries - High Density Style */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3">
                <MetricCard
                    label="NET REVENUE"
                    value={`€${(summary.totalRevenue || 0).toLocaleString()}`}
                    sub={`${summary.totalOrders || 0} pedidos`}
                    icon={DollarSign}
                    color="indigo"
                />
                <MetricCard
                    label="NET PROFIT"
                    value={`€${netProfit.toLocaleString()}`}
                    sub={`${((netProfit / (summary.totalRevenue || 1)) * 100).toFixed(1)}% margen`}
                    icon={Zap}
                    color={isProfitable ? "emerald" : "rose"}
                />
                <MetricCard
                    label="AD SPEND"
                    value={`€${(summary.adSpend || 0).toLocaleString()}`}
                    sub={`ROAS: ${(summary.totalRevenue / (summary.adSpend || 1)).toFixed(2)}`}
                    icon={Megaphone}
                    color="amber"
                />
                <MetricCard
                    label="CAC REAL"
                    value={`€${(summary.adSpend / (summary.confirmedOrders || 1)).toFixed(2)}`}
                    sub={`Confirmados: ${summary.confirmedOrders || 0}`}
                    icon={TrendingUpIcon}
                    color="slate"
                />
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="px-1 py-1 bg-white border border-slate-200 rounded-lg mb-4 shadow-sm inline-flex overflow-x-auto no-scrollbar max-w-full">
                    <TabsList className="bg-transparent h-9 gap-1">
                        <TabsTrigger value="daily" className="rounded-xl px-4 py-1.5 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all whitespace-nowrap">
                            <CalendarDays className="w-3.5 h-3.5 mr-2" />
                            Diario
                        </TabsTrigger>
                        <TabsTrigger value="monthly" className="rounded-xl px-4 py-1.5 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all whitespace-nowrap">
                            <CalendarRange className="w-3.5 h-3.5 mr-2" />
                            Mensual
                        </TabsTrigger>
                        <TabsTrigger value="annual" className="rounded-xl px-4 py-1.5 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all whitespace-nowrap">
                            <LayoutGrid className="w-3.5 h-3.5 mr-2" />
                            Anual
                        </TabsTrigger>
                        <TabsTrigger value="carriers" className="rounded-xl px-4 py-1.5 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all whitespace-nowrap">
                            <Truck className="w-3.5 h-3.5 mr-2" />
                            Transportistas
                        </TabsTrigger>
                        <TabsTrigger value="products" className="rounded-xl px-4 py-1.5 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all whitespace-nowrap">
                            <Box className="w-3.5 h-3.5 mr-2" />
                            Productos
                        </TabsTrigger>
                        <TabsTrigger value="ads" className="rounded-xl px-4 py-1.5 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all whitespace-nowrap">
                            <Megaphone className="w-3.5 h-3.5 mr-2" />
                            Publicidad
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="daily" className="m-0 space-y-4">
                    {/* Metrics Table */}
                    <div className="bg-white rounded-lg border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
                        <div className="overflow-x-auto no-scrollbar">
                            <table className="w-full text-left border-collapse table-fixed min-w-[2200px]">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100">
                                        <th className="w-[120px] px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Fecha</th>
                                        <th className="w-[100px] px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Meta Ads</th>
                                        <th className="w-[100px] px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">TikTok</th>
                                        <th className="w-[100px] px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Google</th>
                                        <th className="w-[100px] px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Ads</th>
                                        <th className="w-[100px] px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Ingresos</th>
                                        <th className="w-[80px] px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Pedidos</th>
                                        <th className="w-[80px] px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Confirm</th>
                                        <th className="w-[80px] px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Entreg</th>
                                        <th className="w-[80px] px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">ROAS</th>
                                        <th className="w-[100px] px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">COGS</th>
                                        <th className="w-[100px] px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Envío</th>
                                        <th className="w-[100px] px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Comisiones</th>
                                        <th className="w-[100px] px-4 py-3 text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50/30">Net Profit</th>
                                        <th className="w-[80px] px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">ROI</th>
                                        <th className="w-[120px] px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">IA Score</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {(dailyStats || []).map((day: any) => {
                                        const profit = (day.revenue || 0) - (day.adSpend || 0) - (day.cogs || 0) - (day.shippingCost || 0);
                                        const isDayProfitable = profit > 0;
                                        return (
                                            <tr key={day.date} className="hover:bg-slate-50/50 transition-colors text-[11px] font-medium">
                                                <td className="px-4 py-2 font-black text-slate-900">{format(new Date(day.date), "dd/MM/yyyy")}</td>
                                                <td className="px-4 py-2 text-slate-500">€{(day.metaAds || 0).toLocaleString()}</td>
                                                <td className="px-4 py-2 text-slate-500">€{(day.tiktokAds || 0).toLocaleString()}</td>
                                                <td className="px-4 py-2 text-slate-500">€{(day.googleAds || 0).toLocaleString()}</td>
                                                <td className="px-4 py-2 font-bold text-slate-700">€{(day.adSpend || 0).toLocaleString()}</td>
                                                <td className="px-4 py-2 font-bold text-slate-900">€{(day.revenue || 0).toLocaleString()}</td>
                                                <td className="px-4 py-2 text-slate-500 text-center">{day.orderCount || 0}</td>
                                                <td className="px-4 py-2 text-slate-500 text-center">{day.confirmedOrders || 0}</td>
                                                <td className="px-4 py-2 text-slate-500 text-center">{day.deliveredOrders || 0}</td>
                                                <td className="px-4 py-2">
                                                    <Badge className={cn(
                                                        "rounded px-1.5 py-0 h-4 font-black text-[9px] border-none shadow-none",
                                                        (day.revenue / (day.adSpend || 1)) > 2 ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                                                    )}>
                                                        {(day.revenue / (day.adSpend || 1)).toFixed(2)}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-2 text-rose-500/70">€{(day.cogs || 0).toLocaleString()}</td>
                                                <td className="px-4 py-2 text-rose-500/70">€{(day.shippingCost || 0).toLocaleString()}</td>
                                                <td className="px-4 py-2 text-rose-500/70">€{(day.fees || 0).toLocaleString()}</td>
                                                <td className={cn("px-4 py-2 font-black text-sm italic bg-emerald-50/20", isDayProfitable ? "text-emerald-600" : "text-rose-600")}>
                                                    €{profit.toLocaleString()}
                                                </td>
                                                <td className="px-4 py-2 font-bold text-slate-600">{((profit / (day.adSpend || 1)) * 100).toFixed(0)}%</td>
                                                <td className="px-4 py-2">
                                                    <div className="flex items-center justify-center">
                                                        <div className={cn(
                                                            "w-2.5 h-2.5 rounded-full shadow-lg",
                                                            isDayProfitable ? "bg-emerald-500 shadow-emerald-200" : "bg-rose-500 shadow-rose-200"
                                                        )} />
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="monthly">
                    <div className="bg-white rounded-lg border border-dashed border-slate-300 py-10 text-center">
                        <BarChart3 className="w-10 h-10 text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-400 font-black text-xs uppercase tracking-[0.3em]">Vista Mensual en Desarrollo</p>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function MetricCard({ label, value, sub, icon: Icon, color, trend }: { label: string, value: string, sub: string, icon: any, color: string, trend?: 'up' | 'down' }) {
    const colors: Record<string, string> = {
        indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
        emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
        rose: "bg-rose-50 text-rose-600 border-rose-100",
        amber: "bg-amber-50 text-amber-600 border-amber-100",
        slate: "bg-slate-50 text-slate-600 border-slate-100"
    };

    return (
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 group overflow-hidden relative hover:-translate-y-1">
            <div className="absolute -right-1 -top-1 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
                <Icon className="w-16 h-16 rotate-12" />
            </div>

            <div className="flex items-center justify-between mb-3">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center border shadow-sm", colors[color])}>
                    <Icon className="w-4 h-4" />
                </div>
                {trend && (
                    <div className={cn("flex items-center gap-1 text-[9px] font-black uppercase tracking-widest", trend === 'up' ? "text-emerald-500" : "text-rose-500")}>
                        {trend === 'up' ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
                        {trend === 'up' ? "Growth" : "Loss"}
                    </div>
                )}
            </div>

            <div className="flex flex-col">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] mb-0.5">{label}</span>
                <span className="text-lg font-black text-slate-900 tracking-tight leading-none mb-1">{value}</span>
                <span className="text-[10px] text-slate-500 font-bold">{sub}</span>
            </div>
        </div>
    );
}

function EconomicRow({ label, value, color, isCost }: { label: string, value: number, color: string, isCost?: boolean }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{label}</span>
            <span className={cn("text-xs font-black tracking-tight", color)}>
                {isCost ? "-" : ""}€{(value || 0).toFixed(2)}
            </span>
        </div>
    );
}
