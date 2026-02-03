
"use client";

import React, { useState } from "react";
import {
    ShieldAlert,
    ShieldCheck,
    MessageSquare,
    Zap,
    Filter,
    MoreVertical,
    ChevronRight,
    UserCheck,
    Ban,
    Settings,
    ShieldHalf
} from "lucide-react";

export default function SocialModerationPage() {
    const [isActive, setIsActive] = useState(false); // Default OFF per user request

    return (
        <div className="p-6 space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-500">
            {/* Header with ON/OFF Switch */}
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent">
                        CommentGuard PRO
                    </h1>
                    <p className="text-muted-foreground text-sm uppercase tracking-wider font-medium">Moderación Inteligente de Redes Sociales</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border transition-all ${isActive ? 'bg-green-500/10 border-green-500/20' : 'bg-slate-500/10 border-slate-500/20'}`}>
                        <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`} />
                        <span className={`text-[11px] font-black uppercase ${isActive ? 'text-green-500' : 'text-slate-400'}`}>
                            SISTEMA: {isActive ? 'ACTIVO' : 'INACTIVO'}
                        </span>
                        <button
                            onClick={() => setIsActive(!isActive)}
                            className={`ml-4 w-12 h-6 rounded-full p-1 transition-all duration-300 ${isActive ? 'bg-green-600' : 'bg-slate-300'}`}
                        >
                            <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-300 ${isActive ? 'translate-x-6' : ''}`} />
                        </button>
                    </div>
                </div>
            </div>

            {isActive ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Main Inbox */}
                    <div className="lg:col-span-8 flex flex-col gap-6">
                        <div className="rounded-2xl border border-white/5 bg-card/30 backdrop-blur-xl overflow-hidden shadow-2xl min-h-[600px] flex flex-col">
                            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                                <div className="flex items-center gap-4">
                                    <span className="text-sm font-black uppercase tracking-widest text-muted-foreground">Inbox Único</span>
                                    <div className="flex items-center gap-1">
                                        <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-black uppercase tracking-tighter">IG</span>
                                        <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 text-[10px] font-black uppercase tracking-tighter">FB</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 flex flex-col lg:flex-row divide-x divide-white/5">
                                <div className="w-full lg:w-80 flex flex-col divide-y divide-white/5 bg-black/10">
                                    <div className="p-4 text-center py-20 opacity-30">
                                        <MessageSquare className="w-8 h-8 mx-auto mb-2" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">No hay comentarios nuevos</p>
                                    </div>
                                </div>
                                <div className="flex-1 p-8 flex flex-col items-center justify-center text-center opacity-20">
                                    <ShieldCheck className="w-16 h-16 mb-4" />
                                    <h3 className="text-xl font-bold italic tracking-tighter">TRUTH LAYER ACTIVADA</h3>
                                    <p className="max-w-md mx-auto text-sm">CommentGuard está monitoreando tus publicaciones en busca de spam, insultos y consultas de venta en tiempo real.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Rules & Stats Sidebar */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="p-6 rounded-2xl border border-white/5 bg-card/40 backdrop-blur-md shadow-xl">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-4 text-muted-foreground">Estado de Prevención</h3>
                            <div className="space-y-4">
                                <StatItem label="Spam Bloqueado" value="0" color="text-red-400" />
                                <StatItem label="Consultas Detectadas" value="0" color="text-green-400" />
                                <StatItem label="Intervenciones IA" value="0" color="text-primary" />
                            </div>
                        </div>

                        <div className="p-6 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 backdrop-blur-md shadow-xl group hover:border-indigo-500/40 transition-all cursor-pointer">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xs font-black uppercase tracking-wider text-indigo-400">Constructor de Reglas</h3>
                                <Zap className="w-4 h-4 text-indigo-400 animate-pulse" />
                            </div>
                            <p className="text-[11px] text-white/50 mb-4">Define patrones de comportamiento y respuestas automáticas basadas en intención.</p>
                            <div className="space-y-2">
                                <RulePreview label="Pre-Venta Intent" active={true} />
                                <RulePreview label="Support Escalation" active={true} />
                                <RulePreview label="Spam Pattern Alpha" active={false} />
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="py-20 flex flex-col items-center justify-center text-center max-w-2xl mx-auto space-y-8 animate-in slide-in-from-bottom-5">
                    <div className="w-24 h-24 rounded-full bg-slate-500/10 flex items-center justify-center border border-slate-500/20 shadow-2xl">
                        <ShieldHalf className="w-12 h-12 text-slate-400" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black italic tracking-tighter mb-4 text-slate-300 uppercase">CommentGuard PRO está en espera</h2>
                        <p className="text-slate-500 font-medium">El módulo de moderación social requiere credenciales <span className="text-indigo-400">META_SOCIAL</span> para operar. El sistema está preparado, pero permanece inactivo para seguridad de tu cuenta.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                        <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02] text-left">
                            <div className="flex items-center gap-2 mb-2">
                                <UserCheck className="w-4 h-4 text-indigo-400" />
                                <span className="text-xs font-black uppercase">Cuentas Vinculadas</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground">Conecta tu Fan Page y cuenta de Instagram para comenzar el monitoreo inteligente.</p>
                        </div>
                        <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02] text-left">
                            <div className="flex items-center gap-2 mb-2">
                                <Settings className="w-4 h-4 text-indigo-400" />
                                <span className="text-xs font-black uppercase">Perfil del Agente</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground">Define el tono y las reglas de respuesta antes de activar la IA en producción.</p>
                        </div>
                    </div>

                    <button className="px-8 py-3 rounded-full bg-slate-800 text-white font-black uppercase tracking-widest text-xs hover:bg-indigo-600 transition-all shadow-xl">
                        Modo Configuración (Token Requerido)
                    </button>
                </div>
            )}
        </div>
    );
}

function StatItem({ label, value, color }: { label: string; value: string; color: string }) {
    return (
        <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">{label}</span>
            <span className={`text-sm font-mono font-bold ${color}`}>{value}</span>
        </div>
    );
}

function RulePreview({ label, active }: { label: string; active: boolean }) {
    return (
        <div className="flex items-center justify-between p-2 rounded-lg bg-black/20 group-hover:bg-black/30 transition-colors">
            <span className="text-[11px] font-bold text-white/70">{label}</span>
            <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-indigo-400' : 'bg-slate-600'}`} />
        </div>
    );
}
