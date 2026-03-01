"use client";

import React, { useState, useCallback } from "react";
import { CreativeAgentPanel } from "@/components/creative/CreativeAgentPanel";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Gift, BookOpen, ShieldAlert, MessageCircle, Calendar, Sparkles,
    Loader2, Brain, AlertTriangle, Check
} from "lucide-react";

interface ResourcesModuleProps {
    storeId?: string;
    productId?: string;
    productTitle?: string;
}

type PostVentaTab = 'contenidos' | 'riesgo' | 'refuerzo' | 'almanaque' | 'agent';

export function ResourcesModule({ storeId = '', productId, productTitle }: ResourcesModuleProps) {
    const [activeTab, setActiveTab] = useState<PostVentaTab>('contenidos');
    const [riskResult, setRiskResult] = useState<any>(null);
    const [reinforcement, setReinforcement] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [orderId, setOrderId] = useState('');

    // COD Risk calculation
    const handleCalculateRisk = useCallback(async () => {
        if (!orderId.trim()) return;
        setLoading(true);
        try {
            const { calculateOrderRisk } = await import('@/app/marketing/post-venta/actions');
            const result = await calculateOrderRisk(orderId);
            setRiskResult(result);
        } catch (e: any) {
            setRiskResult({ error: e.message });
        }
        setLoading(false);
    }, [orderId]);

    // WhatsApp reinforcement
    const handleReinforcement = useCallback(async () => {
        if (!orderId.trim()) return;
        setLoading(true);
        try {
            const { generateReinforcementContent } = await import('@/app/marketing/post-venta/actions');
            const result = await generateReinforcementContent(orderId);
            setReinforcement(result);
        } catch (e: any) {
            setReinforcement({ error: e.message });
        }
        setLoading(false);
    }, [orderId]);

    const tabs: { id: PostVentaTab; label: string; icon: React.ReactNode }[] = [
        { id: 'contenidos', label: 'Contenidos', icon: <BookOpen className="h-3.5 w-3.5" /> },
        { id: 'riesgo', label: 'Riesgo COD', icon: <ShieldAlert className="h-3.5 w-3.5" /> },
        { id: 'refuerzo', label: 'Refuerzo WA', icon: <MessageCircle className="h-3.5 w-3.5" /> },
        { id: 'almanaque', label: 'Almanaque', icon: <Calendar className="h-3.5 w-3.5" /> },
        { id: 'agent', label: 'Agente IA', icon: <Brain className="h-3.5 w-3.5" /> },
    ];

    return (
        <div className="bg-slate-50/30 -m-3 p-3 min-h-[800px] overflow-hidden space-y-4">
            {/* Sub-tabs */}
            <div className="flex items-center gap-1 bg-white rounded-xl p-1 border border-slate-200 shadow-sm overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === tab.id
                            ? 'bg-slate-900 text-white shadow-sm'
                            : 'text-slate-500 hover:bg-slate-100'
                            }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* TAB: Contenidos (eBooks, cursos, cupones) */}
            {activeTab === 'contenidos' && (
                <div className="bg-white rounded-xl border border-slate-200 flex items-center justify-center p-10">
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Contenidos — Biblioteca Creativa</p>
                </div>
            )}

            {/* TAB: Riesgo COD */}
            {activeTab === 'riesgo' && (
                <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
                    <CardHeader className="p-4 border-b border-slate-100">
                        <CardTitle className="text-sm font-black uppercase tracking-tight flex items-center gap-2">
                            <ShieldAlert className="h-4 w-4 text-amber-600" />
                            Análisis de Riesgo COD
                        </CardTitle>
                        <CardDescription className="text-[10px]">
                            Evalúa probabilidad de rechazo en pedidos contra-reembolso (0-100)
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                        <div className="flex gap-2">
                            <Input
                                value={orderId}
                                onChange={e => setOrderId(e.target.value)}
                                placeholder="ID del pedido..."
                                className="text-xs h-9 rounded-lg"
                            />
                            <Button
                                onClick={handleCalculateRisk}
                                disabled={loading || !orderId.trim()}
                                className="h-9 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg px-4"
                            >
                                {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <ShieldAlert className="h-3 w-3 mr-1" />}
                                Analizar
                            </Button>
                        </div>

                        {riskResult && !riskResult.error && (
                            <div className={`rounded-xl p-4 border ${riskResult.riskLevel === 'HIGH' ? 'bg-red-50 border-red-200' :
                                riskResult.riskLevel === 'MEDIUM' ? 'bg-amber-50 border-amber-200' :
                                    'bg-green-50 border-green-200'
                                }`}>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className={`text-3xl font-black ${riskResult.riskLevel === 'HIGH' ? 'text-red-600' :
                                        riskResult.riskLevel === 'MEDIUM' ? 'text-amber-600' :
                                            'text-green-600'
                                        }`}>
                                        {riskResult.riskScore}
                                    </div>
                                    <div>
                                        <Badge className={`font-black text-[10px] ${riskResult.riskLevel === 'HIGH' ? 'bg-red-100 text-red-700' :
                                            riskResult.riskLevel === 'MEDIUM' ? 'bg-amber-100 text-amber-700' :
                                                'bg-green-100 text-green-700'
                                            }`}>
                                            {riskResult.riskLevel}
                                        </Badge>
                                    </div>
                                </div>
                                {riskResult.reasons && (
                                    <ul className="space-y-1 text-xs text-slate-600">
                                        {riskResult.reasons.map((r: string, i: number) => (
                                            <li key={i} className="flex items-start gap-1">
                                                <AlertTriangle className="h-3 w-3 text-amber-500 mt-0.5 flex-shrink-0" />
                                                {r}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                {riskResult.strategy && (
                                    <p className="text-[10px] font-bold text-slate-500 mt-2 pt-2 border-t border-slate-200">
                                        Estrategia: {riskResult.strategy}
                                    </p>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* TAB: Refuerzo WhatsApp */}
            {activeTab === 'refuerzo' && (
                <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
                    <CardHeader className="p-4 border-b border-slate-100">
                        <CardTitle className="text-sm font-black uppercase tracking-tight flex items-center gap-2">
                            <MessageCircle className="h-4 w-4 text-green-600" />
                            Refuerzo de Valor — WhatsApp
                        </CardTitle>
                        <CardDescription className="text-[10px]">
                            Contenido de refuerzo para asegurar entrega en pedidos de riesgo
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                        <div className="flex gap-2">
                            <Input
                                value={orderId}
                                onChange={e => setOrderId(e.target.value)}
                                placeholder="ID del pedido..."
                                className="text-xs h-9 rounded-lg"
                            />
                            <Button
                                onClick={handleReinforcement}
                                disabled={loading || !orderId.trim()}
                                className="h-9 text-xs font-bold bg-green-600 hover:bg-green-700 text-white rounded-lg px-4"
                            >
                                {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <MessageCircle className="h-3 w-3 mr-1" />}
                                Generar
                            </Button>
                        </div>

                        {reinforcement && !reinforcement.error && (
                            <div className="bg-green-50 rounded-xl p-4 border border-green-200 space-y-3">
                                <div>
                                    <span className="text-[9px] font-black uppercase text-green-600 tracking-widest">Headline</span>
                                    <p className="text-sm font-bold text-slate-800">{reinforcement.headline}</p>
                                </div>
                                <div>
                                    <span className="text-[9px] font-black uppercase text-green-600 tracking-widest">Cuerpo</span>
                                    <p className="text-xs text-slate-600">{reinforcement.body}</p>
                                </div>
                                <div>
                                    <span className="text-[9px] font-black uppercase text-green-600 tracking-widest">Bonus Tip</span>
                                    <p className="text-xs text-slate-600 italic">{reinforcement.bonusTip}</p>
                                </div>
                                <div>
                                    <span className="text-[9px] font-black uppercase text-green-600 tracking-widest">Razón para Aceptar</span>
                                    <p className="text-xs text-slate-600">{reinforcement.reasonToAccept}</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* TAB: Almanaque */}
            {activeTab === 'almanaque' && (
                <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
                    <CardHeader className="p-4 border-b border-slate-100">
                        <CardTitle className="text-sm font-black uppercase tracking-tight flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-indigo-600" />
                            Almanaque Editorial + Campañas
                        </CardTitle>
                        <CardDescription className="text-[10px]">
                            Calendario de contenidos, automatizaciones y campañas de retención
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4">
                        <div className="text-center py-8 text-slate-400">
                            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-xs font-bold">Almanaque Editorial</p>
                            <p className="text-[10px]">Genera un calendario de publicaciones adaptado a tu producto y audiencia</p>
                            <Button className="mt-3 h-8 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg">
                                <Sparkles className="h-3 w-3 mr-1" /> Generar Almanaque
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* TAB: Agent IA */}
            {activeTab === 'agent' && storeId && (
                <CreativeAgentPanel
                    storeId={storeId}
                    productId={productId}
                    productTitle={productTitle}
                    agentRole="POSTVENTA_AGENT"
                    agentName="Post-Venta IA"
                    defaultOpen={true}
                    onGenerate={(text) => console.log('[PostVenta] Agent generated:', text.slice(0, 100))}
                />
            )}
        </div>
    );
}
