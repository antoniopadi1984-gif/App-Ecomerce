"use client";

import React, { useState, useEffect } from "react";
import {
    Search,
    Bell,
    Settings,
    Menu,
    ChevronDown,
    Check,
    Package,
    Sparkles,
    LayoutDashboard,
    Store,
    Activity,
    LinkIcon,
    ShieldAlert
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useProduct } from "@/context/ProductContext";
import { useStore } from "@/lib/store/store-context";
import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";

interface ShopifyProductItem {
    id: string;
    title: string;
    handle: string;
    image: string | null;
    variants: { price: string; sku: string }[];
    status: string;
    ecomBoomId: string | null;
}

export function TopBar({ onMenuClick, isExpanded }: { onMenuClick: () => void; isExpanded?: boolean }) {
    const { product, allProducts, productId, setProductId } = useProduct();
    const { activeStoreId, activeStore, stores, setActiveStoreId, storeOverview, overviewLoading } = useStore();
    const [search, setSearch] = useState("");
    const pathname = usePathname();
    const router = useRouter();
    const [scrolled, setScrolled] = useState(false);

    const roas = storeOverview?.kpis?.roas7d ?? '-';
    const revenue = storeOverview?.kpis?.revenue7d ?? '-';
    // const orders = storeOverview?.kpis?.orders7d ?? '-';
    // const pendingOrders = storeOverview?.kpis?.pendingOrders ?? 0;

    // ── Shopify products state ──────────────────────────────────
    const [shopifyProducts, setShopifyProducts] = useState<ShopifyProductItem[]>([]);
    const [shopifyConnected, setShopifyConnected] = useState(false);
    const [shopifyLoading, setShopifyLoading] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Load Shopify products whenever active store changes
    useEffect(() => {
        if (!activeStoreId) return;
        setShopifyLoading(true);
        setShopifyProducts([]);
        setShopifyConnected(false);
        fetch(`/api/shopify/products?storeId=${activeStoreId}`)
            .then(r => r.json())
            .then(data => {
                setShopifyConnected(data.connected ?? false);
                setShopifyProducts(data.products ?? []);
            })
            .catch(() => setShopifyConnected(false))
            .finally(() => setShopifyLoading(false));
    }, [activeStoreId]);

    // List of local product IDs for quick lookup
    const localSkuMap = new Map(allProducts.map(p => [p.sku, p.id]));
    const localShopifyIdMap = new Map(allProducts.map(p => [p.shopifyId, p.id]));

    const filteredProducts = React.useMemo(() => {
        if (!shopifyConnected) {
            return allProducts.filter(p => 
                p.title?.toLowerCase().includes(search.toLowerCase())
            );
        }

        // Merge Shopify products with local awareness
        const merged = shopifyProducts.map(sp => {
            const variantSku = sp.variants?.[0]?.sku;
            const ecomBoomId = sp.ecomBoomId || localShopifyIdMap.get(sp.id) || (variantSku ? localSkuMap.get(variantSku) : null) || null;
            return {
                id: sp.id,
                title: sp.title,
                handle: sp.handle,
                image: sp.image,
                variants: sp.variants,
                status: sp.status,
                ecomBoomId,
                isShopifyOnly: !ecomBoomId
            };
        });

        // Add any local products that weren't found in this Shopify batch
        allProducts.forEach(lp => {
            const alreadyIn = merged.find(m => m.ecomBoomId === lp.id);
            if (!alreadyIn) {
                merged.push({
                    id: lp.id,
                    title: lp.title,
                    handle: lp.handle || '',
                    image: lp.imageUrl,
                    variants: [],
                    status: lp.status,
                    ecomBoomId: lp.id,
                    isShopifyOnly: false
                } as any);
            }
        });

        return merged.filter(p => p.title?.toLowerCase().includes(search.toLowerCase()));
    }, [shopifyConnected, shopifyProducts, allProducts, search, localShopifyIdMap, localSkuMap]);


    return (
        <header
            className="fixed top-0 right-0 z-40 transition-all duration-200"
            style={{
                height: 'var(--topbar-h)',
                width: '100%',
                background: 'var(--surface)',
                borderBottom: '1px solid var(--border)',
                boxShadow: 'var(--sh-sm)',
            }}
        >
            <div
                className="h-full pr-4 flex items-center justify-between gap-4 transition-all duration-200 max-md:pl-12"
                style={{ paddingLeft: isExpanded ? 'var(--sidebar-w-exp)' : 'var(--sidebar-w)' }}
            >
                <div className="flex items-center gap-4">
                    <button
                        onClick={onMenuClick}
                        className="p-2 rounded-xl hover:bg-white/40 transition-colors md:hidden"
                    >
                        <Menu className="w-4 h-4 text-slate-600" />
                    </button>
                </div>

                {/* ═══ ZONE CENTER: Flexible spacer ═══ */}
                <div className="flex-1 min-w-0" />

                {/* ═══ ZONE RIGHT: KPIs + Selectors + Icons ═══ */}
                <div className="flex items-center gap-4 shrink-0 px-2">

                    {/* ── Store Selector ── */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className={cn(
                                "flex items-center gap-2 px-2.5 py-1.5 bg-[var(--surface2)] border border-[var(--border)] rounded-xl hover:border-[var(--inv)]/20 transition-all group shrink min-w-0 shadow-sm max-w-[200px]"
                            )}>
                                <div className="w-5 h-5 rounded-lg bg-[var(--bg)] flex items-center justify-center shrink-0 border border-[var(--border)]">
                                    <Store className="w-3 h-3 text-[var(--mkt)]" />
                                </div>
                                <div className="flex flex-col items-start min-w-0 flex-1">
                                    <span className="text-[8px] font-bold text-[var(--text-dim)] uppercase tracking-widest leading-none mb-0.5">Tienda</span>
                                    <span className="text-[11px] font-bold text-[var(--text)] truncate w-full text-left tracking-tight leading-none">
                                        {activeStore?.name || "SELECCIONAR..."}
                                    </span>
                                </div>
                                <ChevronDown className="w-3 h-3 text-[var(--text-dim)] group-hover:text-[var(--inv)] transition-colors shrink-0" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[240px] bg-white shadow-[0_12px_40px_rgba(0,0,0,0.12)] p-1.5 z-[70] border border-slate-100 rounded-2xl">
                            <DropdownMenuLabel className="px-3 py-2 border-b border-slate-50 mb-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cambiar Tienda</span>
                            </DropdownMenuLabel>
                            {stores.map((s) => (
                                <DropdownMenuItem
                                    key={s.id}
                                    onClick={() => setActiveStoreId(s.id)}
                                    className={cn(
                                        "flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all mb-0.5",
                                        activeStoreId === s.id ? "bg-rose-50 border border-rose-100/50" : "hover:bg-slate-50 border border-transparent"
                                    )}
                                >
                                    <div className={cn(
                                        "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                                        activeStoreId === s.id ? "bg-white border border-rose-200 shadow-sm" : "bg-slate-100"
                                    )}>
                                        <Store className={cn(
                                            "w-3.5 h-3.5",
                                            activeStoreId === s.id ? "text-primary" : "text-slate-400"
                                        )} />
                                    </div>
                                    <div className="flex flex-col min-w-0 flex-1">
                                        <span className="text-[11px] font-bold truncate text-slate-900">{s.name}</span>
                                        {s.domain && <span className="text-[9px] text-slate-400 font-medium truncate">{s.domain}</span>}
                                    </div>
                                    {activeStoreId === s.id && <Check className="w-3 h-3 ml-auto text-primary" />}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* ── Context / Product Selector ── */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className={cn(
                                "flex items-center gap-2 px-2.5 py-1.5 bg-[var(--surface2)] border border-[var(--border)] rounded-xl hover:border-[var(--inv)]/40 transition-all group shrink min-w-0 max-w-[220px] shadow-sm"
                            )}>
                                <div className="w-5 h-5 rounded-lg bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center overflow-hidden shrink-0">
                                    {!product ? (
                                        <Package className="w-3 h-3 text-[var(--text-dim)]" />
                                    ) : product.imageUrl ? (
                                        <img src={product.imageUrl} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <Package className="w-3 h-3 text-[var(--inv)]" />
                                    )}
                                </div>
                                <div className="flex flex-col items-start min-w-0">
                                    <span className="text-[8px] font-bold text-[var(--text-dim)] uppercase tracking-widest leading-none mb-0.5">Producto</span>
                                    <span className="text-[11px] font-bold text-[var(--text)] truncate max-w-full tracking-tight leading-none">
                                         {product?.title || 
                                         (shopifyProducts.find(sp => sp.id === productId)?.title) || 
                                         "SELECCIONAR..."}
                                    </span>
                                </div>
                                <ChevronDown className="w-3 h-3 text-[var(--text-dim)] group-hover:text-[var(--inv)] transition-colors shrink-0" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[300px] bg-white shadow-[0_12px_40px_rgba(0,0,0,0.12)] p-1.5 z-[70] border border-slate-100 rounded-2xl">
                            <DropdownMenuLabel className="px-3 py-2 border-b border-slate-50 mb-1">
                                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Cambiar Producto</span>
                            </DropdownMenuLabel>

                            <div className="px-2 pb-2">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        placeholder="BUSCAR PRODUCTO..."
                                        className="h-9 pl-9 text-[10px] font-black uppercase tracking-widest bg-slate-50/50 border-none rounded-xl focus-visible:ring-1 focus-visible:ring-rose-200"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </div>
                            </div>

                            <ScrollArea className="h-[300px] px-1 no-scrollbar">

                                {shopifyLoading && filteredProducts.length === 0 ? (
                                    <div className="flex items-center justify-center py-6 text-slate-400">
                                        <span className="text-[11px]">Cargando productos de Shopify...</span>
                                    </div>
                                ) : filteredProducts.length === 0 ? (
                                    <div className="flex items-center justify-center py-6 text-slate-400">
                                        <span className="text-[11px]">No se encontraron productos en esta tienda</span>
                                    </div>
                                ) : (
                                    (filteredProducts as any[]).map((p) => {
                                        const activeId = p.ecomBoomId || p.id;
                                        const isActive = productId === activeId;
                                        const hasResearch = !!p.ecomBoomId;
                                        const isShopify = p.id.startsWith('gid://');

                                        return (
                                            <DropdownMenuItem
                                                key={p.id}
                                                onClick={() => {
                                                    setProductId(activeId);
                                                    if (!hasResearch && isShopify) {
                                                        // Si es solo Shopify, avisar o mover a pagina de creacion
                                                        router.push('/investigacion');
                                                    }
                                                }}
                                                className={cn(
                                                    "flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all mb-1",
                                                    isActive ? "bg-rose-50 border border-rose-100" : "hover:bg-slate-50 border border-transparent"
                                                )}
                                            >
                                                {/* Thumbnail */}
                                                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-sm relative">
                                                    {p.image || p.imageUrl ? (
                                                        <img src={p.image || p.imageUrl} alt={p.title} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Package className="w-3.5 h-3.5 text-slate-300" />
                                                    )}
                                                    {isShopify && !hasResearch && (
                                                        <div className="absolute top-0 right-0 w-2 h-2 bg-emerald-500 border border-white rounded-full" title="Solo en Shopify" />
                                                    )}
                                                </div>

                                                {/* Info */}
                                                <div className="flex flex-col min-w-0 flex-1">
                                                    <span className="text-[11px] font-bold truncate text-slate-900">{p.title}</span>
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-[9px] text-slate-400 font-medium uppercase tracking-tighter">{p.status}</span>
                                                        {hasResearch && (
                                                            <span className="text-[8px] px-1 py-0 bg-violet-50 text-violet-600 rounded border border-violet-100 font-bold uppercase tracking-tight">Research ✓</span>
                                                        )}
                                                        {!hasResearch && isShopify && (
                                                            <span className="text-[8px] px-1 py-0 bg-emerald-50 text-emerald-600 rounded border border-emerald-100 font-bold uppercase tracking-tight">Ready for Research</span>
                                                        )}
                                                    </div>
                                                </div>

                                                {isActive && <Check className="w-3 h-3 ml-auto text-primary" />}
                                            </DropdownMenuItem>
                                        );
                                    })
                                )}
                            </ScrollArea>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* KPI Pills - Glass Style */}
                    <div className="hidden lg:flex items-center gap-1.5 p-1 glass-panel rounded-xl shadow-sm">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/80 rounded-lg shadow-xs border border-white/50">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em]">ROAS 7D</span>
                            <span className="text-[11px] font-black text-rose-500 italic">{overviewLoading ? '...' : roas}</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/80 rounded-lg shadow-xs border border-white/50">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em]">VENTAS 7D</span>
                            <span className="text-[11px] font-black text-emerald-600 italic">
                                {overviewLoading ? '...' : revenue}€
                            </span>
                        </div>
                    </div>

                    {/* Action Icons */}
                    <div className="flex items-center gap-2 shrink-0 border-l border-slate-200/50 pl-4 h-8">
                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-slate-400 hover:text-primary hover:bg-rose-50 transition-all relative">
                            <Bell className="w-3.5 h-3.5" />
                            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-primary rounded-full border border-white" />
                        </Button>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-slate-500 hover:text-primary hover:bg-rose-50 transition-all">
                                    <Settings className="w-3.5 h-3.5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[200px] bg-white shadow-[0_12px_40px_rgba(0,0,0,0.12)] border border-slate-100 p-1.5 z-[70] rounded-2xl">
                                <DropdownMenuLabel className="px-3 py-2">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ajustes & Sistema</span>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-slate-100/50" />
                                <DropdownMenuItem onClick={() => router.push('/sistema/settings')} className="flex items-center gap-3 p-2 rounded-xl cursor-pointer hover:bg-slate-50 transition-all">
                                    <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center border border-emerald-100">
                                        <Activity className="w-3.5 h-3.5 text-emerald-600" />
                                    </div>
                                    <span className="text-[11px] font-bold text-slate-700">Estado Salud</span>
                                </DropdownMenuItem>

                                <DropdownMenuSeparator className="bg-slate-100/50" />

                                <DropdownMenuItem onClick={() => router.push('/sistema/settings')} className="flex items-center gap-3 p-2 rounded-xl cursor-pointer hover:bg-slate-50 transition-all">
                                    <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200">
                                        <Settings className="w-3.5 h-3.5 text-slate-600" />
                                    </div>
                                    <span className="text-[11px] font-bold text-slate-700">Ajustes Generales</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <div className="w-7 h-7 rounded-lg bg-slate-50 p-0.5 cursor-pointer hover:border-primary/30 transition-all border border-slate-200/50 ml-1 shadow-sm overflow-hidden relative">
                            <Image
                                src="https://github.com/shadcn.png"
                                alt="Profile"
                                fill
                                sizes="28px"
                                className="object-cover rounded-[5px]"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}

