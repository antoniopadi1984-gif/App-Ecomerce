"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAutoRefresh } from "@/lib/hooks/useAutoRefresh";
import {
    RefreshCw, Globe, Zap, Percent,
    Wallet, Receipt, Calculator,
    ChevronLeft, ChevronRight, Download,
    AlertCircle, CheckCircle2, MoreHorizontal,
    Target, Eye, MousePointer2, Tag,
    Truck, RotateCcw, ShieldCheck, History,
    BarChart3, ArrowDownRight, ArrowUpRight, DollarSign,
    TrendingUp as TrendingUpIcon, TrendingDown as TrendingDownIcon
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableAlert } from "@/components/ui/table-alert";
import { useStore } from "@/lib/store/store-context";
import { getAlertRules } from "@/app/settings/alerts/actions";
import { evaluateAlerts, AlertRule } from "@/lib/alerts";
import { format, addMonths, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { triggerHistoricalSync, getActiveThreshold, saveMonthlyGoal, rebuildAccounting } from "./actions";

import { repairMonthOrderItems } from "../logistics/orders/actions";
import { FinanceAgentChat } from "@/components/finance-agent-chat";
import { AlertConfigPanel, getAlertLevel, AlertThresholds } from "@/components/alert-config-panel";
import { BellRing } from "lucide-react";
import { useProduct } from "@/context/ProductContext";

export default function AccountingDashboard() {
    const { activeStoreId: storeId } = useStore();
    const { productId } = useProduct();
    const [alertRules, setAlertRules] = useState<AlertRule[]>([]);

    useEffect(() => {
        if (storeId) {
            getAlertRules(storeId).then(rules => setAlertRules(rules as AlertRule[]));
        }
    }, [storeId]);

    const [date, setDate] = useState(new Date());
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [alertConfigOpen, setAlertConfigOpen] = useState(false);
    const [alertThresholds, setAlertThresholds] = useState<AlertThresholds | null>(null);
    const [activeSubTab, setActiveSubTab] = useState<'ventas' | 'operaciones' | 'finanzas'>('ventas');
    const syncedMonthsRef = useRef<Set<string>>(new Set());

    const [projections, setProjections] = useState({
        adSpendBudget: 0,
        targetRoas: 0,
        breakevenRoas: 0,
        maxCpa: 0,
        maxCpc: 0,
        expectedConvRate: 0,
        expectedAvgTicket: 0
    });

    const loadData = useCallback(async () => {
        if (!storeId) return;
        if (!data) setLoading(true);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        try {
            const month = date.getMonth() + 1;
            const year = date.getFullYear();
            let url = `/api/finances/accounting?storeId=${storeId}&month=${month}&year=${year}`;
            if (productId) url += `&productId=${productId}`;

            const [accRes, alertRes] = await Promise.all([
                fetch(url, { signal: controller.signal }).then(r => r.json()),
                fetch(`/api/settings/alert-thresholds?storeId=${storeId}`).then(r => r.json()).catch(() => ({}))
            ]);

            clearTimeout(timeoutId);
            if (accRes && accRes.days) setData(accRes);
            if (alertRes && alertRes.thresholds) setAlertThresholds(alertRes.thresholds);

            if (accRes && accRes.goal) {
                setProjections({
                    adSpendBudget: accRes.goal.adSpendBudget || 0,
                    targetRoas: accRes.goal.targetRoas || 0,
                    breakevenRoas: accRes.goal.breakevenRoas || 0,
                    maxCpa: accRes.goal.maxCpa || 0,
                    maxCpc: accRes.goal.maxCpc || 0,
                    expectedConvRate: accRes.goal.expectedConvRate || 0,
                    expectedAvgTicket: accRes.goal.expectedAvgTicket || 0
                });
            }
        } catch (error: any) {
            console.error(error);
            if (!data) setData({ totals: {}, averages: {}, expenses: [], days: [], goal: projections });
        } finally {
            setLoading(false);
        }
    }, [date, storeId, productId, data, projections]);

    useEffect(() => { loadData(); }, [loadData]);
    useAutoRefresh(loadData, { interval: 60000, enabled: !productId, pauseOnHidden: true });

    const handleSync = async () => {
        if (!storeId || syncing) return;
        setSyncing(true);
        toast.info("Sincronizando datos...");
        try {
            await fetch(`/api/finances/sync-today?storeId=${storeId}`);
            await loadData();
            toast.success("Actualizado");
        } catch (e) { toast.error("Error"); }
        finally { setSyncing(false); }
    };

    const handleExport = (mode: 'manager' | 'analysis') => {
        if (!storeId) return;
        window.open(`/api/finances/export?storeId=${storeId}&month=${date.getMonth() + 1}&year=${date.getFullYear()}&mode=${mode}`, "_blank");
    };

    const handleSaveProjections = async () => {
        if (!storeId) return;
        setSaving(true);
        try {
            await saveMonthlyGoal(storeId, date.getMonth() + 1, date.getFullYear(), projections);
            toast.success("Proyecciones guardadas");
            await loadData();
        } catch (e) { toast.error("Error"); }
        finally { setSaving(false); }
    };

    if (loading && !data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Calculator className="h-10 w-10 text-indigo-600 animate-bounce" />
                <p className="text-[10px] font-black uppercase tracking-widest mt-4">Sincronizando...</p>
            </div>
        );
    }

    const t = data?.totals || { revenueReal: 0, netProfit: 0, spendAds: 0, costsReal: 0, orders: 0, delivered: 0, cogs: 0 };
    const avg = { roasReal: 0, profitPercent: 0, deliveryRate: 0, ...(data?.averages || {}) };
    const insights = data?.insights || [];

    return (
        <div className="min-h-screen bg-[#FDFDFF] p-0 text-slate-900 font-sans selection:bg-indigo-100 overflow-x-visible">
            <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 h-14 flex items-center px-6 shadow-none">
                <div className="flex items-center gap-6 whitespace-nowrap">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Beneficio Neto</span>
                        <span className="text-xs font-bold text-[#2563EB]">€{(t.netProfit || 0).toLocaleString('es-ES')}</span>
                    </div>
                </div>
            </div>

            <div className="mt-14 max-w-full mx-auto px-0">
                <div className="flex items-center justify-between gap-4 py-3 bg-white border-b border-slate-200 px-6 sticky top-14 z-40 h-14">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 bg-slate-900 rounded-lg flex items-center justify-center"><Receipt className="h-5 w-5 text-white" /></div>
                        <div>
                            <h1 className="text-sm font-bold text-slate-950 uppercase leading-none">Finance OS</h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <Button onClick={handleSync} disabled={syncing} variant="outline" className="h-9 rounded-xl font-black uppercase text-[8px] tracking-widest transition-all active:scale-95">
                            <RefreshCw className={cn("h-3.5 w-3.5 mr-2", syncing && "animate-spin")} />
                            Sync
                        </Button>
                        <Button onClick={() => handleExport('manager')} variant="outline" className="h-9 rounded-xl font-black uppercase text-[8px] tracking-widest transition-all active:scale-95">
                            <Download className="h-3.5 w-3.5 mr-2" />
                            Export
                        </Button>
                        <Button onClick={() => setAlertConfigOpen(true)} variant="outline" className="h-9 rounded-xl font-black uppercase text-[8px] tracking-widest transition-all active:scale-95">
                            <BellRing className="h-3.5 w-3.5 mr-2" />
                            ALERTAS
                        </Button>
                    </div>
                </div>

                <div className="max-w-[1680px] mx-auto px-4 py-3">
                    <Tabs defaultValue="ledger" className="space-y-4">
                        <TabsList className="bg-transparent border-b border-slate-200 gap-8 h-10 w-full justify-start">
                            <TabsTrigger value="ledger" className="rounded-none px-2 h-full font-medium text-sm data-[state=active]:border-b-2 data-[state=active]:border-blue-600 transition-all">TABLA DIARIA</TabsTrigger>
                        </TabsList>

                        <TabsContent value="ledger" className="space-y-3 pt-2">
                            <div className="grid grid-cols-12 gap-3">
                                <div className="col-span-12 space-y-3">
                                    <div className="flex items-center gap-2 p-1 bg-slate-100/50 rounded-lg w-fit border border-slate-200/50">
                                        {['ventas', 'operaciones', 'finanzas'].map(tab => (
                                            <Button
                                                key={tab}
                                                variant={activeSubTab === tab ? 'default' : 'ghost'}
                                                size="sm"
                                                onClick={() => setActiveSubTab(tab as any)}
                                                className={cn("h-7 px-4 text-[9px] font-bold uppercase tracking-widest rounded-md transition-all", activeSubTab === tab ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-white")}
                                            >
                                                {tab}
                                            </Button>
                                        ))}
                                    </div>

                                    <Card className="bg-white border border-slate-200 shadow-none rounded-lg overflow-hidden">
                                        <CardContent className="p-0">
                                            <div className="relative max-h-[75vh] overflow-auto">
                                                <Table className="w-full border-separate border-spacing-0 text-center text-[11px]">
                                                    <TableHeader className="bg-white sticky top-0 z-40 border-b font-black uppercase tracking-widest">
                                                        <TableRow>
                                                            <TableHead className="sticky left-0 bg-white shadow-sm">DÍA</TableHead>
                                                            <TableHead>Facturación</TableHead>
                                                            <TableHead>Profit</TableHead>
                                                            <TableHead>ROAS</TableHead>
                                                            <TableHead className="sticky right-0 bg-white shadow-sm border-l">Estado</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {data?.days?.map((day: any, i: number) => (
                                                            <TableRow key={i} className="group hover:bg-slate-50 transition-colors">
                                                                <TableCell className="sticky left-0 bg-white font-black py-1.5 shadow-sm border-r border-slate-100 italic">
                                                                    <div className="flex flex-col">
                                                                        <span className="text-sm tracking-tighter">{format(new Date(day.date), 'dd')}</span>
                                                                        <span className="text-[6px] text-slate-400 uppercase">{format(new Date(day.date), 'EEE', { locale: es })}</span>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="font-bold">€{(day.revenueReal || 0).toLocaleString('es-ES')}</TableCell>
                                                                <TableCell className="font-bold text-[#2563EB]">€{(day.netProfit || 0).toLocaleString('es-ES')}</TableCell>
                                                                <TableCell className="font-bold italic">{(day.roasReal || 0).toFixed(2)}x</TableCell>
                                                                <TableCell className="sticky right-0 bg-white border-l shadow-sm">
                                                                    <StatusIndicator status={day.status} incomplete={!day.isComplete} />
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <div className="grid grid-cols-12 gap-3 mt-4">
                                        <div className="col-span-12 lg:col-span-4 space-y-3">
                                            <div className="bg-slate-900/95 backdrop-blur-xl p-4 rounded-xl text-white border border-white/10 shadow-xl overflow-hidden group">
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -z-10 group-hover:bg-indigo-500/20 transition-all duration-700" />
                                                <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2 mb-4 leading-none">
                                                    <Globe className="h-3 w-3 text-indigo-400 animate-pulse" />
                                                    CLOWDBOT AI <span className="text-slate-600">v2.1</span>
                                                </h3>
                                                <div className="space-y-2 max-h-[300px] overflow-auto pr-2 scrollbar-thin scrollbar-thumb-white/10">
                                                    {insights.length === 0 ? (
                                                        <div className="p-8 border border-dashed border-white/5 rounded-xl text-center opacity-30 flex flex-col items-center">
                                                            <Calculator className="h-6 w-6 mb-2" />
                                                            <span className="text-[8px] font-black uppercase tracking-widest">Neural Link Syncing...</span>
                                                        </div>
                                                    ) : insights.map((insight: any, i: number) => (
                                                        <div key={i} className="p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                                                            <p className="text-[9px] font-black uppercase text-slate-100 tracking-tight">{insight.title}</p>
                                                            <p className="text-[9px] opacity-60 mt-1 leading-relaxed">{insight.description}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-span-12 lg:col-span-8 grid grid-cols-2 gap-3">
                                            <SummaryCard title="VENTAS REALES" value={t.revenueReal} sub="CONSOLIDADO MENSUAL" icon={Globe} color="indigo" gradient="from-indigo-600 to-indigo-700" />
                                            <SummaryCard title="BENEFICIO NETO" value={t.netProfit} sub={`${avg.profitPercent.toFixed(1)}% MARGEN NETO`} icon={Wallet} color="slate" gradient="from-slate-600 to-slate-800" />
                                            <SummaryCard title="INVERSIÓN ADS" value={t.spendAds} sub={`${avg.roasReal.toFixed(2)}x ROAS REAL`} icon={Zap} color="slate" gradient="from-slate-500 to-slate-700" />
                                            <SummaryCard title="OPERACIONES" value={`${t.delivered} / ${t.orders}`} sub="ENTREGADOS TOTALES" icon={CheckCircle2} color="slate" isRaw gradient="from-slate-700 to-slate-900" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>

                    <FinanceAgentChat monthlyData={data ? { totals: t, averages: avg } : undefined} className="bottom-20 right-4 scale-90 origin-bottom-right" />
                    <AlertConfigPanel storeId={storeId || ""} isOpen={alertConfigOpen} onClose={() => setAlertConfigOpen(false)} onSave={(newThresholds) => { setAlertThresholds(newThresholds); loadData(); }} />
                </div>
            </div>
        </div>
    );
}

function SummaryCard({ title, value, sub, icon: Icon, color, isRaw = false, gradient }: any) {
    const iconColors: any = { indigo: "text-indigo-600", slate: "text-slate-600" };
    return (
        <Card className="bg-white border border-slate-100 rounded-lg shadow-sm hover:shadow-md transition-all duration-500 overflow-hidden group relative">
            <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-[0.03] transition-opacity duration-700", gradient)} />
            <CardContent className="p-4 relative z-10 flex flex-col gap-3">
                <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center bg-slate-50 group-hover:scale-110 transition-transform duration-500 shadow-sm", iconColors[color])}>
                    <Icon className="h-4 w-4" />
                </div>
                <div className="space-y-0.5">
                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5 leading-none">{title}</p>
                    <p className="text-xl font-black tracking-tighter italic text-slate-900 leading-none">
                        {isRaw ? value : new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value)}
                    </p>
                    {sub && <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest italic opacity-70 group-hover:opacity-100 transition-opacity leading-none mt-1">{sub}</p>}
                </div>
            </CardContent>
        </Card>
    );
}

function StatusIndicator({ status, incomplete, large = false }: { status: string, incomplete?: boolean, large?: boolean }) {
    const colors: any = { GREEN: "bg-slate-950", YELLOW: "bg-amber-500", RED: "bg-rose-500", INCOMPLETE: "bg-slate-200", NEUTRAL: "bg-slate-100" };
    return (
        <div className="flex items-center justify-center">
            {incomplete ? (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger><AlertCircle className="h-4 w-4 text-slate-300 animate-pulse" /></TooltipTrigger>
                        <TooltipContent className="bg-slate-900 border-none text-[8px] font-black uppercase tracking-widest">Datos incompletos detectados</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            ) : (
                <div className={cn("rounded-full animate-pulse shadow-sm shadow-black/5", colors[status] || colors.NEUTRAL, large ? "h-6 w-6" : "h-3 w-3")} />
            )}
        </div>
    );
}
