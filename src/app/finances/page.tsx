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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format, addMonths, subMonths, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { triggerHistoricalSync, getActiveThreshold, saveMonthlyGoal, rebuildAccounting } from "./actions";

import { repairMonthOrderItems } from "../logistics/orders/actions";
import { FinanceAgentChat } from "@/components/finance-agent-chat";
import { AlertConfigPanel, getAlertLevel, AlertBadge, AlertThresholds } from "@/components/alert-config-panel";
import { BellRing } from "lucide-react";
import { useProduct } from "@/context/ProductContext";

export default function AccountingDashboard() {
    const { productId } = useProduct();
    const [date, setDate] = useState(new Date());
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [threshold, setThreshold] = useState<any>(null);
    const [alertConfigOpen, setAlertConfigOpen] = useState(false);
    const [alertThresholds, setAlertThresholds] = useState<AlertThresholds | null>(null);
    const syncedMonthsRef = useRef<Set<string>>(new Set()); // Track already synced months

    // Projections form state
    const [projections, setProjections] = useState({
        adSpendBudget: 0,
        targetRoas: 0,
        breakevenRoas: 0,
        maxCpa: 0,
        maxCpc: 0,
        expectedConvRate: 0,
        expectedAvgTicket: 0
    });

    // Calculadora de Pricing state
    const [pricingCalc, setPricingCalc] = useState({
        productName: '',
        offerName: '',
        salePrice: 0,
        productCost: 0,
        iva: 0,
        shippingCost: 6.88,
        codFee: 1,
        deliveryRate: 70,
        shipmentRate: 80
    });

    // Expense form state
    const [newExpense, setNewExpense] = useState({
        category: '',
        amount: '',
        description: ''
    });

    // Cálculos automáticos de la calculadora
    const calcResults = useMemo(() => {
        const { salePrice, productCost, iva, shippingCost, codFee, deliveryRate, shipmentRate } = pricingCalc;
        if (salePrice <= 0) return null;

        // IVA como porcentaje del precio
        const ivaAmount = iva > 0 ? salePrice * (iva / 100) : 0;
        const netSalePrice = salePrice - ivaAmount;

        // Costes totales
        const totalCosts = productCost + shippingCost + codFee;

        // Profit bruto (antes de aplicar tasas)
        const grossProfit = netSalePrice - totalCosts;

        // Profit ajustado por tasas de entrega y envío
        const deliveryAdjustment = deliveryRate / 100;
        const shipmentAdjustment = shipmentRate / 100;
        const effectiveProfit = grossProfit * deliveryAdjustment * shipmentAdjustment;

        // CPA máximo (lo máximo que puedes pagar por adquisión sin perder)
        const maxCpa = effectiveProfit > 0 ? effectiveProfit : 0;

        // ROAS breakeven (cuánto necesitas facturar por cada euro gastado en ads)
        const roasBreakeven = maxCpa > 0 ? salePrice / maxCpa : 0;

        // Margen bruto
        const marginPercent = salePrice > 0 ? (grossProfit / salePrice) * 100 : 0;

        // Margen efectivo (con tasas aplicadas)
        const effectiveMarginPercent = salePrice > 0 ? (effectiveProfit / salePrice) * 100 : 0;

        // ROI (retorno sobre costes)
        const roi = totalCosts > 0 ? (grossProfit / totalCosts) * 100 : 0;

        return {
            ivaAmount,
            netSalePrice,
            totalCosts,
            grossProfit,
            effectiveProfit,
            maxCpa,
            roasBreakeven,
            marginPercent,
            effectiveMarginPercent,
            roi
        };
    }, [pricingCalc]);

    const storeId = "default-store";

    const loadData = useCallback(async () => {
        if (!data) setLoading(true); // Only show full-page loader on first visit
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s strict timeout

        try {
            const month = date.getMonth() + 1;
            const year = date.getFullYear();

            let url = `/api/finances/accounting?storeId=${storeId}&month=${month}&year=${year}`;
            if (productId) url += `&productId=${productId}`;

            const [accRes, threshRes] = await Promise.all([
                fetch(url, { signal: controller.signal }).then(r => r.json()),
                getActiveThreshold(storeId)
            ]);

            clearTimeout(timeoutId);
            if (accRes && accRes.days) {
                setData(accRes);
            }
            setThreshold(threshRes);

            // Auto-sync logic (only if data loaded successfully)
            if (accRes && !productId) { // Pro-tip: Only auto-sync global view to avoid confusing partial syncs
                const hasData = accRes.days.some((d: any) => d.isComplete || d.spendAds > 0 || d.revenueReal > 0 || d.netProfit !== 0);
                const isPastOrCurrent = new Date(year, month - 1, 1) <= new Date();
                const monthKey = `${month}-${year}`;
                if (!hasData && isPastOrCurrent && !syncing && !syncedMonthsRef.current.has(monthKey)) {
                    console.log("[Auto-Sync] Triggering sync for missing month data");
                    syncedMonthsRef.current.add(monthKey);
                    triggerHistoricalSync(storeId, month, year).catch(console.error);
                }
            }

            // Sync projections state if goal exists
            if (accRes.goal) {
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
            if (error.name === 'AbortError' || error.message === 'Timeout') {
                toast.warning("La carga está tardando. Mostrando interfaz...");
            } else {
                console.error(error);
                toast.error("Error de conexión");
            }
            // Fallback: If data is null, set empty structure to allow rendering
            if (!data) {
                setData({
                    totals: {}, averages: {}, expenses: [], days: [], goal: projections
                });
            }
        } finally {
            setLoading(false);
        }
    }, [date, storeId, syncing, productId]); // added productId dependency

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Auto-refresh cada 60 segundos
    useAutoRefresh(loadData, {
        interval: 60000,
        enabled: !productId, // Only auto-refresh global view for performance
        pauseOnHidden: true
    });

    const handleSync = async () => {
        if (syncing) return;
        setSyncing(true);
        toast.info("Sincronizando datos del día...");
        try {
            // Solo sincronizar el día actual para rapidez
            const res = await fetch(`/api/finances/sync-today?storeId=${storeId}`);
            const result = await res.json();
            console.log("[Quick Sync] Result:", result);
            await loadData();
            toast.success("Datos actualizados");
        } catch (e) {
            console.error("Sync error:", e);
            toast.error("Error en sincronización");
        } finally {
            setSyncing(false);
        }
    };

    const handleExport = (mode: 'manager' | 'analysis') => {
        const url = `/api/finances/export?storeId=${storeId}&month=${date.getMonth() + 1}&year=${date.getFullYear()}&mode=${mode}`;
        window.open(url, "_blank");
    };

    const handleSaveProjections = async () => {
        setSaving(true);
        try {
            await saveMonthlyGoal(storeId, date.getMonth() + 1, date.getFullYear(), projections);
            toast.success("Proyecciones actualizadas");
            await loadData();
        } catch (e) {
            toast.error("Error al guardar proyecciones");
        } finally {
            setSaving(false);
        }
    };

    const handleRebuild = async () => {
        const confirmed = window.confirm("¿Estás seguro? Se reconstruirá TODA la contabilidad desde septiembre 2025. Esto puede tardar varios minutos.");
        if (!confirmed) return;

        const tid = toast.loading("Iniciando reconstrucción total desde 2025-09-01...");
        try {
            const res = await rebuildAccounting(storeId);
            if (res.success) {
                toast.success(res.message, { id: tid });
                await loadData();
            } else {
                toast.error(res.error, { id: tid });
            }
        } catch (e) {
            toast.error("Error al conectar con el servidor", { id: tid });
        }
    };

    if (loading && !data) {

        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] bg-white">
                <div className="relative mb-8">
                    <div className="absolute inset-0 bg-indigo-500/10 blur-[50px] rounded-full animate-pulse" />
                    <Calculator className="h-12 w-12 text-indigo-600 animate-bounce relative z-10" />
                </div>
                <p className="text-slate-900 font-black uppercase tracking-widest text-xs">Cargando Libros Contables...</p>
            </div>
        );
    }

    const t = data?.totals || { revenueReal: 0, netProfit: 0, spendAds: 0, costsReal: 0, orders: 0, delivered: 0, communicationCost: 0, confirmed: 0, cancelled: 0, returned: 0, incidences: 0, recovered: 0, visitors: 0, units: 0, directProfit: 0, revenueConfirmed: 0, cogs: 0 };
    const avg = {
        roasReal: 0,
        profitPercent: 0,
        deliveryRate: 0,
        recoveryRate: 0,
        roasConfirmed: 0,
        profitPercentConfirmed: 0,
        ...(data?.averages || {})
    };
    const insights = data?.insights || [];

    return (
        <div className="min-h-screen bg-[#FDFDFF] p-0 text-slate-900 font-sans selection:bg-indigo-100 overflow-x-hidden">
            {/* Barra Superior de KPIs en Tiempo Real */}
            <div className="fixed top-0 left-0 right-0 z-50 bg-white/60 backdrop-blur-xl border-b border-white/40 h-7 flex items-center px-4 overflow-x-auto no-scrollbar shadow-sm">
                <div className="flex items-center gap-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ROI</span>
                        <Badge className={cn("text-[9px] font-black border-none px-1.5 py-0 h-4", (t.netProfit || 0) > 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700")}>
                            {(((t.netProfit || 0) / ((t.costsReal || 0) + (t.spendAds || 0) || 1)) * 100).toFixed(1)}%
                        </Badge>
                    </div>
                    <div className="h-3 w-px bg-slate-200" />
                    <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">NETO</span>
                        <span className="text-[10px] font-black text-indigo-600 italic">€{(t.netProfit || 0).toLocaleString('es-ES')}</span>
                    </div>
                    <div className="h-3 w-px bg-slate-200" />
                    <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ROAS</span>
                        <span className="text-[10px] font-black text-slate-900">{(avg.roasReal || 0).toFixed(2)}x</span>
                    </div>

                    {data?.goal && (
                        <>
                            <div className="flex items-center gap-2 border-l border-slate-100 pl-8">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-amber-500">PROY. ADSPEND:</span>
                                <span className="text-[10px] font-black text-slate-900">€{(data.goal.adSpendBudget || 0).toLocaleString('es-ES')}</span>
                            </div>
                            <div className="flex items-center gap-2 border-l border-slate-100 pl-8">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-amber-500">PROY. REVENUE:</span>
                                <span className="text-[10px] font-black text-slate-900">€{((data.goal.adSpendBudget || 0) * (data.goal.targetRoas || 0)).toLocaleString('es-ES')}</span>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className="mt-6 max-w-full mx-auto px-1">
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 mb-1 bg-white/80 backdrop-blur-xl p-2 rounded-lg shadow-sm border border-slate-200/50 relative z-50">
                    {/* Left: Title & Version */}
                    <div className="flex items-center gap-2">
                        <div className="h-7 w-7 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-200 rotate-2">
                            <Receipt className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-xs font-black tracking-tighter text-slate-950 uppercase leading-none">
                                NEXO <span className="text-indigo-600">CONTABLE</span>
                            </h1>
                            <span className="text-[6px] font-black text-indigo-400 uppercase tracking-widest mt-0.5">Management Suite v5.1</span>
                        </div>
                    </div>

                    {/* Center: Month Navigation */}
                    <div className="flex items-center gap-1 bg-slate-100/50 p-0.5 rounded-lg border border-slate-200/40">
                        <Button
                            variant="ghost" size="icon"
                            onClick={() => setDate(subMonths(date, 1))}
                            className="h-7 w-7 rounded-md text-slate-500 hover:bg-white hover:text-indigo-600 transition-all active:scale-90"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>

                        <div className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 min-w-[120px] text-center select-none flex flex-col items-center justify-center leading-none">
                            <span>{format(date, "MMMM", { locale: es })}</span>
                            <span className="text-[8px] text-indigo-500 mt-1">{format(date, "yyyy")}</span>
                        </div>

                        <Button
                            variant="ghost" size="icon"
                            onClick={() => setDate(addMonths(date, 1))}
                            className="h-7 w-7 rounded-md text-slate-500 hover:bg-white hover:text-indigo-600 transition-all active:scale-90"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Right: Action Buttons */}
                    <div className="flex items-center justify-end gap-1.5">
                        <Button
                            onClick={handleRebuild}
                            variant="outline"
                            className="h-7 border-rose-200 bg-rose-50/30 text-rose-700 hover:bg-rose-100 rounded-md font-black uppercase text-[8px] tracking-widest px-3 shadow-sm transition-all active:scale-95"
                        >
                            <ShieldCheck className="h-3 w-3 mr-1.5" />
                            LIMPIEZA TOTAL
                        </Button>

                        <Button
                            onClick={async () => {
                                const tid = toast.loading("Reparando datos de pedidos...");
                                try {
                                    const res = await repairMonthOrderItems(date.getMonth() + 1, date.getFullYear());
                                    if (res.success) {
                                        toast.success(res.message, { id: tid });
                                        loadData();
                                    } else {
                                        toast.error(res.message, { id: tid });
                                    }
                                } catch (e) {
                                    toast.error("Error al conectar con el servidor", { id: tid });
                                }
                            }}
                            variant="outline"
                            className="h-7 border-amber-200 bg-amber-50/30 text-amber-700 hover:bg-amber-100 rounded-md font-black uppercase text-[8px] tracking-widest px-3 shadow-sm transition-all active:scale-95"
                        >
                            <History className="h-3 w-3 mr-1.5" />
                            REPARAR MES
                        </Button>


                        <Button
                            onClick={handleSync}
                            disabled={syncing}
                            variant="outline"
                            className="h-7 border-indigo-200 bg-indigo-50/30 text-indigo-700 hover:bg-indigo-100 rounded-md font-black uppercase text-[8px] tracking-widest px-3 shadow-sm transition-all active:scale-95"
                        >
                            <RefreshCw className={cn("h-3 w-3 mr-1.5", syncing && "animate-spin")} />
                            {syncing ? "Calculando..." : "Sincronizar"}
                        </Button>

                        <Button
                            onClick={() => setAlertConfigOpen(true)}
                            variant="outline"
                            className="h-7 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 rounded-md font-black uppercase text-[8px] tracking-widest px-3 shadow-sm transition-all active:scale-95"
                        >
                            <BellRing className="h-3 w-3 mr-1.5" />
                            ALERTAS
                        </Button>

                        <Button
                            onClick={() => handleExport('manager')}
                            className="h-7 bg-slate-900 text-white hover:bg-slate-800 rounded-md font-black uppercase text-[8px] tracking-widest px-4 shadow-md shadow-slate-200 transition-all active:scale-95 border-none"
                        >
                            <Download className="h-3 w-3 mr-1.5" />
                            Exportar
                        </Button>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="ledger" className="space-y-0.5 mt-0.5">
                <TabsList className="bg-slate-100/20 p-0 rounded-md border-none gap-0.5 h-6 w-full md:w-auto">
                    <TabsTrigger value="ledger" className="rounded px-4 h-5 font-black uppercase text-[7px] tracking-widest transition-all">
                        TABLA DIARIA
                    </TabsTrigger>
                    <TabsTrigger value="projections" className="rounded px-4 h-5 font-black uppercase text-[7px] tracking-widest transition-all">
                        METAS
                    </TabsTrigger>
                    <Link href="/finances/products">
                        <TabsTrigger value="products" className="rounded px-4 h-5 font-black uppercase text-[7px] tracking-widest transition-all text-indigo-600 bg-indigo-50/50">
                            COGS / PRODUCTOS
                        </TabsTrigger>
                    </Link>
                </TabsList>


                <TabsContent value="ledger" className="space-y-4">
                    {/* Tabla de Desglose Diario - PREMIUM GLASS */}
                    <Card className="bg-white/40 backdrop-blur-xl border border-white/60 shadow-xl shadow-indigo-500/5 rounded-xl overflow-hidden">
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-slate-50/40 backdrop-blur-sm sticky top-0 z-20">
                                        {/* FILA 1: GRUPOS PRINCIPALES */}
                                        <TableRow className="h-8 border-b border-slate-200">
                                            <TableHead rowSpan={2} className="w-10 text-center font-black text-[9px] uppercase tracking-widest text-slate-500 py-0 px-0.5 sticky left-0 bg-slate-50 z-30 border-r border-slate-200">DÍA</TableHead>

                                            {/* VENTAS - Agrupa: ADS, GASTOS, PROD, VISITAS, PEDIDOS, UNID, CONV%, TKT */}
                                            <TableHead colSpan={8} className="text-center font-black text-[10px] uppercase tracking-widest text-indigo-600 bg-indigo-50/30 border-l-2 border-indigo-200 py-0">
                                                📊 VENTAS
                                            </TableHead>

                                            {/* OPERACIONES - Agrupa: CONF, CANC, ENVÍO+COD, ENTR, DEV, INCID, RECUP, RECUP%, ENVÍO%, ENTR% */}
                                            <TableHead colSpan={10} className="text-center font-black text-[10px] uppercase tracking-widest text-amber-600 bg-amber-50/30 border-l-2 border-amber-200 py-0">
                                                ⚙️ OPERACIONES
                                            </TableHead>

                                            {/* FINANZAS - Agrupa: REV.POSIB, REV.REAL, PROFIT POSIB, PROFIT REAL, %PROFIT, ROI, ROAS, CPA */}
                                            <TableHead colSpan={8} className="text-center font-black text-[10px] uppercase tracking-widest text-emerald-600 bg-emerald-50/30 border-l-2 border-emerald-200 py-0">
                                                💰 FINANZAS
                                            </TableHead>

                                            <TableHead rowSpan={2} className="w-10 text-center font-black text-[9px] uppercase tracking-widest text-slate-500 sticky right-0 bg-slate-50 z-30 shadow-[-4px_0_10px_rgba(0,0,0,0.02)] border-l-2 border-slate-200 py-0 px-0.5">
                                                <span className="block leading-tight">EST</span>
                                                <span className="block leading-tight">ADO</span>
                                            </TableHead>
                                        </TableRow>

                                        {/* FILA 2: SUBCOLUMNAS - DOS LÍNEAS PARA COMPUESTOS, ALINEADOS AL CENTRO */}
                                        <TableRow className="h-8 border-b border-slate-200">
                                            {/* VENTAS */}
                                            <TableHead className="text-center text-[9px] font-black text-slate-700 border-l-2 border-indigo-200 px-1 bg-indigo-50/30 align-middle whitespace-nowrap">
                                                <div className="flex flex-col items-center justify-center leading-tight"><span>GASTO</span><span>ADS</span></div>
                                            </TableHead>
                                            <TableHead className="text-center text-[9px] font-black text-slate-700 px-1 align-middle whitespace-nowrap">
                                                <div className="flex flex-col items-center justify-center leading-tight"><span>GASTOS</span><span>TIENDA</span></div>
                                            </TableHead>
                                            <TableHead className="text-center text-[9px] font-black text-slate-700 px-1 align-middle whitespace-nowrap">PROD</TableHead>
                                            <TableHead className="text-center text-[9px] font-black text-slate-700 px-1 align-middle whitespace-nowrap">
                                                <div className="flex flex-col items-center justify-center leading-tight"><span>LPV</span><span>(META)</span></div>
                                            </TableHead>
                                            <TableHead className="text-center text-[9px] font-black text-slate-700 px-1 align-middle whitespace-nowrap">
                                                <div className="flex flex-col items-center justify-center leading-tight"><span>CLICKS</span><span>(META)</span></div>
                                            </TableHead>

                                            <TableHead className="text-center text-[9px] font-black text-slate-700 px-1 align-middle whitespace-nowrap">PEDIDOS</TableHead>
                                            <TableHead className="text-center text-[9px] font-black text-slate-700 px-1 align-middle whitespace-nowrap">UNID</TableHead>
                                            <TableHead className="text-center text-[9px] font-black text-slate-700 px-1 align-middle whitespace-nowrap">
                                                <div className="flex flex-col items-center justify-center leading-tight"><span>CONV</span><span>%</span></div>
                                            </TableHead>
                                            <TableHead className="text-center text-[9px] font-black text-slate-700 px-1 align-middle whitespace-nowrap">TICKET</TableHead>

                                            {/* OPERACIONES */}
                                            <TableHead className="text-center text-[9px] font-black text-slate-700 border-l-2 border-amber-200 px-1 bg-amber-50/30 align-middle whitespace-nowrap">CONF</TableHead>
                                            <TableHead className="text-center text-[9px] font-black text-slate-700 px-1 align-middle whitespace-nowrap">CANC</TableHead>
                                            <TableHead className="text-center text-[9px] font-black text-slate-700 px-1 align-middle whitespace-nowrap">
                                                <div className="flex flex-col items-center justify-center leading-tight"><span>ENVÍO</span><span>+COD</span></div>
                                            </TableHead>
                                            <TableHead className="text-center text-[9px] font-black text-slate-700 px-1 align-middle whitespace-nowrap">ENTREG</TableHead>
                                            <TableHead className="text-center text-[9px] font-black text-slate-700 px-1 align-middle whitespace-nowrap">DEVOL</TableHead>
                                            <TableHead className="text-center text-[9px] font-black text-rose-700 px-1 align-middle whitespace-nowrap bg-rose-50/20">
                                                <div className="flex flex-col items-center justify-center leading-tight"><span>GASTOS</span><span>DEVO</span></div>
                                            </TableHead>
                                            <TableHead className="text-center text-[9px] font-black text-slate-700 px-1 align-middle whitespace-nowrap">INCID</TableHead>
                                            <TableHead className="text-center text-[9px] font-black text-slate-700 px-1 align-middle whitespace-nowrap">RECUP</TableHead>
                                            <TableHead className="text-center text-[9px] font-black text-slate-700 px-1 align-middle whitespace-nowrap">
                                                <div className="flex flex-col items-center justify-center leading-tight"><span>RECUP</span><span>%</span></div>
                                            </TableHead>
                                            <TableHead className="text-center text-[9px] font-black text-slate-700 px-1 align-middle whitespace-nowrap">
                                                <div className="flex flex-col items-center justify-center leading-tight"><span>ENVÍO</span><span>%</span></div>
                                            </TableHead>
                                            <TableHead className="text-center text-[9px] font-black text-slate-700 px-1 align-middle whitespace-nowrap">
                                                <div className="flex flex-col items-center justify-center leading-tight"><span>ENTREG</span><span>%</span></div>
                                            </TableHead>

                                            {/* FINANZAS */}
                                            <TableHead className="text-center text-[9px] font-black text-slate-700 border-l-2 border-emerald-200 px-1.5 bg-emerald-50/30 align-middle">
                                                <div>FACT</div>
                                                <div>SHOPIFY</div>
                                            </TableHead>
                                            <TableHead className="text-center text-[9px] font-black text-slate-700 px-1.5 align-middle">
                                                <div>FACT</div>
                                                <div>ENTREG</div>
                                            </TableHead>
                                            <TableHead className="text-center text-[9px] font-black text-slate-700 px-1 align-middle whitespace-nowrap">PROFIT</TableHead>
                                            <TableHead className="text-center text-[9px] font-black text-slate-700 px-1 align-middle whitespace-nowrap">
                                                <div className="flex flex-col items-center justify-center leading-tight"><span>MARGEN</span><span>%</span></div>
                                            </TableHead>
                                            <TableHead className="text-center text-[9px] font-black text-slate-700 px-1 align-middle whitespace-nowrap">ROI</TableHead>
                                            <TableHead className="text-center text-[9px] font-black text-slate-700 px-1 align-middle whitespace-nowrap">ROAS</TableHead>
                                            <TableHead className="text-center text-[9px] font-black text-slate-700 px-1 align-middle whitespace-nowrap">CPA</TableHead>
                                        </TableRow>

                                    </TableHeader>
                                    <TableBody>
                                        {data?.days?.map((day: any, i: number) => {
                                            const m = JSON.parse(day.metricsJson || '{}');
                                            const c = m.counts || {};
                                            const f = m.financials || {};
                                            const r = m.rates || {};
                                            const p = day.projection || {};
                                            const dayStr = format(new Date(day.date), 'yyyy-MM-dd');

                                            return (
                                                <TableRow key={i} className="group hover:bg-slate-50/50 transition-all duration-200">
                                                    {/* DÍA */}
                                                    <TableCell className="text-center font-black text-slate-900 py-1.5 sticky left-0 bg-white z-10 group-hover:bg-slate-50 transition-colors">
                                                        <Link href={`/logistics/orders?date=${dayStr}`} className="flex flex-col hover:scale-110 transition-transform">
                                                            <span className="text-sm tracking-tighter leading-none">{format(new Date(day.date), 'dd')}</span>
                                                            <span className="text-[6px] text-slate-400 uppercase tracking-widest font-black leading-none mt-1">{format(new Date(day.date), 'EEE', { locale: es })}</span>
                                                        </Link>
                                                    </TableCell>

                                                    {/* VENTAS: ADS + GASTOS + PROD */}
                                                    <TableCell className="text-center border-l-2 border-indigo-100">
                                                        <span className="text-[12px] font-bold text-slate-700">€{(day.spendAds || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <span className="text-[12px] font-bold text-slate-600">€{(day.dailyExpense || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <span className="text-[12px] font-bold text-slate-600">€{(f.cogs || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                    </TableCell>

                                                    {/* VENTAS: LPV + CLICKS + PEDIDOS + UNID + CONV% + TKT */}
                                                    <TableCell className="text-center">
                                                        <span className="text-[12px] font-bold text-slate-800">{c.lpv || 0}</span>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <span className="text-[12px] font-bold text-slate-600">{c.clicks || 0}</span>
                                                    </TableCell>

                                                    <TableCell className="text-center">
                                                        <span className="text-[12px] font-bold text-slate-800">{c.orders || 0}</span>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <span className="text-[12px] font-bold text-slate-600">{c.units || 0}</span>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Comparison real={f.convRate || 0} est={projections.expectedConvRate} type="percent" />
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Comparison real={f.averageTicket || 0} est={projections.expectedAvgTicket} />
                                                    </TableCell>

                                                    {/* OPERACIONES: CONF + CANC + ENVÍO+COD + ENTR */}
                                                    <TableCell className="text-center border-l-2 border-amber-100">
                                                        <span className="text-[12px] font-bold text-slate-700">{c.confirmed || 0}</span>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <span className="text-[12px] font-bold text-slate-500">{c.cancelled || 0}</span>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <span className="text-[12px] font-bold text-slate-600">€{((f.shipping || 0) + (f.codFees || 0)).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <span className="text-[12px] font-bold text-slate-700">{c.delivered || 0}</span>
                                                    </TableCell>

                                                    {/* OPERACIONES: DEV + INCID + RECUP + RECUP% + ENVÍO% + ENTR% */}
                                                    <TableCell className="text-center">
                                                        <span className="text-[12px] font-bold text-slate-500">{c.returned || 0}</span>
                                                    </TableCell>
                                                    <TableCell className="text-center bg-rose-50/10">
                                                        <span className="text-[12px] font-bold text-rose-600">€{(f.returnLoss || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <span className="text-[12px] font-bold text-slate-500">{c.incidences || 0}</span>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <span className="text-[12px] font-bold text-slate-600">{c.recovered || 0}</span>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <span className="text-[12px] font-bold text-slate-600">{(r.recoveryRate || 0).toFixed(1)}%</span>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <span className="text-[12px] font-bold text-slate-600">{(r.shipmentRate || 0).toFixed(1)}%</span>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <span className="text-[12px] font-bold text-slate-600">{(day.deliveryRate || 0).toFixed(1)}%</span>
                                                    </TableCell>

                                                    {/* FINANZAS: REV.POSIB + REV.REAL */}
                                                    <TableCell className="text-center border-l-2 border-emerald-100">
                                                        <span className="text-[12px] font-bold text-slate-700">€{(f.revenueConfirmed || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <span className="text-[12px] font-bold text-slate-700">€{(day.revenueReal || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                    </TableCell>

                                                    {/* FINANZAS: PROFIT + %PROFIT + ROI + ROAS + CPA */}
                                                    <TableCell className="text-center">
                                                        <Comparison real={day.netProfit} est={0} color={day.netProfit > 0 ? "emerald" : "rose"} />
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <span className={`text-[12px] font-bold ${day.revenueReal > 0 && (day.netProfit / day.revenueReal * 100) > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                                                            {day.revenueReal > 0 ? (day.netProfit / day.revenueReal * 100).toFixed(1) : 0}%
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Comparison real={f.roiReal || 0} est={0} type="percent" color={f.roiReal > 0 ? "emerald" : "rose"} />
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Comparison real={day.roasReal} est={p.roas} type="x" color={day.roasReal >= (p.breakevenRoas || 3) ? "emerald" : "rose"} />
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Comparison real={day.spendAds > 0 ? day.spendAds / (c.orders || 1) : 0} est={p.cpa} />
                                                    </TableCell>

                                                    {/* ESTADO */}
                                                    <TableCell className="text-center sticky right-0 bg-white z-10 group-hover:bg-slate-50 shadow-[-4px_0_10px_rgba(0,0,0,0.02)] border-l-2 border-slate-200">
                                                        <StatusIndicator status={day.status} incomplete={!day.isComplete} />
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                        {/* Footer con colores neutros y bordes de grupo */}
                                        <TableRow className="bg-slate-50 hover:bg-slate-100 border-t-2 border-slate-200 select-none transition-colors font-black text-[9px] uppercase tracking-wider">
                                            {/* DÍA */}
                                            <TableCell className="text-center sticky left-0 bg-slate-50 z-20 border-r border-slate-200">TOTAL</TableCell>

                                            {/* VENTAS: ADS + GASTOS + PROD + VISIT + PEDIDOS + UNID + CONV% + TKT */}
                                            <TableCell className="text-center text-slate-700 border-l-2 border-indigo-100">€{(t.spendAds || 0).toLocaleString('es-ES')}</TableCell>
                                            <TableCell className="text-center text-slate-600">€{(data?.totalExpenses || 0).toLocaleString('es-ES')}</TableCell>
                                            <TableCell className="text-center text-slate-600">€{(t.cogs || 0).toLocaleString('es-ES')}</TableCell>
                                            <TableCell className="text-center text-slate-700">{(t.visitors || 0).toLocaleString('es-ES')}</TableCell>
                                            <TableCell className="text-center text-slate-700">{(t.orders || 0).toLocaleString('es-ES')}</TableCell>
                                            <TableCell className="text-center text-slate-600">{(t.units || 0).toLocaleString('es-ES')}</TableCell>
                                            <TableCell className="text-center text-slate-700 font-bold bg-indigo-50/20 italic">
                                                {(data.days.filter((d: any) => JSON.parse(d.metricsJson || '{}').financials?.convRate > 0).reduce((acc: number, d: any) => acc + JSON.parse(d.metricsJson || '{}').financials.convRate, 0) / (data.days.filter((d: any) => JSON.parse(d.metricsJson || '{}').financials?.convRate > 0).length || 1)).toFixed(2)}%
                                            </TableCell>
                                            <TableCell className="text-center text-slate-700 font-bold bg-indigo-50/20 italic">
                                                €{(data.days.filter((d: any) => JSON.parse(d.metricsJson || '{}').financials?.averageTicket > 0).reduce((acc: number, d: any) => acc + JSON.parse(d.metricsJson || '{}').financials.averageTicket, 0) / (data.days.filter((d: any) => JSON.parse(d.metricsJson || '{}').financials?.averageTicket > 0).length || 1)).toFixed(0)}
                                            </TableCell>

                                            {/* OPERACIONES: CONF + CANC + ENV+COD + ENTR + DEVOL + GASTOS DEVO + INCID + RECUP + RECUP% + ENVÍO% + ENTR% */}
                                            <TableCell className="text-center text-slate-700 border-l-2 border-amber-100">{t.confirmed || 0}</TableCell>
                                            <TableCell className="text-center text-slate-500">{t.cancelled || 0}</TableCell>
                                            <TableCell className="text-center text-slate-600">€{(t.shipping || 0).toLocaleString('es-ES')}</TableCell>
                                            <TableCell className="text-center text-slate-700">{t.delivered || 0}</TableCell>
                                            <TableCell className="text-center text-slate-500">{t.returned || 0}</TableCell>
                                            <TableCell className="text-center text-rose-600 italic">€{(t.returnLoss || 0).toLocaleString('es-ES')}</TableCell>
                                            <TableCell className="text-center text-slate-500">{t.incidences || 0}</TableCell>
                                            <TableCell className="text-center text-slate-600">{t.recovered || 0}</TableCell>

                                            {/* TASAS MEDIAS (Mathematical averages of daily rates) */}
                                            <TableCell className="text-center text-slate-700 font-bold bg-amber-50/20 italic">
                                                {(data.days.filter((d: any) => JSON.parse(d.metricsJson || '{}').rates?.recoveryRate > 0).reduce((acc: number, d: any) => acc + JSON.parse(d.metricsJson || '{}').rates.recoveryRate, 0) / (data.days.filter((d: any) => JSON.parse(d.metricsJson || '{}').rates?.recoveryRate > 0).length || 1)).toFixed(1)}%
                                            </TableCell>
                                            <TableCell className="text-center text-slate-700 font-bold bg-amber-50/20 italic">
                                                {(data.days.filter((d: any) => JSON.parse(d.metricsJson || '{}').rates?.shipmentRate > 0).reduce((acc: number, d: any) => acc + JSON.parse(d.metricsJson || '{}').rates.shipmentRate, 0) / (data.days.filter((d: any) => JSON.parse(d.metricsJson || '{}').rates?.shipmentRate > 0).length || 1)).toFixed(1)}%
                                            </TableCell>
                                            <TableCell className="text-center text-slate-700 font-bold bg-amber-50/20 italic">
                                                {(data.days.filter((d: any) => d.deliveryRate > 0).reduce((acc: number, d: any) => acc + d.deliveryRate, 0) / (data.days.filter((d: any) => d.deliveryRate > 0).length || 1)).toFixed(1)}%
                                            </TableCell>

                                            {/* FINANZAS: FACTURADO + FACT ENTREG + PROFIT + %PROFIT + ROI + ROAS + CPA */}
                                            <TableCell className="text-center text-slate-700 border-l-2 border-emerald-100">€{(t.revenueConfirmed || 0).toLocaleString('es-ES')}</TableCell>
                                            <TableCell className="text-center text-slate-700">€{(t.revenueReal || 0).toLocaleString('es-ES')}</TableCell>
                                            <TableCell className="text-center text-slate-700">€{(t.netProfit || 0).toLocaleString('es-ES')}</TableCell>
                                            <TableCell className="text-center text-slate-600">{(avg.profitPercentConfirmed || 0).toFixed(1)}%</TableCell>
                                            <TableCell className="text-center text-slate-600">{((t.netProfit || 0) / ((t.costsReal || 0) + (t.spendAds || 0) || 1) * 100).toFixed(1)}%</TableCell>
                                            <TableCell className="text-center text-slate-600">{(avg.roasConfirmed || 0).toFixed(2)}x</TableCell>
                                            <TableCell className="text-center text-slate-600">€{((t.spendAds || 0) / (t.orders || 1)).toFixed(2)}</TableCell>

                                            {/* ESTADO */}
                                            <TableCell className="sticky right-0 bg-slate-50/80 backdrop-blur-sm z-20 border-l-2 border-slate-200" />
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 mt-2">
                        {/* Panel de Insights (Asesor) - GLASS PRO */}
                        <div className="lg:col-span-4 flex flex-col gap-4">
                            <div className="bg-slate-900/95 backdrop-blur-xl rounded-xl p-5 border border-white/10 shadow-2xl relative overflow-hidden group">
                                {/* Ambient Glow */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl -z-10 group-hover:bg-indigo-500/30 transition-all" />

                                <div className="flex items-center justify-between mb-4 relative z-10">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white flex items-center gap-2">
                                        <Globe className="h-4 w-4 text-indigo-400 animate-pulse" />
                                        CLOWDBOT AI <span className="text-slate-500">v2.0</span>
                                    </h3>
                                    <Badge className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-black text-[8px] uppercase tracking-widest rounded-lg px-2 py-0.5">LIVE ANALYSIS</Badge>
                                </div>

                                <div className="space-y-3 relative z-10 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent pr-2">
                                    {insights.length === 0 ? (
                                        <div className="p-8 rounded-xl border border-dashed border-white/10 text-center flex flex-col items-center justify-center opacity-40">
                                            <Zap className="h-6 w-6 text-white mb-2" />
                                            <p className="text-[9px] font-black text-white uppercase tracking-widest">Awaiting data stream...</p>
                                        </div>
                                    ) : (
                                        insights.map((insight: any, i: number) => (
                                            <div key={i} className={cn(
                                                "p-3 rounded-lg border transition-all hover:translate-x-1",
                                                insight.level === 'CRITICAL' ? "bg-rose-500/10 border-rose-500/20 text-rose-200" :
                                                    insight.level === 'WARNING' ? "bg-amber-500/10 border-amber-500/20 text-amber-200" :
                                                        insight.level === 'OPTIMAL' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-200" :
                                                            "bg-indigo-500/10 border-indigo-500/20 text-indigo-200"
                                            )}>
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="space-y-1">
                                                        <p className="text-[9px] font-black uppercase tracking-tight opacity-90">{insight.title}</p>
                                                        <p className="text-[9px] font-medium leading-relaxed opacity-70">{insight.description}</p>
                                                    </div>
                                                    {insight.action && (
                                                        <Badge className="bg-white/10 text-[7px] font-black uppercase text-white border-none whitespace-nowrap px-1.5 hover:bg-white/20 cursor-pointer">
                                                            {insight.action}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* KPIs Secundarios */}
                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-white/80 p-2 rounded-lg shadow-sm border border-slate-100 group hover:border-indigo-200 transition-colors">
                                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Costo Mensajería</p>
                                    <p className="text-base font-black text-slate-900 italic">€{t.communicationCost?.toFixed(2) || '0.00'}</p>
                                </div>
                                <div className="bg-white/80 p-2 rounded-lg shadow-sm border border-slate-100 group hover:border-indigo-200 transition-colors">
                                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Pedidos Mes</p>
                                    <p className="text-base font-black text-slate-900 italic">{t.orders}</p>
                                </div>
                            </div>
                        </div>

                        {/* Tarjetas Principales de Resumen - AHORA ABAJO */}
                        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <SummaryCard
                                title="VENTAS REALES"
                                value={t.revenueReal}
                                sub="CONSOLIDADO TRUTH LAYER"
                                icon={Globe}
                                color="indigo"
                                gradient="from-indigo-600 to-indigo-700"
                            />
                            <SummaryCard
                                title="BENEFICIO NETO"
                                value={t.netProfit}
                                sub={`${avg.profitPercent.toFixed(1)}% MARGEN NETO REAL`}
                                icon={Wallet}
                                color={t.netProfit > 0 ? "emerald" : "rose"}
                                trend={`${avg.profitPercent.toFixed(1)}%`}
                                gradient={t.netProfit > 0 ? "from-emerald-600 to-teal-700" : "from-rose-600 to-orange-700"}
                            />
                            <SummaryCard
                                title="INVERSIÓN ADS"
                                value={t.spendAds}
                                sub={`${avg.roasReal.toFixed(2)}x ROAS PROMEDIO`}
                                icon={Zap}
                                color="rose"
                                gradient="from-rose-500 to-violet-600"
                            />
                            <SummaryCard
                                title="EFICIENCIA"
                                value={`${avg.deliveryRate.toFixed(1)}%`}
                                sub={`${t.delivered} ENTREGADOS REALES`}
                                icon={CheckCircle2}
                                color="slate"
                                isRaw
                                gradient="from-slate-700 to-slate-900"
                            />
                        </div>

                        {/* TARJETA DE GASTOS FIJOS */}
                        <div className="lg:col-span-12">
                            <Card className="bg-gradient-to-br from-violet-50/50 to-purple-50/30 border-violet-100/50">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-xs font-black uppercase tracking-widest text-violet-700 flex items-center gap-2">
                                            <Receipt className="h-4 w-4" />
                                            GASTOS FIJOS MENSUALES
                                        </CardTitle>
                                        <Badge className="bg-violet-600 text-white text-[8px] font-black">
                                            €{(data?.totalExpenses || 0).toLocaleString('es-ES')} TOTAL
                                        </Badge>
                                    </div>
                                    <CardDescription className="text-[9px] text-violet-500/70 font-bold uppercase tracking-widest">
                                        Se prorratean automáticamente entre los días del mes • €{(data?.dailyExpense || 0).toFixed(2)}/día
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pt-2">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Lista de Gastos Actuales */}
                                        <div className="space-y-2">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-violet-400">Gastos del Mes</p>
                                            <div className="max-h-32 overflow-y-auto space-y-1">
                                                {(data?.expenses || []).length === 0 ? (
                                                    <p className="text-[10px] text-violet-300 italic py-4 text-center">Sin gastos registrados</p>
                                                ) : (
                                                    (data?.expenses || []).map((exp: any) => (
                                                        <div key={exp.id} className="flex items-center justify-between bg-white/60 rounded-lg px-2 py-1.5 group hover:bg-white transition-all">
                                                            <div className="flex items-center gap-2">
                                                                <Badge variant="outline" className="text-[7px] uppercase font-bold border-violet-200 text-violet-600">{exp.category}</Badge>
                                                                <span className="text-[10px] font-medium text-slate-700">{exp.description || exp.category}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[11px] font-black text-violet-600">€{exp.amount.toFixed(2)}</span>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity text-rose-400 hover:text-rose-600 hover:bg-rose-50"
                                                                    onClick={async () => {
                                                                        // Optimistic Delete
                                                                        const oldData = { ...data };
                                                                        const filtered = (data?.expenses || []).filter((e: any) => e.id !== exp.id);
                                                                        const newTotal = filtered.reduce((acc: number, e: any) => acc + e.amount, 0);
                                                                        setData({ ...data, expenses: filtered, totalExpenses: newTotal });

                                                                        try {
                                                                            await fetch(`/api/finances/expenses?id=${exp.id}`, { method: 'DELETE' });
                                                                            // Silent re-fetch to ensure sync
                                                                            loadData();
                                                                        } catch (e) {
                                                                            toast.error("Error al eliminar");
                                                                            setData(oldData); // Revert on error
                                                                        }
                                                                    }}
                                                                >
                                                                    <RotateCcw className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>

                                            {/* Gasto Publicitario Automático */}
                                            <div className="pt-2 border-t border-violet-100/50">
                                                <div className="flex items-center justify-between bg-gradient-to-r from-rose-50 to-violet-50 rounded-lg px-2 py-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <Zap className="h-3 w-3 text-rose-500" />
                                                        <span className="text-[10px] font-bold text-slate-700">Gasto Publicitario (Auto)</span>
                                                    </div>
                                                    <span className="text-[11px] font-black text-rose-600">€{t.spendAds.toLocaleString('es-ES')}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Formulario Añadir Gasto */}
                                        <div className="space-y-2 bg-white/40 rounded-xl p-3">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-violet-400">Añadir Nuevo Gasto</p>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <Label className="text-[8px] text-violet-500">Categoría</Label>
                                                    <Input
                                                        id="expense-category"
                                                        placeholder="Ej: Hosting"
                                                        className="h-7 text-[10px] bg-white"
                                                        value={newExpense.category}
                                                        onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-[8px] text-violet-500">Importe (€)</Label>
                                                    <Input
                                                        id="expense-amount"
                                                        type="number"
                                                        placeholder="0.00"
                                                        className="h-7 text-[10px] bg-white"
                                                        value={newExpense.amount}
                                                        onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                            <Input
                                                id="expense-description"
                                                placeholder="Descripción (opcional)"
                                                className="h-7 text-[10px] bg-white"
                                                value={newExpense.description}
                                                onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                                            />
                                            <Button
                                                size="sm"
                                                disabled={loading || !newExpense.category || !newExpense.amount}
                                                className="w-full h-7 bg-violet-600 hover:bg-violet-700 text-white text-[9px] font-black uppercase tracking-widest"
                                                onClick={async () => {
                                                    if (!newExpense.category || !newExpense.amount) {
                                                        toast.error("Categoría e importe son obligatorios");
                                                        return;
                                                    }

                                                    const amountVal = parseFloat(newExpense.amount);
                                                    const tempId = Math.random().toString(36).substr(2, 9);
                                                    const month = date.getMonth() + 1;
                                                    const year = date.getFullYear();

                                                    // Optimistic Add
                                                    const oldData = { ...data };
                                                    const newExpObj = {
                                                        id: tempId,
                                                        storeId,
                                                        category: newExpense.category,
                                                        amount: amountVal,
                                                        description: newExpense.description,
                                                        date: new Date() // Temp date
                                                    };

                                                    const updatedExpenses = [...(data?.expenses || []), newExpObj];
                                                    const newTotal = updatedExpenses.reduce((acc: number, e: any) => acc + e.amount, 0);

                                                    setData({ ...data, expenses: updatedExpenses, totalExpenses: newTotal });
                                                    setNewExpense({ category: '', amount: '', description: '' });
                                                    toast.success("Gasto añadido (Sincronizando...)");

                                                    try {
                                                        await fetch('/api/finances/expenses', {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({
                                                                storeId,
                                                                category: newExpense.category,
                                                                amount: amountVal,
                                                                description: newExpense.description,
                                                                date: new Date(year, month - 1, 15)
                                                            })
                                                        });
                                                        await loadData(); // Confirm with real ID
                                                    } catch (e) {
                                                        toast.error("Error al añadir gasto");
                                                        setData(oldData); // Revert
                                                    }
                                                }}
                                            >
                                                + Añadir Gasto
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="projections">
                    <Card className="bg-white/60 backdrop-blur-xl border-none rounded-[2.5rem] shadow-sm border border-white/30 overflow-hidden mb-20">
                        <CardHeader className="p-8 border-b border-slate-100/50">
                            <CardTitle className="text-xl font-black uppercase tracking-tighter flex items-center gap-3">
                                <Target className="h-6 w-6 text-amber-500" />
                                CONFIGURACIÓN DE METAS Y ESTIMACIONES
                            </CardTitle>
                            <CardDescription className="text-slate-400 font-bold uppercase text-[8px] tracking-[0.3em] mt-2">
                                ESTABLECE LOS OBJETIVOS MENSUALES PARA CALCULAR ESTIMACIONES DIARIAS Y ROAS BREAKEVEN
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Presupuesto AdSpend Mensual</Label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                            <Input
                                                type="number"
                                                className="pl-10 h-12 rounded-xl bg-white border-slate-200 font-black"
                                                value={projections.adSpendBudget}
                                                onChange={e => setProjections({ ...projections, adSpendBudget: Number(e.target.value) })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">ROAS Objetivo (x)</Label>
                                        <div className="relative">
                                            <Zap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                            <Input
                                                type="number"
                                                step="0.1"
                                                className="pl-10 h-12 rounded-xl bg-white border-slate-200 font-black"
                                                value={projections.targetRoas}
                                                onChange={e => setProjections({ ...projections, targetRoas: Number(e.target.value) })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 text-rose-500">ROAS Breakeven (x)</Label>
                                        <div className="relative">
                                            <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-rose-400" />
                                            <Input
                                                type="number"
                                                step="0.1"
                                                className="pl-10 h-12 rounded-xl bg-white border-rose-100 font-black text-rose-600"
                                                value={projections.breakevenRoas}
                                                onChange={e => setProjections({ ...projections, breakevenRoas: Number(e.target.value) })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Max CPA Permitido (€)</Label>
                                        <div className="relative">
                                            <Target className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                            <Input
                                                type="number"
                                                step="0.1"
                                                className="pl-10 h-12 rounded-xl bg-white border-slate-200 font-black"
                                                value={projections.maxCpa}
                                                onChange={e => setProjections({ ...projections, maxCpa: Number(e.target.value) })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Ticket Medio Esperado (€)</Label>
                                        <div className="relative">
                                            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                            <Input
                                                type="number"
                                                className="pl-10 h-12 rounded-xl bg-white border-slate-200 font-black"
                                                value={projections.expectedAvgTicket}
                                                onChange={e => setProjections({ ...projections, expectedAvgTicket: Number(e.target.value) })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Tasa Conversión Esperada (%)</Label>
                                        <div className="relative">
                                            <MousePointer2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                            <Input
                                                type="number"
                                                step="0.01"
                                                className="pl-10 h-12 rounded-xl bg-white border-slate-200 font-black"
                                                value={projections.expectedConvRate}
                                                onChange={e => setProjections({ ...projections, expectedConvRate: Number(e.target.value) })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-12 flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                <div className="flex gap-10">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Facturación Est. Mes</span>
                                        <span className="text-xl font-black italic">€{((projections.adSpendBudget || 0) * (projections.targetRoas || 0)).toLocaleString('es-ES')}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pedidos Est. Mes</span>
                                        <span className="text-xl font-black italic">{(projections.expectedAvgTicket > 0 ? ((projections.adSpendBudget || 0) * (projections.targetRoas || 0) / projections.expectedAvgTicket) : 0).toFixed(0)}</span>
                                    </div>
                                </div>
                                <Button
                                    onClick={handleSaveProjections}
                                    disabled={saving}
                                    className="h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest px-10 shadow-xl shadow-indigo-100 transition-all"
                                >
                                    <ShieldCheck className="h-5 w-5 mr-3" />
                                    {saving ? "Guardando..." : "Guardar Configuración"}
                                </Button>
                            </div>

                            {/* CALCULADORA DE PRICING */}
                            <div className="mt-16 border-t border-slate-200 pt-10">
                                <div className="flex items-center gap-3 mb-8">
                                    <Calculator className="h-6 w-6 text-emerald-500" />
                                    <h3 className="text-xl font-black uppercase tracking-tighter">Calculadora de Pricing por Oferta</h3>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* Inputs */}
                                    <div className="space-y-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nombre Producto</Label>
                                                <Input
                                                    placeholder="Ej: Masajeador Facial"
                                                    className="h-10 bg-white"
                                                    value={pricingCalc.productName}
                                                    onChange={e => setPricingCalc({ ...pricingCalc, productName: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nombre Oferta</Label>
                                                <Input
                                                    placeholder="Ej: 1+1 Gratis"
                                                    className="h-10 bg-white"
                                                    value={pricingCalc.offerName}
                                                    onChange={e => setPricingCalc({ ...pricingCalc, offerName: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Precio Venta (€)</Label>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    className="h-10 bg-white border-emerald-200 text-emerald-700 font-bold"
                                                    value={pricingCalc.salePrice || ''}
                                                    onChange={e => setPricingCalc({ ...pricingCalc, salePrice: Number(e.target.value) })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-rose-600">Coste Producto (€)</Label>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    className="h-10 bg-white border-rose-200 text-rose-600 font-bold"
                                                    value={pricingCalc.productCost || ''}
                                                    onChange={e => setPricingCalc({ ...pricingCalc, productCost: Number(e.target.value) })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">IVA (%)</Label>
                                                <Input
                                                    type="number"
                                                    step="0.1"
                                                    className="h-10 bg-white"
                                                    value={pricingCalc.iva || ''}
                                                    onChange={e => setPricingCalc({ ...pricingCalc, iva: Number(e.target.value) })}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Coste Envío (€)</Label>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    className="h-10 bg-white"
                                                    value={pricingCalc.shippingCost || ''}
                                                    onChange={e => setPricingCalc({ ...pricingCalc, shippingCost: Number(e.target.value) })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Comisión COD (€)</Label>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    className="h-10 bg-white"
                                                    value={pricingCalc.codFee || ''}
                                                    onChange={e => setPricingCalc({ ...pricingCalc, codFee: Number(e.target.value) })}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-amber-600">% Envío (Confirmados)</Label>
                                                <Input
                                                    type="number"
                                                    step="1"
                                                    className="h-10 bg-white border-amber-200"
                                                    value={pricingCalc.shipmentRate || ''}
                                                    onChange={e => setPricingCalc({ ...pricingCalc, shipmentRate: Number(e.target.value) })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-indigo-600">% Entrega (Entregados)</Label>
                                                <Input
                                                    type="number"
                                                    step="1"
                                                    className="h-10 bg-white border-indigo-200"
                                                    value={pricingCalc.deliveryRate || ''}
                                                    onChange={e => setPricingCalc({ ...pricingCalc, deliveryRate: Number(e.target.value) })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Resultados Calculados */}
                                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-2xl">
                                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Resultados Calculados</h4>

                                        {calcResults ? (
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="bg-slate-700/50 p-4 rounded-xl">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">CPA Máximo</span>
                                                        <span className="text-2xl font-black text-emerald-400">€{calcResults.maxCpa.toFixed(2)}</span>
                                                    </div>
                                                    <div className="bg-slate-700/50 p-4 rounded-xl">
                                                        <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest block mb-1">ROAS Breakeven</span>
                                                        <span className="text-2xl font-black text-rose-400">{calcResults.roasBreakeven.toFixed(2)}x</span>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-3 gap-3">
                                                    <div className="bg-slate-700/30 p-3 rounded-lg text-center">
                                                        <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Profit Bruto</span>
                                                        <span className={cn("text-lg font-black", calcResults.grossProfit >= 0 ? "text-emerald-400" : "text-rose-400")}>
                                                            €{calcResults.grossProfit.toFixed(2)}
                                                        </span>
                                                    </div>
                                                    <div className="bg-slate-700/30 p-3 rounded-lg text-center">
                                                        <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Profit Efectivo</span>
                                                        <span className={cn("text-lg font-black", calcResults.effectiveProfit >= 0 ? "text-emerald-400" : "text-rose-400")}>
                                                            €{calcResults.effectiveProfit.toFixed(2)}
                                                        </span>
                                                    </div>
                                                    <div className="bg-slate-700/30 p-3 rounded-lg text-center">
                                                        <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Total Costes</span>
                                                        <span className="text-lg font-black text-amber-400">€{calcResults.totalCosts.toFixed(2)}</span>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-700">
                                                    <div className="text-center">
                                                        <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Margen Bruto</span>
                                                        <span className="text-sm font-black text-white">{calcResults.marginPercent.toFixed(1)}%</span>
                                                    </div>
                                                    <div className="text-center">
                                                        <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Margen Efectivo</span>
                                                        <span className="text-sm font-black text-white">{calcResults.effectiveMarginPercent.toFixed(1)}%</span>
                                                    </div>
                                                    <div className="text-center">
                                                        <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">ROI</span>
                                                        <span className="text-sm font-black text-white">{calcResults.roi.toFixed(1)}%</span>
                                                    </div>
                                                </div>

                                                {pricingCalc.iva > 0 && (
                                                    <div className="text-[10px] text-slate-400 italic mt-4">
                                                        IVA incluido: €{calcResults.ivaAmount.toFixed(2)} ({pricingCalc.iva}%)
                                                    </div>
                                                )}

                                                {/* Botón Guardar Oferta */}
                                                <Button
                                                    onClick={async () => {
                                                        if (!pricingCalc.productName || !calcResults) return;
                                                        try {
                                                            const res = await fetch('/api/pricing-offers', {
                                                                method: 'POST',
                                                                headers: { 'Content-Type': 'application/json' },
                                                                body: JSON.stringify({
                                                                    storeId,
                                                                    ...pricingCalc,
                                                                    ...calcResults
                                                                })
                                                            });
                                                            if (res.ok) {
                                                                toast.success('Oferta guardada correctamente');
                                                                setPricingCalc({ ...pricingCalc, productName: '', offerName: '' });
                                                            } else {
                                                                toast.error('Error al guardar oferta');
                                                            }
                                                        } catch (e) {
                                                            toast.error('Error de conexión');
                                                        }
                                                    }}
                                                    disabled={!pricingCalc.productName || !calcResults}
                                                    className="w-full mt-4 h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest rounded-xl"
                                                >
                                                    <ShieldCheck className="h-4 w-4 mr-2" />
                                                    Guardar Oferta
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-48 text-slate-500">
                                                <Calculator className="h-12 w-12 mb-4 opacity-30" />
                                                <p className="text-xs font-black uppercase tracking-widest">Introduce un precio de venta para calcular</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>


            {/* Agente IA Financiero */}
            <FinanceAgentChat monthlyData={data ? { totals: t, averages: avg } : undefined} />

            <AlertConfigPanel
                storeId="default-store"
                isOpen={alertConfigOpen}
                onClose={() => setAlertConfigOpen(false)}
                onSave={(newThresholds) => {
                    setAlertThresholds(newThresholds);
                    loadData(); // Reload to refresh insights if needed
                }}
            />

        </div>
    );
}

function Comparison({ real, est, type = 'currency', suffix = '', color = 'slate' }: any) {
    const isCurrency = type === 'currency';
    const formatValue = (val: any) => {
        const num = Number(val) || 0;
        if (isCurrency) return `€${num.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        if (type === 'percent') return num.toFixed(2) + '%';
        if (type === 'x') return num.toFixed(2) + 'x';
        if (type === 'raw') return num.toLocaleString('es-ES');
        return num.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + suffix;
    };

    // Semáforo colors based on color prop
    const getColorClass = () => {
        switch (color) {
            case 'emerald': return "text-emerald-600 bg-emerald-50/50";
            case 'rose': return "text-rose-600 bg-rose-50/50";
            case 'amber': return "text-amber-600 bg-amber-50/50";
            case 'indigo': return "text-indigo-600 bg-indigo-50/50";
            default: return "text-slate-900";
        }
    };

    return (
        <div className="flex flex-col items-center justify-center whitespace-nowrap leading-none">
            <span className={cn("text-[10px] font-bold px-1 py-0 rounded", getColorClass())}>
                {formatValue(real)}
            </span>
            {est > 0 && (
                <span className="text-[6.5px] font-black text-slate-300 uppercase leading-none mt-0.5">M: {formatValue(est)}</span>
            )}
        </div>
    );
}



function SummaryCard({ title, value, sub, icon: Icon, color, trend, isRaw = false, gradient }: any) {
    const iconColors: any = {
        indigo: "text-indigo-600",
        emerald: "text-emerald-600",
        rose: "text-rose-600",
        slate: "text-slate-600"
    };

    return (
        <Card className="bg-white border-none rounded-xl shadow-sm hover:shadow-md transition-all duration-500 overflow-hidden group border border-slate-100">
            <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-[0.03] transition-opacity duration-700", gradient)} />
            <CardContent className="p-4 relative z-10">
                <div className="flex items-center justify-between mb-2">
                    <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center bg-slate-50 group-hover:scale-110 transition-transform duration-500", iconColors[color])}>
                        <Icon className="h-5 w-5" />
                    </div>
                    {trend && (
                        <div className={cn(
                            "flex items-center gap-1 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest shadow-sm",
                            trend.startsWith('-') ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
                        )}>
                            {trend.startsWith('-') ? <ArrowDownRight className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                            {trend}
                        </div>
                    )}
                </div>
                <div className="space-y-0.5">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{title}</p>
                    <div className="flex items-baseline gap-0.5">
                        <span className="text-2xl font-black tracking-tighter text-slate-950 italic group-hover:tracking-normal transition-all duration-700">
                            {isRaw ? value : new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)}
                        </span>
                    </div>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest italic opacity-70 group-hover:opacity-100 transition-opacity">{sub}</p>
                </div>
            </CardContent>
        </Card>
    );
}

function StatusIndicator({ status, incomplete, large = false }: { status: string, incomplete?: boolean, large?: boolean }) {
    const colors: any = {
        GREEN: "bg-emerald-500",
        YELLOW: "bg-amber-500",
        RED: "bg-rose-500",
        INCOMPLETE: "bg-slate-300",
        NEUTRAL: "bg-slate-200"
    };

    const icon = incomplete ? (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger>
                    <AlertCircle className={cn("text-slate-400", large ? "h-6 w-6" : "h-4 w-4")} />
                </TooltipTrigger>
                <TooltipContent className="bg-slate-900 text-white border-none p-3 rounded-xl max-w-xs text-[10px] font-bold uppercase tracking-widest">
                    Datos incompletos detectados para este día. El estado puede variar.
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    ) : (
        <div className={cn("rounded-full animate-pulse shadow-sm", colors[status] || colors.NEUTRAL, large ? "h-6 w-6" : "h-3 w-3")} />
    );

    return (
        <div className="flex items-center justify-center">
            {icon}
        </div>
    );
}

function renderCompleteness(json: string | null) {
    if (!json) return null;
    let data;
    try {
        data = JSON.parse(json);
    } catch (e) { return null; }

    return (
        <div className="flex items-center justify-center gap-1">
            <CompletenessDot active={data.ads} label="Ads" />
            <CompletenessDot active={data.shopify} label="Shopify" />
            <CompletenessDot active={data.logistics} label="Logística" />
            <CompletenessDot active={data.costs} label="Costes" />
        </div>
    );
}

function CompletenessDot({ active, label }: { active: boolean, label: string }) {
    if (active) return null; // Show nothing if OK
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger>
                    <div className="h-1.5 w-1.5 rounded-full bg-rose-400 border border-none animate-pulse" />
                </TooltipTrigger>
                <TooltipContent>
                    <p className="text-[10px] font-bold text-rose-500 uppercase">Falta {label}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
