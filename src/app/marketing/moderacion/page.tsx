"use client";
import React from "react";
import { useStore } from "@/lib/store/store-context";
import { useProduct } from "@/context/ProductContext";

export default function Page() {
    const { activeStoreId } = useStore();
    const { product } = useProduct();
    return (
        <div className="p-8 max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <span className="text-4xl">🛡️</span>
                <div>
                    <h1 className="text-2xl font-black text-slate-900">Moderación</h1>
                    <p className="text-slate-500 text-sm">Modera comentarios y respuestas de anuncios automáticamente con IA</p>
                </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                <p className="text-amber-800 text-sm font-medium">
                    Módulo en construcción — disponible en la próxima actualización.
                </p>
            </div>
        </div>
    );
}
