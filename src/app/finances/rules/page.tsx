
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
        <div className="min-h-screen bg-slate-50 p-8 space-y-8">
            <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                <Shield className="h-8 w-8 text-blue-600" />
                FULFILLMENT <span className="text-blue-600 uppercase">RULES</span>
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {rules.map((rule, idx) => (
                    <Card key={idx} className="border-0 shadow-xl rounded-3xl bg-white overflow-hidden">
                        <CardHeader className="bg-slate-900 text-white">
                            <CardTitle className="uppercase text-sm">{rule.provider} - {rule.country}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400">Base Shipping (€)</label>
                                    <Input
                                        type="number"
                                        value={rule.baseShippingCost}
                                        onChange={(e) => {
                                            const newRules = [...rules];
                                            newRules[idx].baseShippingCost = parseFloat(e.target.value);
                                            setRules(newRules);
                                        }}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400">COD Fee Fixed (€)</label>
                                    <Input
                                        type="number"
                                        value={rule.codFeeFixed}
                                        onChange={(e) => {
                                            const newRules = [...rules];
                                            newRules[idx].codFeeFixed = parseFloat(e.target.value);
                                            setRules(newRules);
                                        }}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400">COD Fee (%)</label>
                                    <Input
                                        type="number"
                                        value={rule.codFeePercent}
                                        onChange={(e) => {
                                            const newRules = [...rules];
                                            newRules[idx].codFeePercent = parseFloat(e.target.value);
                                            setRules(newRules);
                                        }}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400">VAT (%)</label>
                                    <Input
                                        type="number"
                                        value={rule.taxPercent}
                                        onChange={(e) => {
                                            const newRules = [...rules];
                                            newRules[idx].taxPercent = parseFloat(e.target.value);
                                            setRules(newRules);
                                        }}
                                    />
                                </div>
                            </div>
                            <Button onClick={() => handleSave(rule)} className="w-full bg-blue-600 uppercase font-black text-[10px] rounded-xl">
                                <Save className="h-3 w-3 mr-2" /> Guardar Cambios
                            </Button>
                        </CardContent>
                    </Card>
                ))}

                <Button className="h-full border-2 border-dashed border-slate-200 bg-transparent text-slate-400 hover:bg-slate-50 transition-all rounded-[2rem] flex flex-col gap-4 py-20 px-10">
                    <Plus className="h-10 w-10" />
                    <span className="font-black uppercase tracking-widest text-xs">Añadir Nueva Regla de Pago</span>
                </Button>
            </div>
        </div>
    );
}
