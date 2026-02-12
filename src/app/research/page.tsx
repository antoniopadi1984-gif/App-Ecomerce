"use client";

import React, { useState } from "react";
import { useProduct } from "@/context/ProductContext";
import { useResearch } from "@/hooks/useResearch";
import { useSearchParams } from "next/navigation";
import { ResearchHeader } from "@/components/research/ResearchHeader";

import { IntelligenceSources } from "@/components/research/IntelligenceSources";
import { ResearchModuleGrid } from "@/components/research/ResearchModuleGrid";
import { CreativeIterationLab } from "@/components/research/CreativeIterationLab";
import { StructuredDataViewer } from "@/components/research/StructuredDataViewer";
import { ResearchMaturityScore } from "@/components/research/ResearchMaturityScore";
import { ResearchBrainGraph } from "@/components/research/ResearchBrainGraph";
import {
    XCircle,
    Loader2,
    AlertCircle,
    ArrowRight,
    Microscope,
    Target,
    Users,
    FileText,
    Search,
    TrendingUp,
    Sparkles,
    Globe
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { t } from "@/lib/constants/translations";
import { ds } from "@/lib/styles/design-system";
import AdSpyPage from "@/app/marketing/ad-spy/page";

// Supporting Component
function ResearchPlaceholder({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-40 select-none text-center animate-in fade-in duration-700">
            <div className="h-24 w-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                <Icon className="h-12 w-12 text-slate-200" />
            </div>
            <h3 className="text-xl font-black text-slate-400 gap-2 uppercase tracking-[0.2em] mb-2 font-bold italic">{title}</h3>
            <p className="text-xs font-bold text-slate-400 max-w-xs uppercase tracking-tighter leading-loose italic">{description}</p>
        </div>
    );
}

export default function ProductResearchPage() {
    const { productId, product, allProducts } = useProduct();

    const {
        researchData,
        loading,
        progress,
        isSystemHealthOk,
        startResearch,
        syncDrive,
        addAmazon,
        addCompetitor,
        deleteCompetitor,
        exportMasterDoc,
        clearHistory,
        generateAngles,
        generateGodTierCopy,
        regenerateAvatars,
        generateAngleVariations,
        generateCopyVariations,
        syncBrain
    } = useResearch(productId || "");

    const searchParams = useSearchParams();
    const tabParam = searchParams?.get("tab");

    const [amazonUrlInput, setAmazonUrlInput] = useState("");
    const [competitorUrlInput, setCompetitorUrlInput] = useState("");
    const [selectedModule, setSelectedModule] = useState<{ id: string, title: string, data: any } | null>(null);
    const [activeTab, setActiveTab] = useState(tabParam || "avatars");

    // Sync tab with URL if it changes externally
    React.useEffect(() => {
        if (tabParam) setActiveTab(tabParam);
    }, [tabParam]);


    if (!productId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center animate-in fade-in duration-700">
                <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center">
                    <AlertCircle className="w-10 h-10 text-indigo-500" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight italic uppercase">Contexto Requerido</h2>
                    <p className="text-slate-500 max-w-sm mx-auto font-medium">Por favor, selecciona un producto en el menú lateral para acceder al Research Lab.</p>
                </div>
            </div>
        );
    }

    const handleAddAmazon = async () => {
        if (!amazonUrlInput) return;
        await addAmazon(amazonUrlInput);
        setAmazonUrlInput("");
    };

    const handleAddCompetitor = async () => {
        if (!competitorUrlInput) return;
        await addCompetitor(competitorUrlInput);
        setCompetitorUrlInput("");
    };

    return (
        <div className="flex flex-col gap-4 pb-12">
            <div className="bg-white rounded-3xl border border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm mb-4">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-100/50">
                        <Microscope className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-sm font-black text-slate-900 uppercase tracking-tighter leading-none">Research Lab</h1>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Intelligence Hub & Market Forensic</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                        <div className="w-6 h-6 rounded-full bg-emerald-50 border-2 border-white flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        </div>
                        <div className="w-6 h-6 rounded-full bg-blue-50 border-2 border-white flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        </div>
                    </div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Engine Online</span>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col min-h-0">
                <div className="px-1 py-1 bg-white border border-slate-200 rounded-2xl mb-4 shadow-sm inline-flex overflow-x-auto no-scrollbar max-w-full">
                    <TabsList className="bg-transparent h-9 gap-1">
                        <TabsTrigger value="avatars" className="rounded-xl px-4 py-1.5 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all whitespace-nowrap">
                            <Users className="w-3.5 h-3.5 mr-2" />
                            Avatar / Target
                        </TabsTrigger>
                        <TabsTrigger value="trends" className="rounded-xl px-4 py-1.5 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all whitespace-nowrap">
                            <TrendingUp className="w-3.5 h-3.5 mr-2" />
                            Market Trends
                        </TabsTrigger>
                        <TabsTrigger value="adspy" className="rounded-xl px-4 py-1.5 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all whitespace-nowrap">
                            <Search className="w-3.5 h-3.5 mr-2" />
                            Ads Spy
                        </TabsTrigger>
                        <TabsTrigger value="angles" className="rounded-xl px-4 py-1.5 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all whitespace-nowrap">
                            <Sparkles className="w-3.5 h-3.5 mr-2" />
                            Análisis IA Angulo
                        </TabsTrigger>
                        <TabsTrigger value="forensic" className="rounded-xl px-4 py-1.5 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all whitespace-nowrap">
                            <Microscope className="w-3.5 h-3.5 mr-2" />
                            Forense
                        </TabsTrigger>
                        <TabsTrigger value="validation" className="rounded-xl px-4 py-1.5 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all whitespace-nowrap">
                            <FileText className="w-3.5 h-3.5 mr-2" />
                            Validation
                        </TabsTrigger>
                    </TabsList>

                </div>

                <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden relative flex flex-col min-h-0">
                    <ScrollArea className="flex-1">
                        <div className="p-8">
                            <TabsContent value="avatars" className="m-0 space-y-6 animate-in fade-in duration-500">
                                {researchData?.status === "READY" ? (
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-xl font-black uppercase tracking-tighter text-slate-900">Avatar Matrix</h3>
                                            <Badge className="bg-emerald-100 text-emerald-700 font-black border-none px-3 uppercase text-[9px]">IA Analyzed</Badge>
                                        </div>
                                        <StructuredDataViewer
                                            data={researchData.v3_avatars || researchData.avatars}
                                            handleGenerateAngles={generateAngles}
                                            handleGenerateV3Copy={async () => { }}
                                            handleGenerateGodTierCopy={generateGodTierCopy}
                                            setSelectedResearch={() => { }}
                                        />
                                    </div>
                                ) : (
                                    <ResearchPlaceholder icon={Users} title="Perfil de Avatares" description="Inicia la investigación para mapear a tu comprador ideal..." />
                                )}
                            </TabsContent>

                            <TabsContent value="trends" className="m-0 space-y-6 animate-in fade-in duration-500">
                                {researchData?.status === "READY" ? (
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-xl font-black uppercase tracking-tighter text-slate-900">Competition & Market Insights</h3>
                                            <div className="flex gap-2">
                                                <Badge className="bg-indigo-100 text-indigo-700 font-black border-none px-3 uppercase text-[9px]">Forensic Hub</Badge>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 gap-6">
                                            <StructuredDataViewer
                                                data={researchData.breakthrough_advertising}
                                                handleGenerateAngles={generateAngles}
                                                handleGenerateV3Copy={async () => { }}
                                                handleGenerateGodTierCopy={generateGodTierCopy}
                                                setSelectedResearch={() => { }}
                                            />
                                            <StructuredDataViewer
                                                data={researchData.competitor_intel}
                                                handleGenerateAngles={generateAngles}
                                                handleGenerateV3Copy={async () => { }}
                                                handleGenerateGodTierCopy={generateGodTierCopy}
                                                setSelectedResearch={() => { }}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <ResearchPlaceholder icon={TrendingUp} title="Market Trends" description="Analizando las corrientes del mercado y la competencia..." />
                                )}
                            </TabsContent>

                            <TabsContent value="adspy" className="m-0 -m-8 min-h-[800px] animate-in fade-in duration-500">
                                <AdSpyPage />
                            </TabsContent>

                            <TabsContent value="angles" className="m-0 space-y-6 animate-in fade-in duration-500">
                                {researchData?.status === "READY" ? (
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-xl font-black uppercase tracking-tighter text-slate-900">IA Angle Generation</h3>
                                            <Button onClick={() => generateAngles("")} variant="outline" className="h-8 text-[9px] font-black uppercase tracking-widest rounded-xl">Regenerar Ángulos</Button>
                                        </div>
                                        <CreativeIterationLab
                                            productId={productId}
                                            onRegenerateAvatars={regenerateAvatars}
                                            onGenerateAngleVariations={generateAngleVariations}
                                            onGenerateCopyVariations={generateCopyVariations}
                                            onGenerateGodTierCopy={generateGodTierCopy}
                                            isLoading={loading}
                                        />
                                    </div>
                                ) : (
                                    <ResearchPlaceholder icon={Sparkles} title="IA Angle Analysis" description="Generador de ángulos de venta psicológicos..." />
                                )}
                            </TabsContent>

                            <TabsContent value="forensic" className="m-0 space-y-6 animate-in fade-in duration-500">
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between px-1">
                                        <h2 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em]">Forensic Modules</h2>
                                        <Badge variant="secondary" className="h-4 text-[7px] bg-slate-100 text-slate-400 border-none font-black px-1.5">LIVE</Badge>
                                    </div>
                                    <ResearchModuleGrid
                                        researchData={researchData}
                                        onModuleClick={(id, title, data) => setSelectedModule({ id, title, data })}
                                    />

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <ResearchHeader
                                            status={researchData?.status || "PENDING"}
                                            isSystemHealthOk={isSystemHealthOk}
                                            onStartResearch={startResearch}
                                            onExportMasterDoc={exportMasterDoc}
                                            onClearHistory={clearHistory}
                                            isResearching={loading && progress.percent < 100}
                                            activeVersionId={researchData?.researchProjects?.[0]?.versions?.[0]?.id}
                                        />
                                        <IntelligenceSources
                                            amazonUrl={amazonUrlInput}
                                            setAmazonUrl={setAmazonUrlInput}
                                            onAddAmazon={handleAddAmazon}
                                            competitorLinks={researchData?.competitorLinks || []}
                                            newCompetitorUrl={competitorUrlInput}
                                            setNewCompetitorUrl={setCompetitorUrlInput}
                                            onAddCompetitor={handleAddCompetitor}
                                            onDeleteCompetitor={deleteCompetitor}
                                            onSyncDrive={syncDrive}
                                            isSyncing={loading && progress.message.includes("Sincronizando")}
                                            driveFolderId={researchData?.driveDocId}
                                        />
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="validation" className="m-0 space-y-6 animate-in fade-in duration-500">
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xl font-black uppercase tracking-tighter text-slate-900">Validation & Analysis Report</h3>
                                        <Badge className="bg-amber-100 text-amber-700 font-black border-none px-3 uppercase text-[9px]">Critical Review</Badge>
                                    </div>
                                    {researchData?.validation_report ? (
                                        <StructuredDataViewer
                                            data={researchData.validation_report}
                                            handleGenerateAngles={generateAngles}
                                            handleGenerateV3Copy={async () => { }}
                                            handleGenerateGodTierCopy={generateGodTierCopy}
                                            setSelectedResearch={() => { }}
                                        />
                                    ) : (
                                        <ResearchPlaceholder icon={FileText} title="Validation Report" description="El reporte de validación se generará al finalizar la fase forense..." />
                                    )}
                                </div>
                            </TabsContent>
                        </div>
                    </ScrollArea>
                </div>
            </Tabs>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/60 backdrop-blur-md p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-4 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-600" /> Validation Report (Footer)
                    </h3>
                    {researchData?.validation_report ? (
                        <StructuredDataViewer
                            data={researchData.validation_report}
                            handleGenerateAngles={generateAngles}
                            handleGenerateV3Copy={async () => { }}
                            handleGenerateGodTierCopy={generateGodTierCopy}
                            setSelectedResearch={() => { }}
                        />
                    ) : (
                        <p className="text-[10px] text-slate-400 italic">No hay reporte de validación disponible aún.</p>
                    )}
                </div>
                <div className="bg-white/60 backdrop-blur-sm p-8 rounded-[2rem] border border-slate-100 flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center mb-4">
                        <Search className="w-6 h-6" />
                    </div>
                    <h4 className="text-xs font-black uppercase tracking-widest mb-2">Google Drive Hub</h4>
                    <p className="text-[10px] text-slate-500 mb-6 max-w-[200px]">Accede a todos los documentos técnicos y creativos en la nube.</p>
                    {researchData?.driveDocId ? (
                        <Button
                            onClick={() => window.open(`https://drive.google.com/drive/folders/${researchData.driveDocId}`, '_blank')}
                            className="h-8 px-6 bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] font-black uppercase tracking-widest rounded-lg"
                        >
                            Abrir Carpeta Drive
                        </Button>
                    ) : (
                        <Button variant="outline" disabled className="h-8 px-6 text-[9px] font-black uppercase tracking-widest rounded-lg">
                            Drive No Sincronizado
                        </Button>
                    )}
                </div>
            </div>

            {selectedModule && (
                <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-100">
                        <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h3 className="text-[12px] font-black text-slate-900 uppercase tracking-widest italic">{selectedModule.title}</h3>
                                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Forensic Analysis • {t('view_details')}</p>
                            </div>
                            <button
                                onClick={() => setSelectedModule(null)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-all text-slate-400 hover:text-slate-900"
                            >
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>
                        <ScrollArea className="flex-1 p-6">
                            <StructuredDataViewer
                                data={selectedModule.data}
                                handleGenerateAngles={generateAngles}
                                handleGenerateV3Copy={async () => { }}
                                handleGenerateGodTierCopy={generateGodTierCopy}
                                setSelectedResearch={() => { }}
                            />
                        </ScrollArea>
                        <div className="px-6 py-3 bg-slate-50/50 border-t border-slate-100 flex justify-end">
                            <button
                                onClick={() => setSelectedModule(null)}
                                className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-black transition-colors"
                            >
                                {t('close_window')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

