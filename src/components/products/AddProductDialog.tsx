import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Brain, Sparkles, Box, Euro, Globe, Languages, Target, UploadCloud, Link as LinkIcon, Trash2, SwitchCamera } from "lucide-react";
import { useProduct } from "@/context/ProductContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";


export function AddProductDialog() {
    const { refreshAllProducts, setProductId } = useProduct();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        title: "",
        category: "",
        imageUrl: "",
        market: "ES",
        language: "es",
        unitCost: "0",
        shippingCost: "0",
        sellingPrice: "0",
        forceTranslation: false
    });

    const [amazonLinks, setAmazonLinks] = useState<string[]>([""]);
    const [competitorLinks, setCompetitorLinks] = useState<string[]>([""]);


    const [metrics, setMetrics] = useState({
        maxCPA: 0,
        beROAS: 0,
        maxCPC: 0
    });

    useEffect(() => {
        const uCost = parseFloat(formData.unitCost) || 0;
        const sCost = parseFloat(formData.shippingCost) || 0;
        const price = parseFloat(formData.sellingPrice) || 0;

        const totalCost = uCost + sCost;
        let cpa = 0;
        let roas = 0;
        let cpc = 0;

        if (price > totalCost) {
            cpa = price - totalCost;
            roas = price / cpa;
            cpc = cpa * 0.05; // Assuming 5% conversion rate
        }

        setMetrics({ maxCPA: cpa, beROAS: roas, maxCPC: cpc });
    }, [formData.unitCost, formData.shippingCost, formData.sellingPrice]);

    const handleAutoPrice = () => {
        const total = (parseFloat(formData.unitCost) || 0) + (parseFloat(formData.shippingCost) || 0);
        if (total > 0) {
            // General ecom rule of thumb: 3x COGS
            setFormData(prev => ({ ...prev, sellingPrice: (total * 3).toFixed(2) }));
            toast.success("Precio sugerido aplicado (Factor x3)");
        } else {
            toast.error("Introduce los costes primero");
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const uploadData = new FormData();
        uploadData.append("file", file);

        try {
            const res = await fetch("/api/upload", {
                method: "POST",
                body: uploadData
            });
            const data = await res.json();
            if (data.success) {
                setFormData(prev => ({ ...prev, imageUrl: data.url }));
                toast.success("Imagen subida");
            } else {
                toast.error("Error al subir imagen");
            }
        } catch (err) {
            toast.error("Error de conexión");
        }
    };

    const handleLinkChange = (setter: React.Dispatch<React.SetStateAction<string[]>>, index: number, value: string) => {
        setter(prev => {
            const next = [...prev];
            next[index] = value;
            return next;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const cleanAmazonLinks = amazonLinks.filter(l => l.trim() !== "");
        const cleanCompetitorLinks = competitorLinks.filter(l => l.trim() !== "");

        try {
            const storeId = localStorage.getItem('activeStoreId') || '';
            const payload = {
                ...formData,
                amazonLinks: cleanAmazonLinks,
                competitorLinks: cleanCompetitorLinks
            };

            const response = await fetch('/api/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Store-Id': storeId
                },
                body: JSON.stringify(payload)

            });

            const data = await response.json();

            if (data.success) {
                toast.success("Producto creado con éxito");
                await refreshAllProducts();
                setProductId(data.product.id);
                setOpen(false);
            } else {
                throw new Error(data.error || "Error al crear");
            }
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="h-9 px-4 bg-slate-900 hover:bg-black text-white rounded-xl shadow-lg border border-slate-700/50 flex items-center gap-2 transition-all">
                    <Plus className="w-4 h-4 text-[#fb7185]" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Añadir Producto</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden bg-slate-50 border-slate-200">
                <DialogHeader className="px-6 py-4 bg-white border-b border-slate-100 flex flex-row items-center justify-between">
                    <div>
                        <DialogTitle className="text-lg font-black uppercase italic tracking-tighter text-slate-900 flex items-center gap-2">
                            <Box className="w-5 h-5 text-[#fb7185]" /> Master <span className="text-[#fb7185] not-italic">Config</span>
                        </DialogTitle>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">
                            Inicialización en Neural DB
                        </p>
                    </div>
                    <div className="bg-indigo-50 border border-indigo-100 text-indigo-600 px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-inner">
                        <Brain className="w-3.5 h-3.5" />
                        <span className="text-[9px] font-black uppercase tracking-widest">IA Sync Ready</span>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column: Core Data */}
                    <div className="space-y-4">
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                                <Target className="w-4 h-4 text-slate-400" />
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Core Info</h3>
                            </div>

                            <div className="space-y-1.5 hover:bg-slate-50 p-2 rounded-xl border border-dashed border-transparent hover:border-slate-200 transition-colors cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-1 cursor-pointer">
                                    <UploadCloud className="w-3 h-3 group-hover:text-indigo-500 transition-colors" /> Base Image / Main Thumbnail
                                </label>
                                <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" />
                                {formData.imageUrl ? (
                                    <div className="relative h-20 w-full rounded-xl overflow-hidden border border-slate-200">
                                        <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-[10px] text-white font-black uppercase tracking-widest">Cambiar</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-20 w-full rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50/50 group-hover:bg-slate-100/50 group-hover:border-indigo-300 transition-all">
                                        <span className="text-[10px] text-slate-400 font-bold">Haz clic para subir imagen principal</span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Nombre</label>
                                <Input required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Ej: Neck Massager Pro" className="h-9 text-xs bg-white border-slate-200 rounded-xl" />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Categoría</label>
                                <Input value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} placeholder="Health & Wellness" className="h-9 text-xs bg-white border-slate-200 rounded-xl" />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-1"><Globe className="w-3 h-3" /> Mercado</label>
                                    <Select value={formData.market} onValueChange={(val) => setFormData({ ...formData, market: val })}>
                                        <SelectTrigger className="h-9 text-xs bg-white border-slate-200 rounded-xl">
                                            <SelectValue placeholder="Seleccionar..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ES">España</SelectItem>
                                            <SelectItem value="US">Estados Unidos</SelectItem>
                                            <SelectItem value="UK">Reino Unido</SelectItem>
                                            <SelectItem value="FR">Francia</SelectItem>
                                            <SelectItem value="DE">Alemania</SelectItem>
                                            <SelectItem value="IT">Italia</SelectItem>
                                            <SelectItem value="MX">México</SelectItem>
                                            <SelectItem value="GLOBAL">Global</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-1"><Languages className="w-3 h-3" /> Idioma Base</label>
                                    <Select value={formData.language} onValueChange={(val) => setFormData({ ...formData, language: val })}>
                                        <SelectTrigger className="h-9 text-xs bg-white border-slate-200 rounded-xl">
                                            <SelectValue placeholder="Seleccionar..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="es">Español</SelectItem>
                                            <SelectItem value="en">Inglés</SelectItem>
                                            <SelectItem value="fr">Francés</SelectItem>
                                            <SelectItem value="de">Alemán</SelectItem>
                                            <SelectItem value="it">Italiano</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="space-y-0.5">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-700 flex items-center gap-1">
                                        <SwitchCamera className="w-3 h-3" /> Auto-Traducción
                                    </div>
                                    <div className="text-[9px] text-slate-500">Forzar traducción de insights al español</div>
                                </div>
                                <Switch checked={formData.forceTranslation} onCheckedChange={(c) => setFormData({ ...formData, forceTranslation: c })} />
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Financials & AI */}
                    <div className="space-y-4">
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                                <Euro className="w-4 h-4 text-emerald-500" />
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Unit Economics</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Coste Ud. (€)</label>
                                    <Input type="number" step="0.01" value={formData.unitCost} onChange={e => setFormData({ ...formData, unitCost: e.target.value })} className="h-9 text-xs bg-white border-slate-200 rounded-xl" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Envío (€)</label>
                                    <Input type="number" step="0.01" value={formData.shippingCost} onChange={e => setFormData({ ...formData, shippingCost: e.target.value })} className="h-9 text-xs bg-white border-slate-200 rounded-xl" />
                                </div>
                            </div>

                            <div className="space-y-1.5 pt-2">
                                <div className="flex items-center justify-between ml-1">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-900">Precio Venta (€)</label>
                                    <button type="button" onClick={handleAutoPrice} className="text-[8px] font-black uppercase tracking-widest text-[#fb7185] flex items-center gap-1 hover:underline">
                                        <Sparkles className="w-3 h-3" /> Auto IA
                                    </button>
                                </div>
                                <Input required type="number" step="0.01" value={formData.sellingPrice} onChange={e => setFormData({ ...formData, sellingPrice: e.target.value })} className="h-10 text-sm font-black bg-rose-50/50 border-[#fb7185]/30 rounded-xl focus-visible:ring-[#fb7185]" />
                            </div>

                            {/* Live AI Metrics */}
                            <div className="grid grid-cols-3 gap-2 pt-3">
                                <div className="bg-white border border-slate-100 p-2 rounded-xl text-center">
                                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">BE ROAS</p>
                                    <p className={cn("text-xs font-black mt-0.5", metrics.beROAS > 0 ? "text-slate-900" : "text-slate-300")}>
                                        {metrics.beROAS > 0 ? `${metrics.beROAS.toFixed(2)}x` : '-'}
                                    </p>
                                </div>
                                <div className="bg-white border border-slate-100 p-2 rounded-xl text-center">
                                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Max CPA</p>
                                    <p className={cn("text-xs font-black mt-0.5", metrics.maxCPA > 0 ? "text-emerald-600" : "text-slate-300")}>
                                        {metrics.maxCPA > 0 ? `€${metrics.maxCPA.toFixed(2)}` : '-'}
                                    </p>
                                </div>
                                <div className="bg-white border border-slate-100 p-2 rounded-xl text-center">
                                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Max CPC</p>
                                    <p className={cn("text-xs font-black mt-0.5", metrics.maxCPC > 0 ? "text-indigo-600" : "text-slate-300")}>
                                        {metrics.maxCPC > 0 ? `€${metrics.maxCPC.toFixed(2)}` : '-'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3 pt-4 border-t border-slate-100">
                            <div className="flex items-center justify-between">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1 font-mono">
                                    <LinkIcon className="w-3.5 h-3.5" /> Enlaces Amazon
                                </h3>
                                <button type="button" onClick={() => setAmazonLinks([...amazonLinks, ""])} className="text-[10px] font-bold text-indigo-500 hover:text-indigo-600">Añadir</button>
                            </div>
                            <div className="space-y-2 max-h-24 overflow-y-auto pr-1 custom-scrollbar">
                                {amazonLinks.map((link, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <Input value={link} onChange={(e) => handleLinkChange(setAmazonLinks, i, e.target.value)} placeholder="https://amazon..." className="h-8 text-[11px] bg-slate-50 border-slate-200 rounded-lg" />
                                        {amazonLinks.length > 1 && (
                                            <button type="button" onClick={() => setAmazonLinks(amazonLinks.filter((_, idx) => idx !== i))} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors bg-white border border-slate-200 rounded-lg">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="flex items-center justify-between pt-2">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1 font-mono">
                                    <LinkIcon className="w-3.5 h-3.5" /> Bibliotecas Competencia
                                </h3>
                                <button type="button" onClick={() => setCompetitorLinks([...competitorLinks, ""])} className="text-[10px] font-bold text-indigo-500 hover:text-indigo-600">Añadir</button>
                            </div>
                            <div className="space-y-2 max-h-24 overflow-y-auto pr-1 custom-scrollbar">
                                {competitorLinks.map((link, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <Input value={link} onChange={(e) => handleLinkChange(setCompetitorLinks, i, e.target.value)} placeholder="https://myshopify..." className="h-8 text-[11px] bg-slate-50 border-slate-200 rounded-lg" />
                                        {competitorLinks.length > 1 && (
                                            <button type="button" onClick={() => setCompetitorLinks(competitorLinks.filter((_, idx) => idx !== i))} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors bg-white border border-slate-200 rounded-lg">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="col-span-full pt-4 mt-2 border-t border-slate-200 flex justify-end gap-3">
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="h-10 px-4 text-[10px] font-black uppercase tracking-widest rounded-xl">Cancelar</Button>
                        <Button type="submit" disabled={loading} className="h-10 px-8 bg-[#fb7185] hover:bg-rose-500 text-white rounded-xl shadow-lg shadow-rose-200 font-black uppercase tracking-widest text-[10px] transition-all">
                            {loading ? "Iniciando..." : "Crear & Iniciar Research"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
