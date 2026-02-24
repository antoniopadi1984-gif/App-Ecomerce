"use client";

import { useState } from "react";
import {
    Zap, Sparkles, Target, ArrowRight,
    RefreshCw, ShieldCheck, TrendingUp,
    BarChart4, Brain
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getFinancialAdvice } from "@/app/finances/ai-optimizer/actions";
import { cn } from "@/lib/utils";

export function FinanceAiBunker() {
    const [goal, setGoal] = useState("");
    const [loading, setLoading] = useState(false);
    const [advice, setAdvice] = useState<string | null>(null);

    const handleConsult = async () => {
        if (!goal.trim()) return;
        setLoading(true);
        const res = await getFinancialAdvice(goal);
        if (res.success) {
            setAdvice(res.text || null);
            toast.success("Estrategia generada por el Búnker AI");
        } else {
            toast.error("Error al conectar con el cerebro financiero");
        }
        setLoading(false);
    };

    return (
        <Card className="premium-card bg-slate-900 border-none overflow-hidden rounded-[3rem] shadow-2xl relative">
            {/* Background elements */}
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                <Brain className="h-64 w-64 text-primary" />
            </div>

            <CardHeader className="p-10 pb-4 relative z-10">
                <div className="flex items-center gap-3 mb-4">
                    <Badge className="bg-primary/20 text-primary border-none font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-full">
                        Financial Optimizer v3.0
                    </Badge>
                    <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Búnker Activo</span>
                    </div>
                </div>
                <CardTitle className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none flex items-center gap-4">
                    BÚNKER <span className="text-primary not-italic">FINANCIERO IA</span>
                </CardTitle>
                <CardDescription className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-2">
                    Estrategia de Escalado & Optimización basada en Datos Reales
                </CardDescription>
            </CardHeader>

            <CardContent className="p-10 pt-0 relative z-10 space-y-8">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Target className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                        <Input
                            value={goal}
                            onChange={(e) => setGoal(e.target.value)}
                            placeholder="Ej: Quiero llegar a 2.000€ netos de beneficio este mes..."
                            className="h-16 pl-12 bg-white/10 border-white/10 text-white rounded-2xl font-bold placeholder:text-slate-500 focus:ring-primary/20"
                            onKeyDown={(e) => e.key === 'Enter' && handleConsult()}
                        />
                    </div>
                    <Button
                        onClick={handleConsult}
                        disabled={loading}
                        className="h-16 px-10 bg-primary hover:bg-primary/90 text-primary-foreground font-black rounded-2xl gap-3 shadow-xl active:scale-95 transition-all text-xs uppercase tracking-widest"
                    >
                        {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Zap className="h-5 w-5" />}
                        {loading ? "Analizando Ledger..." : "GENERAR RUTA DE ESCALADO"}
                    </Button>
                </div>

                {advice ? (
                    <div className="animate-in slide-in-from-bottom duration-500 bg-white/5 border border-white/10 rounded-[2rem] p-8 space-y-6">
                        <div className="flex items-center justify-between border-b border-white/5 pb-4">
                            <div className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-primary" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Hoja de Ruta Maestra</span>
                            </div>
                            <Button variant="ghost" size="sm" className="h-8 text-[9px] font-bold text-slate-500 uppercase hover:text-white" onClick={() => setAdvice(null)}>
                                NUEVA CONSULTA
                            </Button>
                        </div>
                        <div className="prose prose-invert max-w-none">
                            <p className="text-sm font-medium leading-relaxed text-slate-200 whitespace-pre-wrap">
                                {advice}
                            </p>
                        </div>
                        <div className="flex gap-4 pt-4">
                            <div className="flex-1 bg-white/5 rounded-xl p-4 border border-white/5">
                                <span className="block text-[9px] font-black text-primary uppercase">Factor Crítico</span>
                                <span className="text-xs font-bold text-white">ROAS & CPA Target</span>
                            </div>
                            <div className="flex-1 bg-white/5 rounded-xl p-4 border border-white/5">
                                <span className="block text-[9px] font-black text-emerald-500 uppercase">Estado</span>
                                <span className="text-xs font-bold text-white">Objetivo Viable</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <InsightBox
                            icon={BarChart4}
                            title="Análisis de Margen"
                            desc="Cálculo real de rentabilidad descontando IVA y pasarelas."
                        />
                        <InsightBox
                            icon={TrendingUp}
                            title="Predicción de Escalado"
                            desc="Cuánta inversión extra necesitas para tu meta de ventas."
                        />
                        <InsightBox
                            icon={ShieldCheck}
                            title="Control de Riesgo"
                            desc="Alertas sobre CPA máximo tolerable por producto."
                        />
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function InsightBox({ icon: Icon, title, desc }: any) {
    return (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-2 hover:bg-white/10 transition-colors cursor-default">
            <Icon className="h-5 w-5 text-primary" />
            <h5 className="text-[11px] font-black uppercase text-white tracking-tight">{title}</h5>
            <p className="text-[10px] text-slate-500 font-bold leading-tight uppercase">{desc}</p>
        </div>
    );
}
