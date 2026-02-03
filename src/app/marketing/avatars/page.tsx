"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users as UsersIcon,
    Search as SearchIcon,
    Brain as BrainIcon,
    Target as TargetIcon,
    CheckCircle2 as CheckIcon,
    Sparkles as SparklesIcon,
    TrendingUp as TrendingIcon,
    ShieldAlert as ShieldIcon,
    Download as DownloadIcon,
    Share2 as ShareIcon,
    Package as PackageIcon,
    History as HistoryIcon,
    Globe as GlobeIcon,
    Link2 as LinkIcon,
    Zap as ZapIcon,
    ChevronRight as ChevronIcon,
    SearchCode as SearchCodeIcon,
    Cpu as CpuIcon,
    MessagesSquare as MessagesIcon,
    Eye as EyeIcon,
    BarChart3 as ChartIcon,
    ArrowUpRight as ArrowIcon,
    Upload as UploadIcon,
    Wand2 as WandIcon,
    Crosshair as CrosshairIcon,
    Copy,
    Info,
    RefreshCw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";

import { getProducts, getProductResearch, generateRealAvatarResearch, generateDeepProtocolResearch, saveAvatarResearch } from "./actions";
import { toast } from "sonner";
import { AiCollaborationPanel } from "@/components/marketing/ai-collaboration-panel";

export default function DeepResearchPage() {
    const [searching, setSearching] = useState(false);
    const [progress, setProgress] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");

    // Data State
    const [products, setProducts] = useState<any[]>([]);
    const [selectedProduct, setSelectedProduct] = useState("");
    const [researchData, setResearchData] = useState<any>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [country, setCountry] = useState("");
    const [urls, setUrls] = useState("");
    const [manualResponse, setManualResponse] = useState("");
    const [isManualModalOpen, setIsManualModalOpen] = useState(false);
    const [isPromptCopied, setIsPromptCopied] = useState(false);

    // Initial Load
    useEffect(() => {
        const loadProducts = async () => {
            const res = await getProducts();
            if (res.success && res.data) {
                setProducts(res.data);
            }
        };
        loadProducts();
    }, []);

    // Load existing research when product is selected
    useEffect(() => {
        if (!selectedProduct || selectedProduct === "NEW_PRODUCT") return;

        const loadResearch = async () => {
            const res = await getProductResearch(selectedProduct);
            if (res.success && res.data) {
                setResearchData(res.data);
            } else {
                setResearchData(null);
            }
        };
        loadResearch();
    }, [selectedProduct]);

    const filteredProducts = useMemo(() => {
        return products.filter(p =>
            p.title.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [products, searchQuery]);

    const [useMasterProtocol, setUseMasterProtocol] = useState(false);

    const handleManualImport = async () => {
        if (!manualResponse) return;
        setSearching(true);
        try {
            const cleanAndParse = (text: string) => {
                let cleaned = text.replace(/```json/g, "").replace(/```/g, "");
                const firstBrace = cleaned.indexOf('{');
                const lastBrace = cleaned.lastIndexOf('}');
                if (firstBrace !== -1 && lastBrace !== -1) {
                    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
                }
                return JSON.parse(cleaned);
            };

            const data = cleanAndParse(manualResponse);
            if (data) {
                setResearchData(data);
                setIsManualModalOpen(false);
                setManualResponse("");
                toast.success("Investigación importada correctamente.");
            } else {
                toast.error("El formato pegado no es un JSON válido.");
            }
        } catch (e) {
            toast.error("Error al procesar la respuesta.");
        } finally {
            setSearching(false);
        }
    };

    const copyMasterPrompt = async () => {
        const product = products.find(p => p.id === selectedProduct);
        const productName = product?.title || searchQuery || "Producto Nuevo";
        const prompt = `
            ACTÚA COMO: Eugene Schwartz + Psicólogo Conductual + Media Buyer Experto.
            OBJETIVO: Realizar autopsia psicológica del producto: "${productName}".
            MERCADO: ${country || "Global"}
            URLS DE REFERENCIA: ${urls}

            INSTRUCCIONES:
            1. Analiza Nivel de Consciencia (O1 a O5).
            2. Analiza Sofisticación del mercado.
            3. Extrae 3 Deseos Viscerales y 3 Miedos Paralizantes.
            4. Define el "Mood" del mercado.
            5. Crea 6 Ángulos de venta ganadores.

            RESPONDE ÚNICAMENTE EN ESTE FORMATO JSON (Importante para que mi app lo lea):
             {
                 "levelOfAwareness": "...",
                 "desires": ["...", "...", "..."],
                 "fears": ["...", "...", "..."],
                 "sophistication": "...",
                 "marketMood": "...",
                 "mainDesire": "...",
                 "angles": [
                     { "title": "...", "draft": "...", "type": "..." }
                 ]
             }
        `;
        navigator.clipboard.writeText(prompt);
        setIsPromptCopied(true);
        window.open("https://gemini.google.com/app", "_blank");
        toast.success("Prompt Maestro copiado.");
        setTimeout(() => setIsPromptCopied(false), 3000);
    };

    const startResearch = async () => {
        if (!selectedProduct && !searchQuery) {
            toast.error("Selecciona un producto o introduce un término de búsqueda.");
            return;
        }
        setSearching(true);
        let p = 0;
        const interval = setInterval(() => {
            p += Math.random() * 5;
            if (p > 99) p = 99;
            setProgress(Math.floor(p));
        }, 300);

        try {
            const product = products.find(p => p.id === selectedProduct);
            const productName = product?.title || searchQuery || "Producto Nuevo";
            const effectiveProductId = selectedProduct && selectedProduct !== "NEW_PRODUCT" ? selectedProduct : "manual-" + Date.now();

            let imageBase64 = undefined;
            if (imageFile) {
                imageBase64 = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as string);
                    reader.readAsDataURL(imageFile);
                });
            }

            const res = await generateRealAvatarResearch(effectiveProductId, productName, imageBase64, country, urls.split('\n').filter(u => u.trim()));
            clearInterval(interval);
            setProgress(100);

            if (res.success) {
                setResearchData((res as any).data);
                toast.success("Investigación finalizada.");
            } else {
                toast.error(res.error);
            }
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setSearching(false);
        }
    };

    return (
        <div className="w-full flex flex-col gap-4 selection:bg-blue-100 pt-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-100/50">
                        <BrainIcon className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">Deep Research IQ</h1>
                        <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">Sinfonía de Inteligencia Estratégica & Psicología</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button onClick={startResearch} disabled={searching} className="h-12 bg-blue-700 hover:bg-blue-800 text-white font-black text-xs uppercase px-8 rounded-2xl shadow-xl shadow-blue-100 transition-all active:scale-[0.98]">
                        <ZapIcon className={cn("h-4 w-4 mr-2", searching && "animate-spin")} />
                        {searching ? "Procesando..." : "Direct API (Gemini)"}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-8 items-start">
                <div className="col-span-12 lg:col-span-4 xl:col-span-3 flex flex-col gap-6">
                    <Card className="border border-slate-200 rounded-[2.5rem] flex flex-col overflow-hidden shadow-luxe bg-white relative group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="bg-slate-50 p-6 flex items-center justify-between font-black text-slate-900 border-b border-slate-100">
                            <span className="text-[10px] uppercase tracking-[0.2rem] flex items-center gap-2">
                                <SearchCodeIcon className="h-4 w-4 text-blue-600" /> ENGINE v3.0
                            </span>
                        </div>
                        <CardContent className="p-8 space-y-8">
                            <div className="space-y-6">
                                <Tabs defaultValue="discovery" className="w-full">
                                    <TabsList className="grid grid-cols-2 bg-slate-100 p-1 rounded-2xl h-11 mb-6">
                                        <TabsTrigger value="discovery" className="rounded-xl font-black text-[9px] uppercase">Discubrimiento</TabsTrigger>
                                        <TabsTrigger value="shopify" className="rounded-xl font-black text-[9px] uppercase">Ecom Sync</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="discovery" className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-black uppercase text-slate-500 tracking-wider">¿Qué quieres investigar?</Label>
                                            <Input placeholder="Ej: Aspiradora Laser..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-slate-50 border-slate-200 h-11 text-xs rounded-2xl px-4 font-bold" />
                                        </div>
                                    </TabsContent>
                                    <TabsContent value="shopify" className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-black uppercase text-slate-500 tracking-wider">Base del Análisis</Label>
                                            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                                                <SelectTrigger className="bg-slate-50 border-slate-200 h-11 text-xs rounded-2xl px-4 font-bold">
                                                    <SelectValue placeholder="Seleccionar producto..." />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl border-slate-100 p-1 bg-white">
                                                    {filteredProducts.map(p => (
                                                        <SelectItem key={p.id} value={p.id} className="rounded-md py-2 font-bold text-xs">{p.title}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </TabsContent>
                                </Tabs>

                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase text-slate-500 tracking-wider">País / Mercado</Label>
                                    <div className="relative">
                                        <GlobeIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                        <Input placeholder="España, México..." value={country} onChange={(e) => setCountry(e.target.value)} className="bg-slate-50 border-slate-200 h-11 text-xs rounded-2xl pl-11 font-bold" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase text-slate-500 tracking-wider">Intel Competitivo (URLs)</Label>
                                    <Textarea placeholder="Pega URLs de tus competidores..." value={urls} onChange={(e) => setUrls(e.target.value)} className="bg-slate-50 border-slate-200 min-h-[120px] rounded-2xl p-4 font-mono text-xs leading-relaxed resize-none" />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase text-slate-500 tracking-wider">Referencia Visual (Opcional)</Label>
                                    <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-6 transition-all hover:bg-white hover:border-blue-400 group cursor-pointer relative overflow-hidden h-[100px] flex items-center justify-center">
                                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-20" onChange={(e) => setImageFile(e.target.files?.[0] || null)} accept="image/*" />
                                        <div className="flex flex-col items-center justify-center gap-2 text-center pointer-events-none">
                                            <UploadIcon className="h-6 w-6 text-blue-600" />
                                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-tight">{imageFile ? imageFile.name : "Subir Captura"}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <AiCollaborationPanel
                        productId={selectedProduct || "temp"}
                        productName={products.find(p => p.id === selectedProduct)?.title || searchQuery || "Nuevo Producto"}
                        context={{
                            country,
                            urls: urls.split('\n'),
                            playbookKey: 'MASS_DESIRES'
                        }}
                        onImport={async (data) => {
                            if (data.raw) {
                                // Handle raw text
                                console.log("Raw import", data.raw);
                            } else {
                                const res = await saveAvatarResearch(selectedProduct || "manual-" + Date.now(), data);
                                if (res.success) setResearchData(data);
                            }
                        }}
                        onGenerateNext={(type) => {
                            toast.info(`Generando ${type}... Copia el prompt en el siguiente paso.`);
                        }}
                    />

                    <Button onClick={startResearch} disabled={searching || (!selectedProduct && !searchQuery)} className="w-full h-14 rounded-2xl bg-blue-700 hover:bg-blue-800 text-white font-black text-sm uppercase shadow-2xl">
                        {searching ? "Procesando..." : "Ejecutar Investigación API"}
                    </Button>

                    {searching && (
                        <div className="space-y-2 pt-2">
                            <div className="flex justify-between items-center text-[10px] font-black text-blue-600 uppercase">
                                <span>Analizando...</span>
                                <span>{progress}%</span>
                            </div>
                            <Progress value={progress} className="h-2 bg-slate-100" />
                        </div>
                    )}
                </div>

                <div className="col-span-12 lg:col-span-8 xl:col-span-9 flex flex-col gap-6">
                    {!researchData && !searching ? (
                        <div className="h-[700px] border-2 border-dashed border-slate-200 rounded-[3rem] bg-slate-50/50 flex flex-col items-center justify-center relative overflow-hidden">
                            <div className="relative text-center space-y-4">
                                <div className="h-24 w-24 bg-white rounded-[2rem] mx-auto flex items-center justify-center shadow-2xl border border-slate-100 animate-bounce-slow">
                                    <BrainIcon className="h-12 w-12 text-blue-700/20" />
                                </div>
                                <h3 className="text-xl font-black text-slate-950 uppercase italic tracking-tighter">Entorno de Inteligencia Maestra</h3>
                                <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.3em] max-w-[350px] mx-auto leading-relaxed">Configura los parámetros para diseccionar el mercado.</p>
                            </div>
                        </div>
                    ) : (
                        <Card className="bg-white border-slate-200 rounded-[2.5rem] p-4 flex flex-col shadow-2xl">
                            <Tabs defaultValue="psico" className="w-full flex-1 flex flex-col">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-6">
                                    <TabsList className="bg-slate-100 p-1 rounded-2xl h-12">
                                        <TabsTrigger value="psico" className="rounded-xl px-10 font-black text-[10px] uppercase">Psicología</TabsTrigger>
                                        <TabsTrigger value="angles" className="rounded-xl px-10 font-black text-[10px] uppercase">Ángulos & Copys</TabsTrigger>
                                        <TabsTrigger value="voc" className="rounded-xl px-10 font-black text-[10px] uppercase">Voz del Cliente</TabsTrigger>
                                    </TabsList>
                                    <Badge className="bg-blue-100 text-blue-700 font-black uppercase tracking-widest px-4 h-8 flex items-center gap-2">
                                        <WandIcon className="h-3 w-3" /> ESTRATEGIA OPTIMIZADA
                                    </Badge>
                                </div>

                                <ScrollArea className="flex-1 pr-2">
                                    <TabsContent value="psico" className="space-y-8 mt-0 pb-8">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <MetricBox label="Nivel de Conciencia" value={researchData?.levelOfAwareness || "Solución Consciente"} description="Detección de autopsia emocional." icon={EyeIcon} color="bg-emerald-600" />
                                            <MetricBox label="Sofisticación" value={researchData?.sophistication || "Nivel 3"} description="Nivel de madurez del mercado." icon={ChartIcon} color="bg-blue-700" />
                                            <MetricBox label="Mood de Compra" value={researchData?.marketMood || "Escéptico"} description="Estado psicológico del prospecto." icon={MessagesIcon} color="bg-slate-900" />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <StrategyCard title="Deseos Viscerales" items={researchData?.desires || []} icon={TargetIcon} color="text-emerald-600" bgColor="bg-emerald-50" />
                                            <StrategyCard title="Miedos Paralizantes" items={researchData?.fears || []} icon={ShieldIcon} color="text-rose-600" bgColor="bg-rose-50" />
                                        </div>

                                        <div className="bg-white rounded-[2.5rem] p-10 relative overflow-hidden border border-blue-100 shadow-premium">
                                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                                <CrosshairIcon className="h-40 w-40 text-blue-600" />
                                            </div>
                                            <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                                                <div className="flex-1 space-y-4">
                                                    <Badge className="bg-blue-600 text-white font-black uppercase text-[10px] tracking-widest px-4 h-7 items-center flex w-fit">DIAGNÓSTICO MAESTRO</Badge>
                                                    <h3 className="text-3xl font-black text-slate-900 italic tracking-tighter leading-tight">
                                                        "{researchData?.mainDesire || "Análisis en pausa. Utiliza el modo manual si es necesario."}"
                                                    </h3>
                                                    <p className="text-slate-600 font-bold text-sm leading-relaxed pb-4">Este informe disecciona las capas de psicología conductual para un impacto directo en conversiones.</p>
                                                    <div className="flex gap-4">
                                                        <Button className="h-12 bg-blue-600 text-white font-black uppercase text-[10px] tracking-widest px-8 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-100">Crear Avatares</Button>
                                                        <Button variant="outline" className="h-12 border-slate-200 text-slate-600 font-black uppercase text-[10px] tracking-widest px-8 rounded-xl hover:bg-slate-50">Exportar</Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="angles" className="space-y-8 pb-8">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {(researchData?.angles || []).map((angle: any, i: number) => (
                                                <AngleCard key={i} angle={angle} index={i} />
                                            ))}
                                        </div>
                                    </TabsContent>
                                </ScrollArea>
                            </Tabs>
                        </Card>
                    )}
                </div>
            </div>

            <Dialog open={isManualModalOpen} onOpenChange={setIsManualModalOpen}>
                <DialogContent className="bg-white border-none rounded-[2rem] max-w-2xl p-8 shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter text-slate-900 flex items-center gap-3">
                            <BrainIcon className="h-6 w-6 text-emerald-600" /> Sincronización Manual
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 font-bold uppercase tracking-widest text-[9px] pt-1">Pega la respuesta JSON de Gemini para sincronizar gratis.</DialogDescription>
                    </DialogHeader>

                    <div className="py-6 space-y-4">
                        <Textarea placeholder="Pega el código JSON aquí..." value={manualResponse} onChange={(e) => setManualResponse(e.target.value)} className="min-h-[300px] bg-slate-50 border-slate-100 rounded-2xl p-6 font-mono text-[11px] leading-relaxed resize-none" />
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3 text-blue-800 text-[10px] font-medium leading-relaxed">
                            <Info className="h-5 w-5 text-blue-600 shrink-0" />
                            <p>Tip: Pide a Gemini que responda estrictamente en el formato JSON proporcionado.</p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button onClick={handleManualImport} disabled={!manualResponse || searching} className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl">
                            {searching ? <RefreshCw className="h-5 w-5 animate-spin mr-3" /> : <CheckIcon className="h-5 w-5 mr-3" />}
                            Vincular Investigación
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function MetricBox({ label, value, description, icon: Icon, color }: any) {
    return (
        <Card className="bg-white border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
            <div className={cn("absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-5 group-hover:opacity-10 transition-opacity", color)} />
            <div className="space-y-4 relative z-10">
                <div className={cn("h-10 w-10 flex items-center justify-center rounded-2xl text-white shadow-xl", color)}>
                    <Icon className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
                    <h4 className="text-2xl font-black text-slate-900 tracking-tighter leading-none">{value}</h4>
                </div>
                <p className="text-[10px] font-bold text-slate-500 leading-tight">{description}</p>
            </div>
        </Card>
    );
}

function StrategyCard({ title, items, icon: Icon, color, bgColor }: any) {
    return (
        <Card className="bg-white border-slate-100 rounded-[2rem] p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
                <div className={cn("p-3 rounded-2xl", bgColor)}>
                    <Icon className={cn("h-6 w-6", color)} />
                </div>
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">{title}</h4>
            </div>
            <ul className="space-y-4">
                {items.length > 0 ? items.map((item: string, i: number) => (
                    <li key={i} className="flex items-start gap-4">
                        <div className={cn("h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5", bgColor)}>
                            <div className={cn("h-2 w-2 rounded-full", color)} />
                        </div>
                        <span className="text-sm font-bold text-slate-700 leading-snug">{item}</span>
                    </li>
                )) : (
                    <li className="text-slate-300 font-bold uppercase text-[10px] tracking-widest italic py-4">No hay datos detectados.</li>
                )}
            </ul>
        </Card>
    );
}

function AngleCard({ angle, index }: any) {
    const icons = [SparklesIcon, TargetIcon, ZapIcon, GlobeIcon, UsersIcon, BrainIcon];
    const colors = ["bg-blue-600", "bg-emerald-600", "bg-amber-600", "bg-rose-600", "bg-indigo-600", "bg-slate-900"];
    const Icon = icons[index % icons.length];
    const color = colors[index % colors.length];

    return (
        <Card className="bg-white border-slate-100 rounded-[2rem] p-6 shadow-sm hover:shadow-2xl transition-all group border flex flex-col hover:border-blue-200">
            <div className="flex justify-between items-start mb-6">
                <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform", color)}>
                    <Icon className="h-6 w-6" />
                </div>
                <Badge className="bg-slate-50 text-slate-400 font-black text-[10px] uppercase border-none">0{index + 1}</Badge>
            </div>
            <div className="flex-1 space-y-3">
                <h5 className="font-black text-slate-950 text-base uppercase italic tracking-tighter leading-tight">{angle.type || angle.title}</h5>
                <p className="text-slate-500 font-bold text-xs italic leading-relaxed">"{angle.draft || angle.description}"</p>
            </div>
            <div className="pt-6">
                <Button className="w-full h-11 bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest rounded-xl">Crear Avatar</Button>
            </div>
        </Card>
    );
}
