"use client";

import React, { useState } from "react";
import { useProduct } from "@/context/ProductContext";
import { useCreative } from "@/hooks/useCreative";
import { CreativeHeader } from "@/components/creative/CreativeHeader";
import { AssetGrid } from "@/components/creative/AssetGrid";
import { AssetDetailModal } from "@/components/creative/AssetDetailModal";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Loader2,
    Clapperboard,
    Video,
    Sparkles,
    AlertCircle
} from "lucide-react";

import { t } from "@/lib/constants/translations";
import { PremiumCard } from "@/components/ui/premium-card";
import { ds } from "@/lib/styles/design-system";

import { MarketingHubClient } from "@/components/marketing/MarketingHubClient";

export default function CreativeFactoryPage() {
    const { productId, product, allProducts } = useProduct();

    if (!productId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center animate-in fade-in duration-700 p-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center border border-indigo-100 shadow-sm">
                    <AlertCircle className="w-6 h-6 text-indigo-500" />
                </div>
                <div className="space-y-1">
                    <h2 className="text-lg font-black text-slate-900 tracking-tighter italic uppercase">Contexto Requerido</h2>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[9px] max-w-xs mx-auto">Selecciona un producto en el menú lateral para acceder al Marketing Hub.</p>
                </div>
                <div className="flex gap-2">
                    <div className="flex -space-x-2 overflow-hidden p-1">
                        {allProducts.slice(0, 3).map((p) => (
                            <div key={p.id} className="inline-block h-8 w-8 rounded-lg ring-2 ring-white shadow-sm overflow-hidden bg-slate-100 border border-slate-200">
                                {p.imageUrl ? <img src={p.imageUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-400 font-black text-[10px]">?</div>}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-50 min-h-screen">
            <MarketingHubClient
                productId={productId}
                productTitle={product?.title}
                allProducts={allProducts}
            />
        </div>
    );
}
