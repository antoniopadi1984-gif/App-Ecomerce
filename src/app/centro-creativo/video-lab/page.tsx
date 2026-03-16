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

    return <VideoLabTab storeId={storeId || ''} productId={productId || ''} marketLang={marketLang} />;
}
