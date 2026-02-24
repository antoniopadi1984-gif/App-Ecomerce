"use client";

import React, { useState } from "react";
import { PremiumCard } from "@/components/ui/premium-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Settings2,
    Globe,
    Search,
    Cpu,
    Link as LinkIcon,
    Plus,
    Trash2,
    CheckCircle2,
    ChevronRight,
    Database,
    BrainCircuit
} from "lucide-react";
import { useProduct } from "@/context/ProductContext";
import { toast } from "sonner";

export function ResearchConfig() {
    const { productId } = useProduct();
    const [niche, setNiche] = useState("");
    const [sources, setSources] = useState<string[]>([]);
    const [newSource, setNewSource] = useState("");
    const [framework, setFramework] = useState("breakthrough_v4");

    const addSource = () => {
        if (!newSource) return;
        setSources([...sources, newSource]);
        setNewSource("");
    };

    const removeSource = (index: number) => {
        setSources(sources.filter((_, i) => i !== index));
    };

    const handleSave = () => {
        toast.success("Configuración de investigación guardada");
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-500">
            <PremiumCard
                title="PARÁMETROS DEL NICHO"
                subtitle="Define el terreno de juego"
                icon={<Globe className="w-4 h-4" />}
            >
                <div className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                        <Label className="text-[10px] uppercase tracking-widest font-black text-slate-400">Nicho de Mercado</Label>
                        <Input
                            value={niche}
                            onChange={(e) => setNiche(e.target.value)}
                            placeholder="Ej: Suplementos Longevidad, Skin Tech..."
                            className="bg-slate-50/50 border-slate-100 text-xs font-bold"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[10px] uppercase tracking-widest font-black text-slate-400">Contexto Estratégico</Label>
                        <Textarea
                            placeholder="Detalles adicionales sobre el posicionamiento deseado..."
                            className="bg-slate-50/50 border-slate-100 text-xs min-h-[100px]"
                        />
                    </div>
                </div>
            </PremiumCard>

            <PremiumCard
                title="FUENTES PERSONALIZADAS"
                subtitle="URLs de referencia y competencia"
                icon={<LinkIcon className="w-4 h-4" />}
            >
                <div className="space-y-4 pt-2">
                    <div className="flex gap-2">
                        <Input
                            value={newSource}
                            onChange={(e) => setNewSource(e.target.value)}
                            placeholder="https://amazon.com/..."
                            className="bg-slate-50/50 border-slate-100 text-xs flex-1"
                        />
                        <Button size="sm" onClick={addSource} className="bg-slate-900 hover:bg-slate-800 h-9 px-3">
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>

                    <div className="space-y-2 max-h-[180px] overflow-y-auto pr-2 scrollbar-hide">
                        {sources.length === 0 ? (
                            <div className="text-center py-8 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                                <Search className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">No hay fuentes añadidas</p>
                            </div>
                        ) : (
                            sources.map((source, i) => (
                                <div key={i} className="flex items-center justify-between p-2.5 bg-white border border-slate-100 rounded-lg shadow-sm group">
                                    <span className="text-[10px] font-bold text-slate-600 truncate max-w-[200px]">{source}</span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeSource(i)}
                                        className="h-7 w-7 text-slate-400 hover:text-rose-500 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </PremiumCard>

            <PremiumCard
                title="MOTOR DE INTELIGENCIA"
                subtitle="Frameworks de investigación"
                icon={<BrainCircuit className="w-4 h-4" />}
            >
                <div className="space-y-4 pt-2">
                    {[
                        { id: "breakthrough_v4", name: "Breakthrough V4 (Schwartz)", desc: "Enfoque en niveles de consciencia y sofisticación." },
                        { id: "forensic_v1", name: "Forensic DNA Analysis", desc: "Análisis profundo de brecha de mercado y mecanismo único." },
                        { id: "rapid_validation", name: "Rapid Market Validation", desc: "Escaneo rápido de foros y opiniones reales." }
                    ].map((f) => (
                        <div
                            key={f.id}
                            onClick={() => setFramework(f.id)}
                            className={`p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 ${framework === f.id
                                ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                                : "border-slate-100 bg-slate-50/50 hover:border-slate-200"
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <h4 className="text-[11px] font-black uppercase tracking-tight">{f.name}</h4>
                                {framework === f.id && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                            </div>
                            <p className={`text-[10px] mt-1 leading-relaxed ${framework === f.id ? "text-slate-300" : "text-slate-500"}`}>
                                {f.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </PremiumCard>

            <PremiumCard
                title="ESTADO DE LOS MOTORES"
                subtitle="Monitor de conexión y recursos"
                icon={<Database className="w-4 h-4" />}
            >
                <div className="space-y-3 pt-2">
                    <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <div>
                                <p className="text-[10px] font-black text-emerald-700 uppercase">Motor de Búsqueda</p>
                                <p className="text-[9px] text-emerald-600/80 font-bold italic">Motor de búsqueda conectado</p>
                            </div>
                        </div>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    </div>

                    <div className="p-3 bg-rose-50/50 border border-rose-100 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                            <div>
                                <p className="text-[10px] font-black text-rose-700 uppercase">Razonamiento IA</p>
                                <p className="text-[9px] text-rose-600/80 font-bold italic">Gemini 1.5 Pro Flash Stable</p>
                            </div>
                        </div>
                        <CheckCircle2 className="w-4 h-4 text-rose-500" />
                    </div>

                    <div className="pt-2">
                        <Button
                            onClick={handleSave}
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest h-11"
                        >
                            Confirmar Configuración <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                </div>
            </PremiumCard>
        </div>
    );
}
