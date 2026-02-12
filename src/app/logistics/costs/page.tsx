"use client";

import { useState, useEffect } from "react";
import {
    Calculator, Truck, Save, Plus, Trash2,
    DollarSign, Percent, AlertCircle, Copy, Link as LinkIcon,
    Package, RefreshCw, Box, AlertTriangle, ArrowRight, Settings2,
    Zap, ShieldCheck, Globe, Info, RotateCcw, Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { updateFulfillmentRule, updateProductFinance, getSupplyChainStats, createFulfillmentRule, deleteFulfillmentRule, setProductProvider, syncShopifyProducts } from "../orders/actions";
import { getProducts } from "../../marketing/maestro/actions";
import { cn } from "@/lib/utils";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function LogisticsFinanceManager() {
    const [rules, setRules] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [baseUrl, setBaseUrl] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectingProvider, setSelectingProvider] = useState<string | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const stats = await getSupplyChainStats();

            if (stats?.error) {
                toast.error("Error servidor: " + stats.error);
                setProducts([]); // Clear to avoid stale data
            } else {
                if (stats?.rules && stats.rules.length > 0) {
                    setRules(stats.rules);
                } else {
                    setRules([{ id: 'default', provider: 'GENERIC', baseShippingCost: 6.5, returnCost: 3.5, packagingCost: 0, handlingCost: 0, taxPercent: 21 }]);
                }

                if (stats?.products) {
                    setProducts(stats.products);
                }
            }
        } catch (error: any) {
            toast.error("Error cargando finanzas: " + error.message);
        }
        setLoading(false);
    };

    useEffect(() => {
        setBaseUrl(window.location.origin);
        loadData();
    }, []);

    const handleUpdateRule = async (ruleId: string, field: string, value: number) => {
        const loadingToast = toast.loading("Sincronizando con base de datos...");
        try {
            const res = await updateFulfillmentRule(ruleId, { [field]: value });
            if (res.success) {
                setRules(prev => prev.map(r => r.id === ruleId ? { ...r, [field]: value } : r));
                toast.success("Parámetro actualizado", { id: loadingToast });
            } else {
                toast.error("Error al guardar", { id: loadingToast });
            }
        } catch (e) {
            toast.error("Error de conexión", { id: loadingToast });
        }
    };

    const handleDeleteRule = async (ruleId: string) => {
        if (!confirm("¿Estás seguro de que deseas eliminar este proveedor?")) return;
        const loadingToast = toast.loading("Eliminando proveedor...");
        try {
            const res = await deleteFulfillmentRule(ruleId);
            if (res.success) {
                setRules(prev => prev.filter(r => r.id !== ruleId));
                toast.success("Proveedor eliminado", { id: loadingToast });
            } else {
                toast.error("Error al eliminar", { id: loadingToast });
            }
        } catch (e) {
            toast.error("Error de conexión", { id: loadingToast });
        }
    };

    const handleUpdateProduct = async (productId: string, field: string, value: number) => {
        const tid = toast.loading("Actualizando...");
        try {
            const res = await updateProductFinance(productId, { [field]: value });
            if (res.success) {
                setProducts(prev => prev.map(p => {
                    if (p.id === productId) {
                        return {
                            ...p,
                            finance: { ...(p.finance || {}), [field]: value }
                        };
                    }
                    return p;
                }));
                toast.success("Coste actualizado", { id: tid });
            } else {
                toast.error("Error al guardar: " + res.message, { id: tid });
            }
        } catch (e: any) {
            toast.error("Error de conexión: " + e.message, { id: tid });
        }
    };

    const providersWebhooks = [
        { name: "Beeping", url: `${baseUrl}/api/webhooks/master-listener`, icon: "🐝" },
        { name: "Dropea", url: `${baseUrl}/api/webhooks/master-listener`, icon: "🚚" },
        { name: "Dropi", url: `${baseUrl}/api/webhooks/master-listener`, icon: "📦" },
    ];

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Cargando Centro de Costes...</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500 bg-slate-50 min-h-screen p-4 md:p-6 lg:p-8 text-slate-900 border-none transition-all">
            {/* PREMIUM HEADER */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-200">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 bg-slate-900 rounded-2xl flex items-center justify-center shadow-2xl shadow-slate-200">
                            <Calculator className="h-6 w-6 text-indigo-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900">
                                Finanzas <span className="text-indigo-600">&</span> Logística
                            </h1>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                Control Unificado de Márgenes Operativos y COGS
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        onClick={async () => {
                            const tid = toast.loading("Sincronizando Shopify...");
                            const res = await syncShopifyProducts();
                            if (res.success) {
                                toast.success(`${res.count} productos sincronizados`, { id: tid });
                                loadData();
                            } else {
                                toast.error(res.message, { id: tid });
                                loadData();
                            }
                        }}
                        variant="outline"
                        className="h-11 px-6 rounded-xl border-slate-200 bg-white shadow-sm font-black uppercase text-[10px] tracking-widest hover:bg-slate-50"
                    >
                        <RefreshCw className="h-4 w-4 mr-2 text-indigo-500" />
                        Regargar Datos (Shopify Sync)
                    </Button>
                </div>
            </header>

            <Tabs defaultValue="logistics" className="space-y-10">
                <TabsList className="bg-slate-200/50 border border-slate-200 p-1.5 h-14 rounded-2xl w-full max-w-[600px] shadow-sm">
                    <TabsTrigger value="logistics" className="flex-1 rounded-xl h-11 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-indigo-600 text-slate-500 transition-all">
                        <Truck className="h-4 w-4 mr-2" /> Reglas de Envío
                    </TabsTrigger>
                    <TabsTrigger value="products" className="flex-1 rounded-xl h-11 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-indigo-600 text-slate-500 transition-all">
                        <Box className="h-4 w-4 mr-2" /> Productos (COGS)
                    </TabsTrigger>
                    <TabsTrigger value="integration" className="flex-1 rounded-xl h-11 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-indigo-600 text-slate-500 transition-all">
                        <Zap className="h-4 w-4 mr-2" /> Integración
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="logistics" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {/* ADD PROVIDER CARD - PREMIUM GLASS STYLE */}
                        <div
                            className="bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem] p-8 flex flex-col items-center justify-center gap-6 group hover:border-indigo-400 hover:bg-indigo-50/30 transition-all cursor-pointer shadow-sm active:scale-[0.98]"
                            onClick={async () => {
                                const name = prompt("Nombre del proveedor logístico (ej: DHL, Correos):");
                                if (name) {
                                    const toastId = toast.loading("Registrando nuevo proveedor...");
                                    const result = await createFulfillmentRule(name);
                                    if (result?.success) {
                                        toast.success(`${name} registrado correctamente`, { id: toastId });
                                        loadData();
                                    } else {
                                        toast.error(result?.message || "Error al crear", { id: toastId });
                                    }
                                }
                            }}
                        >
                            <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100 shadow-inner group-hover:scale-110 group-hover:bg-white transition-all">
                                <Plus className="h-8 w-8 text-indigo-500" />
                            </div>
                            <div className="text-center space-y-2">
                                <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Añadir Proveedor</h3>
                                <p className="text-[10px] font-bold text-slate-400 tracking-wider">CREAR NUEVO PERFIL DE COSTE</p>
                            </div>
                        </div>

                        {/* LIST OF PROVIDERS */}
                        {rules.map((rule) => (
                            <Card key={rule.id} className="bg-white border-none rounded-[2.5rem] shadow-[0_15px_40px_rgba(0,0,0,0.02)] overflow-hidden group hover:shadow-[0_25px_60px_rgba(0,0,0,0.06)] transition-all">
                                <div className="p-8 space-y-8">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 bg-slate-900 rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-slate-200">
                                                {rule.provider === 'BEEPING' ? '🐝' : rule.provider === 'DROPI' ? '📦' : rule.provider === 'AMAZON' ? '☁️' : '🚚'}
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-black uppercase tracking-tighter text-slate-900">{rule.provider}</h3>
                                                <Badge className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-none font-black text-[9px] uppercase px-3 rounded-full">Activo</Badge>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-10 w-10 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                            onClick={() => handleDeleteRule(rule.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                                        <div className="space-y-2">
                                            <Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                                <ArrowRight className="h-3 w-3 text-indigo-500" /> Envío (Out)
                                            </Label>
                                            <div className="relative group/input">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-black text-xs">€</span>
                                                <Input
                                                    type="number" step="0.1"
                                                    defaultValue={rule.baseShippingCost}
                                                    className="pl-8 bg-slate-50/50 border-slate-100 h-10 font-black text-sm rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all border-none"
                                                    onBlur={(e) => handleUpdateRule(rule.id, 'baseShippingCost', parseFloat(e.target.value))}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                                <RotateCcw className="h-3 w-3 text-rose-500" /> Dev (Return)
                                            </Label>
                                            <div className="relative group/input">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-black text-xs">€</span>
                                                <Input
                                                    type="number" step="0.1"
                                                    defaultValue={rule.returnCost}
                                                    className="pl-8 bg-slate-50/50 border-slate-100 h-10 font-black text-sm rounded-xl focus:bg-white focus:ring-4 focus:ring-rose-100 transition-all border-none"
                                                    onBlur={(e) => handleUpdateRule(rule.id, 'returnCost', parseFloat(e.target.value))}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                                <Box className="h-3 w-3" /> Caja/Embalaje
                                            </Label>
                                            <div className="relative group/input">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-black text-xs">€</span>
                                                <Input
                                                    type="number" step="0.01"
                                                    defaultValue={rule.packagingCost || 0}
                                                    className="pl-8 bg-slate-50/50 border-slate-100 h-10 font-black text-sm rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all border-none"
                                                    onBlur={(e) => handleUpdateRule(rule.id, 'packagingCost', parseFloat(e.target.value))}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                                <Info className="h-3 w-3" /> Manipulación
                                            </Label>
                                            <div className="relative group/input">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-black text-xs">€</span>
                                                <Input
                                                    type="number" step="0.01"
                                                    defaultValue={rule.handlingCost || 0}
                                                    className="pl-8 bg-slate-50/50 border-slate-100 h-10 font-black text-sm rounded-xl focus:bg-white focus:ring-4 focus:ring-amber-100 transition-all border-none"
                                                    onBlur={(e) => handleUpdateRule(rule.id, 'handlingCost', parseFloat(e.target.value))}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                                <DollarSign className="h-3 w-3 text-emerald-500" /> COD Fee (Fijo)
                                            </Label>
                                            <div className="relative group/input">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-black text-xs">€</span>
                                                <Input
                                                    type="number" step="0.01"
                                                    defaultValue={rule.codFeeFixed || 0}
                                                    className="pl-8 bg-slate-50/50 border-slate-100 h-10 font-black text-sm rounded-xl focus:bg-white focus:ring-4 focus:ring-emerald-100 transition-all border-none"
                                                    onBlur={(e) => handleUpdateRule(rule.id, 'codFeeFixed', parseFloat(e.target.value))}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                                <Percent className="h-3 w-3 text-emerald-500" /> COD Fee (%)
                                            </Label>
                                            <div className="relative group/input">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-black text-xs">%</span>
                                                <Input
                                                    type="number" step="0.1"
                                                    defaultValue={rule.codFeePercent || 0}
                                                    className="pl-8 bg-slate-50/50 border-slate-100 h-10 font-black text-sm rounded-xl focus:bg-white focus:ring-4 focus:ring-emerald-100 transition-all border-none"
                                                    onBlur={(e) => handleUpdateRule(rule.id, 'codFeePercent', parseFloat(e.target.value))}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-slate-50">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Configuración IVA</span>
                                            <div className="w-24">
                                                <Select
                                                    defaultValue={(rule.taxPercent || 0).toString()}
                                                    onValueChange={(val) => handleUpdateRule(rule.id, 'taxPercent', parseFloat(val))}
                                                >
                                                    <SelectTrigger className="h-8 border-none bg-slate-50 font-black text-[10px] rounded-lg focus:ring-0">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-white border-slate-100 rounded-xl font-bold">
                                                        <SelectItem value="0" className="text-[10px]">Sin IVA (0%)</SelectItem>
                                                        <SelectItem value="18" className="text-[10px]">Malta (18%)</SelectItem>
                                                        <SelectItem value="21" className="text-[10px]">España (21%)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>
                                    {/* NESTED PRODUCTS LIST */}
                                    <div className="mt-8 pt-8 border-t-2 border-dashed border-slate-100">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                                <Package className="h-3 w-3" /> Productos Asociados
                                            </h4>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0 rounded-full hover:bg-slate-100"
                                                onClick={() => {
                                                    setSelectingProvider(rule.provider);
                                                    setSearchQuery("");
                                                }}
                                            >
                                                <Plus className="h-3 w-3 text-indigo-500" />
                                            </Button>
                                        </div>
                                        <div className="space-y-3">
                                            {products.filter(p => {
                                                const prov = (p.inferredProvider || p.supplier?.name || "").toLowerCase();
                                                const ruleProv = rule.provider.toLowerCase();
                                                return prov.includes(ruleProv) || (rule.provider === 'GENERIC' && !prov);
                                            }).map(product => {
                                                const realPrice = product.realAvgPrice || product.finance?.sellingPrice || 0;
                                                const cost = product.finance?.unitCost || 0;

                                                // Margin Calculation: (Price - Cost) - ShippingFull
                                                // Shipping Full = (Base + Packaging + Other) * (1+VAT)
                                                // Note: User asked to "take from provider... VAT if applicable"
                                                const base = rule.baseShippingCost || 0;
                                                const pack = rule.packagingCost || 0;
                                                const hand = rule.handlingCost || 0;
                                                const tax = (rule.taxPercent || 0) / 100;
                                                const codFixed = rule.codFeeFixed || 0;
                                                const codPerc = (rule.codFeePercent || 0) / 100;

                                                const logisticsFull = (base + pack + hand) * (1 + tax);
                                                // Simplified: assume 1 order = COD fee applied
                                                const codCost = codFixed + (realPrice * codPerc);
                                                const margin = realPrice - cost - logisticsFull - codCost;

                                                return (
                                                    <div key={product.id} className="bg-slate-50 rounded-xl p-3 flex items-center gap-3 group/prod hover:bg-indigo-50/50 transition-colors">
                                                        <div className="h-10 w-10 bg-white rounded-lg overflow-hidden border border-slate-200 flex-shrink-0">
                                                            {product.image ? <img src={product.image} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-100" />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[10px] font-black text-slate-700 truncate block max-w-[120px]">{product.title}</span>
                                                                <Badge className={cn("text-[9px] px-1.5 h-5", margin > 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700")}>
                                                                    {margin > 0 ? "+" : ""}€{margin.toFixed(2)}
                                                                </Badge>
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <div className="relative w-20">
                                                                    <Input
                                                                        type="number"
                                                                        step="0.01"
                                                                        defaultValue={cost}
                                                                        className="h-6 text-[10px] font-bold bg-white border-slate-200 px-1 py-0 text-center focus:ring-1 focus:ring-indigo-500"
                                                                        placeholder="Coste"
                                                                        onBlur={(e) => handleUpdateProduct(product.id, 'unitCost', parseFloat(e.target.value))}
                                                                    />
                                                                </div>
                                                                <span className="text-[9px] text-slate-400 font-bold">vs €{realPrice.toFixed(2)} (Avg)</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {products.filter(p => {
                                                const prov = (p.inferredProvider || p.supplier?.name || "").toLowerCase();
                                                const ruleProv = rule.provider.toLowerCase();
                                                return prov.includes(ruleProv) || (rule.provider === 'GENERIC' && !prov);
                                            }).length === 0 && (
                                                    <div className="text-[9px] text-slate-400 font-bold text-center py-2 italic bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
                                                        Sin historial de pedidos con este proveedor
                                                    </div>
                                                )}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="products" className="space-y-4">
                    <div className="bg-white border-none rounded-3xl shadow-[0_15px_40px_rgba(0,0,0,0.02)] overflow-hidden">
                        <div className="p-8 border-b border-slate-50">
                            <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">Coste de Bienes Vendidos (COGS)</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configuración individual por producto para cálculo de rentabilidad</p>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {products.map((product) => (
                                <div key={product.id} className="p-6 flex flex-col md:flex-row items-center gap-8 hover:bg-slate-50/50 transition-colors group">
                                    <div className="h-20 w-20 bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 group-hover:scale-105 transition-transform flex-shrink-0">
                                        {product.image ? (
                                            <img src={product.image} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-slate-900 text-indigo-400 font-black text-[10px]">NO IMG</div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight truncate">{product.title}</h4>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">ID: {product.id.slice(-8)}</p>
                                    </div>
                                    <div className="flex items-center gap-10">
                                        <div className="space-y-1">
                                            <Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Coste Unitario</Label>
                                            <div className="relative w-32">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 font-black text-xs">€</span>
                                                <Input
                                                    type="number" step="0.01"
                                                    defaultValue={product.finance?.unitCost || 0}
                                                    className="pl-7 bg-slate-50/50 border-none font-black text-sm h-10 rounded-xl focus:bg-white"
                                                    onBlur={(e) => handleUpdateProduct(product.id, 'unitCost', parseFloat(e.target.value))}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">PVP Venta</Label>
                                            <div className="relative w-32">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 font-black text-xs">€</span>
                                                <Input
                                                    type="number" step="0.01"
                                                    defaultValue={product.finance?.sellingPrice || product.variants?.[0]?.price || 0}
                                                    className="pl-7 bg-emerald-50/50 border-none font-black text-emerald-600 text-sm h-10 rounded-xl focus:bg-white"
                                                    onBlur={(e) => handleUpdateProduct(product.id, 'sellingPrice', parseFloat(e.target.value))}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">IVA (%)</Label>
                                            <div className="relative w-24">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 font-black text-xs">%</span>
                                                <Input
                                                    type="number" step="1"
                                                    defaultValue={product.finance?.taxes || 0}
                                                    className="pl-7 bg-slate-50/50 border-none font-black text-sm h-10 rounded-xl focus:bg-white"
                                                    onBlur={(e) => handleUpdateProduct(product.id, 'taxes', parseFloat(e.target.value))}
                                                />
                                            </div>
                                        </div>
                                        <div className="hidden lg:flex flex-col items-center justify-center p-4 bg-slate-900 rounded-2xl min-w-[120px]">
                                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Margen</span>
                                            <span className="text-sm font-black text-indigo-400">
                                                €{((product.finance?.sellingPrice || 0) - (product.finance?.unitCost || 0)).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="integration" className="max-w-4xl">
                    <Card className="bg-slate-900 border-none rounded-[2.5rem] overflow-hidden shadow-2xl">
                        <div className="p-10 border-b border-white/5 bg-gradient-to-br from-indigo-900/20 to-transparent">
                            <h3 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-3">
                                <Zap className="h-5 w-5 text-indigo-400" /> Webhooks Maestros
                            </h3>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Conexión directa con Beeping, Dropea y Dropi</p>
                        </div>
                        <div className="p-10 space-y-6">
                            {providersWebhooks.map((p) => (
                                <div key={p.name} className="bg-white/5 rounded-3xl p-6 border border-white/5 flex flex-col md:flex-row items-center gap-6 hover:bg-white/[0.08] transition-all">
                                    <div className="h-14 w-14 bg-white/10 rounded-2xl flex items-center justify-center text-2xl shadow-inner">
                                        {p.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-black text-white uppercase tracking-widest">{p.name} Global Listener</h4>
                                        <div className="mt-2 group relative">
                                            <code className="text-[11px] font-mono text-indigo-300 block bg-black/40 p-3 rounded-xl border border-white/5 truncate max-w-full">
                                                {p.url}
                                            </code>
                                        </div>
                                    </div>
                                    <Button
                                        variant="secondary"
                                        onClick={() => {
                                            navigator.clipboard.writeText(p.url);
                                            toast.success(`${p.name} Webhook copiado`);
                                        }}
                                        className="h-12 px-6 bg-white text-slate-900 hover:bg-indigo-50 font-black uppercase text-[10px] tracking-widest rounded-xl transition-all shadow-xl"
                                    >
                                        <Copy className="h-3.5 w-3.5 mr-2" /> Copiar URL
                                    </Button>
                                </div>
                            ))}
                        </div>
                        <div className="p-8 bg-black/40">
                            <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                <ShieldCheck className="h-4 w-4 text-emerald-500" /> Seguridad SSL Activa
                                <span className="mx-2 opacity-20">•</span>
                                <Globe className="h-4 w-4 text-blue-500" /> Endpoint Multiproveedor v2.1
                            </div>
                        </div>
                    </Card>
                </TabsContent>
            </Tabs >

            {/* PRODUCT SELECTOR DIALOG */}
            <Dialog open={!!selectingProvider} onOpenChange={(open) => !open && setSelectingProvider(null)}>
                <DialogContent className="max-w-xl bg-white p-0 overflow-hidden gap-0 rounded-3xl border-none shadow-2xl">
                    <DialogHeader className="p-6 border-b border-slate-50 bg-slate-50/50">
                        <DialogTitle className="text-lg font-black uppercase text-slate-800 tracking-tight flex items-center gap-2">
                            <Plus className="h-5 w-5 text-indigo-500" />
                            Añadir producto a {selectingProvider} <span className="text-slate-400 ml-2 text-xs">({products.length})</span>
                        </DialogTitle>
                    </DialogHeader>

                    <div className="p-4 bg-white">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                            <Input
                                autoFocus
                                placeholder="Buscar por nombre o SKU..."
                                className="pl-10 h-10 bg-slate-50 border-none font-bold text-slate-700 rounded-xl"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <ScrollArea className="h-[400px] w-full px-4 pb-4">
                        <div className="space-y-2">
                            {products
                                .filter(p => {
                                    const q = searchQuery.toLowerCase();
                                    const title = (p.title || "").toLowerCase();
                                    const sku = (p.sku || "").toLowerCase();
                                    return !q || title.includes(q) || sku.includes(q);
                                })
                                .map(product => {
                                    // Check if already linked to THIS provider to disable/hide?
                                    // User might want to MOVE it, so let's allow "re-linking"
                                    const isLinked = (product.inferredProvider || product.supplier?.name || "") === selectingProvider;

                                    return (
                                        <div
                                            key={product.id}
                                            onClick={async () => {
                                                if (!selectingProvider) return;
                                                const tid = toast.loading(`Asignando a ${selectingProvider}...`);
                                                try {
                                                    console.log("Calling setProductProvider", product.id, selectingProvider);
                                                    const res = await setProductProvider(product.id, selectingProvider);
                                                    console.log("Res:", res);
                                                    if (res.success) {
                                                        toast.success("Producto asignado correctamente", { id: tid });
                                                        loadData();
                                                        setSelectingProvider(null);
                                                    } else {
                                                        toast.error(res.message || "Error al asignar", { id: tid });
                                                    }
                                                } catch (err: any) {
                                                    console.error(err);
                                                    toast.error("Error de red o cliente: " + err.message, { id: tid });
                                                }
                                            }}
                                            className={cn(
                                                "flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all border border-transparent",
                                                isLinked ? "bg-emerald-50 opacity-50 cursor-default" : "hover:bg-indigo-50 hover:border-indigo-100 bg-white border-slate-50"
                                            )}
                                        >
                                            <div className="h-12 w-12 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0 border border-slate-200">
                                                {product.image ? <img src={product.image} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-200" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-xs font-black text-slate-800 truncate">{product.title}</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge variant="secondary" className="text-[9px] h-5 rounded-md text-slate-500 font-bold bg-slate-100">
                                                        {product.sku || "NO SKU"}
                                                    </Badge>
                                                    {(product.supplier?.name || product.inferredProvider) && (
                                                        <span className="text-[9px] text-slate-400 font-bold">
                                                            Actual: {product.inferredProvider || product.supplier?.name}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {isLinked && <Badge className="bg-emerald-500 text-white text-[9px]">YA VINCULADO</Badge>}
                                        </div>
                                    );
                                })}
                            {products.filter(p => {
                                const q = searchQuery.toLowerCase();
                                const title = (p.title || "").toLowerCase();
                                const sku = (p.sku || "").toLowerCase();
                                return !q || title.includes(q) || sku.includes(q);
                            }).length === 0 && (
                                    <div className="text-center py-10 space-y-4">
                                        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">No se encontraron productos</p>
                                        <Button
                                            onClick={async () => {
                                                const tid = toast.loading("Sincronizando Shopify...");
                                                const res = await syncShopifyProducts();
                                                if (res.success) {
                                                    toast.success(`${res.count} productos sincronizados`, { id: tid });
                                                    loadData();
                                                } else {
                                                    toast.error(res.message, { id: tid });
                                                }
                                            }}
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-[10px] tracking-widest h-10 rounded-xl px-6"
                                        >
                                            <RefreshCw className="h-4 w-4 mr-2" />
                                            Sincronizar Shopify
                                        </Button>
                                    </div>
                                )}
                        </div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </div >
    );
}

