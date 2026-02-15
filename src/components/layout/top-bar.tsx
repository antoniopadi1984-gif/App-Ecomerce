"use client";

import React, { useState } from "react";
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
    Store
} from "lucide-react";
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

export function TopBar({ onMenuClick }: { onMenuClick?: () => void }) {
    const { product, allProducts, productId, setProductId } = useProduct();
    const { activeStoreId, activeStore, stores, setActiveStoreId } = useStore();
    const [search, setSearch] = useState("");

    const filteredProducts = allProducts.filter(p =>
        p.title?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <header className="fixed top-0 left-0 right-0 z-40 h-14 bg-white border-b border-slate-200 transition-all duration-300">
            <div className="h-full px-4 flex items-center gap-3">

                {/* ═══ ZONE LEFT: Selectors (shrinkable with truncation) ═══ */}
                <div className="flex items-center gap-2 min-w-0 shrink" style={{ maxWidth: '42%' }}>
                    <Button variant="ghost" size="icon" className="md:hidden shrink-0" onClick={onMenuClick}>
                        <Menu className="w-5 h-5 text-slate-600" />
                    </Button>

                    {/* ── Store Selector ── */}
                    {stores.length > 1 && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="flex items-center gap-1.5 px-2 py-1.5 bg-indigo-50/70 border border-indigo-200/50 rounded-xl hover:bg-indigo-100/70 transition-all group shrink min-w-0 max-w-[160px]">
                                    <div className="w-5 h-5 rounded-md bg-indigo-100 flex items-center justify-center shrink-0">
                                        <Store className="w-3 h-3 text-indigo-600" />
                                    </div>
                                    <div className="flex flex-col items-start min-w-0">
                                        <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-0.5">Tienda</span>
                                        <span className="text-[11px] font-bold text-indigo-700 truncate max-w-full tracking-tight leading-none">
                                            {activeStore?.name || "Seleccionar..."}
                                        </span>
                                    </div>
                                    <ChevronDown className="w-3 h-3 text-indigo-400 group-hover:text-indigo-600 transition-colors shrink-0" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-[240px] bg-white border-slate-200 shadow-2xl rounded-2xl p-2 z-[70]">
                                <DropdownMenuLabel className="px-3 py-2">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Cambiar Tienda</span>
                                </DropdownMenuLabel>
                                {stores.map((s) => (
                                    <DropdownMenuItem
                                        key={s.id}
                                        onClick={() => setActiveStoreId(s.id)}
                                        className={cn(
                                            "flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all mb-0.5",
                                            activeStoreId === s.id ? "bg-indigo-50 text-indigo-700" : "hover:bg-slate-50"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                                            activeStoreId === s.id ? "bg-indigo-100" : "bg-slate-100"
                                        )}>
                                            <Store className={cn(
                                                "w-3.5 h-3.5",
                                                activeStoreId === s.id ? "text-indigo-600" : "text-slate-400"
                                            )} />
                                        </div>
                                        <div className="flex flex-col min-w-0 flex-1">
                                            <span className="text-[11px] font-bold truncate">{s.name}</span>
                                            {s.domain && <span className="text-[9px] text-slate-400 font-medium truncate">{s.domain}</span>}
                                        </div>
                                        {activeStoreId === s.id && <Check className="w-3 h-3 ml-auto text-indigo-600" />}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}

                    {/* ── Context / Product Selector ── */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-all group shrink min-w-0 max-w-[220px]">
                                <div className="w-6 h-6 rounded-md bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                                    {(productId === 'GLOBAL' || !product) ? (
                                        <LayoutDashboard className="w-3 h-3 text-indigo-600" />
                                    ) : product.imageUrl ? (
                                        <img src={product.imageUrl} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <Package className="w-3 h-3 text-slate-400" />
                                    )}
                                </div>
                                <div className="flex flex-col items-start min-w-0">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Contexto</span>
                                    <span className="text-[11px] font-bold text-slate-700 truncate max-w-full tracking-tight leading-none">
                                        {productId === 'GLOBAL' ? "Global Store" : product?.title || "Seleccionar..."}
                                    </span>
                                </div>
                                <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600 transition-colors shrink-0" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-[280px] bg-white border-slate-200 shadow-2xl rounded-2xl p-2 z-[70]">
                            <DropdownMenuLabel className="px-3 py-2">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Cambiar Producto</span>
                            </DropdownMenuLabel>

                            <div className="px-2 pb-2">
                                <div className="relative">
                                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                                    <Input
                                        placeholder="Buscar..."
                                        className="h-8 pl-7 text-[11px] bg-slate-50 border-none rounded-lg"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </div>
                            </div>

                            <ScrollArea className="h-[300px] px-1">
                                <DropdownMenuItem
                                    onClick={() => setProductId('GLOBAL')}
                                    className={cn(
                                        "flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all mb-1",
                                        productId === 'GLOBAL' ? "bg-indigo-50 text-indigo-700" : "hover:bg-slate-50"
                                    )}
                                >
                                    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                                        <LayoutDashboard className="w-4 h-4 text-indigo-600" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[11px] font-bold">Contexto Global</span>
                                        <span className="text-[9px] text-slate-400 font-medium">Ver todos los productos</span>
                                    </div>
                                    {productId === 'GLOBAL' && <Check className="w-3 h-3 ml-auto text-indigo-600" />}
                                </DropdownMenuItem>

                                <DropdownMenuSeparator className="bg-slate-100 my-2" />

                                {filteredProducts.map((p) => (
                                    <DropdownMenuItem
                                        key={p.id}
                                        onClick={() => setProductId(p.id)}
                                        className={cn(
                                            "flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all mb-1",
                                            productId === p.id ? "bg-indigo-50 text-indigo-700" : "hover:bg-slate-50"
                                        )}
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                                            {p.imageUrl ? (
                                                <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <Package className="w-3.5 h-3.5 text-slate-300" />
                                            )}
                                        </div>
                                        <div className="flex flex-col min-w-0 flex-1">
                                            <span className="text-[11px] font-bold truncate">{p.title}</span>
                                            <span className="text-[9px] text-slate-400 font-medium uppercase tracking-tighter">{p.status}</span>
                                        </div>
                                        {productId === p.id && <Check className="w-3 h-3 ml-auto text-indigo-600" />}
                                    </DropdownMenuItem>
                                ))}
                            </ScrollArea>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* ═══ ZONE CENTER: Flexible spacer ═══ */}
                <div className="flex-1 min-w-0" />

                {/* ═══ ZONE RIGHT: KPIs + Icons (never shrinks) ═══ */}
                <div className="flex items-center gap-3 shrink-0">

                    {/* KPI Pills */}
                    {product && (
                        <div className="hidden lg:flex items-center gap-4 px-3 py-1.5 bg-slate-900 rounded-2xl shadow-lg shadow-slate-100">
                            <div className="flex flex-col items-center px-1.5 border-r border-slate-800">
                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter leading-none mb-0.5">ROAS BE</span>
                                <span className="text-[11px] font-bold text-emerald-400 leading-none whitespace-nowrap">{(product as any).roasBE || "2.40"}</span>
                            </div>
                            <div className="flex flex-col items-center px-1.5 border-r border-slate-800">
                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter leading-none mb-0.5">CPA BE</span>
                                <span className="text-[11px] font-bold text-blue-400 leading-none whitespace-nowrap">{(product as any).cpaBE || "12.50"}€</span>
                            </div>
                            <div className="flex flex-col items-center px-1.5">
                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter leading-none mb-0.5">CPC Max</span>
                                <span className="text-[11px] font-bold text-amber-400 leading-none whitespace-nowrap">{(product as any).cpcMax || "0.45"}€</span>
                            </div>
                        </div>
                    )}

                    {/* Action Icons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                        <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors relative">
                            <Bell className="w-4 h-4" />
                            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-rose-500 rounded-full border-2 border-white" />
                        </Button>

                        <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                            <Settings className="w-4 h-4" />
                        </Button>

                        <div className="w-8 h-8 rounded-xl bg-slate-100 p-0.5 cursor-pointer hover:shadow-md transition-all border border-slate-200 ml-1">
                            <div className="w-full h-full rounded-[9px] bg-white flex items-center justify-center overflow-hidden">
                                <img src="https://github.com/shadcn.png" alt="Profile" className="w-full h-full object-cover" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}

