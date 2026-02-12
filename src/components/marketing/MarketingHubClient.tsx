"use client";

import React, { useState } from "react";
import {
    Video,
    FileText,
    Layout,
    Sparkles,
    Grid3X3,
    BrainCircuit,
    Layers,
    Bot,
    Facebook,
    TrendingUp,
    Users
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useCreative } from "@/hooks/useCreative";
import { CreativeHeader } from "@/components/creative/CreativeHeader";
import { AssetGrid } from "@/components/creative/AssetGrid";
import { AssetDetailModal } from "@/components/creative/AssetDetailModal";
import { CopyHubModule } from "./CopyHubModule";
import { LandingLabModule } from "./LandingLabModule";
import { VideoLabModule } from "./VideoLabModule";
import { AdSpyModule } from "./AdSpyModule";
import { AvatarsLabModule } from "./AvatarsLabModule";
import { PerformanceModule } from "./PerformanceModule";
import { ClowdbotLabModule } from "./ClowdbotLabModule";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ds } from "@/lib/styles/design-system";
import { t } from "@/lib/constants/translations";
import { cn } from "@/lib/utils";

interface MarketingHubClientProps {
    productId: string;
    productTitle?: string;
    allProducts?: any[];
}

export function MarketingHubClient({ productId, productTitle, allProducts = [] }: MarketingHubClientProps) {
    const [activeTab, setActiveTab] = useState("assets");
    const [selectedAsset, setSelectedAsset] = useState<any>(null);
    const { creativeData, loading, generating, generateVideos, performAction } = useCreative(productId);

    return (
        <div className="flex flex-col h-[calc(100vh-100px)]">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <div className="px-6 py-4 bg-white/50 backdrop-blur-md border-b border-slate-200">
                    <TabsList className="bg-slate-100/50 p-1 rounded-lg border border-slate-200 h-10 w-fit gap-1">
                        <TabsTrigger value="assets" className="px-4 h-8 rounded-md font-black text-[9px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm transition-all flex gap-1.5">
                            <Grid3X3 className="w-3.5 h-3.5" /> Activos
                        </TabsTrigger>
                        <TabsTrigger value="video" className="px-4 h-8 rounded-md font-black text-[9px] uppercase tracking-widest data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-sm transition-all flex gap-1.5">
                            <Video className="w-3.5 h-3.5" /> Video Lab
                        </TabsTrigger>
                        <TabsTrigger value="copy" className="px-4 h-8 rounded-md font-black text-[9px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm transition-all flex gap-1.5">
                            <FileText className="w-3.5 h-3.5" /> Copy Hub
                        </TabsTrigger>
                        <TabsTrigger value="adspy" className="px-4 h-8 rounded-md font-black text-[9px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm transition-all flex gap-1.5">
                            <Facebook className="w-3.5 h-3.5" /> Ad Spy
                        </TabsTrigger>
                        <TabsTrigger value="landings" className="px-4 h-8 rounded-md font-black text-[9px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm transition-all flex gap-1.5">
                            <Layout className="w-3.5 h-3.5" /> Landing Lab
                        </TabsTrigger>
                        <TabsTrigger value="avatars" className="px-4 h-8 rounded-md font-black text-[9px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm transition-all flex gap-1.5">
                            <Users className="w-3.5 h-3.5" /> Avatars Lab
                        </TabsTrigger>
                        <TabsTrigger value="performance" className="px-4 h-8 rounded-md font-black text-[9px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm transition-all flex gap-1.5">
                            <TrendingUp className="w-3.5 h-3.5" /> Rendimiento
                        </TabsTrigger>
                        <TabsTrigger value="clowdbot" className="px-4 h-8 rounded-md font-black text-[9px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm transition-all flex gap-1.5">
                            <Bot className="w-3.5 h-3.5" /> Clowdbot
                        </TabsTrigger>
                    </TabsList>
                </div>

                <div className="flex-1 overflow-hidden">
                    <ScrollArea className="h-full">
                        <div className="p-8 max-w-[1600px] mx-auto">
                            <TabsContent value="assets" className="m-0 space-y-8 animate-in fade-in duration-500">
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

                            <TabsContent value="video" className="m-0 animate-in fade-in duration-500">
                                <VideoLabModule productId={productId} productTitle={productTitle} allProducts={allProducts} />
                            </TabsContent>

                            <TabsContent value="copy" className="m-0 animate-in fade-in duration-500">
                                <CopyHubModule productId={productId} productTitle={productTitle} />
                            </TabsContent>

                            <TabsContent value="adspy" className="m-0 animate-in fade-in duration-500">
                                <AdSpyModule />
                            </TabsContent>

                            <TabsContent value="landings" className="m-0 animate-in fade-in duration-500">
                                <LandingLabModule productId={productId} productTitle={productTitle} />
                            </TabsContent>

                            <TabsContent value="avatars" className="m-0 animate-in fade-in duration-500">
                                <AvatarsLabModule />
                            </TabsContent>

                            <TabsContent value="performance" className="m-0 animate-in fade-in duration-500">
                                <PerformanceModule />
                            </TabsContent>

                            <TabsContent value="clowdbot" className="m-0 animate-in fade-in duration-500">
                                <ClowdbotLabModule />
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
