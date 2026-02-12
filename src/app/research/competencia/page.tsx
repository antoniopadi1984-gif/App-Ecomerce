"use client";

import React from "react";
import { useProduct } from "@/context/ProductContext";
import { Target, AlertCircle } from "lucide-react";
import { t } from "@/lib/constants/translations";

export default function CompetenciaPage() {
    const { productId, allProducts } = useProduct();

    if (!productId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center animate-in fade-in duration-700">
                <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center">
                    <AlertCircle className="w-10 h-10 text-indigo-500" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight italic uppercase">Contexto Requerido</h2>
                    <p className="text-slate-500 max-w-sm mx-auto font-medium">Por favor, selecciona un producto en el menú lateral para acceder al Análisis de Competencia.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="bg-white/50 backdrop-blur-sm p-8 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/40">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-[1.8rem] bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-100">
                        <Target className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight italic uppercase">Análisis de Competencia</h1>
                        <p className="text-slate-500 font-medium">Espionaje Ético & Benchmark V4</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[3rem] border border-slate-100 shadow-sm border-dashed">
                <p className="text-slate-400 font-black text-xs uppercase tracking-[0.3em]">Módulo en Desarrollo</p>
                <p className="text-slate-300 text-[10px] mt-2 italic">Próximamente: Integración con Ad Library & SimilarWeb</p>
            </div>
        </div>
    );
}
