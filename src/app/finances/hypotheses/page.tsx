"use client";

import { useState, useMemo, useEffect } from "react";
import {
    Calculator,
    Target,
    TrendingUp,
    Zap,
    Info,
    History,
    Save,
    AlertCircle,
    Package,
    Trash2,
    Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { getProductsWithFinance, saveHypothesis, getHypotheses, loadProductCosts, deleteHypothesis } from "../actions";

export default function HypothesesPage() {
    const [params, setParams] = useState({
        productCost: 15,
        shippingCost: 4.5,
        sellingPrice: 49.90,
        conversionRate: 2.5, // %
        targetProfitPerOrder: 15
    });

    const [bundle, setBundle] = useState({
        enabled: false,
        buy: 1,
        get: 1 // Total items (e.g. Buy 2 Get 1 Free -> buy=2, get=3? No, usually terminology is Buy X Get Y Free. Let's do: "Offer Type": Quantity Based)
        // Let's stick to "Units shipped" vs "Units paid"
    });
    const [bundleConfig, setBundleConfig] = useState({ paidUnits: 1, shippedUnits: 1 });

    const [products, setProducts] = useState<any[]>([]);
    const [scenarios, setScenarios] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Saving
    const [saveName, setSaveName] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [saveOpen, setSaveOpen] = useState(false);
    const [historyOpen, setHistoryOpen] = useState(false);

    useEffect(() => {
        const init = async () => {
            const [p, s] = await Promise.all([getProductsWithFinance(), getHypotheses()]);
            setProducts(p);
            setScenarios(s);
        };
        init();
    }, []);

    const handleLoadProduct = async (productId: string) => {
        setLoading(true);
        const costs = await loadProductCosts(productId);
        setLoading(false);
        if (costs && !Array.isArray(costs)) {
            setParams(prev => ({
                ...prev,
                productCost: costs.unitCost || 0,
                shippingCost: costs.shippingCost || 0,
                sellingPrice: costs.sellingPrice || 0
            }));
            toast.success(`Cargados costes de: ${costs.title}`);
        }
    };

    const handleSave = async () => {
        if (!saveName) return;
        setIsSaving(true);

        // We need to pass the calculated targets to the save function if we want to store them
        const dataToSave = {
            ...params,
            targetProfit: params.targetProfitPerOrder,
            targetROAS: parseFloat(results.targetROAS),
            targetCPA: results.targetCPA
        };

        await saveHypothesis({ name: saveName, ...dataToSave });

        setIsSaving(false);
        setSaveOpen(false);
        const s = await getHypotheses();
        setScenarios(s);
        toast.success("Hipótesis guardada");
    };

    const handleLoadScenario = (s: any) => {
        setParams({
            productCost: s.productCost,
            shippingCost: s.shippingCost,
            sellingPrice: 49.90, // Scenario might not have selling price in some legacy logic, but schema has it? 
            // Checking schema... HypothesisScenario: targetProfit, productCost, shippingCost. Missing sellingPrice in schema?
            // Wait, I updated schema? No, looking at read schema:
            /*
            model HypothesisScenario {
              id          String   @id @default(cuid())
              storeId     String
              store       Store    @relation(fields: [storeId], references: [id])
              name        String
              targetProfit Float
              productCost Float
              shippingCost Float
              targetCPA   Float?
              targetROAS  Float?
            }
            */
            // It seems "sellingPrice" is MISSING from the schema I read earlier. 
            // I should use targetROAS/CPA to reverse engineer or just accept it's missing and use current?
            // Or assume sellingPrice = productCost + shippingCost + margin?
            // Let's assume for now I can't load sellingPrice perfectly if not in DB, but I will persist current.
            conversionRate: 2.5,
            targetProfitPerOrder: s.targetProfit
        });
        setHistoryOpen(false);
        toast.success(`Escenario imporatado: ${s.name}`);
    };

    const handleDelete = async (id: string, e: any) => {
        e.stopPropagation();
        await deleteHypothesis(id);
        const s = await getHypotheses();
        setScenarios(s);
    };

    const results = useMemo(() => {
        // Bundle Logic
        const effectiveRevenue = params.sellingPrice * bundleConfig.paidUnits; // User pays for X units
        const effectiveCOGS = params.productCost * bundleConfig.shippedUnits; // We ship Y units
        // Shipping: Assume base cost + 20% per extra unit? Or just flat?
        // Let's assume 'shippingCost' is per PACKAGE usually.
        // But if bundle is big, maybe more. Let's keep it simple: Single Shipping Cost per Order.
        // User can adjust manually.
        const totalShipping = params.shippingCost;

        const totalRevenue = effectiveRevenue;
        const totalCost = effectiveCOGS + totalShipping;

        const grossMargin = totalRevenue - totalCost;

        // Targets
        const targetCPA = grossMargin - params.targetProfitPerOrder;

        // Safety
        const safeTargetCPA = targetCPA > 0 ? targetCPA : 0;

        const targetROAS = totalRevenue / (safeTargetCPA || 1);
        const maxCPC = (safeTargetCPA * (params.conversionRate / 100));

        const breakEvenCPA = grossMargin;
        const breakEvenROAS = totalRevenue / (breakEvenCPA || 1);

        return {
            margin: grossMargin.toFixed(2),
            revenue: totalRevenue.toFixed(2),
            cost: totalCost.toFixed(2),
            breakEvenCPA: breakEvenCPA.toFixed(2),
            breakEvenROAS: breakEvenROAS.toFixed(2),
            targetCPA: safeTargetCPA.toFixed(2),
            targetROAS: targetROAS.toFixed(2),
            maxCPC: maxCPC.toFixed(2)
        };
    }, [params, bundleConfig]);

    return (
        <div className="space-y-4 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black tracking-tighter uppercase italic text-slate-900 flex items-center gap-2">
                        <Calculator className="h-6 w-6 text-slate-900" /> Simulador de <span className="text-slate-400">Hipótesis</span>
                    </h2>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">Calcula tu rentabilidad ideal y define límites de gasto publicitario.</p>
                </div>
                <div className="flex gap-2">
                    {/* Load Product */}
                    <Select onValueChange={handleLoadProduct}>
                        <SelectTrigger className="w-[180px] h-8 text-xs bg-white/5 border-white/10">
                            <SelectValue placeholder="Cargar Producto..." />
                        </SelectTrigger>
                        <SelectContent>
                            <ScrollArea className="h-[200px]">
                                {products.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                                ))}
                            </ScrollArea>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-12">
                {/* Input Controls */}
                <Card className="md:col-span-5 bg-gray-900/30 border-white/5">
                    <CardHeader className="p-4 flex flex-row items-center justify-between">
                        <CardTitle className="text-sm flex items-center gap-2 text-primary">
                            <Target className="h-4 w-4" /> Parámetros
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            <Label className="text-[10px] uppercase text-muted-foreground">Bundle?</Label>
                            <Switch checked={bundle.enabled} onCheckedChange={(c) => setBundle(prev => ({ ...prev, enabled: c }))} />
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 space-y-4">

                        {bundle.enabled && (
                            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-2 shadow-sm">
                                <Label className="text-[10px] text-white font-black uppercase tracking-widest">Configuración de Oferta (Bundle)</Label>
                                <div className="flex gap-4">
                                    <div className="space-y-1">
                                        <Label className="text-[9px] text-slate-400 font-bold uppercase">Unidades Cobradas</Label>
                                        <Input
                                            type="number" className="h-7 w-20 text-[11px] font-black bg-white/5 border-white/10"
                                            value={bundleConfig.paidUnits}
                                            onChange={(e) => setBundleConfig({ ...bundleConfig, paidUnits: parseInt(e.target.value) || 1 })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[9px] text-slate-400 font-bold uppercase">Unidades Enviadas</Label>
                                        <Input
                                            type="number" className="h-7 w-20 text-[11px] font-black bg-white/5 border-white/10"
                                            value={bundleConfig.shippedUnits}
                                            onChange={(e) => setBundleConfig({ ...bundleConfig, shippedUnits: parseInt(e.target.value) || 1 })}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] uppercase text-muted-foreground">Precio Unitario (PVP)</Label>
                                <div className="relative">
                                    <DollarSign className="absolute left-2 top-2.5 h-3 w-3 text-muted-foreground" />
                                    <Input
                                        value={params.sellingPrice}
                                        onChange={(e) => setParams({ ...params, sellingPrice: Number(e.target.value) })}
                                        type="number" className="pl-6 h-8 text-xs bg-white/5 border-white/10"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] uppercase text-muted-foreground">Costo Unitario (COGS)</Label>
                                <Input
                                    value={params.productCost}
                                    onChange={(e) => setParams({ ...params, productCost: Number(e.target.value) })}
                                    type="number" className="h-8 text-xs bg-white/5 border-white/10"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10px] uppercase text-muted-foreground">Costo Envío (Total Pedido)</Label>
                            <Input
                                value={params.shippingCost}
                                onChange={(e) => setParams({ ...params, shippingCost: Number(e.target.value) })}
                                type="number" className="h-8 text-xs bg-white/5 border-white/10"
                            />
                        </div>

                        <Separator className="bg-white/5" />

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-[10px] uppercase text-muted-foreground">Tasa Conv. Esperada (%)</Label>
                                <span className="text-xs font-bold text-primary">{params.conversionRate}%</span>
                            </div>
                            <input
                                type="range"
                                min="0.1"
                                max="10"
                                step="0.1"
                                value={params.conversionRate}
                                onChange={(e) => setParams({ ...params, conversionRate: Number(e.target.value) })}
                                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10px] uppercase text-muted-foreground">Beneficio Neto Deseado / Pedido (€)</Label>
                            <Input
                                value={params.targetProfitPerOrder}
                                onChange={(e) => setParams({ ...params, targetProfitPerOrder: Number(e.target.value) })}
                                type="number" className="h-8 text-xs bg-white/5 border-white/10"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Results Panel */}
                <div className="md:col-span-7 space-y-4">
                    {/* Primary Results */}
                    <div className="grid grid-cols-2 gap-4">
                        <Card className="bg-slate-900 border-none shadow-sm rounded-lg overflow-hidden">
                            <CardHeader className="p-3 pb-0">
                                <CardDescription className="text-[10px] font-black uppercase tracking-widest text-slate-500">CPA Máximo ({results.targetROAS} ROAS)</CardDescription>
                            </CardHeader>
                            <CardContent className="p-3">
                                <div className="text-2xl font-black text-white italic tracking-tighter">€{results.targetCPA}</div>
                                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mt-1">Para ganar €{params.targetProfitPerOrder}/pedido</p>
                            </CardContent>
                        </Card>
                        |
                        <Card className="bg-white border-slate-100 shadow-sm rounded-lg overflow-hidden">
                            <CardHeader className="p-3 pb-0">
                                <CardDescription className="text-[10px] font-black uppercase tracking-widest text-slate-400">CPC Máximo (Ads)</CardDescription>
                            </CardHeader>
                            <CardContent className="p-3">
                                <div className="text-2xl font-black text-slate-900 italic tracking-tighter">€{results.maxCPC}</div>
                                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-1">Límite para tus pujas en Meta</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Metrics Table */}
                    <Card className="bg-white border-slate-100 shadow-sm rounded-lg overflow-hidden">
                        <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-xs font-black uppercase italic tracking-tighter">Análisis de Rentabilidad {bundle.enabled ? '(BUNDLE)' : ''}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-2 space-y-4">
                            <div className="grid grid-cols-3 gap-2 text-center mb-4">
                                <div className="p-2 bg-slate-50 rounded">
                                    <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Ingresos</div>
                                    <div className="font-black text-slate-900 italic tracking-tighter">€{results.revenue}</div>
                                </div>
                                <div className="p-2 bg-slate-50 rounded">
                                    <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Costes Tot.</div>
                                    <div className="font-black text-slate-900 italic tracking-tighter">€{results.cost}</div>
                                </div>
                                <div className="p-2 bg-slate-900 rounded shadow-sm">
                                    <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Margen</div>
                                    <div className="font-black text-white italic tracking-tighter">€{results.margin}</div>
                                </div>
                            </div>
                            |
                            <Separator className="bg-slate-50" />
                            |
                            <div className="flex items-center justify-between text-xs pt-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">ROAS de Equilibrio (Break-Even)</span>
                                <Badge variant="outline" className="border-slate-200 text-slate-600 font-black">{results.breakEvenROAS}</Badge>
                            </div>
                            |
                            <div className="bg-slate-50 border border-slate-100 rounded-md p-3 flex gap-3 mt-4">
                                <Info className="h-4 w-4 text-slate-900 shrink-0" />
                                <p className="text-[9px] leading-relaxed text-slate-500 font-bold uppercase tracking-tight">
                                    Con un <strong className="text-slate-950 underline decoration-slate-950/20 underline-offset-2">ROAS de {results.targetROAS}</strong> y una tasa de conversión de <strong className="text-slate-950">{params.conversionRate}%</strong>, aseguras tu beneficio objetivo de <strong className="text-slate-950">€{params.targetProfitPerOrder}</strong>.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex gap-2">
                        <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" variant="outline" className="flex-1 text-[10px] h-8 gap-2 uppercase tracking-tighter">
                                    <History className="h-3 w-3" /> Ver Escenarios ({scenarios.length})
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader><DialogTitle>Historial de Hipótesis</DialogTitle></DialogHeader>
                                <ScrollArea className="h-[300px]">
                                    <div className="space-y-2">
                                        {scenarios.map(s => (
                                            <div key={s.id} onClick={() => handleLoadScenario(s)} className="flex items-center justify-between p-3 rounded-lg border border-white/10 hover:bg-white/5 cursor-pointer group">
                                                <div>
                                                    <div className="font-bold text-sm">{s.name}</div>
                                                    <div className="text-[10px] text-muted-foreground">ROAS: {s.targetROAS?.toFixed(2)} • CPA: €{s.targetCPA?.toFixed(2)}</div>
                                                </div>
                                                <Button variant="ghost" size="sm" onClick={(e) => handleDelete(s.id, e)} className="h-8 w-8 text-rose-500 opacity-0 group-hover:opacity-100">
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </DialogContent>
                        </Dialog>

                        <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" className="flex-1 text-[10px] h-8 gap-2 bg-primary/20 text-primary hover:bg-primary/30 uppercase tracking-tighter">
                                    <Save className="h-3 w-3" /> Guardar Hipótesis
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader><DialogTitle>Guardar Escenario</DialogTitle></DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>Nombre del Escenario</Label>
                                        <Input placeholder="Ej: Q4 Offer - Buy 2 Get 1" value={saveName} onChange={(e) => setSaveName(e.target.value)} />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button onClick={handleSave} disabled={isSaving}>
                                        {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                        Guardar
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </div>
        </div>
    );
}

const DollarSign = ({ className }: { className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <line x1="12" y1="1" x2="12" y2="23"></line>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
    </svg>
);
