
"use client";

import React, { useState } from "react";
import { useProduct } from "@/context/ProductContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
    Facebook,
    Instagram,
    Play,
    Layout,
    TrendingUp,
    Sparkles,
    AlertCircle,
    Package,
    ArrowUpRight,
    Search,
    Filter
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import { PageShell } from "@/components/ui/PageShell";
import { ModuleHeader } from "@/components/ui/ModuleHeader";

// Lazy Load Heavy Components
const FacebookAdsPage = dynamic(() => import("./facebook-ads/page"), {
    loading: () => (
        <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    ),
});

const PLATFORMS = [
    { id: 'meta', label: 'Meta Ads', icon: Facebook, color: 'text-blue-600', activeBg: 'bg-blue-50' },
    { id: 'tiktok', label: 'TikTok Ads', icon: Play, color: 'text-black', activeBg: 'bg-slate-100' },
    { id: 'google', label: 'Google Ads', icon: Layout, color: 'text-red-500', activeBg: 'bg-red-50' },
    { id: 'pinterest', label: 'Pinterest', icon: Instagram, color: 'text-rose-600', activeBg: 'bg-rose-50' },
];

export default function AdsManagerPage() {
    const { productId, product, allProducts } = useProduct();
    const [activePlatform, setActivePlatform] = useState('meta');

    if (!productId || productId === 'GLOBAL') {
        return (
            <PageShell>
                <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6 text-center animate-in fade-in duration-700 p-4">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 shadow-sm">
                        <Sparkles className="w-8 h-8 text-slate-300" />
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-sm font-black text-slate-900 uppercase italic">Contexto Requerido</h2>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest max-w-xs mx-auto">Selecciona un producto relevante en la barra superior.</p>
                    </div>
                    <div className="flex -space-x-2 overflow-hidden p-1 opacity-50 grayscale">
                        {allProducts.slice(0, 5).map((p) => (
                            <div key={p.id} className="inline-block h-8 w-8 rounded-lg ring-2 ring-white shadow-sm overflow-hidden bg-slate-50 border border-slate-100 relative">
                                {p.imageUrl ? (
                                    <Image
                                        src={p.imageUrl}
                                        alt={p.title || "Product"}
                                        fill
                                        sizes="32px"
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300 font-black text-[10px]">?</div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </PageShell>
        );
    }

    return (
        <PageShell>
            <ModuleHeader
                title="Gestión de Publicidad"
                subtitle={`Ads Manager Pro / ${product?.title}`}
                icon={TrendingUp}
                actions={
                    <div className="bg-white/50 p-1 rounded-xl border border-slate-200/50 inline-flex w-fit shadow-xs">
                        <Tabs value={activePlatform} onValueChange={setActivePlatform} className="w-fit">
                            <TabsList className="bg-transparent h-8 p-0 gap-1">
                                {PLATFORMS.map((p) => (
                                    <TabsTrigger
                                        key={p.id}
                                        value={p.id}
                                        className={cn(
                                            "h-6 px-3 border-none rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                                            "data-[state=active]:shadow-sm data-[state=active]:bg-white",
                                            p.id === 'meta' && "data-[state=active]:text-blue-600",
                                            p.id === 'tiktok' && "data-[state=active]:text-black",
                                            p.id === 'google' && "data-[state=active]:text-red-500",
                                            p.id === 'pinterest' && "data-[state=active]:text-rose-600",
                                            "text-slate-400"
                                        )}
                                    >
                                        <p.icon className={cn("w-3 h-3 mr-1.5", activePlatform === p.id ? p.color : "text-slate-300")} />
                                        {p.label}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </Tabs>
                    </div>
                }
            />

            <div className="flex-1 overflow-hidden p-6">
                {activePlatform === 'meta' ? (
                    <FacebookAdsPage />
                ) : (
                    <div className="glass-card h-full rounded-2xl flex flex-col items-center justify-center text-center p-12 animate-in fade-in duration-500 border-none">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                            {PLATFORMS.find(p => p.id === activePlatform)?.icon &&
                                React.createElement(PLATFORMS.find(p => p.id === activePlatform)!.icon, { className: "w-10 h-10 text-slate-200" })
                            }
                        </div>
                        <h3 className="text-lg font-black text-slate-900 uppercase italic tracking-tight">API {PLATFORMS.find(p => p.id === activePlatform)?.label} en Conexión</h3>
                        <p className="text-sm text-slate-500 font-medium max-w-sm mt-2">Estamos integrando los Webhooks avanzados para traer datos en tiempo real.</p>
                        <Badge className="mt-6 bg-rose-50 text-primary border-none font-black text-[9px] uppercase tracking-[0.2em] px-3">Próximamente</Badge>
                    </div>
                )}
            </div>
        </PageShell>
    );
}
