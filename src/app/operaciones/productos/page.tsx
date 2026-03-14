"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
    Package, 
    Search, 
    Filter, 
    Plus, 
    ChevronRight, 
    Microscope, 
    Video, 
    Layout, 
    CheckCircle2, 
    Clock,
    MoreHorizontal,
    ArrowUpRight,
    ShoppingBag,
    Link as LinkIcon,
    Unlink,
    ExternalLink,
    Wand2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProduct } from "@/context/ProductContext";
import { useStore } from "@/lib/store/store-context";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function ProductosPage() {
    const { allProducts, productId, setProductId, refreshAllProducts } = useProduct();
    const { activeStore, activeStoreId } = useStore();
    const [search, setSearch] = useState("");
    const [view, setView] = useState<'RESEARCH' | 'SHOPIFY'>('RESEARCH');
    const [shopifyProducts, setShopifyProducts] = useState<any[]>([]);
    const [loadingShopify, setLoadingShopify] = useState(false);
    const [mappingProductId, setMappingProductId] = useState<string | null>(null);
    const router = useRouter();

    // Fetch Shopify products
    useEffect(() => {
        if ((view === 'SHOPIFY' || mappingProductId) && activeStoreId) {
            setLoadingShopify(true);
            fetch(`/api/shopify/products?storeId=${activeStoreId}`)
                .then(r => r.json())
                .then(data => {
                    if (data.products) setShopifyProducts(data.products);
                })
                .catch(() => {})
                .finally(() => setLoadingShopify(false));
        }
    }, [view, activeStoreId, mappingProductId]);

    const filteredResearch = useMemo(() => {
        return allProducts.filter(p => 
            p.title.toLowerCase().includes(search.toLowerCase())
        );
    }, [allProducts, search]);

    const filteredShopify = useMemo(() => {
        return shopifyProducts.filter(p => 
            p.title.toLowerCase().includes(search.toLowerCase())
        );
    }, [shopifyProducts, search]);

    const handleSelect = (id: string) => {
        setProductId(id);
        toast.success("Producto seleccionado");
        setTimeout(() => {
            router.push('/mando/vista-aguila');
        }, 300);
    };

    const handleInvestigateShopify = async (sp: any) => {
        const toastId = toast.loading(`Iniciando investigación para ${sp.title}...`);
        try {
            const res = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Store-Id': activeStoreId || '' },
                body: JSON.stringify({
                    storeId: activeStoreId,
                    title: sp.title,
                    sku: sp.variants?.[0]?.sku || `SP_${sp.handle.toUpperCase()}`,
                    imageUrl: sp.image,
                    shopifyId: sp.id,
                    price: parseFloat(sp.variants?.[0]?.price || '0'),
                    status: 'ACTIVE',
                    landingUrl: sp.onlineStoreUrl || sp.url || `https://${activeStore?.domain}/products/${sp.handle}`
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success("¡Investigación iniciada!", { id: toastId });
                await refreshAllProducts();
                setProductId(data.product.id);
                router.push('/investigacion');
            } else {
                throw new Error(data.error);
            }
        } catch (e: any) {
            toast.error("Error: " + e.message, { id: toastId });
        }
    };

    const handleConfirmLink = async (sp: any) => {
        if (!mappingProductId) return;
        const toastId = toast.loading(`Vinculando a ${sp.title}...`);
        try {
            const res = await fetch(`/api/products/${mappingProductId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    shopifyId: sp.id,
                    sku: sp.variants?.[0]?.sku,
                    price: parseFloat(sp.variants?.[0]?.price || '0')
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success("¡Vinculación completada!", { id: toastId });
                setMappingProductId(null);
                setView('RESEARCH');
                await refreshAllProducts();
            } else {
                throw new Error(data.error);
            }
        } catch (e: any) {
            toast.error("Error: " + e.message, { id: toastId });
        }
    };

    return (
        <div className="flex flex-col gap-6 p-6 max-w-[1600px] mx-auto animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[10px] font-black text-rose-500 uppercase tracking-[0.2em]">
                        <ShoppingBag className="w-3 h-3" />
                        Operaciones
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                        {mappingProductId 
                            ? <span>Vincular <span className="text-rose-500">{allProducts.find(p => p.id === mappingProductId)?.title}</span></span>
                            : <span>Gestión de <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-500">Productos</span></span>
                        }
                    </h1>
                    <p className="text-sm text-slate-500 font-medium">
                        {mappingProductId
                            ? "Selecciona un producto del catálogo de Shopify para vincularlo."
                            : view === 'RESEARCH' 
                                ? "Visualiza el progreso de investigación y creativos de cada producto."
                                : "Explora y sincroniza productos directamente desde tu tienda Shopify."}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {mappingProductId ? (
                        <Button 
                            variant="destructive"
                            className="h-10 px-4 rounded-xl font-bold text-[10px] uppercase tracking-widest"
                            onClick={() => { setMappingProductId(null); setView('RESEARCH'); }}
                        >
                            Cancelar Vinculación
                        </Button>
                    ) : (
                        <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1">
                            <Button 
                                variant={view === 'RESEARCH' ? 'default' : 'ghost'}
                                size="sm"
                                className={cn(
                                    "rounded-lg text-[10px] font-bold uppercase tracking-widest px-4 h-8",
                                    view === 'RESEARCH' ? "bg-white text-slate-900 shadow-sm hover:bg-white" : "text-slate-500"
                                )}
                                onClick={() => setView('RESEARCH')}
                            >
                                Laboratorio
                            </Button>
                            <Button 
                                variant={view === 'SHOPIFY' ? 'default' : 'ghost'}
                                size="sm"
                                className={cn(
                                    "rounded-lg text-[10px] font-bold uppercase tracking-widest px-4 h-8",
                                    view === 'SHOPIFY' ? "bg-white text-slate-900 shadow-sm hover:bg-white" : "text-slate-500"
                                )}
                                onClick={() => setView('SHOPIFY')}
                            >
                                Catálogo Shopify
                            </Button>
                        </div>
                    )}

                    <div className="h-8 w-[1px] bg-slate-200 mx-2" />

                    <Button 
                        variant="outline" 
                        className="h-10 px-4 rounded-xl border-slate-200 hover:bg-slate-50 font-bold text-[10px] uppercase tracking-widest gap-2"
                        onClick={() => refreshAllProducts()}
                    >
                        <Clock className="w-3.5 h-3.5" />
                        Sincronizar
                    </Button>
                    <Button 
                        className="h-10 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] uppercase tracking-widest gap-2 shadow-lg shadow-slate-200"
                        onClick={() => router.push('/marketing/mvp-wizard')}
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Nuevo Producto
                    </Button>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-2 bg-white/50 backdrop-blur-sm border border-slate-100 rounded-2xl shadow-sm">
                <div className="md:col-span-3 relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                        placeholder={view === 'RESEARCH' ? "Buscar en el laboratorio..." : "Buscar en Shopify..."}
                        className="h-12 pl-11 bg-transparent border-none focus-visible:ring-0 text-sm font-medium"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex items-center justify-center border-l border-slate-100 px-4">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {view === 'RESEARCH' ? `${filteredResearch.length} Investigaciones` : `${filteredShopify.length} Productos`}
                    </span>
                </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
                {view === 'RESEARCH' ? (
                    filteredResearch.map((prod: any) => {
                        const isActive = productId === prod.id;
                        const researchCount = prod._count?.avatarResearches || 0;
                        const videoCount = prod._count?.videoAssets || 0;
                        const creativeCount = prod._count?.creativeAssets || 0;
                        const isFullyDone = researchCount > 0 && (videoCount > 0 || creativeCount > 0);

                        return (
                            <div 
                                key={prod.id}
                                className={cn(
                                    "group relative bg-white border rounded-[2rem] p-5 transition-all duration-300 hover:shadow-2xl hover:shadow-slate-200/50 hover:-translate-y-1 overflow-hidden",
                                    isActive ? "border-rose-200 ring-4 ring-rose-50/50" : "border-slate-100"
                                )}
                            >
                                {/* Selection Status Badge */}
                                {isActive && (
                                    <div className="absolute top-4 right-4 z-10">
                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-500 text-white rounded-full shadow-lg shadow-rose-200">
                                            <CheckCircle2 className="w-3 h-3 text-white" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Activo</span>
                                        </div>
                                    </div>
                                )}

                                {/* Product Info */}
                                <div className="flex gap-4 mb-6">
                                    <div className="w-20 h-20 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-500">
                                        {prod.imageUrl ? (
                                            <img src={prod.imageUrl} alt={prod.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <Package className="w-8 h-8 text-slate-200" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0 pr-10">
                                        <h3 className="font-black text-slate-900 text-lg leading-tight truncate mb-1">
                                            {prod.title}
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                                {prod.productFamily || 'Genérico'}
                                            </span>
                                            <span className="w-1 h-1 rounded-full bg-slate-200" />
                                            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-tighter">
                                                {prod.status}
                                            </span>
                                        </div>
                                        {prod.shopifyId ? (
                                            <div className="mt-2 flex items-center gap-1.5 px-2 py-0.5 bg-sky-50 text-sky-600 border border-sky-100 rounded-md w-fit shadow-sm">
                                                <ShoppingBag className="w-2.5 h-2.5" />
                                                <span className="text-[9px] font-black uppercase tracking-widest">Linkeado</span>
                                            </div>
                                        ) : (
                                            <div className="mt-2 flex items-center gap-1.5 px-2 py-0.5 bg-slate-50 text-slate-400 border border-slate-100 rounded-md w-fit">
                                                <Unlink className="w-2.5 h-2.5" />
                                                <span className="text-[9px] font-black uppercase tracking-widest">Sin vincular</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Metrics Grid */}
                                <div className="grid grid-cols-3 gap-2 mb-6">
                                    <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50/50 border border-slate-50 transition-colors hover:bg-slate-50">
                                        <Microscope className={cn(
                                            "w-4 h-4 mb-1.5",
                                            researchCount > 0 ? "text-violet-500" : "text-slate-300"
                                        )} />
                                        <span className="text-xs font-black text-slate-900">{researchCount}</span>
                                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Research</span>
                                    </div>
                                    <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50/50 border border-slate-50 transition-colors hover:bg-slate-50">
                                        <Video className={cn(
                                            "w-4 h-4 mb-1.5",
                                            videoCount > 0 ? "text-rose-500" : "text-slate-300"
                                        )} />
                                        <span className="text-xs font-black text-slate-900">{videoCount}</span>
                                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Videos</span>
                                    </div>
                                    <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50/50 border border-slate-50 transition-colors hover:bg-slate-50">
                                        <Layout className={cn(
                                            "w-4 h-4 mb-1.5",
                                            creativeCount > 0 ? "text-blue-500" : "text-slate-300"
                                        )} />
                                        <span className="text-xs font-black text-slate-900">{creativeCount}</span>
                                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Assets</span>
                                    </div>
                                </div>

                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-6">
                                    <div 
                                        className={cn(
                                            "h-full transition-all duration-1000",
                                            isFullyDone ? "bg-gradient-to-r from-emerald-400 to-emerald-500" : "bg-gradient-to-r from-rose-400 to-rose-500"
                                        )}
                                        style={{ width: isFullyDone ? '100%' : researchCount > 0 ? '50%' : '5%' }}
                                    />
                                </div>

                                <div className="flex items-center gap-2 pt-2">
                                    <Button 
                                        className={cn(
                                            "flex-1 h-12 rounded-xl font-bold text-[10px] uppercase tracking-widest gap-2 shadow-sm transition-all",
                                            isActive 
                                                ? "bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100" 
                                                : "bg-slate-900 text-white hover:bg-rose-600"
                                        )}
                                        onClick={() => handleSelect(prod.id)}
                                    >
                                        {isActive ? "Seleccionado" : "Trabajar Investigación"}
                                        {!isActive && <ArrowUpRight className="w-3.5 h-3.5" />}
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-12 w-12 rounded-xl text-slate-400 hover:bg-slate-50" onClick={() => {
                                        if (!prod.shopifyId) {
                                            setMappingProductId(prod.id);
                                            setView('SHOPIFY');
                                        }
                                        else window.open(`https://${activeStore?.domain}/admin/products/${prod.shopifyId.split('/').pop()}`, '_blank');
                                    }}>
                                        {prod.shopifyId ? <ExternalLink className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
                                    </Button>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    loadingShopify ? (
                        <div className="col-span-full py-20 flex flex-col items-center justify-center gap-4">
                            <Clock className="w-12 h-12 text-slate-200 animate-spin" />
                            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Cargando catálogo de Shopify...</p>
                        </div>
                    ) : filteredShopify.map((sp: any) => {
                        const existingResearch = allProducts.find(p => p.shopifyId === sp.id || p.sku === sp.variants?.[0]?.sku);
                        
                        return (
                            <div key={sp.id} className={cn(
                                "group relative bg-white border rounded-[2rem] p-5 transition-all duration-300 hover:shadow-xl overflow-hidden",
                                mappingProductId ? "border-rose-200 ring-2 ring-rose-50" : "border-slate-100"
                            )}>
                                <div className="flex gap-4 mb-6">
                                    <div className="w-20 h-20 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-110 transition-transform duration-500">
                                        {sp.image ? (
                                            <img src={sp.image} alt={sp.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <ShoppingBag className="w-8 h-8 text-slate-200" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0 pr-4">
                                        <h3 className="font-black text-slate-900 text-lg leading-tight truncate mb-1">
                                            {sp.title}
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                                {sp.handle}
                                            </span>
                                            <span className="w-1 h-1 rounded-full bg-slate-200" />
                                            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-tighter">
                                                {sp.status}
                                            </span>
                                        </div>
                                        {existingResearch && (
                                            <div className="mt-2 flex items-center gap-1.5 px-2 py-0.5 bg-violet-50 text-violet-600 border border-violet-100 rounded-md w-fit shadow-sm">
                                                <Microscope className="w-2.5 h-2.5" />
                                                <span className="text-[9px] font-black uppercase tracking-widest">Ya en Laboratorio</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 pt-2">
                                    {mappingProductId ? (
                                        <Button 
                                            className="h-12 rounded-xl bg-rose-600 text-white hover:bg-rose-700 font-bold text-[10px] uppercase tracking-widest gap-2 shadow-lg shadow-rose-100 transition-all"
                                            onClick={() => handleConfirmLink(sp)}
                                        >
                                            <LinkIcon className="w-3.5 h-3.5" />
                                            Vincular a este producto
                                        </Button>
                                    ) : existingResearch ? (
                                        <Button 
                                            variant="outline"
                                            className="h-12 rounded-xl font-bold text-[10px] uppercase tracking-widest gap-2 border-slate-200 hover:bg-slate-50 transition-all"
                                            onClick={() => handleSelect(existingResearch.id)}
                                        >
                                            Ver Investigación
                                            <ChevronRight className="w-3.5 h-3.5" />
                                        </Button>
                                    ) : (
                                        <Button 
                                            className="h-12 rounded-xl bg-violet-600 text-white hover:bg-violet-700 font-bold text-[10px] uppercase tracking-widest gap-2 shadow-lg shadow-violet-100 transition-all"
                                            onClick={() => handleInvestigateShopify(sp)}
                                        >
                                            <Wand2 className="w-3.5 h-3.5" />
                                            Iniciar Investigación
                                        </Button>
                                    )}
                                    <Button 
                                        variant="ghost" 
                                        className="h-10 text-[9px] font-bold text-slate-400 uppercase tracking-widest"
                                        onClick={() => window.open(`https://${activeStore?.domain}/admin/products/${sp.id.split('/').pop()}`, '_blank')}
                                    >
                                        Ver en Shopify Admin
                                    </Button>
                                </div>
                            </div>
                        );
                    })
                )}

                {/* Empty State / Add New Card */}
                {view === 'RESEARCH' && (
                    <div 
                        onClick={() => router.push('/marketing/mvp-wizard')}
                        className="group border-2 border-dashed border-slate-200 rounded-[2rem] p-8 flex flex-col items-center justify-center text-center gap-4 cursor-pointer hover:border-rose-300 hover:bg-rose-50/30 transition-all duration-300"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:scale-110 group-hover:bg-white transition-all duration-500 shadow-sm">
                            <Plus className="w-8 h-8 text-slate-300 group-hover:text-rose-500" />
                        </div>
                        <div>
                            <h3 className="font-black text-slate-900 text-lg">Investigar Producto Nuevo</h3>
                            <p className="text-sm text-slate-400 font-medium">Inicia el MVP Wizard (sin Shopify)</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
