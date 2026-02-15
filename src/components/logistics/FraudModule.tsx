"use client";

import React from "react";
import { Shield } from "lucide-react";

interface FraudModuleProps {
    productId: string;
}

export function FraudModule({ productId }: FraudModuleProps) {
    return (
        <div className="space-y-4 animate-in fade-in duration-500">
            <div className="bg-white/50 backdrop-blur-sm p-4 rounded-lg border border-slate-100 shadow-xl shadow-slate-200/40">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-rose-600 flex items-center justify-center shadow-lg shadow-rose-100">
                        <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-slate-900 tracking-tight italic uppercase">Detección de Fraude</h1>
                        <p className="text-sm text-slate-500 font-medium">Protección & Verificación de Pedidos</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-center justify-center py-10 bg-white rounded-lg border border-slate-100 shadow-sm border-dashed">
                <p className="text-slate-400 font-black text-xs uppercase tracking-[0.3em]">Módulo en Desarrollo</p>
                <p className="text-slate-300 text-[10px] mt-2 italic">Próximamente: Scoring de Riesgo IA</p>
            </div>
        </div>
    );
}
