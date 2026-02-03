"use client";

import { useState, useEffect } from "react";
import {
    BarChart3, TrendingUp, Users, Truck,
    Smartphone, Package, Bot, Calendar,
    ChevronRight, ArrowUpRight, ArrowDownRight,
    Search, Filter, Download, Zap, RefreshCw,
    ShieldCheck, Target, Award, ShoppingBag,
    Percent, CreditCard, AlertCircle, RotateCcw,
    Gauge, DollarSign, Activity, BarChart4
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAdvancedKPIs } from "@/app/analytics/actions";
import { cn } from "@/lib/utils";

export default function PerformanceMasterPage() {
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<any>("MONTH");
    const [data, setData] = useState<any>(null);

    const loadKPIs = async (p: string) => {
        setLoading(true);
        const res = await getAdvancedKPIs(p as any);
        if (res.success) {
            setData(res.summary);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadKPIs(period);
    }, [period]);

    if (loading && !data) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <RefreshCw className="h-10 w-10 text-primary animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Sincronizando Inteligencia de Datos...</p>
        </div>
    );

    const KPICard = ({ label, value, subValue, icon: Icon, color, trend }: any) => (
        <Card className="premium-card overflow-hidden group">
            <CardContent className="p-5 flex items-center justify-between">
                <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</p>
                    <div className="flex items-baseline gap-2">
                        <p className="text-xl font-black tracking-tighter text-slate-900 group-hover:text-primary transition-colors">{value}</p>
                        {trend && <span className={cn("text-[9px] font-bold", trend > 0 ? "text-emerald-500" : "text-rose-500")}>
                            {trend > 0 ? "+" : ""}{trend}%
                        </span>}
                    </div>
                    {subValue && <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">{subValue}</p>}
                </div>
                <div className={cn("p-2.5 rounded-xl", `bg-${color}/10`, `text-${color}`)}>
                    <Icon className="h-4 w-4" />
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="w-full flex flex-col gap-6 animate-in fade-in duration-700 bg-slate-50/50 min-h-screen">
            {/* STICKY PRECISION HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white border-b border-slate-100 shadow-sm sticky top-0 z-20">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg shadow-slate-200">
                        <Gauge className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black uppercase tracking-tighter text-slate-900 leading-none italic">
                            KPI <span className="text-primary not-italic">COMMAND CENTER</span>
                        </h1>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                            Análisis de Alta Precisión • Tiempo Real
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Badge variant="outline" className="h-9 px-4 border-slate-200 bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-500 hidden lg:flex">
                        Status: <span className="text-emerald-500 ml-1">Synced</span>
                    </Badge>
                    <Select value={period} onValueChange={setPeriod}>
                        <SelectTrigger className="w-[140px] h-9 bg-slate-50 border-none rounded-lg font-black text-[10px] uppercase tracking-widest focus:ring-0">
                            <Calendar className="h-3 w-3 mr-2 text-primary" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-slate-100 rounded-xl">
                            <SelectItem value="DAY" className="text-[10px] font-bold uppercase">Hoy</SelectItem>
                            <SelectItem value="WEEK" className="text-[10px] font-bold uppercase">Semana</SelectItem>
                            <SelectItem value="MONTH" className="text-[10px] font-bold uppercase">Mes</SelectItem>
                            <SelectItem value="YEAR" className="text-[10px] font-bold uppercase">Año</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg border-slate-200" onClick={() => loadKPIs(period)}>
                        <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                    </Button>
                </div>
            </div>

            <div className="px-6 pb-20 space-y-8">

                {/* 1. ADQUISICIÓN & TRÁFICO */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 px-1">
                        <Users className="h-4 w-4 text-indigo-500" />
                        <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Tráfico & Conversión</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <KPICard label="Visitantes" value={data?.visitors?.toLocaleString()} icon={Users} color="indigo" />
                        <KPICard label="Tasa Conversión" value={`${data?.conversionRate?.toFixed(2)}%`} icon={TrendingUp} color="emerald" subValue="Store Sessions to Order" />
                        <KPICard label="Total Pedidos" value={data?.totalOrders} icon={ShoppingBag} color="amber" subValue={`${data?.totalProductUnits} Unidades`} />
                        <KPICard label="Ticket Medio" value={`€${data?.averageTicket?.toFixed(2)}`} icon={CreditCard} color="primary" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <KPICard label="Pedidos con Tarjeta" value={data?.cardOrders} icon={CreditCard} color="indigo" subValue={`${data?.cardOrdersPercent?.toFixed(1)}% del Total`} />
                        <KPICard label="Facturación Tarjeta" value={`€${data?.cardRevenue?.toLocaleString()}`} icon={Zap} color="emerald" subValue={`${data?.cardRevenuePercent?.toFixed(1)}% del Revenue`} />
                    </div>
                </section>

                {/* 2. FINANCIAL PERFORMANCE: REAL VS ESTIMATED */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 px-1">
                        <DollarSign className="h-4 w-4 text-emerald-500" />
                        <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Rendimiento Financiero (Real vs Estimado)</h2>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* REVENUE & PROFIT */}
                        <Card className="premium-card col-span-1 lg:col-span-2 overflow-hidden">
                            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-50">
                                {/* ESTIMATED COLUMN */}
                                <div className="p-6 space-y-6 bg-slate-50/30">
                                    <div className="flex items-center justify-between">
                                        <Badge className="bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest px-3">Escenario Estimado</Badge>
                                        <span className="text-[10px] font-bold text-slate-400 italic">Basado en Proyecciones</span>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Facturación Estimada</p>
                                            <p className="text-3xl font-black tracking-tighter text-slate-900">€{data?.revenueEstimated?.toLocaleString()}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Profit Estimado</p>
                                                <p className="text-lg font-black text-emerald-600">€{data?.profitEstimated?.toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">ROI Estimado</p>
                                                <p className="text-lg font-black text-indigo-600">{data?.roiEstimated?.toFixed(0)}%</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">ROAS Estimado</p>
                                                <p className="text-lg font-black text-slate-900">{data?.roasEstimated?.toFixed(2)}x</p>
                                            </div>
                                            <div>
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">CPA Estimado</p>
                                                <p className="text-lg font-black text-slate-900">€{data?.cpaEstimated?.toFixed(2)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {/* REAL COLUMN */}
                                <div className="p-6 space-y-6 bg-white relative">
                                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                        <Activity className="h-32 w-32 text-primary" />
                                    </div>
                                    <div className="flex items-center justify-between relative z-10">
                                        <Badge className="bg-primary text-slate-900 text-[9px] font-black uppercase tracking-widest px-3">Impacto Real</Badge>
                                        <span className="text-[10px] font-bold text-emerald-500 italic flex items-center gap-1">
                                            <ShieldCheck className="h-3 w-3" /> Verificado
                                        </span>
                                    </div>
                                    <div className="space-y-4 relative z-10">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Facturación Real (Delivered)</p>
                                            <p className="text-3xl font-black tracking-tighter text-primary">€{data?.revenueReal?.toLocaleString()}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Profit Real</p>
                                                <p className="text-lg font-black text-emerald-600">€{data?.profitReal?.toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">ROI Real</p>
                                                <p className="text-lg font-black text-indigo-600">{data?.roiReal?.toFixed(0)}%</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">ROAS Real</p>
                                                <p className="text-lg font-black text-slate-900">{data?.roasReal?.toFixed(2)}x</p>
                                            </div>
                                            <div>
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">CPA Real</p>
                                                <p className="text-lg font-black text-slate-900">€{data?.cpaReal?.toFixed(2)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* COST BREAKDOWN CARDS */}
                        <div className="space-y-4">
                            <Card className="premium-card p-5 space-y-4">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gastos Operativos</p>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-xs font-bold">
                                        <span className="text-slate-500 font-medium">Gasto Publicitario (AdSpend)</span>
                                        <span className="text-rose-500">€{data?.adSpend?.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs font-bold">
                                        <span className="text-slate-500 font-medium">Gasto Producto (COGS)</span>
                                        <span className="text-rose-500">€{data?.cogs?.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs font-bold">
                                        <span className="text-slate-500 font-medium">Gastos Envío Real</span>
                                        <span className="text-rose-500">€{(data?.totalOrders * 6.5).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs font-bold border-t border-slate-50 pt-2">
                                        <span className="text-slate-900">% Margen Real</span>
                                        <span className="text-emerald-500 font-black">{data?.profitPercentReal?.toFixed(1)}%</span>
                                    </div>
                                </div>
                            </Card>

                            <Card className="premium-card p-5 bg-slate-900 text-white overflow-hidden relative group">
                                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:rotate-12 transition-transform duration-700">
                                    <Zap className="h-16 w-16 text-primary" />
                                </div>
                                <div className="space-y-1 relative z-10 transition-transform">
                                    <p className="text-[9px] font-black text-primary uppercase tracking-[0.3em]">Clowdbot Impact</p>
                                    <p className="text-2xl font-black">€{data?.botPerformance?.assistedRevenue?.toLocaleString()}</p>
                                    <p className="text-[10px] text-slate-400 font-medium">En pedidos recuperados</p>
                                </div>
                            </Card>
                        </div>
                    </div>
                </section>

                {/* 3. LOGISTICS & QUALITY CONTROL */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 px-1">
                        <Truck className="h-4 w-4 text-amber-500" />
                        <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Logística & Calidad de Entrega</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <KPICard label="Confirmados" value={data?.confirmedOrders} icon={CheckCircle2} color="indigo" subValue={`${data?.realShippingRate?.toFixed(1)}% Ship Rate`} />
                        <KPICard label="Cancelados" value={data?.cancelledOrders} icon={XCircle} color="rose" />
                        <KPICard label="Enviados Real" value={data?.confirmedOrders} icon={Truck} color="amber" subValue="Ready to Deliver" />
                        <KPICard label="Entregados Real" value={data?.deliveredOrders} icon={ShieldCheck} color="emerald" subValue={`${data?.realDeliveryRate?.toFixed(1)}% Delivery Rate`} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <KPICard label="Incidencias" value={data?.incidenceOrders} icon={AlertCircle} color="rose" />
                        <KPICard label="Recuperados" value={data?.recoveredOrders} icon={RotateCcw} color="emerald" subValue={`${data?.recoveryRate?.toFixed(1)}% Recuperación`} />
                        <KPICard label="Devueltos" value={data?.returnedOrders} icon={RotateCcw} color="slate" />
                        <KPICard label="Gasto Devolución" value={`€${data?.returnExpenses?.toLocaleString()}`} icon={DollarSign} color="rose" />
                    </div>
                </section>

                {/* 4. BREAKDOWN TABLES */}
                <Tabs defaultValue="products" className="space-y-4">
                    <TabsList className="bg-white border border-slate-100 p-1 h-11 rounded-xl shadow-sm">
                        <TabsTrigger value="products" className="rounded-lg px-6 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-slate-900">Productos Top</TabsTrigger>
                        <TabsTrigger value="carriers" className="rounded-lg px-6 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-slate-900">Logística</TabsTrigger>
                        <TabsTrigger value="bots" className="rounded-lg px-6 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-slate-900">Clowdbot</TabsTrigger>
                    </TabsList>

                    <TabsContent value="products">
                        <Card className="premium-card overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100 italic">
                                        <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Producto</th>
                                        <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Unidades</th>
                                        <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Revenue Bruto</th>
                                        <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Impacto %</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    <tr className="hover:bg-slate-50/30 transition-colors">
                                        <td className="px-6 py-4 text-xs font-bold text-slate-900 italic uppercase">Carga de Datos Pendiente...</td>
                                        <td className="px-6 py-4 text-xs">--</td>
                                        <td className="px-6 py-4 text-xs">--</td>
                                        <td className="px-6 py-4 text-xs">--</td>
                                    </tr>
                                </tbody>
                            </table>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}

const CheckCircle2 = (props: any) => <ShieldCheck {...props} />;
const XCircle = (props: any) => <AlertCircle {...props} />;
