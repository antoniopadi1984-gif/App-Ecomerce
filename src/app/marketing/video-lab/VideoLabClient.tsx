"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";

const MaestroWorkspace = dynamic(() => import("./MaestroWorkspace"), { ssr: false });

export default function VideoLabClient({ initialProducts }: { initialProducts: any[] }) {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen bg-slate-950">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-4 border-rose-600 border-t-transparent animate-spin" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-rose-400 italic">Cargando Video Lab Maestro...</p>
                </div>
            </div>
        }>
            <MaestroWorkspace initialProducts={initialProducts} />
        </Suspense>
    );
}
