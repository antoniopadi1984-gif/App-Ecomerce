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
    variants: { price: string }[];
    status: string;
    ecomBoomId: string | null;
}

export function TopBar({ onMenuClick, isExpanded }: { onMenuClick: () => void; isExpanded?: boolean }) {
    const { product, allProducts, productId, setProductId } = useProduct();
    const { activeStoreId, activeStore, stores, setActiveStoreId } = useStore();
    const [search, setSearch] = useState("");
    const pathname = usePathname();
    const router = useRouter();
    const [scrolled, setScrolled] = useState(false);

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
        fetch(`/api/shopify/products?storeId=${activeStoreId}`)
            .then(r => r.json())
            .then(data => {
                setShopifyConnected(data.connected ?? false);
                setShopifyProducts(data.products ?? []);
            })
            .catch(() => setShopifyConnected(false))
            .finally(() => setShopifyLoading(false));
    }, [activeStoreId]);

    // Merge lists: Shopify products enriched with ecomBoom link awareness
    // If Shopify is connected, use that list as primary; then fall back to EcomBoom-only products.
    const ecomBoomIds = new Set(allProducts.map(p => p.id));

    const filteredProducts = shopifyConnected
        ? shopifyProducts.filter(p =>
            p.title?.toLowerCase().includes(search.toLowerCase())
        )
        : allProducts.filter(p =>
            p.title?.toLowerCase().includes(search.toLowerCase())
        );


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
                        <DropdownMenuContent align="end" className="w-[240px] glass-card p-1.5 z-[70] border-none rounded-2xl">
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
                                "flex items-center gap-2 px-2.5 py-1.5 bg-[var(--surface2)] border border-[var(--border)] rounded-xl hover:border-[var(--inv)]/40 transition-all group shrink min-w-0 max-w-[220px] shadow-sm",
                                productId === 'GLOBAL' && "opacity-80 border-dashed"
                            )}>
                                <div className="w-5 h-5 rounded-lg bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center overflow-hidden shrink-0">
                                    {(productId === 'GLOBAL' || !product) ? (
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
                                        {productId === 'GLOBAL' ? "SELECCIONAR PRODUCTO" : product?.title || "SELECCIONAR..."}
                                    </span>
                                </div>
                                <ChevronDown className="w-3 h-3 text-[var(--text-dim)] group-hover:text-[var(--inv)] transition-colors shrink-0" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[280px] glass-card p-1.5 z-[70] border-none rounded-2xl">
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
                                <DropdownMenuItem
                                    onClick={() => setProductId('GLOBAL')}
                                    className={cn(
                                        "flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all mb-1",
                                        productId === 'GLOBAL' ? "bg-rose-50 border border-rose-100" : "hover:bg-slate-50 border border-transparent"
                                    )}
                                >
                                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
                                        <LayoutDashboard className="w-4 h-4 text-primary" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[11px] font-bold text-slate-900">Contexto Global</span>
                                        <span className="text-[9px] text-slate-400 font-medium">Vista unificada</span>
                                    </div>
                                    {productId === 'GLOBAL' && <Check className="w-3 h-3 ml-auto text-primary" />}
                                </DropdownMenuItem>

                                <DropdownMenuSeparator className="bg-slate-100 my-2" />

                                {/* ── Shopify-connected store: enhanced list ── */}
                                {shopifyConnected ? (
                                    shopifyLoading ? (
                                        <div className="flex items-center justify-center py-6 text-slate-400">
                                            <span className="text-[11px]">Cargando productos...</span>
                                        </div>
                                    ) : filteredProducts.length === 0 ? (
                                        <div className="flex items-center justify-center py-6 text-slate-400">
                                            <span className="text-[11px]">Sin productos en Shopify</span>
                                        </div>
                                    ) : (
                                        (filteredProducts as ShopifyProductItem[]).map((p) => {
                                            const activeId = p.ecomBoomId || p.id;
                                            const isActive = productId === activeId;
                                            return (
                                                <DropdownMenuItem
                                                    key={p.id}
                                                    onClick={() => setProductId(p.ecomBoomId || p.id)}
                                                    className={cn(
                                                        "flex items-center gap-2 p-2 rounded-xl cursor-pointer transition-all mb-1",
                                                        isActive ? "bg-violet-50 border border-violet-100" : "hover:bg-slate-50 border border-transparent"
                                                    )}
                                                >
                                                    {/* Thumbnail */}
                                                    <div className="w-7 h-7 rounded-md bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                                                        {p.image ? (
                                                            <img src={p.image} alt={p.title} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Package className="w-3 h-3 text-slate-300" />
                                                        )}
                                                    </div>

                                                    {/* Info */}
                                                    <div className="flex flex-col min-w-0 flex-1">
                                                        <span className="text-[11px] font-bold truncate text-slate-900">{p.title}</span>
                                                        <span className="text-[9px] text-slate-400 font-medium">
                                                            €{p.variants[0]?.price || "—"}
                                                        </span>
                                                    </div>

                                                    {/* Badge */}
                                                    {p.ecomBoomId ? (
                                                        <span style={{
                                                            fontSize: "9px", fontWeight: 700, padding: "2px 6px",
                                                            borderRadius: "10px", background: "#ede9fe", color: "#7c3aed",
                                                            flexShrink: 0, whiteSpace: "nowrap"
                                                        }}>Research ✓</span>
                                                    ) : (
                                                        <span style={{
                                                            fontSize: "9px", fontWeight: 700, padding: "2px 6px",
                                                            borderRadius: "10px", background: "#f1f5f9", color: "#94a3b8",
                                                            flexShrink: 0, whiteSpace: "nowrap"
                                                        }}>Sin research</span>
                                                    )}

                                                    {isActive && <Check className="w-3 h-3 ml-1 text-violet-500 shrink-0" />}
                                                </DropdownMenuItem>
                                            );
                                        })
                                    )
                                ) : (
                                    /* ── Fallback: EcomBoom-only products ── */
                                    (filteredProducts as typeof allProducts).map((p) => (
                                        <DropdownMenuItem
                                            key={p.id}
                                            onClick={() => setProductId(p.id)}
                                            className={cn(
                                                "flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all mb-1",
                                                productId === p.id ? "bg-rose-50 border border-rose-100" : "hover:bg-slate-50 border border-transparent"
                                            )}
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                                                {p.imageUrl ? (
                                                    <Image
                                                        src={p.imageUrl}
                                                        alt={p.title || "Product"}
                                                        width={32}
                                                        height={32}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <Package className="w-3.5 h-3.5 text-slate-300" />
                                                )}
                                            </div>
                                            <div className="flex flex-col min-w-0 flex-1">
                                                <span className="text-[11px] font-bold truncate text-slate-900">{p.title}</span>
                                                <span className="text-[9px] text-slate-400 font-medium uppercase tracking-tighter">{p.status}</span>
                                            </div>
                                            {productId === p.id && <Check className="w-3 h-3 ml-auto text-primary" />}
                                        </DropdownMenuItem>
                                    ))
                                )}
                            </ScrollArea>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* KPI Pills - Glass Style */}
                    {product && (
                        <div className="hidden lg:flex items-center gap-1.5 p-1 glass-panel rounded-xl shadow-sm">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/80 rounded-lg shadow-xs border border-white/50">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em]">ROAS BE</span>
                                <span className="text-[11px] font-black text-rose-500 italic">{(product as any).roasBE || "2.40"}</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/80 rounded-lg shadow-xs border border-white/50">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em]">CPA BE</span>
                                <span className="text-[11px] font-black text-slate-900 italic">{(product as any).cpaBE || "12.50"}€</span>
                            </div>
                        </div>
                    )}

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
                            <DropdownMenuContent align="end" className="w-[200px] glass-card p-1.5 z-[70] border-none rounded-2xl shadow-xl">
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

