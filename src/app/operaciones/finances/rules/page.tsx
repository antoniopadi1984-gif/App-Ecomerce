
"use client";

import React, { useState, useEffect } from "react";
import { Shield, Save, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";

export default function FulfillmentRulesPage() {
    const [rules, setRules] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRules = async () => {
        const res = await fetch("/api/finances/rules").then(r => r.json());
        setRules(res);
        setLoading(false);
    };

    useEffect(() => {
        fetchRules();
    }, []);

    const handleSave = async (rule: any) => {
        const tid = toast.loading("Saving Rule...");
        await fetch("/api/finances/rules", {
            method: 'POST',
            body: JSON.stringify(rule)
        });
        toast.success("Rule Saved", { id: tid });
        fetchRules();
    };

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-6 space-y-4 animate-in fade-in duration-700">
            <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-slate-900 rounded-lg flex items-center justify-center shadow-xl">
                    <Shield className="h-5 w-5 text-white" />
                </div>
                <div>
                    <h1 className="text-xl font-black text-slate-900 flex items-center gap-2 italic uppercase tracking-tighter">
                        FULFILLMENT <span className="text-slate-400">RULES</span>
                    </h1>
                    <p className="text-slate-500 font-bold uppercase text-[8px] tracking-[0.2em] mt-0.5">Global Financial Logic & Logistics Costs</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rules.map((rule, idx) => (
                    <Card key={idx} className="border border-slate-100 shadow-sm rounded-lg bg-white overflow-hidden">
                        <CardHeader className="bg-slate-50 p-3 border-b border-slate-100">
                            <CardTitle className="uppercase text-[9px] font-black tracking-widest text-slate-900 italic">{rule.provider} — {rule.country}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest pl-0.5">Base Shipping (€)</label>
                                    <Input
                                        type="number"
                                        className="h-8 text-[11px] font-black bg-slate-50 border-slate-100 rounded-lg"
                                        value={rule.baseShippingCost}
                                        onChange={(e) => {
                                            const newRules = [...rules];
                                            newRules[idx].baseShippingCost = parseFloat(e.target.value);
                                            setRules(newRules);
                                        }}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest pl-0.5">COD Fee Fixed (€)</label>
                                    <Input
                                        type="number"
                                        className="h-8 text-[11px] font-black bg-slate-50 border-slate-100 rounded-lg"
                                        value={rule.codFeeFixed}
                                        onChange={(e) => {
                                            const newRules = [...rules];
                                            newRules[idx].codFeeFixed = parseFloat(e.target.value);
                                            setRules(newRules);
                                        }}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest pl-0.5">COD Fee (%)</label>
                                    <Input
                                        type="number"
                                        className="h-8 text-[11px] font-black bg-slate-50 border-slate-100 rounded-lg"
                                        value={rule.codFeePercent}
                                        onChange={(e) => {
                                            const newRules = [...rules];
                                            newRules[idx].codFeePercent = parseFloat(e.target.value);
                                            setRules(newRules);
                                        }}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest pl-0.5">VAT (%)</label>
                                    <Input
                                        type="number"
                                        className="h-8 text-[11px] font-black bg-slate-50 border-slate-100 rounded-lg"
                                        value={rule.taxPercent}
                                        onChange={(e) => {
                                            const newRules = [...rules];
                                            newRules[idx].taxPercent = parseFloat(e.target.value);
                                            setRules(newRules);
                                        }}
                                    />
                                </div>
                            </div>
                            <Button onClick={() => handleSave(rule)} className="w-full h-8 bg-slate-900 hover:bg-black text-white uppercase font-black text-[9px] tracking-widest rounded-lg transition-all shadow-xl">
                                <Save className="h-3 w-3 mr-2" /> Guardar Cambios
                            </Button>
                        </CardContent>
                    </Card>
                ))}

                <Button className="h-full border border-dashed border-slate-200 bg-white/50 text-slate-300 hover:bg-white hover:border-slate-900 hover:text-slate-900 transition-all rounded-lg flex flex-col gap-3 py-12 px-6 shadow-sm min-h-[160px]">
                    <Plus className="h-6 w-6" />
                    <span className="font-black uppercase tracking-widest text-[9px]">Añadir Nueva Regla</span>
                </Button>
            </div>
        </div>
    );
}
