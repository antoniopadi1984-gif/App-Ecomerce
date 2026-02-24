"use client";

import { useState, useEffect } from "react";
import {
    Calculator, Truck, Save, Plus, Trash2,
    DollarSign, Percent, AlertCircle, Copy, Link as LinkIcon
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function LogisticsSettingsPage() {
    const [rules, setRules] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [baseUrl, setBaseUrl] = useState("");

    useEffect(() => {
        setBaseUrl(window.location.origin);
        setTimeout(() => {
            setRules([
                { id: '1', provider: 'BEEPING', baseShippingCost: 6.5, returnCost: 3.5, codFeeFixed: 0.5, codFeePercent: 1.5, isActive: true },
                { id: '2', provider: 'GENERIC', baseShippingCost: 7.2, returnCost: 4.0, codFeeFixed: 1.0, codFeePercent: 2.0, isActive: true },
            ]);
            setIsLoading(false);
        }, 500);
    }, []);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("URL copiada al portapapeles");
    };

    const saveRule = (id: string, data: any) => {
        setRules(rules.map(r => r.id === id ? { ...r, ...data } : r));
        toast.success("Regla de costes actualizada.");
    };

    const providers = [
        { name: "Beeping", url: `${baseUrl}/api/webhooks/beeping`, icon: "bg-blue-50 text-blue-600" },
        { name: "Dropea", url: `${baseUrl}/api/webhooks/generic-logistics?provider=DROPEA`, icon: "bg-purple-50 text-purple-600" },
        { name: "Droppi", url: `${baseUrl}/api/webhooks/generic-logistics?provider=DROPPI`, icon: "bg-orange-50 text-orange-600" },
    ];

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight uppercase italic flex items-center gap-3">
                        <Calculator className="h-8 w-8 text-primary" /> Configuración Logística
                    </h1>
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-1">
                        Webhooks, Tarifas y Reglas de Negocio
                    </p>
                </div>
            </header>

            {/* WEBHOOKS CONFIGURATION */}
            <Card className="bg-slate-950 border-slate-900 text-white overflow-hidden rounded-[2.5rem]">
                <CardHeader className="bg-white/5 border-b border-white/5 px-8 pt-8 pb-6">
                    <CardTitle className="text-xl font-black italic uppercase flex items-center gap-2">
                        <LinkIcon className="h-5 w-5 text-emerald-400" /> Integración Automática (Webhooks)
                    </CardTitle>
                    <CardDescription className="text-slate-400 font-medium">
                        Copia estas URLs y pégalas en el panel de configuración de tu proveedor logístico para recibir actualizaciones en tiempo real.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-8 grid gap-6">
                    {providers.map((p) => (
                        <div key={p.name} className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/5">
                            <div className={`h-10 w-10 flex items-center justify-center rounded-lg font-black text-xs uppercase ${p.icon}`}>
                                {p.name.substring(0, 2)}
                            </div>
                            <div className="flex-1 space-y-1">
                                <Label className="text-xs uppercase font-bold text-slate-400">Webhook para {p.name}</Label>
                                <div className="flex items-center gap-2">
                                    <code className="bg-black/30 px-3 py-1.5 rounded-lg text-xs font-mono text-emerald-300 break-all">
                                        {p.url}
                                    </code>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(p.url)}
                                className="bg-transparent border-white/20 hover:bg-white/10 text-white gap-2 uppercase text-[10px] font-bold"
                            >
                                <Copy className="h-3.5 w-3.5" /> Copiar
                            </Button>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <div className="flex items-center gap-2 mt-8 mb-4">
                <Truck className="h-5 w-5 text-slate-400" />
                <h2 className="text-lg font-black uppercase text-slate-600">Reglas de Costes (Profit Calculator)</h2>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {rules.map((rule) => (
                    <Card key={rule.id} className="overflow-hidden border-border bg-card shadow-lg rounded-[2.5rem]">
                        <div className="p-8 flex flex-col sm:flex-row gap-8">
                            <div className="w-full sm:w-64 space-y-4">
                                <div className="h-14 w-full bg-muted flex items-center justify-center rounded-2xl">
                                    <span className="text-xl font-black italic">{rule.provider}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge className="bg-emerald-50 text-emerald-600 border-none px-3 py-1 font-black text-[9px] uppercase">Activo</Badge>
                                </div>
                            </div>

                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Envío Base (Ida)</Label>
                                    <div className="relative">
                                        <Truck className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                        <Input
                                            type="number"
                                            defaultValue={rule.baseShippingCost}
                                            className="pl-9 h-12 rounded-xl bg-background border-border font-black text-sm"
                                            onChange={(e) => saveRule(rule.id, { baseShippingCost: parseFloat(e.target.value) })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Logística Inversa (Devolución)</Label>
                                    <div className="relative">
                                        <AlertCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-rose-500" />
                                        <Input
                                            type="number"
                                            defaultValue={rule.returnCost}
                                            className="pl-9 h-12 rounded-xl bg-background border-border font-black text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Comisión COD Fija</Label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                        <Input
                                            type="number"
                                            defaultValue={rule.codFeeFixed}
                                            className="pl-9 h-12 rounded-xl bg-background border-border font-black text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Comisión COD (%)</Label>
                                    <div className="relative">
                                        <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                        <Input
                                            type="number"
                                            defaultValue={rule.codFeePercent}
                                            className="pl-9 h-12 rounded-xl bg-background border-border font-black text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
