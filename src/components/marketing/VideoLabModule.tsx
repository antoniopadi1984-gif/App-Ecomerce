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
        <div className="bg-slate-900 -mx-8 -my-8 p-8 min-h-[800px] rounded-[3rem] overflow-hidden">
            <MaestroWorkspace initialProducts={allProducts} />
        </div>
    );
}
