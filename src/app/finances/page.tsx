"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAutoRefresh } from "@/lib/hooks/useAutoRefresh";
import {
    RefreshCw, Globe, Zap,
    Wallet, Receipt, Calculator,
    ChevronLeft, ChevronRight, Download,
    AlertCircle, CheckCircle2, MoreHorizontal,
    Target, Eye, MousePointer2, Tag,
    Truck, RotateCcw, ShieldCheck, History,
    BarChart3, ArrowDownRight, ArrowUpRight, DollarSign,
    Brain, Filter, Info, Circle, BellRing, AlertTriangle, Link2
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
import { useStore } from "@/lib/store/store-context";
import { getAlertRules } from "@/app/settings/alerts/actions";
import { AlertRule } from "@/lib/alerts";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { triggerHistoricalSync, saveMonthlyGoal } from "./actions";
import { FinanceAgentChat } from "@/components/finance-agent-chat";
import { AlertConfigPanel, AlertThresholds } from "@/components/alert-config-panel";
import { useProduct } from "@/context/ProductContext";
import { useProductFinancials } from "@/hooks/useProductFinancials";
import { PageShell } from "@/components/ui/PageShell";
import { ModuleHeader } from "@/components/ui/ModuleHeader";
import { ProductFinancialsDashboard } from "@/components/finances/ProductFinancialsDashboard";
import Link from "next/link";

export default function AccountingDashboard() {
    const { activeStoreId: storeId } = useStore();
    const { productId } = useProduct();
    const { financialData: productFinancials, loading: productFinancialsLoading } = useProductFinancials(productId as string);
    const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
    const [date, setDate] = useState(new Date());
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [alertConfigOpen, setAlertConfigOpen] = useState(false);
    const [alertThresholds, setAlertThresholds] = useState<AlertThresholds | null>(null);
    const [isConnected, setIsConnected] = useState<boolean | null>(null);

    useEffect(() => {
        if (storeId) {
            fetch(`/api/connections/status?storeId=${storeId}&service=SHOPIFY`)
                .then(res => res.json())
                .then(data => setIsConnected(data.isConnected));
        }
    }, [storeId]);

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

    useEffect(() => {
        if (storeId) {
            getAlertRules(storeId).then(rules => setAlertRules(rules as AlertRule[]));
        }
    }, [storeId]);

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

    if (isConnected === false) {
        return (
            <PageShell>
                <ModuleHeader title="Profit & Ledger" subtitle="Contabilidad Automatizada" icon={Wallet} />
                <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6 mt-6">
                    <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center">
                        <AlertCircle className="w-10 h-10 text-rose-500" />
                    </div>
                    <div className="space-y-2 text-center">
                        <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase italic">Shopify No Conectado</h2>
                        <p className="text-slate-500 max-w-sm mx-auto font-medium text-sm">Se requiere la integración base de la tienda para generar estados financieros.</p>
                    </div>
                    <Link href="/connections">
                        <Button className="bg-rose-500 hover:bg-black text-white font-black text-[10px] uppercase tracking-widest h-10 px-6 rounded-xl shadow-lg shadow-rose-500/20">
                            <Link2 className="w-4 h-4 mr-2" />
                            Vincular Tienda
                        </Button>
                    </Link>
                </div>
            </PageShell>
        );
    }

    const t = data?.totals || { revenueReal: 0, netProfit: 0, spendAds: 0, costsReal: 0, orders: 0, delivered: 0, cogs: 0 };
    const avg = { roasReal: 0, profitPercent: 0, deliveryRate: 0, ...(data?.averages || {}) };
    const days = data?.days || [];

    return (
        <PageShell loading={loading && !data} loadingMessage="SINCRONIZANDO FINANZAS...">
            <div className="space-y-4 pb-20 mt-4">
                <ModuleHeader
                    title="Profit & Ledger"
                    subtitle={`${format(date, 'MMMM yyyy', { locale: es })} • ${productId === 'GLOBAL' ? 'Tienda Global' : 'Producto Individual'}`}
                    icon={Wallet}
                    actions={
                        <>
                            <Button variant="outline" size="sm" onClick={() => setAlertConfigOpen(true)} className="h-8 text-[10px] font-bold uppercase tracking-widest border-slate-200 shadow-xs">
                                <BellRing className="h-3 w-3 mr-2 text-slate-400" /> Alertas
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleExport('manager')} className="h-8 text-[10px] font-bold uppercase tracking-widest border-slate-200 shadow-xs">
                                <Download className="h-3 w-3 mr-2 text-slate-400" /> Exportar
                            </Button>
                            <Button variant="default" size="sm" onClick={handleSync} disabled={syncing} className="h-8 text-[10px] font-bold uppercase tracking-widest bg-slate-950 shadow-xs">
                                <RefreshCw className={cn("h-3 w-3 mr-2", syncing && "animate-spin")} /> Sincronizar
                            </Button>
                        </>
                    }
                />

                {/* KPI Grid - High Density MetricTiles */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    <MetricTile
                        label="Profit Neto"
                        value={`€${(t.netProfit || 0).toLocaleString('es-ES')}`}
                        sub={`${avg.profitPercent.toFixed(1)}% margen`}
                        status={avg.profitPercent < 15 ? 'CRITICAL' : 'OK'}
                    />
                    <MetricTile
                        label="Ventas Reales"
                        value={`€${(t.revenueReal || 0).toLocaleString('es-ES')}`}
                        sub={`${t.orders} pedidos`}
                    />
                    <MetricTile
                        label="ROAS Real"
                        value={`${(avg.roasReal || 0).toFixed(2)}x`}
                        sub="Consolidado"
                        status={avg.roasReal < 2.0 ? 'WARNING' : 'OK'}
                    />
                    <MetricTile
                        label="Delivery Rate"
                        value={`${(avg.deliveryRate || 0).toFixed(1)}%`}
                        sub="Última milla"
                    />
                </div>

                <div className="grid grid-cols-12 gap-4">
                    {/* Main Ledger Table - 8 Cols */}
                    <div className="col-span-12 lg:col-span-8">
                        <Card className="border-slate-200 shadow-sm overflow-hidden rounded-lg bg-white">
                            <CardHeader className="p-4 border-b border-slate-50 flex flex-row items-center justify-between space-y-0">
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Transacciones y Rendimiento Diario</h3>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-slate-950" />
                                        <span className="text-[9px] font-bold text-slate-400 uppercase">Saludable</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-rose-500" />
                                        <span className="text-[9px] font-bold text-slate-400 uppercase">Incidencia</span>
                                    </div>
                                </div>
                            </CardHeader>
                            <Table>
                                <TableHeader className="bg-slate-50/50">
                                    <TableRow className="border-slate-100 hover:bg-transparent">
                                        <TableHead className="text-[9px] h-9 font-bold uppercase tracking-widest text-slate-400 pl-4">Día</TableHead>
                                        <TableHead className="text-[9px] h-9 font-bold uppercase tracking-widest text-slate-400 text-right">Revenue</TableHead>
                                        <TableHead className="text-[9px] h-9 font-bold uppercase tracking-widest text-slate-400 text-right">Profit</TableHead>
                                        <TableHead className="text-[9px] h-9 font-bold uppercase tracking-widest text-slate-400 text-right">Ads</TableHead>
                                        <TableHead className="text-[9px] h-9 font-bold uppercase tracking-widest text-slate-400 text-right">ROAS</TableHead>
                                        <TableHead className="text-[9px] h-9 font-bold uppercase tracking-widest text-slate-400 text-center pr-4">Estado</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {days.map((day: any, i: number) => (
                                        <TableRow key={i} className="border-slate-50 hover:bg-slate-50/50 transition-colors h-10 group">
                                            <TableCell className="pl-4">
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] font-bold text-slate-900 leading-none">{format(new Date(day.date), 'dd MMM')}</span>
                                                    <span className="text-[8px] text-slate-400 uppercase font-medium mt-0.5">{format(new Date(day.date), 'EEEE', { locale: es })}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-[11px] font-bold text-slate-900 text-right">€{(day.revenueReal || 0).toLocaleString('es-ES')}</TableCell>
                                            <TableCell className="text-[11px] font-extrabold text-slate-900 text-right">€{(day.netProfit || 0).toLocaleString('es-ES')}</TableCell>
                                            <TableCell className="text-[11px] font-bold text-slate-400 text-right">€{(day.spendAds || 0).toLocaleString('es-ES')}</TableCell>
                                            <TableCell className="text-[11px] font-bold text-slate-900 text-right">{(day.roasReal || 0).toFixed(2)}x</TableCell>
                                            <TableCell className="pr-4">
                                                <StatusIndicator status={day.status} incomplete={!day.isComplete} />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Card>
                    </div>

                    {/* Side Panels - 4 Cols */}
                    <div className="col-span-12 lg:col-span-4 space-y-4">
                        {/* Neural Insights / CLOWDBOT Panel */}
                        <Card className="border-slate-900/10 bg-white shadow-sm overflow-hidden rounded-lg">
                            <div className="p-3 bg-slate-950 text-white flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Brain className="h-3.5 w-3.5 text-emerald-400" />
                                    <span className="text-[9px] font-bold uppercase tracking-[0.2em]">Neural Intelligence</span>
                                </div>
                                <Badge variant="outline" className="border-white/20 text-[8px] text-white/50 h-4">PRO</Badge>
                            </div>
                            <div className="p-4 space-y-3">
                                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex gap-2.5">
                                    <Info className="h-4 w-4 text-slate-900 shrink-0 mt-0.5" />
                                    <p className="text-[10px] leading-relaxed text-slate-600 font-medium">
                                        El ROAS ha bajado a <strong className="text-slate-900">2.1x</strong>. El CPA en campañas 'Escalado v2' supera el límite de <strong className="text-slate-900">€15</strong>. Recomendación: Pausar creatividades con CTR inferior al 1.2%.
                                    </p>
                                </div>
                                <Button className="w-full bg-slate-950 text-white text-[9px] font-bold uppercase tracking-widest h-8 rounded-md">
                                    Analizar con Agente IA
                                </Button>
                            </div>
                        </Card>

                        {/* Simulation Panel - Recovered Logic */}
                        <Card className="border-slate-200 bg-white shadow-sm rounded-lg overflow-hidden">
                            <div className="p-3 border-b border-slate-50 flex items-center gap-2">
                                <Calculator className="h-3.5 w-3.5 text-slate-500" />
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Simulador de Rentabilidad</h3>
                            </div>
                            <div className="p-4 space-y-3">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold uppercase text-slate-400">PVP (Sin IVA)</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-2 top-2 h-3 w-3 text-slate-300" />
                                        <Input className="h-7 text-[11px] font-bold pl-7 bg-slate-50 border-slate-100" defaultValue="49.90" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold uppercase text-slate-400">Costo Adquisición Total</label>
                                    <Input className="h-7 text-[11px] font-bold bg-slate-50 border-slate-100" defaultValue="15.20" />
                                </div>
                                <div className="pt-2 flex items-center justify-between border-t border-slate-50">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase">Breakeven ROAS</span>
                                    <span className="text-[11px] font-black text-slate-900">1.42</span>
                                </div>
                                <Button variant="outline" className="w-full text-[9px] font-bold uppercase tracking-widest h-7 mt-1 border-slate-200">
                                    Refinar Hipótesis
                                </Button>
                            </div>
                        </Card>
                    </div>
                </div>

                {/* Product Financials Detail (only if Product is active) */}
                {productId && (
                    <div className="mt-8 border-t border-slate-200 pt-8 animate-in fade-in">
                        <div className="mb-4">
                            <h2 className="text-xl font-black uppercase italic tracking-tight text-slate-900">Unit Economics & Profitability Lab</h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Análisis detallado de rentabilidad por unidad</p>
                        </div>
                        {productFinancialsLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <Calculator className="w-10 h-10 text-indigo-400 animate-spin" />
                                <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Calculando Profit...</p>
                            </div>
                        ) : (
                            <ProductFinancialsDashboard
                                data={productFinancials}
                                loading={productFinancialsLoading}
                            />
                        )}
                    </div>
                )}

                <FinanceAgentChat monthlyData={data ? { totals: t, averages: avg } : undefined} />
                <AlertConfigPanel storeId={storeId || ""} isOpen={alertConfigOpen} onClose={() => setAlertConfigOpen(false)} onSave={() => loadData()} />
            </div>
        </PageShell>
    );
}

function MetricTile({ label, value, sub, status }: any) {
    return (
        <Card className="bg-white border text-left border-slate-200 shadow-sm rounded-lg p-3 py-4 flex flex-col justify-between hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{label}</span>
                {status === 'CRITICAL' && <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />}
                {status === 'WARNING' && <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />}
            </div>
            <div className="mt-1">
                <div className="text-2xl font-black text-slate-900 tracking-tighter italic leading-none">{value}</div>
                {sub && <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-1 opacity-70">{sub}</div>}
            </div>
        </Card>
    );
}

function StatusIndicator({ status, incomplete }: { status: string, incomplete?: boolean }) {
    const icons: any = {
        OK: { icon: CheckCircle2, color: "text-slate-400" },
        WARNING: { icon: Circle, color: "text-amber-500" },
        CRITICAL: { icon: AlertTriangle, color: "text-rose-500" },
    };
    const { icon: Icon, color } = icons[status] || (incomplete ? { icon: AlertCircle, color: "text-slate-300 animate-pulse" } : icons.OK);

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger>
                    <Icon className={cn("h-3.5 w-3.5 mx-auto", color)} />
                </TooltipTrigger>
                <TooltipContent className="bg-slate-950 text-white text-[9px] font-bold uppercase px-2 py-1">
                    {incomplete ? "Sincronización Incompleta" : `Salud: ${status}`}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
