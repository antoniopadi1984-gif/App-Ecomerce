"use client";

import { motion } from "framer-motion";
import {
    DollarSign, Package, AlertTriangle, Activity, Zap, ArrowUpRight, ChevronRight
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

import { t } from "@/lib/constants/translations";

export default function DashboardClient({ initialKpi, initialOrders, initialCampaigns }: DashboardClientProps) {
    return (
        <div className="max-w-[1600px] mx-auto p-3 md:px-6 md:py-4 space-y-3">
            {/* Header Ultra Compact */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-1 border-b border-slate-100/50 pb-2">
                <div className="flex items-center gap-3">
                    <div className="h-6 w-6 bg-slate-950 rounded flex items-center justify-center text-white shadow-sm">
                        <Activity className="h-3.5 w-3.5" />
                    </div>
                    <div className="space-y-0 text-left">
                        <h2 className="text-sm font-black text-slate-950 uppercase tracking-tighter leading-none italic">
                            {t('command_center')} <span className="text-blue-600 font-bold not-italic ml-1">v4</span>
                        </h2>
                        <p className="text-slate-400 font-bold text-[7px] uppercase tracking-[0.3em] opacity-70">{t('op_intel_system')}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="hidden sm:flex items-center bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-md gap-1.5">
                        <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">{t('live_sync')}</span>
                    </div>
                    <Button variant="outline" className="h-7 border-slate-950/10 text-slate-950 font-black text-[8px] uppercase tracking-widest px-2.5 rounded-md hover:bg-slate-950 hover:text-white transition-all shadow-xs">
                        <Zap className="w-2.5 h-2.5 text-amber-500 fill-amber-500" /> {t('ai_insights')}
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-2">
                <TabsList className="bg-slate-100/50 p-0.5 h-6 rounded-md border border-slate-200/30 w-fit">
                    <TabsTrigger value="overview" className="h-full px-2 rounded-sm font-black text-[7px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-xs transition-all">{t('overview')}</TabsTrigger>
                    <TabsTrigger value="crm" className="h-full px-2 rounded-sm font-black text-[7px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-xs transition-all">Logistic CRM</TabsTrigger>
                    <TabsTrigger value="marketing" className="h-full px-2 rounded-sm font-black text-[7px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-xs transition-all">{t('ads_lab')}</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-2">
                    <HealthDashboard />

                    <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-2">
                        <KpiCard label={t('net_profit')} value={`€${(initialKpi?.netProfit || 0).toLocaleString('es-ES', { minimumFractionDigits: 1 })}`} trend="+12.5%" icon={DollarSign} color="text-emerald-600" bg="bg-emerald-50/50" aura />
                        <KpiCard label={t('orders_today')} value={initialKpi?.ordersCount || 0} sub={`${initialKpi?.recoveryRate || 0}% health`} icon={Package} color="text-blue-600" bg="bg-blue-50/50" />
                        <KpiCard label={t('incidences')} value={initialKpi?.incidences || 0} icon={AlertTriangle} color={(initialKpi?.incidences || 0) > 0 ? "text-rose-500" : "text-slate-400"} bg={(initialKpi?.incidences || 0) > 0 ? "bg-rose-50/50" : "bg-slate-50/50"} alert={(initialKpi?.incidences || 0) > 0} />
                        <KpiCard label={t('avg_ticket')} value={`€${(initialKpi?.avgTicket || 0).toFixed(1)}`} icon={Activity} color="text-rose-600" bg="bg-rose-50/50" />
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-2">
                        {/* Actividad Reciente */}
                        <Card className="lg:col-span-8 compact-card border-slate-100/60 shadow-xs rounded-lg overflow-hidden">
                            <CardHeader className="p-1 px-2 border-b border-slate-50 flex flex-row items-center justify-between gap-1">
                                <div className="space-y-0 text-left">
                                    <CardTitle className="text-[8px] font-black text-slate-900 uppercase tracking-tight italic">{t('live_activity_feed')}</CardTitle>
                                    <CardDescription className="text-[6px] font-bold text-slate-400 uppercase tracking-widest">{t('real_time_queue')}</CardDescription>
                                </div>
                                <Button variant="ghost" className="h-4 px-1 text-[6px] font-black text-blue-700 uppercase hover:bg-blue-50 transition-colors">{t('history_api')}</Button>
                            </CardHeader>
                            <CardContent className="p-0">
                                <ScrollArea className="h-[180px]">
                                    <div className="divide-y divide-slate-50/50">
                                        {initialOrders.map((order) => (
                                            <div key={order.internalId} className="flex items-center justify-between p-1 px-2 hover:bg-slate-50/50 transition-all group cursor-default">
                                                <div className="flex items-center gap-1.5 max-w-[70%]">
                                                    <div className={cn(
                                                        "h-4 w-4 shrink-0 rounded flex items-center justify-center border font-black text-[6px] transition-all",
                                                        order.status === 'INCIDENCE' ? "bg-rose-50 border-rose-100/50 text-rose-500" :
                                                            order.status === 'DELIVERED' ? "bg-emerald-50 border-emerald-100/50 text-emerald-500" : "bg-blue-50 border-blue-100/50 text-blue-500"
                                                    )}>
                                                        {order.status === 'INCIDENCE' ? '!' : '✓'}
                                                    </div>
                                                    <div className="text-left overflow-hidden">
                                                        <p className="text-[8px] font-black text-slate-800 tracking-tight leading-none whitespace-nowrap">{order.customer}</p>
                                                        <p className="text-[6px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">{order.id} • {order.payment}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <div className="text-right">
                                                        <p className="text-[8px] font-black text-slate-900">€{order.total || '0'}</p>
                                                        <p className="text-[6px] font-bold text-slate-300 uppercase leading-none">{order.date}</p>
                                                    </div>
                                                    <ChevronRight className="h-2 w-2 text-slate-200 group-hover:text-blue-500" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>

                        {/* Marketing IQ */}
                        <Card className="lg:col-span-4 compact-card border-slate-100/60 shadow-xs rounded-lg overflow-hidden">
                            <CardHeader className="p-1 px-2 border-b border-slate-50 bg-slate-50/20 text-left">
                                <CardTitle className="text-[8px] font-black text-slate-900 uppercase tracking-tight italic">{t('marketing_roi')}</CardTitle>
                                <CardDescription className="text-[6px] font-bold text-slate-400 uppercase tracking-widest">{t('best_hooks')}</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <ScrollArea className="h-[180px]">
                                    <div className="divide-y divide-slate-50/50">
                                        {initialCampaigns.map((camp, i) => (
                                            <div key={i} className="p-1 px-2 flex items-center justify-between hover:bg-slate-50/50 group transition-all">
                                                <div className="space-y-0 text-left overflow-hidden">
                                                    <p className="text-[7px] font-black text-slate-800 uppercase leading-none whitespace-nowrap">{camp.name}</p>
                                                    <p className="text-[6px] font-bold text-slate-400 mt-0.5 tracking-tighter uppercase">€{camp.revenue.toFixed(0)} atrib.</p>
                                                </div>
                                                <div className="text-right shrink-0 ml-2">
                                                    <span className="text-[7px] font-black text-emerald-600">{camp.roas}x</span>
                                                    <div className="h-0.5 w-6 bg-slate-100 rounded-full mt-0.5 overflow-hidden">
                                                        <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${Math.min(camp.roas * 10, 100)}%` }} />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="crm" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <Card className="compact-card p-3 flex flex-col items-center justify-center text-center space-y-2 bg-white rounded-lg">
                            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100/50">
                                <Package className="w-4 h-4" />
                            </div>
                            <h3 className="text-[9px] font-black uppercase tracking-tight italic text-left w-full">{t('logistic_status')}</h3>
                            <div className="w-full space-y-2">
                                <StatLevel label={t('delivered')} value="68%" color="bg-emerald-500" />
                                <StatLevel label={t('in_transit')} value="22%" color="bg-blue-500" />
                                <StatLevel label={t('incidences')} value="10%" color="bg-rose-500" />
                            </div>
                        </Card>
                        <Card className="compact-card col-span-2">
                            <div className="p-2 px-3 border-b border-slate-50 flex items-center justify-between">
                                <h3 className="text-[9px] font-black uppercase tracking-tight italic">Operations Alerts</h3>
                                <Badge className="bg-rose-50 text-rose-600 border-rose-100 text-[7px] font-black uppercase tracking-widest px-1 py-0">{t('critical')} (3)</Badge>
                            </div>
                            <div className="p-1.5 space-y-1 text-left">
                                <IncidenceItem customer="Juan Pérez" reason="Address unreachable" time="2h ago" />
                                <IncidenceItem customer="María García" reason="Absent after 3 attempts" time="5h ago" />
                                <IncidenceItem customer="Pedro López" reason="Refused package" time="1d ago" />
                            </div>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="marketing" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Card className="compact-card p-3">
                            <h3 className="text-[9px] font-black uppercase italic mb-3 text-left">{t('effective_channels')}</h3>
                            <div className="space-y-3">
                                <StatLevel label="Meta Ads" value="45%" color="bg-blue-600" />
                                <StatLevel label="Google Search" value="30%" color="bg-rose-600" />
                                <StatLevel label="Direct Traffic" value="25%" color="bg-slate-400" />
                            </div>
                        </Card>
                        <Card className="compact-card p-3 bg-slate-950 text-white border-none shadow-sm">
                            <div className="flex items-center gap-2 mb-2">
                                <Zap className="h-3 w-3 text-amber-400" />
                                <h3 className="text-[9px] font-black uppercase italic text-slate-400">{t('ai_strategy_core')}</h3>
                            </div>
                            <div className="space-y-3">
                                <p className="text-[8px] font-bold leading-relaxed text-slate-300">
                                    Strategic recommendación: Scale <span className="text-amber-400 font-black">12%</span> on <span className="text-white italic underline">"PROMO_ES_24"</span> hook based on peak retention metrics observed at 14:00 CET.
                                </p>
                                <Button className="w-full h-6 bg-white text-slate-950 hover:bg-slate-200 font-black text-[7px] uppercase tracking-widest rounded transition-all">{t('execute_optimization')}</Button>
                            </div>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function KpiCard({ label, value, trend, sub, icon: Icon, color, bg, alert, aura }: any) {
    return (
        <motion.div variants={item}>
            <Card className={cn(
                "compact-card border-none bg-white rounded-lg transition-all duration-300 hover:shadow-sm hover:shadow-sm hover:-translate-y-0.5 overflow-hidden relative group",
                alert && "bg-rose-50/20 ring-1 ring-rose-100/30",
                aura && "before:absolute before:-top-4 before:-right-4 before:w-16 before:h-16 before:bg-rose-500/10 before:rounded-full before:blur-2xl before:pointer-events-none"
            )}>
                <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-10 transition-opacity">
                    <Icon className="h-10 w-10 text-slate-900" />
                </div>

                <div className="p-2.5 flex items-start justify-between relative z-10">
                    <div className="space-y-0.5 text-left">
                        <p className="text-[7px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">{label}</p>
                        <div className="flex items-center gap-1.5">
                            <h3 className={cn("text-[13px] font-black tracking-tighter italic leading-none uppercase", alert ? "text-rose-600" : "text-slate-950")}>{value}</h3>
                            {trend && (
                                <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[7px] px-1 py-0 h-3 flex items-center gap-0.5 scale-90 origin-left">
                                    <ArrowUpRight className="h-1.5 w-1.5" />{trend}
                                </Badge>
                            )}
                        </div>
                        {sub && <p className="text-[7px] font-black text-slate-500 uppercase tracking-tighter mt-1 opacity-70 italic">{sub}</p>}
                    </div>
                    <div className={cn("h-6 w-6 rounded-lg flex items-center justify-center shrink-0 shadow-sm transition-all group-hover:scale-110", bg)}>
                        <Icon className={cn("h-3 w-3", color)} />
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}

function StatLevel({ label, value, color }: { label: string, value: string, color: string }) {
    return (
        <div className="space-y-0.5 w-full">
            <div className="flex justify-between text-[7px] font-black uppercase tracking-widest">
                <span className="text-slate-400/80">{label}</span>
                <span className="text-slate-900">{value}</span>
            </div>
            <div className="h-1 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100/10">
                <div className={cn("h-full transition-all duration-1000", color)} style={{ width: value }} />
            </div>
        </div>
    );
}

function IncidenceItem({ customer, reason, time }: { customer: string, reason: string, time: string }) {
    return (
        <div className="flex items-center justify-between group p-1 hover:bg-slate-50/50 rounded transition-all">
            <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-1 h-1 shrink-0 rounded-full bg-rose-500" />
                <div className="space-y-0 text-left overflow-hidden">
                    <p className="text-[8px] font-black text-slate-900 leading-none whitespace-nowrap">{customer}</p>
                    <p className="text-[7px] font-bold text-slate-400 mt-0.5 leading-none whitespace-nowrap">{reason}</p>
                </div>
            </div>
            <span className="text-[7px] font-black text-slate-300 shrink-0 uppercase tracking-tighter ml-2">{time}</span>
        </div>
    );
}
