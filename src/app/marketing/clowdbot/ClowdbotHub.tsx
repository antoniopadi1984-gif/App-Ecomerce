"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, UserCheck, TrendingUp, DollarSign, MessageSquare, ShieldAlert, History, Brain, Target, User } from "lucide-react";
import { toast } from "sonner";
import { getClowdbotStats } from "./actions";

export default function ClowdbotHub({ storeId }: { storeId: string }) {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (storeId) loadStats();
    }, [storeId]);

    const loadStats = async () => {
        setLoading(true);
        try {
            const res = await getClowdbotStats(storeId);
            setStats(res);
        } catch (e) {
            toast.error("Error al cargar Clowdbot Hub");
        } finally {
            setLoading(false);
        }
    };

    if (!stats) return null;

    const totalRevenueAssisted = stats.metrics?.reduce((acc: number, m: any) => acc + m.revenueAssisted, 0) || 0;
    const totalOrdersAssisted = stats.metrics?.reduce((acc: number, m: any) => acc + m.ordersAssisted, 0) || 0;

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-cyan-50 rounded-2xl">
                        <Bot className="w-8 h-8 text-cyan-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">CLOWDBOT PERFORMANCE <span className="text-cyan-600 text-[10px] align-top bg-cyan-50 px-2 py-0.5 rounded-full ml-1">v3.0 Learning</span></h2>
                        <p className="text-slate-500 font-medium text-sm">Tu empleado IA trabajando 24/7. Rendimiento e impacto financiero real.</p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Global KPIs */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="rounded-[40px] border-slate-100 bg-white overflow-hidden shadow-sm">
                        <CardHeader className="p-8 border-b border-slate-50">
                            <CardTitle className="text-xs font-black uppercase text-slate-400">Impacto Directo (30d)</CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 space-y-8">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2 mb-2">
                                    <DollarSign className="w-3.5 h-3.5 text-emerald-500" /> Revenue Asistido
                                </label>
                                <div className="text-4xl font-black text-slate-800">{totalRevenueAssisted.toLocaleString()}€</div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2 mb-2">
                                    <TrendingUp className="w-3.5 h-3.5 text-indigo-500" /> Pedidos Confirmados
                                </label>
                                <div className="text-4xl font-black text-slate-800">{totalOrdersAssisted}</div>
                            </div>
                            <div className="pt-6 border-t border-slate-50">
                                <div className="flex justify-between items-center bg-cyan-50 p-4 rounded-2xl">
                                    <span className="text-[10px] font-black uppercase text-cyan-700">Ahorro Coste Humano</span>
                                    <span className="text-sm font-black text-cyan-900">~1,200€</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-[32px] border-amber-100 bg-amber-50/20 overflow-hidden">
                        <CardContent className="p-6">
                            <h4 className="text-[10px] font-black text-amber-700 uppercase mb-2 flex items-center gap-2">
                                <ShieldAlert className="w-4 h-4" /> Alerta de Intervención
                            </h4>
                            <p className="text-xs font-medium text-amber-900/60 leading-tight">
                                El 8% de las conversaciones requieren aprobación humana. Clowdbot aprende de cada rechazo.
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Main: Learning Log & Corrections */}
                <div className="lg:col-span-3 space-y-8">
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2 flex items-center gap-2">
                            <Brain className="w-4 h-4 text-indigo-500" /> Registro de Aprendizaje Incremental
                        </h3>
                        <div className="space-y-4">
                            {stats.corrections?.map((c: any) => (
                                <Card key={c.id} className="rounded-[32px] border-slate-100 bg-white overflow-hidden shadow-sm hover:shadow-md transition-all">
                                    <div className="grid grid-cols-1 md:grid-cols-2">
                                        <div className="p-6 border-r border-slate-50 space-y-4 opacity-50 grayscale-[0.5]">
                                            <div className="flex justify-between items-center">
                                                <Badge variant="outline" className="text-[8px] font-black uppercase rounded-lg">Respuesta Fallida (Clowdbot)</Badge>
                                                <Bot className="w-4 h-4 text-slate-300" />
                                            </div>
                                            <p className="text-xs font-medium text-slate-600 line-clamp-3 leading-relaxeditalic italic">"{c.originalResponse || 'N/A'}"</p>
                                        </div>
                                        <div className="p-6 bg-indigo-50/30 space-y-4">
                                            <div className="flex justify-between items-center">
                                                <Badge className="bg-white text-indigo-600 border-indigo-100 text-[8px] font-black uppercase rounded-lg">Corrección Humana (Fix)</Badge>
                                                <UserCheck className="w-4 h-4 text-indigo-500" />
                                            </div>
                                            <p className="text-xs font-black text-slate-800 leading-relaxed italic">"{c.humanCorrection}"</p>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Aprendido el {new Date(c.learnedAt).toLocaleDateString()} • {c.reasoning || "Referencia futura guardada"}</span>
                                    </div>
                                </Card>
                            ))}
                            {!stats.corrections?.length && (
                                <div className="p-10 border-2 border-dashed border-slate-100 rounded-[32px] text-center text-slate-300 italic font-medium">
                                    No hay correcciones registradas. El sistema está en equilibrio.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Acciones Recientes Impactantes</h3>
                        <Card className="rounded-[40px] border-slate-100 bg-white overflow-hidden">
                            <CardContent className="p-0">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead className="bg-slate-50 border-b border-slate-100">
                                        <tr>
                                            <th className="p-4 font-black uppercase tracking-widest text-slate-400">Canal</th>
                                            <th className="p-4 font-black uppercase tracking-widest text-slate-400">Acción</th>
                                            <th className="p-4 font-black uppercase tracking-widest text-slate-400">Impacto</th>
                                            <th className="p-4 font-black uppercase tracking-widest text-slate-400 text-right">Fecha</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {stats.actions?.map((a: any) => (
                                            <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                                                        <span className="font-bold text-slate-600">WhatsApp</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 font-bold text-slate-800 uppercase">{a.actionType}</td>
                                                <td className="p-4">
                                                    {a.impactMetric ? (
                                                        <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[9px] font-black">+{a.impactValue}€ {a.impactMetric}</Badge>
                                                    ) : (
                                                        <span className="text-slate-300">Nivel de Impacto Medio</span>
                                                    )}
                                                </td>
                                                <td className="p-4 text-right text-slate-400 font-medium">{new Date(a.createdAt).toLocaleTimeString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
