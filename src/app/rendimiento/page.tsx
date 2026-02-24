"use client";

import React, { useState, useEffect } from "react";
import { useProduct } from "@/context/ProductContext";
import {
    BarChart3, TrendingUp, Users, Truck,
    ShoppingBag, Calendar, RefreshCw, Activity,
    ArrowUpRight, ArrowDownRight, Zap, Target,
    Gauge, AlertCircle, ShieldCheck, CreditCard,
    Bot
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAdvancedKPIs } from "@/app/analytics/actions";
import { cn } from "@/lib/utils";
import { PremiumCard } from "@/components/ui/premium-card";
import { t } from "@/lib/constants/translations";
import { PageShell } from "@/components/ui/PageShell";
import { ModuleHeader } from "@/components/ui/ModuleHeader";
import { useStore } from "@/lib/store/store-context";
import Link from "next/link";
import { Link2 } from "lucide-react";

export default function RendimientoPage() {
    const { productId, product, allProducts } = useProduct();
    const { activeStoreId } = useStore();
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<any>("MONTH");
    const [data, setData] = useState<any>(null);
    const [isConnected, setIsConnected] = useState<boolean | null>(null);

    useEffect(() => {
        if (activeStoreId) {
            fetch(`/api/connections/status?storeId=${activeStoreId}&service=SHOPIFY`)
                .then(res => res.json())
                .then(data => setIsConnected(data.isConnected));
        }
    }, [activeStoreId]);

    const loadKPIs = async (p: string) => {
        setLoading(true);
        if (productId) {
            // Mock data for specific product (from analiticas)
            setTimeout(() => {
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
        } else {
            // Real data for global master (from analytics/master)
            const res = await getAdvancedKPIs(p as any);
            if (res.success) {
                setData(res.summary);
            }
            setLoading(false);
        }
    };

    useEffect(() => {
        loadKPIs(period);
    }, [period, productId]);

    if (isConnected === false && !productId) {
        return (
            <PageShell>
                <ModuleHeader title="KPI COMMAND HUB" subtitle="SYSTEM ANALYTICS • OVERALL" icon={Gauge} />
                <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6 mt-6">
                    <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center">
                        <AlertCircle className="w-10 h-10 text-rose-500" />
                    </div>
                    <div className="space-y-2 text-center">
                        <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase italic">Shopify No Conectado</h2>
                        <p className="text-slate-500 max-w-sm mx-auto font-medium text-sm">Debes vincular tu tienda oficial de Shopify para ver las analíticas globales.</p>
                    </div>
                    <Link href="/connections">
                        <Button className="bg-rose-500 hover:bg-black text-white font-black text-[10px] uppercase tracking-widest h-10 px-6 rounded-xl shadow-lg shadow-rose-500/20">
                            <Link2 className="w-4 h-4 mr-2" />
                            Ir a Conexiones
                        </Button>
                    </Link>
                </div>
            </PageShell>
        );
    }

    const KPICardMaster = ({ label, value, subValue, icon: Icon, color, trend }: any) => (
        <Card className="bg-white border border-slate-100 shadow-xs rounded-lg overflow-hidden group">
            <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-0.5">
                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">{label}</p>
                    <div className="flex items-baseline gap-1.5">
                        <p className="text-lg font-black tracking-tighter text-slate-900 group-hover:text-indigo-600 transition-colors italic">{value}</p>
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

    const KPICardProduct = ({ label, value, trend, icon: Icon, color }: any) => {
        const colors: any = {
            blue: "bg-blue-50 text-blue-600",
            emerald: "bg-emerald-50 text-emerald-600",
            indigo: "bg-indigo-50 text-indigo-600",
            amber: "bg-amber-50 text-amber-600"
        };
        return (
            <PremiumCard hover className="group p-4 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                    <div className={cn("p-2 rounded-lg", colors[color] || "bg-indigo-50 text-indigo-600")}>
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
    };

    function StatCircle({ label, value }: any) {
        return (
            <div className="flex flex-col items-center text-center space-y-1.5">
                <div className="w-14 h-14 rounded-full border-2 border-slate-50 flex items-center justify-center bg-white shadow-inner">
                    <span className="text-base font-black text-slate-900">{value}</span>
                </div>
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">{label}</span>
            </div>
        );
    }

    return (
        <PageShell loading={loading && !data} loadingMessage="Analizando Métricas...">
            <ModuleHeader
                title="KPI COMMAND HUB"
                subtitle={productId ? `PRODUCTO: ${product?.title || productId.slice(0, 8)}` : "SYSTEM ANALYTICS • OVERALL"}
                icon={Gauge}
                actions={
                    <div className="flex items-center gap-2">
                        {!productId && (
                            <Badge variant="outline" className="h-8 px-3 border-slate-200 bg-slate-50 text-[9px] font-black uppercase tracking-widest text-slate-500 hidden lg:flex rounded-lg">
                                NODE: <span className="text-emerald-600 ml-1">STABLE</span>
                            </Badge>
                        )}
                        <Select value={period} onValueChange={setPeriod}>
                            <SelectTrigger className={cn(
                                "w-[130px] h-9 rounded-xl font-bold text-[9px] uppercase tracking-widest focus:ring-0 shadow-sm",
                                productId ? "bg-white/5 border-slate-700 text-slate-300" : "bg-slate-100/50 border-slate-200"
                            )}>
                                <Calendar className={cn("h-3 w-3 mr-2", productId ? "text-blue-500" : "text-indigo-500")} />
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className={cn("rounded-xl shadow-xl", productId ? "border-slate-800 bg-slate-900 text-slate-300" : "bg-white border-slate-200")}>
                                <SelectItem value="DAY" className="text-[9px] font-black uppercase tracking-widest">Hoy</SelectItem>
                                <SelectItem value="WEEK" className="text-[9px] font-black uppercase tracking-widest">Semana</SelectItem>
                                <SelectItem value="MONTH" className="text-[9px] font-black uppercase tracking-widest">Mes</SelectItem>
                                <SelectItem value="YEAR" className="text-[9px] font-black uppercase tracking-widest">Año</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="outline" size="icon" className={cn("h-9 w-9 rounded-xl shadow-sm", productId ? "border-slate-700 bg-white/5 hover:bg-white/10" : "border-slate-200")} onClick={() => loadKPIs(period)}>
                            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin", productId ? "text-slate-300" : "text-slate-600")} />
                        </Button>
                    </div>
                }
            />

            <div className="px-6 pb-20 space-y-6 pt-2 max-w-[1600px] mx-auto w-full">
                {/* --- VISTA PRODUCTO --- */}
                {productId && data && (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <KPICardProduct label="REVENUE" value={`€${data.revenue?.toLocaleString() || 0}`} trend={+12} icon={ShoppingBag} color="blue" />
                            <KPICardProduct label="ROAS" value={`${data.roas || 0}x`} trend={+0.5} icon={TrendingUp} color="emerald" />
                            <KPICardProduct label="CVR" value={`${data.conversionRate || 0}%`} trend={-0.2} icon={Activity} color="indigo" />
                            <KPICardProduct label="PROFIT" value={`€${data.profit?.toLocaleString() || 0}`} trend={+8} icon={Zap} color="amber" />
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <PremiumCard className="col-span-1 lg:col-span-2 shadow-sm p-5 rounded-2xl">
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('embu_trafico')}</h3>
                                        <Badge className="bg-slate-100 text-slate-600 border-none font-bold text-[8px]">{t('live')}</Badge>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                                        <StatCircle label={t('visitas')} value={data.visitors?.toLocaleString() || 0} />
                                        <StatCircle label={t('añadidos')} value="482" />
                                        <StatCircle label={t('pagos')} value={data.orders?.toLocaleString() || 0} />
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
                                        <p className="text-3xl font-black">{data.deliveredRate || 0}%</p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t('entrega_real')}</p>
                                    </div>
                                    <div className="pt-3 border-t border-slate-800 space-y-2">
                                        <div className="flex justify-between text-[11px] font-bold font-mono">
                                            <span className="text-slate-500">{t('profit_real')}</span>
                                            <span className="text-emerald-400">€{data.profit?.toLocaleString() || 0}</span>
                                        </div>
                                        <div className="flex justify-between text-[11px] font-bold font-mono">
                                            <span className="text-slate-500">{t('roi_impact')}</span>
                                            <span className="text-blue-400">{data.roi || 0}%</span>
                                        </div>
                                    </div>
                                </div>
                            </PremiumCard>
                        </div>
                    </div>
                )}

                {/* --- VISTA GLOBAL --- */}
                {!productId && data && (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <section className="space-y-3">
                            <div className="flex items-center gap-2 px-1">
                                <div className="h-1 w-3 bg-indigo-500 rounded-full" />
                                <h2 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Tráfico & Conversión Global</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                <KPICardMaster label="Visitantes" value={data?.visitors?.toLocaleString()} icon={Users} color="indigo" />
                                <KPICardMaster label="Tasa Conversión" value={`${data?.conversionRate?.toFixed(2)}%`} icon={TrendingUp} color="emerald" subValue="Store Sessions to Order" />
                                <KPICardMaster label="Total Pedidos" value={data?.totalOrders} icon={ShoppingBag} color="amber" subValue={`${data?.totalProductUnits} Unidades`} />
                                <KPICardMaster label="Ticket Medio" value={`€${data?.averageTicket?.toFixed(2)}`} icon={CreditCard} color="indigo" />
                            </div>
                        </section>

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
                                                        <p className="text-md font-black text-indigo-600 italic">{data?.roiEstimated?.toFixed(0)}%</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-4 space-y-4 bg-white relative">
                                            <div className="flex items-center justify-between relative z-10">
                                                <Badge className="bg-indigo-600 text-white text-[7px] font-black uppercase tracking-widest px-2 h-4 rounded-md">Auditoría Real</Badge>
                                                <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest italic flex items-center gap-1">
                                                    <ShieldCheck className="h-2.5 w-2.5" /> Verificado
                                                </span>
                                            </div>
                                            <div className="space-y-3 relative z-10">
                                                <div>
                                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Facturación Auditada</p>
                                                    <p className="text-2xl font-black tracking-tighter text-indigo-600 italic">€{data?.revenueReal?.toLocaleString()}</p>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Profit Audit.</p>
                                                        <p className="text-md font-black text-emerald-600 italic">€{data?.profitReal?.toLocaleString()}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">ROI Audit.</p>
                                                        <p className="text-md font-black text-indigo-600 italic">{data?.roiReal?.toFixed(0)}%</p>
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
                                    <Card className="bg-slate-900 text-white rounded-lg p-4 bg-gradient-to-br from-slate-900 to-indigo-950 border-none shadow-xl overflow-hidden relative group">
                                        <Bot className="absolute top-0 right-0 p-6 opacity-10 h-16 w-16 text-indigo-400 group-hover:rotate-12 transition-transform duration-700" />
                                        <div className="space-y-0.5 relative z-10 text-[7.5px] font-black text-indigo-400 uppercase tracking-[0.3em]">IA Assisted Revenue</div>
                                        <div className="text-xl font-black italic tracking-tighter text-white relative z-10">€{data?.botPerformance?.assistedRevenue?.toLocaleString()}</div>
                                    </Card>
                                </div>
                            </div>
                        </section>

                        <section className="space-y-3">
                            <div className="flex items-center gap-2 px-1">
                                <div className="h-1 w-3 bg-amber-500 rounded-full" />
                                <h2 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Logística & Calidad de Entrega</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                <KPICardMaster label="Confirmados" value={data?.confirmedOrders} icon={ShieldCheck} color="indigo" subValue={`${data?.realShippingRate?.toFixed(1)}% Ship Rate`} />
                                <KPICardMaster label="Cancelados" value={data?.cancelledOrders} icon={AlertCircle} color="rose" />
                                <KPICardMaster label="Enviados Real" value={data?.confirmedOrders} icon={Truck} color="amber" subValue="Ready to Deliver" />
                                <KPICardMaster label="Entregados" value={data?.deliveredOrders} icon={ShieldCheck} color="emerald" subValue={`${data?.realDeliveryRate?.toFixed(1)}% Delivery Rate`} />
                            </div>
                        </section>

                        <Tabs defaultValue="products" className="space-y-3">
                            <TabsList className="bg-slate-200/50 border border-slate-200 p-0.5 h-8 rounded-lg shadow-sm w-fit">
                                <TabsTrigger value="products" className="rounded-md px-4 h-7 text-[8px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-xs transition-all">Top Items</TabsTrigger>
                                <TabsTrigger value="carriers" className="rounded-md px-4 h-7 text-[8px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-xs transition-all">Logistics Flow</TabsTrigger>
                                <TabsTrigger value="bots" className="rounded-md px-4 h-7 text-[8px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-xs transition-all">IA Automation</TabsTrigger>
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
                )}
            </div>
        </PageShell>
    );
}
