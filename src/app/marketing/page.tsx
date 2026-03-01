'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store/store-context';
import { useProduct } from '@/context/ProductContext';
import { Target, Facebook, Activity, Shield, Eye, Zap, AlertCircle } from 'lucide-react';
import { AgentCompanion } from '@/components/layout/agent-companion';

const TABS = [
    { id: 'FB_ADS', label: 'Facebook Ads', icon: Facebook },
    { id: 'PERFORMANCE', label: 'Performance', icon: Activity },
    { id: 'MODERACION', label: 'Moderación', icon: Shield },
    { id: 'AD_SPY', label: 'Ad Spy (Biblioteca)', icon: Eye },
    { id: 'MVP_WIZARD', label: 'MVP Wizard', icon: Zap },
];

function PillTab({ active, label, icon: Icon, set }: { active: boolean; label: string; icon: any; set: () => void }) {
    return (
        <button
            onClick={set}
            className={`module-tab flex items-center gap-1.5 ${active ? 'active' : ''}`}
            style={active ? { '--tab-color': 'var(--mkt)' } as any : {}}
        >
            <Icon size={14} className={active ? '' : 'text-[var(--text-dim)]'} />
            {label}
        </button>
    );
}

// ─── PÁGINA PRINCIPAL /marketing ──────────────────────────────────
export default function MarketingPage() {
    const { activeStoreId } = useStore();
    const { productId } = useProduct();
    const [activeTab, setActiveTab] = useState(TABS[0].id);

    const contextForAgent = `Marketing. Viendo pestaña ${activeTab}. Tienda: ${activeStoreId}. Producto filtrado: ${productId}`;

    return (
        <div className="content-main flex flex-col gap-4 pt-0 h-full">
            <div className="flex justify-between items-center py-2 mt-2">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded shrink-0 bg-[#EF4444] flex items-center justify-center text-white shadow-sm">
                        <Target size={18} />
                    </div>
                    <div>
                        <h1 className="text-[14px] font-[800] leading-none text-[var(--text)] tracking-tight">Marketing</h1>
                        <p className="text-[10px] text-[var(--text-muted)] mt-0.5 max-w-sm uppercase tracking-wide">
                            Facebook Ads, MVP Spying y Moderación
                        </p>
                    </div>
                </div>
            </div>

            <div className="module-tabs overflow-x-auto no-scrollbar max-w-full ds-card px-1 py-1 flex-nowrap shrink-0">
                {TABS.map(t => (
                    <PillTab key={t.id} active={activeTab === t.id} label={t.label} icon={t.icon} set={() => setActiveTab(t.id)} />
                ))}
            </div>

            {!activeStoreId ? (
                <div className="text-center p-8 text-[11px] font-semibold text-[var(--text-dim)] ds-card">
                    Selecciona una tienda en el selector superior (TopBar).
                </div>
            ) : (
                <div className="flex-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="h-[500px] flex flex-col items-center justify-center text-center p-8 ds-card text-[var(--text-muted)] border-dashed border-2 bg-transparent">
                        <Target size={32} className="mb-2 opacity-50 text-[var(--mkt)]" />
                        <h3 className="text-[14px] font-[800] text-[var(--text)] mb-1">Módulo Marketing: {TABS.find(t => t.id === activeTab)?.label}</h3>
                        <p className="text-[11px] max-w-md">Estructura preparada. A la espera de la integración completa de la Graph API de Meta para Ads Manager, Tracking Performance granular, y el MVP Testing Wizard.</p>
                    </div>
                </div>
            )}

            {/* Agente Compañante Inyectado, pide el role media-buyer */}
            <AgentCompanion pageContext={contextForAgent} agentRole="media_buying" />
        </div>
    );
}
