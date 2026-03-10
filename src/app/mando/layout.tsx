'use client';

import React from 'react';
import { useStore } from '@/lib/store/store-context';
import { LayoutDashboard } from 'lucide-react';
import { AgentCompanion } from '@/components/layout/agent-companion';

function MandoLayoutInner({ children }: { children: React.ReactNode }) {
    const { activeStoreId } = useStore();
    const contextForAgent = `Centro de Mando. Tienda: ${activeStoreId}`;

    return (
        <div className="content-main flex flex-col gap-2 pt-0 h-full min-h-screen bg-[var(--bg)]">
            <div className="flex justify-between items-center py-1 mt-1">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded shrink-0 bg-[#6366F1] flex items-center justify-center text-white shadow-sm">
                        <LayoutDashboard size={18} />
                    </div>
                    <div>
                        <h1 className="text-[14px] font-[800] leading-none text-[var(--text)] tracking-tight">Centro de Mando</h1>
                        <p className="text-[10px] text-[var(--text-muted)] mt-0.5 max-w-sm uppercase tracking-wide">
                            Visión en tiempo real y Scorecard Ejecutivo
                        </p>
                    </div>
                </div>
            </div>
            {!activeStoreId ? (
                <div className="text-center p-8 text-[11px] font-semibold text-[var(--text-dim)] ds-card">
                    Selecciona una tienda en el selector superior (TopBar) para ver el mando.
                </div>
            ) : (
                <div className="flex-1 animate-in fade-in slide-in-from-bottom-2 duration-300">{children}</div>
            )}
            <AgentCompanion pageContext={contextForAgent} agentRole="mando" />
        </div>
    );
}

export default function MandoLayout({ children }: { children: React.ReactNode }) {
    return <MandoLayoutInner>{children}</MandoLayoutInner>;
}
