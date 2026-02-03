"use client";

import { useEffect, useState } from "react";
import {
    BarChart3, TrendingUp, DollarSign, Target,
    Calculator, AlertCircle, ArrowRight, Zap,
    Layers, Search, Filter, Download
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getCampaignAnalytics } from "./actions";
import { cn } from "@/lib/utils";

export default function CampaignAnalysisPage() {
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Scaling Calculator State
    const [targetRevenue, setTargetRevenue] = useState(10000);
    const [currentMargin, setCurrentMargin] = useState(65); // Product Margin %
    const [confidence, setConfidence] = useState(80); // Confidence in scaling

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getCampaignAnalytics();
            setCampaigns(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // Derived Metrics for Calculator
    const breakEvenROAS = 100 / currentMargin; // e.g. 65% margin -> 100/65 = 1.53 BE ROAS
    const requiredSpend = targetRevenue / (campaigns[0]?.roas || 3.0); // Simple projection based on top campaign
    const formattedSpend = requiredSpend.toLocaleString(undefined, { maximumFractionDigits: 0 });

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto pb-20">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 flex items-center gap-3">
                        <Target className="h-8 w-8 text-indigo-600" />
                        Campaign Intelligence
                    </h1>
                    <p className="text-slate-500 font-medium text-lg mt-2 max-w-2xl">
                        Análisis de atribución real (UTM), rentabilidad y simulador de escala.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl border border-emerald-100 flex items-center gap-2 shadow-sm">
                        <Zap className="h-4 w-4 fill-current" />
                        <span className="font-bold text-sm">ROAS Global: {
                            (campaigns.reduce((a, b) => a + b.revenue, 0) / (campaigns.reduce((a, b) => a + b.spend, 1) || 1)).toFixed(2)
                        }x</span>
                    </div>
                    <Button className="h-12 px-6 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl shadow-xl transition-all active:scale-95">
                        <Download className="h-4 w-4 mr-2" /> Exportar Reporte
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* LEFT COLUMN: CAMPAIGN LIST */}
                <div className="lg:col-span-8 space-y-6">
                    <Card className="border-slate-100 shadow-xl shadow-slate-100/50 bg-white overflow-hidden">
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-2">
                                <Layers className="h-5 w-5 text-indigo-600" />
                                <h3 className="font-black text-slate-800 text-lg">Campañas Activas</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <Search className="h-4 w-4 text-slate-400" />
                                <Input placeholder="Filtrar..." className="h-9 w-40 bg-white border-slate-200" />
                            </div>
                        </div>

                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead className="font-black text-slate-600 uppercase text-xs tracking-wider">Campaña (UTM)</TableHead>
                                    <TableHead className="text-right font-black text-slate-600 uppercase text-xs tracking-wider">Compras</TableHead>
                                    <TableHead className="text-right font-black text-slate-600 uppercase text-xs tracking-wider">Revenue</TableHead>
                                    <TableHead className="text-right font-black text-slate-600 uppercase text-xs tracking-wider">Spend (Est.)</TableHead>
                                    <TableHead className="text-right font-black text-slate-600 uppercase text-xs tracking-wider">ROAS</TableHead>
                                    <TableHead className="text-right font-black text-slate-600 uppercase text-xs tracking-wider">CPA Limit</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center text-slate-400 animate-pulse">Cargando datos de atribución...</TableCell>
                                    </TableRow>
                                )}
                                {campaigns.map((camp) => {
                                    const isProfitable = camp.roas > breakEvenROAS;
                                    return (
                                        <TableRow key={camp.id} className="group hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-50">
                                            <TableCell className="font-bold text-slate-700">
                                                <div className="flex flex-col">
                                                    <span className="text-sm">{camp.name}</span>
                                                    <span className="text-[10px] text-slate-400 font-mono uppercase tracking-tight">{camp.platform}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-medium text-slate-600">
                                                {camp.orders}
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-slate-800">
                                                €{camp.revenue.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-right font-medium text-slate-500">
                                                €{camp.spend.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Badge className={cn(
                                                    "font-black text-xs shadow-none border-0 px-2 py-0.5",
                                                    isProfitable ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                                                )}>
                                                    {camp.roas.toFixed(2)}x
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-xs font-bold text-slate-700">€{camp.cpa.toFixed(2)}</span>
                                                    {isProfitable ? (
                                                        <span className="text-[9px] text-emerald-600 font-bold flex items-center gap-0.5">
                                                            <TrendingUp className="h-2 w-2" /> Scalable
                                                        </span>
                                                    ) : (
                                                        <span className="text-[9px] text-amber-500 font-bold">Monitor</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="bg-indigo-600 text-white border-none shadow-xl shadow-indigo-200">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5" /> Escala Agresiva
                                </CardTitle>
                                <CardDescription className="text-indigo-100">
                                    Campañas con ROAS {">"} Breakeven ({breakEvenROAS.toFixed(2)})
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {campaigns.filter(c => c.roas > breakEvenROAS + 0.5).slice(0, 3).map(c => (
                                        <div key={c.id} className="flex justify-between items-center bg-white/10 p-3 rounded-lg border border-white/10">
                                            <span className="font-bold text-sm truncate max-w-[180px]">{c.name}</span>
                                            <div className="text-right">
                                                <div className="font-black text-lg">{c.roas.toFixed(2)} ROAS</div>
                                                <div className="text-[10px] text-indigo-100 opacity-80">Margin: {((1 - (1 / c.roas) - (100 - currentMargin) / 100) * 100).toFixed(0)}%</div>
                                            </div>
                                        </div>
                                    ))}
                                    {campaigns.filter(c => c.roas > breakEvenROAS + 0.5).length === 0 && (
                                        <p className="text-sm opacity-80 italic">Ninguna campaña cualifica para escala agresiva actualmente.</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-white border-slate-100 shadow-lg">
                            <CardHeader>
                                <CardTitle className="text-slate-800 flex items-center gap-2">
                                    <AlertCircle className="h-5 w-5 text-rose-500" /> Kill Zone
                                </CardTitle>
                                <CardDescription>
                                    Campañas quemando dinero (ROAS {"<"} {breakEvenROAS.toFixed(2)})
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {campaigns.filter(c => c.roas < breakEvenROAS && c.spend > 50).map(c => (
                                        <div key={c.id} className="flex justify-between items-center p-2 border-b border-slate-50 last:border-0">
                                            <span className="font-medium text-slate-600 text-sm truncate max-w-[150px]">{c.name}</span>
                                            <Badge variant="outline" className="border-rose-100 text-rose-600 bg-rose-50 font-bold">
                                                {c.roas.toFixed(2)}x
                                            </Badge>
                                        </div>
                                    ))}
                                    {campaigns.filter(c => c.roas < breakEvenROAS && c.spend > 50).length === 0 && (
                                        <p className="text-sm text-slate-400 italic">No hay campañas en zona de peligro.</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* RIGHT COLUMN: SCALING SIMULATOR */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="border-slate-100 shadow-2xl shadow-indigo-100/50 bg-gradient-to-b from-white to-slate-50 sticky top-6">
                        <CardHeader className="bg-slate-900 text-white rounded-t-xl pb-6">
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    <Calculator className="h-5 w-5 text-indigo-400" /> Simulador
                                </CardTitle>
                                <Badge className="bg-indigo-500 text-white border-none font-black">BETA</Badge>
                            </div>
                            <CardDescription className="text-slate-400">
                                Hipótesis de escalado para facturar <span className="text-white font-bold">€{targetRevenue.toLocaleString()}</span>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 space-y-8">

                            {/* Inputs */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <label className="text-xs font-black uppercase text-slate-500 tracking-wider">Objetivo Mensual</label>
                                        <span className="text-xs font-bold text-indigo-600">€{targetRevenue.toLocaleString()}</span>
                                    </div>
                                    <Slider
                                        defaultValue={[targetRevenue]}
                                        max={100000}
                                        step={1000}
                                        onValueChange={(v) => setTargetRevenue(v[0])}
                                        className="py-2"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <label className="text-xs font-black uppercase text-slate-500 tracking-wider">Margen Producto</label>
                                        <span className="text-xs font-bold text-indigo-600">{currentMargin}%</span>
                                    </div>
                                    <Slider
                                        defaultValue={[currentMargin]}
                                        max={100}
                                        step={1}
                                        onValueChange={(v) => setCurrentMargin(v[0])}
                                        className="py-2"
                                    />
                                </div>
                            </div>

                            <div className="h-px bg-slate-200 w-full" />

                            {/* Outputs */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-3 rounded-xl bg-slate-100/50 border border-slate-200">
                                    <div className="text-xs font-bold text-slate-500 uppercase">Inversión Necesaria</div>
                                    <div className="text-lg font-black text-slate-800">€{formattedSpend}</div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                                        <div className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Breakeven ROAS</div>
                                        <div className="text-2xl font-black text-emerald-700">{breakEvenROAS.toFixed(2)}x</div>
                                    </div>
                                    <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100">
                                        <div className="text-[10px] font-bold text-indigo-600 uppercase mb-1">Max CPA</div>
                                        <div className="text-2xl font-black text-indigo-700">€{(50 * (100 - breakEvenROAS * 10) / 100).toFixed(2)}</div>
                                        {/* Mock calculation for CPA based on estimate */}
                                    </div>
                                </div>
                            </div>

                            <Button className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-base shadow-lg shadow-indigo-200 rounded-xl">
                                Aplicar Plan de Escala <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>

                            <p className="text-xs text-center text-slate-400 font-medium">
                                *Basado en el ROAS actual del top performer.
                            </p>

                        </CardContent>
                    </Card>
                </div>

            </div>
        </div>
    );
}
