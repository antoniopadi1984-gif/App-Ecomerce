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
} from "../pedidos/actions";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { PageShell } from "@/components/ui/PageShell";
import { ModuleHeader } from "@/components/ui/ModuleHeader";

import { useStore } from "@/lib/store/store-context";

export default function SupplyChainDashboard() {
    const { activeStoreId } = useStore();
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
                getSupplyChainStats(activeStoreId!),
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
        if (activeStoreId) {
            loadData();
        }
    }, [selectedMonth, selectedYear, activeStoreId]);

    const handleSync = async () => {
        if (!activeStoreId) return;
        setSyncing(true);
        const toastId = toast.loading("Sincronizando con proveedores...");
        const res = await triggerLogisticsSync(activeStoreId);
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
        if (!activeStoreId) return;
        const res = await updateDailyFinance(activeStoreId, dateStr, { [field]: value });
        if (res.success) {
            setMatrix(prev => prev.map(r => r.date === dateStr ? { ...r, [field]: value } : r));
            loadData(); // To recalculate derived stats
        }
        setEditingCell(null);
    };

    const handleUpdateGlobalCost = async (field: string, value: number) => {
        let success = false;
        if (field === 'cogs' && activeStoreId) {
            const res = await updateGlobalProductCost(activeStoreId, value);
            success = res.success;
        } else if (field === 'shipping' || field === 'return') {
            if (stats?.rules?.[0]?.id && activeStoreId) {
                const update = field === 'shipping' ? { baseShippingCost: value } : { returnCost: value };
                const res = await updateFulfillmentRule(activeStoreId, stats.rules[0].id, update);
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
        <PageShell>
            <div className="flex flex-col items-center justify-center min-h-[80vh] bg-slate-50 gap-4">
                <div className="relative">
                    <div className="h-16 w-16 border-4 border-slate-200 border-t-rose-600 rounded-full animate-spin" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 bg-slate-900 rounded-lg flex items-center justify-center">
                        <Gauge className="h-4 w-4 text-white" />
                    </div>
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">Sincronizando Engine Operativo v4.0</p>
            </div>
        </PageShell>
    );

    const s = stats?.summary || { inTransit: 0, delivered: 0, incidences: 0, returns: 0 };
    const monthTotalRevenue = matrix.reduce((acc, curr) => acc + curr.revenueShopify, 0);
    const monthTotalProfit = matrix.reduce((acc, curr) => acc + curr.profitReal, 0);
    const avgDeliveryRate = matrix.length > 0 ? (matrix.reduce((acc, curr) => acc + curr.deliveryRate, 0) / matrix.length) : 0;

    return (
        <PageShell>
            <ModuleHeader
                title="Logistics Engine"
                subtitle="Operational Intelligence Cluster v4.5"
                icon={Map}
                actions={
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 h-7">
                            <div className="px-2 flex items-center gap-1.5 border-r border-slate-100">
                                <Calendar className="h-2.5 w-2.5 text-slate-400" />
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                    className="bg-transparent border-none text-[7.5px] font-black uppercase tracking-widest outline-none cursor-pointer text-slate-900"
                                >
                                    {Array.from({ length: 12 }, (_, i) => (
                                        <option key={i + 1} value={i + 1}>
                                            {new Date(0, i).toLocaleString('es', { month: 'short' }).toUpperCase()}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                className="bg-transparent border-none text-[7.5px] font-black uppercase tracking-widest outline-none px-2 cursor-pointer text-slate-900"
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
                            className="h-7 px-3 rounded-lg border-slate-200 bg-white text-slate-700 font-black uppercase text-[8px] tracking-widest shadow-xs hover:bg-slate-50 transition-all"
                        >
                            <RefreshCw className={cn("w-3 h-3 mr-2 text-rose-500", syncing && "animate-spin")} />
                            SYNC CORE
                        </Button>

                        <Button
                            onClick={() => window.location.href = '/logistics/costs'}
                            className="h-7 px-3 rounded-lg bg-slate-900 border-none text-white font-black uppercase text-[8px] tracking-widest shadow-sm hover:bg-black transition-all"
                        >
                            <Settings2 className="w-3 h-3 mr-2 text-rose-400" />
                            SETTINGS
                        </Button>
                    </div>
                }
            />

            <div className="space-y-4 animate-in fade-in duration-1000 p-1 md:p-3 text-slate-900 relative">
                {/* AMBIENT DECORATION */}
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-rose-500/10 rounded-full blur-[160px] -z-10 -translate-y-1/2 translate-x-1/2 animate-pulse" />
                <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[140px] -z-10 -translate-x-1/2" />

                {/* MONTHLY ACCOUNTING SUMMARY (PRIME SECTION) */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2 px-1">
                        <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                        <h2 className="text-[8px] font-black uppercase tracking-widest text-slate-500">RESUMEN CONTABLE • {new Date(selectedYear, selectedMonth - 1).toLocaleString('es', { month: 'short' }).toUpperCase()}</h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <MetricCard icon={DollarSign} label="Facturación" value={`€${monthTotalRevenue.toLocaleString()}`} color="emerald" />
                        <MetricCard icon={TrendingUp} label="Beneficio Real" value={`€${monthTotalProfit.toLocaleString()}`} subtext={`${((monthTotalProfit / (monthTotalRevenue || 1)) * 100).toFixed(1)}% margen`} color="rose" />
                        <MetricCard icon={Target} label="Gasto en Ads" value={`€${matrix.reduce((acc, curr) => acc + curr.adSpend, 0).toLocaleString()}`} subtext={`${(monthTotalRevenue / (matrix.reduce((acc, curr) => acc + curr.adSpend, 0) || 1)).toFixed(2)}x ROAS`} color="rose" />
                        <MetricCard icon={Gauge} label="Entregas" value={`${avgDeliveryRate.toFixed(1)}%`} subtext={`${s.delivered} pagados`} color="slate" />
                    </div>
                </div>

                {/* LOGISTICS STATUS ROW - DENSE */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-2">
                    <MiniStatusCard label="Tránsito" value={s.inTransit} color="rose" icon={Truck} trend="+4" />
                    <MiniStatusCard label="Errores" value={s.incidences} color="rose" icon={AlertTriangle} trend="-2" />
                    <MiniStatusCard label="Devol." value={s.returns} color="slate" icon={RotateCcw} trend="0" />
                    <MiniStatusCard label="% Fallo" value={`${(100 - avgDeliveryRate).toFixed(0)}%`} color="amber" icon={AlertCircle} trend="-1.2%" />
                </div>

                {/* MAIN OPERATIONAL DECK */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
                    {/* AI DIAGNOSTIC CONSOLE - THE "BRAIN" */}
                    <div className="xl:col-span-3">
                        <Card className="bg-slate-950 border-none rounded-lg shadow-sm h-[580px] overflow-hidden relative flex flex-col group">
                            {/* THE SCANNING EFFECT */}
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.15),transparent)] pointer-events-none" />
                            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-rose-500/40 to-transparent animate-scan" style={{ animation: 'scan 4s linear infinite' }} />

                            <div className="p-4 space-y-4 flex-1 relative z-10">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div className="h-9 w-9 bg-rose-600 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.4)]">
                                            <Brain className="h-4 w-4 text-white animate-pulse" />
                                        </div>
                                        <div className="space-y-0.5">
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white italic">Neural Engine</h3>
                                            <p className="text-[6px] font-black text-rose-400 uppercase tracking-widest">v4.5 Enterprise</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[6px] font-black text-emerald-400 uppercase">Sync</span>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-2">
                                    <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-3 shadow-sm">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-[7.5px] font-black uppercase text-slate-400 tracking-widest leading-none">Target ROAS</Label>
                                            <span className="text-[12px] font-black text-rose-400 italic">x{targetROAS.toFixed(1)}</span>
                                        </div>
                                        <input
                                            type="range" min="1" max="6" step="0.1"
                                            value={targetROAS}
                                            onChange={(e) => setTargetROAS(parseFloat(e.target.value))}
                                            className="w-full h-1.5 bg-white/10 rounded-full appearance-none accent-rose-500 cursor-pointer"
                                        />
                                        <Button
                                            onClick={handleGetAIAdvice}
                                            disabled={loadingAdvice}
                                            className="w-full h-8 rounded-md bg-rose-600 hover:bg-rose-500 text-white font-black uppercase text-[8px] tracking-[0.2em] shadow-sm border-none transition-all active:scale-95"
                                        >
                                            {loadingAdvice ? (
                                                <div className="flex items-center gap-2">
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                    <span>Sincronizando...</span>
                                                </div>
                                            ) : "Analyze Matrix"}
                                        </Button>
                                    </div>

                                    <ScrollArea className="h-[280px] pr-2">
                                        {aiAdvice ? (
                                            <div className="text-slate-300 text-[10px] leading-relaxed font-black uppercase tracking-tight whitespace-pre-wrap animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-2">
                                                {aiAdvice.split('\n').map((line, i) => (
                                                    <div key={i} className={cn("p-2 rounded-lg", line.includes('⚠️') ? "bg-rose-500/10 border border-rose-500/20 text-rose-200" : "bg-white/5 border border-white/5")}>
                                                        {line}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="h-[280px] flex flex-col items-center justify-center space-y-4 opacity-20 border-2 border-dashed border-white/10 rounded-2xl mx-2">
                                                <div className="relative">
                                                    <Target className="h-10 w-10 text-white" />
                                                    <Sparkles className="h-4 w-4 text-rose-400 absolute -top-1 -right-1 animate-bounce" />
                                                </div>
                                                <p className="text-[7px] font-black uppercase text-white tracking-[0.3em] text-center max-w-[120px] leading-tight">Awaiting Neural Link</p>
                                            </div>
                                        )}
                                    </ScrollArea>
                                </div>
                            </div>

                            <div className="p-4 bg-black/60 border-t border-white/10">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Monthly Projection</span>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-sm font-black text-white italic">€{monthTotalProfit.toLocaleString()}</span>
                                            <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                                        </div>
                                    </div>
                                    <div className="space-y-1 text-right">
                                        <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Health Index</span>
                                        <div className="flex items-baseline gap-1 justify-end">
                                            <span className="text-sm font-black text-emerald-400 italic">{(avgDeliveryRate * 0.98).toFixed(1)}%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* OPERATIONAL MATRIX TABLE - PREMIUM WHITE STYLE */}
                    <div className="xl:col-span-9 h-full">
                        <Card className="bg-white border border-slate-100 shadow-xs rounded-lg h-full flex flex-col overflow-hidden relative">
                            <CardHeader className="p-3 border-b border-slate-50 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="h-7 w-7 bg-slate-50 rounded-lg flex items-center justify-center">
                                        <TrendingUp className="h-3.5 w-3.5 text-rose-600" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-[9px] font-black uppercase tracking-tight text-slate-900 italic">Health Matrix</CardTitle>
                                        <p className="text-[6px] font-black text-slate-400 uppercase tracking-widest leading-none">Live Monitoring Flow</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 bg-slate-100 px-3 py-1.5 rounded-xl shadow-sm group">
                                    <DetailMetric label="COGS" value={`€${globalConfig.avgCogs}`} edit={editingGlobal === 'cogs'} onEdit={() => setEditingGlobal('cogs')} onUpdate={(val: number) => handleUpdateGlobalCost('cogs', val)} />
                                    <div className="h-4 w-px bg-slate-200" />
                                    <DetailMetric label="ENVÍO" value={`€${globalConfig.shipping}`} edit={editingGlobal === 'shipping'} onEdit={() => setEditingGlobal('shipping')} onUpdate={(val: number) => handleUpdateGlobalCost('shipping', val)} />
                                </div>
                            </CardHeader>

                            <CardContent className="p-0 flex-1 overflow-hidden">
                                <div className="overflow-x-auto overflow-y-auto max-h-[600px] scrollbar-thin scrollbar-thumb-slate-200">
                                    <table className="w-full text-left border-collapse table-fixed min-w-[1200px]">
                                        <thead>
                                            <tr className="bg-slate-900/95 text-[7px] font-black uppercase tracking-[0.2em] text-white/50 border-b border-rose-500/10">
                                                <th className="p-2.5 w-14 sticky left-0 bg-slate-900 z-50 text-center border-r border-white/5">DATE</th>
                                                <th className="p-2.5 w-24 text-center">TRAFFIC</th>
                                                <th className="p-2.5 w-24 text-center">REVENUE</th>
                                                <th className="p-2.5 w-24 text-center">ADS DEP.</th>
                                                <th className="p-2.5 w-24 text-center">EFFICIENCY</th>
                                                <th className="p-2.5 w-16 text-center">LOGS (%)</th>
                                                <th className="p-2.5 w-32 text-center bg-rose-600/90 text-white italic">REAL PROFIT</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {matrix.map((row: any) => {
                                                const isCpaOk = row.currentCpa <= row.maxCpa;
                                                const isRoasOk = row.roas >= targetROAS;
                                                const isProfitOk = row.profitReal > 0;

                                                return (
                                                    <tr key={row.day} className="hover:bg-slate-50/50 transition-colors group">
                                                        <td className="p-2 sticky left-0 bg-white z-10 border-r border-slate-100 text-center">
                                                            <div className="flex flex-col items-center">
                                                                <span className="text-xs font-black text-slate-900 leading-none">{row.day}</span>
                                                                <span className="text-[6px] font-black text-slate-400 uppercase mt-0.5">{new Date(row.date).toLocaleDateString('es', { month: 'short' }).toUpperCase()}</span>
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
                                                                        className="text-[13px] font-black text-slate-700 cursor-pointer hover:text-rose-600 transition-colors"
                                                                    >
                                                                        {row.visitors.toLocaleString()}
                                                                    </span>
                                                                )}
                                                                <span className="text-[10px] font-bold text-rose-400">{row.convRate.toFixed(1)}% Conv.</span>
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
                                                                        <circle cx="20" cy="20" r="16" fill="transparent" stroke="var(--slate-100)" strokeWidth="4" />
                                                                        <circle cx="20" cy="20" r="16" fill="transparent" stroke={row.deliveryRate > 80 ? "var(--alert-ok)" : "var(--alert-warning)"} strokeWidth="4"
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
        </PageShell>
    );
}

function MetricCard({ icon: Icon, label, value, subtext, color, alert }: any) {
    const iconBg: any = {
        rose: "bg-rose-50",
        emerald: "bg-emerald-50",
        rose: "bg-rose-50",
        slate: "bg-slate-50"
    };

    return (
        <Card className={cn("bg-white border border-slate-100/60 rounded-lg shadow-xs overflow-hidden transition-all hover:scale-[1.01] cursor-default", alert && "ring-1 ring-rose-500/30")}>
            <div className="p-2 px-3 flex items-center gap-3">
                <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", iconBg[color])}>
                    <Icon className={cn("h-4 w-4", `text-${color}-600`)} />
                </div>
                <div className="space-y-0 text-left">
                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
                    <h4 className="text-sm font-black tracking-tighter text-slate-900 italic leading-none">{value}</h4>
                    {subtext && <p className="text-[6px] font-black text-slate-500 uppercase tracking-tight mt-0.5 leading-none">{subtext}</p>}
                </div>
            </div>
            {alert && <div className="bg-rose-500 h-0.5 w-full animate-pulse" />}
        </Card>
    );
}

function DetailMetric({ label, value, onEdit, onUpdate, edit, color = "rose" }: any) {
    return (
        <div
            className={cn("flex flex-col items-center transition-all", onEdit && "cursor-pointer hover:bg-slate-100 px-3 py-1 rounded-lg")}
            onClick={onEdit}
        >
            <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
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

function MiniStatusCard({ label, value, color, icon: Icon, trend }: any) {
    const bg: any = {
        rose: "bg-rose-50/50 text-rose-700",
        rose: "bg-rose-50/50 text-rose-700",
        slate: "bg-slate-50/50 text-slate-700",
        amber: "bg-amber-50/50 text-amber-700"
    };
    return (
        <div className={cn("flex items-center justify-between px-3 py-2 rounded-lg border border-slate-100 bg-white shadow-xs transition-all hover:shadow-sm", bg[color])}>
            <div className="flex items-center gap-2">
                <div className="h-6 w-6 flex items-center justify-center rounded-md bg-white/80 shrink-0 shadow-sm">
                    <Icon className="h-3 w-3" />
                </div>
                <div className="text-left overflow-hidden">
                    <span className="text-[6.5px] font-black uppercase tracking-widest opacity-60 block leading-none mb-0.5">{label}</span>
                    <span className="text-[11px] font-black italic block leading-none">{(value || 0).toLocaleString()}</span>
                </div>
            </div>
            {trend && (
                <div className={cn(
                    "text-[7px] font-black px-1.5 py-0.5 rounded-sm bg-white/50",
                    trend.includes('+') ? "text-emerald-500" : trend.includes('-') ? "text-rose-500" : "text-slate-400"
                )}>
                    {trend}
                </div>
            )}
        </div>
    );
}

function fieldFromLabel(label: string) {
    if (label.includes('COGS')) return 'cogs';
    if (label.includes('Base')) return 'shipping';
    return '';
}
