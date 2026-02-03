"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ShieldAlert, ShieldQuestion, Loader2, CheckCircle2, XCircle, AlertCircle, Sparkles } from "lucide-react";
import { runQualityGate } from "./actions";
import { toast } from "sonner";

export default function QualityGateUI({ assetId, type, initialResults }: { assetId: string, type: 'IMAGE' | 'VIDEO' | 'LANDING', initialResults?: any }) {
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any>(initialResults ? JSON.parse(initialResults) : null);

    const handleRunGate = async () => {
        setLoading(true);
        try {
            const res = await runQualityGate(assetId, type);
            setResults(res);
            toast.success("Auditoría de calidad finalizada");
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="space-y-4">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-indigo-600" />
                    <h4 className="text-xs font-black uppercase text-slate-800 tracking-widest">Creative Quality Gate</h4>
                </div>
                <Button
                    onClick={handleRunGate}
                    disabled={loading}
                    variant="outline"
                    className="rounded-xl h-8 text-[10px] font-black border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                >
                    {loading ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Sparkles className="w-3 h-3 mr-2" />}
                    EJECUTAR AUDITORÍA
                </Button>
            </div>

            {results && (
                <Card className={`rounded-3xl border ${results.verdict === 'APROBADO' ? 'border-emerald-100 bg-emerald-50/10' : 'border-rose-100 bg-rose-50/10'} overflow-hidden animate-in zoom-in-95 duration-500`}>
                    <CardContent className="p-6 space-y-6">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                {results.verdict === 'APROBADO' ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> : <XCircle className="w-6 h-6 text-rose-500" />}
                                <div>
                                    <p className="text-[10px] font-black uppercase text-slate-400">Veredicto</p>
                                    <p className={`text-lg font-black ${results.verdict === 'APROBADO' ? 'text-emerald-600' : 'text-rose-600'}`}>{results.verdict}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black uppercase text-slate-400">Quality Score</p>
                                <p className="text-2xl font-black text-slate-800">{results.score}/100</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {results.checklist.map((item: any, i: number) => (
                                <div key={i} className="flex items-start gap-3 bg-white p-3 rounded-2xl border border-slate-100">
                                    {item.status === 'PASS' && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />}
                                    {item.status === 'FAIL' && <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />}
                                    {item.status === 'WARN' && <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />}
                                    <div>
                                        <p className="text-xs font-black text-slate-800">{item.item}</p>
                                        <p className="text-[10px] text-slate-500 font-medium">{item.comment}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="bg-indigo-600 text-white p-4 rounded-2xl flex items-center gap-3">
                            <Zap className="w-5 h-5 text-yellow-300" />
                            <div>
                                <p className="text-[10px] font-black uppercase opacity-60">Mejora Urgente</p>
                                <p className="text-xs font-bold leading-tight">{results.topFix}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </section>
    );
}
