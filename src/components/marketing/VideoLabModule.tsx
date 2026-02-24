"use client";

import React from "react";
import MaestroWorkspace from "@/app/marketing/video-lab/MaestroWorkspace";

interface VideoLabModuleProps {
    productId: string;
    productTitle?: string;
    allProducts?: any[];
}

export function VideoLabModule({ productId, productTitle, allProducts = [] }: VideoLabModuleProps) {
    // Para la V4, usamos directamente MaestroWorkspace pero envuelto en el módulo del Hub
    return (
        <div className="bg-slate-50/30 -m-3 p-3 min-h-[800px] overflow-hidden backdrop-blur-sm">
            <MaestroWorkspace initialProducts={allProducts} />
        </div>
    );
}
