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
    Brain, Filter, Info, Circle, BellRing, AlertTriangle, Link2,
    Plus, Trash2, Store, AppWindow, Users, Calendar, Save, Loader2, Package
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { useStore } from "@/lib/store/store-context";
import { getAlertRules } from "@/app/sistema/settings/alerts/actions";
import { AlertRule } from "@/lib/alerts";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { triggerHistoricalSync, saveMonthlyGoal, getProductsWithFinance, saveHypothesis, getHypotheses, loadProductCosts, deleteHypothesis } from "./actions";
import { syncShopifyHistory } from "@/app/operaciones/pedidos/actions";
import { FinanceAgentChat } from "@/components/finance-agent-chat";
import { AlertConfigPanel, AlertThresholds } from "@/components/alert-config-panel";
import { useProduct } from "@/context/ProductContext";
import { useProductFinancials } from "@/hooks/useProductFinancials";
import { PageShell } from "@/components/ui/PageShell";
import { ModuleHeader } from "@/components/ui/ModuleHeader";
import { ProductFinancialsDashboard } from "@/components/finances/ProductFinancialsDashboard";
import Link from "next/link";
import { motion } from "framer-motion";

/* ─────────────────────────────────────
   TABS CONFIG
   ───────────────────────────────────── */
const FINANCE_TABS = [
    { id: "ledger", label: "Profit & Ledger", icon: Wallet, color: "from-indigo-600 to-blue-600" },
    { id: "expenses", label: "Gastos Fijos", icon: Receipt, color: "from-emerald-600 to-teal-600" },
    { id: "simulator", label: "Simulador", icon: Calculator, color: "from-violet-600 to-purple-600" },
] as const;

type TabId = typeof FINANCE_TABS[number]["id"];

/* ─────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────── */
export default function FinancesHub() {
    const [activeTab, setActiveTab] = useState<TabId>("ledger");

    return (
        <PageShell>
            <div className="space-y-0 pb-20">
                {/* >>> MODULE HEADER */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4 mt-4">
                    <div className="space-y-1">
                        <Badge className="bg-slate-900 text-white border-none font-black text-[8px] uppercase tracking-[0.2em] px-2.5 py-0.5 rounded-sm">
                            Financial OS v3.0
                        </Badge>
                        <h1 className="text-xl font-black tracking-tighter italic uppercase text-slate-900 leading-none flex items-center gap-2">
                            <Wallet className="h-5 w-5" /> FINANZAS <span className="text-slate-400">COMMAND</span>
                        </h1>
                    </div>
                </div>

                {/* >>> TAB BAR */}
                <div className="flex gap-1.5 p-1 bg-slate-100/80 rounded-lg mb-4 border border-slate-200/60">
                    {FINANCE_TABS.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                                    isActive
                                        ? `bg-gradient-to-r ${tab.color} text-white shadow-lg`
                                        : "text-slate-500 hover:text-slate-900 hover:bg-white/60"
                                )}
                            >
                                <Icon className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* >>> TAB CONTENT */}
                <div className="animate-in fade-in duration-300">
                    {activeTab === "ledger" && <LedgerTab />}
                    {activeTab === "expenses" && <ExpensesTab />}
                    {activeTab === "simulator" && <SimulatorTab />}
                </div>
            </div>
        </PageShell>
    );
}

/* ═══════════════════════════════════════
   TAB 1: PROFIT & LEDGER
   ═══════════════════════════════════════ */
function LedgerTab() {
    const { activeStoreId: storeId } = useStore();
    const { productId } = useProduct();
    const { financialData: productFinancials, loading: productFinancialsLoading } = useProductFinancials(productId as string);
    const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
    const [date, setDate] = useState(new Date());
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [alertConfigOpen, setAlertConfigOpen] = useState(false);
    const [alertThresholds, setAlertThresholds] = useState<AlertThresholds | null>(null);
    const [isConnected, setIsConnected] = useState<boolean | null>(null);
    const [projections, setProjections] = useState({
        adSpendBudget: 0, targetRoas: 0, breakevenRoas: 0,
        maxCpa: 0, maxCpc: 0, expectedConvRate: 0, expectedAvgTicket: 0
    });

    useEffect(() => {
        if (storeId) {
            fetch(`/api/connections/status?storeId=${storeId}&service=SHOPIFY`)
                .then(res => res.json())
                .then(data => setIsConnected(data.isConnected));
        }
    }, [storeId]);

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
        } finally { setLoading(false); }
    }, [date, storeId, productId, data, projections]);

    useEffect(() => { loadData(); }, [loadData]);
    useAutoRefresh(loadData, { interval: 60000, enabled: !productId, pauseOnHidden: true });

    useEffect(() => {
        if (storeId) getAlertRules(storeId).then(rules => setAlertRules(rules as AlertRule[]));
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
                        <Link2 className="w-4 h-4 mr-2" /> Vincular Tienda
                    </Button>
                </Link>
            </div>
        );
    }

    const t = data?.totals || { revenueReal: 0, netProfit: 0, spendAds: 0, costsReal: 0, orders: 0, delivered: 0, cogs: 0 };
    const avg = { roasReal: 0, profitPercent: 0, deliveryRate: 0, ...(data?.averages || {}) };
    const days = data?.days || [];

    return (
        <div className="space-y-4">
            {/* Actions Bar */}
            <div className="flex items-center justify-between">
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    {format(date, 'MMMM yyyy', { locale: es })} • {productId === 'GLOBAL' ? 'Tienda Global' : 'Producto'}
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setAlertConfigOpen(true)} className="h-7 text-[9px] font-bold uppercase tracking-widest border-slate-200">
                        <BellRing className="h-3 w-3 mr-1.5 text-slate-400" /> Alertas
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleExport('manager')} className="h-7 text-[9px] font-bold uppercase tracking-widest border-slate-200">
                        <Download className="h-3 w-3 mr-1.5 text-slate-400" /> Exportar
                    </Button>
                    <Button variant="default" size="sm" onClick={handleSync} disabled={syncing} className="h-7 text-[9px] font-bold uppercase tracking-widest bg-slate-950">
                        <RefreshCw className={cn("h-3 w-3 mr-1.5", syncing && "animate-spin")} /> Sync
                    </Button>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <MetricTile label="Profit Neto" value={`€${(t.netProfit || 0).toLocaleString('es-ES')}`} sub={`${avg.profitPercent.toFixed(1)}% margen`} status={avg.profitPercent < 15 ? 'CRITICAL' : 'OK'} />
                <MetricTile label="Ventas Reales" value={`€${(t.revenueReal || 0).toLocaleString('es-ES')}`} sub={`${t.orders} pedidos`} />
                <MetricTile label="ROAS Real" value={`${(avg.roasReal || 0).toFixed(2)}x`} sub="Consolidado" status={avg.roasReal < 2.0 ? 'WARNING' : 'OK'} />
                <MetricTile label="Delivery Rate" value={`${(avg.deliveryRate || 0).toFixed(1)}%`} sub="Última milla" />
            </div>

            <div className="grid grid-cols-12 gap-3">
                {/* Ledger Table */}
                <div className="col-span-12 lg:col-span-8">
                    <Card className="border-slate-200 shadow-sm overflow-hidden rounded-lg bg-white">
                        <CardHeader className="p-3 border-b border-slate-50 flex flex-row items-center justify-between space-y-0">
                            <h3 className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Transacciones y Rendimiento Diario</h3>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-slate-950" /><span className="text-[8px] font-bold text-slate-400 uppercase">Saludable</span></div>
                                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-rose-500" /><span className="text-[8px] font-bold text-slate-400 uppercase">Incidencia</span></div>
                            </div>
                        </CardHeader>
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow className="border-slate-100 hover:bg-transparent">
                                    <TableHead className="text-[8px] h-8 font-bold uppercase tracking-widest text-slate-400 pl-3">Día</TableHead>
                                    <TableHead className="text-[8px] h-8 font-bold uppercase tracking-widest text-slate-400 text-right">Revenue</TableHead>
                                    <TableHead className="text-[8px] h-8 font-bold uppercase tracking-widest text-slate-400 text-right">Profit</TableHead>
                                    <TableHead className="text-[8px] h-8 font-bold uppercase tracking-widest text-slate-400 text-right">Ads</TableHead>
                                    <TableHead className="text-[8px] h-8 font-bold uppercase tracking-widest text-slate-400 text-right">ROAS</TableHead>
                                    <TableHead className="text-[8px] h-8 font-bold uppercase tracking-widest text-slate-400 text-center pr-3">Estado</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {days.map((day: any, i: number) => (
                                    <TableRow key={i} className="border-slate-50 hover:bg-slate-50/50 transition-colors h-9 group">
                                        <TableCell className="pl-3">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold text-slate-900 leading-none">{format(new Date(day.date), 'dd MMM')}</span>
                                                <span className="text-[7px] text-slate-400 uppercase font-medium mt-0.5">{format(new Date(day.date), 'EEEE', { locale: es })}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-[10px] font-bold text-slate-900 text-right">€{(day.revenueReal || 0).toLocaleString('es-ES')}</TableCell>
                                        <TableCell className="text-[10px] font-extrabold text-slate-900 text-right">€{(day.netProfit || 0).toLocaleString('es-ES')}</TableCell>
                                        <TableCell className="text-[10px] font-bold text-slate-400 text-right">€{(day.spendAds || 0).toLocaleString('es-ES')}</TableCell>
                                        <TableCell className="text-[10px] font-bold text-slate-900 text-right">{(day.roasReal || 0).toFixed(2)}x</TableCell>
                                        <TableCell className="pr-3"><StatusIndicator status={day.status} incomplete={!day.isComplete} /></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                </div>

                {/* Side Panel */}
                <div className="col-span-12 lg:col-span-4 space-y-3">
                    <Card className="border-slate-900/10 bg-white shadow-sm overflow-hidden rounded-lg">
                        <div className="p-2.5 bg-slate-950 text-white flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Brain className="h-3 w-3 text-emerald-400" />
                                <span className="text-[8px] font-bold uppercase tracking-[0.2em]">Neural Intelligence</span>
                            </div>
                            <Badge variant="outline" className="border-white/20 text-[7px] text-white/50 h-4">PRO</Badge>
                        </div>
                        <div className="p-3 space-y-2">
                            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 flex gap-2">
                                <Info className="h-3.5 w-3.5 text-slate-900 shrink-0 mt-0.5" />
                                <p className="text-[9px] leading-relaxed text-slate-600 font-medium">
                                    El ROAS ha bajado a <strong className="text-slate-900">2.1x</strong>. El CPA en campañas 'Escalado v2' supera el límite de <strong className="text-slate-900">€15</strong>. Recomendación: Pausar creatividades con CTR inferior al 1.2%.
                                </p>
                            </div>
                            <Button className="w-full bg-slate-950 text-white text-[8px] font-bold uppercase tracking-widest h-7 rounded-md">Analizar con Agente IA</Button>
                        </div>
                    </Card>

                    <Card className="border-slate-200 bg-white shadow-sm rounded-lg overflow-hidden">
                        <div className="p-2.5 border-b border-slate-50 flex items-center gap-2">
                            <Calculator className="h-3 w-3 text-slate-500" />
                            <h3 className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Quick Sim</h3>
                        </div>
                        <div className="p-3 space-y-2">
                            <div className="space-y-1">
                                <label className="text-[8px] font-bold uppercase text-slate-400">PVP (Sin IVA)</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-2 top-1.5 h-3 w-3 text-slate-300" />
                                    <Input className="h-6 text-[10px] font-bold pl-7 bg-slate-50 border-slate-100" defaultValue="49.90" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[8px] font-bold uppercase text-slate-400">Costo Adquisición</label>
                                <Input className="h-6 text-[10px] font-bold bg-slate-50 border-slate-100" defaultValue="15.20" />
                            </div>
                            <div className="pt-1.5 flex items-center justify-between border-t border-slate-50">
                                <span className="text-[8px] font-bold text-slate-400 uppercase">Breakeven ROAS</span>
                                <span className="text-[10px] font-black text-slate-900">1.42</span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {productId && (
                <div className="mt-6 border-t border-slate-200 pt-6 animate-in fade-in">
                    <div className="mb-3">
                        <h2 className="text-lg font-black uppercase italic tracking-tight text-slate-900">Unit Economics & Profitability Lab</h2>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Análisis detallado de rentabilidad por unidad</p>
                    </div>
                    {productFinancialsLoading ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-4">
                            <Calculator className="w-8 h-8 text-indigo-400 animate-spin" />
                            <p className="text-slate-400 font-black text-[9px] uppercase tracking-widest">Calculando Profit...</p>
                        </div>
                    ) : (
                        <ProductFinancialsDashboard data={productFinancials} loading={productFinancialsLoading} />
                    )}
                </div>
            )}

            <FinanceAgentChat monthlyData={data ? { totals: t, averages: avg } : undefined} />
            <AlertConfigPanel storeId={storeId || ""} isOpen={alertConfigOpen} onClose={() => setAlertConfigOpen(false)} onSave={() => loadData()} />
        </div>
    );
}

/* ═══════════════════════════════════════
   TAB 2: GASTOS FIJOS (Expenses)
   ═══════════════════════════════════════ */
const expenseCategories = [
    { id: "SOFTWARE", name: "Apps & Software", icon: AppWindow, color: "text-blue-400" },
    { id: "TEAM", name: "Personal / Salarios", icon: Users, color: "text-purple-400" },
    { id: "STORE", name: "Mantenimiento Tienda", icon: Store, color: "text-orange-400" },
    { id: "SERVICE", name: "Servicios Externos", icon: Calendar, color: "text-emerald-400" },
];

function ExpensesTab() {
    const [syncing, setSyncing] = useState(false);
    const [expenses, setExpenses] = useState([
        { id: 1, name: "Suscripción Shopify", category: "STORE", amount: 39, date: "Mensual" },
        { id: 2, name: "Dropi Import Fee", category: "SOFTWARE", amount: 15, date: "Fijo" },
        { id: 3, name: "Sueldo Agente ATT (Laura)", category: "TEAM", amount: 1200, date: "Mensual" },
        { id: 4, name: "Google Drive Storage", category: "SOFTWARE", amount: 10, date: "Mensual" },
    ]);
    const totalMonthly = expenses.reduce((acc, curr) => acc + curr.amount, 0);

    const handleSync = async () => {
        setSyncing(true);
        try {
            const res = await syncShopifyHistory("force-sync");
            if (res.success) toast.success(res.message);
            else toast.error("Error al sincronizar: " + res.message);
        } catch (e) { toast.error("Fallo de conexión"); }
        finally { setSyncing(false); }
    };

    return (
        <div className="space-y-3 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="h-7 text-[8px] font-black uppercase tracking-widest border-slate-200 text-slate-600 hover:bg-slate-50" onClick={handleSync} disabled={syncing}>
                        <RefreshCw className={cn("h-3 w-3 mr-1.5", syncing && "animate-spin")} />
                        {syncing ? "Sincronizando..." : "Sync Total"}
                    </Button>
                    <Card className="bg-slate-900 border-none px-3 py-1 flex items-center gap-2 rounded-lg shadow-xl">
                        <Calculator className="h-3 w-3 text-slate-400" />
                        <div className="flex flex-col">
                            <span className="text-[7px] text-slate-500 uppercase font-black leading-none tracking-widest">Total Fijos / Mes</span>
                            <span className="text-sm font-black text-white italic tracking-tighter">€{totalMonthly.toLocaleString()}</span>
                        </div>
                    </Card>
                </div>
            </div>

            <div className="grid gap-3 md:grid-cols-12">
                {/* Form */}
                <Card className="md:col-span-4 bg-white border-slate-100 shadow-sm h-fit rounded-lg">
                    <CardHeader className="p-2.5 border-b border-slate-50">
                        <CardTitle className="text-[9px] font-black uppercase tracking-widest text-slate-400">Registrar Gasto</CardTitle>
                    </CardHeader>
                    <CardContent className="p-2.5 space-y-2">
                        <div className="space-y-0.5">
                            <Label className="text-[8px] font-black uppercase text-slate-500 tracking-widest">Nombre del Gasto</Label>
                            <Input placeholder="Ej: Apps de Reviews" className="h-7 text-[10px] font-bold bg-slate-50 border-slate-100 rounded-lg px-2.5" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-0.5">
                                <Label className="text-[8px] font-black uppercase text-slate-500 tracking-widest">Cantidad (€)</Label>
                                <Input type="number" placeholder="29.99" className="h-7 text-[10px] font-black bg-slate-50 border-slate-100 rounded-lg px-2.5" />
                            </div>
                            <div className="space-y-0.5">
                                <Label className="text-[8px] font-black uppercase text-slate-500 tracking-widest">Categoría</Label>
                                <Select>
                                    <SelectTrigger className="h-7 text-[10px] font-bold bg-slate-50 border-slate-100 rounded-lg px-2.5">
                                        <SelectValue placeholder="Tipo..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border-slate-100 rounded-lg shadow-xl">
                                        {expenseCategories.map(cat => (
                                            <SelectItem key={cat.id} value={cat.id} className="text-[10px] font-bold">{cat.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <Button size="sm" className="w-full mt-1 h-7 text-[8px] font-black uppercase tracking-widest gap-2 bg-slate-900 hover:bg-black rounded-lg">
                            <Plus className="h-3 w-3" /> Añadir
                        </Button>
                    </CardContent>
                </Card>

                {/* Table */}
                <Card className="md:col-span-8 bg-white border-slate-100 shadow-sm rounded-lg overflow-hidden">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow className="border-slate-100 hover:bg-transparent">
                                    <TableHead className="text-[8px] h-8 uppercase font-black tracking-widest text-slate-400 pl-3">Gasto</TableHead>
                                    <TableHead className="text-[8px] h-8 uppercase font-black tracking-widest text-slate-400 text-center">Categoría</TableHead>
                                    <TableHead className="text-[8px] h-8 uppercase font-black tracking-widest text-slate-400 text-right">Monto / Mes</TableHead>
                                    <TableHead className="text-[8px] h-8 uppercase font-black tracking-widest text-slate-400 w-[50px] pr-3"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {expenses.map((exp) => {
                                    const cat = expenseCategories.find(c => c.id === exp.category);
                                    return (
                                        <TableRow key={exp.id} className="border-slate-50 hover:bg-slate-50/30 transition-colors group">
                                            <TableCell className="py-2 pl-3">
                                                <span className="text-[10px] font-black text-slate-900 italic tracking-tight">{exp.name}</span>
                                            </TableCell>
                                            <TableCell className="py-2 text-center">
                                                <Badge variant="outline" className="text-[7px] font-black uppercase tracking-widest h-4 px-1.5 border-none bg-slate-100 text-slate-600 rounded-sm">
                                                    {cat?.name}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="py-2 text-right">
                                                <span className="text-[10px] font-black text-slate-900 italic tracking-tighter">€{exp.amount}</span>
                                            </TableCell>
                                            <TableCell className="py-2 text-right pr-3">
                                                <Button variant="ghost" size="icon" className="h-5 w-5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-all">
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {/* Impact Card */}
            <Card className="bg-slate-900 border-none overflow-hidden rounded-lg shadow-xl shadow-slate-200/50">
                <div className="p-2.5 px-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                            <Calculator className="h-3.5 w-3.5" />
                        </div>
                        <div>
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-white leading-none">Impacto en beneficio diario</h4>
                            <p className="text-[7px] font-black uppercase tracking-[0.2em] text-slate-500 mt-0.5">Prorrateo de gastos en tus métricas diarias.</p>
                        </div>
                    </div>
                    <div className="flex gap-6">
                        <div className="text-right">
                            <span className="text-[7px] font-black uppercase tracking-widest text-slate-500 block">Coste Fijo / Día</span>
                            <span className="text-sm font-black text-white italic tracking-tighter leading-none">€{(totalMonthly / 30).toFixed(2)}</span>
                        </div>
                        <div className="text-right pr-2">
                            <span className="text-[7px] font-black uppercase tracking-widest text-slate-500 block">Estado BEP</span>
                            <span className="text-[9px] font-black text-white uppercase tracking-widest leading-none">Actualizado</span>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}

/* ═══════════════════════════════════════
   TAB 3: SIMULADOR DE HIPÓTESIS
   ═══════════════════════════════════════ */
function SimulatorTab() {
    const [params, setParams] = useState({
        productCost: 15, shippingCost: 4.5, sellingPrice: 49.90,
        conversionRate: 2.5, targetProfitPerOrder: 15
    });
    const [bundle, setBundle] = useState({ enabled: false, buy: 1, get: 1 });
    const [bundleConfig, setBundleConfig] = useState({ paidUnits: 1, shippedUnits: 1 });
    const [products, setProducts] = useState<any[]>([]);
    const [scenarios, setScenarios] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [saveName, setSaveName] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [saveOpen, setSaveOpen] = useState(false);
    const [historyOpen, setHistoryOpen] = useState(false);

    useEffect(() => {
        const init = async () => {
            const [p, s] = await Promise.all([getProductsWithFinance(), getHypotheses()]);
            setProducts(p);
            setScenarios(s);
        };
        init();
    }, []);

    const handleLoadProduct = async (productId: string) => {
        setLoading(true);
        const costs = await loadProductCosts(productId);
        setLoading(false);
        if (costs && !Array.isArray(costs)) {
            setParams(prev => ({ ...prev, productCost: costs.unitCost || 0, shippingCost: costs.shippingCost || 0, sellingPrice: costs.sellingPrice || 0 }));
            toast.success(`Cargados costes de: ${costs.title}`);
        }
    };

    const results = useMemo(() => {
        const effectiveRevenue = params.sellingPrice * bundleConfig.paidUnits;
        const effectiveCOGS = params.productCost * bundleConfig.shippedUnits;
        const totalShipping = params.shippingCost;
        const totalRevenue = effectiveRevenue;
        const totalCost = effectiveCOGS + totalShipping;
        const grossMargin = totalRevenue - totalCost;
        const targetCPA = grossMargin - params.targetProfitPerOrder;
        const safeTargetCPA = targetCPA > 0 ? targetCPA : 0;
        const targetROAS = totalRevenue / (safeTargetCPA || 1);
        const maxCPC = (safeTargetCPA * (params.conversionRate / 100));
        const breakEvenCPA = grossMargin;
        const breakEvenROAS = totalRevenue / (breakEvenCPA || 1);
        return {
            margin: grossMargin.toFixed(2), revenue: totalRevenue.toFixed(2), cost: totalCost.toFixed(2),
            breakEvenCPA: breakEvenCPA.toFixed(2), breakEvenROAS: breakEvenROAS.toFixed(2),
            targetCPA: safeTargetCPA.toFixed(2), targetROAS: targetROAS.toFixed(2), maxCPC: maxCPC.toFixed(2)
        };
    }, [params, bundleConfig]);

    const handleSave = async () => {
        if (!saveName) return;
        setIsSaving(true);
        await saveHypothesis({ name: saveName, ...params, targetProfit: params.targetProfitPerOrder, targetROAS: parseFloat(results.targetROAS), targetCPA: results.targetCPA });
        setIsSaving(false);
        setSaveOpen(false);
        const s = await getHypotheses();
        setScenarios(s);
        toast.success("Hipótesis guardada");
    };

    const handleLoadScenario = (s: any) => {
        setParams({ productCost: s.productCost, shippingCost: s.shippingCost, sellingPrice: 49.90, conversionRate: 2.5, targetProfitPerOrder: s.targetProfit });
        setHistoryOpen(false);
        toast.success(`Escenario importado: ${s.name}`);
    };

    const handleDelete = async (id: string, e: any) => {
        e.stopPropagation();
        await deleteHypothesis(id);
        const s = await getHypotheses();
        setScenarios(s);
    };

    return (
        <div className="space-y-3 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Calcula tu rentabilidad ideal y define límites de gasto publicitario.</p>
                <Select onValueChange={handleLoadProduct}>
                    <SelectTrigger className="w-[160px] h-7 text-[9px] border-slate-200">
                        <SelectValue placeholder="Cargar Producto..." />
                    </SelectTrigger>
                    <SelectContent>
                        <ScrollArea className="h-[200px]">
                            {products.map(p => (<SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>))}
                        </ScrollArea>
                    </SelectContent>
                </Select>
            </div>

            <div className="grid gap-3 md:grid-cols-12">
                {/* Input Controls */}
                <Card className="md:col-span-5 bg-slate-950 border-none rounded-lg text-white">
                    <CardHeader className="p-3 flex flex-row items-center justify-between">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                            <Target className="h-3.5 w-3.5" /> Parámetros
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            <Label className="text-[8px] uppercase text-slate-400">Bundle?</Label>
                            <Switch checked={bundle.enabled} onCheckedChange={(c) => setBundle(prev => ({ ...prev, enabled: c }))} />
                        </div>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 space-y-3">
                        {bundle.enabled && (
                            <div className="p-2.5 bg-white/5 rounded-lg border border-white/10 space-y-2">
                                <Label className="text-[9px] text-white font-black uppercase tracking-widest">Configuración Bundle</Label>
                                <div className="flex gap-3">
                                    <div className="space-y-0.5">
                                        <Label className="text-[8px] text-slate-400 font-bold uppercase">Uds. Cobradas</Label>
                                        <Input type="number" className="h-6 w-16 text-[10px] font-black bg-white/5 border-white/10 text-white" value={bundleConfig.paidUnits} onChange={(e) => setBundleConfig({ ...bundleConfig, paidUnits: parseInt(e.target.value) || 1 })} />
                                    </div>
                                    <div className="space-y-0.5">
                                        <Label className="text-[8px] text-slate-400 font-bold uppercase">Uds. Enviadas</Label>
                                        <Input type="number" className="h-6 w-16 text-[10px] font-black bg-white/5 border-white/10 text-white" value={bundleConfig.shippedUnits} onChange={(e) => setBundleConfig({ ...bundleConfig, shippedUnits: parseInt(e.target.value) || 1 })} />
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-[8px] uppercase text-slate-400">PVP Unitario</Label>
                                <Input value={params.sellingPrice} onChange={(e) => setParams({ ...params, sellingPrice: Number(e.target.value) })} type="number" className="h-7 text-[10px] bg-white/5 border-white/10 text-white font-bold" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[8px] uppercase text-slate-400">COGS Unitario</Label>
                                <Input value={params.productCost} onChange={(e) => setParams({ ...params, productCost: Number(e.target.value) })} type="number" className="h-7 text-[10px] bg-white/5 border-white/10 text-white font-bold" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[8px] uppercase text-slate-400">Costo Envío (Pedido)</Label>
                            <Input value={params.shippingCost} onChange={(e) => setParams({ ...params, shippingCost: Number(e.target.value) })} type="number" className="h-7 text-[10px] bg-white/5 border-white/10 text-white font-bold" />
                        </div>
                        <Separator className="bg-white/10" />
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-[8px] uppercase text-slate-400">Conv. Rate (%)</Label>
                                <span className="text-[10px] font-black text-indigo-400">{params.conversionRate}%</span>
                            </div>
                            <input type="range" min="0.1" max="10" step="0.1" value={params.conversionRate} onChange={(e) => setParams({ ...params, conversionRate: Number(e.target.value) })} className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[8px] uppercase text-slate-400">Beneficio Neto Deseado / Pedido (€)</Label>
                            <Input value={params.targetProfitPerOrder} onChange={(e) => setParams({ ...params, targetProfitPerOrder: Number(e.target.value) })} type="number" className="h-7 text-[10px] bg-white/5 border-white/10 text-white font-bold" />
                        </div>
                    </CardContent>
                </Card>

                {/* Results */}
                <div className="md:col-span-7 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <Card className="bg-slate-900 border-none shadow-xl rounded-lg overflow-hidden">
                            <CardHeader className="p-2.5 pb-0">
                                <CardDescription className="text-[9px] font-black uppercase tracking-widest text-slate-500">CPA Máximo ({results.targetROAS} ROAS)</CardDescription>
                            </CardHeader>
                            <CardContent className="p-2.5">
                                <div className="text-2xl font-black text-white italic tracking-tighter">€{results.targetCPA}</div>
                                <p className="text-[8px] font-bold uppercase tracking-widest text-slate-500 mt-0.5">Para ganar €{params.targetProfitPerOrder}/pedido</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-white border-slate-100 shadow-sm rounded-lg overflow-hidden">
                            <CardHeader className="p-2.5 pb-0">
                                <CardDescription className="text-[9px] font-black uppercase tracking-widest text-slate-400">CPC Máximo (Ads)</CardDescription>
                            </CardHeader>
                            <CardContent className="p-2.5">
                                <div className="text-2xl font-black text-slate-900 italic tracking-tighter">€{results.maxCPC}</div>
                                <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">Límite para tus pujas</p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="bg-white border-slate-100 shadow-sm rounded-lg overflow-hidden">
                        <CardHeader className="p-3 pb-1.5">
                            <CardTitle className="text-[10px] font-black uppercase italic tracking-tighter">Análisis de Rentabilidad {bundle.enabled ? '(BUNDLE)' : ''}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 pt-1.5 space-y-3">
                            <div className="grid grid-cols-3 gap-2 text-center">
                                <div className="p-2 bg-slate-50 rounded"><div className="text-[8px] text-slate-400 font-black uppercase tracking-widest">Ingresos</div><div className="font-black text-slate-900 italic tracking-tighter">€{results.revenue}</div></div>
                                <div className="p-2 bg-slate-50 rounded"><div className="text-[8px] text-slate-400 font-black uppercase tracking-widest">Costes</div><div className="font-black text-slate-900 italic tracking-tighter">€{results.cost}</div></div>
                                <div className="p-2 bg-slate-900 rounded shadow-lg"><div className="text-[8px] text-slate-500 font-black uppercase tracking-widest">Margen</div><div className="font-black text-white italic tracking-tighter">€{results.margin}</div></div>
                            </div>
                            <Separator className="bg-slate-50" />
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">ROAS Break-Even</span>
                                <Badge variant="outline" className="border-slate-200 text-slate-600 font-black">{results.breakEvenROAS}</Badge>
                            </div>
                            <div className="bg-slate-50 border border-slate-100 rounded-md p-2.5 flex gap-2">
                                <Info className="h-3.5 w-3.5 text-slate-900 shrink-0 mt-0.5" />
                                <p className="text-[8px] leading-relaxed text-slate-500 font-bold uppercase tracking-tight">
                                    Con ROAS de <strong className="text-slate-950">{results.targetROAS}</strong> y conv. de <strong className="text-slate-950">{params.conversionRate}%</strong>, tu beneficio es €{params.targetProfitPerOrder}/pedido.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex gap-2">
                        <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" variant="outline" className="flex-1 text-[9px] h-7 gap-2 uppercase tracking-tighter">
                                    <History className="h-3 w-3" /> Escenarios ({scenarios.length})
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader><DialogTitle>Historial de Hipótesis</DialogTitle></DialogHeader>
                                <ScrollArea className="h-[300px]">
                                    <div className="space-y-2">
                                        {scenarios.map(s => (
                                            <div key={s.id} onClick={() => handleLoadScenario(s)} className="flex items-center justify-between p-3 rounded-lg border border-white/10 hover:bg-white/5 cursor-pointer group">
                                                <div>
                                                    <div className="font-bold text-sm">{s.name}</div>
                                                    <div className="text-[10px] text-muted-foreground">ROAS: {s.targetROAS?.toFixed(2)} • CPA: €{s.targetCPA?.toFixed(2)}</div>
                                                </div>
                                                <Button variant="ghost" size="sm" onClick={(e) => handleDelete(s.id, e)} className="h-8 w-8 text-rose-500 opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></Button>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </DialogContent>
                        </Dialog>
                        <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" className="flex-1 text-[9px] h-7 gap-2 bg-indigo-600 hover:bg-indigo-700 text-white uppercase tracking-tighter">
                                    <Save className="h-3 w-3" /> Guardar
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader><DialogTitle>Guardar Escenario</DialogTitle></DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>Nombre del Escenario</Label>
                                        <Input placeholder="Ej: Q4 Offer - Buy 2 Get 1" value={saveName} onChange={(e) => setSaveName(e.target.value)} />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button onClick={handleSave} disabled={isSaving}>
                                        {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Guardar
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════
   SHARED COMPONENTS
   ═══════════════════════════════════════ */
function MetricTile({ label, value, sub, status }: any) {
    return (
        <Card className="bg-white border text-left border-slate-200 shadow-sm rounded-lg p-2.5 flex flex-col justify-between hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between">
                <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400">{label}</span>
                {status === 'CRITICAL' && <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />}
                {status === 'WARNING' && <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />}
            </div>
            <div className="mt-1">
                <div className="text-xl font-black text-slate-900 tracking-tighter italic leading-none">{value}</div>
                {sub && <div className="text-[8px] font-bold text-slate-400 uppercase tracking-tight mt-0.5 opacity-70">{sub}</div>}
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
                <TooltipTrigger><Icon className={cn("h-3 w-3 mx-auto", color)} /></TooltipTrigger>
                <TooltipContent className="bg-slate-950 text-white text-[8px] font-bold uppercase px-2 py-1">
                    {incomplete ? "Sync Incompleta" : `Salud: ${status}`}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
