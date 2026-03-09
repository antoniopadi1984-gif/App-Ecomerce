"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe, Save, Package, Tag, Info, Trash2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store/store-context";
import { updateProduct } from "@/app/investigacion/actions/product-actions";

export function ProductSettings({ product }: { product: any }) {
    const router = useRouter();
    const { activeStore } = useStore();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: product?.title || "",
        description: product?.description || "",
        country: product?.country || "ES",
        niche: product?.niche || "",
        productFamily: product?.productFamily || "",
        marketLanguage: product?.marketLanguage || "ES",
        currency: product?.currency || activeStore?.currency || "EUR",
    });

    const handleSave = async () => {
        if (!formData.title) return toast.error("El título es obligatorio");
        setLoading(true);
        try {
            await updateProduct(product.id, formData);
            toast.success("Configuración guardada correctamente");
            router.refresh();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">
                        Ajustes del <span className="text-indigo-600 not-italic">Producto</span>
                    </h1>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 italic">
                        Configuración Maestra • Localización & Metadatos
                    </p>
                </div>
                <Button
                    variant="outline"
                    onClick={() => router.back()}
                    className="rounded-xl border-slate-200 text-slate-500 font-bold text-[10px] uppercase tracking-widest h-9"
                >
                    <ArrowLeft className="w-3.5 h-3.5 mr-2" />
                    Volver
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
                        <CardHeader className="bg-slate-50/50 p-6 border-b border-slate-100">
                            <CardTitle className="text-xs font-black uppercase text-slate-800 flex items-center gap-2">
                                <Package className="w-4 h-4 text-indigo-500" /> Datos Principales
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Nombre del Producto</Label>
                                <Input
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="h-10 rounded-xl border-slate-200 font-bold text-sm"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Nicho / Categoría</Label>
                                    <div className="relative">
                                        <Tag className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                        <Input
                                            value={formData.niche}
                                            onChange={e => setFormData({ ...formData, niche: e.target.value })}
                                            className="h-10 pl-10 rounded-xl border-slate-200 font-bold text-sm"
                                            placeholder="Ej: Fitness, Hogar..."
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Familia de Producto</Label>
                                    <Input
                                        value={formData.productFamily}
                                        onChange={e => setFormData({ ...formData, productFamily: e.target.value })}
                                        className="h-10 rounded-xl border-slate-200 font-bold text-sm"
                                        placeholder="Ej: Serie Pro, Gama Alta..."
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Descripción Breve</Label>
                                <Textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="min-h-[120px] rounded-xl border-slate-200 text-sm p-4 resize-none leading-relaxed"
                                    placeholder="Resume las ventajas principales del producto..."
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden border-indigo-100 ring-1 ring-indigo-500/5">
                        <CardHeader className="bg-indigo-50/30 p-6 border-b border-indigo-100">
                            <CardTitle className="text-xs font-black uppercase text-indigo-900 flex items-center gap-2">
                                <Globe className="w-4 h-4 text-indigo-600" /> Localización Cultural (Brain Sync)
                            </CardTitle>
                            <CardDescription className="text-[10px] font-medium text-indigo-700/60 uppercase tracking-widest leading-none">
                                Define el léxico y tono que usarán los agentes de IA.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Idioma del Mercado</Label>
                                        <Select
                                            value={formData.marketLanguage}
                                            onValueChange={val => setFormData({ ...formData, marketLanguage: val })}
                                        >
                                            <SelectTrigger className="h-12 rounded-xl border-indigo-100 font-bold text-sm bg-white shadow-sm ring-1 ring-indigo-500/5">
                                                <SelectValue placeholder="Idioma..." />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-indigo-50 p-1 shadow-2xl">
                                                <SelectItem value="ES" className="rounded-lg py-2.5 font-bold text-xs">Español</SelectItem>
                                                <SelectItem value="EN" className="rounded-lg py-2.5 font-bold text-xs">Inglés</SelectItem>
                                                <SelectItem value="FR" className="rounded-lg py-2.5 font-bold text-xs">Francés</SelectItem>
                                                <SelectItem value="IT" className="rounded-lg py-2.5 font-bold text-xs">Italiano</SelectItem>
                                                <SelectItem value="DE" className="rounded-lg py-2.5 font-bold text-xs">Alemán</SelectItem>
                                                <SelectItem value="PT" className="rounded-lg py-2.5 font-bold text-xs">Portugués</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Moneda de Venta</Label>
                                        <Select
                                            value={formData.currency}
                                            onValueChange={val => setFormData({ ...formData, currency: val })}
                                        >
                                            <SelectTrigger className="h-12 rounded-xl border-indigo-100 font-bold text-sm bg-white shadow-sm ring-1 ring-indigo-500/5">
                                                <SelectValue placeholder="Moneda..." />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-indigo-50 p-1 shadow-2xl">
                                                <SelectItem value="EUR" className="rounded-lg py-2.5 font-bold text-xs">EUR (€)</SelectItem>
                                                <SelectItem value="USD" className="rounded-lg py-2.5 font-bold text-xs">USD ($)</SelectItem>
                                                <SelectItem value="MXN" className="rounded-lg py-2.5 font-bold text-xs">MXN ($)</SelectItem>
                                                <SelectItem value="COP" className="rounded-lg py-2.5 font-bold text-xs">COP ($)</SelectItem>
                                                <SelectItem value="GBP" className="rounded-lg py-2.5 font-bold text-xs">GBP (£)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-100 flex gap-3 text-amber-900/60">
                                    <Info className="w-5 h-5 text-amber-500 shrink-0" />
                                    <p className="text-[10px] font-bold uppercase leading-relaxed tracking-tight italic">
                                        IMPORTANTE: Cambiar el país alterará el tono de los próximos informes de investigación y creativos. La IA pasará a usar el léxico regional seleccionado.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden bg-slate-900 text-white">
                        <CardHeader className="p-6">
                            <CardTitle className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.2em]">Acciones Maestras</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 pt-0 space-y-4">
                            <Button
                                onClick={handleSave}
                                disabled={loading}
                                className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
                            >
                                {loading ? "Guardando..." : (
                                    <div className="flex items-center gap-2">
                                        <Save className="w-4 h-4" />
                                        GUARDAR CONFIGURACIÓN
                                    </div>
                                )}
                            </Button>

                            <Button
                                variant="ghost"
                                className="w-full h-12 rounded-xl text-rose-400 hover:text-white hover:bg-rose-500/20 font-black text-xs border border-white/5"
                            >
                                <div className="flex items-center gap-2">
                                    <Trash2 className="w-4 h-4" />
                                    ELIMINAR PRODUCTO
                                </div>
                            </Button>
                        </CardContent>
                    </Card>

                    <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm space-y-4">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado del Sistema</h4>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-[11px] font-bold">
                                <span className="text-slate-500">Shopify Linked</span>
                                <Badge variant="outline" className="text-[9px] font-black uppercase text-emerald-500 border-emerald-100 bg-emerald-50 px-2 py-0">ACTIVO</Badge>
                            </div>
                            <div className="flex justify-between items-center text-[11px] font-bold">
                                <span className="text-slate-500">Google Drive</span>
                                <Badge variant="outline" className="text-[9px] font-black uppercase text-emerald-500 border-emerald-100 bg-emerald-50 px-2 py-0">CONECTADO</Badge>
                            </div>
                            <div className="flex justify-between items-center text-[11px] font-bold">
                                <span className="text-slate-500">Meta Pixel</span>
                                <Badge variant="outline" className="text-[9px] font-black uppercase text-amber-500 border-amber-100 bg-amber-50 px-2 py-0">PENDIENTE</Badge>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
