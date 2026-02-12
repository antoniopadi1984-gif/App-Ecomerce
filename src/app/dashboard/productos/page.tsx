"use client";

import { useEffect } from "react";

export default function LegacyProductsRedirect() {
    useEffect(() => {
        window.location.href = "/productos";
    }, []);

    return (
        <div className="flex items-center justify-center min-h-screen bg-white">
            <div className="animate-pulse flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-full border-4 border-slate-900 border-t-transparent animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Redirigiendo a Productos...</p>
            </div>
        </div>
    );
}
