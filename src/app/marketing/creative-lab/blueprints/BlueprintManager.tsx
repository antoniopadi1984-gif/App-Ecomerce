"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, Target, ShieldAlert, Zap, MessageSquare, Anchor, CheckCircle2, AlertTriangle, FileCheck, BrainCircuit, Scale, Brain, Info, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import { generateCopyContract, getContracts, lintCopy } from "./actions";

export default function BlueprintManager({ storeId, productId }: { storeId: string, productId: string }) {
    const [contracts, setContracts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [linting, setLinting] = useState(false);
    const [copyToLint, setCopyToLint] = useState("");
    const [lintResult, setLintResult] = useState<any>(null);

    useEffect(() => {
        if (productId) loadContracts();
    }, [productId]);

    const loadContracts = async () => {
        try {
            const data = await getContracts(productId);
            setContracts(data);
        } catch (e) {
            toast.error("Error al cargar Contratos");
        }
    };

    const handleGenerate = async () => {
        setLoading(true);
        try {
            await generateCopyContract(productId);
            toast.success("Contrato de Copy generado con éxito");
            loadContracts();
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLint = async () => {
        if (!copyToLint || !activeContract) return;
        setLinting(true);
        try {
            const res = await lintCopy(activeContract.id, copyToLint);
            setLintResult(res);
            toast.success("Validación completada");
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setLinting(false);
        }
    };

    const activeContract = contracts[0];

    return (
        <section className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
            <header className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-slate-900 rounded-2xl shadow-xl shadow-slate-200">
                        <FileCheck className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-800 uppercase flex items-center gap-2">
                            COPY CONTRACT <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-black text-[9px] px-2 py-0">V2.0 EXPERT</Badge>
                        </h3>
                        <p className="text-sm text-slate-500 font-medium tracking-tight">El marco lógico inamovible para todos tus activos creativos.</p>
                    </div>
                </div>
                <Button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black px-8 py-6 shadow-lg shadow-indigo-100 transition-all hover:scale-105"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                    FORJAR CONTRATO
                </Button>
            </header>

            {!activeContract ? (
                <Card className="rounded-[40px] border-dashed border-2 border-slate-200 bg-slate-50/50 p-20 text-center">
                    <CardContent>
                        <Anchor className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-400 font-bold italic">No hay un Contrato activo. Forja uno para establecer las reglas del juego.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Part 1: Strategic Core & Hormozi Equation */}
                    <div className="lg:col-span-2 space-y-8">
                        <Card className="rounded-[40px] border-slate-100 shadow-sm bg-white overflow-hidden">
                            <CardHeader className="bg-slate-50 border-b border-slate-100 p-8">
                                <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">Pilar Estratégico (Brealthrough Advertising)</CardTitle>
                            </CardHeader>
                            <CardContent className="p-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-6">
                                        <div>
                                            <label className="text-[10px] font-black uppercase text-slate-400 block mb-2 underline decoration-indigo-200">Target Avatar</label>
                                            <p className="text-sm font-bold text-slate-800 leading-relaxed italic">"{activeContract.avatarSegment}"</p>
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="flex-1 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-50">
                                                <label className="text-[9px] font-black uppercase text-indigo-400 block mb-1">Awareness</label>
                                                <span className="text-xs font-black text-indigo-900">{activeContract.awarenessLevel}</span>
                                            </div>
                                            <div className="flex-1 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-50">
                                                <label className="text-[9px] font-black uppercase text-indigo-400 block mb-1">Sophistication</label>
                                                <span className="text-xs font-black text-indigo-900">Level {activeContract.sophistication}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        {activeContract.reasoning && (
                                            <div className="p-5 bg-slate-900 rounded-[32px] border border-slate-800 shadow-xl">
                                                <h4 className="text-[10px] font-black text-indigo-400 uppercase mb-3 flex items-center gap-2">
                                                    <Brain className="w-4 h-4" /> Razonamiento del Experto
                                                </h4>
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="text-[8px] font-black text-slate-500 uppercase">Contexto de Consciencia</label>
                                                        <p className="text-[10px] text-white font-medium leading-relaxed">{(activeContract.reasoning as any).awarenessContext}</p>
                                                    </div>
                                                    <div>
                                                        <label className="text-[8px] font-black text-slate-500 uppercase">Lógica del Mecanismo</label>
                                                        <p className="text-[10px] text-white font-medium leading-relaxed">{(activeContract.reasoning as any).mechanismExplanation}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        <div className="p-5 bg-emerald-50 rounded-[32px] border border-emerald-100 relative group overflow-hidden">
                                            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                                <Zap className="w-12 h-12 text-emerald-600" />
                                            </div>
                                            <label className="text-[10px] font-black uppercase text-emerald-600 block mb-2">Unique Mechanism</label>
                                            <p className="text-sm font-black text-emerald-900 relative z-10">{activeContract.mechanism}</p>
                                        </div>
                                        <div className="p-5 bg-slate-900 rounded-[32px] border border-slate-800 shadow-xl">
                                            <label className="text-[10px] font-black uppercase text-slate-500 block mb-2">Main Attack Angle</label>
                                            <p className="text-sm font-black text-white">{activeContract.mainAngle}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Hormozi Value Equation */}
                        <Card className="rounded-[40px] border-slate-100 shadow-sm bg-white overflow-hidden">
                            <CardHeader className="p-8 border-b border-slate-50 flex flex-row justify-between items-center">
                                <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">Ecuación de Valor (The $100M Equation)</CardTitle>
                                <Scale className="w-5 h-5 text-indigo-400" />
                            </CardHeader>
                            <CardContent className="p-8">
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                    {[
                                        { label: "Dream Outcome", value: activeContract.dreamOutcome, color: "text-emerald-600" },
                                        { label: "Likelihood", value: activeContract.perceivedProb, color: "text-blue-600" },
                                        { label: "Time Delay", value: activeContract.timeDelay, color: "text-rose-600" },
                                        { label: "Effort", value: activeContract.effortSacrifice, color: "text-amber-600" }
                                    ].map((item, i) => (
                                        <div key={i} className="flex flex-col p-4 bg-slate-50 rounded-3xl border border-slate-100">
                                            <span className="text-[9px] font-black uppercase text-slate-400 mb-2">{item.label}</span>
                                            <p className={`text-xs font-black ${item.color} leading-tight`}>{item.value}</p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Copy Linter UI */}
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Copy Quality Gate (LINTER)</h4>
                            <Card className="rounded-[40px] border-slate-100 shadow-sm bg-white overflow-hidden p-8 space-y-4">
                                <Textarea
                                    value={copyToLint}
                                    onChange={(e) => setCopyToLint(e.target.value)}
                                    placeholder="Pega tu copy aquí (Landing, Anuncio, Script) para validarlo contra el contrato..."
                                    className="rounded-[32px] border-slate-100 bg-slate-50 min-h-[150px] p-6 text-sm font-medium focus:ring-indigo-500"
                                />
                                <div className="flex justify-end gap-3">
                                    <Button
                                        onClick={handleLint}
                                        disabled={linting || !copyToLint}
                                        className="bg-slate-900 text-white rounded-2xl font-black px-8 py-6 shadow-2xl"
                                    >
                                        {linting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <BrainCircuit className="w-4 h-4 mr-2" />}
                                        EJECUTAR LINTING
                                    </Button>
                                </div>

                                {lintResult && (
                                    <div className="mt-6 p-6 bg-slate-50 rounded-[32px] border border-slate-200 animate-in slide-in-from-top-4">
                                        <div className="flex items-center gap-3 mb-6">
                                            {lintResult.pass ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> : <AlertTriangle className="w-6 h-6 text-rose-500" />}
                                            <span className={`text-sm font-black uppercase ${lintResult.pass ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {lintResult.pass ? "COPY APROBADO PARA PRODUCCIÓN" : "LINTER: SE REQUIEREN AJUSTES"}
                                            </span>
                                        </div>
                                        <div className="space-y-4">
                                            {lintResult.issues.map((issue: any, i: number) => (
                                                <div key={i} className={`p-4 rounded-2xl border ${issue.type === 'ERROR' ? 'bg-rose-50 border-rose-100 text-rose-800' : 'bg-amber-50 border-amber-100 text-amber-800'}`}>
                                                    <span className="text-[10px] font-black uppercase opacity-60">{issue.type}</span>
                                                    <p className="text-xs font-bold mt-1">{issue.message}</p>
                                                    <p className="text-[10px] font-black mt-2 underline italic">Fix sugerido: {issue.fix}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </Card>
                        </div>
                    </div>

                    {/* Part 2: Rules of Engagement */}
                    <div className="space-y-6">
                        <Card className="rounded-[40px] border-slate-100 shadow-sm bg-slate-900 text-white overflow-hidden h-full">
                            <CardHeader className="p-8 border-b border-white/5">
                                <CardTitle className="text-xs font-black uppercase tracking-widest text-white/40">Reglas del Juego (Truth Layer)</CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 space-y-8">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase text-emerald-400 block tracking-widest">Promises Allowed</label>
                                    <div className="space-y-2">
                                        {JSON.parse(activeContract.promisesAllowed || "[]").map((p: string, i: number) => (
                                            <div key={i} className="flex gap-2 items-start text-xs font-bold text-slate-300">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5"></div>
                                                {p}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase text-rose-400 block tracking-widest">Promises Prohibited</label>
                                    <div className="space-y-2">
                                        {JSON.parse(activeContract.promisesProhibited || "[]").map((p: string, i: number) => (
                                            <div key={i} className="flex gap-2 items-start text-xs font-bold text-rose-400/80 line-through decoration-rose-900/40">
                                                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-1.5"></div>
                                                {p}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4 pt-6 mt-6 border-t border-white/5">
                                    <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl">
                                        <span className="text-[10px] font-black uppercase text-white/40">Tone of Voice</span>
                                        <span className="text-xs font-black text-indigo-400">{activeContract.tone}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl">
                                        <span className="text-[10px] font-black uppercase text-white/40">CTA Strategy</span>
                                        <span className="text-xs font-black text-amber-400">{activeContract.ctaAllowed}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </section>
    );
}
