'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/lib/store/store-context';
import { useProduct } from '@/context/ProductContext';
import dynamic from 'next/dynamic';

const VideoLabTab = dynamic(() => import('@/components/creativo/VideoLabTab').then(m => ({ default: m.VideoLabTab })), { ssr: false });

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

    if (!storeId || !productId || productId === 'GLOBAL') return null;

    return <VideoLabTab storeId={storeId} productId={productId} marketLang={marketLang} />;
}
