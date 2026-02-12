"use client";

import React, { useState, useRef } from "react";
import {
    Layout,
    Upload,
    Zap,
    Globe,
    FileText,
    Layers,
    Sparkles,
    Rocket,
    Check,
    Search,
    Brain as BrainIcon,
    ShoppingCart,
    Info,
    ChevronRight,
    MousePointer2,
    ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
    uploadShopifyTheme,
    generateProLayout,
    replicateCompetitorLanding,
    pushToShopify
} from "@/app/marketing/landing-lab/actions";

interface LandingLabProps {
    productId: string;
    productTitle?: string;
}

export function LandingLabModule({ productId, productTitle }: LandingLabProps) {
    const [themeConfig, setThemeConfig] = useState<any>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [selectedLayout, setSelectedLayout] = useState<'ADVERTORIAL' | 'LISTICLE' | 'PRODUCT_PAGE' | 'HYBRID'>('ADVERTORIAL');
    const [generatedStructure, setGeneratedStructure] = useState<any[]>([]);
    const [replicateUrl, setReplicateUrl] = useState("");

    const handleThemeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsScanning(true);
        const tid = toast.loading("Analizando liquid...");
        try {
            const formData = new FormData();
            formData.append("theme", file);
            const res = await uploadShopifyTheme(formData);
            if (res.success && res.sections) {
                setThemeConfig(res);
                toast.success(`Tema cargado: ${res.sections.length} secciones`, { id: tid });
            } else {
                toast.error(res?.message || "Error al analizar tema", { id: tid });
            }
        } catch (error) {
            toast.error("Error al analizar tema", { id: tid });
        } finally {
            setIsScanning(false);
        }
    };

    const handleGenerate = async () => {
        toast.promise(generateProLayout({
            type: selectedLayout,
            productId,
            useProSections: true
        }), {
            loading: 'Diseñando funnel...',
            success: (res) => {
                setGeneratedStructure(res.structure);
                return "Funnel generado";
            },
            error: 'Error al generar'
        });
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4 pb-12">
            {/* Left Config */}
            <div className="lg:col-span-4 space-y-6">
                <Tabs defaultValue="creador" className="w-full">
                    <TabsList className="bg-slate-100/50 p-1 h-12 rounded-xl mb-4 w-full">
                        <TabsTrigger value="config" className="flex-1 text-[9px] font-black uppercase">TEMA</TabsTrigger>
                        <TabsTrigger value="creador" className="flex-1 text-[9px] font-black uppercase">DISEÑO</TabsTrigger>
                        <TabsTrigger value="replicador" className="flex-1 text-[9px] font-black uppercase">CLON</TabsTrigger>
                    </TabsList>

                    <TabsContent value="config">
                        <Card className="border-slate-100 shadow-sm">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-sm font-black uppercase flex items-center gap-2">
                                    <Upload className="w-4 h-4 text-indigo-500" /> Sincronizar Tienda
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div
                                    className={cn(
                                        "border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all",
                                        themeConfig ? "border-emerald-200 bg-emerald-50/20" : "border-slate-100 bg-slate-50 hover:bg-white"
                                    )}
                                    onClick={() => document.getElementById('theme-module-input')?.click()}
                                >
                                    <input id="theme-module-input" type="file" className="hidden" onChange={handleThemeUpload} accept=".zip" />
                                    <Upload className={cn("w-8 h-8 mb-2", themeConfig ? "text-emerald-500" : "text-slate-300")} />
                                    <span className="text-[10px] font-black uppercase text-slate-900">
                                        {isScanning ? "Escaneando..." : themeConfig ? "Sincronizado" : "Subir Theme.zip"}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="creador">
                        <Card className="border-slate-100 shadow-sm">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-sm font-black uppercase">Inteligencia de Embudo</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-2">
                                    <LayoutOption label="Advertorial" active={selectedLayout === 'ADVERTORIAL'} onClick={() => setSelectedLayout('ADVERTORIAL')} icon={FileText} />
                                    <LayoutOption label="Listicle" active={selectedLayout === 'LISTICLE'} onClick={() => setSelectedLayout('LISTICLE')} icon={Layers} />
                                    <LayoutOption label="Product" active={selectedLayout === 'PRODUCT_PAGE'} onClick={() => setSelectedLayout('PRODUCT_PAGE')} icon={ShoppingCart} />
                                    <LayoutOption label="Hybrid" active={selectedLayout === 'HYBRID'} onClick={() => setSelectedLayout('HYBRID')} icon={Sparkles} />
                                </div>
                                <Button onClick={handleGenerate} className="w-full h-12 bg-slate-900 text-white font-black uppercase tracking-widest text-[10px] rounded-xl">
                                    Construir Layout
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Right Preview */}
            <div className="lg:col-span-8 space-y-4">
                <div className="bg-slate-900 rounded-[2rem] p-1 border border-slate-800 shadow-2xl overflow-hidden">
                    <div className="h-8 flex items-center px-4 justify-between bg-black/20 border-b border-white/5">
                        <div className="flex gap-1">
                            <div className="w-2 h-2 rounded-full bg-rose-500/30" />
                            <div className="w-2 h-2 rounded-full bg-amber-500/30" />
                            <div className="w-2 h-2 rounded-full bg-emerald-500/30" />
                        </div>
                        <span className="text-[8px] text-slate-500 font-mono tracking-widest uppercase">Live Funnel Preview</span>
                        <div className="w-8" />
                    </div>
                    <ScrollArea className="h-[600px] bg-white">
                        {generatedStructure.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center p-20 text-slate-200">
                                <Sparkles className="w-12 h-12 mb-4 opacity-10" />
                                <p className="text-[10px] font-black uppercase tracking-widest">Genera un layout para previsualizar</p>
                            </div>
                        ) : (
                            <div className="p-4 space-y-4">
                                {generatedStructure.map((block, i) => (
                                    <div key={i} className="p-12 border border-slate-100 rounded-2xl bg-slate-50 text-center">
                                        <Badge className="mb-4 bg-indigo-50 text-indigo-600 border-none font-black text-[8px] uppercase">{block.type}</Badge>
                                        <h3 className="text-xl font-black text-slate-800 italic">{block.content || "Sección Estructural"}</h3>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </div>

                <div className="flex justify-end gap-3">
                    <Button
                        disabled={generatedStructure.length === 0}
                        className="h-12 px-8 bg-emerald-600 text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg shadow-emerald-500/10"
                        onClick={() => toast.success("Enviado a Shopify (Simulado)")}
                    >
                        <Rocket className="w-4 h-4 mr-2" /> Push to Shopify
                    </Button>
                </div>
            </div>
        </div>
    );
}

function LayoutOption({ label, active, onClick, icon: Icon }: any) {
    return (
        <div
            onClick={onClick}
            className={cn(
                "p-3 rounded-xl border flex flex-col items-center justify-center gap-2 cursor-pointer transition-all",
                active ? "bg-indigo-600 border-indigo-700 text-white" : "bg-slate-50 border-slate-100 text-slate-400 hover:bg-white"
            )}
        >
            <Icon className="w-5 h-5" />
            <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
        </div>
    );
}
