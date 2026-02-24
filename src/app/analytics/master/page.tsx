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
import { Card, CardContent } from "@/components/ui/card";
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
 <Card className="bg-white border border-slate-100 shadow-xs rounded-lg overflow-hidden group">
 <CardContent className="p-4 flex items-center justify-between">
 <div className="space-y-0.5">
 <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">{label}</p>
 <div className="flex items-baseline gap-1.5">
 <p className="text-lg font-black tracking-tighter text-slate-900 group-hover:text-rose-600 transition-colors italic">{value}</p>
 {trend && <span className={cn("text-[8px] font-black", trend > 0 ? "text-emerald-500" : "text-rose-500")}>
 {trend > 0 ? "+" : ""}{trend}%
 </span>}
 </div>
 {subValue && <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">{subValue}</p>}
 </div>
 <div className={cn("p-2 rounded-lg", `bg-${color}/10`, `text-${color}`)}>
 <Icon className="h-3.5 w-3.5" />
 </div>
 </CardContent>
 </Card>
 );

 return (
 <div className="w-full flex flex-col gap-4 animate-in fade-in duration-700 bg-slate-50/50 min-h-screen">
 {/* STICKY PRECISION HEADER */}
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-4 py-2 bg-white/95 border-b border-slate-200 sticky top-0 z-20 shadow-xs">
 <div className="flex items-center gap-3">
 <div className="h-8 w-8 bg-slate-900 rounded-lg flex items-center justify-center shadow-sm">
 <Gauge className="h-4 w-4 text-rose-400" />
 </div>
 <div>
 <h1 className="text-sm font-black uppercase tracking-tighter text-slate-900 leading-none italic">
 KPI <span className="text-rose-600 not-italic">COMMAND HUB</span>
 </h1>
 <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.1em] mt-1 shrink-0">
 SYSTEM ANALYTICS • HIGH FREQUENCY • RE-AL TIME
 </p>
 </div>
 </div>

 <div className="flex items-center gap-2">
 <Badge variant="outline" className="h-7 px-3 border-slate-200 bg-slate-50 text-[8px] font-black uppercase tracking-widest text-slate-500 hidden lg:flex rounded-md">
 NODE: <span className="text-emerald-600 ml-1">STABLE</span>
 </Badge>
 <Select value={period} onValueChange={setPeriod}>
 <SelectTrigger className="w-[120px] h-7 bg-slate-100/50 border-slate-200 rounded-lg font-black text-[8px] uppercase tracking-widest focus:ring-0">
 <Calendar className="h-3 w-3 mr-1.5 text-rose-500" />
 <SelectValue />
 </SelectTrigger>
 <SelectContent className="bg-white border-slate-200 rounded-lg shadow-sm">
 <SelectItem value="DAY" className="text-[8px] font-black uppercase tracking-widest">Hoy</SelectItem>
 <SelectItem value="WEEK" className="text-[8px] font-black uppercase tracking-widest">Semana</SelectItem>
 <SelectItem value="MONTH" className="text-[8px] font-black uppercase tracking-widest">Mes</SelectItem>
 <SelectItem value="YEAR" className="text-[8px] font-black uppercase tracking-widest">Año</SelectItem>
 </SelectContent>
 </Select>
 <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg border-slate-200" onClick={() => loadKPIs(period)}>
 <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
 </Button>
 </div>
 </div>

 <div className="px-4 pb-20 space-y-6">
 {/* 1. ADQUISICIÓN & TRÁFICO */}
 <section className="space-y-3">
 <div className="flex items-center gap-2 px-1">
 <div className="h-1 w-3 bg-rose-500 rounded-full" />
 <h2 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Tráfico & Conversión Global</h2>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
 <KPICard label="Visitantes" value={data?.visitors?.toLocaleString()} icon={Users} color="rose" />
 <KPICard label="Tasa Conversión" value={`${data?.conversionRate?.toFixed(2)}%`} icon={TrendingUp} color="emerald" subValue="Store Sessions to Order" />
 <KPICard label="Total Pedidos" value={data?.totalOrders} icon={ShoppingBag} color="amber" subValue={`${data?.totalProductUnits} Unidades`} />
 <KPICard label="Ticket Medio" value={`€${data?.averageTicket?.toFixed(2)}`} icon={CreditCard} color="rose" />
 </div>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
 <KPICard label="Pedidos con Tarjeta" value={data?.cardOrders} icon={CreditCard} color="rose" subValue={`${data?.cardOrdersPercent?.toFixed(1)}% del Total`} />
 <KPICard label="Facturación Tarjeta" value={`€${data?.cardRevenue?.toLocaleString()}`} icon={Zap} color="emerald" subValue={`${data?.cardRevenuePercent?.toFixed(1)}% del Revenue`} />
 </div>
 </section>

 {/* 2. FINANCIAL PERFORMANCE */}
 <section className="space-y-3">
 <div className="flex items-center gap-2 px-1">
 <div className="h-1 w-3 bg-emerald-500 rounded-full" />
 <h2 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Rendimiento Financiero Node</h2>
 </div>
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
 <Card className="bg-white border border-slate-200 shadow-xs rounded-lg overflow-hidden col-span-1 lg:col-span-2">
 <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
 <div className="p-4 space-y-4 bg-slate-50/50">
 <div className="flex items-center justify-between">
 <Badge className="bg-slate-900 text-white text-[7px] font-black uppercase tracking-widest px-2 h-4 rounded-md">Estimación Proyectada</Badge>
 <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">Forecast</span>
 </div>
 <div className="space-y-3">
 <div>
 <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Facturación Proyectada</p>
 <p className="text-2xl font-black tracking-tighter text-slate-900 italic">€{data?.revenueEstimated?.toLocaleString()}</p>
 </div>
 <div className="grid grid-cols-2 gap-3">
 <div>
 <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Profit Est.</p>
 <p className="text-md font-black text-emerald-600 italic">€{data?.profitEstimated?.toLocaleString()}</p>
 </div>
 <div>
 <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">ROI Est.</p>
 <p className="text-md font-black text-rose-600 italic">{data?.roiEstimated?.toFixed(0)}%</p>
 </div>
 </div>
 </div>
 </div>
 <div className="p-4 space-y-4 bg-white relative">
 <div className="flex items-center justify-between relative z-10">
 <Badge className="bg-rose-600 text-white text-[7px] font-black uppercase tracking-widest px-2 h-4 rounded-md">Auditoría Real</Badge>
 <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest italic flex items-center gap-1">
 <ShieldCheck className="h-2.5 w-2.5" /> Verificado
 </span>
 </div>
 <div className="space-y-3 relative z-10">
 <div>
 <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Facturación Auditada</p>
 <p className="text-2xl font-black tracking-tighter text-rose-600 italic">€{data?.revenueReal?.toLocaleString()}</p>
 </div>
 <div className="grid grid-cols-2 gap-3">
 <div>
 <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Profit Audit.</p>
 <p className="text-md font-black text-emerald-600 italic">€{data?.profitReal?.toLocaleString()}</p>
 </div>
 <div>
 <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">ROI Audit.</p>
 <p className="text-md font-black text-rose-600 italic">{data?.roiReal?.toFixed(0)}%</p>
 </div>
 </div>
 </div>
 </div>
 </div>
 </Card>

 <div className="space-y-4">
 <Card className="bg-white border border-slate-200 shadow-xs rounded-lg p-4 space-y-3">
 <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Gastos Operativos Matrix</p>
 <div className="space-y-2">
 <div className="flex justify-between items-center text-[9px] font-bold">
 <span className="text-slate-500 uppercase tracking-widest">AdSpend</span>
 <span className="text-rose-600 italic">€{data?.adSpend?.toLocaleString()}</span>
 </div>
 <div className="flex justify-between items-center text-[9px] font-bold">
 <span className="text-slate-500 uppercase tracking-widest">COGS</span>
 <span className="text-rose-600 italic">€{data?.cogs?.toLocaleString()}</span>
 </div>
 <div className="flex justify-between items-center text-[9px] font-black border-t border-slate-100 pt-2 italic">
 <span className="text-slate-900 uppercase tracking-widest">Margen Real</span>
 <span className="text-emerald-500">{data?.profitPercentReal?.toFixed(1)}%</span>
 </div>
 </div>
 </Card>

 <Card className="bg-slate-900 text-white rounded-lg p-4 bg-gradient-to-br from-slate-900 to-rose-950 border-none shadow-sm overflow-hidden relative group">
 <Bot className="absolute top-0 right-0 p-6 opacity-10 h-16 w-16 text-rose-400 group-hover:rotate-12 transition-transform duration-700" />
 <div className="space-y-0.5 relative z-10 text-[7.5px] font-black text-rose-400 uppercase tracking-[0.3em]">IA Assisted Revenue</div>
 <div className="text-xl font-black italic tracking-tighter text-white relative z-10">€{data?.botPerformance?.assistedRevenue?.toLocaleString()}</div>
 </Card>
 </div>
 </div>
 </section>

 {/* 3. LOGISTICS & QUALITY CONTROL */}
 <section className="space-y-3">
 <div className="flex items-center gap-2 px-1">
 <div className="h-1 w-3 bg-amber-500 rounded-full" />
 <h2 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Logística & Calidad de Entrega</h2>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
 <KPICard label="Confirmados" value={data?.confirmedOrders} icon={ShieldCheck} color="rose" subValue={`${data?.realShippingRate?.toFixed(1)}% Ship Rate`} />
 <KPICard label="Cancelados" value={data?.cancelledOrders} icon={AlertCircle} color="rose" />
 <KPICard label="Enviados Real" value={data?.confirmedOrders} icon={Truck} color="amber" subValue="Ready to Deliver" />
 <KPICard label="Entregados" value={data?.deliveredOrders} icon={ShieldCheck} color="emerald" subValue={`${data?.realDeliveryRate?.toFixed(1)}% Delivery Rate`} />
 </div>
 </section>

 {/* 4. BREAKDOWN TABLES */}
 <Tabs defaultValue="products" className="space-y-3">
 <TabsList className="bg-slate-200/50 border border-slate-200 p-0.5 h-8 rounded-lg shadow-sm w-fit">
 <TabsTrigger value="products" className="rounded-md px-4 h-7 text-[8px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-rose-600 data-[state=active]:shadow-xs transition-all">Top Items</TabsTrigger>
 <TabsTrigger value="carriers" className="rounded-md px-4 h-7 text-[8px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-rose-600 data-[state=active]:shadow-xs transition-all">Logistics Flow</TabsTrigger>
 <TabsTrigger value="bots" className="rounded-md px-4 h-7 text-[8px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-rose-600 data-[state=active]:shadow-xs transition-all">IA Automation</TabsTrigger>
 </TabsList>

 <TabsContent value="products">
 <Card className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-slate-50 border-b border-slate-200 italic">
 <th className="px-4 py-2 text-[8px] font-black uppercase tracking-widest text-slate-400">Producto</th>
 <th className="px-4 py-2 text-[8px] font-black uppercase tracking-widest text-slate-400">Unidades</th>
 <th className="px-4 py-2 text-[8px] font-black uppercase tracking-widest text-slate-400">Revenue Bruto</th>
 <th className="px-4 py-2 text-[8px] font-black uppercase tracking-widest text-slate-400">Impacto %</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100">
 <tr className="hover:bg-slate-50/50 transition-colors">
 <td className="px-4 py-2.5 text-[10px] font-black text-slate-900 italic uppercase">Carga de Datos Pendiente...</td>
 <td className="px-4 py-2.5 text-[10px] font-black text-slate-400">--</td>
 <td className="px-4 py-2.5 text-[10px] font-black text-slate-400">--</td>
 <td className="px-4 py-2.5 text-[10px] font-black text-slate-400">--</td>
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
