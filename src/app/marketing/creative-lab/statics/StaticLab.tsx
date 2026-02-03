"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageIcon, Sparkles, Loader2, ArrowRight, Trash2, Zap, AlertTriangle, CheckCircle2, Globe, ScanSearch } from "lucide-react";
import { toast } from "sonner";
import { generateStaticAds, getStaticProjects, scanLandingFriction } from "./actions";
import BlueprintManager from "../blueprints/BlueprintManager";
import { getBlueprints } from "../blueprints/actions";
import QualityGateUI from "../quality-gate/QualityGateUI";
import { recycleCreative } from "../recycle/actions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RefreshCw } from "lucide-react";

export default function StaticLab({ storeId, products }: { storeId: string, products: any[] }) {
    const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || "");
    const [projects, setProjects] = useState<any[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [url, setUrl] = useState("");
    const [scanResult, setScanResult] = useState<any>(null);
    const [adStyle, setAdStyle] = useState<'DOLOR' | 'DESEO' | 'AUTORIDAD' | 'PRUEBA'>('DESEO');
    const [hasBlueprint, setHasBlueprint] = useState(false);

    useEffect(() => {
        loadProjects();
        checkBlueprint();
    }, [storeId, selectedProductId]);

    const checkBlueprint = async () => {
        if (!selectedProductId) return;
        const bps = await getBlueprints(selectedProductId);
        setHasBlueprint(bps.length > 0);
    };

    const loadProjects = async () => {
        const data = await getStaticProjects(storeId);
        setProjects(data);
    };

    const handleScan = async () => {
        if (!url) return;
        setIsScanning(true);
        try {
            const result = await scanLandingFriction(url);
            setScanResult(result);
            toast.success("Análisis de fricción completado");
        } catch (e: any) {
            toast.error("Error al escanear");
        } finally {
            setIsScanning(false);
        }
    };

    const handleGenerate = async () => {
        if (!selectedProductId) return;
        setIsGenerating(true);
        try {
            await generateStaticAds(storeId, {
                productId: selectedProductId,
                url,
                type: adStyle
            });
            toast.success("Pack de Static Ads generado");
            loadProjects();
        } catch (e: any) {
            toast.error(e.message || "Error al generar");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                        <ImageIcon className="w-6 h-6 text-emerald-600" /> STATIC ADS LAB
                    </h2>
                    <p className="text-slate-500 font-medium text-sm">Convierte ángulos e imágenes en anuncios estáticos ganadores.</p>
                </div>
            </header>

            <div className="space-y-12">
                <BlueprintManager storeId={storeId} productId={selectedProductId} />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left: Configuration & Scanner */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="rounded-[32px] border-slate-200 shadow-sm overflow-hidden">
                            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                                <CardTitle className="text-sm font-black uppercase tracking-tight">Configuración</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400">Producto</label>
                                    <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                                        <SelectTrigger className="rounded-2xl border-slate-200 py-6">
                                            <SelectValue placeholder="Selecciona producto" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {products.map(p => (
                                                <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400">Ángulo Estratégico</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {['DOLOR', 'DESEO', 'AUTORIDAD', 'PRUEBA'].map((type: any) => (
                                            <Button
                                                key={type}
                                                variant={adStyle === type ? 'default' : 'outline'}
                                                onClick={() => setAdStyle(type)}
                                                className={`rounded-xl text-[10px] font-bold py-1 h-10 ${adStyle === type ? 'bg-emerald-600' : 'text-slate-500'}`}
                                            >
                                                {type}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 flex justify-between items-center">
                                        Scan Conversion Friction
                                        <Badge className="bg-amber-100 text-amber-700 border-0 text-[8px]">PRO</Badge>
                                    </label>
                                    <div className="flex gap-2">
                                        <Input
                                            value={url}
                                            onChange={(e) => setUrl(e.target.value)}
                                            placeholder="URL propia o competencia"
                                            className="rounded-xl border-slate-200 text-xs"
                                        />
                                        <Button onClick={handleScan} disabled={isScanning} size="sm" className="bg-slate-900 text-white rounded-xl">
                                            {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanSearch className="w-4 h-4" />}
                                        </Button>
                                    </div>
                                </div>

                                <Button
                                    onClick={handleGenerate}
                                    disabled={isGenerating || !selectedProductId || !hasBlueprint}
                                    className={`w-full ${!hasBlueprint ? 'bg-slate-300' : 'bg-emerald-600 hover:bg-emerald-700'} text-white rounded-2xl py-8 font-black text-lg shadow-lg transition-all`}
                                >
                                    {isGenerating ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : <Sparkles className="w-6 h-6 mr-2" />}
                                    GENERAR PACK STATIC
                                </Button>
                            </CardContent>
                        </Card>

                        {scanResult && (
                            <Card className="rounded-[32px] border-amber-200 bg-amber-50/20 overflow-hidden animate-in slide-in-from-left duration-500">
                                <CardHeader className="p-6 pb-2">
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                                        <CardTitle className="text-sm font-black uppercase text-amber-900">Landing Friction Report</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6 space-y-4">
                                    <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-amber-100">
                                        <span className="text-xs font-bold text-slate-500 uppercase">Conversion Score</span>
                                        <span className={`text-lg font-black ${scanResult.score < 50 ? 'text-red-600' : 'text-emerald-600'}`}>{scanResult.score}/100</span>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black text-amber-700 uppercase">Fricciones detectadas:</p>
                                        {scanResult.frictions?.map((f: string, i: number) => (
                                            <div key={i} className="flex gap-2 items-start text-[11px] font-medium text-slate-700">
                                                <ArrowRight className="w-3 h-3 mt-0.5 text-amber-500 shrink-0" />
                                                {f}
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Right: Project List */}
                    <div className="lg:col-span-2 space-y-6">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2">Anuncios Generados ({projects.length})</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {projects.map((p) => {
                                const strategy = JSON.parse(p.dissectionJson || "{}");
                                const ads = JSON.parse(p.variationsJson || "[]");
                                return (
                                    <Card key={p.id} className="rounded-[40px] border-slate-200 overflow-hidden bg-white hover:shadow-2xl transition-all group">
                                        <div className="aspect-[4/5] bg-slate-100 relative group overflow-hidden">
                                            <div className="absolute inset-0 bg-slate-200 flex items-center justify-center text-slate-400 font-bold italic">
                                                [ STATIC AD PREVIEW ]
                                            </div>
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent p-6 flex flex-col justify-end">
                                                <h4 className="text-white font-black text-lg leading-tight uppercase line-clamp-2">{strategy.headline}</h4>
                                                <p className="text-slate-300 text-xs mt-2 line-clamp-2">{strategy.subheadline}</p>
                                                <div className="mt-4 flex gap-2">
                                                    <Badge className="bg-emerald-500 text-white border-0 font-black text-[9px] uppercase">{strategy.cta}</Badge>
                                                    <Badge className="bg-white/20 text-white backdrop-blur-sm border-0 font-bold text-[9px] uppercase">{p.name.split('-')[1]}</Badge>
                                                </div>
                                            </div>
                                        </div>
                                        <CardContent className="p-6">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.product?.title}</p>
                                                    <p className="text-xs font-black text-slate-800 mt-1">{new Date(p.createdAt).toLocaleDateString()}</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button variant="outline" size="sm" className="rounded-xl h-8 text-[11px] font-black border-slate-200">VER PACK</Button>
                                                    <Button variant="ghost" size="sm" className="rounded-xl h-8 w-8 text-rose-500 hover:bg-rose-50 p-0">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                        <div className="px-6 pb-6 flex gap-2">
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="outline" size="sm" className="flex-1 rounded-xl text-[10px] font-black border-slate-200 hover:bg-slate-50">
                                                        <Zap className="w-3 h-3 mr-1 text-amber-500" /> AUDITAR
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="max-w-2xl bg-[#fcfcfd] rounded-[32px] border-0 p-0 overflow-hidden">
                                                    <div className="p-8">
                                                        <QualityGateUI assetId={p.id} type="IMAGE" initialResults={p.qualityGateResultsJson} />
                                                    </div>
                                                </DialogContent>
                                            </Dialog>

                                            <Button
                                                onClick={async () => {
                                                    const feedback = prompt("¿Qué quieres mejorar? (Opcional)");
                                                    if (feedback !== null) {
                                                        try {
                                                            await recycleCreative(p.id, feedback);
                                                            toast.success("Creativo reciclado");
                                                            loadProjects();
                                                        } catch (e: any) { toast.error(e.message); }
                                                    }
                                                }}
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 rounded-xl text-[10px] font-black border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100"
                                            >
                                                <RefreshCw className="w-3 h-3 mr-1" /> RECICLAR
                                            </Button>
                                        </div>
                                    </Card>
                                );
                            })}

                            {projects.length === 0 && (
                                <div className="col-span-full p-20 text-center border-2 border-dashed border-slate-100 rounded-[40px] bg-slate-50/50">
                                    <ImageIcon className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                                    <p className="text-slate-400 font-medium italic">No hay anuncios generados todavía. Usa el panel de la izquierda para empezar.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
