'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store/store-context';
import { useProduct } from '@/context/ProductContext';
import { VideoLabTab } from '@/components/creativo/VideoLabTab';
import { VoicesTab } from '@/components/creativo/VoicesTab';
import { AgentPanel } from '@/components/AgentPanel';
import dynamic from 'next/dynamic';

const VideoStudioTab = dynamic(
  () => import('@/components/creativo/VideoStudioTab').then(m => ({ default: m.VideoStudioTab })),
  { ssr: false }
);

type Tab = 'lab' | 'studio' | 'voices';

export default function VideoLabPage() {
    const { activeStoreId: storeId } = useStore();
    const { productId } = useProduct();
    const [tab, setTab] = useState<Tab>('lab');
    const [selectedVoiceId, setSelectedVoiceId] = useState('');
    const [voiceSettings, setVoiceSettings] = useState<any>({});

    if (!storeId || !productId || productId === 'GLOBAL') return null;

    const tabs = [
        { id: 'lab' as Tab,    label: 'Laboratorio', emoji: '🎬' },
        { id: 'studio' as Tab, label: 'Estudio',     emoji: '🎭' },
        { id: 'voices' as Tab, label: 'Voces',       emoji: '🎙️' },
    ];

    return (
        <div className="flex flex-col h-[calc(100vh-140px)]">
            <div className="flex items-center gap-1 pb-3">
                {tabs.map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${tab === t.id ? 'bg-[var(--cre)] text-white shadow-sm' : 'bg-white border border-[var(--border)] text-[var(--text-tertiary)] hover:border-[var(--cre)]/30'}`}>
                        <span>{t.emoji}</span>
                        <span>{t.label}</span>
                    </button>
                ))}
                {selectedVoiceId && (
                    <span className="ml-auto text-[8px] text-[var(--cre)] font-black">🎙️ Voz activa</span>
                )}
            </div>

            <div className="flex-1 overflow-hidden">
                {tab === 'lab' && (
                    <>
                        <VideoLabTab storeId={storeId} productId={productId} />
                        <AgentPanel
                            specialistRole="video-intelligence"
                            specialistLabel="Video Intelligence"
                            accentColor="#FF6B2B"
                            storeId={storeId}
                            productId={productId}
                            moduleContext={{}}
                            specialistActions={[
                                { label: "Analizar hook", prompt: "Analiza el hook del último vídeo subido" },
                                { label: "5 variantes", prompt: "Genera 5 variantes de ángulos para el producto activo" },
                            ]}
                        />
                    </>
                )}
                {tab === 'studio' && (
                    <VideoStudioTab
                        storeId={storeId}
                        productId={productId}
                        voiceId={selectedVoiceId}
                        voiceSettings={voiceSettings}
                        onNeedVoice={() => setTab('voices')}
                    />
                )}
                {tab === 'voices' && (
                    <div className="h-full overflow-y-auto p-1">
                        <VoicesTab
                            storeId={storeId}
                            productId={productId}
                            selectedVoiceId={selectedVoiceId}
                            onVoiceSelect={(id, settings) => {
                                setSelectedVoiceId(id);
                                setVoiceSettings(settings);
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
