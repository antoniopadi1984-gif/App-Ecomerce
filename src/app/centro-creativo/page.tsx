"use client";

import React, { useState } from "react";
import { useProduct } from "@/context/ProductContext";
import {
    Layout, Video, Users, Grid3X3, Bot, FileText, Sparkles, AlertCircle,
    Clapperboard, BookOpen, Rocket, Zap, MessageSquare, Compass, RefreshCw,
    Settings, Brain, ShieldCheck, Target, Link2, Image
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CreativeFactoryPanel } from "@/components/creative/CreativeFactoryPanel";
import { LandingLabModule } from "@/components/marketing/LandingLabModule";
import { VideoLabModule } from "@/components/marketing/VideoLabModule";
import { StaticAdsModule } from "@/components/marketing/StaticAdsModule";
import { ResourcesModule } from "@/components/marketing/ResourcesModule";
import { AgencyControlPanel } from "@/components/creative/AgencyControlPanel";
import { CreativeHeader } from "@/components/creative/CreativeHeader";
import { AssetGrid } from "@/components/creative/AssetGrid";
import { AssetDetailModal } from "@/components/creative/AssetDetailModal";
import { BibliotecaModule } from "@/components/creative/BibliotecaModule";
import { useCreative } from "@/hooks/useCreative";
import { ds } from "@/lib/styles/design-system";
import { PageShell } from "@/components/ui/PageShell";
import { ModuleHeader } from "@/components/ui/ModuleHeader";
import Link from "next/link";
import { useStore } from "@/lib/store/store-context";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────
   TAB CONFIG
   ───────────────────────────────────── */
const CREATIVE_TABS = [
    { id: "landing", icon: Brain, label: "Landing Builder", color: "from-rose-600 to-blue-600" },
    { id: "static", icon: Image, label: "Ads Estáticos", color: "from-amber-600 to-orange-600" },
    { id: "video", icon: Zap, label: "Video Lab", color: "from-violet-600 to-purple-600" },
    { id: "resources", icon: BookOpen, label: "Recursos", color: "from-cyan-600 to-sky-600" },
    { id: "library", icon: Clapperboard, label: "Biblioteca", color: "from-slate-700 to-slate-900" },
] as const;

type TabId = typeof CREATIVE_TABS[number]["id"];

export default function CentroCreativoPage() {
    const { activeStoreId: storeId } = useStore();
    const { productId, product, allProducts } = useProduct();
    const [activeTab, setActiveTab] = useState<TabId>("landing");
    const [selectedAsset, setSelectedAsset] = useState<any>(null);
    const [metaConnected, setMetaConnected] = useState<boolean | null>(null);

    React.useEffect(() => {
        if (storeId) {
            fetch(`/api/connections/status?storeId=${storeId}&service=META_ADS`)
                .then(res => res.json())
                .then(data => setMetaConnected(data.isConnected))
                .catch(() => setMetaConnected(false));
        }
    }, [storeId]);

    const { creativeData, loading, generating, generateVideos, performAction } = useCreative(productId || "");

    if (!productId) {
        return (
            <PageShell>
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center animate-in fade-in duration-700">
                    <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center shadow-sm">
                        <Sparkles className="w-8 h-8 text-rose-500" />
                    </div>
                    <div className="space-y-2 text-center">
                        <h2 className="text-lg font-black text-slate-900 tracking-tight italic uppercase">Factoría Creativa</h2>
                        <p className="text-sm text-slate-500 max-w-sm mx-auto font-medium">Selecciona un producto para acceder a todas las herramientas de creación.</p>
                    </div>
                </div>
            </PageShell>
        );
    }

    return (
        <PageShell>
            <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 px-1 pt-3 pb-2">
                    <div className="space-y-1">
                        <Badge className="bg-slate-900 text-white border-none font-black text-[7px] uppercase tracking-[0.2em] px-2 py-0.5 rounded-sm">
                            Creative OS v4.0
                        </Badge>
                        <h1 className="text-lg font-black tracking-tighter italic uppercase text-slate-900 leading-none flex items-center gap-2">
                            <Brain className="h-4 w-4" /> CENTRO <span className="text-slate-400">CREATIVO</span>
                        </h1>
                        <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400">{product?.title} • Protocolo Unificado</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex gap-1 items-center bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                            {["Respuesta Directa", "Alto CTR"].map(tag => (
                                <span key={tag} className="text-slate-400 text-[7px] font-black uppercase tracking-widest border-r border-slate-200 last:border-none pr-1.5 last:pr-0">{tag}</span>
                            ))}
                        </div>
                        <IntelligenceBadge icon={Target} value="Impulsivos" />
                        <IntelligenceBadge icon={Zap} value="Élite" />
                        {/* Meta connection status - non-blocking */}
                        {metaConnected === false && (
                            <Link href="/connections">
                                <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-lg px-2 py-0.5 cursor-pointer hover:bg-amber-100 transition-colors">
                                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                                    <span className="text-[7px] font-black uppercase tracking-widest text-amber-700">Meta Offline</span>
                                </div>
                            </Link>
                        )}
                        {metaConnected === true && (
                            <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-lg px-2 py-0.5">
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                <span className="text-[7px] font-black uppercase tracking-widest text-emerald-700">Meta Live</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* TAB BAR — Premium gradient style */}
                <div className="flex gap-1 p-1 bg-slate-100/80 rounded-lg mx-1 mb-2 border border-slate-200/60">
                    {CREATIVE_TABS.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-[8px] font-black uppercase tracking-widest transition-all duration-300",
                                    isActive
                                        ? `bg-gradient-to-r ${tab.color} text-white shadow-sm`
                                        : "text-slate-500 hover:text-slate-900 hover:bg-white/60"
                                )}
                            >
                                <Icon className="h-3 w-3" />
                                <span className="hidden lg:inline">{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* TAB CONTENT */}
                <div className="flex-1 overflow-hidden relative">
                    <ScrollArea className="h-full">
                        <div className="px-1 pb-4">
                            {activeTab === "landing" && <LandingLabModule productId={productId} productTitle={product?.title} storeId={storeId || ''} />}
                            {activeTab === "static" && <StaticAdsModule productId={productId} productTitle={product?.title} storeId={storeId || ''} />}
                            {activeTab === "video" && <VideoLabModule productId={productId} productTitle={product?.title} allProducts={allProducts} storeId={storeId || ''} />}
                            {activeTab === "resources" && <ResourcesModule productId={productId} productTitle={product?.title} storeId={storeId || ''} />}
                            {activeTab === "library" && (
                                <BibliotecaModule
                                    storeId={storeId || ''}
                                    productId={productId}
                                    productTitle={product?.title}
                                />
                            )}
                        </div>
                    </ScrollArea>

                    {selectedAsset && (
                        <AssetDetailModal
                            asset={selectedAsset}
                            onClose={() => setSelectedAsset(null)}
                            onAudit={(id) => performAction('AUDIT', { id })}
                            onClip={(id) => performAction('CLIP', { id })}
                            isLoading={loading}
                        />
                    )}
                </div>
            </div>
        </PageShell>
    );
}

function IntelligenceBadge({ icon: Icon, value }: { icon: any, value: string }) {
    return (
        <div className="bg-white border border-slate-200 rounded-lg px-2 py-0.5 flex items-center gap-1.5 shadow-xs">
            <Icon className="w-2.5 h-2.5 text-rose-500" />
            <span className="text-[8px] font-black uppercase tracking-widest text-slate-600">{value}</span>
        </div>
    );
}
