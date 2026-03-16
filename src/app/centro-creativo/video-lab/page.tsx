'use client';

import { AgentPanel } from "@/components/AgentPanel";
import React, { useState, useEffect } from 'react';
import { useStore } from '@/lib/store/store-context';
import { useProduct } from '@/context/ProductContext';

import { VideoLabTab } from '@/components/creativo/VideoLabTab';

export default function VideoLabPage() {
    const { activeStoreId: storeId } = useStore();
    const { productId } = useProduct();
    const [marketLang, setMarketLang] = useState('ES');

    useEffect(() => {
        if (!productId || productId === 'GLOBAL') { setMarketLang('ES'); return; }
        fetch(`/api/products/${productId}`)
            .then(r => r.json())
            .then(d => setMarketLang(d.product?.marketLanguage ?? 'ES'))
            .catch(() => { });
    }, [productId]);

    return (
        <>
            <VideoLabTab storeId={storeId || ''} productId={productId || ''} marketLang={marketLang} />
            <AgentPanel specialistRole="video-intelligence" specialistLabel="Video Intelligence" accentColor="#FF6B2B" storeId={storeId || ''} productId={productId} moduleContext={{}} specialistActions={[{label:"Analizar hook",prompt:"Analiza el hook del último vídeo subido"},{label:"5 variantes",prompt:"Genera 5 variantes de ángulos para el producto activo"},{label:"Qué concepto usar",prompt:"¿Qué concepto C1-C9 debería usar para fase fría?"}]} />
        </>
    );
}
