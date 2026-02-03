"use client";

import { useState, useEffect } from "react";
import {
    Sparkles, ShieldCheck, Zap, History, Layout,
    Type, FileText, Search, Plus, Filter, Info,
    AlertTriangle, CheckCircle2, ChevronRight, Copy, Save
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { generateProductCopy } from "./actions";
import { getProducts } from "../video-lab/actions";
import { validateContent } from "@/lib/content-qa";

export default function CopyHubPage() {
    const [loading, setLoading] = useState(false);
    const [selectedProductId, setSelectedProductId] = useState<string>("");
    const [dbProducts, setDbProducts] = useState<any[]>([]);
    const [context, setContext] = useState<any>("LANDING_PAGE");
    const [conceptId, setConceptId] = useState("NAD_C1");
    const [generatedCopy, setGeneratedCopy] = useState("");
    const [qaResult, setQaResult] = useState<any>(null);

    useEffect(() => {
        const fetchProducts = async () => {
            const res = await getProducts();
            if (res.success && res.products) {
                setDbProducts(res.products);
                if (res.products.length > 0) setSelectedProductId(res.products[0].id);
            }
        };
        fetchProducts();
    }, []);

    const handleGenerate = async () => {
        if (!selectedProductId) return toast.error("Selecciona un producto.");
        setLoading(true);
        const res = await generateProductCopy({
            productId: selectedProductId,
            context,
            conceptId,
            storeId: "default" // Will be resolved by server action
        });
        setLoading(false);

        if (res.success) {
            setGeneratedCopy(res.content);
            const qa = validateContent(res.content, (context === 'AD_VIDEO' || context === 'AD_STATIC') ? 'AD' : 'LANDING');
            setQaResult(qa);
            toast.success("Copy generado con éxito.");
        } else {
            toast.error("Error: " + res.error);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans relative overflow-hidden">
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-yellow-100/30 via-slate-50 to-slate-50 pointer-events-none" />

            <header className="relative flex items-center justify-between mb-10 z-10">
                <div>
                    <h1 className="text-4xl font-black uppercase italic tracking-tighter flex items-center gap-4">
                        <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center shadow-premium border border-slate-200">
                            <Zap className="h-6 w-6 text-yellow-600" />
                        </div>
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-700 to-slate-500">
                            Copy Hub
                        </span>
                        <span className="text-yellow-600 underline decoration-4 decoration-yellow-200 underline-offset-8">Ultra</span>
                    </h1>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[11px] mt-3 ml-1">
                        Arquitectura de Respuesta Directa & Multi-Tenant
                    </p>
                </div>
                <div className="flex gap-4">
                    <Badge variant="outline" className="border-green-200 text-green-600 bg-green-50 px-4 py-2 font-black uppercase text-[10px] tracking-widest">
                        RBAC: ADMIN
                    </Badge>
                </div>
            </header>

            <div className="grid grid-cols-12 gap-10 relative z-10">
                {/* Configuration Panel */}
                <div className="col-span-12 lg:col-span-4 space-y-6">
                    <Card className="bg-white border-slate-200 rounded-[2rem] shadow-luxe overflow-hidden p-8 space-y-8">
                        <div className="space-y-1">
                            <h2 className="text-xl font-black uppercase italic text-slate-800 flex items-center gap-2">
                                <Plus className="h-5 w-5 text-yellow-600" /> Crear Nuevo Asset
                            </h2>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Define la dirección creativa.</p>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Producto</label>
                                <select
                                    value={selectedProductId}
                                    onChange={(e) => setSelectedProductId(e.target.value)}
                                    className="w-full h-14 bg-slate-50 border-slate-200 rounded-2xl px-6 font-bold text-slate-700 outline-none focus:ring-yellow-500/20"
                                >
                                    {dbProducts.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Concept ID</label>
                                <Input
                                    value={conceptId}
                                    onChange={e => setConceptId(e.target.value)}
                                    placeholder="Ej: NAD_C1"
                                    className="h-14 bg-slate-50 border-slate-200 rounded-2xl px-6 font-bold text-slate-700"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Formato de Salida</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { id: 'LANDING_PAGE', label: 'Landing Page', icon: Layout },
                                        { id: 'AD_VIDEO', label: 'Video Script', icon: FileText },
                                        { id: 'ADVERTORIAL', label: 'Advertorial', icon: Type },
                                        { id: 'AD_STATIC', label: 'Static Ad', icon: Sparkles },
                                    ].map(item => (
                                        <button
                                            key={item.id}
                                            onClick={() => setContext(item.id)}
                                            className={cn(
                                                "flex items-center gap-3 p-4 rounded-2xl border transition-all text-[10px] font-black uppercase tracking-tight text-left",
                                                context === item.id
                                                    ? "bg-yellow-600 border-yellow-700 text-white shadow-xl shadow-yellow-900/20"
                                                    : "bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100"
                                            )}
                                        >
                                            <item.icon className="h-4 w-4 shrink-0" />
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4">
                                <Button
                                    onClick={handleGenerate}
                                    disabled={loading}
                                    className="w-full h-16 rounded-[1.25rem] bg-slate-900 hover:bg-black text-white font-black uppercase tracking-widest text-[11px] shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    {loading ? "Orquestando IA..." : "Generar Master Copy"}
                                </Button>
                            </div>
                        </div>
                    </Card>

                    {/* Mode Status */}
                    <Card className={cn(
                        "rounded-[2rem] p-6 border transition-colors",
                        (context === 'LANDING_PAGE' || context === 'ADVERTORIAL')
                            ? "bg-red-50 border-red-100 text-red-900"
                            : "bg-blue-50 border-blue-100 text-blue-900"
                    )}>
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                "h-12 w-12 rounded-2xl flex items-center justify-center shadow-sm",
                                (context === 'LANDING_PAGE' || context === 'ADVERTORIAL') ? "bg-red-600 text-white" : "bg-blue-600 text-white"
                            )}>
                                {(context === 'LANDING_PAGE' || context === 'ADVERTORIAL') ? <Zap className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
                            </div>
                            <div>
                                <h3 className="font-black uppercase italic text-sm">
                                    {(context === 'LANDING_PAGE' || context === 'ADVERTORIAL') ? "Modo Agresivo" : "Modo Seguro Ads"}
                                </h3>
                                <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest mt-1">
                                    {(context === 'LANDING_PAGE' || context === 'ADVERTORIAL') ? "Prioridad máxima conversión" : "Compliance con Meta activado"}
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Output & QA Dashboard */}
                <div className="col-span-12 lg:col-span-8 space-y-6">
                    <Card className="bg-white border-slate-200 rounded-[2.5rem] shadow-premium min-h-[600px] flex flex-col p-2 overflow-hidden">
                        <Tabs defaultValue="editor" className="flex-1 flex flex-col">
                            <TabsList className="bg-slate-50/50 p-2 h-14 border-b border-slate-100 w-full justify-start gap-2">
                                <TabsTrigger value="editor" className="rounded-xl font-black uppercase text-[10px] px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">Editor Maestro</TabsTrigger>
                                <TabsTrigger value="preview" className="rounded-xl font-black uppercase text-[10px] px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">Vista Previa</TabsTrigger>
                                <TabsTrigger value="qa" className="rounded-xl font-black uppercase text-[10px] px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm flex gap-2">
                                    Content QA {qaResult && <div className={cn("h-2 w-2 rounded-full", qaResult.passed ? "bg-green-500" : "bg-red-500")} />}
                                </TabsTrigger>
                                <div className="ml-auto pr-4 flex items-center gap-2">
                                    <Badge variant="outline" className="text-slate-400 font-bold text-[9px]">ID: {conceptId}_v1</Badge>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900"><Save className="h-4 w-4" /></Button>
                                </div>
                            </TabsList>
                            <TabsContent value="editor" className="flex-1 p-6">
                                <Textarea
                                    value={generatedCopy}
                                    onChange={e => setGeneratedCopy(e.target.value)}
                                    placeholder="El copy generado aparecerá aquí para tu revisión final..."
                                    className="w-full h-full min-h-[500px] bg-transparent border-none text-slate-700 text-lg font-medium leading-relaxed resize-none focus:ring-0 p-4 font-mono"
                                />
                            </TabsContent>

                            <TabsContent value="qa" className="flex-1 p-8 space-y-8">
                                {qaResult ? (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                                        <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "h-16 w-16 rounded-full flex items-center justify-center text-white text-2xl font-black",
                                                    qaResult.passed ? "bg-green-500 shadow-green-200 shadow-xl" : "bg-red-500 shadow-red-200 shadow-xl"
                                                )}>
                                                    {qaResult.score}%
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-black uppercase italic text-slate-900">Puntuación de Calidad</h3>
                                                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Contenido evaluado por ContentGuard v1</p>
                                                </div>
                                            </div>
                                            {qaResult.passed ? (
                                                <Badge className="bg-green-100 text-green-700 hover:bg-green-100 px-4 py-2 rounded-xl flex gap-2">
                                                    <CheckCircle2 className="h-4 w-4" /> PASADO
                                                </Badge>
                                            ) : (
                                                <Badge className="bg-red-100 text-red-700 hover:bg-red-100 px-4 py-2 rounded-xl flex gap-2">
                                                    <AlertTriangle className="h-4 w-4" /> REQUIERE AJUSTE
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="space-y-4">
                                            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">Observaciones del Agente</h4>
                                            <div className="space-y-3">
                                                {qaResult.warnings.length > 0 ? qaResult.warnings.map((w: string, i: number) => (
                                                    <div key={i} className="flex items-center gap-4 p-4 bg-orange-50 border border-orange-100 rounded-2xl text-orange-900 text-sm font-bold">
                                                        <AlertTriangle className="h-5 w-5 text-orange-500 shrink-0" />
                                                        {w}
                                                    </div>
                                                )) : (
                                                    <div className="flex items-center gap-4 p-4 bg-green-50 border border-green-100 rounded-2xl text-green-900 text-sm font-bold">
                                                        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                                                        Todo correcto. El contenido cumple con las normas del canal.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-[400px] text-slate-300 gap-4">
                                        <ShieldCheck className="h-16 w-16 opacity-20" />
                                        <p className="font-black uppercase tracking-[0.2em] text-xs">Sin datos de validación</p>
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    </Card>
                </div>
            </div>
        </div>
    );
}
