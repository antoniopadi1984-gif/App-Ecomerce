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
import { updateFulfillmentRule, updateProductFinance, getSupplyChainStats, createFulfillmentRule, deleteFulfillmentRule, setProductProvider, syncShopifyProducts } from "@/app/pedidos/actions";
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
        <div className="space-y-4 animate-in fade-in duration-500 bg-white min-h-screen p-3 md:p-4 text-slate-900 border-none transition-all">
            {/* PREMIUM HEADER */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 bg-slate-900 rounded-lg flex items-center justify-center shadow-lg shadow-slate-200">
                            <Calculator className="h-4 w-4 text-indigo-400" />
                        </div>
                        <div>
                            <h1 className="text-sm font-black uppercase tracking-tighter text-slate-900 italic leading-none">
                                Finanzas <span className="text-indigo-600 not-italic ml-1">&</span> Logística <span className="text-blue-500 font-bold not-italic ml-1">v4</span>
                            </h1>
                            <p className="text-[7px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1.5 opacity-80">
                                Control Unificado de Márgenes Operativos y COGS
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
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
                        className="h-8 px-3 rounded-lg border-slate-200 bg-white shadow-xs font-black uppercase text-[8px] tracking-widest hover:bg-slate-50 transition-all"
                    >
                        <RefreshCw className="h-3 w-3 mr-2 text-indigo-500" />
                        Sincronizar Catálogo
                    </Button>
                </div>
            </header>

            <Tabs defaultValue="logistics" className="space-y-6">
                <TabsList className="bg-slate-100/50 border border-slate-200/30 p-1 h-9 rounded-lg w-full max-w-[450px] shadow-xs">
                    <TabsTrigger value="logistics" className="flex-1 rounded-md h-7 text-[8px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-xs text-slate-400 transition-all">
                        <Truck className="h-3 w-3 mr-2" /> Reglas de Envío
                    </TabsTrigger>
                    <TabsTrigger value="products" className="flex-1 rounded-md h-7 text-[8px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-xs text-slate-400 transition-all">
                        <Box className="h-3 w-3 mr-2" /> Productos (COGS)
                    </TabsTrigger>
                    <TabsTrigger value="integration" className="flex-1 rounded-md h-7 text-[8px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-xs text-slate-400 transition-all">
                        <Zap className="h-3 w-3 mr-2" /> Integración
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="logistics" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {/* ADD PROVIDER CARD - PREMIUM GLASS STYLE */}
                        <div
                            className="bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-lg p-6 flex flex-col items-center justify-center gap-4 group hover:border-indigo-400 hover:bg-indigo-50/10 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
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
                            <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center border border-slate-100 shadow-sm group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                <Plus className="h-5 w-5" />
                            </div>
                            <div className="text-center space-y-1">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-900">Añadir Proveedor</h3>
                                <p className="text-[7px] font-black text-slate-400 tracking-[0.2em] uppercase">Registrar Operador</p>
                            </div>
                        </div>

                        {/* LIST OF PROVIDERS */}
                        {rules.map((rule) => (
                            <Card key={rule.id} className="bg-white border border-slate-100 rounded-lg shadow-xs overflow-hidden group hover:shadow-md transition-all">
                                <div className="p-4 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 bg-slate-950 rounded-lg flex items-center justify-center text-sm shadow-lg shadow-slate-200">
                                                {rule.provider === 'BEEPING' ? '🐝' : rule.provider === 'DROPI' ? '📦' : rule.provider === 'AMAZON' ? '☁️' : '🚚'}
                                            </div>
                                            <div>
                                                <h3 className="text-xs font-black uppercase tracking-tight text-slate-900 italic">{rule.provider}</h3>
                                                <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[7px] uppercase px-1.5 h-4 flex items-center rounded-sm">Activo</Badge>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-all"
                                            onClick={() => handleDeleteRule(rule.id)}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                                        <div className="space-y-1.5">
                                            <Label className="text-[7.5px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5">
                                                <ArrowRight className="h-2.5 w-2.5 text-indigo-500" /> Envío (Out)
                                            </Label>
                                            <div className="relative group/input">
                                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-300 font-black text-[10px]">€</span>
                                                <Input
                                                    type="number" step="0.1"
                                                    defaultValue={rule.baseShippingCost}
                                                    className="pl-6 bg-slate-50 border-slate-100 h-8 font-black text-xs rounded-lg focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all shadow-xs"
                                                    onBlur={(e) => handleUpdateRule(rule.id, 'baseShippingCost', parseFloat(e.target.value))}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[7.5px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5">
                                                <RotateCcw className="h-2.5 w-2.5 text-rose-500" /> Dev (Return)
                                            </Label>
                                            <div className="relative group/input">
                                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-300 font-black text-[10px]">€</span>
                                                <Input
                                                    type="number" step="0.1"
                                                    defaultValue={rule.returnCost}
                                                    className="pl-6 bg-slate-50 border-slate-100 h-8 font-black text-xs rounded-lg focus:bg-white focus:ring-4 focus:ring-rose-100 transition-all shadow-xs"
                                                    onBlur={(e) => handleUpdateRule(rule.id, 'returnCost', parseFloat(e.target.value))}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-[7.5px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5">
                                                <Box className="h-2.5 w-2.5" /> Caja
                                            </Label>
                                            <div className="relative group/input">
                                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-300 font-black text-[10px]">€</span>
                                                <Input
                                                    type="number" step="0.01"
                                                    defaultValue={rule.packagingCost || 0}
                                                    className="pl-6 bg-slate-50 border-slate-100 h-8 font-black text-xs rounded-lg focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all shadow-xs"
                                                    onBlur={(e) => handleUpdateRule(rule.id, 'packagingCost', parseFloat(e.target.value))}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[7.5px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5">
                                                <Info className="h-2.5 w-2.5" /> Handling
                                            </Label>
                                            <div className="relative group/input">
                                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-300 font-black text-[10px]">€</span>
                                                <Input
                                                    type="number" step="0.01"
                                                    defaultValue={rule.handlingCost || 0}
                                                    className="pl-6 bg-slate-50 border-slate-100 h-8 font-black text-xs rounded-lg focus:bg-white focus:ring-4 focus:ring-amber-100 transition-all shadow-xs"
                                                    onBlur={(e) => handleUpdateRule(rule.id, 'handlingCost', parseFloat(e.target.value))}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-[7.5px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5">
                                                <DollarSign className="h-2.5 w-2.5 text-emerald-500" /> COD Fee (F)
                                            </Label>
                                            <div className="relative group/input">
                                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-300 font-black text-[10px]">€</span>
                                                <Input
                                                    type="number" step="0.01"
                                                    defaultValue={rule.codFeeFixed || 0}
                                                    className="pl-6 bg-slate-50 border-slate-100 h-8 font-black text-xs rounded-lg focus:bg-white focus:ring-4 focus:ring-emerald-100 transition-all shadow-xs"
                                                    onBlur={(e) => handleUpdateRule(rule.id, 'codFeeFixed', parseFloat(e.target.value))}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[7.5px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5">
                                                <Percent className="h-2.5 w-2.5 text-emerald-500" /> COD Fee (%)
                                            </Label>
                                            <div className="relative group/input">
                                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-300 font-black text-[10px]">%</span>
                                                <Input
                                                    type="number" step="0.1"
                                                    defaultValue={rule.codFeePercent || 0}
                                                    className="pl-6 bg-white border-slate-100 h-8 font-black text-xs rounded-lg focus:bg-white focus:ring-4 focus:ring-emerald-100 transition-all shadow-xs"
                                                    onBlur={(e) => handleUpdateRule(rule.id, 'codFeePercent', parseFloat(e.target.value))}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-3 border-t border-slate-50">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Configuración IVA</span>
                                            <div className="w-20">
                                                <Select
                                                    defaultValue={(rule.taxPercent || 0).toString()}
                                                    onValueChange={(val) => handleUpdateRule(rule.id, 'taxPercent', parseFloat(val))}
                                                >
                                                    <SelectTrigger className="h-7 border border-slate-100 bg-slate-50 font-black text-[9px] rounded-md focus:ring-0 shadow-xs">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-white border-slate-100 rounded-lg font-bold">
                                                        <SelectItem value="0" className="text-[9px]">IVA 0%</SelectItem>
                                                        <SelectItem value="18" className="text-[9px]">Malta 18%</SelectItem>
                                                        <SelectItem value="21" className="text-[9px]">España 21%</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>
                                    {/* NESTED PRODUCTS LIST */}
                                    <div className="mt-4 pt-4 border-t-2 border-dashed border-slate-50">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="text-[8px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                                <Package className="h-2.5 w-2.5" /> Productos Asociados
                                            </h4>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-5 w-5 p-0 rounded-full hover:bg-slate-100"
                                                onClick={() => {
                                                    setSelectingProvider(rule.provider);
                                                    setSearchQuery("");
                                                }}
                                            >
                                                <Plus className="h-3 w-3 text-indigo-500" />
                                            </Button>
                                        </div>
                                        <div className="space-y-2">
                                            {products.filter(p => {
                                                const prov = (p.inferredProvider || p.supplier?.name || "").toLowerCase();
                                                const ruleProv = rule.provider.toLowerCase();
                                                return prov.includes(ruleProv) || (rule.provider === 'GENERIC' && !prov);
                                            }).map(product => {
                                                const realPrice = product.realAvgPrice || product.finance?.sellingPrice || 0;
                                                const cost = product.finance?.unitCost || 0;

                                                const base = rule.baseShippingCost || 0;
                                                const pack = rule.packagingCost || 0;
                                                const hand = rule.handlingCost || 0;
                                                const tax = (rule.taxPercent || 0) / 100;
                                                const codFixed = rule.codFeeFixed || 0;
                                                const codPerc = (rule.codFeePercent || 0) / 100;

                                                const logisticsFull = (base + pack + hand) * (1 + tax);
                                                const codCost = codFixed + (realPrice * codPerc);
                                                const margin = realPrice - cost - logisticsFull - codCost;

                                                return (
                                                    <div key={product.id} className="bg-slate-50/50 rounded-lg p-2 flex items-center gap-2.5 group/prod hover:bg-indigo-50/50 transition-colors border border-transparent hover:border-indigo-100">
                                                        <div className="h-9 w-9 bg-white rounded-md overflow-hidden border border-slate-100 flex-shrink-0 shadow-xs">
                                                            {product.image ? <img src={product.image} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-50" />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[9px] font-black text-slate-800 truncate block max-w-[100px] italic">{product.title}</span>
                                                                <Badge className={cn("text-[7px] px-1 h-3.5 border-none font-black flex items-center", margin > 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600")}>
                                                                    {margin > 0 ? "+" : ""}€{margin.toFixed(1)}
                                                                </Badge>
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <div className="relative w-16">
                                                                    <Input
                                                                        type="number"
                                                                        step="0.01"
                                                                        defaultValue={cost}
                                                                        className="h-5 text-[8px] font-black bg-white border-slate-100 px-1 py-0 text-center focus:ring-1 focus:ring-indigo-500 rounded-sm"
                                                                        placeholder="Coste"
                                                                        onBlur={(e) => handleUpdateProduct(product.id, 'unitCost', parseFloat(e.target.value))}
                                                                    />
                                                                </div>
                                                                <span className="text-[7.5px] text-slate-400 font-bold uppercase tracking-tight">Avg €{realPrice.toFixed(1)}</span>
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

                <TabsContent value="products" className="space-y-3">
                    <div className="bg-white border border-slate-100 rounded-lg shadow-xs overflow-hidden">
                        <div className="p-4 border-b border-slate-50 flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-tight text-slate-900 italic">Coste de Bienes Vendidos (COGS)</h3>
                                <p className="text-[7px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 opacity-80 shadow-none">Gestión Individual de Márgenes por Producto</p>
                            </div>
                            <Badge variant="outline" className="h-5 text-[8px] font-black border-slate-200 text-slate-500 uppercase rounded-sm">Sync: Shopify API</Badge>
                        </div>
                        <div className="divide-y divide-slate-50">
                            {products.map((product) => (
                                <div key={product.id} className="p-4 flex flex-col gap-4 hover:bg-slate-50/30 transition-colors group">
                                    <div className="flex flex-col md:flex-row items-center gap-6">
                                        <div className="h-12 w-12 bg-white rounded-lg overflow-hidden border border-slate-100 group-hover:scale-105 transition-transform flex-shrink-0 shadow-xs">
                                            {product.image ? (
                                                <img src={product.image} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-slate-950 text-indigo-400 font-black text-[8px]">?</div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight truncate italic">{product.title}</h4>
                                            <p className="text-[7px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">SKU: {product.sku || product.id.slice(-8).toUpperCase()}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="space-y-1">
                                                <Label className="text-[7px] font-black uppercase text-slate-400 tracking-widest leading-none">Coste Uni.</Label>
                                                <div className="relative w-20">
                                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-300 font-black text-[10px]">€</span>
                                                    <Input
                                                        type="number" step="0.01"
                                                        defaultValue={product.finance?.unitCost || 0}
                                                        className="pl-5 bg-slate-50 border-slate-100 font-black text-xs h-8 rounded-md focus:bg-white shadow-xs"
                                                        onBlur={(e) => handleUpdateProduct(product.id, 'unitCost', parseFloat(e.target.value))}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-[7px] font-black uppercase text-slate-400 tracking-widest leading-none">PVP Venta</Label>
                                                <div className="relative w-20">
                                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-300 font-black text-[10px]">€</span>
                                                    <Input
                                                        type="number" step="0.01"
                                                        defaultValue={product.finance?.sellingPrice || product.variants?.[0]?.price || 0}
                                                        className="pl-5 bg-emerald-50/30 border-emerald-100 text-emerald-700 font-black text-xs h-8 rounded-md focus:bg-white shadow-xs"
                                                        onBlur={(e) => handleUpdateProduct(product.id, 'sellingPrice', parseFloat(e.target.value))}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-[7px] font-black uppercase text-slate-400 tracking-widest leading-none">IVA %</Label>
                                                <div className="relative w-14">
                                                    <Input
                                                        type="number" step="1"
                                                        defaultValue={product.finance?.taxes || 0}
                                                        className="bg-slate-50 border-slate-100 font-black text-xs h-8 rounded-md focus:bg-white shadow-xs text-center px-1"
                                                        onBlur={(e) => handleUpdateProduct(product.id, 'taxes', parseFloat(e.target.value))}
                                                    />
                                                </div>
                                            </div>
                                            <div className="hidden lg:flex flex-col items-center justify-center p-2 bg-slate-950 rounded-lg min-w-[70px] shadow-lg">
                                                <span className="text-[6px] font-black text-slate-500 uppercase tracking-widest">Margen</span>
                                                <span className="text-[11px] font-black text-indigo-400 italic">
                                                    €{((product.finance?.sellingPrice || 0) - (product.finance?.unitCost || 0)).toFixed(1)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* FULFILLMENT COST LAYER (New Task 6.7) */}
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-3 bg-slate-50/80 rounded-lg border border-slate-100 shadow-inner">
                                        <div className="space-y-1">
                                            <Label className="text-[7.5px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1 leading-none">
                                                <Truck className="h-2.5 w-2.5" /> Envío (Out)
                                            </Label>
                                            <div className="relative">
                                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-300 font-black text-[9px]">€</span>
                                                <Input
                                                    type="number" step="0.01"
                                                    defaultValue={product.finance?.shippingCost || 0}
                                                    className="pl-5 bg-white border-slate-100 font-black text-[10px] h-7 rounded-md shadow-xs"
                                                    onBlur={(e) => handleUpdateProduct(product.id, 'shippingCost', parseFloat(e.target.value))}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[7.5px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1 leading-none">
                                                <RotateCcw className="h-2.5 w-2.5" /> Dev (Ret)
                                            </Label>
                                            <div className="relative">
                                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-300 font-black text-[9px]">€</span>
                                                <Input
                                                    type="number" step="0.01"
                                                    defaultValue={product.finance?.returnCost || 0}
                                                    className="pl-5 bg-white border-slate-100 font-black text-[10px] h-7 rounded-md shadow-xs"
                                                    onBlur={(e) => handleUpdateProduct(product.id, 'returnCost', parseFloat(e.target.value))}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[7.5px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1 leading-none">
                                                <Package className="h-2.5 w-2.5" /> Embalaje
                                            </Label>
                                            <div className="relative">
                                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-300 font-black text-[9px]">€</span>
                                                <Input
                                                    type="number" step="0.01"
                                                    defaultValue={product.finance?.packagingCost || 0}
                                                    className="pl-5 bg-white border-slate-100 font-black text-[10px] h-7 rounded-md shadow-xs"
                                                    onBlur={(e) => handleUpdateProduct(product.id, 'packagingCost', parseFloat(e.target.value))}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[7.5px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1 leading-none">
                                                <Percent className="h-2.5 w-2.5" /> COD Fee
                                            </Label>
                                            <div className="relative">
                                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-300 font-black text-[9px]">€</span>
                                                <Input
                                                    type="number" step="0.01"
                                                    defaultValue={product.finance?.codFee || 0}
                                                    className="pl-5 bg-white border-slate-100 font-black text-[10px] h-7 rounded-md shadow-xs"
                                                    onBlur={(e) => handleUpdateProduct(product.id, 'codFee', parseFloat(e.target.value))}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[7.5px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1 leading-none">
                                                <ShieldCheck className="h-2.5 w-2.5" /> Seguro
                                            </Label>
                                            <div className="relative">
                                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-300 font-black text-[9px]">€</span>
                                                <Input
                                                    type="number" step="0.01"
                                                    defaultValue={product.finance?.insuranceFee || 0}
                                                    className="pl-5 bg-white border-slate-100 font-black text-[10px] h-7 rounded-md shadow-xs"
                                                    onBlur={(e) => handleUpdateProduct(product.id, 'insuranceFee', parseFloat(e.target.value))}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="integration" className="max-w-3xl">
                    <Card className="bg-slate-950 border-none rounded-lg overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-white/5 bg-gradient-to-br from-indigo-900/10 to-transparent">
                            <h3 className="text-sm font-black uppercase tracking-tight text-white flex items-center gap-2 italic">
                                <Zap className="h-4 w-4 text-indigo-400" /> Webhooks Maestros <span className="text-blue-500 not-italic ml-1">v2.1</span>
                            </h3>
                            <p className="text-[7px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1 opacity-80">Conexión Directa Global Listener</p>
                        </div>
                        <div className="p-6 space-y-4">
                            {providersWebhooks.map((p) => (
                                <div key={p.name} className="bg-white/[0.03] rounded-lg p-4 border border-white/5 flex items-center gap-4 hover:bg-white/[0.05] transition-all group">
                                    <div className="h-10 w-10 bg-white/5 rounded-lg flex items-center justify-center text-lg shadow-inner group-hover:bg-indigo-600 transition-all">
                                        {p.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-[10px] font-black text-white uppercase tracking-widest italic">{p.name} Operational Socket</h4>
                                        <div className="mt-1.5 group/code relative">
                                            <code className="text-[9px] font-mono text-indigo-300 block bg-black/40 p-2 rounded-md border border-white/5 truncate max-w-full italic">
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
                                        className="h-8 px-4 bg-white text-slate-950 hover:bg-indigo-50 font-black uppercase text-[8px] tracking-widest rounded-md transition-all shadow-lg shadow-indigo-500/10 shrink-0"
                                    >
                                        <Copy className="h-3 w-3 mr-2" /> Copiar
                                    </Button>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 bg-black/40 border-t border-white/5">
                            <div className="flex items-center gap-3 text-[7px] font-black text-slate-600 uppercase tracking-[0.2em]">
                                <div className="flex items-center gap-1.5">
                                    <ShieldCheck className="h-3 w-3 text-emerald-500/50" /> Secure SSL
                                </div>
                                <div className="h-1 w-1 rounded-full bg-slate-800" />
                                <div className="flex items-center gap-1.5">
                                    <Globe className="h-3 w-3 text-blue-500/50" /> Ops Cluster v2
                                </div>
                            </div>
                        </div>
                    </Card>
                </TabsContent>
            </Tabs >

            {/* PRODUCT SELECTOR DIALOG */}
            <Dialog open={!!selectingProvider} onOpenChange={(open) => !open && setSelectingProvider(null)}>
                <DialogContent className="max-w-lg bg-white p-0 overflow-hidden gap-0 rounded-lg border-none shadow-2xl">
                    <DialogHeader className="p-4 border-b border-slate-50 bg-slate-50/50">
                        <DialogTitle className="text-sm font-black uppercase text-slate-800 tracking-tight flex items-center gap-2 italic">
                            <Plus className="h-4 w-4 text-indigo-600" />
                            Vincular a {selectingProvider} <span className="text-slate-400 ml-2 text-[9px] not-italic">({products.length} productos)</span>
                        </DialogTitle>
                    </DialogHeader>

                    <div className="p-3 bg-white border-b border-slate-50">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                            <Input
                                autoFocus
                                placeholder="Filtrar por nombre o SKU..."
                                className="pl-8 h-9 bg-slate-50 border-slate-100 font-bold text-xs text-slate-700 rounded-md shadow-xs"
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
                                                const tid = toast.loading(`Asignando...`);
                                                try {
                                                    const res = await setProductProvider(product.id, selectingProvider);
                                                    if (res.success) {
                                                        toast.success("Producto asignado", { id: tid });
                                                        loadData();
                                                        setSelectingProvider(null);
                                                    } else {
                                                        toast.error(res.message || "Error", { id: tid });
                                                    }
                                                } catch (err: any) {
                                                    toast.error("Error de red", { id: tid });
                                                }
                                            }}
                                            className={cn(
                                                "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all border border-transparent shadow-xs mb-1",
                                                isLinked ? "bg-emerald-50/50 opacity-50 cursor-default" : "hover:bg-indigo-50 hover:border-indigo-100 bg-white border-slate-100"
                                            )}
                                        >
                                            <div className="h-9 w-9 bg-white rounded-md overflow-hidden flex-shrink-0 border border-slate-100 shadow-xs">
                                                {product.image ? <img src={product.image} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-50" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-[10px] font-black text-slate-800 truncate italic">{product.title}</h4>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <Badge variant="secondary" className="text-[7.5px] h-4 rounded-sm text-slate-400 font-black bg-slate-100 border-none">
                                                        {product.sku || "N/A"}
                                                    </Badge>
                                                    {(product.supplier?.name || product.inferredProvider) && (
                                                        <span className="text-[7.5px] text-slate-400 font-black uppercase opacity-60">
                                                            Ref: {product.inferredProvider || product.supplier?.name}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {isLinked && <Badge className="bg-emerald-500 text-white text-[7px] font-black h-4 px-1 rounded-sm border-none shadow-sm">VINCULADO</Badge>}
                                        </div>
                                    );
                                })}
                            {products.filter(p => {
                                const q = searchQuery.toLowerCase();
                                const title = (p.title || "").toLowerCase();
                                const sku = (p.sku || "").toLowerCase();
                                return !q || title.includes(q) || sku.includes(q);
                            }).length === 0 && (
                                    <div className="text-center py-10 space-y-3">
                                        <p className="text-slate-400 font-black text-[9px] uppercase tracking-[0.2em] italic">No Match Found</p>
                                        <Button
                                            onClick={async () => {
                                                const tid = toast.loading("Sincronizando Shopify...");
                                                const res = await syncShopifyProducts();
                                                if (res.success) {
                                                    toast.success(`${res.count} productos sync`, { id: tid });
                                                    loadData();
                                                } else {
                                                    toast.error(res.message, { id: tid });
                                                }
                                            }}
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-[8px] tracking-widest h-8 rounded-lg px-4 shadow-lg shadow-indigo-500/20"
                                        >
                                            <RefreshCw className="h-3 w-3 mr-2" />
                                            Sincronizar Catálogo
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

