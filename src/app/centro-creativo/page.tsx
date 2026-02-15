"use client";

import React, { useState } from "react";
import { useProduct } from "@/context/ProductContext";
import {
    Layout,
    Video,
    Users,
    Grid3X3,
    Bot,
    FileText,
    Sparkles,
    AlertCircle,
    Clapperboard,
    BookOpen,
    Rocket
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MarketingHubClient } from "@/components/marketing/MarketingHubClient";
import { LandingLabModule } from "@/components/marketing/LandingLabModule";
import { VideoLabModule } from "@/components/marketing/VideoLabModule";
import { AvatarsLabModule } from "@/components/marketing/AvatarsLabModule";
import { ClowdbotLabModule } from "@/components/marketing/ClowdbotLabModule";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCreative } from "@/hooks/useCreative";
import { CreativeHeader } from "@/components/creative/CreativeHeader";
import { AssetGrid } from "@/components/creative/AssetGrid";
import { AssetDetailModal } from "@/components/creative/AssetDetailModal";
import { ds } from "@/lib/styles/design-system";

export default function CentroCreativoPage() {
    const { productId, product, allProducts } = useProduct();
    const [activeTab, setActiveTab] = useState("landings");
    const [selectedAsset, setSelectedAsset] = useState<any>(null);

    // We reuse logic from MarketingHub but presenting it with the new layout
    const { creativeData, loading, generating, generateVideos, performAction } = useCreative(productId || "");

    if (!productId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center animate-in fade-in duration-700">
                <div className="w-16 h-16 bg-indigo-50 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-indigo-500" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-lg font-black text-slate-900 tracking-tight italic uppercase">Factoría Creativa</h2>
                    <p className="text-sm text-slate-500 max-w-sm mx-auto font-medium">Selecciona un producto para acceder a todas las herramientas de creación.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] space-y-4">
            {/* Header / Nav */}
            <div className="bg-white rounded-lg border border-slate-200 px-4 py-3 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center shadow-md shadow-slate-200">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="text-xs font-black text-slate-900 uppercase tracking-tighter leading-none italic">Centro <span className="text-indigo-600 not-italic">Creativo</span></h1>
                        <p className="text-[8px] text-slate-400 font-black uppercase tracking-[0.1em] mt-1 shrink-0">Creative Hub & AI Factory</p>
                    </div>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                <div className="px-0.5 py-0.5 bg-slate-100 border border-slate-200 rounded-lg mb-3 shadow-xs inline-flex overflow-x-auto no-scrollbar max-w-full">
                    <TabsList className="bg-transparent h-8 gap-0.5">
                        {[
                            { value: 'landings', icon: Layout, label: 'LANDING BUILDER' },
                            { value: 'advertorials', icon: FileText, label: 'ADVERTORIAL BUILDER' },
                            { value: 'listicles', icon: BookOpen, label: 'LISTICLE BUILDER' },
                            { value: 'avatars', icon: Users, label: 'AVATARES IA' },
                            { value: 'video', icon: Video, label: 'VIDEO EDITOR' },
                            { value: 'library', icon: Grid3X3, label: 'LIBRARY' },
                        ].map((t) => (
                            <TabsTrigger key={t.value} value={t.value} className="rounded-md px-3 py-1 text-[8px] font-black uppercase tracking-widest data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all whitespace-nowrap">
                                <t.icon className="w-3 h-3 mr-1.5" />
                                {t.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>

                <div className="flex-1 bg-white rounded-lg border border-slate-200 shadow-xl shadow-slate-200/50 flex flex-col min-h-0 overflow-hidden relative">
                    <ScrollArea className="flex-1">
                        <div className="p-4">
                            <TabsContent value="landings" className="m-0 animate-in fade-in duration-500">
                                <LandingLabModule productId={productId} productTitle={product?.title} />
                            </TabsContent>

                            <TabsContent value="advertorials" className="m-0 animate-in fade-in duration-500">
                                <ClowdbotLabModule />
                            </TabsContent>

                            <TabsContent value="listicles" className="m-0 animate-in fade-in duration-500">
                                <div className="py-10 text-center space-y-4">
                                    <BookOpen className="w-12 h-12 text-slate-200 mx-auto" />
                                    <div>
                                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Listicle Builder</h3>
                                        <p className="text-xs text-slate-300 italic mt-1">Configura estructuras de comparación y recomendaciones.</p>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="avatars" className="m-0 animate-in fade-in duration-500">
                                <AvatarsLabModule />
                            </TabsContent>

                            <TabsContent value="video" className="m-0 animate-in fade-in duration-500">
                                <VideoLabModule productId={productId} productTitle={product?.title} allProducts={allProducts} />
                            </TabsContent>

                            <TabsContent value="library" className="m-0 space-y-4 animate-in fade-in duration-500">
                                <CreativeHeader
                                    stats={creativeData?.stats || { totalSpend: 0, totalRevenue: 0, avgCtr: 0, count: 0 }}
                                    onGenerate={() => generateVideos({ maxVideos: 3 })}
                                    onUpload={() => { }}
                                    isGenerating={generating}
                                />
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <h2 className={ds.typography.h2}>Biblioteca de Activos</h2>
                                        <span className="px-2 py-0.5 bg-slate-200 text-slate-600 text-[8px] font-black rounded-md uppercase">
                                            {creativeData?.assets?.length || 0} Archivos
                                        </span>
                                    </div>
                                    <AssetGrid assets={creativeData?.assets || []} onAssetClick={setSelectedAsset} />
                                </div>
                            </TabsContent>
                        </div>
                    </ScrollArea>
                </div>
            </Tabs>

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
    );
}
