'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/context/StoreContext';
import { useProduct } from '@/context/ProductContext';
import { Clapperboard } from 'lucide-react';
import { AgentCompanion } from '@/components/layout/agent-companion';

function CreativoLayoutInner({ children }: { children: React.ReactNode }) {
    const { activeStoreId } = useStore();
    const { productId } = useProduct();
    const [marketLang, setMarketLang] = useState('ES');

    useEffect(() => {
        if (!productId || productId === 'GLOBAL') { setMarketLang('ES'); return; }
        fetch(`/api/products/${productId}`)
            .then(r => r.json())
            .then(d => setMarketLang(d.product?.marketLanguage ?? 'ES'))
            .catch(() => { });
    }, [productId]);

    const contextForAgent = `Centro Creativo. Tienda: ${activeStoreId}. Producto: ${productId}. Mercado: ${marketLang}`;

    return (
        <div className="content-main flex flex-col gap-4 pt-0 h-full min-h-screen bg-[var(--bg)]">
            <div className="flex justify-between items-center py-2 mt-2">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg shrink-0 bg-[#F59E0B] flex items-center justify-center text-white shadow-sm">
                        <Clapperboard size={18} />
                    </div>
                    <div>
                        <h1 className="text-[14px] font-[800] leading-none text-[var(--text)] tracking-tight">Centro Creativo</h1>
                        <p className="text-[10px] text-[var(--text-muted)] mt-0.5 max-w-sm uppercase tracking-wide">
                            Producción masiva · Drive IA · Avatares IA · Landings
                        </p>
                    </div>
                </div>

                {marketLang !== 'ES' && activeStoreId && productId && productId !== 'GLOBAL' && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[var(--inv)]/10 border border-[var(--inv)]/20 rounded-lg text-[9px] font-black text-[var(--inv)]">
                        🌐 Mercado: <span className="font-black">{marketLang}</span>
                        <span className="text-[var(--text-dim)] ml-1">· Toggle ES disponible</span>
                    </div>
                )}
            </div>

            {!activeStoreId || !productId || productId === 'GLOBAL' ? (
                <div className="flex flex-col items-center justify-center py-24 text-center ds-card">
                    <div className="w-16 h-16 rounded-3xl bg-[var(--cre)]/5 flex items-center justify-center mb-4 border border-[var(--cre)]/10">
                        <Clapperboard className="w-8 h-8 text-[var(--cre)] opacity-60" />
                    </div>
                    <h2 className="text-[18px] font-black text-[var(--text)] tracking-tight">Selección de Activos</h2>
                    <p className="text-[11px] text-[var(--text-muted)] mt-2 max-w-[280px] leading-relaxed">
                        Selecciona tienda y producto en la barra superior para acceder al laboratorio de producción creativa y biblioteca de activos.
                    </p>
                    <div className="mt-8 flex items-center gap-2 text-[10px] font-black text-[var(--cre)] uppercase tracking-widest animate-pulse">
                        ↑ Usa el TopBar para comenzar
                    </div>
                </div>
            ) : (
                <div className="flex-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {children}
                </div>
            )}

            <AgentCompanion pageContext={contextForAgent} agentRole="centro-creativo" />
        </div>
    );
}

export default function CreativoLayout({ children }: { children: React.ReactNode }) {
    return <CreativoLayoutInner>{children}</CreativoLayoutInner>;
}
