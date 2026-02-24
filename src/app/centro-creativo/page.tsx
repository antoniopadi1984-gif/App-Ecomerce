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
    Rocket,
    Zap,
    MessageSquare,
    Compass,
    RefreshCw,
    Settings,
    Brain,
    ShieldCheck,
    Target,
    Link2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CreativeFactoryPanel } from "@/components/creative/CreativeFactoryPanel";
import { LandingLabModule } from "@/components/marketing/LandingLabModule";
import { VideoLabModule } from "@/components/marketing/VideoLabModule";
import { AvatarsModule } from "@/components/marketing/AvatarsLabModule";
import { StaticAdsModule } from "@/components/marketing/StaticAdsModule";
import { BrandingModule } from "@/components/marketing/BrandingModule";
import { ResourcesModule } from "@/components/marketing/ResourcesModule";
import { AgencyControlPanel } from "@/components/creative/AgencyControlPanel";
import { CreativeHeader } from "@/components/creative/CreativeHeader";
import { AssetGrid } from "@/components/creative/AssetGrid";
import { AssetDetailModal } from "@/components/creative/AssetDetailModal";
import { useCreative } from "@/hooks/useCreative";
import { ds } from "@/lib/styles/design-system";
import { PageShell } from "@/components/ui/PageShell";
import { ModuleHeader } from "@/components/ui/ModuleHeader";
import Link from "next/link";
import { useStore } from "@/lib/store/store-context";

export default function CentroCreativoPage() {
    const { activeStoreId: storeId } = useStore();
    const { productId, product, allProducts } = useProduct();
    const [activeTab, setActiveTab] = useState("strategy");
    const [selectedAsset, setSelectedAsset] = useState<any>(null);
    const [isConnected, setIsConnected] = useState<boolean | null>(null);

    React.useEffect(() => {
        if (storeId) {
            fetch(`/api/connections/status?storeId=${storeId}&service=META_ADS`)
                .then(res => res.json())
                .then(data => setIsConnected(data.isConnected));
        }
    }, [storeId]);

    // We reuse logic from MarketingHub but presenting it with the new layout
    const { creativeData, loading, generating, generateVideos, performAction } = useCreative(productId || "");

    if (isConnected === false) {
        return (
            <PageShell>
                <ModuleHeader title="Centro Creativo" subtitle="Factoría Cognitiva" icon={Sparkles} />
                <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6 mt-6">
                    <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center">
                        <AlertCircle className="w-10 h-10 text-rose-500" />
                    </div>
                    <div className="space-y-2 text-center">
                        <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase italic">Meta Ads No Conectado</h2>
                        <p className="text-slate-500 max-w-sm mx-auto font-medium text-sm">Se requiere la integración con Meta Ads para generar creatividades optimizadas.</p>
                    </div>
                    <Link href="/connections">
                        <Button className="bg-rose-500 hover:bg-black text-white font-black text-[10px] uppercase tracking-widest h-10 px-6 rounded-xl shadow-lg shadow-rose-500/20">
                            <Link2 className="w-4 h-4 mr-2" />
                            Vincular Meta
                        </Button>
                    </Link>
                </div>
            </PageShell>
        );
    }

    if (!productId) {
        return (
            <PageShell>
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center animate-in fade-in duration-700">
                    <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
                        <Sparkles className="w-8 h-8 text-indigo-500" />
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
        <PageShell loading={isConnected === null} loadingMessage="VERIFICANDO CONEXIÓN...">
            <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden">
                <ModuleHeader
                    title={`Centro Creativo / ${product?.title}`}
                    subtitle="Protocolo Unificado V4 • Investigación en Tiempo Real Activa"
                    icon={Brain}
                    badges={
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-none px-1.5 py-0 text-[7px] font-black uppercase tracking-widest">
                            89% Gancho Validado
                        </Badge>
                    }
                    actions={
                        <div className="flex items-center gap-4">
                            <div className="flex gap-1.5 items-center bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                                {["Respuesta Directa", "Ganchos de Alto CTR"].map(tag => (
                                    <span key={tag} className="text-slate-400 text-[7px] font-black uppercase tracking-widest border-r border-slate-200 last:border-none pr-2 last:pr-0">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <IntelligenceBadge icon={Target} value="Impulsivos" />
                                <IntelligenceBadge icon={Zap} value="Élite" />
                            </div>
                        </div>
                    }
                />

                {/* Navegación de Funcionalidades */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full bg-white border-b border-slate-200">
                    <div className="flex items-center justify-between h-10 px-4">
                        <TabsList className="bg-transparent h-8 gap-0">
                            {[
                                { value: 'strategy', icon: Target, label: 'ESTRATEGIA' },
                                { value: 'specialist', icon: Brain, label: 'AGENTE ESPECIALISTA' },
                                { value: 'static', icon: Grid3X3, label: 'ADS ESTÁTICOS' },
                                { value: 'video', icon: Zap, label: 'SUPER VIDEO LAB' },
                                { value: 'resources', icon: BookOpen, label: 'RECURSOS' },
                                { value: 'library', icon: Clapperboard, label: 'BIBLIOTECA' },
                            ].map((t) => (
                                <TabsTrigger
                                    key={t.value}
                                    value={t.value}
                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-rose-500 data-[state=active]:bg-rose-500/5 px-4 h-10 text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 data-[state=active]:text-slate-900 transition-all min-w-[100px]"
                                >
                                    <t.icon className="w-3.5 h-3.5 mr-2 opacity-70" />
                                    {t.label}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </div>
                </Tabs>

                {/* Área de Trabajo Principal */}
                <div className="flex-1 overflow-hidden relative">
                    <Tabs value={activeTab} className="h-full flex flex-col">
                        <ScrollArea className="flex-1 h-full">
                            <div className="p-3">
                                <TabsContent value="strategy" className="m-0 focus-visible:ring-0">
                                    <BrandingModule />
                                </TabsContent>
                                <TabsContent value="specialist" className="m-0 focus-visible:ring-0">
                                    <LandingLabModule productId={productId} productTitle={product?.title} />
                                </TabsContent>
                                <TabsContent value="static" className="m-0 focus-visible:ring-0">
                                    <StaticAdsModule productId={productId} productTitle={product?.title} />
                                </TabsContent>
                                <TabsContent value="video" className="m-0 focus-visible:ring-0">
                                    <VideoLabModule productId={productId} productTitle={product?.title} allProducts={allProducts} />
                                </TabsContent>
                                <TabsContent value="resources" className="m-0 focus-visible:ring-0">
                                    <ResourcesModule />
                                </TabsContent>
                                <TabsContent value="library" className="m-0 focus-visible:ring-0 space-y-4">
                                    <div className="max-w-[1400px] mx-auto space-y-4">
                                        <CreativeHeader
                                            stats={creativeData?.stats || { totalSpend: 0, totalRevenue: 0, avgCtr: 0, count: 0 }}
                                            onGenerate={() => generateVideos({ maxVideos: 3 })}
                                            onUpload={() => { }}
                                            isGenerating={generating}
                                        />
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-4">
                                                <h2 className="text-lg font-black text-slate-900 uppercase tracking-tighter italic">Biblioteca de Activos</h2>
                                                <Badge className="bg-rose-500/10 text-rose-600 text-[8px] font-black rounded-lg uppercase px-2.5 py-1 border border-rose-500/20">
                                                    {creativeData?.assets?.length || 0} Archivos
                                                </Badge>
                                            </div>
                                            <AssetGrid assets={creativeData?.assets || []} onAssetClick={setSelectedAsset} />
                                        </div>
                                    </div>
                                </TabsContent>
                            </div>
                        </ScrollArea>
                    </Tabs>

                    {/* Overlays */}
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
        <div className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 flex items-center gap-2 shadow-xs">
            <Icon className="w-3 h-3 text-rose-500" />
            <span className="text-[8px] font-black uppercase tracking-widest text-slate-600">{value}</span>
        </div>
    );
}
