"use client";

import { useEffect, useState } from "react";
import {
    Truck, Package, RotateCcw, AlertTriangle, RefreshCw, Box,
    Gauge, Map, Brain, Target, Sparkles, Loader2, Wand2, Settings2,
    TrendingUp, ArrowUpRight, ArrowDownRight, Download, Share2, Filter,
    Calendar, Circle, DollarSign, AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    getDailyOperationsMatrix,
    getSupplyChainStats,
    triggerLogisticsSync,
    getLogisticsAIAdvice,
    updateDailyFinance,
    updateFulfillmentRule,
    updateGlobalProductCost
} from "../orders/actions";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export default function SupplyChainDashboard() {
    const [stats, setStats] = useState<any>(null);
    const [matrix, setMatrix] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);

    // Date Selection
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    // Editing State
    const [editingCell, setEditingCell] = useState<{ day: number, field: string } | null>(null);

    // AI Agent State
    const [targetROAS, setTargetROAS] = useState(3.0);
    const [aiAdvice, setAiAdvice] = useState<string>("");
    const [loadingAdvice, setLoadingAdvice] = useState(false);

    // Global Config Editing
    const [editingGlobal, setEditingGlobal] = useState<string | null>(null);
    const [globalConfig, setGlobalConfig] = useState<any>({
        avgCogs: 12,
        shipping: 6.5,
        returnFee: 3.5
    });

    const loadData = async () => {
        setLoading(true);
        try {
            const [statsData, matrixData] = await Promise.all([
                getSupplyChainStats(),
                getDailyOperationsMatrix(selectedMonth, selectedYear)
            ]);
            setStats(statsData);
            setMatrix(matrixData);

            if (statsData?.rules?.[0]) {
                setGlobalConfig((prev: any) => ({
                    ...prev,
                    shipping: statsData.rules[0].baseShippingCost,
                    returnFee: statsData.rules[0].returnCost
                }));
            }
        } catch (error) {
            console.error("Error loading dashboard data:", error);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, [selectedMonth, selectedYear]);

    const handleSync = async () => {
        setSyncing(true);
        const toastId = toast.loading("Sincronizando con proveedores...");
        const res = await triggerLogisticsSync();
        if (res.success) {
            toast.success(res.message, { id: toastId });
            loadData();
        } else {
            toast.error("Error: " + res.message, { id: toastId });
        }
        setSyncing(false);
    };

    const handleGetAIAdvice = async () => {
        if (matrix.length === 0) {
            toast.error("No hay datos suficientes para analizar");
            return;
        }
        setLoadingAdvice(true);
        try {
            const advice = await getLogisticsAIAdvice(matrix, targetROAS);
            setAiAdvice(advice);
            toast.success("Análisis completado");
        } catch (e) {
            toast.error("Error en el análisis de IA");
        }
        setLoadingAdvice(false);
    };

    const handleUpdateFinance = async (dateStr: string, field: 'adSpend' | 'visitors', value: number) => {
        const res = await updateDailyFinance(dateStr, { [field]: value });
        if (res.success) {
            setMatrix(prev => prev.map(r => r.date === dateStr ? { ...r, [field]: value } : r));
            loadData(); // To recalculate derived stats
        }
        setEditingCell(null);
    };

    const handleUpdateGlobalCost = async (field: string, value: number) => {
        let success = false;
        if (field === 'cogs') {
            const res = await updateGlobalProductCost(value);
            success = res.success;
        } else if (field === 'shipping' || field === 'return') {
            if (stats?.rules?.[0]?.id) {
                const update = field === 'shipping' ? { baseShippingCost: value } : { returnCost: value };
                const res = await updateFulfillmentRule(stats.rules[0].id, update);
                success = res.success;
            }
        }

        if (success) {
            toast.success("Parámetro actualizado");
            loadData();
        }
        setEditingGlobal(null);
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] bg-slate-50 gap-4">
            <div className="relative">
                <div className="h-16 w-16 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 bg-slate-900 rounded-lg flex items-center justify-center">
                    <Gauge className="h-4 w-4 text-white" />
                </div>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">Sincronizando Engine Operativo v4.0</p>
        </div>
    );

    const s = stats?.summary || { inTransit: 0, delivered: 0, incidences: 0, returns: 0 };
    const monthTotalRevenue = matrix.reduce((acc, curr) => acc + curr.revenueShopify, 0);
    const monthTotalProfit = matrix.reduce((acc, curr) => acc + curr.profitReal, 0);
    const avgDeliveryRate = matrix.length > 0 ? (matrix.reduce((acc, curr) => acc + curr.deliveryRate, 0) / matrix.length) : 0;

    return (
        <div className="space-y-6 animate-in fade-in duration-700 bg-[#F8FAFC] min-h-screen p-4 md:p-6 lg:p-8 text-slate-900 overflow-hidden border-none transition-all">
            {/* SUBTLE BACKGROUND DECORATION */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[120px] -z-10 -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px] -z-10 translate-y-1/2 -translate-x-1/2" />

            {/* HEADER SECTION */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 pb-8">
                <div className="space-y-2">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 bg-slate-900 rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-slate-300">
                            <Map className="h-7 w-7 text-indigo-400" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black tracking-tighter text-slate-900 flex items-center gap-3">
                                LOGISTICS <span className="text-indigo-600">ENGINE</span>
                            </h1>
                            <div className="flex items-center gap-4">
                                <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-full">Sistema Operativo Conectado</Badge>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Actualizado hace 2 min • Live
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center bg-white border border-slate-200 rounded-2xl p-1.5 shadow-sm h-14">
                        <div className="px-4 flex items-center gap-3 border-r border-slate-100">
                            <Calendar className="h-4 w-4 text-slate-400" />
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                className="bg-transparent border-none text-[11px] font-black uppercase tracking-widest outline-none cursor-pointer text-slate-900"
                            >
                                {Array.from({ length: 12 }, (_, i) => (
                                    <option key={i + 1} value={i + 1}>
                                        {new Date(0, i).toLocaleString('es', { month: 'long' })}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            className="bg-transparent border-none text-[11px] font-black uppercase tracking-widest outline-none px-4 cursor-pointer text-slate-900"
                        >
                            {[2024, 2025, 2026].map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>

                    <Button
                        variant="outline"
                        onClick={handleSync}
                        disabled={syncing}
                        className="h-14 px-8 rounded-2xl border-slate-200 bg-white text-slate-700 font-black uppercase text-[11px] tracking-widest shadow-sm hover:bg-slate-50 active:scale-95 transition-all"
                    >
                        <RefreshCw className={cn("w-4 h-4 mr-3 text-indigo-500", syncing && "animate-spin")} />
                        {syncing ? "Sincronizando..." : "Actualizar Live Data"}
                    </Button>

                    <Button
                        onClick={() => window.location.href = '/logistics/costs'}
                        className="h-14 px-8 rounded-2xl bg-indigo-600 border-none text-white font-black uppercase text-[11px] tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all"
                    >
                        <Settings2 className="w-4 h-4 mr-3 text-white" />
                        Panel de Costes
                    </Button>
                </div>
            </div>

            {/* MONTHLY ACCOUNTING SUMMARY (PRIME SECTION) */}
            <div className="space-y-4">
                <div className="flex items-center gap-3 px-2">
                    <DollarSign className="h-5 w-5 text-emerald-600" />
                    <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Resumen Contable • {new Date(selectedYear, selectedMonth - 1).toLocaleString('es', { month: 'long' }).toUpperCase()}</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <MetricCard
                        icon={DollarSign}
                        label="Facturación Mes"
                        value={`€${monthTotalRevenue.toLocaleString()}`}
                        color="emerald"
                    />
                    <MetricCard
                        icon={TrendingUp}
                        label="Beneficio Real Mes"
                        value={`€${monthTotalProfit.toLocaleString()}`}
                        subtext={`${((monthTotalProfit / (monthTotalRevenue || 1)) * 100).toFixed(1)}% Margen Neto`}
                        color="indigo"
                    />
                    <MetricCard
                        icon={Target}
                        label="Gasto en Ads"
                        value={`€${matrix.reduce((acc, curr) => acc + curr.adSpend, 0).toLocaleString()}`}
                        subtext={`${(monthTotalRevenue / (matrix.reduce((acc, curr) => acc + curr.adSpend, 0) || 1)).toFixed(2)}x ROAS Promedio`}
                        color="rose"
                    />
                    <MetricCard
                        icon={Gauge}
                        label="Efectividad Entregas"
                        value={`${avgDeliveryRate.toFixed(1)}%`}
                        subtext={`${s.delivered} Pedidos Pagados`}
                        color="slate"
                    />
                </div>
            </div>

            {/* LOGISTICS STATUS ROW (SECONDARY) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 opacity-80 hover:opacity-100 transition-opacity">
                <MiniStatusCard label="En Tránsito" value={s.inTransit} color="indigo" icon={Truck} />
                <MiniStatusCard label="Incidencias" value={s.incidences} color="rose" icon={AlertTriangle} />
                <MiniStatusCard label="Devoluciones" value={s.returns} color="slate" icon={RotateCcw} />
                <MiniStatusCard label="Porcentaje de Error" value={`${(100 - avgDeliveryRate).toFixed(1)}%`} color="amber" icon={AlertCircle} />
            </div>

            {/* MAIN CONTENT GRID */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                {/* AI AGENT CARD - FLOAT STYLE */}
                <div className="xl:col-span-4 h-full">
                    <Card className="bg-slate-900 border-none rounded-[2.5rem] shadow-2xl shadow-indigo-100 h-full overflow-hidden relative border-none flex flex-col">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <Sparkles className="h-40 w-40 text-indigo-400 rotate-12" />
                        </div>
                        <div className="p-10 space-y-8 flex-1 relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-400/20">
                                    <Brain className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black uppercase tracking-tighter text-white">AI Ops Intelligence</h3>
                                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-1">Sugerencias Estratégicas</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="p-6 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Target ROAS (Goal)</Label>
                                        <Badge className="bg-indigo-500 text-white border-none font-black text-xs px-3">{targetROAS}x</Badge>
                                    </div>
                                    <input
                                        type="range" min="1" max="6" step="0.1"
                                        value={targetROAS}
                                        onChange={(e) => setTargetROAS(parseFloat(e.target.value))}
                                        className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-400"
                                    />
                                    <Button
                                        onClick={handleGetAIAdvice}
                                        disabled={loadingAdvice}
                                        className="w-full h-12 rounded-xl bg-white text-slate-900 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-all shadow-xl"
                                    >
                                        {loadingAdvice ? (
                                            <div className="flex items-center gap-3">
                                                <div className="h-4 w-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                                                <span>Analizando...</span>
                                            </div>
                                        ) : "Ejecutar Diagnóstico AI"}
                                    </Button>
                                </div>

                                <div className="space-y-4 min-h-[250px] max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 pr-2">
                                    {aiAdvice ? (
                                        <div className="text-slate-300 text-[13px] leading-relaxed font-medium whitespace-pre-wrap animate-in slide-in-from-bottom-5 duration-500">
                                            {aiAdvice}
                                        </div>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center py-12 space-y-6 opacity-30">
                                            <Wand2 className="h-16 w-16 text-white stroke-[1.5]" />
                                            <p className="text-[10px] font-black uppercase text-white tracking-[0.3em] text-center px-12 leading-loose">Pulse el botón superior para generar recomendaciones basadas en su ROAS objetivo</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="p-8 bg-black/40 border-t border-white/5">
                            <div className="flex justify-around items-center opacity-60">
                                <div className="text-center">
                                    <span className="text-[8px] block font-black text-slate-500 uppercase">Profit Estim.</span>
                                    <span className="text-xs font-black text-white">€{monthTotalProfit.toLocaleString()}</span>
                                </div>
                                <div className="h-6 w-px bg-white/10" />
                                <div className="text-center">
                                    <span className="text-[8px] block font-black text-slate-500 uppercase">Efficiency</span>
                                    <span className="text-xs font-black text-emerald-400">94.2%</span>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* OPERATIONAL MATRIX TABLE - PREMIUM WHITE STYLE */}
                <div className="xl:col-span-8 h-full">
                    <Card className="bg-white border-none rounded-[2.5rem] shadow-2xl shadow-slate-100 h-full flex flex-col overflow-hidden relative">
                        <CardHeader className="p-8 border-b border-slate-50 space-y-1">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-11 w-11 bg-slate-50 rounded-2xl flex items-center justify-center">
                                        <TrendingUp className="h-5 w-5 text-indigo-600" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-2xl font-black uppercase tracking-tighter text-slate-900">Health Matrix</CardTitle>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Monitoreo Diario de Operaciones</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 bg-slate-50/80 px-4 py-2 rounded-2xl border border-slate-100">
                                    <DetailMetric
                                        label="Avg COGS"
                                        value={`€${globalConfig.avgCogs}`}
                                        onEdit={() => setEditingGlobal('cogs')}
                                        onUpdate={(val: number) => handleUpdateGlobalCost('cogs', val)}
                                        edit={editingGlobal === 'cogs'}
                                    />
                                    <div className="h-6 w-px bg-slate-200" />
                                    <DetailMetric
                                        label="Envío Base"
                                        value={`€${globalConfig.shipping}`}
                                        onEdit={() => setEditingGlobal('shipping')}
                                        onUpdate={(val: number) => handleUpdateGlobalCost('shipping', val)}
                                        edit={editingGlobal === 'shipping'}
                                    />
                                    <div className="h-6 w-px bg-slate-200" />
                                    <DetailMetric label="Entregas" value={`${avgDeliveryRate.toFixed(0)}%`} color="emerald" />
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="p-0 flex-1 overflow-hidden">
                            <div className="overflow-x-auto overflow-y-auto max-h-[600px] scrollbar-thin scrollbar-thumb-slate-200">
                                <table className="w-full text-left border-collapse table-fixed min-w-[1200px]">
                                    <thead className="sticky top-0 z-40 bg-white">
                                        <tr className="bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                                            <th className="p-4 w-20 sticky left-0 bg-white z-50 text-center border-r border-slate-100">Día</th>
                                            <th className="p-4 w-32 text-center">Inbound (Visitas/Conv)</th>
                                            <th className="p-4 w-32 text-center">Ventas (Revenue/AOV)</th>
                                            <th className="p-4 w-32 text-center">Ads (Spend/ROAS)</th>
                                            <th className="p-4 w-32 text-center">CPA (Actual/Meta)</th>
                                            <th className="p-4 w-24 text-center">Logística (Ent %)</th>
                                            <th className="p-4 w-36 text-center bg-indigo-50/30 text-indigo-900">Profit Real</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {matrix.map((row: any) => {
                                            const isCpaOk = row.currentCpa <= row.maxCpa;
                                            const isRoasOk = row.roas >= targetROAS;
                                            const isProfitOk = row.profitReal > 0;

                                            return (
                                                <tr key={row.day} className="hover:bg-slate-50/50 transition-colors group">
                                                    <td className="p-4 sticky left-0 bg-white z-10 border-r border-slate-100 text-center">
                                                        <div className="flex flex-col items-center">
                                                            <span className="text-sm font-black text-slate-900 leading-none">{row.day.toString().padStart(2, '0')}</span>
                                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mt-1">
                                                                {new Date(row.date).toLocaleDateString('es', { month: 'short' }).toUpperCase()}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    <td className="p-4 text-center">
                                                        <div className="flex flex-col items-center gap-1">
                                                            {editingCell?.day === row.day && editingCell?.field === 'visitors' ? (
                                                                <input
                                                                    autoFocus type="number"
                                                                    className="w-full bg-slate-900 text-white border-none text-[11px] p-1 rounded-lg h-7 outline-none font-black text-center"
                                                                    defaultValue={row.visitors}
                                                                    onBlur={(e) => handleUpdateFinance(row.date, 'visitors', parseInt(e.target.value) || 0)}
                                                                />
                                                            ) : (
                                                                <span
                                                                    onClick={() => setEditingCell({ day: row.day, field: 'visitors' })}
                                                                    className="text-[13px] font-black text-slate-700 cursor-pointer hover:text-indigo-600 transition-colors"
                                                                >
                                                                    {row.visitors.toLocaleString()}
                                                                </span>
                                                            )}
                                                            <span className="text-[10px] font-bold text-indigo-400">{row.convRate.toFixed(1)}% Conv.</span>
                                                        </div>
                                                    </td>

                                                    <td className="p-4 text-center">
                                                        <div className="flex flex-col items-center gap-1">
                                                            <span className="text-[13px] font-black text-slate-900">€{row.revenueShopify.toFixed(0)}</span>
                                                            <span className="text-[10px] font-bold text-slate-400">€{row.aov.toFixed(1)} AOV</span>
                                                        </div>
                                                    </td>

                                                    <td className="p-4 text-center">
                                                        <div className="flex flex-col items-center gap-1">
                                                            {editingCell?.day === row.day && editingCell?.field === 'adSpend' ? (
                                                                <input
                                                                    autoFocus type="number"
                                                                    className="w-full bg-slate-900 text-white border-none text-[11px] p-1 rounded-lg h-7 outline-none font-black text-center"
                                                                    defaultValue={row.adSpend}
                                                                    onBlur={(e) => handleUpdateFinance(row.date, 'adSpend', parseFloat(e.target.value) || 0)}
                                                                />
                                                            ) : (
                                                                <span
                                                                    onClick={() => setEditingCell({ day: row.day, field: 'adSpend' })}
                                                                    className="text-[13px] font-black text-rose-600 cursor-pointer hover:bg-rose-50 transition-colors px-2 rounded-lg"
                                                                >
                                                                    €{row.adSpend.toFixed(0)}
                                                                </span>
                                                            )}
                                                            <span className={cn("text-[10px] font-black px-2 py-0.5 rounded-full mt-1", isRoasOk ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600")}>
                                                                {row.roas.toFixed(1)}x ROAS
                                                            </span>
                                                        </div>
                                                    </td>

                                                    <td className="p-4 text-center">
                                                        <div className="flex flex-col items-center gap-1">
                                                            <span className={cn("text-[13px] font-black", isCpaOk ? "text-emerald-600" : "text-rose-600")}>€{row.currentCpa.toFixed(1)}</span>
                                                            <span className="text-[10px] font-bold text-slate-400 border-t border-slate-50 pt-1">Meta €{row.maxCpa.toFixed(1)}</span>
                                                        </div>
                                                    </td>

                                                    <td className="p-4 text-center">
                                                        <div className="flex flex-col items-center justify-center gap-1">
                                                            <div className="relative h-10 w-10">
                                                                <svg className="h-full w-full rotate-[-90deg]">
                                                                    <circle cx="20" cy="20" r="16" fill="transparent" stroke="#F1F5F9" strokeWidth="4" />
                                                                    <circle cx="20" cy="20" r="16" fill="transparent" stroke={row.deliveryRate > 80 ? "#10B981" : "#F59E0B"} strokeWidth="4"
                                                                        strokeDasharray={`${(row.deliveryRate / 100) * 100} 100`} strokeLinecap="round" />
                                                                </svg>
                                                                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[9px] font-black">{row.deliveryRate.toFixed(0)}%</span>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className={cn("p-4 text-center border-l", isProfitOk ? "bg-emerald-50/30 font-black text-emerald-700" : "bg-rose-50/30 font-black text-rose-700")}>
                                                        <div className="flex flex-col items-center gap-1">
                                                            <span className="text-base">€{row.profitReal.toFixed(0)}</span>
                                                            <span className="text-[10px] uppercase tracking-tighter opacity-60">
                                                                {((row.roiReal || 0) * 100).toFixed(0)}% Profitability
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function MetricCard({ icon: Icon, label, value, subtext, color, alert }: any) {
    const iconBg: any = {
        indigo: "bg-white/20",
        emerald: "bg-emerald-50",
        rose: "bg-rose-50",
        slate: "bg-slate-50"
    };

    return (
        <Card className={cn("bg-white border-none rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.02)] overflow-hidden transition-all hover:scale-[1.02] cursor-default", alert && "ring-2 ring-rose-500 ring-offset-2")}>
            <div className="p-8 flex items-center gap-6">
                <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center transition-transform", iconBg[color])}>
                    <Icon className={cn("h-6 w-6")} />
                </div>
                <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</p>
                    <h4 className="text-3xl font-black tracking-tighter text-slate-900 italic">{(value || 0).toLocaleString()}</h4>
                    {subtext && <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{subtext}</p>}
                </div>
            </div>
            {alert && <div className="bg-rose-500 h-1.5 w-full animate-pulse" />}
        </Card>
    );
}

function DetailMetric({ label, value, onEdit, onUpdate, edit, color = "indigo" }: any) {
    return (
        <div
            className={cn("flex flex-col items-center transition-all", onEdit && "cursor-pointer hover:bg-slate-100 px-3 py-1 rounded-xl")}
            onClick={onEdit}
        >
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
            {edit ? (
                <input
                    autoFocus type="number"
                    className="h-6 w-16 bg-slate-900 text-white rounded font-black text-[11px] text-center outline-none"
                    defaultValue={value.toString().replace('€', '')}
                    onBlur={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val)) onUpdate(val);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            const val = parseFloat((e.target as HTMLInputElement).value);
                            if (!isNaN(val)) onUpdate(val);
                        }
                    }}
                />
            ) : (
                <span className={cn("text-[13px] font-black", color === "emerald" ? "text-emerald-600" : "text-slate-900")}>{value}</span>
            )}
        </div>
    );
}

function MiniStatusCard({ label, value, color, icon: Icon }: any) {
    const bg: any = {
        indigo: "bg-indigo-50 text-indigo-700",
        rose: "bg-rose-50 text-rose-700",
        slate: "bg-slate-50 text-slate-700",
        amber: "bg-amber-50 text-amber-700"
    };
    return (
        <div className={cn("flex items-center gap-4 px-6 py-4 rounded-2xl border border-slate-100 bg-white shadow-sm transition-all hover:shadow-md", bg[color])}>
            <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/50 backdrop-blur-sm">
                <Icon className="h-5 w-5" />
            </div>
            <div>
                <span className="text-[9px] font-black uppercase tracking-widest opacity-60 block">{label}</span>
                <span className="text-xl font-black italic">{(value || 0).toLocaleString()}</span>
            </div>
        </div>
    );
}

function fieldFromLabel(label: string) {
    if (label.includes('COGS')) return 'cogs';
    if (label.includes('Base')) return 'shipping';
    return '';
}
