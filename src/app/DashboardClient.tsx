"use client";

import { motion } from "framer-motion";
import {
    DollarSign, Package, AlertTriangle, Activity, Clock, Zap, ArrowUpRight, ChevronRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { HealthDashboard } from "@/components/system/HealthDashboard";


const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { y: 10, opacity: 0 }, show: { y: 0, opacity: 1 } };

interface DashboardClientProps {
    initialKpi: any;
    initialOrders: any[];
    initialCampaigns: any[];
}

export default function DashboardClient({ initialKpi, initialOrders, initialCampaigns }: DashboardClientProps) {
    return (
        <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-6">
            {/* Header Compacto */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
                <div className="space-y-1">
                    <h2 className="text-2xl font-black text-slate-950 uppercase italic tracking-tighter">Centro de Comando</h2>
                    <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Métricas en tiempo real • Operaciones & Marketing</p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-white border-slate-200 px-3 py-1 text-slate-900 font-black rounded-lg shadow-sm">
                        <Clock className="w-3.5 h-3.5 mr-2 text-blue-700" /> ACTIVO • 02:14
                    </Badge>
                    <Button className="button-compact bg-slate-950 text-white hover:bg-black">
                        <Zap className="w-3.5 h-3.5 text-amber-400" /> Generar Hipótesis
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="bg-slate-200/50 p-1 h-9 rounded-lg border border-slate-200">
                    <TabsTrigger value="overview" className="h-full px-4 rounded-md font-black text-[10px] uppercase data-[state=active]:bg-white data-[state=active]:text-blue-700">Resumen Ejecutivo</TabsTrigger>
                    <TabsTrigger value="crm" className="h-full px-4 rounded-md font-black text-[10px] uppercase data-[state=active]:bg-white data-[state=active]:text-blue-700">CRM Logístico</TabsTrigger>
                    <TabsTrigger value="marketing" className="h-full px-4 rounded-md font-black text-[10px] uppercase data-[state=active]:bg-white data-[state=active]:text-blue-700">Marketing Inteligente</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    {/* Health Dashboard - Integrated System Check */}
                    <HealthDashboard />

                    {/* KPI GRID - Compact & High Contrast */}
                    <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <KpiCard label="Beneficio Neto" value={`€${initialKpi.netProfit.toLocaleString(undefined, { minimumFractionDigits: 1 })}`} trend="+12.5%" icon={DollarSign} color="text-emerald-700" bg="bg-emerald-50" />
                        <KpiCard label="Pedidos Hoy" value={initialKpi.ordersCount} sub={`${initialKpi.recoveryRate}% tasa`} icon={Package} color="text-blue-700" bg="bg-blue-50" />
                        <KpiCard label="Incidencias" value={initialKpi.incidences} icon={AlertTriangle} color={initialKpi.incidences > 0 ? "text-rose-600" : "text-slate-400"} bg={initialKpi.incidences > 0 ? "bg-rose-50" : "bg-slate-50"} alert={initialKpi.incidences > 0} />
                        <KpiCard label="Ticket Medio" value={`€${initialKpi.avgTicket.toFixed(1)}`} icon={Activity} color="text-slate-800" bg="bg-slate-100" />
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Actividad Reciente - Compact Table Style */}
                        <Card className="lg:col-span-8 compact-card">
                            <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-sm font-black text-slate-900 uppercase italic">Actividad Reciente</CardTitle>
                                    <CardDescription className="text-[10px] font-bold text-slate-400">Últimos pedidos procesados</CardDescription>
                                </div>
                                <Button variant="ghost" className="h-7 px-2 text-[10px] font-black text-blue-700 uppercase">Ver Todos</Button>
                            </CardHeader>
                            <CardContent className="p-0">
                                <ScrollArea className="h-[320px]">
                                    <div className="divide-y divide-slate-50">
                                        {initialOrders.map((order) => (
                                            <div key={order.internalId} className="flex items-center justify-between p-3 hover:bg-slate-50/80 transition-colors group">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "h-8 w-8 rounded-lg flex items-center justify-center border font-black text-[10px]",
                                                        order.status === 'INCIDENCE' ? "bg-rose-50 border-rose-100 text-rose-600" :
                                                            order.status === 'DELIVERED' ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-blue-50 border-blue-100 text-blue-600"
                                                    )}>
                                                        {order.status === 'INCIDENCE' ? '!' : 'OK'}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-black text-slate-950 truncate max-w-[150px]">{order.customer}</p>
                                                        <p className="text-[10px] font-bold text-slate-400">{order.id} • {order.payment}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <Badge variant="outline" className="text-[9px] font-black uppercase text-slate-500 bg-slate-50 border-slate-100">
                                                        {order.date}
                                                    </Badge>
                                                    <ChevronRight className="h-3 w-3 text-slate-300 group-hover:text-blue-700" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>

                        {/* Marketing Intelligence - Compact List */}
                        <Card className="lg:col-span-4 compact-card">
                            <CardHeader className="p-4 border-b border-slate-100">
                                <CardTitle className="text-sm font-black text-slate-900 uppercase italic">Rendimiento UTM</CardTitle>
                                <CardDescription className="text-[10px] font-bold text-slate-400">Top campañas por ROAS</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <ScrollArea className="h-[280px]">
                                    <div className="divide-y divide-slate-50">
                                        {initialCampaigns.map((camp, i) => (
                                            <div key={i} className="p-3 flex items-center justify-between hover:bg-slate-50/80">
                                                <div className="space-y-0.5">
                                                    <p className="text-xs font-black text-slate-800 uppercase truncate max-w-[120px]">{camp.name}</p>
                                                    <p className="text-[9px] font-bold text-slate-400">€{camp.revenue.toFixed(0)} atribuidos</p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-xs font-black text-emerald-600">{camp.roas}x</span>
                                                    <div className="h-0.5 w-full bg-emerald-500 rounded-full mt-1" style={{ width: `${Math.min(camp.roas * 10, 100)}%` }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                                <div className="p-3 bg-slate-50/50">
                                    <Button variant="outline" className="w-full button-compact border-slate-200 text-slate-700 bg-white">Ver Dashboard de Marketing</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function KpiCard({ label, value, trend, sub, icon: Icon, color, bg, alert }: any) {
    return (
        <motion.div variants={item}>
            <Card className={cn("compact-card border-none shadow-none bg-white", alert && "bg-rose-50/50 border border-rose-100")}>
                <div className="p-4 flex items-start justify-between">
                    <div className="space-y-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">{label}</p>
                        <div className="flex items-baseline gap-2">
                            <h3 className={cn("text-xl font-black", alert ? "text-rose-600" : "text-slate-950")}>{value}</h3>
                            {trend && <span className="text-[9px] font-black text-emerald-600 flex items-center"><ArrowUpRight className="h-2 w-2 mr-0.5" />{trend}</span>}
                        </div>
                        {sub && <p className="text-[9px] font-bold text-slate-400 leading-none">{sub}</p>}
                    </div>
                    <div className={cn("p-2 rounded-lg", bg, color)}>
                        <Icon className="h-4 w-4" />
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}
