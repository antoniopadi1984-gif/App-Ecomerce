"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LegacyFraudRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/pedidos");
    }, [router]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
            <div className="animate-pulse flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-full border-4 border-rose-600 border-t-transparent animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Redirigiendo a Fraud Control Unificado...</p>
            </div>
        </div>
    );
}
