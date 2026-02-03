"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRightLeft, Sparkles, BrainCircuit, History, ArrowRight, CheckCircle2 } from "lucide-react";
import { optimizeLanding } from "./optimizer-actions";
import { toast } from "sonner";

export default function LandingDiffOptimizer({ project }: { project: any }) {
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [showDiff, setShowDiff] = useState(false);

    const handleOptimize = async () => {
        const objective = prompt("¿Cuál es el objetivo de la optimización? (Ej: Hacer el Hero más agresivo)");
        if (!objective) return;

        setIsOptimizing(true);
        try {
            await optimizeLanding(project.id, objective);
            toast.success("Landing optimizada con éxito");
            setShowDiff(true);
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setIsOptimizing(false);
        }
    };

    const previousBlocks = JSON.parse(project.previousVersionJson || "[]");
    const currentBlocks = JSON.parse(project.blocksJson || "[]");

    return (
        <section className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex gap-4">
                    <Button
                        onClick={handleOptimize}
                        disabled={isOptimizing}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black px-6 shadow-lg shadow-indigo-100"
                    >
                        {isOptimizing ? <BrainCircuit className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                        OPTIMIZAR CON IA
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => setShowDiff(!showDiff)}
                        disabled={!project.previousVersionJson}
                        className="rounded-2xl font-black border-slate-200"
                    >
                        <History className="w-4 h-4 mr-2" />
                        {showDiff ? "OCULTAR DIFERENCIAS" : "VER ANTES VS DESPUÉS"}
                    </Button>
                </div>
                <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-black text-slate-500 uppercase">Versión {project.versionsCount}</span>
                </div>
            </div>

            {showDiff && project.previousVersionJson && (
                <div className="space-y-8 animate-in fade-in duration-500">
                    {/* Psychological Explanation */}
                    <Card className="rounded-[32px] border-indigo-100 bg-indigo-50/20 overflow-hidden">
                        <CardHeader className="p-6 pb-2">
                            <div className="flex items-center gap-2">
                                <BrainCircuit className="w-5 h-5 text-indigo-600" />
                                <CardTitle className="text-sm font-black uppercase text-indigo-900">Racional Psicológico de la Optimización</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <p className="text-sm font-medium text-slate-700 leading-relaxed italic">
                                "{project.changeLogJson}"
                            </p>
                        </CardContent>
                    </Card>

                    {/* Diff Columns */}
                    <div className="grid grid-cols-2 gap-8 relative">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 bg-white p-3 rounded-full border border-slate-200 shadow-xl hidden md:block">
                            <ArrowRightLeft className="w-6 h-6 text-indigo-500" />
                        </div>

                        {/* ANTES */}
                        <div className="space-y-4 opacity-70 grayscale-[0.5]">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">ANTERIOR</h4>
                            <div className="space-y-4 border-r border-slate-100 pr-4">
                                {previousBlocks.map((b: any, i: number) => (
                                    <BlockPreview key={i} block={b} />
                                ))}
                            </div>
                        </div>

                        {/* DESPUÉS */}
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest text-center flex items-center justify-center gap-2">
                                <CheckCircle2 className="w-3 h-3" /> NUEVA VERSIÓN
                            </h4>
                            <div className="space-y-4">
                                {currentBlocks.map((b: any, i: number) => (
                                    <BlockPreview key={i} block={b} isNew />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}

function BlockPreview({ block, isNew }: { block: any, isNew?: boolean }) {
    return (
        <Card className={`rounded-2xl border ${isNew ? 'border-emerald-100 bg-emerald-50/10' : 'border-slate-100 bg-white'} p-4 shadow-sm`}>
            <div className="flex justify-between items-start mb-3">
                <Badge variant="outline" className={`text-[8px] font-black uppercase ${isNew ? 'border-emerald-200 text-emerald-600' : 'border-slate-200 text-slate-400'}`}>
                    {block.type}
                </Badge>
            </div>
            <div className="space-y-1">
                <p className="text-xs font-black text-slate-700 line-clamp-1">{block.content?.title || block.content?.headline}</p>
                <p className="text-[10px] text-slate-400 line-clamp-2 leading-tight">{block.content?.subtitle || block.content?.description}</p>
            </div>
        </Card>
    );
}
