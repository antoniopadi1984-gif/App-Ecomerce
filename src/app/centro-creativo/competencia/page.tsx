'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store/store-context';
import { useProduct } from '@/context/ProductContext';
import dynamic from 'next/dynamic';

const CompetenciaTab = dynamic(() => import('@/components/creativo/CompetenciaTab').then(m => ({ default: m.CompetenciaTab })), { ssr: false });
const CompetenciaVozTab = dynamic(() => import('@/components/creativo/CompetenciaVozTab').then(m => ({ default: m.CompetenciaVozTab })), { ssr: false });

type Tab = 'spy' | 'voz';

export default function CompetenciaPage() {
    const { activeStoreId: storeId } = useStore();
    const { productId, product } = useProduct();
    const [tab, setTab] = useState<Tab>('spy');

    if (!storeId || !productId || productId === 'GLOBAL') return null;

    return (
        <div className="flex flex-col h-[calc(100vh-140px)]">
            <div className="flex items-center gap-1 pb-3">
                {[
                    { id: 'spy' as Tab,  label: 'Análisis & Spy',      emoji: '🕵️' },
                    { id: 'voz' as Tab,  label: 'Traducir & Nueva Voz', emoji: '🎙️' },
                ].map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${tab === t.id ? 'bg-[var(--cre)] text-white shadow-sm' : 'bg-white border border-[var(--border)] text-[var(--text-tertiary)] hover:border-[var(--cre)]/30'}`}>
                        <span>{t.emoji}</span><span>{t.label}</span>
                    </button>
                ))}
            </div>
            <div className="flex-1 overflow-hidden">
                {tab === 'spy' && <CompetenciaTab storeId={storeId} productId={productId} productSku={product?.handle || 'PROD'} />}
                {tab === 'voz' && <CompetenciaVozTab storeId={storeId} productId={productId} />}
            </div>
        </div>
    );
}
