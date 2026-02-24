"use client";

import React from "react";
import { useProduct } from "@/context/ProductContext";
import { Target, AlertCircle } from "lucide-react";
import { PageShell } from "@/components/ui/PageShell";
import { ModuleHeader } from "@/components/ui/ModuleHeader";
import { Badge } from "@/components/ui/badge";
import { t } from "@/lib/constants/translations";

export default function CompetenciaPage() {
    const { productId, allProducts } = useProduct();

    if (!productId) {
        return (
            <PageShell>
                <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center">
                        <AlertCircle className="w-6 h-6 text-slate-400" />
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-sm font-black text-slate-900 uppercase italic">Contexto Requerido</h2>
                        <p className="text-slate-400 text-[9px] uppercase tracking-widest font-bold">Selecciona un producto en el menú lateral.</p>
                    </div>
                </div>
            </PageShell>
        );
    }

    return (
        <PageShell>
            <ModuleHeader
                title="Competencia"
                subtitle="Benchmark & Market Analysis"
                icon={Target}
                badges={
                    <Badge variant="outline" className="bg-indigo-50 text-indigo-600 border-none font-black text-[7px] uppercase tracking-widest px-2 h-5 rounded-sm">V4.0</Badge>
                }
            />

            <main className="p-4">
                <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-slate-100 border-dashed">
                    <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] italic">Módulo en Desarrollo</p>
                    <p className="text-slate-300 text-[9px] mt-1 font-bold uppercase tracking-widest">Integración Ad Library & SimilarWeb</p>
                </div>
            </main>
        </PageShell>
    );
}
