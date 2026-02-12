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
                <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center">
                    <Sparkles className="w-10 h-10 text-indigo-500" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight italic uppercase">Factoría Creativa</h2>
                    <p className="text-slate-500 max-w-sm mx-auto font-medium">Selecciona un producto para acceder a todas las herramientas de creación.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] space-y-4">
            {/* Header / Nav */}
            <div className="bg-white rounded-3xl border border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-100/50">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-sm font-black text-slate-900 uppercase tracking-tighter leading-none">Centro Creativo</h1>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Creative Hub & AI Factory</p>
                    </div>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                <div className="px-1 py-1 bg-white border border-slate-200 rounded-2xl mb-4 shadow-sm inline-flex overflow-x-auto no-scrollbar max-w-full">
                    <TabsList className="bg-transparent h-9 gap-1">
                        <TabsTrigger value="landings" className="rounded-xl px-4 py-1.5 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all whitespace-nowrap">
                            <Layout className="w-3.5 h-3.5 mr-2" />
                            Landing Builder
                        </TabsTrigger>
                        <TabsTrigger value="advertorials" className="rounded-xl px-4 py-1.5 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all whitespace-nowrap">
                            <FileText className="w-3.5 h-3.5 mr-2" />
                            Advertorial Builder
                        </TabsTrigger>
                        <TabsTrigger value="listicles" className="rounded-xl px-4 py-1.5 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all whitespace-nowrap">
                            <BookOpen className="w-3.5 h-3.5 mr-2" />
                            Listicle Builder
                        </TabsTrigger>
                        <TabsTrigger value="avatars" className="rounded-xl px-4 py-1.5 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all whitespace-nowrap">
                            <Users className="w-3.5 h-3.5 mr-2" />
                            Avatares IA
                        </TabsTrigger>
                        <TabsTrigger value="video" className="rounded-xl px-4 py-1.5 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all whitespace-nowrap">
                            <Video className="w-3.5 h-3.5 mr-2" />
                            Editor Vídeo
                        </TabsTrigger>
                        <TabsTrigger value="library" className="rounded-xl px-4 py-1.5 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all whitespace-nowrap">
                            <Grid3X3 className="w-3.5 h-3.5 mr-2" />
                            Biblioteca
                        </TabsTrigger>
                    </TabsList>
                </div>

                <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50 flex flex-col min-h-0 overflow-hidden relative">
                    <ScrollArea className="flex-1">
                        <div className="p-8">
                            <TabsContent value="landings" className="m-0 animate-in fade-in duration-500">
                                <LandingLabModule productId={productId} productTitle={product?.title} />
                            </TabsContent>

                            <TabsContent value="advertorials" className="m-0 animate-in fade-in duration-500">
                                <ClowdbotLabModule />
                            </TabsContent>

                            <TabsContent value="listicles" className="m-0 animate-in fade-in duration-500">
                                <div className="py-20 text-center space-y-4">
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

                            <TabsContent value="library" className="m-0 space-y-8 animate-in fade-in duration-500">
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
