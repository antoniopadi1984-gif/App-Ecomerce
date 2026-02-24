"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Rocket, Sparkles, Loader2, Camera, Globe, DollarSign, Truck, RotateCcw, ShieldCheck, Zap } from "lucide-react";
import { launchMVPRapidly } from "./actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function MVPWizard({ stores }: { stores: any[] }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [selectedStoreId, setSelectedStoreId] = useState(stores[0]?.id || "");
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        imageUrl: "",
        country: "España",
        niche: "",
        unitCost: 0,
        shippingCost: 0,
        returnCost: 0,
        vatPercent: 21,
        isCod: true
    });

    const handleLaunch = async () => {
        if (!formData.title || !selectedStoreId) {
            toast.error("El título y la tienda son obligatorios");
            return;
        }

        setLoading(true);
        try {
            const result = await launchMVPRapidly(selectedStoreId, formData);
            if (result.success) {
                toast.success("🚀 ¡Fuego en el hoyo! Investigación y MVP iniciados.");
                router.push(`/marketing/research?productId=${result.productId}`);
            } else {
                toast.error(result.error || "Algo salió mal");
            }
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-3 animate-in fade-in duration-500">
            <header className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-rose-600 rounded-lg shadow-sm">
                        <Rocket className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-slate-900 uppercase tracking-tighter leading-none">Lanzamiento MVP 3-Clicks</h1>
                        <p className="text-slate-400 font-bold text-[9px] uppercase tracking-widest leading-none">De producto desconocido a Test de Ads en minutos.</p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                {/* Main Form */}
                <Card className="lg:col-span-2 rounded-xl border-slate-200 shadow-sm overflow-hidden">
                    <CardHeader className="bg-slate-50/50 p-3 border-b border-slate-100 py-2.5">
                        <div className="flex items-center gap-2">
                            <Zap className="text-amber-500 w-3.5 h-3.5 fill-amber-500" />
                            <CardTitle className="text-xs font-black uppercase text-slate-800">1. Datos Básicos del Producto</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-3 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <div className="space-y-0.5">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Tienda Destino</Label>
                                    <Select value={selectedStoreId} onValueChange={setSelectedStoreId}>
                                        <SelectTrigger className="h-8 rounded-lg border-slate-200 font-bold text-xs bg-slate-50/30">
                                            <SelectValue placeholder="Selecciona tienda..." />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-lg border-slate-100 shadow-sm">
                                            {stores.map(s => (
                                                <SelectItem key={s.id} value={s.id} className="text-xs font-bold py-1.5">{s.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-0.5">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Título del Producto</Label>
                                    <Input
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="Ej: Calentador de Cuello Pro"
                                        className="h-8 rounded-lg border-slate-200 font-bold text-xs"
                                    />
                                </div>

                                <div className="space-y-0.5">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Foto o URL Imagen</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            value={formData.imageUrl}
                                            onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                                            placeholder="http://..."
                                            className="h-8 rounded-lg border-slate-200 font-bold text-xs flex-1"
                                        />
                                        <Button variant="outline" className="h-8 w-8 rounded-lg p-0 border-slate-200">
                                            <Camera size={14} className="text-slate-400" />
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="space-y-0.5">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Breve Descripción (Opcional)</Label>
                                    <Textarea
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Explica qué es o añade link de Amazon/Aliexpress..."
                                        className="min-h-[86px] rounded-lg border-slate-200 font-medium text-xs resize-none leading-snug"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-0.5">
                                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">País / Localización</Label>
                                        <Select
                                            value={formData.country}
                                            onValueChange={val => setFormData({ ...formData, country: val })}
                                        >
                                            <SelectTrigger className="h-8 rounded-lg border-slate-200 font-bold text-xs bg-white">
                                                <div className="flex items-center gap-2">
                                                    <Globe className="w-3.5 h-3.5 text-slate-400" />
                                                    <SelectValue placeholder="Selecciona país..." />
                                                </div>
                                            </SelectTrigger>
                                            <SelectContent className="rounded-lg border-slate-100 shadow-sm">
                                                <SelectItem value="ES" className="text-xs font-bold py-1.5 flex items-center gap-2">🇪🇸 España (Peninsular)</SelectItem>
                                                <SelectItem value="MX" className="text-xs font-bold py-1.5">🇲🇽 México</SelectItem>
                                                <SelectItem value="CO" className="text-xs font-bold py-1.5">🇨🇴 Colombia</SelectItem>
                                                <SelectItem value="AR" className="text-xs font-bold py-1.5">🇦🇷 Argentina</SelectItem>
                                                <SelectItem value="US" className="text-xs font-bold py-1.5">🇺🇸 USA (English)</SelectItem>
                                                <SelectItem value="UK" className="text-xs font-bold py-1.5">🇬🇧 UK (English)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-0.5">
                                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Nicho</Label>
                                        <Input
                                            value={formData.niche}
                                            onChange={e => setFormData({ ...formData, niche: e.target.value })}
                                            placeholder="Hogar, Fitness..."
                                            className="h-8 rounded-lg border-slate-200 font-bold text-xs"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Financials & Action */}
                <div className="space-y-3">
                    <Card className="rounded-xl border-slate-200 shadow-sm bg-rose-50/20">
                        <CardHeader className="p-3 border-b border-rose-100/50 py-2.5">
                            <CardTitle className="text-[10px] font-black uppercase text-rose-900 flex items-center gap-2">
                                <DollarSign size={12} className="text-rose-600" /> 2. Estructura de Costes
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-0.5">
                                    <Label className="text-[9px] font-black uppercase text-slate-400">Coste Producto</Label>
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            value={formData.unitCost}
                                            onChange={e => setFormData({ ...formData, unitCost: parseFloat(e.target.value) || 0 })}
                                            className="h-7 rounded-lg text-xs border-slate-200 pl-5 font-bold"
                                        />
                                        <span className="absolute left-2 top-1.5 text-[9px] font-bold text-slate-400">€</span>
                                    </div>
                                </div>
                                <div className="space-y-0.5">
                                    <Label className="text-[9px] font-black uppercase text-slate-400">Envío + Manip.</Label>
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            value={formData.shippingCost}
                                            onChange={e => setFormData({ ...formData, shippingCost: parseFloat(e.target.value) || 0 })}
                                            className="h-7 rounded-lg text-xs border-slate-200 pl-5 font-bold"
                                        />
                                        <span className="absolute left-2 top-1.5 text-[9px] font-bold text-slate-400">€</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-0.5">
                                    <Label className="text-[9px] font-black uppercase text-slate-400">Logística Retorno</Label>
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            value={formData.returnCost}
                                            onChange={e => setFormData({ ...formData, returnCost: parseFloat(e.target.value) || 0 })}
                                            className="h-7 rounded-lg text-xs border-slate-200 pl-5 font-bold"
                                        />
                                        <span className="absolute left-2 top-1.5 text-[9px] font-bold text-slate-400">€</span>
                                    </div>
                                </div>
                                <div className="space-y-0.5">
                                    <Label className="text-[9px] font-black uppercase text-slate-400">IVA (%)</Label>
                                    <Input
                                        type="number"
                                        value={formData.vatPercent}
                                        onChange={e => setFormData({ ...formData, vatPercent: parseFloat(e.target.value) || 0 })}
                                        className="h-7 rounded-lg text-xs border-slate-200 font-bold"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-2 bg-white/50 rounded-lg border border-rose-100">
                                <div className="flex items-center gap-1.5">
                                    <Truck className="w-3 h-3 text-rose-500" />
                                    <span className="text-[9px] font-black uppercase text-rose-900">¿Contraentrega?</span>
                                </div>
                                <Switch
                                    className="scale-[0.6] origin-right"
                                    checked={formData.isCod}
                                    onCheckedChange={val => setFormData({ ...formData, isCod: val })}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Button
                        onClick={handleLaunch}
                        disabled={loading}
                        className="w-full h-10 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-sm transition-all active:scale-95 flex flex-col items-center justify-center gap-0 leading-none"
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <>
                                <div className="flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5" />
                                    <span>INICIAR MEGA-LANZAMIENTO</span>
                                </div>
                                <span className="text-[7px] font-bold uppercase tracking-widest opacity-80 mt-0.5">Deep Research + Ads + Landing</span>
                            </>
                        )}
                    </Button>

                    <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-emerald-400">
                            <ShieldCheck size={10} />
                            <span className="text-[8px] font-black uppercase tracking-tight">Protocolo "Everything Green"</span>
                        </div>
                        <div className="space-y-0.5">
                            {[
                                "Investigación Real",
                                "Carpetas Drive Auto",
                                "10-20 Creativos",
                                "Briefs con Fuentes"
                            ].map((step, i) => (
                                <div key={i} className="flex items-center gap-1.5">
                                    <div className="w-0.5 h-0.5 rounded-full bg-slate-500"></div>
                                    <span className="text-[7px] font-bold text-slate-400 uppercase">{step}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
