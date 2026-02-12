"use client";

import React from "react";
import {
    Search,
    Bell,
    Settings,
    Menu,
    Store,
    Command,
    Plus,
    TrendingUp,
    Zap,
    Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useProduct } from "@/context/ProductContext";

export function TopBar({ onMenuClick }: { onMenuClick?: () => void }) {
    const { product } = useProduct();

    return (
        <header className="fixed top-0 left-0 right-0 z-40 h-14 bg-white border-b border-slate-200 transition-all duration-300">
            <div className="h-full px-4 flex items-center justify-between gap-4">
                {/* Left Area: Mobile Menu & Search */}
                <div className="flex items-center gap-4 flex-1">
                    <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
                        <Menu className="w-5 h-5 text-slate-600" />
                    </Button>

                    <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200/60 rounded-xl px-3 py-1 w-full max-w-[240px] group focus-within:bg-white focus-within:border-blue-200 transition-all">
                        <Search className="w-3.5 h-3.5 text-slate-400" />
                        <Input
                            placeholder="Buscar... (⌘ + K)"
                            className="border-0 bg-transparent h-6 focus-visible:ring-0 p-0 text-xs placeholder:text-slate-400"
                        />
                    </div>
                </div>

                {/* Center Area: Financial KPI Bar (Preservation Rule) */}
                {product && (
                    <div className="hidden lg:flex items-center gap-6 px-4 py-1.5 bg-slate-900 rounded-2xl shadow-lg shadow-slate-100 animate-in fade-in zoom-in duration-500">
                        <div className="flex flex-col items-center px-2 border-r border-slate-800">
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter leading-none mb-0.5">ROAS BE</span>
                            <span className="text-[11px] font-bold text-emerald-400 leading-none">{(product as any).roasBE || "2.40"}</span>
                        </div>
                        <div className="flex flex-col items-center px-2 border-r border-slate-800">
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter leading-none mb-0.5">CPA BE</span>
                            <span className="text-[11px] font-bold text-blue-400 leading-none">{(product as any).cpaBE || "12.50"}€</span>
                        </div>
                        <div className="flex flex-col items-center px-2">
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter leading-none mb-0.5">CPC Max</span>
                            <span className="text-[11px] font-bold text-amber-400 leading-none">{(product as any).cpcMax || "0.45"}€</span>
                        </div>
                    </div>
                )}

                {/* Right Area: Notifications & Profile */}
                <div className="flex items-center gap-2">
                    <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors relative">
                        <Bell className="w-4 h-4" />
                        <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-rose-500 rounded-full border-2 border-white" />
                    </Button>

                    <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                        <Settings className="w-4 h-4" />
                    </Button>

                    <div className="w-8 h-8 rounded-xl bg-slate-100 p-0.5 cursor-pointer hover:shadow-md transition-all border border-slate-200 ml-2">
                        <div className="w-full h-full rounded-[9px] bg-white flex items-center justify-center overflow-hidden">
                            <img src="https://github.com/shadcn.png" alt="Profile" className="w-full h-full object-cover" />
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}

