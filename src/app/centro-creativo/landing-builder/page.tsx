'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/context/StoreContext';
import { useProduct } from '@/context/ProductContext';
import dynamic from 'next/dynamic';

const LandingBuilderTab = dynamic(() => import('@/components/creativo/LandingBuilderTab').then(m => ({ default: m.LandingBuilderTab })), { ssr: false });

export default function LandingBuilderPage() {
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

    return <LandingBuilderTab storeId={storeId} productId={productId} marketLang={marketLang} />;
}
