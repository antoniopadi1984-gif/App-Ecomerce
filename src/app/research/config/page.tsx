"use client";

import React from "react";
import { ResearchHeader } from "@/components/research/ResearchHeader";
import { ResearchConfig } from "@/components/research/ResearchConfig";
import { useResearch } from "@/hooks/useResearch";
import { useProduct } from "@/context/ProductContext";
import { PageShell } from "@/components/ui/PageShell";
import { AlertCircle } from "lucide-react";

export default function ResearchConfigPage() {
    const { productId } = useProduct();

    const {
        researchData,
        loading,
        progress,
        isSystemHealthOk,
        startResearch,
        exportMasterDoc,
        clearHistory
    } = useResearch(productId || "");

    return (
        <PageShell>
            <div className="space-y-6">
                <ResearchHeader
                    status={researchData?.status || "PENDING"}
                    isSystemHealthOk={isSystemHealthOk}
                    onStartResearch={startResearch}
                    onExportMasterDoc={exportMasterDoc}
                    onClearHistory={clearHistory}
                    isResearching={loading && progress.percent < 100}
                    activeVersionId={researchData?.researchProjects?.[0]?.versions?.[0]?.id}
                />
                <div className="px-4 pb-8">
                    <div className="mb-6">
                        <h2 className="text-sm font-black text-slate-900 tracking-tight italic uppercase">Configuración Adaptativa</h2>
                        <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mt-1">Define el motor de inteligencia God-Tier</p>
                    </div>

                    <ResearchConfig />
                </div>
            </div>
        </PageShell>
    );
}
