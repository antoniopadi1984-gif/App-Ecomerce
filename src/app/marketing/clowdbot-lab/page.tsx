"use client";

import { Sparkles, Bot, Zap, ShieldCheck } from "lucide-react";
import { ClowdbotConfig } from "@/components/marketing/clowdbot-config";
import { Badge } from "@/components/ui/badge";

export default function ClowdbotLabPage() {
    return (
        <div className="w-full flex flex-col gap-10 min-h-screen bg-[#FDFDFD] pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-10 border-b border-border/50">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <Badge className="bg-primary/10 text-primary border-none font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-full">
                            Operational AI v5.0
                        </Badge>
                        <div className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Núcleo Activo</span>
                        </div>
                    </div>
                    <div>
                        <h1 className="text-6xl font-black text-foreground italic tracking-tighter leading-none flex items-center gap-4">
                            CLOWDBOT <span className="text-primary not-italic">ELITE</span>
                        </h1>
                        <p className="text-sm text-muted-foreground font-bold uppercase tracking-[0.3em] mt-3">Agente Omnicanal de Atención Neuronal</p>
                    </div>
                </div>

                <div className="flex items-center gap-6 bg-card border border-border px-8 py-5 rounded-[2rem] shadow-xl shadow-slate-100">
                    <div className="text-right">
                        <span className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest">Nivel de Autonomía</span>
                        <span className="text-xs font-black text-foreground uppercase italic flex items-center justify-end gap-2">
                            Totalmente Autónomo <ShieldCheck className="h-4 w-4 text-emerald-500" />
                        </span>
                    </div>
                    <div className="h-10 w-px bg-border" />
                    <Bot className="h-10 w-10 text-primary" />
                </div>
            </div>

            {/* Main Config Component */}
            <ClowdbotConfig />

            {/* Bottom Insight */}
            <div className="mt-10 p-10 bg-slate-900 rounded-[3rem] text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none">
                    <Zap className="h-40 w-40 text-primary rotate-12" />
                </div>
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-10">
                    <div className="space-y-2">
                        <h4 className="text-xs font-black uppercase text-primary tracking-[0.2em]">Visión Omnicanal</h4>
                        <p className="text-xs text-slate-400 font-medium leading-relaxed">Centraliza WhatsApp y Email en una sola conciencia. El cliente siente que habla con la misma persona en cualquier canal.</p>
                    </div>
                    <div className="space-y-2">
                        <h4 className="text-xs font-black uppercase text-primary tracking-[0.2em]">Conexión Real-Time</h4>
                        <p className="text-xs text-slate-400 font-medium leading-relaxed">Conectado a Beeping y Dropea. Resuelve estados de envío e incidencias sin intervención humana en segundos.</p>
                    </div>
                    <div className="space-y-2">
                        <h4 className="text-xs font-black uppercase text-primary tracking-[0.2em]">Aprendizaje de Marca</h4>
                        <p className="text-xs text-slate-400 font-medium leading-relaxed">Inyecta tus políticas de reembolso y claims directamente en su cerebro para una fidelización de alto nivel.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
