"use client";

import React from "react";
import { ResearchHeader } from "@/components/research/ResearchHeader";
import { ResearchConfig } from "@/components/research/ResearchConfig";
import { useResearch } from "@/hooks/useResearch";
import { useProduct } from "@/context/ProductContext";
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
                <div className="mb-8">
                    <h2 className="text-xl font-black text-slate-900 tracking-tight italic uppercase">Configuración Adaptativa</h2>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Define el motor de inteligencia God-Tier</p>
                </div>

                <ResearchConfig />
            </div>
        </div>
    );
}
