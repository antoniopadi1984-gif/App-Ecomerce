"use client";

import React, { useState, useEffect } from "react";
import {
    Wand2, Zap, Layout, Play, User,
    Layers, RefreshCw, CheckCircle2,
    AlertCircle, ChevronRight, Settings2,
    DollarSign, BarChart, FileText, Sparkles, BrainCircuit
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CreativeFactoryPanelProps {
    productId: string;
    productName: string;
    onBatchCreated?: (batchId: string) => void;
}

export function CreativeFactoryPanel({ productId, productName, onBatchCreated }: CreativeFactoryPanelProps) {
    const [type, setType] = useState<'STATIC_AD' | 'IMAGE_TO_VIDEO' | 'AVATAR_LIPSYNC' | 'COPYWRITING'>('STATIC_AD');
    const [tier, setTier] = useState<'cheap' | 'balanced' | 'premium'>('balanced');
    const [quantity, setQuantity] = useState(1);
    const [isCreating, setIsCreating] = useState(false);

    const [activeBatches, setActiveBatches] = useState<any[]>([]);
    const [specs, setSpecs] = useState<any>(null);
    const [loadingSpecs, setLoadingSpecs] = useState(false);

    // Fetch strategic specs for the product
    const fetchSpecs = async () => {
        if (!productId) return;
        setLoadingSpecs(true);
        try {
            const res = await fetch(`/api/creative/specs?productId=${productId}`);
            const data = await res.json();
            if (data.success) setSpecs(data.specs);
        } catch (e) {
            console.error("Error fetching specs:", e);
        } finally {
            setLoadingSpecs(false);
        }
    };

    // Fetch active batches for this product
    const fetchBatches = async () => {
        try {
            const res = await fetch(`/api/creative/batch?productId=${productId}`);
            const data = await res.json();
            if (data.batches) setActiveBatches(data.batches);
        } catch (e) {
            console.error("Error fetching batches:", e);
        }
    };

    useEffect(() => {
        if (productId) {
            fetchBatches();
            fetchSpecs();
        }
        const interval = setInterval(fetchBatches, 5000);
        return () => clearInterval(interval);
    }, [productId]);

    const handleGenerate = async () => {
        setIsCreating(true);
        try {
            const res = await fetch("/api/creative/batch", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    productId,
                    type,
                    tier,
                    quantity,
                    specs: {
                        prompt: specs?.[type]?.prompt || `High quality ${type} for ${productName}`,
                        aspect_ratio: specs?.[type]?.aspect_ratio || "1:1"
                    }
                })
            });

            const data = await res.json();
            if (data.success) {
                toast.success(`Batch de ${quantity} creativos encolado con éxito.`);
                if (onBatchCreated) onBatchCreated(data.batchId);
                fetchBatches();
            } else {
                toast.error(`Error: ${data.error}`);
            }
        } catch (e) {
            toast.error("Error de conexión al servidor.");
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <Card className="bg-white/40 backdrop-blur-md border border-slate-100/50 rounded-3xl overflow-hidden shadow-sm group">
            <CardContent className="p-0">
                {/* Header Section */}
                <div className="bg-slate-900 px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 shadow-inner">
                            <Wand2 className="h-4.5 w-4.5 text-rose-300" />
                        </div>
                        <div>
                            <h2 className="text-xs font-black text-white italic uppercase tracking-tighter">FÁBRICA <span className="text-rose-500 not-italic">CREATIVA</span></h2>
                            <p className="text-slate-400 text-[7px] font-black uppercase tracking-widest mt-0.5">Motor de Generación Neuronal V4</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            className="bg-white/5 hover:bg-white/10 text-white border-white/10 font-black uppercase text-[8px] tracking-widest h-7 px-3 rounded-lg gap-2 transition-all"
                            onClick={() => toast.info("Motor Central: Online")}
                        >
                            <Sparkles className="w-3 h-3" /> ASISTENTE MAESTRO
                        </Button>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                            <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-emerald-400 font-black uppercase text-[8px] tracking-widest">ACTIVO</span>
                        </div>
                    </div>
                </div>

                <div className="p-5 space-y-5">
                    {/* Controls Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                        {/* Type Selector */}
                        <div className="space-y-2.5">
                            <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 ml-1">
                                <Layers className="w-3 h-3 text-rose-500/50" /> TIPO DE CREATIVO
                            </label>
                            <div className="flex flex-col gap-1">
                                {[
                                    { id: 'STATIC_AD', label: 'Imagen Estática', icon: Layout },
                                    { id: 'IMAGE_TO_VIDEO', label: 'Video UGC', icon: Play },
                                    { id: 'AVATAR_LIPSYNC', label: 'Avatar LipSync', icon: User },
                                    { id: 'COPYWRITING', label: 'Copywriting AI', icon: FileText },
                                ].map((opt) => (
                                    <button
                                        key={opt.id}
                                        onClick={() => setType(opt.id as any)}
                                        className={cn(
                                            "flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-[9px] font-black uppercase tracking-wider transition-all",
                                            type === opt.id
                                                ? "bg-slate-900 border-slate-900 text-white shadow-md shadow-rose-500/10"
                                                : "bg-white/60 border-slate-100/50 text-slate-400 hover:bg-white hover:text-slate-600 hover:border-rose-200"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <opt.icon className={cn("w-3.5 h-3.5", type === opt.id ? "text-rose-500" : "text-slate-300")} />
                                            {opt.label}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tier Selector */}
                        <div className="space-y-2.5">
                            <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 ml-1">
                                <Zap className="w-3 h-3 text-rose-500/50" /> NIVEL DE CALIDAD
                            </label>
                            <div className="grid grid-cols-1 gap-1">
                                {[
                                    { id: 'cheap', label: 'Económico/Rápido', color: 'bg-emerald-500', cost: '~€0.01' },
                                    { id: 'balanced', label: 'Equilibrado/Dev', color: 'bg-rose-500', cost: '~€0.05' },
                                    { id: 'premium', label: 'Premium/Ultra', color: 'bg-amber-500', cost: '~€0.25' },
                                ].map((opt) => (
                                    <button
                                        key={opt.id}
                                        onClick={() => setTier(opt.id as any)}
                                        className={cn(
                                            "group flex flex-col items-start p-3 rounded-xl border text-[8px] font-black uppercase tracking-widest transition-all",
                                            tier === opt.id
                                                ? "bg-white/80 border-rose-200 shadow-sm ring-1 ring-rose-500/5"
                                                : "bg-white/40 border-slate-100/50 text-slate-400 hover:bg-white/60"
                                        )}
                                    >
                                        <div className="flex items-center justify-between w-full mb-1.5">
                                            <span className={cn(tier === opt.id ? "text-slate-900" : "text-slate-400")}>{opt.label}</span>
                                            <span className="text-[7.5px] font-black text-rose-600/60">{opt.cost}</span>
                                        </div>
                                        <div className="h-1 w-full rounded-full bg-slate-100/50 overflow-hidden">
                                            <div className={cn("h-full transition-all duration-700", tier === opt.id ? "w-full " + opt.color : "w-0")} />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Quantity & Budget */}
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 ml-1">
                                    <BarChart className="w-3.5 h-3.5 text-rose-500/50" /> ESCALA DE PRODUCCIÓN
                                </label>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="range" min="1" max="100" step="1"
                                            value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value))}
                                            className="w-full accent-rose-500 h-1.5 bg-slate-100 rounded-full appearance-none cursor-pointer"
                                        />
                                        <div className="min-w-[40px] h-9 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-md">
                                            {quantity}
                                        </div>
                                    </div>
                                    <div className="flex justify-between text-[7px] font-black text-slate-400 uppercase tracking-widest px-1">
                                        <span>Individual</span>
                                        <span>Producción Masiva</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-slate-900/5 rounded-2xl border border-slate-100/50 space-y-2 relative overflow-hidden group/cost">
                                <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest relative z-10">
                                    <span className="text-slate-400">Inversión Est.</span>
                                    <span className="text-rose-600 flex items-center gap-1 text-xs">
                                        <DollarSign className="w-3.5 h-3.5" />
                                        {((tier === 'cheap' ? 0.01 : tier === 'balanced' ? 0.05 : 0.25) * quantity).toFixed(2)}
                                    </span>
                                </div>
                                <div className="text-[8px] text-slate-400 italic font-bold relative z-10 uppercase tracking-tighter">
                                    Costes dinámicos por API
                                </div>
                                <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/5 blur-2xl rounded-full" />
                            </div>
                        </div>

                        {/* Strategic Insight */}
                        <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl flex flex-col gap-3 relative overflow-hidden group/insight">
                            <div className="flex items-center justify-between relative z-10">
                                <label className="text-[9px] font-black uppercase text-rose-500 tracking-widest flex items-center gap-2">
                                    <BrainCircuit className="w-3.5 h-3.5 animate-pulse" /> CONTEXTO ESTRATÉGICO
                                </label>
                                {loadingSpecs && <RefreshCw className="w-3 h-3 animate-spin text-rose-500/50" />}
                            </div>
                            <div className="flex-1 overflow-hidden relative z-10">
                                <div className="text-[9px] font-bold text-slate-600 leading-relaxed italic line-clamp-5">
                                    {specs?.[type]?.prompt ? (
                                        <>
                                            <span className="font-black text-rose-600 not-italic mr-1.5 font-mono uppercase tracking-tighter">MOTOR ACTIVO:</span>
                                            <span className="text-slate-500">{specs[type].prompt}</span>
                                        </>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center gap-2 py-2 opacity-30">
                                            <AlertCircle className="w-5 h-5 text-slate-400" />
                                            <span className="text-[8px] font-black uppercase tracking-widest text-center">FALTA ESTRATEGIA</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-white/20 blur-xl rounded-full" />
                        </div>
                    </div>

                    {/* Action Button Section */}
                    <div className="flex pt-1">
                        <Button
                            onClick={handleGenerate}
                            disabled={isCreating}
                            className="h-14 w-full rounded-2xl bg-slate-900 hover:bg-black text-white font-black uppercase tracking-widest text-[10px] shadow-lg relative overflow-hidden transition-all hover:scale-[1.01] active:scale-[0.98]"
                        >
                            <div className="flex flex-col items-center gap-0.5 relative z-10">
                                {isCreating ? <RefreshCw className="w-4 h-4 animate-spin text-rose-500" /> : <Zap className="w-4 h-4 text-rose-500 mb-0.5" />}
                                <span>LANZAR MOTOR DE PRODUCCIÓN</span>
                            </div>
                            {isCreating && <div className="absolute inset-0 bg-rose-500/10 animate-pulse" />}
                        </Button>
                    </div>

                    {/* Progress Monitor Section */}
                    {activeBatches.length > 0 && (
                        <div className="pt-8 border-t border-slate-100/50 space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-[10px] font-black uppercase text-slate-900 tracking-widest flex items-center gap-2.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                                    COLA DE PRODUCCIÓN ACTIVA
                                </h3>
                                <Badge className="bg-white/60 text-slate-500 border-slate-100 font-black uppercase text-[8px] tracking-widest px-2.5 py-1 rounded-lg">
                                    {activeBatches.length} {activeBatches.length === 1 ? 'Lote' : 'Lotes'} en curso
                                </Badge>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {activeBatches.map((batch) => {
                                    const completed = batch.jobs?.filter((j: any) => j.status === 'SUCCEEDED').length || 0;
                                    const failed = batch.jobs?.filter((j: any) => j.status === 'FAILED').length || 0;
                                    const total = batch.quantity;
                                    const progress = (completed / total) * 100;

                                    return (
                                        <div key={batch.id} className="bg-white/60 border border-slate-100/50 rounded-2xl p-4 space-y-4 hover:border-rose-200 transition-all duration-300 group/batch shadow-sm">
                                            <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest">
                                                <span className="text-slate-400 bg-slate-50/50 px-2 py-0.5 rounded border border-slate-100 italic">ID: {batch.id.slice(-6)}</span>
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded border flex items-center gap-1.5",
                                                    batch.status === 'COMPLETED' ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-rose-50 border-rose-100 text-rose-600 shadow-sm shadow-rose-500/5"
                                                )}>
                                                    <div className={cn("w-1 h-1 rounded-full", batch.status === 'COMPLETED' ? "bg-emerald-500" : "bg-rose-500 animate-pulse")} />
                                                    {batch.status === 'COMPLETED' ? 'COMPLETADO' : 'PROCESANDO'}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-11 h-11 rounded-xl bg-slate-900 flex items-center justify-center shadow-md group-hover/batch:scale-105 transition-transform">
                                                        {batch.type === 'STATIC_AD' ? <Layout className="w-5 h-5 text-rose-500" /> : <Play className="w-5 h-5 text-rose-500" />}
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-900 uppercase tracking-tighter italic leading-none">{batch.type.replace('_', ' ')}</p>
                                                        <p className="text-[8px] text-slate-400 font-bold uppercase mt-1.5 tracking-widest">{completed} / {total} LISTO</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-black text-rose-600 tracking-tighter italic">{progress.toFixed(0)}%</p>
                                                    {failed > 0 && <p className="text-[8px] text-rose-500 font-black uppercase tracking-widest mt-0.5">{failed} ERROR(ES)</p>}
                                                </div>
                                            </div>
                                            <div className="relative pt-1">
                                                <Progress value={progress} className="h-1 bg-slate-100/50 [&>div]:bg-rose-500 rounded-full" />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
