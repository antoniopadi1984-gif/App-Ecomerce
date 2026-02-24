
"use client";

import { useState, useEffect } from "react";
import {
    Image as ImageIcon, Sparkles, Download, Copy,
    ExternalLink, Wand2, Zap, Layers, RefreshCw,
    CheckCircle2, AlertCircle, Palette, Share2,
    Eye, Trash2, Sliders, Layout, Type, Upload as UploadIcon,
    Brain as BrainIcon, Info, Copy as CopyIcon, Plus, Monitor, Smartphone, Square
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { STATIC_ADS_PROTOCOL } from "@/lib/static-ads-protocol";
import { generateStaticConcepts, getProducts } from "./actions";
import { Textarea } from "@/components/ui/textarea";
import { AiCollaborationPanel } from "@/components/marketing/ai-collaboration-panel";
import { CreativeFactoryPanel } from "@/components/creative/CreativeFactoryPanel";

export default function StaticAdsPage() {
    const [productName, setProductName] = useState("");
    const [targetAudience, setTargetAudience] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [concepts, setConcepts] = useState<any[]>([]);
    const [selectedConcept, setSelectedConcept] = useState<number | null>(null);
    const [productImage, setProductImage] = useState<string | null>(null);
    const [productImageBase64, setProductImageBase64] = useState<string | null>(null);

    // Products
    const [dbProducts, setDbProducts] = useState<any[]>([]);
    const [selectedProductId, setSelectedProductId] = useState("");

    // Image Generation State
    const [generatingImages, setGeneratingImages] = useState(false);
    const [generatedAdImages, setGeneratedAdImages] = useState<{ [key: string]: string[] }>({});

    useEffect(() => {
        getProducts().then(res => {
            if (res.success && res.products) {
                setDbProducts(res.products);
                if (res.products.length > 0) {
                    setSelectedProductId(res.products[0].id);
                    setProductName(res.products[0].title);
                }
            }
        });
    }, []);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setProductImage(url);

            const reader = new FileReader();
            reader.onloadend = () => {
                setProductImageBase64(reader.result as string);
            };
            reader.readAsDataURL(file);

            toast.success("Imagen de producto cargada correctamente.");
        }
    };

    const handleGenerateConcepts = async () => {
        if (!productName || !targetAudience) {
            toast.error("Por favor ingresa el nombre del producto y la audiencia.");
            return;
        }
        setIsGenerating(true);
        const res = await generateStaticConcepts(productName, targetAudience, productImageBase64 || undefined);
        setIsGenerating(false);

        if (res.success && res.concepts) {
            setConcepts(res.concepts);
            toast.success("Conceptos generados con éxito.");
        } else {
            toast.error("Error al generar conceptos: " + res.error);
        }
    };

    const handleImportConcepts = (data: any) => {
        if (Array.isArray(data)) {
            setConcepts(data);
        } else if (data.concepts) {
            setConcepts(data.concepts);
        } else if (data.raw) {
            toast.info("Importado como texto plano. El sistema intentará extraer conceptos.");
        }
    };

    const copyToClipboard = (text: string, platform: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`Copiado al portapapeles (${platform})`);
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-6 font-sans selection:bg-yellow-200">
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-yellow-100/20 via-slate-50 to-slate-50 pointer-events-none" />

            <header className="relative flex items-center justify-between mb-6 z-10 shrink-0 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center shadow-sm border border-slate-200">
                        <ImageIcon className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black uppercase italic tracking-tighter text-slate-900 leading-none">Static Ads Lab</h1>
                        <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="outline" className="bg-yellow-50 border-yellow-200 text-yellow-700 px-1.5 py-0 font-bold text-[8px] uppercase tracking-widest leading-none rounded-sm">
                                Visual Studio v.1.0
                            </Badge>
                            <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[8px]">Graphic Intelligence</p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-12 gap-4 relative z-10">
                {/* Configuration Sidebar */}
                <div className="col-span-12 lg:col-span-4 xl:col-span-3 space-y-4">
                    <Card className="bg-white border-slate-200 rounded-lg p-4 space-y-6 shadow-luxe group relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="space-y-6">
                            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em]">1. Configuración de Marca</h3>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Producto</label>
                                    <select
                                        value={selectedProductId}
                                        onChange={(e) => {
                                            const p = dbProducts.find(x => x.id === e.target.value);
                                            setSelectedProductId(e.target.value);
                                            if (p) setProductName(p.title);
                                        }}
                                        className="w-full h-10 bg-slate-50 border-slate-200 rounded-lg focus:ring-yellow-500/20 focus:border-yellow-500/50 transition-all font-bold text-xs text-slate-700 px-3 outline-none appearance-none shadow-sm"
                                    >
                                        <option value="" disabled>Seleccionar producto...</option>
                                        {dbProducts.map(p => (
                                            <option key={p.id} value={p.id}>{p.title}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Audiencia Maestro</label>
                                    <Input
                                        placeholder="Ej: Personas con dolor de espalda..."
                                        value={targetAudience}
                                        onChange={(e) => setTargetAudience(e.target.value)}
                                        className="h-10 bg-slate-50 border-slate-200 rounded-lg focus:ring-yellow-500/20 focus:border-yellow-500/50 transition-all font-bold text-xs text-slate-700 px-3 shadow-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em]">2. Visual Style Tokens</h3>
                            <div className="grid grid-cols-2 gap-2">
                                {['Premium', 'Impact', 'Clean', 'Organic'].map((style) => (
                                    <Button key={style} variant="outline" className="h-10 rounded-lg border-slate-100 bg-slate-50/50 text-[10px] font-black uppercase tracking-widest hover:border-yellow-200 hover:bg-yellow-50 transition-all">
                                        {style}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <Button
                            onClick={handleGenerateConcepts}
                            disabled={isGenerating}
                            className="w-full h-12 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-black font-black uppercase tracking-widest shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            {isGenerating ? <RefreshCw className="h-4 w-4 animate-spin shrink-0" /> : <Wand2 className="h-4 w-4 shrink-0" />}
                            <span className="truncate text-[10px]">Diseñar Conceptos</span>
                        </Button>
                    </Card>

                    <AiCollaborationPanel
                        productId={selectedProductId || "temp"}
                        productName={productName || "Nuevo Producto"}
                        context={{
                            customPrompt: STATIC_ADS_PROTOCOL.AD_CONCEPT(productName, targetAudience)
                        }}
                        onImport={async (data) => {
                            handleImportConcepts(data);
                        }}
                        onGenerateNext={(type) => {
                            toast.success(`Prompt para ${type} generado.`);
                        }}
                    />
                </div>

                {/* Main Results Area */}
                <div className="col-span-12 lg:col-span-8 xl:col-span-9 space-y-6">
                    <CreativeFactoryPanel
                        productId={selectedProductId}
                        productName={productName}
                    />

                    {!concepts.length && !isGenerating ? (
                        <div className="h-[500px] border-2 border-dashed border-slate-200 rounded-lg bg-slate-50/50 flex flex-col items-center justify-center relative overflow-hidden">
                            <div className="relative text-center space-y-4">
                                <div className="h-20 w-20 bg-white rounded-lg mx-auto flex items-center justify-center shadow-sm border border-slate-100 animate-bounce-slow">
                                    <ImageIcon className="h-10 w-10 text-yellow-700/20" />
                                </div>
                                <h3 className="text-lg font-black text-slate-950 uppercase italic tracking-tighter">Visual Intelligence Hub</h3>
                                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] max-w-[300px] mx-auto leading-relaxed">Nano Banana diseña creativos estáticos que pulverizan el CTR promedio.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
                            {concepts.map((concept, idx) => (
                                <Card key={idx} className="bg-white border-slate-200 rounded-lg overflow-hidden group hover:border-yellow-200 transition-all duration-500 shadow-sm flex flex-col">
                                    <div className="aspect-[4/5] bg-slate-100 relative overflow-hidden group-hover:bg-slate-200 transition-colors">
                                        <div className="absolute inset-0 flex items-center justify-center opacity-10">
                                            <ImageIcon className="h-24 w-24" />
                                        </div>

                                        <div className="absolute top-4 left-4 flex flex-col gap-2">
                                            <Badge className="bg-yellow-500 text-black font-black uppercase text-[10px] w-fit rounded-sm">Concepto {idx + 1}</Badge>
                                            <Badge className="bg-black/80 text-white font-black uppercase text-[9px] w-fit tracking-widest rounded-sm">{concept.angle}</Badge>
                                        </div>

                                        <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-white via-white/80 to-transparent">
                                            <h4 className="text-lg font-black text-slate-950 uppercase italic tracking-tighter leading-tight">{concept.headline}</h4>
                                        </div>
                                    </div>

                                    <CardContent className="p-4 space-y-4 flex-1 flex flex-col">
                                        <div className="space-y-4 flex-1">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black uppercase text-yellow-600 tracking-widest">Hook Visual</p>
                                                <p className="text-sm font-bold text-slate-600 leading-relaxed">{concept.hook}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black uppercase text-yellow-600 tracking-widest">Micro Copy</p>
                                                <p className="text-sm text-slate-600 font-medium italic border-l-2 border-yellow-200 pl-4 py-2">"{concept.copy}"</p>
                                            </div>
                                        </div>

                                        <div className="pt-6 border-t border-slate-100 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                                    <Sparkles className="h-3 w-3 text-yellow-500" /> Image Prompt Engineer
                                                </p>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 text-[9px] font-black uppercase tracking-widest hover:bg-yellow-50 text-yellow-600"
                                                    onClick={() => copyToClipboard(concept.prompt, "Midjourney Prompt")}
                                                >
                                                    <CopyIcon className="h-3 w-3 mr-2" /> Copiar Prompt
                                                </Button>
                                            </div>
                                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 font-mono text-[10px] text-slate-500 leading-relaxed break-words">
                                                {concept.prompt}
                                            </div>

                                            <div className="grid grid-cols-3 gap-2">
                                                <FormatSelector icon={Square} label="1:1 Post" />
                                                <FormatSelector icon={Smartphone} label="9:16 Story" />
                                                <FormatSelector icon={Monitor} label="4:5 Feed" />
                                            </div>

                                            <Button className="w-full h-12 bg-slate-950 text-white font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 mt-2">
                                                <Zap className="h-4 w-4 text-yellow-500" /> Nano Agent: Generate Ads
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function FormatSelector({ icon: Icon, label }: any) {
    return (
        <Button variant="outline" className="flex flex-col h-16 rounded-lg border-slate-100 bg-white hover:border-yellow-200 hover:bg-yellow-50 transition-all gap-1 group">
            <Icon className="h-4 w-4 text-slate-400 group-hover:text-yellow-600 transition-colors" />
            <span className="text-[8px] font-black uppercase tracking-tighter text-slate-500 group-hover:text-slate-900">{label}</span>
        </Button>
    );
}
