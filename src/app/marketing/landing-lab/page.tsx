"use client";

import { useState } from "react";
import {
    Layout,
    Upload,
    Sparkles,
    Globe,
    ShoppingCart,
    FileText,
    Layers,
    MousePointer2,
    Check,
    CheckCircle2 as CheckIcon,
    Zap,
    Rocket,
    ExternalLink,
    ChevronRight,
    Search,
    ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    uploadShopifyTheme,
    generateProLayout,
    replicateCompetitorLanding,
    pushToShopify
} from "./actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Brain as BrainIcon, Copy, Info, RefreshCw, Eye, History } from "lucide-react";

// Reuse products from video-lab if needed
import { getProducts } from "../video-lab/actions";
import { useRef } from "react";

export default function LandingLabPage() {
    const [themeConfig, setThemeConfig] = useState<any>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [selectedLayout, setSelectedLayout] = useState<'ADVERTORIAL' | 'LISTICLE' | 'PRODUCT_PAGE' | 'HYBRID'>('ADVERTORIAL');
    const [generatedStructure, setGeneratedStructure] = useState<any[]>([]);
    const [replicateUrl, setReplicateUrl] = useState("");

    // Ahorro Mode States
    const [isPromptCopied, setIsPromptCopied] = useState(false);
    const [isManualModalOpen, setIsManualModalOpen] = useState(false);
    // --- AVATAR TRAINING LOGIC ---
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
    const [avatarUploadProgress, setAvatarUploadProgress] = useState(0);

    const handleAvatarTraining = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('video/')) {
            toast.error("Por favor, sube un archivo de video.");
            return;
        }

        setIsAvatarModalOpen(true);
        setAvatarUploadProgress(0);

        // Simulate upload and processing
        const interval = setInterval(() => {
            setAvatarUploadProgress(prev => {
                if (prev >= 95) {
                    clearInterval(interval);
                    return 95;
                }
                return prev + 5;
            });
        }, 300);

        // Fake backend call delay
        setTimeout(() => {
            clearInterval(interval);
            setAvatarUploadProgress(100);
            setTimeout(() => {
                setIsAvatarModalOpen(false);
                toast.success(`Avatar ${avatarGender} entrenado con éxito. ID: ${Math.random().toString(36).substring(7)}`);
                // Reset input
                if (avatarInputRef.current) avatarInputRef.current.value = "";
            }, 1000);
        }, 4000);
    };
    const [manualResponse, setManualResponse] = useState("");
    const [productName, setProductName] = useState("");

    // Add missing refs and state for avatar logic
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const [avatarGender, setAvatarGender] = useState("Femenino");

    const handleThemeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsScanning(true);
        const formData = new FormData();
        formData.append("theme", file);

        const res = await uploadShopifyTheme(formData);
        if (res.success) {
            setThemeConfig(res);
            toast.success("Tema analizado: " + res.sections.length + " secciones detectadas.");
        }
        setIsScanning(false);
    };

    const handleGenerate = async () => {
        toast.promise(generateProLayout({
            type: selectedLayout,
            productId: "dummy",
            useProSections: true
        }), {
            loading: 'Diseñando estructura de alta conversión...',
            success: (res) => {
                setGeneratedStructure(res.structure);
                return "Layout '" + selectedLayout + "' generado con éxito.";
            },
            error: 'Error al generar layout'
        });
    };

    const copyClaudePrompt = () => {
        if (!productName) {
            toast.error("Introduce el nombre del producto primero.");
            return;
        }

        const prompt = `
            ACTÚA COMO: Copywriter de Respuesta Directa nivel A-List (especialista en landings de alta conversión).
            OBJETIVO: Escribir el copywriting completo para una landing page del tipo "${selectedLayout}".
            PRODUCTO: "${productName}"

            ESTRUCTURA REQUERIDA (JSON format):
            {
                "hero_headline": "Título impactante con el beneficio principal",
                "sub_headline": "Promesa secundaria y eliminación de objeciones",
                "pain_points": ["Dolor 1", "Dolor 2", "Dolor 3"],
                "solution_intro": "Cómo el producto resuelve los problemas anteriores",
                "benefit_bullets": ["Beneficio 1", "Beneficio 2", "Beneficio 3"],
                "cta_text": "Texto del botón de compra"
            }

            INSTRUCCIONES ADICIONALES:
            - Usa un tono persuasivo, emocional y directo.
            - Habla de beneficios, no solo de características.
            - El headline debe detener el scroll (preattention).

            RESPONDE ÚNICAMENTE CON EL JSON.
        `;

        navigator.clipboard.writeText(prompt);
        setIsPromptCopied(true);
        window.open("https://claude.ai/new", "_blank");
        toast.success("Prompt para Claude copiado.");
        setTimeout(() => setIsPromptCopied(false), 3000);
    };

    const handleManualImport = () => {
        if (!manualResponse) return;
        try {
            // Simple parsing of what Claude might return
            let cleaned = manualResponse.replace(/```json/g, "").replace(/```/g, "");
            const data = JSON.parse(cleaned);

            // Map the JSON to our structure
            const newStructure = [
                { id: "h1", type: "HEADER", content: data.hero_headline || "Headline" },
                { id: "v1", type: "AVATAR_VIDEO", avatarId: "host-1", prompt: data.sub_headline || "Subheadline" },
                { id: "b1", type: "PRO_CONVERSION_BLOCK", name: "Beneficios", items: data.benefit_bullets || [] },
                { id: "c1", type: "CTA", content: data.cta_text || "Comprar Ahora" }
            ];

            setGeneratedStructure(newStructure);
            setIsManualModalOpen(false);
            setManualResponse("");
            toast.success("Copywriting importado de Claude.");
        } catch (e) {
            toast.error("Error al parsear el JSON. Asegúrate de copiar solo el código.");
        }
    };

    return (
        <div className="space-y-8 h-full flex flex-col max-w-[1600px] mx-auto p-4 md:p-8 bg-mesh-light min-h-screen">
            {/* HEADER */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter text-slate-900 flex items-center gap-3">
                        <Layout className="h-10 w-10 text-emerald-600 drop-shadow-sm" />
                        <span className="vibrant-gradient-text uppercase italic text-emerald-600">Landing Lab</span>
                    </h1>
                    <p className="text-slate-500 font-bold mt-1 tracking-tight">Diseño de embudos híbridos: Secciones de tu tema + Power-sections IA.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="h-12 border-emerald-200 bg-emerald-50 text-emerald-700 font-black rounded-xl gap-2 hover:bg-emerald-100" onClick={copyClaudePrompt}>
                        {isPromptCopied ? <Check className="h-4 w-4" /> : <BrainIcon className="h-4 w-4" />}
                        Copy para Claude (Ahorro)
                    </Button>
                    <Button variant="outline" className="h-12 border-blue-200 bg-blue-50 text-blue-700 font-black rounded-xl gap-2 hover:bg-blue-100" onClick={() => setIsManualModalOpen(true)}>
                        <Upload className="h-4 w-4" /> Importar Copy
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* LEFT: CONFIGURATION */}
                <div className="lg:col-span-12 xl:col-span-4 flex flex-col gap-6">
                    <Tabs defaultValue="creador" className="w-full">
                        <TabsList className="bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200 h-14 mb-6 shadow-inner gap-2">
                            <TabsTrigger value="config" className="flex-1 h-11 rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-xl transition-all">
                                <Upload className="h-4 w-4 mr-2" /> TEMA
                            </TabsTrigger>
                            <TabsTrigger value="creador" className="flex-1 h-11 rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-xl transition-all">
                                <Zap className="h-4 w-4 mr-2" /> CREADOR
                            </TabsTrigger>
                            <TabsTrigger value="replicador" className="flex-1 h-11 rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-xl transition-all">
                                <Globe className="h-4 w-4 mr-2" /> REPLICA
                            </TabsTrigger>
                        </TabsList>

                        <div className="mt-2 space-y-6">
                            <TabsContent value="config" className="animate-in fade-in zoom-in-95 duration-300">
                                <Card className="premium-card border-none shadow-xl bg-white/80 backdrop-blur-xl">
                                    <CardHeader>
                                        <CardTitle className="text-lg font-black italic flex items-center gap-2 text-slate-900">
                                            <Upload className="h-5 w-5 text-indigo-500" /> Sincronizar Tema
                                        </CardTitle>
                                        <CardDescription className="text-[10px] font-black uppercase tracking-widest text-slate-400">Shopify Theme Intelligence</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className={cn(
                                            "border-2 border-dashed rounded-[2rem] p-10 flex flex-col items-center justify-center transition-all cursor-pointer relative group",
                                            themeConfig ? "border-emerald-200 bg-emerald-50/20" : "border-slate-100 bg-slate-50 hover:border-indigo-200 hover:bg-white"
                                        )}>
                                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleThemeUpload} accept=".zip" />
                                            <div className="h-16 w-16 bg-white rounded-2xl shadow-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                                {isScanning ? (
                                                    <Sparkles className="h-8 w-8 text-indigo-500 animate-spin" />
                                                ) : themeConfig ? (
                                                    <Check className="h-8 w-8 text-emerald-500" />
                                                ) : (
                                                    <Upload className="h-8 w-8 text-slate-300" />
                                                )}
                                            </div>
                                            <span className="text-xs font-black uppercase tracking-tighter text-slate-900">
                                                {isScanning ? "Escaneando Liquid..." : themeConfig ? "Tema Activo & Listo" : "Subir Archivo Theme.zip"}
                                            </span>
                                            <p className="text-[9px] font-bold text-slate-400 mt-1">Sincroniza tus secciones nativas con la IA.</p>
                                        </div>
                                        {themeConfig && (
                                            <div className="space-y-3 animate-in fade-in duration-500">
                                                <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                    <span>Inventario de Secciones</span>
                                                    <Badge className="bg-emerald-100 text-emerald-700 border-none">{themeConfig.sections.length}</Badge>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {themeConfig.sections.map((s: any) => (
                                                        <Badge key={s.id} variant="outline" className="text-[9px] font-bold bg-white border-slate-100 px-3 py-1">{s.name}</Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="creador" className="animate-in fade-in zoom-in-95 duration-300">
                                <Card className="premium-card border-none shadow-xl bg-white/80 backdrop-blur-xl">
                                    <CardHeader>
                                        <CardTitle className="text-lg font-black italic flex items-center gap-2 text-slate-900">
                                            <Zap className="h-5 w-5 text-amber-500" /> Formato de Venta IA
                                        </CardTitle>
                                        <CardDescription className="text-[10px] font-black uppercase tracking-widest text-slate-400">Selecciona tu ángulo maestro</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="space-y-4">
                                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Nombre del Producto</Label>
                                            <Input
                                                placeholder="Ej: Aspiradora Laser 3000..."
                                                value={productName}
                                                onChange={(e) => setProductName(e.target.value)}
                                                className="h-14 bg-slate-50 border-slate-100 font-bold text-sm rounded-2xl px-6 focus:ring-4 focus:ring-emerald-100 transition-all shadow-inner"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <LayoutOption
                                                label="Advertorial"
                                                icon={FileText}
                                                active={selectedLayout === 'ADVERTORIAL'}
                                                onClick={() => setSelectedLayout('ADVERTORIAL')}
                                                desc="Marketing de Contenidos"
                                            />
                                            <LayoutOption
                                                label="Listicle"
                                                icon={Layers}
                                                active={selectedLayout === 'LISTICLE'}
                                                onClick={() => setSelectedLayout('LISTICLE')}
                                                desc="Top 5 Soluciones"
                                            />
                                            <LayoutOption
                                                label="Product Page"
                                                icon={ShoppingCart}
                                                active={selectedLayout === 'PRODUCT_PAGE'}
                                                onClick={() => setSelectedLayout('PRODUCT_PAGE')}
                                                desc="Full Conversion Ads"
                                            />
                                            <LayoutOption
                                                label="Hybrid Lab"
                                                icon={Sparkles}
                                                active={selectedLayout === 'HYBRID'}
                                                onClick={() => setSelectedLayout('HYBRID')}
                                                desc="Algoritmo VEO"
                                            />
                                        </div>
                                        <Button className="w-full h-16 bg-slate-900 hover:bg-emerald-600 text-white font-black rounded-2xl mt-4 shadow-2xl transition-all active:scale-[0.98] uppercase tracking-[0.2em] text-xs" onClick={handleGenerate}>
                                            Sincronizar & Construir Embudo
                                        </Button>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="replicador" className="animate-in fade-in zoom-in-95 duration-300">
                                <Card className="premium-card border-none shadow-xl bg-white/80 backdrop-blur-xl">
                                    <CardHeader>
                                        <CardTitle className="text-lg font-black italic flex items-center gap-2 text-slate-900">
                                            <Globe className="h-5 w-5 text-blue-500" /> Ciber-Replica Estratégica
                                        </CardTitle>
                                        <CardDescription className="text-[10px] font-black uppercase tracking-widest text-slate-400">Reverse engineering de competencia</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="space-y-4">
                                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">URL del Ganador</Label>
                                            <Input
                                                placeholder="https://competitor.com/best-seller..."
                                                className="h-16 bg-slate-50 border-slate-100 font-bold text-sm rounded-2xl px-6 focus:ring-4 focus:ring-blue-100 transition-all shadow-inner"
                                                value={replicateUrl}
                                                onChange={(e) => setReplicateUrl(e.target.value)}
                                            />
                                        </div>
                                        <Button
                                            variant="outline"
                                            className="w-full h-16 border-blue-200 text-blue-700 font-black rounded-2xl hover:bg-blue-50 hover:border-blue-300 shadow-xl shadow-blue-100/20 transition-all uppercase tracking-widest text-xs mb-3"
                                            onClick={async () => {
                                                const promise = replicateCompetitorLanding(replicateUrl);
                                                toast.promise(promise, {
                                                    loading: 'Iniciando escaneo forense de landing...',
                                                    success: (data: any) => {
                                                        // Update the UI with the replication result!
                                                        if (data.success && data.detectedBlocks) {
                                                            // Transform detected blocks into our structure format with more "real" look
                                                            const newStructure = [
                                                                {
                                                                    id: "h1-rep-" + Date.now(),
                                                                    type: "HEADER",
                                                                    content: `[REPLICADO] ${data.suggestedCopy}`,
                                                                    style: "hero-modern"
                                                                },
                                                                {
                                                                    id: "v1-rep-" + Date.now(),
                                                                    type: "AVATAR_VIDEO",
                                                                    avatarId: "host-ia-v2",
                                                                    prompt: "Explicación de beneficios clave basada en análisis semántico."
                                                                },
                                                                {
                                                                    id: "b1-rep-" + Date.now(),
                                                                    type: "PRO_CONVERSION_BLOCK",
                                                                    name: "Prueba Social Dinámica",
                                                                    items: data.detectedBlocks.includes("Prueba Social") ? ["4.9/5 Estrellas", "+10k Clientes"] : ["Garantía 30 Días", "Envío Gratis"]
                                                                },
                                                                {
                                                                    id: "c1-rep-" + Date.now(),
                                                                    type: "CTA",
                                                                    content: "OFERTA REPLICADA: 50% DTO",
                                                                    style: "sticky-bottom"
                                                                }
                                                            ];
                                                            setGeneratedStructure(newStructure);
                                                            return `Estructura clonada: ${data.detectedBlocks.join(", ")}`;
                                                        }
                                                        return 'Análisis completado.';
                                                    },
                                                    error: 'Error en la conexión ciber-réplica'
                                                });
                                            }}
                                        >
                                            <Search className="h-4 w-4 mr-3" /> ANALIZAR ESTRUCTURA MAESTRA
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="w-full h-12 border-slate-900 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 shadow-xl transition-all uppercase tracking-[0.2em] text-[10px]"
                                            onClick={() => window.location.href = "/marketing/ai-bridge"}
                                        >
                                            <BrainIcon className="h-4 w-4 mr-3" /> DEEP MARKETING DISSECTION (NO-API)
                                        </Button>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>

                {/* RIGHT: LIVE PREVIEW & EDITOR */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                    <div className="bg-slate-900 rounded-[2.5rem] p-1.5 shadow-2xl overflow-hidden relative group">
                        <div className="h-10 border-b border-white/5 flex items-center px-6 justify-between bg-black/40">
                            <div className="flex gap-1.5">
                                <div className="h-2.5 w-2.5 rounded-full bg-rose-500/50" />
                                <div className="h-2.5 w-2.5 rounded-full bg-amber-500/50" />
                                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/50" />
                            </div>
                            <div className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                                <Globe className="h-3 w-3 text-slate-500" />
                                <span className="text-[10px] text-slate-400 font-mono tracking-tighter">https://v1.antigravity.ia/preview</span>
                            </div>
                            <div className="flex gap-4">
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-white/40"><MousePointer2 className="h-3.5 w-3.5" /></Button>
                            </div>
                        </div>

                        <ScrollArea className="h-[700px] w-full bg-white relative">
                            {generatedStructure.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center p-20 text-slate-300">
                                    <Sparkles className="h-16 w-16 mb-4 opacity-20" />
                                    <p className="text-sm font-black uppercase tracking-tighter italic">Selecciona un formato para previsualizar el embudo</p>
                                </div>
                            ) : (
                                <div className="space-y-0 relative">
                                    {generatedStructure.map((block, i) => (
                                        <div key={block.id} className="relative group/block border-y border-transparent hover:border-indigo-400/50 transition-all">
                                            {/* Block Controls */}
                                            <div className="absolute right-4 top-4 z-50 opacity-0 group-hover/block:opacity-100 flex gap-1 transition-all">
                                                <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full shadow-lg"><Layers className="h-4 w-4" /></Button>
                                                <Button size="icon" className="h-8 w-8 rounded-full bg-indigo-600 text-white shadow-lg"><Sparkles className="h-4 w-4" /></Button>
                                            </div>

                                            {/* Block Content Rendering (Mocks) */}
                                            {block.type === 'HEADER' && (
                                                <div className="py-20 px-12 text-center bg-slate-50 border-b border-slate-100">
                                                    <h2 className="text-4xl font-black text-slate-900 max-w-2xl mx-auto leading-tight italic">{block.content}</h2>
                                                    <p className="text-slate-500 mt-4 font-bold">Respaldo científico y garantía de 30 días.</p>
                                                </div>
                                            )}
                                            {block.type === 'AVATAR_VIDEO' && (
                                                <div className="py-16 flex justify-center bg-white relative">
                                                    <div className="w-full max-w-lg aspect-video bg-slate-900 rounded-3xl shadow-2xl relative overflow-hidden group/vid">
                                                        <div className="absolute inset-0 flex items-center justify-center flex-col text-white/50">
                                                            <Sparkles className="h-10 w-10 mb-2 animate-pulse" />
                                                            <span className="text-[10px] font-black uppercase tracking-widest">Avatar IA: {block.avatarId}</span>
                                                        </div>
                                                        <div className="absolute bottom-4 left-4 right-4 bg-black/40 backdrop-blur-md p-3 rounded-2xl flex items-center gap-3">
                                                            <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center animate-bounce shadow-lg"><Rocket className="h-4 w-4" /> </div>
                                                            <div className="flex-1">
                                                                <div className="h-1 bg-white/20 w-full rounded-full overflow-hidden">
                                                                    <div className="h-full bg-indigo-400 w-1/4" />
                                                                </div>
                                                                <p className="text-[8px] font-bold mt-1 uppercase text-indigo-200">Video Persuasivo Generado</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            {block.type === 'PRO_CONVERSION_BLOCK' && (
                                                <div className="py-20 px-8 grid grid-cols-2 gap-8 items-center bg-slate-50">
                                                    <div className="space-y-4">
                                                        <Badge className="bg-amber-100 text-amber-700 border-none font-black uppercase text-[10px]">Testimonios Reales</Badge>
                                                        <h3 className="text-3xl font-black italic tracking-tighter text-slate-900">Por qué {block.name} cambiará tu forma de vender.</h3>
                                                        <p className="text-slate-600 font-medium">9/10 clientes reportan un incremento en ventas tras implementar este sistema.</p>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 h-32 flex flex-col justify-between">
                                                            <div className="h-8 w-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 font-black">+40%</div>
                                                            <span className="text-[10px] font-black text-slate-400 uppercase">CTR AVG</span>
                                                        </div>
                                                        <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 h-32 flex flex-col justify-between">
                                                            <div className="h-8 w-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 font-black">24h</div>
                                                            <span className="text-[10px] font-black text-slate-400 uppercase">Sincronización</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            {block.type === 'CTA' && (
                                                <div className="py-24 text-center bg-indigo-600 text-white relative overflow-hidden">
                                                    <div className="absolute inset-0 opacity-10 bg-[url('/grid-white.png')] opacity-20" />
                                                    <div className="relative z-10 px-6">
                                                        <h3 className="text-4xl font-black italic tracking-tighter mb-8">{block.content}</h3>
                                                        <Button className="h-16 px-12 bg-white text-indigo-600 hover:bg-slate-50 font-black text-xl rounded-2xl shadow-2xl shadow-black/10 transition-all hover:scale-105">
                                                            PAGAR Y COMENZAR <ChevronRight className="h-5 w-5 ml-2" />
                                                        </Button>
                                                        <div className="mt-8 flex items-center justify-center gap-6 opacity-60 grayscale group-hover:grayscale-0 transition-all">
                                                            <span className="text-[10px] font-black uppercase tracking-widest border border-white/20 px-3 py-1 rounded-full">Stripe Secure</span>
                                                            <span className="text-[10px] font-black uppercase tracking-widest border border-white/20 px-3 py-1 rounded-full">PayPal Verified</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </div>

                    <div className="flex items-center justify-between bg-white/60 backdrop-blur-md p-4 rounded-[2rem] border border-white shadow-lg">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                                <ShieldCheck className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-xs font-black text-slate-900 uppercase">Estado: Listo para Sincronizar</p>
                                <p className="text-[10px] font-bold text-slate-400 italic">Integración con Shopify API detectada.</p>
                            </div>
                        </div>
                        <Button
                            className="h-12 px-10 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl shadow-xl shadow-slate-200 gap-3"
                            disabled={generatedStructure.length === 0}
                            onClick={() => {
                                toast.promise(pushToShopify({
                                    title: "Landing Frankenstein #" + Date.now(),
                                    handle: "frank-landing-v1",
                                    jsonBody: JSON.stringify(generatedStructure),
                                    type: 'PAGE'
                                }), {
                                    loading: 'Publicando en tu tienda Shopify...',
                                    success: '¡Publicado! Redirigiendo al editor de Shopify...',
                                    error: 'Error en la sincronización'
                                });
                            }}
                        >
                            <Rocket className="h-4 w-4" /> PUSH TO SHOPIFY
                        </Button>
                    </div>
                </div>
            </div>

            {/* Manual Import Modal */}
            <Dialog open={isManualModalOpen} onOpenChange={setIsManualModalOpen}>
                <DialogContent className="bg-white border-none rounded-[2rem] max-w-2xl p-8 shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter text-slate-900 flex items-center gap-3">
                            <BrainIcon className="h-6 w-6 text-emerald-600" /> Sincronización Claude
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 font-bold uppercase tracking-widest text-[9px] pt-1">
                            Pega aquí la respuesta JSON que te dio Claude para tu landing.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-6 space-y-4">
                        <Textarea
                            placeholder="Pega el código JSON aquí..."
                            value={manualResponse}
                            onChange={(e) => setManualResponse(e.target.value)}
                            className="min-h-[300px] bg-slate-50 border-slate-100 rounded-2xl p-6 font-mono text-[11px] leading-relaxed resize-none focus:ring-emerald-500/20"
                        />
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3">
                            <Info className="h-5 w-5 text-blue-600 shrink-0" />
                            <p className="text-[10px] text-blue-800 font-medium leading-relaxed">
                                Tip: Asegúrate de que Claude te devuelva el JSON exactamente como se lo pediste en el prompt maestro.
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            onClick={handleManualImport}
                            disabled={!manualResponse}
                            className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-100"
                        >
                            <CheckIcon className="h-5 w-5 mr-3" />
                            Vincular Copywriting a la Landing
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function LayoutOption({ label, icon: Icon, desc, active, onClick }: any) {
    return (
        <div
            onClick={onClick}
            className={cn(
                "p-4 rounded-2xl border transition-all cursor-pointer group flex flex-col items-center text-center gap-2",
                active
                    ? "bg-indigo-600 border-indigo-500 shadow-lg shadow-indigo-100/50"
                    : "bg-white border-slate-100 hover:bg-slate-50 hover:border-indigo-200"
            )}
        >
            <div className={cn(
                "h-10 w-10 rounded-xl flex items-center justify-center transition-all",
                active ? "bg-white/20 text-white" : "bg-slate-50 text-slate-400 group-hover:text-indigo-600"
            )}>
                <Icon className="h-5 w-5" />
            </div>
            <div>
                <p className={cn("text-[11px] font-black uppercase tracking-tight", active ? "text-white" : "text-slate-900")}>{label}</p>
                <p className={cn("text-[9px] font-bold mt-0.5", active ? "text-indigo-100" : "text-slate-400")}>{desc}</p>
            </div>
        </div>
    );
}

function PlusIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M5 12h14" />
            <path d="M12 5v14" />
        </svg>
    )
}
