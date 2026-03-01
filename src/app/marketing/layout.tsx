'use client';

import React from 'react';
import { useStore } from '@/lib/store/store-context';
import { useProduct } from '@/context/ProductContext';
import { Target } from 'lucide-react';
import { AgentCompanion } from '@/components/layout/agent-companion';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
    const { activeStoreId } = useStore();
    const { productId } = useProduct();

    const contextForAgent = `Marketing. Tienda: ${activeStoreId}. Producto filtrado: ${productId}`;

    return (
        <div className="content-main flex flex-col gap-4 pt-0 h-full min-h-screen bg-[var(--bg)]">
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

            {!activeStoreId ? (
                <div className="text-center p-8 text-[11px] font-semibold text-[var(--text-dim)] ds-card">
                    Selecciona una tienda en el selector superior (TopBar).
                </div>
            ) : (
                <div className="flex-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {children}
                </div>
            )}

            <AgentCompanion pageContext={contextForAgent} agentRole="media_buying" />
        </div>
    );
}
