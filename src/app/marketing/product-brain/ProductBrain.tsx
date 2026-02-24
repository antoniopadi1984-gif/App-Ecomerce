"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BrainCircuit, GitBranch, ShieldCheck, Zap, AlertCircle, RefreshCw, Layers, TrendingUp, BarChart3, Database, Workflow } from "lucide-react";
import { toast } from "sonner";
import { getBrainData, syncKnowledgeGraph, calculateMaturityScore } from "./actions";

export default function ProductBrain({ productId }: { productId: string }) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (productId) loadData();
    }, [productId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await getBrainData(productId);
            setData(res);
        } catch (e) {
            toast.error("Error al cargar el Cerebro del Producto");
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async () => {
        setLoading(true);
        try {
            await syncKnowledgeGraph(productId);
            await calculateMaturityScore(productId);
            toast.success("Cerebro sincronizado correctamente");
            loadData();
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setLoading(false);
        }
    };

    if (!data) return null;

    const maturity = data.maturity;

    return (
        <section className="space-y-4 animate-in fade-in duration-700">
            {/* Level 1: Maturity Score & Signal */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900 p-4 rounded-lg border border-slate-800 shadow-xl gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                        <BrainCircuit className="w-6 h-6 text-indigo-400 animate-pulse" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-white uppercase tracking-tighter flex items-center gap-2">
                            MEMORY GRAPH <span className="text-[8px] bg-indigo-600 px-1.5 py-0.5 rounded-sm text-white">BETA ENGINE</span>
                        </h2>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px] mt-0.5">Inteligencia acumulativa conectada</p>
                    </div>
                </div>

                <div className="flex items-center gap-6 w-full md:w-auto bg-white/5 p-3 rounded-lg border border-white/5">
                    <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full mb-1 ${maturity?.overall > 0.7 ? 'bg-emerald-500 shadow-emerald-500/50' : maturity?.overall > 0.4 ? 'bg-amber-500 shadow-amber-500/50' : 'bg-rose-500 shadow-rose-500/50'} shadow-lg animate-pulse`}></div>
                        <span className="text-[8px] font-black text-slate-500 uppercase">SIGNAL</span>
                    </div>
                    <div className="h-8 w-px bg-white/10 hidden md:block"></div>
                    <div>
                        <span className="text-[8px] font-black text-slate-500 uppercase block mb-0.5">Maturity Score</span>
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-black text-white">{(maturity?.overall * 100 || 0).toFixed(0)}%</span>
                            <Button onClick={handleSync} disabled={loading} variant="ghost" className="text-indigo-400 hover:bg-white/5 h-7 w-7 p-0 rounded-lg">
                                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Product Maturity Radar */}
                <div className="lg:col-span-1 space-y-4">
                    <Card className="rounded-lg border-slate-100 shadow-sm bg-white overflow-hidden">
                        <CardHeader className="p-4 border-b border-slate-50">
                            <CardTitle className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
                                <BarChart3 className="w-3.5 h-3.5 text-indigo-500" /> Score de Madurez
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                            {[
                                { label: "Deep Research", val: maturity?.research, icon: Database },
                                { label: "Avatar Definition", val: maturity?.avatar, icon: Workflow },
                                { label: "Landing Optimizada", val: maturity?.landing, icon: Layers },
                                { label: "Creativos Suficientes", val: maturity?.creatives, icon: Zap },
                                { label: "Post-Venta Activa", val: maturity?.postVenta, icon: ShieldCheck }
                            ].map((item, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase">
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <item.icon className="w-3.5 h-3.5" /> {item.label}
                                        </div>
                                        <span className={item.val >= 0.8 ? 'text-emerald-600' : 'text-slate-400'}>{(item.val * 100 || 0).toFixed(0)}%</span>
                                    </div>
                                    <Progress value={(item.val || 0) * 100} className="h-2 rounded-full bg-slate-100" />
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                        <h4 className="text-[10px] font-black text-indigo-700 uppercase mb-1 flex items-center gap-2">
                            <RefreshCw className="w-3.5 h-3.5" /> Loop de Aprendizaje
                        </h4>
                        <p className="text-[10px] font-bold text-indigo-900/60 leading-tight">
                            El sistema ha capturado {data.nodes?.length || 0} nodos de conocimiento. Cada relación fortalece la predicción.
                        </p>
                    </div>
                </div>

                {/* Knowledge Graph Visualization (Simplified Grid for now, Canvas later) */}
                <div className="lg:col-span-2 space-y-4">
                    <Card className="rounded-lg border-slate-100 shadow-sm bg-white overflow-hidden h-full">
                        <CardHeader className="p-4 border-b border-slate-50 flex flex-row justify-between items-center">
                            <CardTitle className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
                                <GitBranch className="w-3.5 h-3.5 text-indigo-500" /> Conexiones Brain Graph
                            </CardTitle>
                            <Badge variant="outline" className="rounded-lg text-[8px] font-black uppercase text-slate-400 px-1.5 py-0">
                                {data.links?.length || 0} CONEXIONES
                            </Badge>
                        </CardHeader>
                        <CardContent className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {data.links?.map((link: any, i: number) => (
                                    <div key={i} className="group p-3 bg-slate-50 hover:bg-slate-900 transition-all rounded-lg border border-slate-100 hover:border-slate-800 space-y-1.5 cursor-pointer">
                                        <div className="flex items-center justify-between">
                                            <Badge className="bg-indigo-100 text-indigo-600 border-0 text-[7px] font-black group-hover:bg-indigo-500 group-hover:text-white uppercase px-1 py-0">
                                                {link.relationType}
                                            </Badge>
                                            <TrendingUp className="w-3 h-3 text-slate-300 group-hover:text-emerald-400" />
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-800 group-hover:text-white leading-tight">
                                            {link.explanation || 'Conexión estratégica detectada'}
                                        </p>
                                        <div className="flex items-center gap-2 text-[8px] font-black text-slate-400 uppercase pt-2">
                                            <span className="group-hover:text-slate-500">{link.sourceId}</span>
                                            <GitBranch className="w-3 h-3" />
                                            <span className="group-hover:text-slate-500">{link.targetId}</span>
                                        </div>
                                    </div>
                                ))}
                                {!data.links?.length && (
                                    <div className="col-span-full py-20 text-center opacity-30 italic font-black text-slate-400">
                                        No hay conexiones activas. Sincroniza el cerebro.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>
    );
}
