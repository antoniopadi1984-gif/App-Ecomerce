"use client";

import React from "react";
import { ModuleCard } from "./ModuleCard";
import {
    Search,
    UserSquare,
    Target,
    Database,
    ScanFace,
    Megaphone,
    CheckCircle2,
    ShieldCheck,
    MessageSquare
} from "lucide-react";

interface ResearchModuleGridProps {
    researchData: any;
    onModuleClick: (moduleId: string, title: string, data: any) => void;
}

export function ResearchModuleGrid({ researchData, onModuleClick }: ResearchModuleGridProps) {
    if (!researchData) return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 opacity-30 pointer-events-none grayscale">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="h-[220px] rounded-2xl bg-slate-100 border border-slate-200" />
            ))}
        </div>
    );

    const modules = [
        {
            id: 'product_core',
            title: 'Product DNA (Forense)',
            icon: <Database className="w-6 h-6" />,
            status: researchData.product_core ? 'CONFIRMADO' : 'PENDIENTE',
            content: researchData.dna_forense?.mecanismo_real || researchData.product_core?.identity?.definition || "Identidad del producto y mecanismo único de solución.",
            evidenceCount: researchData.market_validation?.sources_count || 0,
            badges: ["PHASE 1", "UNIQUE MECHANISM"]
        },
        {
            id: 'v3_desires',
            title: 'Mercado & Física de Deseo',
            icon: <Search className="w-6 h-6" />,
            status: researchData.v3_desires ? 'CONFIRMADO' : 'PENDIENTE',
            content: researchData.v3_desires?.primary_emotional_hook || "Análisis de madurez del mercado y nivel de consciencia del cliente.",
            evidenceCount: researchData.v3_desires?.desires?.length || 0,
            badges: ["PHASE 2", "MASS DESIRE"]
        },
        {
            id: 'v3_avatars',
            title: 'Avatar Matrix (Macro)',
            icon: <UserSquare className="w-6 h-6" />,
            status: researchData.v3_avatars ? 'CONFIRMADO' : 'PENDIENTE',
            content: researchData.v3_avatars?.[0]?.name ? `Primer Avatar: ${researchData.v3_avatars[0].name}` : "Perfil psicográfico detallado del cliente ideal.",
            evidenceCount: researchData.v3_avatars?.length || 0,
            badges: ['PHASE 3']
        },
        {
            id: 'voc',
            title: 'Voice of Customer (V4)',
            icon: <MessageSquare />,
            status: researchData?.status === 'READY' ? 'CONFIRMADO' : 'PENDIENTE',
            evidenceCount: 24,
            badges: ['PHASE 3']
        },
        {
            id: 'intel',
            title: 'Intel & Verdad Científica',
            icon: <ShieldCheck />,
            status: researchData?.status === 'READY' ? 'CONFIRMADO' : 'PENDIENTE',
            evidenceCount: 6,
            badges: ['PHASE 4']
        },
        {
            id: 'angles',
            title: 'Ingeniería de Ángulos (LF8)',
            icon: <Target />,
            status: researchData?.status === 'READY' ? 'CONFIRMADO' : 'PENDIENTE',
            evidenceCount: 10,
            badges: ['PHASE 5']
        },
        {
            id: 'offer',
            title: 'Estrategia de Oferta V4',
            icon: <Megaphone />,
            status: researchData?.status === 'READY' ? 'CONFIRMADO' : 'PENDIENTE',
            evidenceCount: 4,
            badges: ['PHASE 6']
        },
        {
            id: 'copy',
            title: 'God-Tier Copy Library',
            icon: <CheckCircle2 />,
            status: researchData?.status === 'READY' ? 'CONFIRMADO' : 'PENDIENTE',
            evidenceCount: 18,
            badges: ['AI READY']
        }
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {modules.map((module) => (
                <ModuleCard
                    key={module.id}
                    title={module.title}
                    icon={module.icon}
                    status={module.status}
                    evidenceCount={module.evidenceCount}
                    badges={module.badges}
                    onClick={() => onModuleClick(module.id, module.title, researchData[module.id] || researchData)}
                />
            ))}
        </div>
    );
}
