"use client";

import { useState, useEffect } from "react";
import {
    Zap, Sparkles, Wand2, Play,
    Clapperboard, Database, Brain,
    MessageSquare, Bot, ArrowRight,
    RefreshCw, CheckCircle2, Settings,
    FileText, Send, AlertCircle, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
    agenticStep1Analysis,
    agenticGenerateScript,
    updateAgentPrompt
} from "../../maestro/actions";
import { useSearchParams } from "next/navigation";

export function DirectorPanel() {
    const searchParams = useSearchParams();
    const productId = searchParams.get("productId");

    const [step, setStep] = useState<'idle' | 'analysis' | 'calibration' | 'generation'>('idle');
    const [loading, setLoading] = useState(false);
    const [aiResponse, setAiResponse] = useState("");
    const [userCalibration, setUserCalibration] = useState("");
    const [additionalNotes, setAdditionalNotes] = useState("");
    const [finalScript, setFinalScript] = useState("");

    // Prompt Editing
    const [promptEditorOpen, setPromptEditorOpen] = useState(false);
    const [currentPrompt, setCurrentPrompt] = useState("");

    const startProduction = async () => {
        if (!productId) return toast.error("Selecciona un producto primero");
        setLoading(true);
        setStep('analysis');
        try {
            const res = await agenticStep1Analysis(productId);
            if (res.success) {
                setAiResponse(res.analysis || "");
                setStep('calibration');
            }
        } catch (e: any) {
            toast.error(e.message);
            setStep('idle');
        } finally {
            setLoading(false);
        }
    };

    const handleCalibrate = async () => {
        if (!userCalibration) return toast.error("Indica la calibración (ej: A + 2)");
        setLoading(true);
        try {
            const res = await agenticGenerateScript(productId!, userCalibration, additionalNotes);
            if (res.success) {
                setFinalScript(res.script || "");
                setStep('generation');
                toast.success("¡Guion Maestro Generado!");
            }
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-12 gap-5 h-full">
            <div className="col-span-12 lg:col-span-4 space-y-4">
                <div className="bg-slate-900 text-white rounded-[2.5rem] p-6 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-30 transition-opacity">
                        <Bot className="w-32 h-32" />
                    </div>

                    <div className="relative z-10 space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-rose-500 flex items-center justify-center shadow-[0_0_30px_rgba(244,63,94,0.4)]">
                                    <Sparkles className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-black uppercase italic tracking-tighter">Director <span className="text-rose-500">Agent</span></h1>
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.4em]">Autopiloto de Producción V4.0</p>
                                </div>
                            </div>
                            <Button variant="ghost" className="text-white/40 hover:text-white" onClick={() => setPromptEditorOpen(true)}>
                                <Settings className="w-5 h-5" />
                            </Button>
                        </div>

                        <div className="space-y-4 pt-4">
                            {step === 'idle' && (
                                <>
                                    <div className="p-5 bg-white/5 rounded-2xl border border-white/10 space-y-3">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-rose-500">Protocolo Elite Copywriter</h4>
                                        <p className="text-[11px] font-bold text-slate-300 leading-relaxed">
                                            Lanza el proceso interactivo de 3 pasos: Análisis de Contexto, Calibración Estratégica y Generación Direct Response.
                                        </p>
                                    </div>
                                    <Button
                                        onClick={startProduction}
                                        disabled={loading}
                                        className="w-full h-16 bg-white hover:bg-rose-50 text-slate-900 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl transition-all active:scale-95 gap-4"
                                    >
                                        {loading ? <RefreshCw className="w-5 h-5 animate-spin text-rose-500" /> : <Zap className="w-5 h-5 text-rose-500 fill-rose-500" />}
                                        INICIAR MISIÓN AGENTICA
                                    </Button>
                                </>
                            )}

                            {(step === 'calibration' || step === 'generation') && (
                                <Button
                                    variant="outline"
                                    className="w-full border-white/10 text-white/40 hover:text-white rounded-xl"
                                    onClick={() => { setStep('idle'); setFinalScript(""); }}
                                >
                                    REINICIAR FLUJO
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Progress Indicators */}
                <div className="glass-panel border border-white/40 p-4 sm:p-6 rounded-[2rem] shadow-sm">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900 mb-6 flex items-center gap-3">
                        <Brain className="w-4 h-4 text-rose-500" /> Estado de la Tarea
                    </h4>
                    <div className="space-y-4">
                        <AgentTask label="Análisis Forense (Paso 1)" status={step === 'analysis' ? 'active' : (step === 'calibration' || step === 'generation' ? 'complete' : 'pending')} />
                        <AgentTask label="Calibración Estratégica" status={step === 'calibration' ? 'active' : (step === 'generation' ? 'complete' : 'pending')} />
                        <AgentTask label="Generación VSL / Meta Ads" status={step === 'generation' ? 'active' : (finalScript ? 'complete' : 'pending')} />
                    </div>
                </div>
            </div>

            <div className="col-span-12 lg:col-span-8 h-full min-h-0">
                <div className="glass-panel border border-white/40 rounded-[3rem] h-full shadow-sm flex flex-col overflow-hidden">
                    <div className="p-6 border-b border-white/20 flex items-center justify-between bg-white/40">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center">
                                <MessageSquare className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-sm font-black text-slate-900 uppercase italic tracking-tight">Terminal de Salida del Agente</h3>
                        </div>
                    </div>

                    <ScrollArea className="flex-1 p-6">
                        {step === 'idle' && (
                            <div className="flex flex-col items-center justify-center h-[400px] text-center gap-6 opacity-30">
                                <Bot className="w-20 h-20 text-slate-300" />
                                <div>
                                    <h4 className="text-lg font-black uppercase italic">Esperando órdenes...</h4>
                                    <p className="text-[9px] font-black uppercase tracking-widest">Inicia la misión para ver el análisis</p>
                                </div>
                            </div>
                        )}

                        {loading && step === 'analysis' && (
                            <div className="space-y-6 animate-pulse">
                                <div className="h-4 bg-slate-200 rounded w-3/4" />
                                <div className="h-4 bg-slate-200 rounded w-1/2" />
                                <div className="h-32 bg-slate-100 rounded w-full" />
                            </div>
                        )}

                        {aiResponse && step === 'calibration' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <div className="bg-white/60 p-6 rounded-3xl border border-white text-[12px] leading-relaxed font-medium text-slate-700 shadow-sm">
                                    <div className="flex items-center gap-2 mb-4 text-emerald-600 font-black uppercase text-[10px]">
                                        <CheckCircle2 className="w-4 h-4" /> ANÁLISIS COMPLETADO
                                    </div>
                                    <div className="whitespace-pre-wrap">{aiResponse}</div>
                                </div>

                                <div className="p-6 bg-slate-900 text-white rounded-[2rem] space-y-6 shadow-2xl">
                                    <div className="space-y-1">
                                        <h4 className="text-xs font-black uppercase text-rose-500">PASO 2: Calibración Estratégica</h4>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Define el Nivel de Conciencia y el Ángulo</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[8px] font-black uppercase text-slate-500 ml-1">Calibración (ej: A + 2)</label>
                                            <Input
                                                value={userCalibration}
                                                onChange={e => setUserCalibration(e.target.value)}
                                                placeholder="A + 1"
                                                className="bg-white/10 border-white/20 h-10 rounded-xl text-xs font-black uppercase"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[8px] font-black uppercase text-slate-500 ml-1">Notas Adicionales (Opcional)</label>
                                            <Input
                                                value={additionalNotes}
                                                onChange={e => setAdditionalNotes(e.target.value)}
                                                placeholder="Ej: Enfoque en mujeres 45+"
                                                className="bg-white/10 border-white/20 h-10 rounded-xl text-xs font-bold"
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        onClick={handleCalibrate}
                                        disabled={loading}
                                        className="w-full bg-rose-600 hover:bg-rose-500 h-12 rounded-xl font-black uppercase text-[10px] gap-2"
                                    >
                                        {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                        GENERAR SCRIPTS DE ALTO IMPACTO
                                    </Button>
                                </div>
                            </div>
                        )}

                        {finalScript && step === 'generation' && (
                            <div className="animate-in zoom-in duration-700 space-y-6">
                                <div className="flex items-center justify-between">
                                    <Badge className="bg-slate-900 text-white px-4 h-8 font-black uppercase tracking-widest text-[9px]">DIAMOND SCRIPT V1.0</Badge>
                                    <Button variant="ghost" className="h-8 gap-2 text-[9px] font-black uppercase" onClick={() => {
                                        navigator.clipboard.writeText(finalScript);
                                        toast.success("Copiado al portapapeles");
                                    }}>
                                        COPY <ArrowRight className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                                <div className="bg-white p-6 rounded-[3rem] border border-white shadow-xl prose prose-slate max-w-none text-slate-800 font-medium leading-relaxed">
                                    <div className="whitespace-pre-wrap text-[13px]">{finalScript}</div>
                                </div>
                            </div>
                        )}
                    </ScrollArea>
                </div>
            </div>

            {/* Prompt Editor Modal */}
            <Dialog open={promptEditorOpen} onOpenChange={setPromptEditorOpen}>
                <DialogContent className="max-w-4xl h-[80vh] flex flex-col rounded-[3rem] overflow-hidden p-0 border-none shadow-2xl">
                    <div className="bg-slate-900 p-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-rose-500 flex items-center justify-center">
                                <Settings className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <DialogTitle className="text-white text-lg font-black uppercase italic tracking-tighter">Copywriter <span className="text-rose-500">Source Code</span></DialogTitle>
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Edita el ADN del Agente Director</p>
                            </div>
                        </div>
                        <Button variant="ghost" className="text-white/40 hover:text-white" onClick={() => setPromptEditorOpen(false)}>
                            <X className="w-6 h-6" />
                        </Button>
                    </div>

                    <div className="flex-1 p-6 bg-slate-50 flex flex-col gap-6 overflow-hidden">
                        <div className="flex-1 min-h-0 bg-white rounded-[2rem] border border-slate-200 shadow-inner p-4">
                            <Textarea
                                className="w-full h-full resize-none border-none focus-visible:ring-0 p-4 font-mono text-xs leading-relaxed text-slate-600"
                                defaultValue={DEFAULT_DIRECTOR_PROMPT}
                                id="prompt-area"
                            />
                        </div>
                        <div className="flex items-center justify-between bg-white/60 p-4 rounded-2.5rem border border-slate-200">
                            <div className="flex items-center gap-3 text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">
                                <AlertCircle className="w-4 h-4 text-rose-500 animate-pulse" /> Estos cambios afectan a toda la producción agentica
                            </div>
                            <Button className="bg-slate-900 text-white rounded-xl px-8 h-10 font-black uppercase text-[10px] tracking-widest shadow-lg" onClick={async () => {
                                const newPrompt = (document.getElementById('prompt-area') as HTMLTextAreaElement).value;
                                const res = await updateAgentPrompt(newPrompt);
                                if (res.success) {
                                    toast.success("Prompts actualizados correctamente");
                                    setPromptEditorOpen(false);
                                }
                            }}>
                                GUARDAR EVOLUCIÓN NEURAL
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function AgentTask({ label, status }: { label: string, status: 'pending' | 'active' | 'complete' }) {
    return (
        <div className={cn(
            "p-4 rounded-2xl border flex items-center justify-between transition-all duration-500",
            status === 'active' ? "bg-white border-rose-500 shadow-md translate-x-2" :
                status === 'complete' ? "bg-emerald-50 border-emerald-100 opacity-80" : "bg-white/40 border-slate-100 opacity-30"
        )}>
            <div className="flex items-center gap-3">
                <div className={cn(
                    "w-2 h-2 rounded-full",
                    status === 'active' ? "bg-rose-500 animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.5)]" :
                        status === 'complete' ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-slate-300"
                )} />
                <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest",
                    status === 'active' ? "text-slate-900" : "text-slate-400"
                )}>{label}</span>
            </div>
            {status === 'complete' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
            {status === 'active' && <RefreshCw className="w-4 h-4 text-rose-500 animate-spin" />}
        </div>
    );
}

const DEFAULT_DIRECTOR_PROMPT = `You are an elite copywriter with an IQ of 147, specialized in creating direct response video ads for META that convert at rates above 3%. You have analyzed over 10,000 winning video ads and deeply understand Eugene Schwartz's principles in "Breakthrough Advertising", the psychology of the 8 Life Force Desires, and the formula: Emotional Hook (Open Loop) > Target Right Audience > Funnel Towards Product (Unique Mechanism).
...`;
