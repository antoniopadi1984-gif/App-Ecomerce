"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Package, Sparkles, Wand2, Plus, TrendingUp, Bot, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { t } from "@/lib/constants/translations";

export default function NewProductPage() {
    const router = useRouter();

    return (
        <div className="max-w-5xl mx-auto py-6 px-4 animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-6">
            <div className="flex items-center justify-between">
                <Button
                    variant="ghost"
                    onClick={() => router.back()}
                    className="gap-1.5 text-slate-400 hover:text-slate-900 h-8 px-2 text-[10px] font-black uppercase tracking-widest"
                >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    {t('back')}
                </Button>

                <div className="flex items-center gap-3">
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">Ambiente de Configuración v4</span>
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Form */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg shadow-slate-200 shrink-0">
                            <Plus className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-slate-900 tracking-tighter uppercase italic">Nuevo Producto</h1>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Configuración técnica maestra</p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Nombre del Producto</label>
                                <Input placeholder="Ej: Super Gadget 3000" className="h-10 rounded-xl bg-slate-50 border-none focus-visible:bg-white font-bold px-4 text-xs" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Categoría / Familia</label>
                                <Input placeholder="Ej: Suplementos" className="h-10 rounded-xl bg-slate-50 border-none focus-visible:bg-white font-bold px-4 text-xs" />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">URL de Referencia (Contexto)</label>
                            <Input placeholder="https://amazon.es/..." className="h-10 rounded-xl bg-slate-50 border-none focus-visible:bg-white font-bold px-4 text-xs" />
                        </div>

                        <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Button className="h-10 rounded-xl bg-slate-900 text-white hover:bg-black font-black uppercase tracking-widest text-[10px] gap-2">
                                <Package className="w-3.5 h-3.5" /> Crear Manual
                            </Button>
                            <Button className="h-10 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 font-black uppercase tracking-widest text-[10px] gap-2 shadow-lg shadow-indigo-100">
                                <Wand2 className="w-3.5 h-3.5" /> Generar con IA
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Right: Metrics/Info */}
                <div className="space-y-4">
                    <div className="bg-indigo-900 text-white p-5 rounded-2xl shadow-xl shadow-indigo-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16" />
                        <Sparkles className="w-5 h-5 text-indigo-300 mb-3" />
                        <h3 className="text-xs font-black uppercase tracking-widest mb-1">IA Foresnsic Sync</h3>
                        <p className="text-[10px] text-indigo-200 font-medium leading-relaxed">
                            Al crear el producto, nuestro motor IA analizará automáticamente la vertical para generar los primeros avatares y ángulos de venta.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        <div className="bg-white p-4 rounded-xl border border-slate-100 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                                <TrendingUp className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Predicción</p>
                                <p className="text-[11px] font-bold text-slate-900">Score de Éxito Estimado</p>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-100 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                                <Bot className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Auto-Config</p>
                                <p className="text-[11px] font-bold text-slate-900">Maestro Ingest Ready</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
