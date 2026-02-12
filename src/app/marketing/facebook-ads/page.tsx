"use client";

import React, { useState } from "react";
import { useProduct } from "@/context/ProductContext";
import {
    Facebook,
    AlertCircle,
    Layers,
    Layout,
    Play,
    Plus,
    Search,
    Filter,
    TrendingUp,
    MoreHorizontal
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function FacebookAdsPage() {
    const { productId } = useProduct();
    const [activeTab, setActiveTab] = useState("campaigns");

    if (!productId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center animate-in fade-in duration-700">
                <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center">
                    <AlertCircle className="w-10 h-10 text-indigo-500" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight italic uppercase">Contexto Requerido</h2>
                    <p className="text-slate-500 max-w-sm mx-auto font-medium">Por favor, selecciona un producto para gestionar sus campañas de Facebook.</p>
                </div>
            </div>
        );
    }

    const mockStats = [
        {
            id: 1,
            status: "active",
            name: "ESP | NAD+ PURE | LAL | ATC 30D",
            delivery: "active",
            budget: 50,
            results: 142,
            reach: 84200,
            impressions: 124000,
            costPerResult: 0.35,
            spent: 49.7,
            roas: 4.2,
            ctr: 1.8,
            cpa: 12.5
        },
        {
            id: 2,
            status: "active",
            name: "ESP | NAD+ PURE | REMARKETING | 7D",
            delivery: "active",
            budget: 25,
            results: 89,
            reach: 12000,
            impressions: 28000,
            costPerResult: 0.28,
            spent: 24.9,
            roas: 6.8,
            ctr: 3.2,
            cpa: 8.2
        },
        {
            id: 3,
            status: "paused",
            name: "FRA | PROYECTO NAD | BROAD | V1",
            delivery: "inactive",
            budget: 100,
            results: 12,
            reach: 5200,
            impressions: 8000,
            costPerResult: 8.3,
            spent: 99.6,
            roas: 0.8,
            ctr: 0.9,
            cpa: 45.0
        }
    ];

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] space-y-4">
            {/* Header / Toolbar */}
            <div className="bg-white rounded-3xl border border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#1877F2] flex items-center justify-center shadow-lg shadow-blue-100/50">
                        <Facebook className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-sm font-black text-slate-900 uppercase tracking-tighter leading-none">Ads Manager</h1>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">META API CONNECTED</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <Input className="h-9 w-64 pl-9 rounded-xl border-slate-100 bg-slate-50/50 text-xs font-medium focus:bg-white transition-all shadow-none" placeholder="Buscar campañas..." />
                    </div>
                    <Button variant="outline" className="h-9 rounded-xl border-slate-200 text-[10px] font-black uppercase tracking-widest px-4">
                        <Filter className="w-3.5 h-3.5 mr-2" />
                        Filtros
                    </Button>
                    <Button className="h-9 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest px-6 shadow-lg shadow-slate-200">
                        <Plus className="w-3.5 h-3.5 mr-2" />
                        Crear
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                <div className="px-1 py-1 bg-white border border-slate-200 rounded-2xl mb-4 shadow-sm inline-flex">
                    <TabsList className="bg-transparent h-9 gap-1">
                        <TabsTrigger value="campaigns" className="rounded-xl px-5 py-1.5 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all">
                            <Layout className="w-3.5 h-3.5 mr-2" />
                            Campañas
                        </TabsTrigger>
                        <TabsTrigger value="adsets" className="rounded-xl px-5 py-1.5 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all">
                            <Layers className="w-3.5 h-3.5 mr-2" />
                            Conjuntos
                        </TabsTrigger>
                        <TabsTrigger value="ads" className="rounded-xl px-5 py-1.5 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all">
                            <Play className="w-3.5 h-3.5 mr-2" />
                            Anuncios
                        </TabsTrigger>
                    </TabsList>
                </div>

                <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50 flex flex-col min-h-0 overflow-hidden">
                    <div className="flex-1 overflow-x-auto no-scrollbar">
                        <table className="w-full text-left border-collapse table-fixed min-w-[1800px]">
                            <thead className="sticky top-0 z-10">
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="w-[40px] px-4 py-3"><Input type="checkbox" className="w-3.5 h-3.5 shadow-none" /></th>
                                    <th className="w-[60px] px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">On/Off</th>
                                    <th className="w-[300px] px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Nombre</th>
                                    <th className="w-[100px] px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Entrega</th>
                                    <th className="w-[120px] px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Presupuesto</th>
                                    <th className="w-[100px] px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Resultados</th>
                                    <th className="w-[100px] px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Alcance</th>
                                    <th className="w-[100px] px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Impresiones</th>
                                    <th className="w-[120px] px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Coste / Res</th>
                                    <th className="w-[120px] px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Gastado</th>
                                    <th className="w-[80px] px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">ROAS</th>
                                    <th className="w-[80px] px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">CTR</th>
                                    <th className="w-[80px] px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">CPA</th>
                                    <th className="w-[100px] px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">IA Signal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {mockStats.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors text-[11px] font-medium group">
                                        <td className="px-4 py-2 text-center"><Input type="checkbox" className="w-3.5 h-3.5 shadow-none" /></td>
                                        <td className="px-4 py-2 text-center">
                                            <div className={cn(
                                                "w-8 h-4 rounded-full p-0.5 transition-colors cursor-pointer mx-auto",
                                                item.status === "active" ? "bg-blue-500" : "bg-slate-200"
                                            )}>
                                                <div className={cn(
                                                    "w-3 h-3 bg-white rounded-full transition-transform",
                                                    item.status === "active" ? "translate-x-4" : "translate-x-0"
                                                )} />
                                            </div>
                                        </td>
                                        <td className="px-4 py-2">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">{item.name}</span>
                                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">ID: {item.id}0023498172</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2">
                                            <Badge className={cn(
                                                "rounded-full px-2 py-0 h-4 font-bold text-[8px] uppercase border-none shadow-none",
                                                item.delivery === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"
                                            )}>
                                                {item.delivery}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-2 font-bold text-slate-700">€{item.budget}/día</td>
                                        <td className="px-4 py-2 font-black text-slate-900">{item.results}</td>
                                        <td className="px-4 py-2 text-slate-500">{item.reach.toLocaleString()}</td>
                                        <td className="px-4 py-2 text-slate-500">{item.impressions.toLocaleString()}</td>
                                        <td className="px-4 py-2 font-bold text-slate-700">€{item.costPerResult}</td>
                                        <td className="px-4 py-2 font-bold text-slate-700">€{item.spent}</td>
                                        <td className="px-4 py-2">
                                            <Badge className={cn(
                                                "rounded px-1 py-0 h-4 min-w-[32px] justify-center font-black text-[9px] border-none shadow-none",
                                                item.roas > 2 ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                                            )}>
                                                {item.roas}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-2 text-slate-600 font-bold">{item.ctr}%</td>
                                        <td className="px-4 py-2 text-slate-600 font-bold">€{item.cpa}</td>
                                        <td className="px-4 py-2">
                                            <div className="flex items-center justify-center">
                                                <div className={cn(
                                                    "w-2.5 h-2.5 rounded-full shadow-lg animate-pulse",
                                                    item.roas > 2 ? "bg-emerald-500 shadow-emerald-200" : "bg-rose-500 shadow-rose-200"
                                                )} />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </Tabs>
        </div>
    );
}
