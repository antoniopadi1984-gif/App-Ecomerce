"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function RedirectToPedidos() {
    const router = useRouter();

    useEffect(() => {
        router.push("/pedidos");
    }, [router]);

    return (
        <div className="flex flex-col items-center justify-center min-vh-screen py-20 gap-4">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            <p className="text-sm font-black uppercase tracking-widest text-slate-400">Redireccionando al Command Center...</p>
        </div>
    );
}
